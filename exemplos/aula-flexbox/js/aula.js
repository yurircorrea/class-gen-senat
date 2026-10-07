/* =========================================================
   aula.js
   1. Colorizacao dos blocos de codigo (CSS e HTML)
   2. Barra de progresso, menu ativo e botao de voltar ao topo
   3. Laboratorio interativo de Flexbox
   ========================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------
     1. COLORIZACAO DE CODIGO
     ------------------------------------------------------ */

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function span(cls, txt) {
    return '<span class="' + cls + '">' + esc(txt) + "</span>";
  }

  /* valores de uma declaracao CSS: textos, numeros e palavras-chave */
  function hlValor(v) {
    var re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(-?\d+(?:\.\d+)?[a-z%]*)|([a-zA-Z][-\w]*)/g;
    var out = "";
    var ultimo = 0;
    var m;
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
    var out = "";
    var ultimo = 0;
    var m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[2]) {
        out += span("tk-sel", m[1]) + esc(m[2]);
      } else if (m[3]) {
        out += span("tk-prop", m[3]) + esc(m[4]) + hlValor(m[5]) + esc(m[6] || "");
      } else if (m[7]) {
        out += span("tk-sel", m[7]);
      }
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* uma linha de HTML: <tag atributo="valor"> */
  function hlHtml(linha) {
    var re = /(<\/?)([a-zA-Z][-\w]*)|([-\w:]+)(=)("[^"]*")/g;
    var out = "";
    var ultimo = 0;
    var m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[2]) out += span("tk-tag", m[1] + m[2]);
      else out += esc(m[3]) + esc(m[4]) + span("tk-str", m[5]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  function hlLinha(linha) {
    var i = linha.indexOf("/*");
    if (i !== -1) {
      return hlLinha(linha.slice(0, i)) + span("tk-com", linha.slice(i));
    }
    if (/^\s*<[\/!a-zA-Z]/.test(linha)) return hlHtml(linha);
    if (/<\/?[a-zA-Z]/.test(linha)) return hlHtml(linha);
    return hlCss(linha);
  }

  function colorizar(pre) {
    var fonte = pre.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    pre.innerHTML = fonte.split("\n").map(hlLinha).join("\n");
  }

  document.querySelectorAll("pre.codigo").forEach(colorizar);

  /* ------------------------------------------------------
     2. NAVEGACAO
     ------------------------------------------------------ */

  var progresso = document.querySelector(".progresso");
  var botaoTopo = document.querySelector(".voltar-topo");
  var links = Array.prototype.slice.call(document.querySelectorAll(".barra-menu a"));
  var alvos = links
    .map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    })
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
    links.forEach(function (a, i) {
      a.classList.toggle("ativo", i === atual);
    });
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRolar);
  aoRolar();

  if (botaoTopo) {
    botaoTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------
     3. LABORATORIO INTERATIVO
     ------------------------------------------------------ */

  var palco = document.getElementById("lab-palco");
  if (palco) {
    var campos = {
      direction: document.getElementById("lab-direction"),
      justify: document.getElementById("lab-justify"),
      align: document.getElementById("lab-align"),
      wrap: document.getElementById("lab-wrap"),
      gap: document.getElementById("lab-gap"),
      qtd: document.getElementById("lab-qtd")
    };
    var saidaGap = document.getElementById("lab-gap-valor");
    var saidaQtd = document.getElementById("lab-qtd-valor");
    var saidaCodigo = document.getElementById("lab-codigo");

    function desenharItens(n) {
      var html = "";
      for (var i = 1; i <= n; i++) {
        html += '<div class="it">' + i + "</div>";
      }
      palco.innerHTML = html;
    }

    function atualizar() {
      var d = campos.direction.value;
      var j = campos.justify.value;
      var a = campos.align.value;
      var w = campos.wrap.value;
      var g = campos.gap.value;
      var n = campos.qtd.value;

      palco.style.flexDirection = d;
      palco.style.justifyContent = j;
      palco.style.alignItems = a;
      palco.style.flexWrap = w;
      palco.style.gap = g + "px";
      desenharItens(parseInt(n, 10));

      if (saidaGap) saidaGap.textContent = g + "px";
      if (saidaQtd) saidaQtd.textContent = n + " itens";

      var css =
        ".caixa {\n" +
        "  display: flex;\n" +
        "  flex-direction: " + d + ";\n" +
        "  justify-content: " + j + ";\n" +
        "  align-items: " + a + ";\n" +
        "  flex-wrap: " + w + ";\n" +
        "  gap: " + g + "px;\n" +
        "}";
      if (saidaCodigo) {
        saidaCodigo.textContent = css;
        colorizar(saidaCodigo);
      }
    }

    Object.keys(campos).forEach(function (k) {
      if (campos[k]) campos[k].addEventListener("input", atualizar);
    });
    atualizar();
  }
})();
