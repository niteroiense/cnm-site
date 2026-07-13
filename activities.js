// Próximas atividades — puxa ao vivo do Supabase (leitura pública via anon key).
(function () {
  var SB_URL = "https://zuaktulejcxxihcpmlws.supabase.co";
  var SB_KEY = "sb_publishable_-Wr2lSS58vXWDPMk1hmzlQ_6Qxx3Mee";
  var H = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY };
  var APP = "https://cnm-aventura-hub-jade.vercel.app";
  var wrap = document.getElementById("cards");
  if (!wrap) return;

  var typeMap = {
    trilha: ["--t-trilha", "Trilha"], escalada: ["--t-escalada", "Escalada"],
    cicloturismo: ["--t-pedal", "Pedal"], pedal: ["--t-pedal", "Pedal"],
    social: ["--t-social", "Social"], curso: ["--t-curso", "Curso"],
    rapel: ["--t-social", "Rapel"], reuniao: ["--t-curso", "Reunião"],
  };
  var MES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  var DIA = ["dom","seg","ter","qua","qui","sex","sáb"];

  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g, function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function iniciais(nome){ return (nome||"—").trim().split(/\s+/).map(function(p){return p[0]||"";}).slice(0,2).join("").toUpperCase() || "—"; }
  function fmtData(d, h){
    if(!d) return "";
    var dt = new Date(d + "T00:00:00");
    var s = DIA[dt.getDay()] + ", " + String(dt.getDate()).padStart(2,"0") + " " + MES[dt.getMonth()];
    if(h) s += " · " + h.slice(0,5);
    return s;
  }
  function sb(path){ return fetch(SB_URL + "/rest/v1/" + path, { headers: H }).then(function(r){ return r.ok ? r.json() : []; }).catch(function(){ return []; }); }

  var cols = "id,titulo,tipo,data_inicio,horario_inicio,local,vagas_total,vagas_disponiveis,dificuldade_trilha,dificuldade_escalada,dificuldade_geral,guias_ids";
  var today = new Date().toISOString().slice(0,10);

  Promise.all([
    sb("eventos?select=" + cols + "&status=eq.aberto&data_inicio=gte." + today + "&order=data_inicio.asc&limit=6"),
    sb("associados?select=id,nome"),
  ]).then(function (res) {
    var evs = res[0] || [];
    var nomes = {}; (res[1] || []).forEach(function(a){ nomes[a.id] = a.nome; });
    if (evs.length === 0) {
      // sem futuras: mostra as mais recentes para a seção não ficar vazia
      return sb("eventos?select=" + cols + "&order=data_inicio.desc&limit=3").then(function(r){ render(r || [], nomes); });
    }
    render(evs, nomes);
  });

  function render(evs, nomes) {
    if (!evs.length) {
      wrap.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--ink-soft);padding:40px 0;">Nenhuma atividade agendada no momento. Fique de olho — em breve tem mais montanha! 🏔️</div>';
      return;
    }
    wrap.innerHTML = evs.map(function (e) {
      var tm = typeMap[e.tipo] || ["--t-social", e.tipo];
      var tvar = tm[0], tlabel = tm[1];
      var dif = e.dificuldade_trilha || e.dificuldade_escalada || e.dificuldade_geral || "";
      var total = e.vagas_total || 0, disp = e.vagas_disponiveis || 0;
      var pct = total > 0 ? Math.round((total - disp) / total * 100) : 0;
      var ratio = total > 0 ? disp / total : 0;
      var bar = ratio > 0.5 ? "var(--t-trilha)" : ratio > 0.2 ? "#E1a12f" : "#d1543f";
      var guias = Array.isArray(e.guias_ids) ? e.guias_ids : [];
      var guiaNome = guias.length ? (nomes[guias[0]] || "Guia CNM") : "Sem guia atribuído";
      var extra = guias.length > 1 ? "+" + (guias.length - 1) : "";
      var bg = "linear-gradient(150deg,var(" + tvar + "),color-mix(in srgb,var(" + tvar + ") 60%,#000))";
      return '<article class="card"><div class="top" style="background:var(' + tvar + ')"></div><div class="body">' +
        '<div class="head"><div class="corner"><span class="badge" style="background:color-mix(in srgb,var(' + tvar + ') 16%,transparent);color:var(' + tvar + ')">' + esc(tlabel) + '</span>' +
        (dif ? '<span class="badge soft">' + esc(dif) + '</span>' : '') + '</div>' +
        '<div class="guia"><div class="avatar" style="background:' + bg + '">' + iniciais(guiaNome) + (extra ? '<span class="plus">' + extra + '</span>' : '') + '</div>' +
        '<span class="lbl">Guia responsável</span><span class="nm">' + esc(guiaNome) + '</span></div></div>' +
        '<h3>' + esc(e.titulo) + '</h3>' +
        '<div class="meta"><div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' + esc(fmtData(e.data_inicio, e.horario_inicio)) + '</div>' +
        '<div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(e.local || "") + '</div></div>' +
        '<div><div class="vbar"><span style="width:' + pct + '%;background:' + bar + '"></span></div>' +
        '<div class="vlbl"><span>' + disp + ' de ' + total + ' vagas</span><span>' + (disp === 0 ? "Lotada" : "Aberta") + '</span></div></div>' +
        '<div class="cta-row"><a class="btn btn-ghost" href="' + APP + '" target="_blank" rel="noopener" style="width:100%">Inscreva-se</a></div>' +
        '</div></article>';
    }).join("");
  }
})();
