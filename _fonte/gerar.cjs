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

const { limpar } = require("./extrair.cjs");

const RAIZ = path.resolve(__dirname, "..");
// Para onde as páginas vão. Na Vercel: dist/ (outputDirectory do vercel.json).
// Localmente, aponte SAIDA para fora do Google Drive.
const SAIDA = path.resolve(process.env.SAIDA || path.join(RAIZ, "dist"));
// Endereço público, usado nas prévias de link (WhatsApp/Facebook exigem URL absoluta).
const SITE_URL = (process.env.SITE_URL || "https://novosite.niteroiense.org.br").replace(/\/$/, "");
// Banco do painel: o que a diretoria publica. Chave pública (a mesma da agenda da home);
// ela só enxerga o que está publicado.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ijbezuisiudyxktqoaaf.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_ltjnX5pcK6aGVVE4-1j3bA_trHSfXrZ";

const CONTEUDO = require("./conteudo/paginas.json");
let POSTS = require("./conteudo/posts.json");   // substituído pelo banco depois da importação
const CROQUIS = require("./conteudo/croquis.json");
const TRILHAS = require("./conteudo/trilhas.json");
let DOCUMENTOS = [];                              // PDFs publicados pelo painel

// Categorias dos posts que ganham página própria, em /categoria/<slug>/ (URL do WP).
// "sem-categoria" não tem página: esses posts aparecem só no arquivo completo.
const CATEGORIAS = [
  { slug: "noticias", nome: "Notícias", intro: "Comunicados, eventos e novidades do clube." },
  { slug: "relatos", nome: "Relatos", intro: "Sócios contam como foram trilhas, escaladas e viagens." },
  { slug: "artigos-tecnicos", nome: "Artigos Técnicos", intro: "Técnica, segurança e equipamento para a prática do montanhismo." },
  { slug: "artigos", nome: "Artigos", intro: "Textos de opinião e reflexão sobre montanhismo." },
  { slug: "sugestoes-de-leitura", nome: "Sugestões de Leitura", intro: "Livros sobre montanha, escalada e aventura indicados pelos sócios." },
  { slug: "social", nome: "Social", intro: "Confraternizações, festas e encontros do clube." },
  { slug: "cursos", nome: "Cursos", intro: "Notícias sobre os cursos do CNM: turmas, formaturas e novidades." },
  { slug: "meio-ambiente", nome: "Meio Ambiente", intro: "Mutirões, campanhas e notícias ambientais." },
  { slug: "palestras", nome: "Palestras", intro: "Palestras e rodas de conversa promovidas pelo clube." },
  { slug: "historia", nome: "História", intro: "Registros da história do clube." },
];
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
    intro: "Fundado em 20 de novembro de 2004, o Clube Niteroiense de Montanhismo reúne praticantes de escalada, caminhada e montanhismo em Niterói. É filiado à FEMERJ.",
    paginas: [
      { rota: "/o-cnm/historia-do-cnm/", titulo: "História do CNM", resumo: "Da primeira reunião, em março de 2003, à assembleia de fundação em novembro de 2004 — e o que veio depois." },
      { rota: "/o-cnm/diretoria/", titulo: "Diretoria", resumo: "Diretoria eleita, membros nomeados, conselho fiscal e representantes do clube." },
      { rota: "/o-cnm/guias-do-clube/", titulo: "Guias do Clube", resumo: "Os guias de trilha, escalada e ciclismo formados e reconhecidos pelo CNM." },
      { rota: "/o-cnm/estatuto/", titulo: "Estatuto", resumo: "O estatuto social que rege o funcionamento do clube." },
      { rota: "/o-cnm/cei/", titulo: "Centro Excursionista Icaraí", resumo: "A história do CEI, clube que antecedeu o montanhismo organizado em Niterói." },
      { rota: "/o-cnm/o-cnm-e-a-femerj/", titulo: "O CNM e a FEMERJ", resumo: "A filiação do clube à federação estadual e os princípios éticos que seguimos." },
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
    intro: "Cursos de formação para quem está começando e de atualização para quem já pratica. O CBE é homologado pela FEMERJ.",
    paginas: [
      { rota: "/cursos/curso-basico-de-escalada/", titulo: "Curso Básico de Escalada", resumo: "CBE: 20 aulas, teóricas e práticas, com certificação da FEMERJ." },
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
    intro: "Notícias, relatos, artigos, boletins e documentos produzidos pelo clube desde 2006.",
    paginas: [
      { link: "/categoria/noticias/", titulo: "Notícias", resumo: "Comunicados, eventos e novidades do clube." },
      { link: "/categoria/relatos/", titulo: "Relatos", resumo: "Sócios contam como foram trilhas, escaladas e viagens." },
      { link: "/categoria/artigos-tecnicos/", titulo: "Artigos Técnicos", resumo: "Técnica, segurança e equipamento." },
      { link: "/categoria/sugestoes-de-leitura/", titulo: "Sugestões de Leitura", resumo: "Livros de montanha indicados pelos sócios." },
      { rota: "/publicacoes/boletins-cnm/", titulo: "Boletins CNM", resumo: "O CNM Informa: as edições do boletim do clube." },
      { rota: "/publicacoes/documentos/", titulo: "Documentos", resumo: "Atas, demonstrativos financeiros e documentos institucionais." },
      { rota: "/publicacoes/guias-de-trilhas-e-escaladas/", titulo: "Guias de Trilhas e Escaladas", resumo: "Guias e croquis de trilhas e vias de escalada." },
      { link: "/croquiteca/", titulo: "Croquiteca", resumo: "Croquis de vias de escalada e fichas de trilhas." },
      { link: "/ultimos-posts/", titulo: "Todas as publicações", resumo: "O arquivo completo, do mais recente ao mais antigo." },
    ],
  },
  {
    id: "croquiteca", rota: "/croquiteca/", titulo: "Croquiteca",
    intro: "Croquis de vias de escalada conquistadas e repetidas pelo clube, e fichas das trilhas com esforço, risco e orientação.",
    paginas: [
      { rota: "/croquiteca/vias-de-escalada/", titulo: "Vias de Escalada", colecao: "croquis", resumo: "Croquis com grau, localização, conquistadores e ano." },
      { rota: "/croquiteca/trilhas/", titulo: "Trilhas", colecao: "trilhas", resumo: "Fichas de trilhas com duração, percurso, desnível e classificação." },
      { link: "/publicacoes/guias-de-trilhas-e-escaladas/", titulo: "Guias de Trilhas e Escaladas", resumo: "Guias publicados em PDF." },
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
      { rota: "/parceiros/espaco-femerj/", titulo: "Espaço FEMERJ" },
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

// Faixa de aviso na home, logo abaixo do hero. `ate` = último dia em que aparece
// (o script da própria faixa a esconde depois disso). Sem aviso: AVISO = null.
// Depois da migração 16, vem da tabela `destaques` (o painel edita); este valor
// fixo só vale enquanto a tabela não existe.
let AVISO = {
  ate: "2026-11-26",
  rotulo: "Assembleia Geral Ordinária",
  titulo: "26 de novembro de 2026, às 20h, na sede",
  texto: "Eleição de presidente, vice-presidente, tesoureiro, diretor técnico e conselho fiscal para o biênio 2027/2028. Chapas devem ser registradas pelo e-mail cnm@niteroiense.org.br até um mês antes.",
  href: "/edital-de-convocacao-da-assembleia-geral-ordinaria-2-copy/",
  botao: "Ler o edital de convocação",
};

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
const ROTAS_FIXAS = new Set(ROTAS);
CATEGORIAS.forEach(c => ROTAS_FIXAS.add(`/categoria/${c.slug}/`));
ROTAS_FIXAS.add("/ultimos-posts/");
/** Posts vêm do banco: só dá para registrar depois de carregar. */
function registrarRotasDinamicas() {
  ROTAS_FIXAS.forEach(r => ROTAS.add(r));
  [POSTS, CROQUIS, TRILHAS].forEach(col => Object.keys(col).forEach(r => ROTAS.add(r)));
}

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
      <a class="brand" href="/" aria-label="CNM — Clube Niteroiense de Montanhismo, página inicial"><img src="/assets/logo.png" alt="CNM — Clube Niteroiense de Montanhismo" width="58" height="58"/></a>
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
        <p class="foot-about">Clube de escalada, caminhada e demais atividades de montanhismo. Fundado em 2004 e filiado à FEMERJ. Cursos de escalada e montanhismo.</p>
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

/** URL absoluta — exigida pelas prévias de link do WhatsApp e do Facebook. */
function absoluta(u) { return /^https?:\/\//.test(u) ? u : SITE_URL + (u.startsWith("/") ? u : "/" + u); }

function documento({ rota, titulo, descricao, corpoHtml, imagem, tipo = "website" }) {
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
<meta property="og:type" content="${tipo}">
<meta property="og:url" content="${esc(absoluta(rota))}">
<meta property="og:image" content="${esc(absoluta(imagem || "/assets/hero.jpg"))}">
<meta property="og:site_name" content="CNM — Clube Niteroiense de Montanhismo">
<meta name="twitter:card" content="summary_large_image">
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
  const alvo = path.join(SAIDA, rota, "index.html");
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.writeFileSync(alvo, html);
}

// ---------------------------------------------------------------------------
// geração
// ---------------------------------------------------------------------------
const gerados = [];

/** PDFs publicados pelo painel, no topo de Documentos e de Boletins. */
const SECAO_DOC = { "/publicacoes/documentos/": "documentos", "/publicacoes/boletins-cnm/": "boletins" };
function listaDocumentos(rota) {
  const secao = SECAO_DOC[rota];
  const itens = secao ? DOCUMENTOS.filter(d => d.secao === secao) : [];
  if (!itens.length) return "";
  return `<ul class="docs">${itens.map(d =>
    `<li><a class="arquivo" data-tipo="PDF" href="${esc(d.arquivo_url)}" target="_blank" rel="noopener">${esc(d.titulo)}</a>` +
    `<span class="doc-data">${dataExtenso(d.data)}</span>${d.descricao ? `<p>${esc(d.descricao)}</p>` : ""}</li>`).join("")}</ul>`;
}

function paginaDeConteudo(secao, p) {
  const fonte = p.fonte === undefined ? p.rota : p.fonte;
  const src = fonte ? CONTEUDO[fonte] : null;
  if (fonte && !src) throw new Error(`sem conteúdo extraído para ${fonte}`);
  let corpo = (p.html || adaptarConteudo(src.html, p.rota)) + (p.extra || "");
  const docs = listaDocumentos(p.rota);
  if (docs) corpo = docs + `<h2>Acervo</h2>` + corpo;
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

// ---------------------------------------------------------------------------
// POSTS, CATEGORIAS E CROQUITECA
// ---------------------------------------------------------------------------
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function dataExtenso(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}
function tituloLimpo(t) { return t.replace(/\s*[|–-]\s*CNM\s*$/i, "").trim(); }
function catPrincipal(post) {
  const slugs = post.categorias.map(c => c.slug);
  return CATEGORIAS.find(c => slugs.includes(c.slug)) || null;
}
/** Capa local (ou nada, se o arquivo não foi migrado). */
function capaLocal(url) {
  if (!url) return "";
  // enviada pelo painel: fica no armazenamento do Supabase, já é pública
  if (/^https:\/\//.test(url) && !/niteroiense\.org\.br/i.test(url)) return url;
  const p = url.replace(/^https?:\/\/(www\.)?niteroiense\.org\.br/i, "").split("?")[0];
  return p.startsWith("/wp-content/uploads/") && existeLocal(p.slice(1)) ? p : "";
}
function postsOrdenados() {
  return Object.entries(POSTS).map(([rota, p]) => ({ rota, ...p, titulo: tituloLimpo(p.titulo) }))
    .sort((a, b) => b.data.localeCompare(a.data));
}

function cartaoPost(p) {
  const capa = capaLocal(p.capa);
  const cat = catPrincipal(p);
  const fundo = capa ? `<span class="capa" style="background-image:url('${esc(capa.replace(/['()\\]/g, encodeURIComponent))}')"></span>` : `<span class="capa vazia"></span>`;
  return `<a class="cartao post reveal" href="${p.rota}">${fundo}<span class="meta-post">${cat ? esc(cat.nome) + " · " : ""}${dataExtenso(p.data)}</span><h3>${esc(p.titulo)}</h3><p>${esc(resumir(p.resumo || primeiroParagrafo(p.html), 130))}</p></a>`;
}

function paginaCategoria(cat) {
  const lista = postsOrdenados().filter(p => p.categorias.some(c => c.slug === cat.slug));
  const rota = `/categoria/${cat.slug}/`;
  const html = documento({
    rota, titulo: cat.nome, descricao: cat.intro,
    corpoHtml: `${heroPagina({ trilha: [{ href: "/publicacoes/", titulo: "Publicações" }, { titulo: cat.nome }], eyebrow: `${lista.length} publicações`, titulo: cat.nome, lead: cat.intro })}
    <section class="pg-corpo">
      <div class="wrap">
        <div class="hub posts">
          ${lista.map(cartaoPost).join("\n          ")}
        </div>
      </div>
    </section>`,
  });
  escrever(rota, html);
  gerados.push(rota);
}

function paginaArquivo() {
  const lista = postsOrdenados();
  const porAno = {};
  lista.forEach(p => (porAno[p.data.slice(0, 4)] ||= []).push(p));
  const anos = Object.keys(porAno).sort().reverse();
  const corpo = anos.map(a => `<section class="ano"><h2>${a}</h2><ul class="arquivo">${porAno[a].map(p => {
    const cat = catPrincipal(p);
    return `<li><time datetime="${p.data}">${p.data.split("-").reverse().slice(0, 2).join("/")}</time><a href="${p.rota}">${esc(p.titulo)}</a>${cat ? `<span class="tag">${esc(cat.nome)}</span>` : ""}</li>`;
  }).join("")}</ul></section>`).join("");
  const filtros = CATEGORIAS.filter(c => lista.some(p => p.categorias.some(x => x.slug === c.slug)))
    .map(c => `<a class="chip" href="/categoria/${c.slug}/">${esc(c.nome)}</a>`).join("");
  const html = documento({
    rota: "/ultimos-posts/", titulo: "Todas as publicações",
    descricao: `Arquivo completo de publicações do CNM: ${lista.length} posts de ${anos[anos.length - 1]} a ${anos[0]}.`,
    corpoHtml: `${heroPagina({ trilha: [{ href: "/publicacoes/", titulo: "Publicações" }, { titulo: "Todas as publicações" }], eyebrow: `${lista.length} publicações · ${anos[anos.length - 1]}–${anos[0]}`, titulo: "Todas as publicações", lead: "Do mais recente ao mais antigo. Filtre por categoria:" })}
    <section class="pg-corpo">
      <div class="wrap">
        <div class="chips" style="margin:0 0 30px;">${filtros}</div>
        <div class="prosa arquivo-wrap">${corpo}</div>
      </div>
    </section>`,
  });
  escrever("/ultimos-posts/", html);
  gerados.push("/ultimos-posts/");
}

function paginaPost(p) {
  const cat = catPrincipal(p);
  let corpo = adaptarConteudo(p.html, p.rota);
  const capa = capaLocal(p.capa);
  // a capa só entra se o texto ainda não mostra a mesma imagem
  const raizArquivo = capa ? path.basename(capa).replace(/(-\d+x\d+)?\.\w+$/, "") : "";
  if (capa && !corpo.includes(raizArquivo)) corpo = `<img class="capa-post" src="${esc(capa)}" alt="" loading="lazy">` + corpo;
  const relacionados = postsOrdenados().filter(x => x.rota !== p.rota && cat && x.categorias.some(c => c.slug === cat.slug)).slice(0, 5);
  const trilha = [{ href: "/publicacoes/", titulo: "Publicações" }];
  if (cat) trilha.push({ href: `/categoria/${cat.slug}/`, titulo: cat.nome });
  trilha.push({ titulo: p.titulo });
  const lat = `<aside class="lateral">${relacionados.length ? `<div class="lat-box"><h4>Mais em ${esc(cat.nome)}</h4><nav>${relacionados.map(r => `<a href="${r.rota}">${esc(r.titulo)}</a>`).join("")}</nav></div>` : ""}
          <div class="lat-cta"><h4>Venha para o CNM</h4><p>Reunião social toda quinta, das 19h30 às 22h, na sede. Aberta a quem quiser conhecer.</p><a class="btn btn-white" href="/como-participar/">Como participar</a></div>
        </aside>`;
  const html = documento({
    rota: p.rota, titulo: p.titulo, descricao: p.resumo || primeiroParagrafo(corpo),
    imagem: capa || undefined, tipo: "article",
    corpoHtml: `${heroPagina({ trilha, eyebrow: [cat ? cat.nome : "Publicação", dataExtenso(p.data)].filter(Boolean).join(" · "), titulo: p.titulo })}
    <section class="pg-corpo">
      <div class="wrap pg-grid">
        <article class="prosa">${corpo}</article>
        ${lat}
      </div>
    </section>`,
  });
  escrever(p.rota, html);
  gerados.push(p.rota);
}

/** Croqui: tira o bloco duplicado do tema (rótulos soltos + link cru da imagem). */
function corpoCroqui(html) {
  const fonte = (html.match(/<p>Fonte:[^<]*<\/p>/) || [""])[0];
  const img = (html.match(/<img [^>]*>/) || [""])[0];
  const info = html.indexOf("<h2>Informações do Croqui</h2>");
  const resto = info >= 0 ? html.slice(info) : html;
  const figura = img ? `<figure class="croqui">${img.replace("<img ", '<img alt="Croqui da via" ')}<figcaption>Clique na imagem para ampliar.</figcaption></figure>` : "";
  const src = (img.match(/src="([^"]*)"/) || [])[1];
  return fonte + (src ? `<a href="${src}">${figura}</a>` : figura) + resto;
}
function campo(html, rotulo) {
  const m = html.match(new RegExp(`<strong>${rotulo}:?</strong>\\s*([^<]*)`));
  return m ? m[1].trim() : "";
}

function paginaColecao(secao, pag, colecao) {
  const itens = Object.entries(colecao).map(([rota, x]) => ({ rota, ...x, titulo: tituloLimpo(x.titulo) }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  // cada item vira página
  for (const x of itens) {
    let corpo = x.tipo === "croqui" ? corpoCroqui(x.html) : x.html.replace(/<li><strong>Descrição:<\/strong>[\s\S]*?<\/li>/, "");
    corpo = adaptarConteudo(corpo, x.rota);
    const html = documento({
      rota: x.rota, titulo: x.titulo, descricao: x.tipo === "croqui" ? `Croqui da via ${x.titulo}${campo(x.html, "Grau") ? ", " + campo(x.html, "Grau") : ""}${campo(x.html, "Montanha") ? " — " + campo(x.html, "Montanha") : ""}.` : primeiroParagrafo(corpo),
      corpoHtml: `${heroPagina({ trilha: [{ href: secao.rota, titulo: secao.titulo }, { href: pag.rota, titulo: pag.titulo }, { titulo: x.titulo }], eyebrow: pag.titulo, titulo: x.titulo })}
    <section class="pg-corpo">
      <div class="wrap pg-grid">
        <article class="prosa">${corpo}</article>
        ${lateral(secao, pag.rota)}
      </div>
    </section>`,
    });
    escrever(x.rota, html);
    gerados.push(x.rota);
  }
  // e a listagem
  const cartoes = itens.map(x => {
    const linha = x.tipo === "croqui"
      ? [campo(x.html, "Grau"), campo(x.html, "Montanha")].filter(Boolean).join(" · ")
      : [campo(x.html, "Local"), campo(x.html, "Esforço") && "Esforço " + campo(x.html, "Esforço").toLowerCase()].filter(Boolean).join(" · ");
    return `<a class="cartao reveal" href="${x.rota}"><h3>${esc(x.titulo)}</h3>${linha ? `<p>${esc(linha)}</p>` : ""}<span class="ir">Ver ${x.tipo === "croqui" ? "croqui" : "ficha"} →</span></a>`;
  }).join("\n          ");
  const html = documento({
    rota: pag.rota, titulo: pag.titulo, descricao: pag.resumo,
    corpoHtml: `${heroPagina({ trilha: [{ href: secao.rota, titulo: secao.titulo }, { titulo: pag.titulo }], eyebrow: `Croquiteca · ${itens.length} ${pag.colecao === "croquis" ? "vias" : "trilhas"}`, titulo: pag.titulo, lead: pag.resumo })}
    <section class="pg-corpo">
      <div class="wrap">
        <div class="hub">
          ${cartoes}
        </div>
      </div>
    </section>`,
  });
  escrever(pag.rota, html);
  gerados.push(pag.rota);
}

/** Home: o index.html da raiz é o modelo; a versão final vai para a saída,
 *  com cabeçalho, rodapé e faixa de aviso iguais aos das páginas. */
function atualizarHome() {
  const raw = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  const crlf = raw.includes("\r\n");
  let s = raw.replace(/\r\n/g, "\n");
  s = s.replace(/  <!--CABECALHO-->\n[\s\S]*?  <!--\/CABECALHO-->\n/, `  <!--CABECALHO-->\n${cabecalho("/")}  <!--/CABECALHO-->\n`);
  s = s.replace(/  <!--RODAPE-->\n[\s\S]*?  <!--\/RODAPE-->\n/, `  <!--RODAPE-->\n${rodape()}  <!--/RODAPE-->\n`);
  if (!s.includes("/assets/site.js")) s = s.replace("</body>", `<script src="/assets/site.js" defer></script>\n</body>`);

  // faixa de aviso: o marcador fica logo depois do hero
  if (!s.includes("<!--AVISO-->")) s = s.replace(/(  <section class="hero">[\s\S]*?\n  <\/section>\n)/, `$1  <!--AVISO-->\n  <!--/AVISO-->\n`);
  // link do botão: só caminho do próprio site ou http(s) — nada de javascript:
  const hrefOk = AVISO && /^(\/|https?:\/\/)/.test(AVISO.href || "") ? AVISO.href : "";
  const faixa = AVISO ? `  <section class="aviso-faixa"${AVISO.ate ? ` data-ate="${esc(AVISO.ate)}"` : ""}>
    <div class="wrap">
      <div class="aviso-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
      <div class="aviso-txt"><p class="eyebrow">${esc(AVISO.rotulo)}</p><h2>${esc(AVISO.titulo)}</h2>${AVISO.texto ? `<p>${esc(AVISO.texto)}</p>` : ""}</div>
      ${hrefOk ? `<a class="btn btn-white" href="${esc(hrefOk)}">${esc(AVISO.botao || "Saiba mais")} →</a>` : ""}
    </div>
    ${/^\d{4}-\d{2}-\d{2}$/.test(AVISO.ate || "") ? `<script>(function(s){var f=document.currentScript.parentNode;var h=new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"});if(h>s)f.remove();})("${AVISO.ate}");</script>` : ""}
  </section>
` : "";
  s = s.replace(/  <!--AVISO-->\n[\s\S]*?  <!--\/AVISO-->\n/, `  <!--AVISO-->\n${faixa}  <!--/AVISO-->\n`);
  fs.mkdirSync(SAIDA, { recursive: true });
  fs.writeFileSync(path.join(SAIDA, "index.html"), crlf ? s.replace(/\n/g, "\r\n") : s);
}

// ---------------------------------------------------------------------------
// BANCO (o que a diretoria publica pelo painel)
// ---------------------------------------------------------------------------
/** Lê do PostgREST. Tabela inexistente (migração 16 não rodada) devolve null;
 *  qualquer outra falha derruba o build — e a Vercel mantém no ar o site anterior,
 *  em vez de publicar um site sem as publicações. */
async function sb(caminho, opcoes = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", ...(opcoes.headers || {}) },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Supabase ${caminho.split("?")[0]}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

function hojeSP() { return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); }

async function carregarBanco() {
  const pubs = await sb("publicacoes?select=slug,titulo,resumo,conteudo,categorias,capa_url,publicado_em,origem&publicado=eq.true&order=publicado_em.desc&limit=5000");
  if (pubs === null) {
    console.log("banco: tabela publicacoes ainda não existe (migração 16) — usando posts.json e o aviso fixo");
    return;
  }
  const importado = await sb("rpc/site_importacao_concluida", { method: "POST", body: "{}" });
  // antes da importação, os posts migrados vêm do JSON e os do painel somam por cima
  const base = importado ? {} : { ...POSTS };
  let ignorados = 0;
  for (const row of pubs) {
    const rota = `/${row.slug}/`;
    if (ROTAS_FIXAS.has(rota)) { avisos.push(`${rota}: publicação ignorada — o endereço é de uma página do site`); ignorados++; continue; }
    base[rota] = {
      tipo: "post",
      titulo: row.titulo,
      data: row.publicado_em,
      categorias: (row.categorias || []).map(slug => ({ slug })),
      capa: row.capa_url || "",
      resumo: row.resumo || "",
      // mesma limpeza do conteúdo migrado: tira script, atributos e iframes de fora
      html: limpar(row.conteudo || "").html,
    };
  }
  POSTS = base;
  console.log(`banco: ${pubs.length} publicações (${importado ? "fonte única" : "somadas aos posts do JSON"})${ignorados ? `, ${ignorados} ignoradas` : ""}`);

  const destaques = await sb("destaques?select=*&ativo=eq.true&order=criado_em.desc");
  if (destaques !== null) {
    const hoje = hojeSP();
    const d = destaques.find(x => !x.ate || x.ate >= hoje);
    AVISO = d ? { ate: d.ate || "", rotulo: d.rotulo, titulo: d.titulo, texto: d.texto || "", href: d.link_url || "", botao: d.botao_texto || "" } : null;
    console.log(`banco: destaque da home ${d ? `"${d.rotulo}"` : "nenhum vigente"}`);
  }

  const docs = await sb("documentos?select=*&publicado=eq.true&order=data.desc");
  if (docs !== null) {
    DOCUMENTOS = docs.filter(d => /^https:\/\//.test(d.arquivo_url));
    console.log(`banco: ${DOCUMENTOS.length} documentos`);
  }
}

/** Arquivos estáticos que acompanham as páginas. */
function copiarEstaticos() {
  // cópia arquivo a arquivo: o fs.cpSync falha em pastas do Google Drive no Windows
  const copiar = (de, para) => {
    fs.mkdirSync(para, { recursive: true });
    for (const e of fs.readdirSync(de, { withFileTypes: true })) {
      const a = path.join(de, e.name), b = path.join(para, e.name);
      if (e.isDirectory()) copiar(a, b); else fs.copyFileSync(a, b);
    }
  };
  for (const pasta of ["assets", "wp-content"]) copiar(path.join(RAIZ, pasta), path.join(SAIDA, pasta));
}

async function main() {
  // proteção: limpar a saída não pode apagar o repositório
  if (SAIDA === RAIZ || RAIZ.startsWith(SAIDA + path.sep)) throw new Error(`SAIDA inválida: ${SAIDA}`);
  fs.rmSync(SAIDA, { recursive: true, force: true });
  fs.mkdirSync(SAIDA, { recursive: true });

  await carregarBanco();
  registrarRotasDinamicas();
  copiarEstaticos();

  // primeiro as páginas (preenchem os resumos automáticos), depois os hubs
  for (const r of Object.keys(POSTS)) if (ROTAS_FIXAS.has(r)) throw new Error(`post colide com página: ${r}`);

  for (const s of SECOES) for (const p of s.paginas) if (p.rota && !p.colecao) paginaDeConteudo(s, p);
  for (const s of SECOES) for (const p of s.paginas) if (p.colecao) paginaColecao(s, p, p.colecao === "croquis" ? CROQUIS : TRILHAS);
  for (const a of AVULSAS) paginaDeConteudo(null, a);
  for (const p of postsOrdenados()) paginaPost(p);
  for (const c of CATEGORIAS) paginaCategoria(c);
  paginaArquivo();
  for (const s of SECOES) paginaHub(s);
  paginaContato();
  atualizarHome();

  console.log(`${gerados.length} páginas geradas + home em ${SAIDA}`);
  const unicos = [...new Set(avisos)];
  fs.writeFileSync(path.join(__dirname, "avisos.txt"), unicos.join("\n") + "\n");
  if (unicos.length) {
    const porPagina = {}, porDestino = {};
    for (const a of unicos) {
      const [pg, resto] = a.split(": ");
      porPagina[pg] = (porPagina[pg] || 0) + 1;
      const destino = (resto.match(/\(([^)]*)\)/) || [, ""])[1].split("/").slice(0, 2).join("/");
      porDestino[destino] = (porDestino[destino] || 0) + 1;
    }
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `    ${String(v).padStart(6)}  ${k}`).join("\n");
    console.log(`\n${unicos.length} avisos (lista em _fonte/avisos.txt)\n  páginas com mais avisos:\n${top(porPagina)}\n  destinos mais comuns:\n${top(porDestino)}`);
  }
}

main().catch(e => { console.error("\nFALHA NA GERAÇÃO:", e.message); process.exit(1); });
