// Extrai e limpa o conteúdo das páginas do WordPress antigo.
// Uso: node extrair.cjs <pasta-com-html-baixado> <saida.json>
//
// Roda uma vez (ou quando o conteúdo antigo mudar). O resultado é revisável
// em conteudo/paginas.json e é o que o gerar.cjs consome — o site novo não
// depende do WordPress estar no ar.

const { parse } = require("node-html-parser");
const fs = require("fs");
const path = require("path");

const ORIGEM = "https://www.niteroiense.org.br";

// Shortcodes que o WPBakery/plugins deixaram vazar como texto.
const RE_SHORTCODE =
  /\[\/?(?:vc_|wpforms|fts_|contact-form|mc4wp|mailpoet|caption|gallery|embed|tablepress|su_|form_id|recaptcha)[^\]]*\]/gi;

// Atributos que sobrevivem, por tag. Todo o resto sai (classes de tema,
// estilos inline, data-*, handlers). É a mesma regra de html-seguro do painel.
const ATRIBUTOS = {
  a: ["href", "target"],
  img: ["src", "alt", "width", "height"],
  iframe: ["src", "title", "allowfullscreen", "width", "height"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};
const ALINHAMENTOS = ["alignleft", "alignright", "aligncenter"];
const IFRAMES_OK = /youtube\.com|youtube-nocookie\.com|youtu\.be|issuu\.com|google\.com\/maps|vimeo\.com/i;
const TAGS_FORA = ["script", "style", "noscript", "form", "input", "button", "select", "textarea", "label", "svg"];
const TAGS_DESEMBRULHA = ["span", "font", "div", "section", "article", "center", "small", "big", "u"];

/** E-mail ofuscado pelo Cloudflare: o 1º byte é a chave do XOR. */
function decodificarCfEmail(hex) {
  const chave = parseInt(hex.slice(0, 2), 16);
  let s = "";
  for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ chave);
  return s;
}

function limpar(conteudoHtml) {
  const html = conteudoHtml.replace(RE_SHORTCODE, "");
  const raiz = parse(`<div id="raiz">${html}</div>`, { comment: false });
  const r = raiz.querySelector("#raiz");
  const assets = new Set();

  for (const t of TAGS_FORA) r.querySelectorAll(t).forEach(e => e.remove());
  r.querySelectorAll("[class*=mailpoet]").forEach(e => e.remove());

  // e-mails protegidos pelo Cloudflare
  r.querySelectorAll("a").forEach(a => {
    const href = a.getAttribute("href") || "";
    const m = href.match(/email-protection#([0-9a-f]+)/i);
    if (m) {
      const email = decodificarCfEmail(m[1]);
      a.setAttribute("href", "mailto:" + email);
      if (/\[email|protected\]/i.test(a.text)) a.set_content(email);
    }
  });
  r.querySelectorAll(".__cf_email__").forEach(s => {
    const hex = s.getAttribute("data-cfemail");
    if (hex) s.replaceWith(decodificarCfEmail(hex));
  });

  // imagens com lazy-load do LiteSpeed: a real está em data-src
  r.querySelectorAll("img").forEach(img => {
    const real = img.getAttribute("data-src") || img.getAttribute("src") || "";
    if (!real || real.startsWith("data:")) return img.remove();
    img.setAttribute("src", real);
    assets.add(real);
  });

  r.querySelectorAll("iframe").forEach(f => {
    const src = f.getAttribute("data-src") || f.getAttribute("src") || "";
    if (!IFRAMES_OK.test(src)) return f.remove();
    f.setAttribute("src", src);
  });

  // poda atributos
  r.querySelectorAll("*").forEach(el => {
    const tag = el.tagName.toLowerCase();
    const permitidos = ATRIBUTOS[tag] || [];
    const classe = el.getAttribute("class") || "";
    const alinhamento = ALINHAMENTOS.find(c => classe.split(/\s+/).includes(c));
    for (const nome of Object.keys(el.attributes)) {
      if (!permitidos.includes(nome)) el.removeAttribute(nome);
    }
    if (alinhamento && (tag === "img" || tag === "p" || tag === "figure")) el.setAttribute("class", alinhamento);
    if (tag === "img") el.setAttribute("loading", "lazy");
    if (tag === "iframe") el.setAttribute("loading", "lazy");
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      if (/\.(pdf|docx?|xlsx?|pptx?|zip|jpe?g|png|gif)(\?|$)/i.test(href) && href.includes("/wp-content/")) assets.add(href);
      if (/^https?:/.test(href) && !href.startsWith(ORIGEM)) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      } else el.removeAttribute("target");
    }
  });

  // desembrulha contêineres sem semântica (de dentro para fora)
  for (let volta = 0; volta < 6; volta++) {
    let mexeu = false;
    for (const t of TAGS_DESEMBRULHA) {
      r.querySelectorAll(t).forEach(e => { e.replaceWith(e.innerHTML); mexeu = true; });
    }
    if (!mexeu) break;
  }

  let saida = r.innerHTML
    .replace(/<p>(\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // segunda passada: um <p> pode ter ficado vazio depois de desembrulhar
  saida = saida.replace(/<p>(\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>/gi, "");
  return { html: saida, assets: [...assets] };
}

function main() {
  const [dir, out] = process.argv.slice(2);
  const paginas = {};
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith(".html")).sort()) {
    const doc = parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const c = doc.querySelector(".entry-content");
    const titulo = (doc.querySelector("h1") || { text: "" }).text.replace(/\s+/g, " ").trim();
    const desc = (doc.querySelector('meta[name="description"]') || { getAttribute: () => "" }).getAttribute("content") || "";
    const rota = "/" + f.replace(/\.html$/, "").replace(/__/g, "/") + "/";
    const bruto = c ? c.innerHTML : "";
    paginas[rota] = { titulo, descricao: desc.trim(), bruto_tamanho: bruto.length, ...limpar(bruto) };
  }
  fs.writeFileSync(out, JSON.stringify(paginas, null, 2));
  console.log(`${Object.keys(paginas).length} páginas → ${out}`);
}

if (require.main === module) main();
module.exports = { limpar, decodificarCfEmail };
