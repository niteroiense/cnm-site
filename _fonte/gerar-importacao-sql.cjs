// Gera o SQL que importa os posts migrados do WordPress para public.publicacoes.
// Uso: node gerar-importacao-sql.cjs <posts.json> <pasta-saida> [posts-por-arquivo]
//
// Roda uma vez. Depois da importação, o banco passa a ser a fonte dos posts
// (o gerador do site detecta via site_importacao_concluida()) e a diretoria
// edita qualquer post pelo painel. ON CONFLICT DO NOTHING: rodar de novo não
// sobrescreve o que a diretoria já tiver editado.

const fs = require("fs");
const path = require("path");

const [arq, saida, porArquivoArg] = process.argv.slice(2);
const porArquivo = Number(porArquivoArg || 40);
const posts = JSON.parse(fs.readFileSync(arq, "utf8"));

const DELIM = "$cnm_post$";
function texto(s) {
  if (s == null || s === "") return "NULL";
  if (String(s).includes(DELIM)) throw new Error("conteúdo contém o delimitador");
  return `${DELIM}${s}${DELIM}`;
}
function arr(xs) {
  return `ARRAY[${xs.map(x => `'${x.replace(/'/g, "''")}'`).join(",")}]::text[]`;
}

const linhas = [];
const problemas = [];
for (const [rota, p] of Object.entries(posts)) {
  const slug = rota.replace(/^\/|\/$/g, "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { problemas.push(slug); continue; }
  if (!p.titulo || !p.titulo.trim()) { problemas.push(`${slug} (sem título)`); continue; }
  const cats = [...new Set(p.categorias.map(c => c.slug))];
  linhas.push(`(${texto(slug)}, ${texto(p.titulo)}, ${texto(p.html)}, ${arr(cats)}, ${texto(p.capa)}, true, DATE '${p.data}', 'wordpress')`);
}
if (problemas.length) {
  console.error("posts com problema (nada foi gerado):", problemas.join(" "));
  process.exit(1);
}

fs.mkdirSync(saida, { recursive: true });
const partes = Math.ceil(linhas.length / porArquivo);
for (let i = 0; i < partes; i++) {
  const bloco = linhas.slice(i * porArquivo, (i + 1) * porArquivo);
  const nome = `17_importar_posts_parte${i + 1}de${partes}.sql`;
  const sql = `-- Importação dos posts do WordPress — parte ${i + 1} de ${partes} (${bloco.length} posts)
-- Gerado por cnm-site/_fonte/gerar-importacao-sql.cjs. Rodar DEPOIS do 16.
-- Idempotente: posts já existentes (mesmo slug) não são tocados.
INSERT INTO public.publicacoes (slug, titulo, conteudo, categorias, capa_url, publicado, publicado_em, origem)
VALUES
${bloco.join(",\n")}
ON CONFLICT (slug) DO NOTHING;

SELECT count(*) AS posts_importados FROM public.publicacoes WHERE origem = 'wordpress';
`;
  fs.writeFileSync(path.join(saida, nome), sql);
  console.log(`${nome}: ${bloco.length} posts, ${(Buffer.byteLength(sql) / 1024).toFixed(0)} KB`);
}
