/* =========================================================
   aula.js — motor da aula em página única
   1. Colorização dos painéis (HTML, CSS, JS, fórmula, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Simuladores de largura de tela (iframes redimensionáveis)
   4. Formatos de número (moeda, porcentagem…) em pt-BR
   5. Mini planilha com fórmulas em português
   6. Laboratórios interativos (construtores)
   7. Playground livre (só em aulas de código)
   8. Quiz de verificação
   9. Tour: passo a passo clicável sobre um aplicativo

   JavaScript puro, sem dependência. Copie para js/aula.js,
   apague as seções que a aula não usa e acrescente os
   construtores de laboratório do seu assunto (seção 6).
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. COLORIZAÇÃO

     Análise linha a linha, não um analisador de verdade: os
     trechos de uma aula são curtos e bem-comportados.
     O conteúdo é lido de pre.textContent, então no HTML fonte
     todo "<" precisa estar escapado como &lt;.

     data-lang no <pre>: html, css, js, formula (Excel em
     português e DAX do Power BI), texto (sem cor). Sem
     data-lang, cada linha é tratada como HTML ou CSS.
     ====================================================== */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  /* uma linha de fórmula: =SOMA(B2:B5), =SE(C2>=7;"Aprovado";"Recuperação"),
     Total = SUM(Vendas[Valor]). Função em ciano, referência em azul-claro,
     texto entre aspas em amarelo, número em lilás. */
  function hlFormula(linha) {
    var re = /("(?:[^"]|"")*")|(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?(?![\w(])|[A-Za-zÀ-ú_][\wÀ-ú]*\[[^\]]+\]|\[[^\]]+\])|([A-Za-zÀ-ú][\wÀ-ú.]*)(?=\s*\()|(\d+(?:,\d+)?%?)/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[1]) out += span("tk-str", m[1]);
      else if (m[2]) out += span("tk-ref", m[2]);
      else if (m[3]) out += span("tk-fn", m[3]);
      else out += span("tk-num", m[4]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  function hlLinha(linha, lang) {
    if (lang === "texto") return esc(linha);
    if (lang === "formula") {
      var iF = linha.indexOf("//");
      if (iF !== -1) return hlFormula(linha.slice(0, iF)) + span("tk-com", linha.slice(iF));
      return hlFormula(linha);
    }
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
     4. FORMATOS DE NÚMERO (usados pela planilha e pelos labs)
     ====================================================== */

  function formatar(v, formato) {
    if (typeof v !== "number" || !isFinite(v)) return v;
    var o = { maximumFractionDigits: 10, useGrouping: false };
    if (formato === "moeda") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (formato === "pct") return (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0, useGrouping: false }) + "%";
    if (formato === "pct2") return (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }) + "%";
    if (formato === "int") o = { maximumFractionDigits: 0 };
    if (formato === "dec1") o = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
    if (formato === "dec2") o = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return v.toLocaleString("pt-BR", o);
  }

  /* ======================================================
     5. MINI PLANILHA

     Uma planilha de verdade, pequena: o aluno vê a fórmula na
     barra, o resultado na célula e as células citadas coloridas
     (como no Excel). Fórmulas em português, com ";" separando
     argumentos e vírgula decimal.

     Marcação: uma <table class="planilha-grade"> SEM cabeçalhos,
     dentro de <div class="planilha" data-planilha>. O motor
     acrescenta as letras das colunas e os números das linhas,
     a barra de fórmulas e calcula tudo. Fórmula vai no texto
     da célula (=SOMA(B2:B4)) ou em data-f.

       data-selecionar="D5"    célula selecionada ao abrir
       data-somente-leitura    o aluno vê as fórmulas mas não edita
       data-formatos="texto,moeda,int"  formato por coluna
       <td data-formato="pct"> formato de uma célula
       <td class="titulo">     cabeçalho da tabela de dados

     Funções: SOMA MÉDIA MÁXIMO MÍNIMO CONT.NÚM CONT.VALORES
     CONTAR.VAZIO CONT.SE SOMASE MÉDIASE SE SEERRO E OU NÃO
     ARRED INT ABS CONCAT CONCATENAR MAIÚSCULA MINÚSCULA
     ARRUMAR ESQUERDA DIREITA NÚM.CARACT PROCV
     ====================================================== */

  function Erro(cod) { this.cod = cod; }
  function eErro(v) { return v instanceof Erro; }

  function letraColuna(i) {
    var s = "";
    i += 1;
    while (i > 0) { var r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }
  function indiceColuna(letras) {
    var n = 0;
    for (var i = 0; i < letras.length; i++) n = n * 26 + (letras.charCodeAt(i) - 64);
    return n - 1;
  }
  function semAcento(s) {
    return s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "") : s;
  }

  /* "1.234,5" -> 1234.5 ; "12%" -> 0.12 ; o resto é texto */
  function lerNumero(t) {
    var s = String(t).trim();
    if (!/^-?(\d{1,3}(\.\d{3})+|\d+)(,\d+)?%?$/.test(s)) return null;
    var pct = /%$/.test(s);
    var n = parseFloat(s.replace(/%$/, "").replace(/\./g, "").replace(",", "."));
    return pct ? n / 100 : n;
  }

  function lexar(f) {
    var re = /\s*(?:("(?:[^"]|"")*")|(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?)(?![\w(])|(\d+(?:,\d+)?)|([A-Za-zÀ-ú][\wÀ-ú.]*)(?=\s*\()|(VERDADEIRO|FALSO)\b|(<>|<=|>=|[-+*\/^&=<>();%]))/gy;
    var toks = [], m, pos = 0;
    while (pos < f.length) {
      re.lastIndex = pos;
      m = re.exec(f);
      if (!m || m[0].length === 0) {
        if (/^\s*$/.test(f.slice(pos))) break;
        throw new Erro("#NOME?");
      }
      pos = re.lastIndex;
      if (m[1]) toks.push({ t: "str", v: m[1].slice(1, -1).replace(/""/g, '"') });
      else if (m[2]) toks.push({ t: "ref", v: m[2].replace(/\$/g, "") });
      else if (m[3]) toks.push({ t: "num", v: parseFloat(m[3].replace(",", ".")) });
      else if (m[4]) toks.push({ t: "fn", v: semAcento(m[4].toUpperCase()) });
      else if (m[5]) toks.push({ t: "bool", v: m[5] === "VERDADEIRO" });
      else toks.push({ t: "op", v: m[6] });
    }
    return toks;
  }

  /* análise descendente com a precedência do Excel:
     comparação < & < + - < * / < ^ < sinal < % */
  function analisar(toks) {
    var i = 0;
    function olha() { return toks[i]; }
    function eOp(v) { var k = toks[i]; return k && k.t === "op" && k.v === v; }
    function exige(v) { if (!eOp(v)) throw new Erro("#NOME?"); i++; }

    function comparacao() {
      var e = concat();
      while (olha() && olha().t === "op" && /^(=|<>|<=|>=|<|>)$/.test(olha().v)) {
        var op = toks[i++].v; e = { k: "bin", op: op, a: e, b: concat() };
      }
      return e;
    }
    function concat() {
      var e = soma();
      while (eOp("&")) { i++; e = { k: "bin", op: "&", a: e, b: soma() }; }
      return e;
    }
    function soma() {
      var e = produto();
      while (eOp("+") || eOp("-")) { var op = toks[i++].v; e = { k: "bin", op: op, a: e, b: produto() }; }
      return e;
    }
    function produto() {
      var e = potencia();
      while (eOp("*") || eOp("/")) { var op = toks[i++].v; e = { k: "bin", op: op, a: e, b: potencia() }; }
      return e;
    }
    function potencia() {
      var e = sinal();
      while (eOp("^")) { i++; e = { k: "bin", op: "^", a: e, b: sinal() }; }
      return e;
    }
    function sinal() {
      if (eOp("-")) { i++; return { k: "neg", a: sinal() }; }
      if (eOp("+")) { i++; return sinal(); }
      return porcento();
    }
    function porcento() {
      var e = primario();
      while (eOp("%")) { i++; e = { k: "bin", op: "/", a: e, b: { k: "num", v: 100 } }; }
      return e;
    }
    function primario() {
      var k = toks[i++];
      if (!k) throw new Erro("#NOME?");
      if (k.t === "num") return { k: "num", v: k.v };
      if (k.t === "str") return { k: "str", v: k.v };
      if (k.t === "bool") return { k: "bool", v: k.v };
      if (k.t === "ref") return { k: "ref", v: k.v };
      if (k.t === "fn") {
        exige("(");
        var args = [];
        if (!eOp(")")) {
          args.push(comparacao());
          while (eOp(";")) { i++; args.push(comparacao()); }
        }
        exige(")");
        return { k: "fn", nome: k.v, args: args };
      }
      if (k.t === "op" && k.v === "(") { var e = comparacao(); exige(")"); return e; }
      throw new Erro("#NOME?");
    }

    var arvore = comparacao();
    if (i < toks.length) throw new Erro("#NOME?");
    return arvore;
  }

  function Planilha(raiz) {
    this.raiz = raiz;
    this.tabela = raiz.querySelector("table");
    this.somenteLeitura = raiz.hasAttribute("data-somente-leitura");
    this.celulas = {};       /* "B3" -> { td, bruto, formato } */
    this.montar();
  }

  Planilha.prototype.montar = function () {
    var self = this, tab = this.tabela;
    var formatos = (tab.getAttribute("data-formatos") || this.raiz.getAttribute("data-formatos") || "").split(",");
    var linhas = Array.prototype.slice.call(tab.querySelectorAll("tr"));
    var nCols = 0;
    linhas.forEach(function (tr, li) {
      var tds = Array.prototype.slice.call(tr.children);
      nCols = Math.max(nCols, tds.length);
      tds.forEach(function (td, ci) {
        var id = letraColuna(ci) + (li + 1);
        var bruto = td.hasAttribute("data-f") ? td.getAttribute("data-f") : td.textContent.trim();
        self.celulas[id] = {
          td: td, bruto: bruto,
          formato: td.getAttribute("data-formato") || (formatos[ci] || "").trim() || "geral"
        };
        td.setAttribute("data-celula", id);
      });
      var th = document.createElement("th");
      th.textContent = li + 1;
      th.setAttribute("data-lin", li + 1);
      tr.insertBefore(th, tr.firstChild);
    });

    var thead = document.createElement("thead"), trh = document.createElement("tr");
    trh.appendChild(document.createElement("th"));
    for (var c = 0; c < nCols; c++) {
      var th = document.createElement("th");
      th.textContent = letraColuna(c);
      th.setAttribute("data-col", letraColuna(c));
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    tab.insertBefore(thead, tab.firstChild);
    if (!tab.parentNode.classList.contains("planilha-rolagem")) {
      var rol = document.createElement("div");
      rol.className = "planilha-rolagem";
      tab.parentNode.insertBefore(rol, tab);
      rol.appendChild(tab);
    }

    /* barra de fórmulas: caixa de nome + fx + entrada */
    var barra = this.raiz.querySelector(".planilha-barra");
    if (!barra) {
      barra = document.createElement("div");
      barra.className = "planilha-barra";
      barra.innerHTML = '<span class="planilha-nome"></span><span class="planilha-fx">fx</span>' +
        '<input class="planilha-entrada" type="text" spellcheck="false" aria-label="Barra de fórmulas">';
      this.raiz.insertBefore(barra, this.raiz.firstChild);
    }
    this.nome = barra.querySelector(".planilha-nome");
    this.entrada = barra.querySelector(".planilha-entrada");
    if (this.somenteLeitura) this.entrada.readOnly = true;

    tab.addEventListener("click", function (ev) {
      var td = ev.target.closest("td[data-celula]");
      if (td) self.selecionar(td.getAttribute("data-celula"));
    });
    this.entrada.addEventListener("input", function () {
      if (self.somenteLeitura || !self.atual) return;
      self.celulas[self.atual].bruto = self.entrada.value;
      self.calcular();
    });
    this.entrada.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" || !self.atual) return;
      ev.preventDefault();
      var m = /^([A-Z]+)(\d+)$/.exec(self.atual);
      var abaixo = m[1] + (parseInt(m[2], 10) + 1);
      if (self.celulas[abaixo]) self.selecionar(abaixo);
    });

    this.calcular();
    var inicial = this.raiz.getAttribute("data-selecionar");
    this.selecionar(this.celulas[inicial] ? inicial : "A1");
  };

  /* valor de uma célula (com memória por rodada e detecção de ciclo) */
  Planilha.prototype.valor = function (id, pilha) {
    if (this.memo.hasOwnProperty(id)) return this.memo[id];
    var cel = this.celulas[id];
    if (!cel) return "";                         /* fora da grade: vazia */
    if (pilha.indexOf(id) !== -1) {          /* referência circular: o Excel mostra 0 */
      var ciclo = this.ciclo;
      pilha.slice(pilha.indexOf(id)).forEach(function (x) { ciclo[x] = true; });
      return 0;
    }
    var b = cel.bruto, v;
    if (b === "") v = "";
    else if (b.charAt(0) === "=") {
      try {
        v = this.avaliar(analisar(lexar(b.slice(1))), pilha.concat(id));
        if (v && v.intervalo) v = new Erro("#VALOR!");
      } catch (e) {
        v = eErro(e) ? e : new Erro("#NOME?");
      }
    }
    else if (b.charAt(0) === "'") v = b.slice(1);
    else { var n = lerNumero(b); v = n === null ? b : n; }
    if (this.ciclo[id]) v = 0;
    this.memo[id] = v;
    return v;
  };

  Planilha.prototype.intervalo = function (ref, pilha) {
    var p = ref.split(":"), a = /^([A-Z]+)(\d+)$/.exec(p[0]), b = /^([A-Z]+)(\d+)$/.exec(p[1] || p[0]);
    var c1 = indiceColuna(a[1]), c2 = indiceColuna(b[1]), l1 = +a[2], l2 = +b[2];
    var linhas = [];
    for (var l = Math.min(l1, l2); l <= Math.max(l1, l2); l++) {
      var linha = [];
      for (var c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) linha.push(this.valor(letraColuna(c) + l, pilha));
      linhas.push(linha);
    }
    return { intervalo: true, linhas: linhas };
  };

  function achatar(v) {
    if (v && v.intervalo) return v.linhas.reduce(function (a, l) { return a.concat(l); }, []);
    return [v];
  }
  function paraNumero(v) {
    if (eErro(v)) return v;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (v === "") return 0;
    var n = lerNumero(v);
    return n === null ? new Erro("#VALOR!") : n;
  }
  function paraTexto(v) {
    if (typeof v === "boolean") return v ? "VERDADEIRO" : "FALSO";
    if (typeof v === "number") return formatar(v, "geral");
    return String(v);
  }
  function paraLogico(v) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (v === "") return false;
    var t = String(v).toUpperCase();
    if (t === "VERDADEIRO") return true;
    if (t === "FALSO") return false;
    return new Erro("#VALOR!");
  }
  function comparar(a, b) {
    var ordem = function (v) { return typeof v === "number" || v === "" ? 0 : typeof v === "string" ? 1 : 2; };
    if (a === "" && typeof b === "string") a = "";
    else if (a === "") a = 0;
    if (b === "" && typeof a === "string") b = "";
    else if (b === "") b = 0;
    if (ordem(a) !== ordem(b)) return ordem(a) - ordem(b);
    if (typeof a === "string") { a = a.toLowerCase(); b = b.toLowerCase(); }
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /* critério de CONT.SE / SOMASE: 7, ">=7", "<>Pago", "Ana*" */
  function criterio(c) {
    var op = "=", alvo = c;
    if (typeof c === "string") {
      var m = /^(<>|<=|>=|=|<|>)?(.*)$/.exec(c);
      op = m[1] || "=";
      var n = lerNumero(m[2]);
      alvo = n === null ? m[2] : n;
    }
    var curinga = typeof alvo === "string" && /[*?]/.test(alvo)
      ? new RegExp("^" + alvo.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i")
      : null;
    return function (v) {
      if (curinga && (op === "=" || op === "<>")) {
        var ok = typeof v === "string" && curinga.test(v);
        return op === "=" ? ok : !ok;
      }
      if (typeof alvo === "number" && typeof v !== "number") return op === "<>";
      if (typeof alvo === "string" && typeof v !== "string") return op === "<>";
      var r = comparar(v, alvo);
      return op === "=" ? r === 0 : op === "<>" ? r !== 0 : op === "<" ? r < 0 : op === ">" ? r > 0 : op === "<=" ? r <= 0 : r >= 0;
    };
  }

  Planilha.prototype.avaliar = function (n, pilha) {
    var self = this;
    function ev(x) { return self.avaliar(x, pilha); }
    function escalar(x) { var v = ev(x); return v && v.intervalo ? new Erro("#VALOR!") : v; }
    function num(x) { return paraNumero(escalar(x)); }
    function numeros(args) {   /* números citados direto + números dentro de intervalos */
      var out = [];
      for (var i = 0; i < args.length; i++) {
        var v = ev(args[i]);
        if (v && v.intervalo) {
          var lista = achatar(v);
          for (var j = 0; j < lista.length; j++) {
            if (eErro(lista[j])) return lista[j];
            if (typeof lista[j] === "number") out.push(lista[j]);
          }
        } else {
          var nn = paraNumero(v);
          if (eErro(nn)) return nn;
          out.push(nn);
        }
      }
      return out;
    }

    switch (n.k) {
      case "num": case "str": case "bool": return n.v;
      case "ref": return n.v.indexOf(":") !== -1 ? this.intervalo(n.v, pilha) : this.valor(n.v, pilha);
      case "neg": var a0 = num(n.a); return eErro(a0) ? a0 : -a0;
      case "bin":
        var a = escalar(n.a), b = escalar(n.b);
        if (eErro(a)) return a;
        if (eErro(b)) return b;
        if (n.op === "&") return paraTexto(a) + paraTexto(b);
        if (/^(=|<>|<=|>=|<|>)$/.test(n.op)) {
          var r = comparar(a, b);
          return n.op === "=" ? r === 0 : n.op === "<>" ? r !== 0 : n.op === "<" ? r < 0 : n.op === ">" ? r > 0 : n.op === "<=" ? r <= 0 : r >= 0;
        }
        a = paraNumero(a); b = paraNumero(b);
        if (eErro(a)) return a;
        if (eErro(b)) return b;
        if (n.op === "+") return a + b;
        if (n.op === "-") return a - b;
        if (n.op === "*") return a * b;
        if (n.op === "/") return b === 0 ? new Erro("#DIV/0!") : a / b;
        return Math.pow(a, b);
      case "fn": return this.funcao(n.nome, n.args, ev, escalar, num, numeros);
    }
    return new Erro("#NOME?");
  };

  Planilha.prototype.funcao = function (nome, args, ev, escalar, num, numeros) {
    var lista, v, i, t;
    switch (nome) {
      case "SOMA":
        lista = numeros(args); if (eErro(lista)) return lista;
        return lista.reduce(function (s, x) { return s + x; }, 0);
      case "MEDIA":
        lista = numeros(args); if (eErro(lista)) return lista;
        return lista.length ? lista.reduce(function (s, x) { return s + x; }, 0) / lista.length : new Erro("#DIV/0!");
      case "MAXIMO":
        lista = numeros(args); if (eErro(lista)) return lista;
        return lista.length ? Math.max.apply(null, lista) : 0;
      case "MINIMO":
        lista = numeros(args); if (eErro(lista)) return lista;
        return lista.length ? Math.min.apply(null, lista) : 0;
      case "CONT.NUM":
        return args.reduce(function (s, a) {
          return s + achatar(ev(a)).filter(function (x) { return typeof x === "number"; }).length;
        }, 0);
      case "CONT.VALORES":
        return args.reduce(function (s, a) {
          return s + achatar(ev(a)).filter(function (x) { return x !== ""; }).length;
        }, 0);
      case "CONTAR.VAZIO":
        return achatar(ev(args[0])).filter(function (x) { return x === ""; }).length;
      case "CONT.SE":
      case "SOMASE":
      case "MEDIASE":
        if (args.length < 2) return new Erro("#NOME?");
        var base = achatar(ev(args[0])), teste = criterio(escalar(args[1]));
        var alvoSoma = args[2] ? achatar(ev(args[2])) : base;
        var soma = 0, qtd = 0;
        for (i = 0; i < base.length; i++) {
          if (!teste(base[i])) continue;
          qtd++;
          if (typeof alvoSoma[i] === "number") soma += alvoSoma[i];
        }
        if (nome === "CONT.SE") return qtd;
        if (nome === "SOMASE") return soma;
        return qtd ? soma / qtd : new Erro("#DIV/0!");
      case "SE":
        v = paraLogico(escalar(args[0]));
        if (eErro(v)) return v;
        if (v) return args.length > 1 ? escalar(args[1]) : true;
        return args.length > 2 ? escalar(args[2]) : false;
      case "SEERRO":
        v = escalar(args[0]);
        return eErro(v) ? escalar(args[1]) : v;
      case "E":
      case "OU":
        lista = [];
        args.forEach(function (a) { lista = lista.concat(achatar(ev(a))); });
        lista = lista.filter(function (x) { return x !== ""; }).map(paraLogico);
        for (i = 0; i < lista.length; i++) if (eErro(lista[i])) return lista[i];
        return nome === "E" ? lista.every(Boolean) : lista.some(Boolean);
      case "NAO":
        v = paraLogico(escalar(args[0]));
        return eErro(v) ? v : !v;
      case "ARRED":
        v = num(args[0]); t = args[1] ? num(args[1]) : 0;
        if (eErro(v)) return v;
        if (eErro(t)) return t;
        var f = Math.pow(10, t);
        return Math.sign(v) * Math.round(Math.abs(v) * f + 1e-9) / f;
      case "INT":
        v = num(args[0]); return eErro(v) ? v : Math.floor(v);
      case "ABS":
        v = num(args[0]); return eErro(v) ? v : Math.abs(v);
      case "CONCAT":
      case "CONCATENAR":
        t = "";
        for (i = 0; i < args.length; i++) {
          lista = achatar(ev(args[i]));
          for (var j = 0; j < lista.length; j++) { if (eErro(lista[j])) return lista[j]; t += paraTexto(lista[j]); }
        }
        return t;
      case "MAIUSCULA":
        v = escalar(args[0]); return eErro(v) ? v : paraTexto(v).toUpperCase();
      case "MINUSCULA":
        v = escalar(args[0]); return eErro(v) ? v : paraTexto(v).toLowerCase();
      case "ARRUMAR":
        v = escalar(args[0]); return eErro(v) ? v : paraTexto(v).trim().replace(/\s+/g, " ");
      case "ESQUERDA":
      case "DIREITA":
        v = escalar(args[0]); t = args[1] ? num(args[1]) : 1;
        if (eErro(v)) return v;
        if (eErro(t)) return t;
        v = paraTexto(v);
        return nome === "ESQUERDA" ? v.slice(0, t) : v.slice(Math.max(0, v.length - t));
      case "NUM.CARACT":
        v = escalar(args[0]); return eErro(v) ? v : paraTexto(v).length;
      case "PROCV":
        var procurado = escalar(args[0]), tabela = ev(args[1]), col = num(args[2]);
        var aprox = args.length > 3 ? paraLogico(escalar(args[3])) : true;
        if (eErro(procurado)) return procurado;
        if (!tabela || !tabela.intervalo) return new Erro("#VALOR!");
        if (eErro(col)) return col;
        if (col < 1 || col > tabela.linhas[0].length) return new Erro("#REF!");
        var achou = -1;
        for (i = 0; i < tabela.linhas.length; i++) {
          var c0 = tabela.linhas[i][0];
          if (aprox) {
            if (comparar(c0, procurado) <= 0) achou = i;
            else break;
          } else if (comparar(c0, procurado) === 0) { achou = i; break; }
        }
        return achou === -1 ? new Erro("#N/D") : tabela.linhas[achou][col - 1];
    }
    return new Erro("#NOME?");
  };

  Planilha.prototype.calcular = function () {
    this.memo = {};
    this.ciclo = {};
    for (var id in this.celulas) {
      var cel = this.celulas[id], v = this.valor(id, []), td = cel.td;
      td.classList.remove("num", "erro", "logico");
      td.title = this.ciclo[id] ? "referência circular" : "";
      if (eErro(v)) { td.textContent = v.cod; td.classList.add("erro"); }
      else if (typeof v === "number") { td.textContent = formatar(v, cel.formato); td.classList.add("num"); }
      else if (typeof v === "boolean") { td.textContent = v ? "VERDADEIRO" : "FALSO"; td.classList.add("logico"); }
      else td.textContent = v;
    }
    this.raiz.classList.toggle("tem-circular", Object.keys(this.ciclo).length > 0);
    if (this.atual) this.destacar();
  };

  Planilha.prototype.selecionar = function (id) {
    this.atual = id;
    this.nome.textContent = id;
    this.entrada.value = this.celulas[id].bruto;
    this.destacar();
  };

  /* contorno colorido nas células citadas pela fórmula da célula ativa */
  Planilha.prototype.destacar = function () {
    var self = this, tab = this.tabela;
    tab.querySelectorAll(".ativa,.col-ativa,.lin-ativa,[class*='ref-']").forEach(function (el) {
      el.classList.remove("ativa", "col-ativa", "lin-ativa", "ref-0", "ref-1", "ref-2", "ref-3", "ref-4");
    });
    var cel = this.celulas[this.atual];
    cel.td.classList.add("ativa");
    var m = /^([A-Z]+)(\d+)$/.exec(this.atual);
    var thc = tab.querySelector('th[data-col="' + m[1] + '"]'), thl = tab.querySelector('th[data-lin="' + m[2] + '"]');
    if (thc) thc.classList.add("col-ativa");
    if (thl) thl.classList.add("lin-ativa");
    if (cel.bruto.charAt(0) !== "=") return;
    var refs = cel.bruto.replace(/"(?:[^"]|"")*"/g, "").match(/\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?/g) || [];
    refs.forEach(function (ref, k) {
      var p = ref.replace(/\$/g, "").split(":"), a = /^([A-Z]+)(\d+)$/.exec(p[0]), b = /^([A-Z]+)(\d+)$/.exec(p[1] || p[0]);
      for (var l = Math.min(+a[2], +b[2]); l <= Math.max(+a[2], +b[2]); l++) {
        for (var c = Math.min(indiceColuna(a[1]), indiceColuna(b[1])); c <= Math.max(indiceColuna(a[1]), indiceColuna(b[1])); c++) {
          var alvo = self.celulas[letraColuna(c) + l];
          if (alvo) alvo.td.classList.add("ref-" + (k % 5));
        }
      }
    });
  };

  function iniciarPlanilhas(raiz) {
    (raiz || document).querySelectorAll("[data-planilha]").forEach(function (el) {
      if (el.planilha) return;
      el.planilha = new Planilha(el);
    });
  }
  iniciarPlanilhas();

  /* ======================================================
     6. LABORATÓRIOS

     O HTML descreve o laboratório (data-lab, data-campo,
     data-palco, data-saida, data-eco); aqui mora só o
     construtor de cada um.

     Cada construtor recebe os valores dos controles e devolve
     uma string, ou { html, codigo } quando o que é renderizado
     difere do que deve ser mostrado no painel de saída.

     A saída não precisa ser código: pode ser a fórmula, o
     caminho de menus ou a sequência de teclas que produz o
     resultado do palco (marque o <pre data-saida> com
     data-lang="formula" ou data-lang="texto").

     NUNCA emita atributo vazio (class="") no código gerado:
     monte o atributo inteiro condicionalmente.
     ====================================================== */

  var construtores = {

    /* EXEMPLO sem código — formato de número numa planilha.
       Substitua pelos do seu assunto. */
    formato: function (v) {
      var valores = [1234.5, 0.075, 89.9, -42];
      var nomes = { geral: "Geral", moeda: "Moeda", pct: "Porcentagem", dec2: "Número" };
      var atalhos = { moeda: "Ctrl + Shift + 4", pct: "Ctrl + Shift + 5", dec2: "Ctrl + Shift + 1" };
      var linhas = valores.map(function (n, i) {
        return "<tr><th>" + (i + 1) + '</th><td class="num">' + esc(formatar(n, v.formato)) + "</td></tr>";
      }).join("");
      var atalho = atalhos[v.formato] ? "\natalho: " + atalhos[v.formato] : "";
      return {
        html:
          '<div class="planilha"><div class="planilha-rolagem"><table class="planilha-grade">' +
          "<thead><tr><th></th><th>A</th></tr></thead><tbody>" + linhas + "</tbody></table></div></div>" +
          '<p class="nota-demo" style="margin-top:12px">o valor guardado na célula não muda: só a aparência</p>',
        codigo: "Página Inicial › Número › " + nomes[v.formato] + atalho
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
      iniciarPlanilhas(palco);
    }

    campos.forEach(function (c) {
      c.addEventListener("input", atualizar);
      c.addEventListener("change", atualizar);
    });
    atualizar();
  });

  /* ======================================================
     7. PLAYGROUND LIVRE (só em aulas de código)

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

  /* ======================================================
     8. QUIZ DE VERIFICAÇÃO

     <div class="quiz" data-quiz>
       <p class="quiz-placar" data-placar></p>           (opcional)
       <div class="quiz-item" data-resposta="b">
         <p class="quiz-pergunta">…</p>
         <div class="quiz-opcoes">
           <button type="button" data-opcao="a">…</button>
           <button type="button" data-opcao="b">…</button>
         </div>
         <p class="quiz-explica">Por que a resposta certa é a certa.</p>
       </div>
     </div>

     A turma responde em voz alta; clicar marca a escolha, mostra
     a certa e revela a explicação. Clicar de novo troca a escolha.
     ====================================================== */

  document.querySelectorAll("[data-quiz]").forEach(function (quiz) {
    var placar = quiz.querySelector("[data-placar]");
    var itens = Array.prototype.slice.call(quiz.querySelectorAll(".quiz-item"));

    function contar() {
      if (!placar) return;
      var resp = itens.filter(function (it) { return it.classList.contains("respondido"); });
      var certos = resp.filter(function (it) { return it.getAttribute("data-acertou") === "sim"; });
      placar.textContent = certos.length + " de " + itens.length + " certas" +
        (resp.length < itens.length ? " · " + (itens.length - resp.length) + " sem resposta" : "");
    }

    itens.forEach(function (it) {
      var certa = it.getAttribute("data-resposta");
      it.querySelectorAll("[data-opcao]").forEach(function (b) {
        b.addEventListener("click", function () {
          it.querySelectorAll("[data-opcao]").forEach(function (o) {
            o.classList.remove("certa", "errada");
            if (o.getAttribute("data-opcao") === certa) o.classList.add("certa");
          });
          if (b.getAttribute("data-opcao") !== certa) b.classList.add("errada");
          it.classList.add("respondido");
          it.setAttribute("data-acertou", b.getAttribute("data-opcao") === certa ? "sim" : "nao");
          contar();
        });
      });
    });
    contar();
  });

  /* ======================================================
     9. TOUR — PASSO A PASSO CLICÁVEL

     Sobre um aplicativo reconstruído em HTML (.app), cada
     controle da sequência ganha data-passo="1", "2"… e
     data-legenda="o que fazer". Os botões avançam e voltam;
     o controle da vez pisca com .alvo-clique.

     <div class="tour" data-tour>
       <div class="tour-barra">
         <button type="button" data-tour-anterior>anterior</button>
         <span class="tour-contador" data-tour-contador></span>
         <button type="button" data-tour-proximo>próximo</button>
       </div>
       <p class="tour-legenda" data-tour-legenda></p>
       <div class="app"> … data-passo … </div>
     </div>
     ====================================================== */

  document.querySelectorAll("[data-tour]").forEach(function (tour) {
    var passos = Array.prototype.slice.call(tour.querySelectorAll("[data-passo]"))
      .sort(function (a, b) { return a.getAttribute("data-passo") - b.getAttribute("data-passo"); });
    if (!passos.length) return;
    var ant = tour.querySelector("[data-tour-anterior]");
    var prox = tour.querySelector("[data-tour-proximo]");
    var cont = tour.querySelector("[data-tour-contador]");
    var leg = tour.querySelector("[data-tour-legenda]");
    var atual = 0;

    function mostrar() {
      passos.forEach(function (p, i) { p.classList.toggle("alvo-clique", i === atual); });
      if (cont) cont.textContent = (atual + 1) + " / " + passos.length;
      if (leg) leg.textContent = passos[atual].getAttribute("data-legenda") || "";
      if (ant) ant.disabled = atual === 0;
      if (prox) prox.disabled = atual === passos.length - 1;
    }
    if (ant) ant.addEventListener("click", function () { if (atual > 0) { atual--; mostrar(); } });
    if (prox) prox.addEventListener("click", function () { if (atual < passos.length - 1) { atual++; mostrar(); } });
    mostrar();
  });
})();
