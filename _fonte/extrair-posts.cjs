// Extrai posts, croquis e trilhas do WordPress antigo, com metadados.
// Uso: node extrair-posts.cjs <pasta-html> <tipo: post|croqui|trilha> <saida.json>
//
// Reaproveita a limpeza de extrair.cjs. Para os posts guarda também data,
// categorias e imagem de capa, que montam as listagens por categoria.

const { parse } = require("node-html-parser");
const fs = require("fs");
const path = require("path");
const { limpar } = require("./extrair.cjs");

function meta(html, prop) {
  const i = html.indexOf(`property="${prop}"`);
  if (i < 0) return "";
  const fim = html.indexOf(">", i);
  const m = html.slice(i, fim).match(/content="([^"]*)"/);
  return m ? m[1] : "";
}

function slugify(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Categorias pelas metas article:section (o tema não marca o <article>). */
function categorias(html) {
  const cats = [];
  let i = 0;
  while ((i = html.indexOf('property="article:section"', i)) >= 0) {
    const fim = html.indexOf(">", i);
    const m = html.slice(i, fim).match(/content="([^"]*)"/);
    if (m) cats.push({ slug: slugify(m[1].replace(/&amp;/g, "&")), nome: m[1] });
    i = fim;
  }
  return cats;
}

function main() {
  const [dir, tipo, out] = process.argv.slice(2);
  const itens = {};
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith(".html")).sort()) {
    const html = fs.readFileSync(path.join(dir, f), "utf8");
    const doc = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
    const c = doc.querySelector(".entry-content");
    const slug = f.replace(/\.html$/, "").split("__").pop();
    const prefixo = tipo === "post" ? "" : `/${tipo}`;
    const rota = `${prefixo}/${slug}/`;
    const titulo = (meta(html, "og:title") || (doc.querySelector("h1") || { text: slug }).text)
      .replace(/\s*[-–|]\s*Clube Niteroiense.*$/i, "").replace(/\s+/g, " ").trim();
    const limpo = limpar(c ? c.innerHTML : "");
    itens[rota] = {
      tipo, titulo,
      data: meta(html, "article:published_time").slice(0, 10),
      categorias: tipo === "post" ? categorias(html) : [],
      capa: meta(html, "og:image"),
      ...limpo,
    };
    if (itens[rota].capa) itens[rota].assets.push(itens[rota].capa);
  }
  fs.writeFileSync(out, JSON.stringify(itens, null, 1));
  const n = Object.keys(itens).length;
  const vazios = Object.entries(itens).filter(([, v]) => v.html.length < 40).map(([k]) => k);
  console.log(`${tipo}: ${n} itens → ${path.basename(out)} | sem conteúdo: ${vazios.length}`);
  if (tipo === "post") {
    const cont = {};
    Object.values(itens).forEach(v => (v.categorias.length ? v.categorias.map(c => c.slug) : ["(nenhuma)"]).forEach(c => cont[c] = (cont[c] || 0) + 1));
    console.log("  por categoria:", JSON.stringify(cont));
  }
  if (vazios.length) console.log("  vazios:", vazios.slice(0, 8).join(" "));
}

main();
