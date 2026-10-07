/* =========================================================
   aula.js
   1. Colorização dos blocos de código (HTML e CSS)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Simuladores de tela (iframes redimensionáveis)
   4. Laboratórios interativos
   5. Playground livre
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. COLORIZAÇÃO DE CÓDIGO
     ====================================================== */

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function span(cls, txt) {
    return '<span class="' + cls + '">' + esc(txt) + "</span>";
  }

  /* valores de uma declaração CSS */
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

  /* uma linha de CSS */
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
    /* comentário HTML */
    var iH = linha.indexOf("<!--");
    if (iH !== -1) return hlLinha(linha.slice(0, iH), lang) + span("tk-com", linha.slice(iH));
    /* comentário CSS / JS em bloco */
    var iC = linha.indexOf("/*");
    if (iC !== -1) return hlLinha(linha.slice(0, iC), lang) + span("tk-com", linha.slice(iC));
    /* comentário JS de linha */
    var iJ = linha.indexOf("//");
    if (iJ !== -1 && lang === "js") return hlLinha(linha.slice(0, iJ), lang) + span("tk-com", linha.slice(iJ));

    if (lang === "js") return hlJs(linha);
    if (lang === "css") return hlCss(linha);
    if (/^\s*<[\/!a-zA-Z]/.test(linha) || /<\/?[a-zA-Z]/.test(linha)) return hlHtml(linha);
    return hlCss(linha);
  }

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

    /* altura do iframe informada pela própria página do demo */
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
     ====================================================== */

  var CORES = ["primary", "secondary", "success", "danger", "warning", "info", "light", "dark"];

  function attr(nome, valor) { return valor ? " " + nome + '="' + valor + '"' : ""; }

  var construtores = {

    /* ---- cores e utilitários visuais ---- */
    cores: function (v) {
      var c = ["p-4", "bg-" + v.bg];
      if (v.opacidade !== "100") c.push("bg-opacity-" + v.opacidade);
      c.push("text-" + v.texto);
      if (v.borda !== "nenhuma") c.push("border", "border-3", "border-" + v.borda);
      if (v.raio !== "0") c.push("rounded-" + v.raio);
      if (v.sombra !== "nenhuma") c.push(v.sombra);
      var cls = c.join(" ");
      return '<div class="' + cls + '">Caixa de demonstração com as classes aplicadas.</div>';
    },

    /* ---- sistema de grade ---- */
    grade: function (v) {
      var n = parseInt(v.qtd, 10);
      var cols = [];
      for (var i = 1; i <= n; i++) {
        var cls = ["col-" + v.xs];
        if (v.md !== "auto") cls.push("col-md-" + v.md);
        if (v.lg !== "auto") cls.push("col-lg-" + v.lg);
        var cor = CORES[(i - 1) % 6];
        var txt = cor === "warning" || cor === "light" ? "text-dark" : "text-white";
        cols.push(
          '  <div class="' + cls.join(" ") + '">\n' +
          '    <div class="bloco bg-' + cor + " " + txt + '">' + i + "</div>\n" +
          "  </div>"
        );
      }
      var linha = ["row", "g-" + v.gutter];
      if (v.justify !== "start") linha.push("justify-content-" + v.justify);
      if (v.align !== "stretch") linha.push("align-items-" + v.align);
      var codigo =
        '<div class="container">\n' +
        '  <div class="' + linha.join(" ") + '">\n' +
        cols.join("\n").replace(/^/gm, "  ") + "\n" +
        "  </div>\n" +
        "</div>";
      return {
        html: '<div class="demo-grade"><div class="container-fluid px-0"><div class="' + linha.join(" ") +
          '" style="min-height:120px">' + cols.join("") + "</div></div></div>",
        codigo: codigo
      };
    },

    /* ---- espaçamento ---- */
    espaco: function (v) {
      var cls = v.tipo + (v.posicao === "todos" ? "" : v.posicao) + "-" + v.nivel;
      var interno = v.tipo === "p"
        ? '<div class="alvo ' + cls + '">preenchimento interno</div>'
        : '<div class="alvo ' + cls + '">margem externa</div>';
      return {
        html: '<div class="alvo-externo">' + interno + "</div>" +
          '<p class="nota-demo" style="margin-top:12px">a área hachurada ao redor é o elemento pai</p>',
        codigo: '<div class="' + cls + '">\n  ...\n</div>'
      };
    },

    /* ---- tipografia ---- */
    tipografia: function (v) {
      var c = [];
      if (v.display !== "nenhum") c.push("display-" + v.display);
      if (v.estilo !== "nenhum") c.push(v.estilo);
      if (v.alinha !== "start") c.push("text-" + v.alinha);
      if (v.peso !== "nenhum") c.push("fw-" + v.peso);
      if (v.cor !== "nenhuma") c.push("text-" + v.cor);
      var cls = c.length ? ' class="' + c.join(" ") + '"' : "";
      var tag = v.tag;
      var texto = "Bootstrap aplica uma tipografia pronta ao seu site.";
      var html = "<" + tag + cls + ">" + texto + "</" + tag + ">";
      return { html: '<div class="bg-body">' + html + "</div>", codigo: html };
    },

    /* ---- botões ---- */
    botoes: function (v) {
      var c = ["btn"];
      c.push(v.contorno === "true" ? "btn-outline-" + v.cor : "btn-" + v.cor);
      if (v.tamanho !== "padrao") c.push("btn-" + v.tamanho);
      if (v.estado === "active") c.push("active");
      if (v.estado === "disabled") c.push("disabled");
      var icone = v.icone === "true" ? '<i class="bi bi-box-arrow-in-right me-1"></i>' : "";
      var btn = "<button" + ' class="' + c.join(" ") + '" type="button">' + icone + "Enviar</button>";
      if (v.largura === "true") {
        return {
          html: '<div class="d-grid">' + btn + "</div>",
          codigo: '<div class="d-grid">\n  ' + btn + "\n</div>"
        };
      }
      return { html: btn, codigo: btn };
    },

    /* ---- tabelas ---- */
    tabelas: function (v) {
      var c = ["table"];
      if (v.cor !== "nenhuma") c.push("table-" + v.cor);
      if (v.listras === "linhas") c.push("table-striped");
      if (v.listras === "colunas") c.push("table-striped-columns");
      if (v.hover === "true") c.push("table-hover");
      if (v.bordas === "com") c.push("table-bordered");
      if (v.bordas === "sem") c.push("table-borderless");
      if (v.compacta === "true") c.push("table-sm");
      var divisor = v.divisor === "true" ? ' class="table-group-divider"' : "";
      var tabela =
        '<table class="' + c.join(" ") + '">\n' +
        "  <thead>\n    <tr><th>#</th><th>Curso</th><th>Turno</th></tr>\n  </thead>\n" +
        "  <tbody" + divisor + ">\n" +
        "    <tr><td>1</td><td>Informática Básica</td><td>Noite</td></tr>\n" +
        "    <tr><td>2</td><td>Ciência de Dados</td><td>Manhã</td></tr>\n" +
        "    <tr><td>3</td><td>Redes de Computadores</td><td>Noite</td></tr>\n" +
        "  </tbody>\n</table>";
      if (v.responsiva === "true") {
        return {
          html: '<div class="table-responsive">' + tabela + "</div>",
          codigo: '<div class="table-responsive">\n' + tabela.replace(/^/gm, "  ") + "\n</div>"
        };
      }
      return { html: tabela, codigo: tabela };
    },

    /* ---- formulários ---- */
    formularios: function (v) {
      var extra = "";
      if (v.estado === "disabled") extra = " disabled";
      if (v.estado === "readonly") extra = " readonly";
      var val = v.estado === "valid" ? " is-valid" : v.estado === "invalid" ? " is-invalid" : "";
      var tam = v.tamanho !== "padrao" ? " form-control-" + v.tamanho : "";
      var tamSel = v.tamanho !== "padrao" ? " form-select-" + v.tamanho : "";
      var feedback = v.estado === "valid"
        ? '\n<div class="valid-feedback">Tudo certo!</div>'
        : v.estado === "invalid"
          ? '\n<div class="invalid-feedback">Informe um valor válido.</div>'
          : "";
      var cod;

      if (v.tipo === "control") {
        cod = '<label class="form-label" for="campo">Nome completo</label>\n' +
          '<input type="text" class="form-control' + tam + val + '" id="campo" placeholder="Digite aqui"' + extra + ">" + feedback;
      } else if (v.tipo === "select") {
        cod = '<label class="form-label" for="campo">Turno</label>\n' +
          '<select class="form-select' + tamSel + val + '" id="campo"' + extra + ">\n" +
          "  <option>Manhã</option>\n  <option>Noite</option>\n</select>" + feedback;
      } else if (v.tipo === "check") {
        cod = '<div class="form-check">\n' +
          '  <input class="form-check-input' + val + '" type="checkbox" id="campo"' + extra + ">\n" +
          '  <label class="form-check-label" for="campo">Aceito os termos</label>' + feedback.replace(/^\n/, "\n  ") + "\n</div>\n" +
          '<div class="form-check form-switch">\n' +
          '  <input class="form-check-input" type="checkbox" role="switch" id="campo2"' + extra + ">\n" +
          '  <label class="form-check-label" for="campo2">Receber avisos</label>\n</div>';
      } else if (v.tipo === "floating") {
        cod = '<div class="form-floating">\n' +
          '  <input type="email" class="form-control' + val + '" id="campo" placeholder="nome@email.com"' + extra + ">\n" +
          '  <label for="campo">Endereço de e-mail</label>\n</div>' + feedback;
      } else {
        cod = '<div class="input-group">\n' +
          '  <span class="input-group-text">R$</span>\n' +
          '  <input type="text" class="form-control' + tam + val + '" aria-label="Valor"' + extra + ">\n" +
          '  <button class="btn btn-success" type="button">Aplicar</button>\n</div>' + feedback;
      }
      return { html: cod, codigo: cod };
    },

    /* ---- componentes ---- */
    componentes: function (v) {
      var cor = v.cor, cod;
      if (v.componente === "alert") {
        cod = '<div class="alert alert-' + cor + (v.fechar === "true" ? " alert-dismissible fade show" : "") + '" role="alert">\n' +
          '  <i class="bi bi-info-circle me-1"></i>\n' +
          "  Mensagem de alerta com <a href=\"#\" class=\"alert-link\">um link</a>.\n" +
          (v.fechar === "true" ? '  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>\n' : "") +
          "</div>";
      } else if (v.componente === "badge") {
        cod = '<h4>Mensagens <span class="badge text-bg-' + cor + (v.pill === "true" ? " rounded-pill" : "") + '">12</span></h4>\n' +
          '<p>Situação: <span class="badge text-bg-' + cor + (v.pill === "true" ? " rounded-pill" : "") + '">ativo</span></p>';
      } else if (v.componente === "card") {
        cod = '<div class="card" style="max-width: 22rem">\n' +
          '  <img src="img/foto-1.svg" class="card-img-top" alt="Capa do card">\n' +
          '  <div class="card-body">\n' +
          '    <h5 class="card-title">Título do card</h5>\n' +
          '    <p class="card-text">Informações complementares sobre o item listado.</p>\n' +
          '    <a href="#" class="btn btn-' + cor + '">Saiba mais</a>\n' +
          "  </div>\n</div>";
      } else if (v.componente === "progress") {
        cod = '<div class="progress" role="progressbar" aria-label="Exemplo"\n' +
          '     aria-valuenow="' + v.valor + '" aria-valuemin="0" aria-valuemax="100">\n' +
          '  <div class="progress-bar bg-' + cor +
          (v.listras === "true" ? " progress-bar-striped" : "") +
          (v.animada === "true" ? " progress-bar-animated" : "") +
          '" style="width: ' + v.valor + '%">' + v.valor + "%</div>\n</div>";
      } else if (v.componente === "spinner") {
        cod = '<div class="spinner-border text-' + cor + '" role="status">\n' +
          '  <span class="visually-hidden">Carregando...</span>\n</div>\n' +
          '<div class="spinner-grow text-' + cor + '" role="status">\n' +
          '  <span class="visually-hidden">Carregando...</span>\n</div>';
      } else {
        cod = '<div class="toast fade show" role="alert" aria-live="assertive" aria-atomic="true">\n' +
          '  <div class="toast-header">\n' +
          '    <span class="badge text-bg-' + cor + ' me-2">!</span>\n' +
          '    <strong class="me-auto">Aviso</strong>\n' +
          '    <small class="text-body-secondary">agora mesmo</small>\n' +
          '    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>\n' +
          "  </div>\n" +
          '  <div class="toast-body">Isso é uma caixa de notificação.</div>\n</div>';
      }
      return { html: cod, codigo: cod };
    }
  };

  document.querySelectorAll("[data-lab]").forEach(function (lab) {
    var nome = lab.getAttribute("data-lab");
    var construtor = construtores[nome];
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

    campos.forEach(function (c) { c.addEventListener("input", atualizar); c.addEventListener("change", atualizar); });
    atualizar();
  });

  /* ======================================================
     5. PLAYGROUND LIVRE
     ====================================================== */

  var pg = document.querySelector("[data-playground]");
  if (pg) {
    var editor = pg.querySelector("textarea");
    var quadro = pg.querySelector("iframe");
    var seletor = pg.querySelector("[data-exemplos]");
    var btnRodar = pg.querySelector("[data-rodar]");
    var btnLimpar = pg.querySelector("[data-limpar]");

    var cssBs = new URL("vendor/bootstrap/bootstrap.min.css", location.href).href;
    var jsBs = new URL("vendor/bootstrap/bootstrap.bundle.min.js", location.href).href;
    var cssIco = new URL("vendor/bootstrap-icons/bootstrap-icons.min.css", location.href).href;
    var baseImg = new URL("img/", location.href).href;

    var EXEMPLOS = {
      grade:
        '<div class="container py-3">\n' +
        '  <div class="row g-3">\n' +
        '    <div class="col-12 col-md-8">\n' +
        '      <div class="p-3 bg-primary text-white rounded">col-12 col-md-8</div>\n' +
        "    </div>\n" +
        '    <div class="col-12 col-md-4">\n' +
        '      <div class="p-3 bg-danger text-white rounded">col-12 col-md-4</div>\n' +
        "    </div>\n" +
        "  </div>\n" +
        "</div>",
      componentes:
        '<div class="container py-3">\n' +
        '  <div class="alert alert-success" role="alert">\n' +
        '    <i class="bi bi-check-circle me-1"></i> Componente de alerta.\n' +
        "  </div>\n\n" +
        '  <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exemplo">\n' +
        "    Abrir modal\n" +
        "  </button>\n\n" +
        '  <div class="modal fade" id="exemplo" tabindex="-1">\n' +
        '    <div class="modal-dialog">\n' +
        '      <div class="modal-content">\n' +
        '        <div class="modal-header">\n' +
        '          <h5 class="modal-title">Olá!</h5>\n' +
        '          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>\n' +
        "        </div>\n" +
        '        <div class="modal-body">O JavaScript do Bootstrap já está carregado aqui.</div>\n' +
        "      </div>\n" +
        "    </div>\n" +
        "  </div>\n" +
        "</div>",
      formulario:
        '<div class="container py-3">\n' +
        '  <form class="row g-3">\n' +
        '    <div class="col-md-6">\n' +
        '      <label class="form-label" for="nome">Nome</label>\n' +
        '      <input type="text" class="form-control" id="nome">\n' +
        "    </div>\n" +
        '    <div class="col-md-6">\n' +
        '      <label class="form-label" for="turno">Turno</label>\n' +
        '      <select class="form-select" id="turno">\n' +
        "        <option>Manhã</option>\n        <option>Noite</option>\n" +
        "      </select>\n" +
        "    </div>\n" +
        '    <div class="col-12 form-check ms-2">\n' +
        '      <input class="form-check-input" type="checkbox" id="ok">\n' +
        '      <label class="form-check-label" for="ok">Aceito os termos</label>\n' +
        "    </div>\n" +
        '    <div class="col-12">\n' +
        '      <button class="btn btn-success" type="button">Enviar</button>\n' +
        "    </div>\n" +
        "  </form>\n" +
        "</div>",
      cards:
        '<div class="container py-3">\n' +
        '  <div class="row g-3">\n' +
        '    <div class="col-12 col-sm-6 col-lg-4">\n' +
        '      <div class="card h-100">\n' +
        '        <img src="foto-1.svg" class="card-img-top" alt="">\n' +
        '        <div class="card-body">\n' +
        '          <h5 class="card-title">Card 1</h5>\n' +
        '          <p class="card-text">Duplique esta coluna para criar novos cards.</p>\n' +
        '          <a href="#" class="btn btn-primary">Saiba mais</a>\n' +
        "        </div>\n" +
        "      </div>\n" +
        "    </div>\n" +
        "  </div>\n" +
        "</div>",
      tema:
        '<div class="container py-3" data-bs-theme="dark">\n' +
        '  <div class="p-4 bg-body text-body rounded">\n' +
        "    <h4>Modo escuro (novidade da versão 5.3)</h4>\n" +
        '    <p class="text-body-secondary">Todo este bloco usa data-bs-theme="dark".</p>\n' +
        '    <button class="btn btn-primary">Botão</button>\n' +
        "  </div>\n" +
        "</div>"
    };

    function montarDocumento(corpo) {
      return "<!doctype html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"utf-8\">\n" +
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
        '<base href="' + baseImg + '">\n' +
        '<link rel="stylesheet" href="' + cssBs + '">\n' +
        '<link rel="stylesheet" href="' + cssIco + '">\n' +
        "<style>body{padding:4px}</style>\n</head>\n<body>\n" +
        corpo +
        '\n<script src="' + jsBs + '"><\/script>\n</body>\n</html>';
    }

    function rodar() {
      quadro.srcdoc = montarDocumento(editor.value);
    }

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

    editor.value = EXEMPLOS.grade;
    rodar();
  }
})();
