// Conteúdo dos posts a partir do feed RSS do WordPress antigo.
// Uso: node extrair-feed.cjs <posts.json>   (atualiza o arquivo no lugar)
//
// Por quê: no site antigo a página de cada post está quebrada — o tema mostra
// o catálogo da Biblioteca no lugar do texto (o texto só sobrevive na meta
// og:description). O feed /feed/?paged=N ainda entrega o content:encoded real,
// com todas as categorias. Data e capa continuam vindo das metas da página.

const fs = require("fs");
const { limpar } = require("./extrair.cjs");

const FEED = "https://www.niteroiense.org.br/feed/";

function slugify(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function decod(s) {
  return s.replace(/&#8211;/g, "–").replace(/&#8212;/g, "—").replace(/&#8217;/g, "’").replace(/&#8220;/g, "“").replace(/&#8221;/g, "”")
    .replace(/&#038;|&amp;/g, "&").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

async function pagina(n) {
  const r = await fetch(`${FEED}?paged=${n}`, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return [];
  const x = await r.text();
  return x.split("<item>").slice(1).map(it => {
    const pega = re => (it.match(re) || [, ""])[1];
    let html = pega(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    // rodapé automático do Yoast: "O post X apareceu primeiro em CNM"
    html = html.replace(/<p>\s*O post\s*<a[\s\S]*?apareceu primeiro em[\s\S]*?<\/p>\s*$/i, "");
    return {
      link: pega(/<link>([^<]*)<\/link>/),
      titulo: decod(pega(/<title>([^<]*)<\/title>/)),
      data: new Date(pega(/<pubDate>([^<]*)<\/pubDate>/)).toISOString().slice(0, 10),
      categorias: [...it.matchAll(/<category><!\[CDATA\[([^\]]*)\]\]><\/category>/g)].map(m => ({ slug: slugify(decod(m[1])), nome: decod(m[1]) })),
      html,
    };
  });
}

(async () => {
  const arq = process.argv[2];
  const posts = JSON.parse(fs.readFileSync(arq, "utf8"));
  const vistos = new Set();
  let n = 1, total = 0;
  for (;;) {
    const itens = await pagina(n);
    if (!itens.length) break;
    for (const it of itens) {
      const rota = new URL(it.link).pathname;
      vistos.add(rota);
      total++;
      const limpo = limpar(it.html);
      const antigo = posts[rota] || { tipo: "post", capa: "", assets: [] };
      posts[rota] = {
        ...antigo,
        tipo: "post",
        titulo: it.titulo,
        data: antigo.data || it.data,
        categorias: it.categorias,
        html: limpo.html,
        assets: [...new Set([...limpo.assets, ...(antigo.capa ? [antigo.capa] : [])])],
      };
    }
    n++;
    if (n > 60) break; // trava de segurança
  }
  const semFeed = Object.keys(posts).filter(r => !vistos.has(r));
  // posts que não vieram no feed ficam com o resumo da meta (melhor que o catálogo)
  for (const r of semFeed) posts[r].html = "";
  fs.writeFileSync(arq, JSON.stringify(posts, null, 1));
  const cont = {};
  Object.values(posts).forEach(p => p.categorias.forEach(c => cont[c.slug] = (cont[c.slug] || 0) + 1));
  console.log(`feed: ${n - 1} páginas, ${total} posts | sem feed: ${semFeed.length}`);
  console.log("categorias:", JSON.stringify(cont));
  if (semFeed.length) console.log("sem feed:", semFeed.slice(0, 10).join(" "));
  const curtos = Object.entries(posts).filter(([, p]) => p.html.length < 80).map(([r]) => r);
  console.log("conteúdo muito curto:", curtos.length, curtos.slice(0, 6).join(" "));
})();
