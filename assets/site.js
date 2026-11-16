// Menu do celular (gaveta) e animação de entrada. Usado pela home e pelas páginas.
(function () {
  var gaveta = document.getElementById("gaveta");
  var abrir = document.querySelector(".nav-toggle");
  if (gaveta && abrir) {
    var fechar = function () {
      gaveta.classList.remove("aberta");
      document.body.classList.remove("travado");
      abrir.setAttribute("aria-expanded", "false");
      abrir.focus();
    };
    abrir.addEventListener("click", function () {
      gaveta.classList.add("aberta");
      document.body.classList.add("travado");
      abrir.setAttribute("aria-expanded", "true");
      var primeiro = gaveta.querySelector("summary, a, button");
      if (primeiro) primeiro.focus();
    });
    gaveta.querySelectorAll("[data-fechar]").forEach(function (el) { el.addEventListener("click", fechar); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && gaveta.classList.contains("aberta")) fechar();
    });
  }

  // na home este bloco já existe inline; aqui cobre as páginas internas
  var els = document.querySelectorAll(".reveal:not(.in)");
  if (!els.length) return;
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add("in"); });
})();

// ---------------------------------------------------------------------------
// Barra de cookies (Política de Cookies). O site não grava cookies próprios;
// o que pode gravar são mapas e vídeos de terceiros (Google Maps, YouTube),
// que o gerador deixa com data-src em vez de src. Só carregam com permissão.
// A escolha fica em localStorage ("cnm_consentimento").
(function () {
  var CHAVE = "cnm_consentimento";
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } }
  function gravar(terceiros) {
    try { localStorage.setItem(CHAVE, JSON.stringify({ v: 1, terceiros: !!terceiros, data: new Date().toISOString() })); } catch (e) {}
  }

  function carregar(iframe) {
    if (!iframe.getAttribute("data-src")) return;
    iframe.src = iframe.getAttribute("data-src");
    iframe.removeAttribute("data-src");
    var aviso = iframe.previousElementSibling;
    if (aviso && aviso.classList.contains("terceiro-aviso")) aviso.remove();
    iframe.classList.remove("terceiro-oculto");
  }
  function carregarTodos() { document.querySelectorAll("iframe[data-src]").forEach(carregar); }

  // aviso no lugar de cada mapa/vídeo bloqueado
  function avisos() {
    document.querySelectorAll("iframe[data-src]").forEach(function (f) {
      if (f.previousElementSibling && f.previousElementSibling.classList.contains("terceiro-aviso")) return;
      var servico = f.getAttribute("data-terceiro") || "conteúdo externo";
      var d = document.createElement("div");
      d.className = "terceiro-aviso";
      d.innerHTML = "<p><strong>" + servico + "</strong> pode gravar cookies próprios, por isso só carrega com a sua permissão.</p>" +
        "<div class=\"linha\"><button type=\"button\" class=\"btn btn-green\" data-um>Carregar</button>" +
        "<button type=\"button\" class=\"btn btn-ghost\" data-sempre>Permitir sempre</button>" +
        "<a href=\"/politica-de-cookies/\">Saiba mais</a></div>";
      d.querySelector("[data-um]").addEventListener("click", function () { carregar(f); });
      d.querySelector("[data-sempre]").addEventListener("click", function () { gravar(true); carregarTodos(); fecharBarra(); });
      f.classList.add("terceiro-oculto");
      f.parentNode.insertBefore(d, f);
    });
  }

  var barra = null;
  function fecharBarra() { if (barra) { barra.remove(); barra = null; } }
  function abrirBarra(escolher) {
    fecharBarra();
    var atual = ler();
    barra = document.createElement("div");
    barra.className = "cookie-barra";
    barra.setAttribute("role", "dialog");
    barra.setAttribute("aria-label", "Preferências de cookies");
    barra.innerHTML =
      "<div class=\"cookie-txt\"><strong>Cookies e privacidade</strong>" +
      "<p>Este site não usa cookies de estatística nem de publicidade. Mapas e vídeos do Google Maps e do YouTube só carregam se você permitir, porque esses serviços podem gravar cookies próprios. " +
      "<a href=\"/politica-de-cookies/\">Política de cookies</a> · <a href=\"/politica-de-privacidade/\">Privacidade</a></p>" +
      "<div class=\"cookie-opcoes\"" + (escolher ? "" : " hidden") + ">" +
      "<label><input type=\"checkbox\" checked disabled> Necessários — guardar esta escolha (sempre ativo)</label>" +
      "<label><input type=\"checkbox\" data-terceiros" + (atual && atual.terceiros ? " checked" : "") + "> Conteúdo de terceiros — mapas e vídeos</label></div></div>" +
      "<div class=\"cookie-botoes\">" +
      "<button type=\"button\" class=\"btn btn-ghost\" data-recusar>Recusar</button>" +
      "<button type=\"button\" class=\"btn btn-ghost\" data-escolher>" + (escolher ? "Salvar escolha" : "Escolher") + "</button>" +
      "<button type=\"button\" class=\"btn btn-green\" data-aceitar>Aceitar todos</button></div>";
    (document.querySelector(".cnm") || document.body).appendChild(barra);
    barra.querySelector("[data-aceitar]").addEventListener("click", function () { gravar(true); carregarTodos(); fecharBarra(); });
    barra.querySelector("[data-recusar]").addEventListener("click", function () { gravar(false); fecharBarra(); });
    barra.querySelector("[data-escolher]").addEventListener("click", function () {
      var op = barra.querySelector(".cookie-opcoes");
      if (op.hidden) { op.hidden = false; this.textContent = "Salvar escolha"; return; }
      var t = barra.querySelector("[data-terceiros]").checked;
      gravar(t); if (t) carregarTodos(); fecharBarra();
    });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-cookies]");
    if (a) { e.preventDefault(); abrirBarra(true); }
  });

  var c = ler();
  if (c && c.terceiros) carregarTodos(); else avisos();
  if (!c) abrirBarra(false);
})();