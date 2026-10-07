/* =========================================================
   aula.js — motor da aula em página única
   1. Colorização dos blocos de código (HTML, CSS e JS)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Simuladores de largura de tela (iframes redimensionáveis)
   4. Laboratórios interativos
   5. Playground livre

   JavaScript puro, sem dependência. Copie para js/aula.js e
   acrescente os construtores de laboratório do seu assunto
   no objeto `construtores` (seção 4).
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. COLORIZAÇÃO DE CÓDIGO

     Análise linha a linha, não um analisador de verdade: os
     trechos de uma aula são curtos e bem-comportados.
     O conteúdo é lido de pre.textContent, então no HTML fonte
     todo "<" precisa estar escapado como &lt;.
     ====================================================== */

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function span(cls, txt) {
    return '<span class="' + cls + '">' + esc(txt) + "</span>";
  }

  /* valores de uma declaração CSS: textos, números e palavras-chave */
  function hlValor(v) {
    var re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(-?\d+(?:\.\d+)?[a-z%]*)|([a-zA-Z][-\w]*)/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(v)) !== null) {
      out += esc(v.slice(ultimo, m.index));
      if (m[1]) out += span("tk-str", m[1]);
      else if (m[2]) out += span("tk-num", m[2]);
      else out += span("tk-val", m[3]);
      ultimo = re.lastIndex;
    }
    return out + esc(v.slice(ultimo));
  }

  /* uma linha de CSS: seletor { propriedade: valor; } */
  function hlCss(linha) {
    var re = /([.#*:a-zA-Z&][^{};]*?)(\{)|([-\w]+)(\s*:\s*)([^;]*)(;?)|(\})/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[2]) out += span("tk-sel", m[1]) + esc(m[2]);
      else if (m[3]) out += span("tk-prop", m[3]) + esc(m[4]) + hlValor(m[5]) + esc(m[6] || "");
      else if (m[7]) out += span("tk-sel", m[7]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* uma linha de HTML: <tag atributo="valor"> */
  function hlHtml(linha) {
    var re = /(<\/?)([a-zA-Z][-\w]*)|([-\w:@.]+)(=)("[^"]*"|'[^']*')/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[2]) out += span("tk-tag", m[1] + m[2]);
      else out += span("tk-attr", m[3]) + esc(m[4]) + span("tk-str", m[5]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* uma linha de JavaScript */
  function hlJs(linha) {
    var re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(let|const|var|for|of|in|new|function|return|if|else|document|window)\b|(\d+)/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[1]) out += span("tk-str", m[1]);
      else if (m[2]) out += span("tk-val", m[2]);
      else out += span("tk-num", m[3]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  function hlLinha(linha, lang) {
    var iH = linha.indexOf("<!--");
    if (iH !== -1) return hlLinha(linha.slice(0, iH), lang) + span("tk-com", linha.slice(iH));
    var iC = linha.indexOf("/*");
    if (iC !== -1) return hlLinha(linha.slice(0, iC), lang) + span("tk-com", linha.slice(iC));
    var iJ = linha.indexOf("//");
    if (iJ !== -1 && lang === "js") return hlLinha(linha.slice(0, iJ), lang) + span("tk-com", linha.slice(iJ));

    if (lang === "js") return hlJs(linha);
    if (lang === "css") return hlCss(linha);
    if (/^\s*<[\/!a-zA-Z]/.test(linha) || /<\/?[a-zA-Z]/.test(linha)) return hlHtml(linha);
    return hlCss(linha);
  }

  /* exposta porque os laboratórios recolorem a saída a cada mudança */
  function colorir(pre) {
    var lang = pre.getAttribute("data-lang") || "auto";
    var fonte = pre.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    pre.innerHTML = fonte.split("\n").map(function (l) { return hlLinha(l, lang); }).join("\n");
  }

  document.querySelectorAll("pre.codigo").forEach(colorir);

  /* ======================================================
     2. NAVEGAÇÃO
     ====================================================== */

  var progresso = document.querySelector(".progresso");
  var botaoTopo = document.querySelector(".voltar-topo");
  var links = Array.prototype.slice.call(document.querySelectorAll(".barra-menu a"));
  var alvos = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function aoRolar() {
    var altura = document.documentElement.scrollHeight - window.innerHeight;
    var pct = altura > 0 ? (window.scrollY / altura) * 100 : 0;
    if (progresso) progresso.style.width = pct + "%";
    if (botaoTopo) botaoTopo.classList.toggle("visivel", window.scrollY > 600);

    var atual = -1;
    for (var i = 0; i < alvos.length; i++) {
      if (alvos[i].getBoundingClientRect().top <= 140) atual = i;
    }
    links.forEach(function (a, i) { a.classList.toggle("ativo", i === atual); });
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRolar);
  aoRolar();

  if (botaoTopo) {
    botaoTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ======================================================
     3. SIMULADORES DE TELA

     A altura do quadro é informada pela própria página do demo
     via postMessage (funciona por file://, ao contrário de ler
     contentDocument). Ver demos/demo.js.
     ====================================================== */

  function nomeBreakpoint(w) {
    if (w < 576) return "xs  (< 576)";
    if (w < 768) return "sm  (≥ 576)";
    if (w < 992) return "md  (≥ 768)";
    if (w < 1200) return "lg  (≥ 992)";
    if (w < 1400) return "xl  (≥ 1200)";
    return "xxl (≥ 1400)";
  }

  document.querySelectorAll(".simulador").forEach(function (sim) {
    var caixa = sim.querySelector(".simulador-caixa");
    var frame = sim.querySelector("iframe");
    var larg = sim.querySelector(".larg");
    var bp = sim.querySelector(".bp");

    function medir() {
      var w = Math.round(caixa.getBoundingClientRect().width);
      if (larg) larg.textContent = w + " px de largura";
      if (bp) bp.textContent = nomeBreakpoint(w);
    }

    if (window.ResizeObserver) new ResizeObserver(medir).observe(caixa);
    else window.addEventListener("resize", medir);
    medir();

    sim.querySelectorAll("button[data-larg]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-larg");
        caixa.style.width = v === "max" ? "100%" : v + "px";
        medir();
      });
    });

    if (frame) frame.setAttribute("scrolling", "no");
  });

  window.addEventListener("message", function (ev) {
    var d = ev.data;
    if (!d || d.tipo !== "altura-demo") return;
    document.querySelectorAll(".simulador iframe").forEach(function (f) {
      if (f.contentWindow === ev.source) f.style.height = Math.max(120, d.altura) + "px";
    });
  });

  /* ======================================================
     4. LABORATÓRIOS

     O HTML descreve o laboratório (data-lab, data-campo,
     data-palco, data-saida, data-eco); aqui mora só o
     construtor de cada um.

     Cada construtor recebe os valores dos controles e devolve
     uma string, ou { html, codigo } quando o que é renderizado
     difere do que deve ser mostrado como código.

     NUNCA emita atributo vazio (class="") no código gerado:
     monte o atributo inteiro condicionalmente.
     ====================================================== */

  var construtores = {

    /* EXEMPLO — espaçamento. Substitua pelos do seu assunto. */
    espaco: function (v) {
      var cls = v.tipo + (v.posicao === "todos" ? "" : v.posicao) + "-" + v.nivel;
      var rotulo = v.tipo === "p" ? "preenchimento interno" : "margem externa";
      return {
        html:
          '<div class="alvo-externo"><div class="alvo ' + cls + '">' + rotulo + "</div></div>" +
          '<p class="nota-demo" style="margin-top:12px">a área hachurada ao redor é o elemento pai</p>',
        codigo: '<div class="' + cls + '">\n  ...\n</div>'
      };
    }

  };

  document.querySelectorAll("[data-lab]").forEach(function (lab) {
    var construtor = construtores[lab.getAttribute("data-lab")];
    if (!construtor) return;
    var campos = Array.prototype.slice.call(lab.querySelectorAll("[data-campo]"));
    var palco = lab.querySelector("[data-palco]");
    var saida = lab.querySelector("[data-saida]");

    function atualizar() {
      var v = {};
      campos.forEach(function (c) {
        v[c.getAttribute("data-campo")] = c.type === "checkbox" ? String(c.checked) : c.value;
        var eco = lab.querySelector('[data-eco="' + c.getAttribute("data-campo") + '"]');
        if (eco) eco.textContent = c.value;
      });
      var r = construtor(v, lab);
      if (typeof r === "string") r = { html: r, codigo: r };
      palco.innerHTML = r.html;
      if (saida) { saida.textContent = r.codigo; colorir(saida); }
    }

    campos.forEach(function (c) {
      c.addEventListener("input", atualizar);
      c.addEventListener("change", atualizar);
    });
    atualizar();
  });

  /* ======================================================
     5. PLAYGROUND LIVRE

     Monta um documento completo em srcdoc. As URLs precisam ser
     absolutas: um documento srcdoc tem URL about:srcdoc e
     caminho relativo fica imprevisível.
     ====================================================== */

  var pg = document.querySelector("[data-playground]");
  if (pg) {
    var editor = pg.querySelector("textarea");
    var quadro = pg.querySelector("iframe");
    var seletor = pg.querySelector("[data-exemplos]");
    var btnRodar = pg.querySelector("[data-rodar]");
    var btnLimpar = pg.querySelector("[data-limpar]");

    /* ajuste os caminhos para o que a sua aula ensina */
    var cssFw = new URL("vendor/framework/framework.min.css", location.href).href;
    var jsFw = new URL("vendor/framework/framework.bundle.min.js", location.href).href;
    var baseImg = new URL("img/", location.href).href;

    var EXEMPLOS = {
      basico: '<div class="p-3">\n  <h1>Olá</h1>\n  <p>Edite este código e veja o resultado ao lado.</p>\n</div>'
    };

    function montarDocumento(corpo) {
      return "<!doctype html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"utf-8\">\n" +
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
        '<base href="' + baseImg + '">\n' +
        '<link rel="stylesheet" href="' + cssFw + '">\n' +
        "<style>body{padding:4px}</style>\n</head>\n<body>\n" +
        corpo +
        '\n<script src="' + jsFw + '"><\/script>\n</body>\n</html>';
    }

    function rodar() { quadro.srcdoc = montarDocumento(editor.value); }

    var timer;
    editor.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(rodar, 500);
    });
    if (btnRodar) btnRodar.addEventListener("click", rodar);
    if (btnLimpar) btnLimpar.addEventListener("click", function () { editor.value = ""; rodar(); });
    if (seletor) {
      seletor.addEventListener("change", function () {
        if (EXEMPLOS[seletor.value]) { editor.value = EXEMPLOS[seletor.value]; rodar(); }
      });
    }

    editor.value = EXEMPLOS.basico;
    rodar();
  }
})();
