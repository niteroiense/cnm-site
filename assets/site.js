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
