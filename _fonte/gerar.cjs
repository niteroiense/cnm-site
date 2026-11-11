// Gera as páginas internas do site a partir de conteudo/paginas.json.
// Uso (na raiz do cnm-site):  node _fonte/gerar.cjs
//
// - A arquitetura do site (menu, seções, ordem) está em SECOES e NAV, abaixo.
// - Cabeçalho e rodapé saem daqui para TODAS as páginas, inclusive a home
//   (entre os marcadores <!--CABECALHO--> e <!--RODAPE--> do index.html).
// - As URLs repetem as do WordPress antigo, para que nenhum link que já circula
//   quebre quando o domínio www for apontado para este site.

const fs = require("fs");
const path = require("path");
const { parse } = require("node-html-parser");

const RAIZ = path.resolve(__dirname, "..");
const CONTEUDO = require("./conteudo/paginas.json");
const PAINEL = "https://painel.niteroiense.org.br";
const WHATS = "https://wa.me/5521966634040";
const EMAIL = "cnm@niteroiense.org.br";
const INSTAGRAM = "https://www.instagram.com/clubeniteroiensedemontanhismo";
const FACEBOOK = "https://www.facebook.com/clubecnm";

// ---------------------------------------------------------------------------
// ARQUITETURA
// `fonte` = chave em paginas.json (padrão: a própria rota).
// `link`  = item de menu que aponta para fora da seção (não gera página).
// ---------------------------------------------------------------------------
const SECOES = [
  {
    id: "o-cnm", rota: "/o-cnm/", titulo: "O CNM",
    intro: "Fundado em 20 de novembro de 2004, o Clube Niteroiense de Montanhismo reúne praticantes de escalada, caminhada e montanhismo em Niterói. É filiado à FEEMERJ.",
    paginas: [
      { rota: "/o-cnm/historia-do-cnm/", titulo: "História do CNM", resumo: "Da primeira reunião, em março de 2003, à assembleia de fundação em novembro de 2004 — e o que veio depois." },
      { rota: "/o-cnm/diretoria/", titulo: "Diretoria", resumo: "Diretoria eleita, membros nomeados, conselho fiscal e representantes do clube." },
      { rota: "/o-cnm/guias-do-clube/", titulo: "Guias do Clube", resumo: "Os guias de trilha, escalada e ciclismo formados e reconhecidos pelo CNM." },
      { rota: "/o-cnm/estatuto/", titulo: "Estatuto", resumo: "O estatuto social que rege o funcionamento do clube." },
      { rota: "/o-cnm/cei/", titulo: "Centro Excursionista Icaraí", resumo: "A história do CEI, clube que antecedeu o montanhismo organizado em Niterói." },
      { rota: "/o-cnm/o-cnm-e-a-femerj/", titulo: "O CNM e a FEEMERJ", resumo: "A filiação do clube à federação estadual e os princípios éticos que seguimos." },
      { rota: "/termo-de-responsabilidade-e-assuncao-de-riscos/", titulo: "Termo de Responsabilidade", resumo: "O termo de assunção de riscos aplicado às atividades do clube." },
    ],
  },
  {
    id: "como-participar", rota: "/como-participar/", titulo: "Como participar",
    intro: "Não precisa ser sócio para conhecer o clube. Venha a uma reunião social, acompanhe a agenda e, quando quiser, associe-se.",
    paginas: [
      { link: "/#atividades", titulo: "Próximas atividades", resumo: "A agenda de trilhas, escaladas, pedais e cursos, atualizada pela diretoria." },
      { rota: "/como-participar/reuniao-social/", titulo: "Reunião Social", resumo: "Toda quinta-feira, das 19h30 às 22h, na sede do clube." },
      { link: `${PAINEL}/cadastro`, titulo: "Associe-se", resumo: "Faça seu cadastro no painel do sócio e escolha seu plano.", externo: true },
      { link: "/meio-ambiente/seja-um-voluntario/", titulo: "Seja um voluntário", resumo: "Participe dos mutirões ambientais, mesmo sem ser sócio." },
    ],
  },
  {
    id: "cursos", rota: "/cursos/", titulo: "Cursos",
    intro: "Cursos de formação para quem está começando e de atualização para quem já pratica. O CBE é homologado pela FEEMERJ.",
    paginas: [
      { rota: "/cursos/curso-basico-de-escalada/", titulo: "Curso Básico de Escalada", resumo: "CBE: 20 aulas, teóricas e práticas, com certificação da FEEMERJ." },
      { rota: "/cursos/curso-basico-de-montanhismo/", titulo: "Curso Básico de Montanhismo" },
      { rota: "/curso-basico-de-caminhada/", titulo: "Curso Básico de Caminhada" },
      { rota: "/cursos/curso-de-reciclagem/", titulo: "Curso de Reciclagem" },
      { rota: "/cursos/atendimento-pre-hospitalar/", titulo: "Atendimento Pré-Hospitalar" },
      { rota: "/cursos/treinamento-de-auto-resgate/", titulo: "Treinamento de Auto-Resgate" },
      {
        rota: "/cursos/lista-de-espera-cursos/", titulo: "Lista de espera",
        resumo: "Quer ser avisado da próxima turma? Fale com a diretoria.",
        extra: acao("Entrar na lista de espera",
          "Mande seu nome e o curso que te interessa — avisamos quando abrir a próxima turma.",
          [btnWhats("Avisar pelo WhatsApp", "Olá! Quero entrar na lista de espera dos cursos do CNM."), btnEmail("Enviar e-mail", "Lista de espera — cursos")]),
      },
    ],
  },
  {
    id: "publicacoes", rota: "/publicacoes/", titulo: "Publicações",
    intro: "Boletins, documentos oficiais e guias produzidos pelo clube ao longo dos anos.",
    paginas: [
      { rota: "/publicacoes/boletins-cnm/", titulo: "Boletins CNM", resumo: "O CNM Informa: as edições do boletim do clube." },
      { rota: "/publicacoes/documentos/", titulo: "Documentos", resumo: "Atas, demonstrativos financeiros e documentos institucionais." },
      { rota: "/publicacoes/guias-de-trilhas-e-escaladas/", titulo: "Guias de Trilhas e Escaladas", resumo: "Guias e croquis de trilhas e vias de escalada." },
    ],
  },
  {
    id: "meio-ambiente", rota: "/meio-ambiente/", titulo: "Meio Ambiente",
    intro: "Montanha preservada é montanha para quem vem depois. Conheça as ações ambientais do clube e como participar.",
    paginas: [
      { rota: "/meio-ambiente/campanha-semear/", titulo: "Campanha Semear" },
      { rota: "/meio-ambiente/minimo-impacto/", titulo: "Mínimo Impacto" },
      { rota: "/meio-ambiente/mutiroes/", titulo: "Mutirões" },
      {
        rota: "/meio-ambiente/seja-um-voluntario/", titulo: "Seja um Voluntário",
        resumo: "Não é sócio, mas quer ajudar nos mutirões? Deixe seu contato.",
        extra: acao("Quero ser voluntário",
          "Mande seu nome e telefone — avisamos as datas dos próximos mutirões.",
          [btnWhats("Avisar pelo WhatsApp", "Olá! Quero ser voluntário nos mutirões do CNM."), btnEmail("Enviar e-mail", "Voluntário — mutirões")]),
      },
    ],
  },
  {
    id: "programa-de-relacionamento", rota: "/programa-de-relacionamento/", titulo: "Programa de Relacionamento",
    intro: "Vantagens para quem é sócio: descontos em parceiros, condições para a família e a carteira social.",
    paginas: [
      { rota: "/programa-de-relacionamento/programa-cnmais-vantagem/", titulo: "CNMais Vantagem", resumo: "Descontos e benefícios em lojas e parques parceiros." },
      { rota: "/programa-de-relacionamento/desconto-cnfamilia/", titulo: "Desconto CNfaMília" },
      { rota: "/programa-de-relacionamento/carteira-social/", titulo: "Carteira Social" },
    ],
  },
  {
    id: "parceiros", rota: "/parceiros/", titulo: "Parceiros",
    intro: "Instituições com que o clube mantém parceria e representação.",
    paginas: [
      { rota: "/parceiros/espaco-femerj/", titulo: "Espaço FEEMERJ" },
      { rota: "/parceiros/espaco-peset/", titulo: "Espaço PESET", resumo: "Parque Estadual da Serra da Tiririca: documentos e a representação do CNM no conselho." },
    ],
  },
];

const AVULSAS = [
  { rota: "/loja/", titulo: "Loja", fonte: null, lead: "Anuidade, cursos e os produtos da CNMuamba.",
    html: `<p>A loja online do site antigo está sendo integrada ao <strong>painel do sócio</strong>. Enquanto essa migração não termina, anuidade, inscrição em cursos e produtos da CNMuamba são tratados diretamente com a diretoria.</p>` +
      acao("Fale com a diretoria", "Diga o que você procura — anuidade, curso ou produto — e a diretoria responde por lá.",
        [btnWhats("Falar pelo WhatsApp", "Olá! Tenho interesse em um item da loja do CNM."), btnEmail("Enviar e-mail", "Loja CNM")]) },
];

const NAV = [
  { rotulo: "O CNM", secoes: ["o-cnm"] },
  { rotulo: "Participe", secoes: ["como-participar"] },
  { rotulo: "Cursos", secoes: ["cursos"] },
  { rotulo: "Publicações", secoes: ["publicacoes"] },
  { rotulo: "Meio Ambiente", secoes: ["meio-ambiente"] },
  { rotulo: "Sócios", secoes: ["programa-de-relacionamento", "parceiros"] },
  { rotulo: "Contato", href: "/contato/" },
];

// ---------------------------------------------------------------------------
// utilitários
// ---------------------------------------------------------------------------
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function btnWhats(rotulo, msg) { return `<a class="btn btn-green" href="${WHATS}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${rotulo}</a>`; }
function btnEmail(rotulo, assunto) { return `<a class="btn btn-ghost" href="mailto:${EMAIL}?subject=${encodeURIComponent(assunto)}">${rotulo}</a>`; }
function acao(titulo, texto, botoes) { return `<div class="acao"><h3>${titulo}</h3><p>${texto}</p><div class="linha">${botoes.join("")}</div></div>`; }
const SETA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
const SETA_DIR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;

function hrefDe(p) { return p.link || p.rota; }
function textoPuro(html) { return parse(html).text.replace(/\s+/g, " ").trim(); }
function resumir(t, n = 150) {
  if (t.length <= n) return t;
  const corte = t.slice(0, n);
  return corte.slice(0, corte.lastIndexOf(" ")).replace(/[,;:.\-–—]+$/, "") + "…";
}
function secaoDaRota(rota) {
  for (const s of SECOES) {
    if (s.rota === rota) return { secao: s, pagina: null };
    const p = s.paginas.find(x => x.rota === rota);
    if (p) return { secao: s, pagina: p };
  }
  return { secao: null, pagina: null };
}
function existeLocal(rel) { try { return fs.statSync(path.join(RAIZ, decodeURIComponent(rel))).isFile(); } catch { return false; } }

// rotas que este site serve (para saber se um link interno é válido)
const ROTAS = new Set(["/", "/contato/"]);
SECOES.forEach(s => { ROTAS.add(s.rota); s.paginas.forEach(p => p.rota && ROTAS.add(p.rota)); });
AVULSAS.forEach(a => ROTAS.add(a.rota));

const avisos = [];

/** Primeiro parágrafo com conteúdo — evita colar o título ao texto no resumo. */
function primeiroParagrafo(html) {
  const ps = parse(html).querySelectorAll("p").map(p => p.text.replace(/\s+/g, " ").trim()).filter(t => t.length >= 40);
  return ps[0] || textoPuro(html);
}

/** Reescreve links/imagens do conteúdo do WP para este site. */
function adaptarConteudo(html, rota) {
  const raiz = parse(`<div id="r">${html}</div>`);
  const r = raiz.querySelector("#r");

  const ORIG = /^https?:\/\/(www\.)?niteroiense\.org\.br/i;
  const local = u => {
    let p = u.replace(ORIG, "");
    p = p.replace(/^\/novosite(?=\/)/, "");
    return p || "/";
  };

  r.querySelectorAll("img").forEach(img => {
    const src = img.getAttribute("src") || "";
    if (!ORIG.test(src)) return;
    const p = local(src).split("?")[0];
    if (p.startsWith("/wp-content/uploads/") && existeLocal(p.slice(1))) img.setAttribute("src", p);
    else { avisos.push(`${rota}: imagem ausente removida (${p})`); img.remove(); }
  });

  r.querySelectorAll("a").forEach(a => {
    let href = a.getAttribute("href") || "";
    if (!ORIG.test(href) && !href.startsWith("/")) return;
    let p = ORIG.test(href) ? local(href) : href;
    const [caminho] = p.split(/[?#]/);
    if (caminho.startsWith("/wp-content/uploads/")) {
      if (existeLocal(caminho.slice(1))) p = caminho;
      else { avisos.push(`${rota}: anexo não migrado, link mantido no site antigo (${caminho})`); p = "https://www.niteroiense.org.br" + caminho; }
    } else if (/^\/proximas-atividades\/?$/.test(caminho) || caminho.startsWith("/programacao")) {
      p = "/#atividades";
    } else if (!ROTAS.has(caminho.endsWith("/") ? caminho : caminho + "/") && caminho !== "/") {
      avisos.push(`${rota}: link para página ainda não migrada (${caminho})`);
    }
    a.setAttribute("href", p);
    const ext = (p.match(/\.(pdf|docx?|xlsx?|pptx?|zip)$/i) || [])[1];
    if (ext) { a.setAttribute("class", "arquivo"); a.setAttribute("data-tipo", ext.toUpperCase().replace("X", "")); }
  });

  // um h1 por página: o do cabeçalho
  r.querySelectorAll("h1").forEach(h => { h.tagName = "H2"; });

  let out = r.innerHTML;
  out = out.replace(/<table[\s\S]*?<\/table>/g, t => `<div class="tabela">${t}</div>`);
  out = out.replace(/(<\/h[1-6]>)\s*\.\s*(<)/g, "$1$2"); // resto do acordeão dos boletins
  out = out.replace(/<p>\s*(<br\s*\/?>\s*)+/g, "<p>").replace(/(\s*<br\s*\/?>)+\s*<\/p>/g, "</p>");
  return out;
}

// ---------------------------------------------------------------------------
// moldura (cabeçalho, rodapé, gaveta)
// ---------------------------------------------------------------------------
function itensDoGrupo(g) {
  const itens = [];
  for (const id of g.secoes) {
    const s = SECOES.find(x => x.id === id);
    s.paginas.forEach(p => itens.push({ href: hrefDe(p), titulo: p.titulo, externo: p.externo }));
    itens.push({ href: s.rota, titulo: g.secoes.length > 1 ? s.titulo : `Tudo em ${s.titulo}`, todos: true });
  }
  return itens;
}

function cabecalho(rotaAtual) {
  const { secao } = secaoDaRota(rotaAtual);
  const links = NAV.map(g => {
    if (g.href) {
      const ativo = rotaAtual === g.href ? " ativo" : "";
      return `<div class="item${ativo}"><a href="${g.href}"${ativo ? ' aria-current="page"' : ""}>${g.rotulo}</a></div>`;
    }
    const ativo = secao && g.secoes.includes(secao.id) ? " ativo" : "";
    const sub = itensDoGrupo(g).map(i =>
      `<a href="${i.href}"${i.todos ? ' class="todos"' : ""}${i.href === rotaAtual ? ' aria-current="page"' : ""}${i.externo ? ' target="_blank" rel="noopener"' : ""}>${i.titulo}</a>`).join("");
    return `<div class="item${ativo}"><button type="button" aria-haspopup="true">${g.rotulo} ${SETA}</button><div class="sub">${sub}</div></div>`;
  }).join("");

  const gaveta = NAV.map(g => {
    if (g.href) return `<a class="solo" href="${g.href}">${g.rotulo}</a>`;
    const aberto = secao && g.secoes.includes(secao.id) ? " open" : "";
    const sub = itensDoGrupo(g).map(i => `<a href="${i.href}"${i.href === rotaAtual ? ' aria-current="page"' : ""}${i.externo ? ' target="_blank" rel="noopener"' : ""}>${i.titulo}</a>`).join("");
    return `<details${aberto}><summary>${g.rotulo} ${SETA}</summary><div>${sub}</div></details>`;
  }).join("");

  return `  <header class="nav">
    <div class="wrap nav-inner">
      <a class="brand" href="/"><img src="/assets/logo.png" alt="CNM"/><span><b>CNM</b><span class="brand-full">Clube Niteroiense de Montanhismo</span></span></a>
      <nav class="nav-links" aria-label="Principal">${links}</nav>
      <div class="nav-cta">
        <a class="btn btn-ghost" href="${PAINEL}/login" target="_blank" rel="noopener">Entrar</a>
        <a class="btn btn-green" href="${PAINEL}/cadastro" target="_blank" rel="noopener">Associe-se</a>
        <button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="gaveta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      </div>
    </div>
  </header>
  <div class="gaveta" id="gaveta" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="fundo" data-fechar></div>
    <div class="painel">
      <div class="topo"><b>Menu</b><button class="nav-toggle" style="display:grid" type="button" aria-label="Fechar menu" data-fechar><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <a class="solo" href="/">Início</a>${gaveta}
      <div class="acoes"><a class="btn btn-green" href="${PAINEL}/cadastro" target="_blank" rel="noopener">Associe-se</a><a class="btn btn-ghost" href="${PAINEL}/login" target="_blank" rel="noopener">Entrar no painel</a></div>
    </div>
  </div>
`;
}

function rodape() {
  const li = (href, t) => `<li><a href="${href}">${t} ${SETA_DIR}</a></li>`;
  return `  <footer class="foot" id="contato">
    <div class="wrap foot-main">
      <div class="foot-col brand-col">
        <a class="fbrand" href="/"><img src="/assets/logo.png" alt="CNM — Clube Niteroiense de Montanhismo"/></a>
        <h4 class="foot-title">Clube Niteroiense de Montanhismo</h4>
        <p class="foot-about">Clube de escalada, caminhada e demais atividades de montanhismo. Fundado em 2004 e filiado à FEEMERJ. Cursos de escalada e montanhismo.</p>
      </div>
      <div class="foot-col">
        <h5>Contatos</h5>
        <ul class="foot-contact">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Rua Dr. Martins Tôrres, 18 — Santa Rosa, Niterói / RJ</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg><a href="mailto:${EMAIL}">${EMAIL}</a></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><a href="${WHATS}" target="_blank" rel="noopener">(21) 96663-4040</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h5>Links</h5>
        <ul class="foot-links">
          ${li("/o-cnm/", "O CNM")}
          ${li("/como-participar/", "Como participar")}
          ${li("/#atividades", "Programação")}
          ${li("/cursos/", "Cursos")}
          ${li("/publicacoes/", "Publicações")}
          ${li("/meio-ambiente/", "Meio ambiente")}
          ${li("/contato/", "Contato")}
        </ul>
      </div>
      <div class="foot-col">
        <h5>Siga nossas redes</h5>
        <div class="socials">
          <a href="${FACEBOOK}" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg></a>
          <a href="${INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
        </div>
      </div>
    </div>
    <div class="foot-bar">
      <a class="to-top" href="#" aria-label="Voltar ao topo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg></a>
      © 2026 · CNM — Clube Niteroiense de Montanhismo
    </div>
  </footer>
`;
}

function documento({ rota, titulo, descricao, corpoHtml }) {
  const desc = esc(resumir(descricao || "", 158));
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} — CNM | Clube Niteroiense de Montanhismo</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${esc(titulo)} — CNM">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="/assets/hero.jpg">
<meta name="theme-color" content="#16357A">
<link rel="canonical" href="https://www.niteroiense.org.br${rota}">
<link rel="icon" type="image/png" href="/assets/logo.png">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<div class="cnm">
${cabecalho(rota)}  <main id="conteudo">
${corpoHtml}
  </main>
${rodape()}</div>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function heroPagina({ trilha, eyebrow, titulo, lead }) {
  const migalhas = [`<a href="/">Início</a>`, ...trilha.map(t => t.href ? `<a href="${t.href}">${esc(t.titulo)}</a>` : `<span aria-current="page">${esc(t.titulo)}</span>`)]
    .join(` <span aria-hidden="true">›</span> `);
  return `    <section class="pg-hero">
      <div class="wrap">
        <nav class="trilha" aria-label="Você está em">${migalhas}</nav>
        ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
        <h1>${esc(titulo)}</h1>
        ${lead ? `<p class="lead">${esc(lead)}</p>` : ""}
      </div>
    </section>`;
}

function lateral(secao, rotaAtual) {
  const nav = secao ? `<div class="lat-box"><h4>${esc(secao.titulo)}</h4><nav aria-label="${esc(secao.titulo)}">${secao.paginas.map(p =>
    `<a href="${hrefDe(p)}"${hrefDe(p) === rotaAtual ? ' aria-current="page"' : ""}${p.externo ? ' target="_blank" rel="noopener"' : ""}>${esc(p.titulo)}</a>`).join("")}</nav></div>` : "";
  return `<aside class="lateral">${nav}
          <div class="lat-cta"><h4>Venha para o CNM</h4><p>Reunião social toda quinta, das 19h30 às 22h, na sede. Aberta a quem quiser conhecer.</p><a class="btn btn-white" href="/como-participar/">Como participar</a></div>
        </aside>`;
}

function escrever(rota, html) {
  const alvo = path.join(RAIZ, rota, "index.html");
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.writeFileSync(alvo, html);
}

// ---------------------------------------------------------------------------
// geração
// ---------------------------------------------------------------------------
const gerados = [];

function paginaDeConteudo(secao, p) {
  const fonte = p.fonte === undefined ? p.rota : p.fonte;
  const src = fonte ? CONTEUDO[fonte] : null;
  if (fonte && !src) throw new Error(`sem conteúdo extraído para ${fonte}`);
  const corpo = (p.html || adaptarConteudo(src.html, p.rota)) + (p.extra || "");
  const descricao = p.resumo || primeiroParagrafo(corpo);
  const trilha = secao ? [{ href: secao.rota, titulo: secao.titulo }, { titulo: p.titulo }] : [{ titulo: p.titulo }];
  const html = documento({
    rota: p.rota, titulo: p.titulo, descricao,
    corpoHtml: `${heroPagina({ trilha, eyebrow: secao ? secao.titulo : "CNM", titulo: p.titulo, lead: p.lead })}
    <section class="pg-corpo">
      <div class="wrap pg-grid">
        <article class="prosa">${corpo}</article>
        ${lateral(secao, p.rota)}
      </div>
    </section>`,
  });
  escrever(p.rota, html);
  gerados.push(p.rota);
  if (!p.resumo) p.resumo = resumir(primeiroParagrafo(corpo));
}

function paginaHub(secao) {
  const cartoes = secao.paginas.map(p => {
    const ext = p.externo ? ' target="_blank" rel="noopener"' : "";
    return `<a class="cartao reveal" href="${hrefDe(p)}"${ext}><h3>${esc(p.titulo)}</h3>${p.resumo ? `<p>${esc(p.resumo)}</p>` : ""}<span class="ir">${p.externo ? "Abrir o painel ↗" : "Ler mais →"}</span></a>`;
  }).join("\n          ");
  const html = documento({
    rota: secao.rota, titulo: secao.titulo, descricao: secao.intro,
    corpoHtml: `${heroPagina({ trilha: [{ titulo: secao.titulo }], eyebrow: "CNM", titulo: secao.titulo, lead: secao.intro })}
    <section class="pg-corpo">
      <div class="wrap">
        <div class="hub">
          ${cartoes}
        </div>
      </div>
    </section>`,
  });
  escrever(secao.rota, html);
  gerados.push(secao.rota);
}

function paginaContato() {
  const ic = {
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    rel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  };
  // embed oficial do Google, recuperado do shortcode [vc_gmaps] da página antiga
  const mapa = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.360456990384!2d-43.09933218460178!3d-22.900071985015227!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x99840a0002cfdd%3A0xe100f1f5f874600c!2sR.+Dr.+Martins+T%C3%B4rres%2C+18+-+Santa+Rosa%2C+Niter%C3%B3i+-+RJ%2C+24240-705!5e0!3m2!1spt-BR!2sbr!4v1540912617689";
  const html = documento({
    rota: "/contato/", titulo: "Contato",
    descricao: "Fale com o Clube Niteroiense de Montanhismo: sede em Santa Rosa, Niterói. E-mail, WhatsApp e reunião social às quintas-feiras.",
    corpoHtml: `${heroPagina({ trilha: [{ titulo: "Contato" }], eyebrow: "Fale conosco", titulo: "Contato", lead: "Tire dúvidas sobre atividades, cursos ou associação. A forma mais rápida é o WhatsApp." })}
    <section class="pg-corpo">
      <div class="wrap contato-grid">
        <div>
          <div class="contato-card">
            <h3>Clube Niteroiense de Montanhismo</h3>
            <ul>
              <li>${ic.pin}<span>Rua Dr. Martins Tôrres, 18 — Santa Rosa<br>Niterói / RJ — CEP 24240-705</span></li>
              <li>${ic.mail}<a href="mailto:${EMAIL}">${EMAIL}</a></li>
              <li>${ic.zap}<a href="${WHATS}" target="_blank" rel="noopener">(21) 96663-4040</a></li>
              <li>${ic.rel}<span>Reunião social: quintas-feiras, das 19h30 às 22h, na sede</span></li>
            </ul>
            <div class="acao" style="margin-top:22px;"><h3>Prefere mandar mensagem?</h3><p>Responderemos assim que possível.</p><div class="linha">${btnWhats("WhatsApp", "Olá! Gostaria de falar com o CNM.")}${btnEmail("E-mail", "Contato pelo site")}</div></div>
          </div>
          <div class="contato-card">
            <h3>Redes sociais</h3>
            <ul>
              <li>${ic.rel.replace(/<circle[^>]*\/><path[^>]*\/>/, '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>')}<a href="${INSTAGRAM}" target="_blank" rel="noopener">@clubeniteroiensedemontanhismo</a></li>
              <li>${ic.rel.replace(/<circle[^>]*\/><path[^>]*\/>/, '<path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/>')}<a href="${FACEBOOK}" target="_blank" rel="noopener">facebook.com/clubecnm</a></li>
            </ul>
          </div>
        </div>
        <iframe class="mapa" title="Mapa da sede do CNM" src="${mapa}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </section>`,
  });
  escrever("/contato/", html);
  gerados.push("/contato/");
}

/** Mantém cabeçalho e rodapé da home iguais aos das páginas. */
function atualizarHome() {
  const arq = path.join(RAIZ, "index.html");
  const raw = fs.readFileSync(arq, "utf8");
  const crlf = raw.includes("\r\n");
  let s = raw.replace(/\r\n/g, "\n");
  s = s.replace(/  <!--CABECALHO-->\n[\s\S]*?  <!--\/CABECALHO-->\n/, `  <!--CABECALHO-->\n${cabecalho("/")}  <!--/CABECALHO-->\n`);
  s = s.replace(/  <!--RODAPE-->\n[\s\S]*?  <!--\/RODAPE-->\n/, `  <!--RODAPE-->\n${rodape()}  <!--/RODAPE-->\n`);
  if (!s.includes("/assets/site.js")) s = s.replace("</body>", `<script src="/assets/site.js" defer></script>\n</body>`);
  fs.writeFileSync(arq, crlf ? s.replace(/\n/g, "\r\n") : s);
}

function main() {
  // primeiro as páginas (preenchem os resumos automáticos), depois os hubs
  for (const s of SECOES) for (const p of s.paginas) if (p.rota) paginaDeConteudo(s, p);
  for (const a of AVULSAS) paginaDeConteudo(null, a);
  for (const s of SECOES) paginaHub(s);
  paginaContato();
  atualizarHome();

  console.log(`${gerados.length} páginas geradas + home atualizada`);
  const unicos = [...new Set(avisos)];
  if (unicos.length) {
    console.log(`\n${unicos.length} avisos:`);
    unicos.forEach(a => console.log("  - " + a));
  }
}

main();
