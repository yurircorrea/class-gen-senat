/* =========================================================
   aula.js — motor da aula em página única
   1. Colorização dos painéis (fórmula, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   4. Formatos de número (moeda, porcentagem…) em pt-BR
   5. Mini planilha com fórmulas em português
   6. Laboratórios interativos (construtores desta aula)
   8. Quiz de verificação
   9. Tour: passo a passo clicável sobre um aplicativo
   10. Desta aula: a próxima palavra mais provável
   11. Desta aula: copiar o prompt montado

   Aula: IA na Prática · Aula 1 · Inteligência artificial.
   As seções 3 (simuladores de tela) e 7 (playground) do
   modelo não são usadas nesta aula e foram retiradas.
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

     Depois de cada recálculo, a raiz dispara "planilha-calculada"
     (detail.planilha); planilha.ler("F2") devolve o valor de uma
     célula. Útil para um gráfico que acompanha os dados:
       el.addEventListener("planilha-calculada", function (e) { … e.detail.planilha.ler("F2") … });
       if (el.planilha) …   (o primeiro cálculo acontece ao carregar)

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
    /* avisa quem depende dos valores (um gráfico, um cartão de total) */
    if (typeof CustomEvent === "function") {
      this.raiz.dispatchEvent(new CustomEvent("planilha-calculada", { detail: { planilha: this } }));
    }
  };

  /* valor já calculado de uma célula: número, texto, lógico ou Erro (com .cod) */
  Planilha.prototype.ler = function (id) { return this.memo ? this.memo[id] : undefined; };

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

  /* utilitários dos laboratórios desta aula */
  function semAcentoMin(s) { return semAcento(String(s).toLowerCase()); }
  function maiuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function listaE(itens) {
    if (itens.length < 2) return itens.join("");
    return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
  }
  function contarPalavras(t) { return (t.match(/[A-Za-zÀ-ú0-9][\wÀ-ú\-]*/g) || []).length; }
  /* trechos entre colchetes ([nome do cliente]) são lacunas: o prompt não deu a informação */
  function comLacunas(t) { return esc(t).replace(/\[[^\]]+\]/g, function (m) { return '<span class="lacuna">' + m + "</span>"; }); }

  var construtores = {

    /* 02 · Lab — manutenção preditiva: sensores do caminhão → modelo → previsão de falha */
    manutencao: function (v) {
      var temp = +v.temp, vib = +v.vib, km = +v.km, hist = v.hist === "true";
      var t = Math.max(0, temp - 90) / 25, vb = Math.max(0, vib - 2.5) / 9.5, k = km / 30000;
      var z = -4 + 3.2 * t + 3 * vb + 2.2 * k + (hist ? 1.2 : 0);
      var pct = Math.round(100 / (1 + Math.exp(-z)));
      var nivel = pct < 20 ? ["baixo", "Seguir viagem: revisão no prazo normal.", "ok"]
        : pct < 50 ? ["atenção", "Agendar revisão nos próximos 7 dias.", "atencao"]
        : pct < 80 ? ["alto", "Fazer a manutenção antes da próxima viagem longa.", "alto"]
        : ["crítico", "Parar na próxima oficina e não seguir viagem.", "critico"];
      function sensor(nome, valor, frac, ref) {
        var w = Math.round(Math.min(1, Math.max(0.03, frac)) * 100);
        return '<div class="sensor"><span class="sensor-nome">' + nome + '</span><b class="sensor-valor">' + valor + "</b>" +
          '<span class="sensor-trilho"><i style="width:' + w + '%"></i></span><small>' + ref + "</small></div>";
      }
      var html =
        '<div class="painel-caminhao"><div class="sensores">' +
        sensor("temperatura do motor", temp + " °C", (temp - 80) / 35, "referência do exemplo: até 95 °C") +
        sensor("vibração do motor", formatar(vib, "dec1") + " mm/s", vib / 12, "referência do exemplo: até 4,5 mm/s") +
        sensor("km desde a troca de óleo", formatar(km, "int") + " km", km / 30000, "referência do exemplo: troca a cada 20.000 km") +
        sensor("falha anterior neste componente", hist ? "sim" : "não", hist ? 1 : 0, "histórico da oficina") +
        '</div><div class="risco risco--' + nivel[2] + '">' +
        '<span class="risco-rotulo">risco de falha nos próximos 30 dias</span>' +
        '<b class="risco-num">' + pct + '%</b><span class="risco-nivel">' + nivel[0] + "</span>" +
        "<p>" + nivel[1] + "</p></div></div>" +
        '<p class="nota-demo" style="margin-top:14px">modelo simplificado para a aula: um sistema real aprende o peso de cada sinal com o histórico de milhares de veículos</p>';
      var codigo =
        "dados dos sensores → modelo → previsão\n" +
        "temperatura " + temp + " °C · vibração " + formatar(vib, "dec1") + " mm/s · " +
        formatar(km, "int") + " km desde a troca · " + (hist ? "com" : "sem") + " falha anterior\n" +
        "risco de falha nos próximos 30 dias: " + pct + "% (" + nivel[0] + ")\n" +
        "ação sugerida: " + nivel[1].charAt(0).toLowerCase() + nivel[1].slice(1);
      return { html: html, codigo: codigo };
    },

    /* 03 · Lab — bolha de filtro: o feed aprende com as curtidas e vai se fechando */
    bolha: function (v) {
      var ASSUNTOS = [
        ["futebol", "Futebol", ["Os gols da rodada", "Bastidores do clássico", "Lances polêmicos do VAR", "Mercado da bola: quem chega", "Defesas impossíveis", "Melhores momentos da Libertadores", "O treino do time revelação", "Golaços de falta"]],
        ["receitas", "Receitas", ["Marmita fácil para a semana", "Arroz carreteiro de estrada", "Bolo de caneca em 5 minutos", "Feijoada simples", "Lanche saudável para viagem", "Pão caseiro sem sova", "Churrasco: o ponto da carne", "Sobremesa com 3 ingredientes"]],
        ["estrada", "Caminhões e estrada", ["Revisão antes de pegar a estrada", "Como calibrar os pneus", "Direção defensiva na chuva", "Como funciona o freio motor", "Pontos de parada e descanso", "Amarração correta da carga", "Economia de diesel na prática", "Cuidados na descida de serra"]],
        ["sertanejo", "Sertanejo", ["Lançamento da dupla do momento", "Modão ao vivo", "Bastidores do show", "As 10 mais tocadas da semana", "Clássicos dos anos 90", "Acústico na fazenda", "Parceria surpresa", "Moda de viola"]],
        ["noticias", "Notícias", ["Previsão do tempo para a semana", "Preço do diesel nos postos", "Obras na BR-277", "O resumo do dia em 1 minuto", "Economia: o que muda no mês", "Movimento na Ponte da Amizade", "Chuva forte no oeste do Paraná", "Agenda cultural de Foz"]],
        ["humor", "Humor", ["Pegadinhas da semana", "Vídeos de gatos", "Stand-up: a vida na estrada", "Memes do dia", "Tentativas que deram errado", "Imitações famosas", "Esquetes de escritório", "Desafio das caretas"]]
      ];
      var VAGAS = 8, dias = +v.dias;
      var curtidos = ASSUNTOS.filter(function (a) { return v[a[0]] === "true"; });
      var pesos = ASSUNTOS.map(function (a) {
        if (!curtidos.length) return 1;
        return v[a[0]] === "true" ? 1 + dias * 0.6 : Math.max(0.02, 1 - dias / 25);
      });
      var soma = pesos.reduce(function (s, p) { return s + p; }, 0);
      var cotas = pesos.map(function (p) { return p / soma * VAGAS; });
      var vagas = cotas.map(Math.floor);
      var falta = VAGAS - vagas.reduce(function (s, x) { return s + x; }, 0);
      cotas.map(function (c, i) { return [c - Math.floor(c), i]; })
        .sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; })
        .slice(0, falta).forEach(function (x) { vagas[x[1]]++; });

      /* monta o feed intercalando os assuntos, como um aplicativo faria */
      var usados = ASSUNTOS.map(function () { return 0; }), feed = [];
      while (feed.length < VAGAS) {
        for (var i = 0; i < ASSUNTOS.length && feed.length < VAGAS; i++) {
          if (usados[i] < vagas[i]) { feed.push([ASSUNTOS[i], ASSUNTOS[i][2][usados[i]]]); usados[i]++; }
        }
      }
      var doGosto = feed.filter(function (f) { return v[f[0][0]] === "true"; }).length;
      var variedade = vagas.filter(function (n) { return n > 0; }).length;

      var cards = feed.map(function (f) {
        var gosta = v[f[0][0]] === "true";
        return '<div class="feed-item' + (gosta ? " feed-item--curtido" : "") + '"><span class="feed-assunto">' + f[0][1] + "</span>" +
          "<b>" + esc(f[1]) + "</b></div>";
      }).join("");
      var barras = ASSUNTOS.map(function (a, i) {
        return '<div class="barra-h"><span>' + a[1] + '</span><span class="barra-h-trilho"><i style="width:' +
          (vagas[i] / VAGAS * 100) + '%"></i></span><b>' + vagas[i] + " de " + VAGAS + "</b></div>";
      }).join("");
      var html =
        '<div class="feed-celular"><div class="feed-topo">Para você</div><div class="feed">' + cards + "</div></div>" +
        '<div class="feed-resumo"><p class="feed-resumo-titulo">o feed de hoje, por assunto</p>' + barras +
        '<p class="feed-variedade">assuntos diferentes no feed: <b>' + variedade + " de " + ASSUNTOS.length + "</b></p></div>";
      var codigo =
        "curtidas registradas: " + (curtidos.length ? curtidos.map(function (a) { return a[1]; }).join(", ") : "nenhuma (o app ainda não conhece você)") + "\n" +
        "dias de uso: " + dias + "\n" +
        (curtidos.length ? "vídeos sobre o que você já curtiu: " + doGosto + " de " + VAGAS + "\n" : "") +
        "assuntos diferentes no feed: " + variedade + " de " + ASSUNTOS.length;
      return { html: '<div class="feed-palco">' + html + "</div>", codigo: codigo };
    },

    /* 04 · Lab — aprender pelo exemplo: um classificador de golpes treinado ao vivo */
    treino: function (v) {
      var TREINO = [
        ["URGENTE: sua multa vence hoje, pague via Pix pelo link para evitar o bloqueio da CNH", "golpe"],
        ["Bom dia, a carga 12345 foi liberada no porto seco, pode retirar às 14h", "normal"],
        ["Parabéns! Você ganhou um prêmio, clique no link e informe seus dados", "golpe"],
        ["Reunião da equipe de motoristas amanhã às 8h na sala de treinamento", "normal"],
        ["Sua encomenda está retida, pague a taxa de liberação via Pix pelo link", "golpe"],
        ["A entrega de hoje foi confirmada pelo cliente, obrigado pelo trabalho", "normal"],
        ["Frete urgente com pagamento antecipado: deposite a taxa de cadastro no Pix", "golpe"],
        ["Lembrete: revisão do caminhão agendada para sexta na oficina da empresa", "normal"],
        ["Seu CPF será bloqueado hoje, clique no link e atualize seus dados", "golpe"],
        ["O cliente pediu para receber a carga pela manhã, combine o horário com ele", "normal"],
        ["Promoção relâmpago: pneu pela metade do preço, pague no Pix agora pelo link", "golpe"],
        ["A escala da semana está no mural, confira seus horários de viagem", "normal"]
      ];
      var TESTE = [
        ["Pague hoje a taxa da sua multa pelo link e evite o bloqueio", "golpe"],
        ["A carga foi entregue ao cliente às 10h, viagem tranquila", "normal"],
        ["Você foi sorteado! Clique no link para receber o prêmio", "golpe"],
        ["Confira o horário da revisão do caminhão na oficina", "normal"]
      ];
      var PARADA = "a o as os e de da do das dos em no na nos nas um uma uns umas para pelo pela por com sua seu suas seus voce que se ao aos foi pode esta".split(" ");
      function palavras(t) {
        return semAcentoMin(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1 && PARADA.indexOf(w) === -1; });
      }
      var n = +v.n, invertidos = v.invertidos === "true";
      var cont = { golpe: {}, normal: {} }, tot = { golpe: 0, normal: 0 }, docs = { golpe: 0, normal: 0 }, vocab = {};
      var usados = TREINO.slice(0, n).map(function (ex, i) {
        var rotulo = ex[1], errado = invertidos && i < 4;
        if (errado) rotulo = rotulo === "golpe" ? "normal" : "golpe";
        docs[rotulo]++;
        palavras(ex[0]).forEach(function (w) { cont[rotulo][w] = (cont[rotulo][w] || 0) + 1; tot[rotulo]++; vocab[w] = 1; });
        return { texto: ex[0], rotulo: rotulo, errado: errado };
      });
      var V = Object.keys(vocab).length;
      function chanceGolpe(t) {
        var total = docs.golpe + docs.normal;
        if (!total) return 0.5;
        var lg = Math.log((docs.golpe + 1) / (total + 2)), ln = Math.log((docs.normal + 1) / (total + 2));
        palavras(t).forEach(function (w) {
          lg += Math.log(((cont.golpe[w] || 0) + 1) / (tot.golpe + V + 1));
          ln += Math.log(((cont.normal[w] || 0) + 1) / (tot.normal + V + 1));
        });
        return 1 / (1 + Math.exp(ln - lg));
      }
      function chip(r) { return '<span class="etiqueta etiqueta--' + r + '">' + r + "</span>"; }

      var acertos = 0, certezas = [];
      var linhasTeste = TESTE.map(function (t) {
        var p = chanceGolpe(t[0]);
        var prev = p > 0.5 ? "golpe" : p < 0.5 ? "normal" : "";
        var certeza = Math.round(Math.max(p, 1 - p) * 100);
        var ok = prev === t[1];
        if (ok) acertos++;
        certezas.push(certeza);
        return "<tr><td>" + esc(t[0]) + "</td><td>" + (prev ? chip(prev) : '<span class="etiqueta">não sabe</span>') + "</td>" +
          '<td class="num">' + certeza + "%</td><td>" + (prev ? (ok ? '<span class="resultado resultado--certo">acertou</span>' : '<span class="resultado resultado--errado">errou</span>') : "—") + "</td></tr>";
      }).join("");

      var lista = usados.length ? usados.map(function (u) {
        return '<li><span class="exemplo-texto">' + esc(u.texto) + "</span>" + chip(u.rotulo) + (u.errado ? '<span class="etiqueta-errada">rótulo errado</span>' : "") + "</li>";
      }).join("") : '<li class="vazio">nenhum exemplo: o modelo ainda não aprendeu nada e só consegue chutar</li>';

      var pistas = Object.keys(vocab).filter(function (w) { return cont.golpe[w]; }).map(function (w) {
        var s = Math.log(((cont.golpe[w] || 0) + 1) / (tot.golpe + V + 1)) - Math.log(((cont.normal[w] || 0) + 1) / (tot.normal + V + 1));
        return [w, s];
      }).sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }).slice(0, 6).map(function (x) { return x[0]; });

      var media = Math.round(certezas.reduce(function (s, c) { return s + c; }, 0) / certezas.length);
      var html =
        '<div class="treino"><div class="treino-col"><p class="treino-titulo">exemplos usados no treino (' + n + ")</p><ol class=\"treino-lista\">" + lista + "</ol></div>" +
        '<div class="treino-col"><p class="treino-titulo">mensagens novas, que o modelo nunca viu</p>' +
        '<div class="rolagem-x"><table class="tabela tabela--compacta"><thead><tr><th>Mensagem</th><th>O modelo diz</th><th>Certeza</th><th>Resultado</th></tr></thead><tbody>' + linhasTeste + "</tbody></table></div>" +
        '<p class="treino-placar">acertos: <b>' + acertos + " de " + TESTE.length + "</b> · certeza média: <b>" + media + "%</b></p></div></div>";
      var codigo =
        "exemplos de treino: " + n + " (" + docs.golpe + " golpe, " + docs.normal + " normal)" + (invertidos && n ? " · " + Math.min(n, 4) + " com rótulo errado" : "") + "\n" +
        "acertos nas mensagens novas: " + acertos + " de " + TESTE.length + " · certeza média: " + media + "%\n" +
        "palavras que o modelo ligou a golpe: " + (pistas.length ? pistas.join(", ") : "nenhuma ainda");
      return { html: html, codigo: codigo };
    },

    /* 06 · Lab — rede neural: mais camadas ocultas = aprendizado profundo */
    rede: function (v) {
      var L = +v.camadas, N = +v.neuronios;
      var ENTRADAS = ["temperatura", "vibração", "km rodados", "histórico"];
      var colunas = [ENTRADAS.length];
      for (var c = 0; c < L; c++) colunas.push(N);
      colunas.push(1);
      var W = 900, H = 340, mx = 190, topo = 50, base = 20;
      var passo = (W - mx - 100) / (colunas.length - 1);
      var pos = colunas.map(function (qtd, ci) {
        var x = mx + ci * passo, h = H - topo - base, arr = [];
        for (var k = 0; k < qtd; k++) arr.push([x, topo + h * (k + 1) / (qtd + 1)]);
        return arr;
      });
      var svg = "";
      for (c = 0; c < pos.length - 1; c++) {
        pos[c].forEach(function (a) {
          pos[c + 1].forEach(function (b) {
            svg += '<line class="rede-linha" x1="' + a[0] + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0] + '" y2="' + b[1].toFixed(1) + '"/>';
          });
        });
      }
      pos.forEach(function (col, ci) {
        var tipo = ci === 0 ? "entrada" : ci === pos.length - 1 ? "saida" : "oculta";
        col.forEach(function (p, k) {
          svg += '<circle class="rede-no rede-no--' + tipo + '" cx="' + p[0] + '" cy="' + p[1].toFixed(1) + '" r="12"/>';
          if (tipo === "entrada") svg += '<text class="rede-texto" x="' + (p[0] - 22) + '" y="' + (p[1] + 5).toFixed(1) + '" text-anchor="end">' + ENTRADAS[k] + "</text>";
          if (tipo === "saida") svg += '<text class="rede-texto" x="' + (p[0] + 22) + '" y="' + (p[1] + 5).toFixed(1) + '">risco</text>';
        });
        var rot = tipo === "entrada" ? "entrada" : tipo === "saida" ? "saída" : "oculta " + ci;
        svg += '<text class="rede-rotulo" x="' + col[0][0] + '" y="22" text-anchor="middle">' + rot + "</text>";
      });
      var produtos = [], conexoes = 0;
      for (c = 0; c < colunas.length - 1; c++) { produtos.push(colunas[c] + "×" + colunas[c + 1]); conexoes += colunas[c] * colunas[c + 1]; }
      var profunda = L >= 2;
      var html =
        '<svg class="rede" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Rede neural com ' + L + " camada(s) oculta(s) de " + N + ' neurônios">' + svg + "</svg>" +
        '<p class="rede-legenda"><span class="rede-tipo rede-tipo--' + (profunda ? "profunda" : "rasa") + '">' + (profunda ? "rede profunda · deep learning" : "rede rasa") + "</span> " +
        conexoes + " conexões: cada uma tem um peso que o treino ajusta</p>";
      var codigo =
        "camadas ocultas: " + L + " → " + (profunda ? "rede profunda (deep learning)" : "rede rasa: uma camada só") + "\n" +
        "neurônios por camada oculta: " + N + "\n" +
        "conexões (pesos a ajustar): " + produtos.join(" + ") + " = " + conexoes + "\n" +
        "um modelo de linguagem atual: bilhões de pesos";
      return { html: html, codigo: codigo };
    },

    /* 07 · Lab — níveis de automação na direção (escala SAE J3016) */
    autonomia: function (v) {
      var NIVEIS = [
        ["Sem automação", "o motorista", "o motorista", "só avisa: alerta de colisão, de saída de faixa, de ponto cego", "alerta sonoro quando o caminhão sai da faixa", "assistiva"],
        ["Assistência ao motorista", "o motorista, com ajuda em uma tarefa", "o motorista", "controla a velocidade ou a direção, uma de cada vez", "piloto automático adaptativo, que mantém distância do veículo da frente", "assistiva"],
        ["Automação parcial", "o sistema acelera, freia e mantém a faixa", "o motorista, o tempo todo, pronto para assumir", "controla velocidade e direção ao mesmo tempo", "piloto automático adaptativo e assistente de faixa ligados juntos", "assistiva"],
        ["Automação condicional", "o sistema, só em condições definidas", "o sistema; o motorista assume quando ele pede", "dirige sozinho em situações específicas, como trânsito lento em rodovia", "sistemas aprovados para congestionamento em rodovia, em alguns países", "transicao"],
        ["Alta automação", "o sistema, dentro da área prevista", "o sistema; ninguém precisa assumir naquela área", "dirige e resolve imprevistos sozinho, mas só onde foi preparado para isso", "robotáxis sem motorista que já circulam em algumas cidades dos EUA e da China", "autonoma"],
        ["Automação total", "o sistema, em qualquer lugar", "o sistema", "dirige onde e quando um motorista humano dirigiria", "ainda não existe à venda", "autonoma"]
      ];
      var TIPOS = { assistiva: "IA assistiva", transicao: "zona de transição", autonoma: "IA autônoma" };
      var n = +v.nivel, d = NIVEIS[n];
      var escala = NIVEIS.map(function (x, i) {
        return '<div class="nivel-passo nivel-passo--' + x[5] + (i === n ? " ativo" : "") + '"><b>' + i + "</b><span>" + x[0] + "</span></div>";
      }).join("");
      var html =
        '<div class="niveis"><div class="niveis-grupos"><span style="flex:3">IA assistiva</span><span style="flex:1">transição</span><span style="flex:2">IA autônoma</span></div>' +
        '<div class="niveis-escala">' + escala + "</div></div>" +
        '<div class="nivel-ficha"><div class="nivel-ficha-topo"><span class="nivel-num">' + n + "</span><div><b>" + d[0] + '</b><span class="nivel-tipo nivel-tipo--' + d[5] + '">' + TIPOS[d[5]] + "</span></div></div>" +
        "<dl><dt>quem dirige</dt><dd>" + d[1] + "</dd><dt>quem vigia a estrada</dt><dd>" + d[2] + "</dd><dt>o que o sistema faz</dt><dd>" + d[3] + "</dd><dt>exemplo</dt><dd>" + d[4] + "</dd></dl></div>";
      var codigo =
        "Nível " + n + " — " + d[0].toLowerCase() + " (escala SAE J3016)\n" +
        "quem dirige: " + d[1] + "\n" +
        "quem vigia a estrada: " + d[2] + "\n" +
        "classificação: " + TIPOS[d[5]];
      return { html: html, codigo: codigo };
    },

    /* 08 · Lab — o que o PLN faz com um texto: quatro tarefas sobre a mesma mensagem */
    pln: function (v) {
      var TEXTOS = {
        ocorrencia: {
          titulo: "áudio do motorista, transcrito",
          texto: "Bom dia, aqui é o Carlos, do caminhão placa ABC1D23. Tô parado no km 590 da BR-277, perto de Cascavel, porque estourou o pneu traseiro. A carga de frango congelado tá bem, o baú tá ligado, mas vou atrasar umas duas horas. Já chamei o borracheiro.",
          tarefas: [
            ["Resumir", "Resuma esta ocorrência em uma frase.", "Pneu traseiro estourou no km 590 da BR-277, perto de Cascavel; carga refrigerada sem danos e atraso previsto de 2 horas."],
            ["Classificar", "Classifique a urgência (baixa, média ou alta) e o tipo de ocorrência.", "Urgência: média · Tipo: problema mecânico (pneu) · Carga: sem avaria"],
            ["Extrair dados", "Liste motorista, placa, local, carga e atraso.", "Motorista: Carlos\nPlaca: ABC1D23\nLocal: BR-277, km 590 (Cascavel)\nCarga: frango congelado\nAtraso: cerca de 2 horas"],
            ["Avisar em espanhol", "Escreva um aviso curto, em espanhol, para o cliente no Paraguai.", "Estimado cliente: su carga llegará con unas dos horas de retraso por un problema en un neumático durante el viaje. La mercadería sigue refrigerada y en perfecto estado."]
          ]
        },
        reclamacao: {
          titulo: "e-mail de cliente",
          texto: "Prezados, é a terceira vez neste mês que a entrega da nota fiscal 4521 chega fora do horário combinado. Precisamos receber até as 10h, porque a nossa equipe de recebimento sai ao meio-dia. Se continuar assim, vamos rever o contrato. Att., Marina — Mercado Bom Preço",
          tarefas: [
            ["Resumir", "Resuma este e-mail em uma frase.", "Cliente reclama do terceiro atraso no mês (NF 4521), exige entrega até as 10h e ameaça rever o contrato."],
            ["Classificar", "Classifique o sentimento e a urgência.", "Sentimento: negativo (insatisfeita) · Urgência: alta · Risco: perder o cliente"],
            ["Extrair dados", "Extraia cliente, contato, nota fiscal, prazo e problema.", "Cliente: Mercado Bom Preço\nContato: Marina\nNota fiscal: 4521\nPrazo: entrega até as 10h\nProblema: atrasos repetidos"],
            ["Rascunhar resposta", "Escreva uma resposta cordial pedindo desculpas.", "Olá, Marina. Pedimos desculpas pelos atrasos na entrega da NF 4521. A partir da próxima semana, sua rota sairá mais cedo para chegar até as 9h30.", "A IA prometeu uma rota mais cedo e um horário que ninguém combinou. Revise antes de enviar."]
          ]
        },
        espanhol: {
          titulo: "mensagem de cliente do Paraguai",
          texto: "Hola, ¿el camión con los repuestos ya cruzó el Puente de la Amistad? Necesitamos la mercadería en Ciudad del Este antes del viernes. Gracias, Jorge.",
          tarefas: [
            ["Resumir", "Resuma em português, em uma frase.", "Jorge quer saber se as peças já atravessaram a ponte; precisa delas em Ciudad del Este antes de sexta."],
            ["Classificar", "Classifique o tipo de pedido e a urgência.", "Tipo: pedido de informação (rastreamento) · Urgência: média · Idioma: espanhol"],
            ["Extrair dados", "Extraia cliente, carga, destino e prazo.", "Cliente: Jorge\nCarga: peças de reposição\nDestino: Ciudad del Este (Paraguai)\nPrazo: antes de sexta-feira"],
            ["Traduzir", "Traduza para o português.", "Olá, o caminhão com as peças de reposição já atravessou a Ponte da Amizade? Precisamos da mercadoria em Ciudad del Este antes de sexta. Obrigado, Jorge."]
          ]
        }
      };
      var d = TEXTOS[v.texto] || TEXTOS.ocorrencia;
      var cards = d.tarefas.map(function (t) {
        return '<div class="pln-card"><span class="pln-tarefa">' + t[0] + '</span><p class="pln-resultado">' + esc(t[2]) + "</p>" +
          (t[3] ? '<p class="pln-alerta">' + esc(t[3]) + "</p>" : "") + "</div>";
      }).join("");
      var html =
        '<div class="pln-fonte"><span class="pln-fonte-rotulo">' + d.titulo + "</span><p>" + esc(d.texto) + "</p></div>" +
        '<div class="pln-grade">' + cards + "</div>" +
        '<p class="nota-demo">respostas de exemplo, no estilo do que uma ferramenta de IA devolve; numa IA de verdade o texto varia a cada vez</p>';
      var codigo = d.tarefas.map(function (t) { return t[0] + ": " + t[1]; }).join("\n");
      return { html: html, codigo: codigo };
    },

    /* 11 · Lab — monte um prompt: cada parte muda a resposta */
    prompt: function (v) {
      var PAPEIS = { nenhum: "", atendente: "Você é atendente de uma transportadora.", supervisor: "Você é supervisor de logística de uma transportadora." };
      var TONS = { "": "", formal: "Use tom formal e cordial.", direto: "Seja direto e objetivo.", descontraido: "Use um tom leve e descontraído." };
      var FORMATOS = { "": "", email: "Formate como e-mail, com linha de assunto.", whatsapp: "Formate como mensagem curta de WhatsApp.", topicos: "Organize em tópicos." };
      var TAMANHOS = { "": "", t50: "Use no máximo 50 palavras.", t100: "Use no máximo 100 palavras." };
      var clara = v.instrucao === "clara";
      var cliente = v.cliente === "true", carga = v.carga === "true", atraso = v.atraso === "true", motivo = v.motivo === "true";

      var linhas = [];
      if (PAPEIS[v.papel]) linhas.push(PAPEIS[v.papel]);
      linhas.push(clara ? "Escreva um aviso para o cliente informando o atraso da entrega." : "Fala do atraso.");
      var ctx = [];
      if (cliente) ctx.push("a cliente é a Marina, do Mercado Bom Preço");
      if (carga) ctx.push("a carga é a 12345");
      if (atraso) ctx.push("o atraso previsto é de 2 horas");
      if (motivo) ctx.push("o motivo é um pneu furado na BR-277");
      if (ctx.length) linhas.push(maiuscula(ctx.join("; ")) + ".");
      if (TONS[v.tom]) linhas.push(TONS[v.tom]);
      if (FORMATOS[v.formato]) linhas.push(FORMATOS[v.formato]);
      if (TAMANHOS[v.tamanho]) linhas.push(TAMANHOS[v.tamanho]);
      if (v.perguntar === "true") linhas.push("Se faltar alguma informação, pergunte antes de escrever.");
      var textoPrompt = linhas.join("\n");

      /* a resposta de exemplo, montada a partir do que o prompt disse (e do que não disse) */
      var faltam = [];
      if (!cliente) faltam.push("o nome do cliente");
      if (!carga) faltam.push("o número da carga");
      if (!atraso) faltam.push("o tempo de atraso");
      var resposta, nota;
      var nome = cliente ? "Marina" : "[nome do cliente]";
      var aCarga = carga ? "a carga 12345" : "a sua carga";
      var tempo = atraso ? "cerca de 2 horas" : "[tempo de atraso]";
      var assinatura = { nenhum: "[seu nome]", atendente: "Equipe de Atendimento", supervisor: "Supervisão de Logística" }[v.papel] || "[seu nome]";
      var curto = v.tamanho === "t50" || v.formato === "whatsapp";

      if (!clara) {
        resposta = "Claro! Atrasos podem acontecer por vários motivos: trânsito, chuva, problemas mecânicos ou fila na fronteira. Você quer que eu escreva uma mensagem para alguém, explique como evitar atrasos ou outra coisa?";
        nota = "Instrução vaga: a IA não sabe o que fazer e devolve uma conversa genérica.";
      } else if (v.perguntar === "true" && faltam.length) {
        resposta = "Posso escrever, mas antes preciso de algumas informações: " + listaE(faltam) + ". Assim o aviso sai pronto para enviar, sem campos em branco.";
        nota = "Pedir que a IA pergunte evita um texto cheio de lacunas ou de dados inventados.";
      } else {
        var saud, corpo, extra = "", fecho;
        if (v.tom === "formal") {
          saud = cliente ? "Prezada Marina," : "Prezado(a) [nome do cliente],";
          corpo = "Informamos que " + aCarga + " chegará com atraso de " + tempo + (motivo ? ", por causa de um pneu furado na BR-277" : ", por motivos operacionais") + ". Pedimos desculpas pelo transtorno.";
          extra = "Seguimos acompanhando a entrega e avisaremos assim que o veículo estiver a caminho.";
          fecho = "Atenciosamente,";
        } else if (v.tom === "direto") {
          saud = "Olá, " + nome + ".";
          corpo = maiuscula(aCarga) + " vai atrasar " + tempo + (motivo ? " (pneu furado na BR-277)" : "") + ".";
          extra = "Avisamos quando sair para entrega.";
          fecho = "";
        } else if (v.tom === "descontraido") {
          saud = "Oi, " + nome + "! Tudo bem?";
          corpo = "Passando para avisar que " + aCarga + " vai chegar " + tempo.replace("cerca de ", "umas ") + " depois do combinado" + (motivo ? ": um pneu furou na BR-277" : "") + ". Desculpa pelo contratempo!";
          extra = "Assim que o caminhão voltar para a estrada, mandamos notícia.";
          fecho = "Abraço,";
        } else {
          saud = "Olá, " + nome + ". Esperamos que esteja bem.";
          corpo = "Gostaríamos de informar que " + aCarga + " sofrerá um atraso de " + tempo + (motivo ? ", devido a um pneu furado na BR-277" : "") + "." +
            (curto ? "" : " Sabemos que a pontualidade é muito importante e lamentamos qualquer inconveniente que isso possa causar.");
          extra = "Nossa equipe está trabalhando para que a entrega seja concluída o quanto antes. Agradecemos a compreensão e permanecemos à disposição para qualquer dúvida.";
          fecho = "Atenciosamente,";
        }
        if (v.papel === "supervisor") extra += " Nova previsão de chegada: [horário].";
        if (curto) extra = v.papel === "supervisor" ? "Nova previsão de chegada: [horário]." : "";
        if (!v.tamanho && !curto && v.tom) extra += " Qualquer dúvida, estamos à disposição.";

        if (v.formato === "topicos") {
          resposta = saud + "\n• Carga: " + (carga ? "12345" : "[número da carga]") + "\n• Atraso previsto: " + (atraso ? "cerca de 2 horas" : "[tempo de atraso]") +
            "\n• Motivo: " + (motivo ? "pneu furado na BR-277" : "[motivo]") + "\n• Próximo passo: avisaremos quando o veículo sair para entrega" + "\n" + assinatura;
        } else if (v.formato === "whatsapp") {
          resposta = saud + " " + corpo + (extra ? " " + extra : "") + " — " + assinatura;
        } else {
          var corpoTodo = corpo + (extra ? " " + extra : "");
          resposta = (v.formato === "email" ? "Assunto: Atraso na entrega" + (carga ? " da carga 12345" : "") + "\n\n" : "") +
            saud + "\n\n" + corpoTodo + "\n\n" + (fecho ? fecho + "\n" : "") + assinatura;
        }
        var lacunas = (resposta.match(/\[[^\]]+\]/g) || []).length;
        nota = lacunas ? "As partes marcadas são lacunas: o prompt não deu essa informação." : "Nenhuma lacuna: o prompt trouxe tudo o que o texto precisava.";
      }

      var ITENS = [
        ["instrução", clara],
        ["contexto " + ctx.length + "/4", ctx.length > 0],
        ["papel", !!PAPEIS[v.papel]],
        ["tom", !!TONS[v.tom]],
        ["formato", !!FORMATOS[v.formato]],
        ["tamanho", !!TAMANHOS[v.tamanho]]
      ];
      var pontos = ITENS.filter(function (i) { return i[1]; }).length;
      var checklist = ITENS.map(function (i) {
        return '<span class="check' + (i[1] ? " check--sim" : "") + '">' + (i[1] ? "✓ " : "") + i[0] + "</span>";
      }).join("");
      var html =
        '<div class="chat"><div class="chat-topo"><b>Assistente de IA</b><span>resposta de exemplo</span></div>' +
        '<div class="chat-corpo"><div class="chat-msg chat-msg--voce">' + esc(textoPrompt) + "</div>" +
        '<div class="chat-msg chat-msg--ia">' + comLacunas(resposta) + "</div></div></div>" +
        '<div class="prompt-placar"><div class="checklist">' + checklist + "</div>" +
        '<p class="nota-demo">' + pontos + " de 6 partes · resposta com " + contarPalavras(resposta) + " palavras · " + esc(nota.charAt(0).toLowerCase() + nota.slice(1)) + "</p></div>";
      return { html: html, codigo: textoPrompt };
    },

    /* 13 · Lab — avaliador de prompt: confere as partes de qualquer prompt digitado */
    avaliador: function (v, lab) {
      var EXEMPLOS = {
        simples: "Escreva um e-mail para o cliente.",
        estruturado: "Escreva um e-mail formal, com tom cordial, informando atraso de 2 horas na entrega da carga 12345.",
        completo: "Você é atendente de uma transportadora. Escreva um e-mail formal e cordial para a cliente Marina, do Mercado Bom Preço, informando que a carga 12345 vai atrasar cerca de 2 horas por causa de um pneu furado na BR-277. Use no máximo 80 palavras e termine com a nova previsão de chegada. Se faltar alguma informação, pergunte antes.",
        sensivel: "Resuma em tópicos a reclamação do cliente João da Silva, CPF 123.456.789-00, telefone (45) 99999-1234."
      };
      var area = lab.querySelector("textarea");
      if (v.exemplo !== lab._ultimoExemplo) {
        lab._ultimoExemplo = v.exemplo;
        if (EXEMPLOS[v.exemplo]) { area.value = EXEMPLOS[v.exemplo]; v.texto = area.value; }
      }
      var bruto = v.texto || "", t = " " + semAcentoMin(bruto) + " ";
      var CHECKS = [
        ["Instrução", /\b(escrev|cri[ae]|resum|list[ae]|expli|traduz|revis|compar|ger[ae]|elabor|mont[ae]|fa[cz]a|sugi|suger|classific|analis|redij|redig|calcul|organiz|transform|corrij|corrig|reescrev|prepar|desenvolv|identific|descrev|planej|inform|avis|respond)/,
          "Comece com um verbo que diga a tarefa: escreva, resuma, liste, compare, traduza."],
        ["Contexto", /( para (o|a|os|as|um|uma|meu|minha|nosso|nossa) | cliente| equipe| motorista| empresa| transportadora| publico| contexto| situacao| porque | pois | carga| entrega|\d)/,
          "Diga a situação e para quem é: quem vai ler, o que aconteceu, os dados que importam."],
        ["Papel", /(voce e |voce eh |atue como|aja como|assuma o papel|faca o papel|como (um|uma) (especialista|professor|atendente|supervisor|analista|consultor|gerente|instrutor))/,
          "Dê um papel: \"Você é atendente de uma transportadora.\""],
        ["Formato", /(tabela|lista|topicos|e-?mail|mensagem|whatsapp|paragrafo|passo a passo|planilha|roteiro|em formato|quadro|relatorio|slides?)/,
          "Peça o formato da saída: e-mail, tabela, lista, tópicos, mensagem curta."],
        ["Tamanho", /(\d+\s*(palavras|linhas|frases|paragrafos|itens|topicos|caracteres)|curt[oa]|breve|no maximo|resumid|sucint)/,
          "Limite o tamanho: \"no máximo 80 palavras\", \"em 5 tópicos\"."],
        ["Tom", /( tom |formal|cordial|amigavel|direto|profissional|descontraid|tecnic|simples|persuasiv|educad|gentil|empatic|linguagem)/,
          "Diga o tom: formal, cordial, direto, simples, técnico."],
        ["Exemplo", /(exemplo|ex:|modelo:|siga este|como este|"[^"]{8,}")/,
          "Quando o formato importa, mostre um exemplo do que você quer."]
      ];
      var SENSIVEIS = [
        [/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/, "um número de CPF"],
        [/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/, "um telefone"],
        [/[\w.+-]+@[\w-]+\.[\w.]+/, "um e-mail"],
        [/senha/, "uma senha"],
        [/\d{4}[ .-]?\d{4}[ .-]?\d{4}[ .-]?\d{4}/, "um número de cartão"]
      ];
      var vazio = !bruto.trim();
      var achados = CHECKS.map(function (c) { return [c[0], !vazio && c[1].test(t), c[2]]; });
      var sensivel = SENSIVEIS.filter(function (s) { return s[0].test(bruto) || s[0].test(t); }).map(function (s) { return s[1]; });
      var palavras = contarPalavras(bruto);
      var pontos = achados.filter(function (a) { return a[1]; }).length;

      var itens = achados.map(function (a) {
        return '<li class="avalia-item' + (a[1] ? " avalia-item--sim" : "") + '"><span class="avalia-marca">' + (a[1] ? "✓" : "—") + "</span><b>" + a[0] + "</b>" +
          (a[1] ? "<span>encontrado</span>" : "<span>" + esc(a[2]) + "</span>") + "</li>";
      }).join("");
      var alerta = sensivel.length
        ? '<div class="avalia-alerta"><b>Dado pessoal no prompt:</b> ' + listaE(sensivel) + ". Troque por dados fictícios ou apague antes de enviar a uma ferramenta de IA.</div>"
        : "";
      var html =
        '<div class="avalia-topo"><b class="avalia-pontos">' + pontos + " de 7</b><span>" + palavras + " palavras" +
        (palavras && palavras < 8 ? " · curto demais: a IA vai ter que adivinhar" : "") + "</span></div>" +
        alerta + '<ul class="avalia-lista">' + itens + "</ul>" +
        '<p class="nota-demo">a conferência procura palavras-chave: serve de lembrete, não de nota</p>';
      var falta = achados.filter(function (a) { return !a[1]; }).map(function (a) { return a[0].toLowerCase(); });
      var codigo = vazio ? "digite ou cole um prompt na caixa" :
        "partes encontradas: " + (pontos ? achados.filter(function (a) { return a[1]; }).map(function (a) { return a[0].toLowerCase(); }).join(", ") : "nenhuma") + "\n" +
        "falta: " + (falta.length ? falta.join(", ") : "nada — prompt completo") +
        (sensivel.length ? "\natenção: " + listaE(sensivel) + " no texto" : "");
      return { html: html, codigo: codigo };
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
        /* controle deslizante: número no padrão brasileiro (12.000; 3,5) */
        if (eco) eco.textContent = c.type === "range"
          ? formatar(parseFloat(c.value), (c.getAttribute("step") || "").indexOf(".") !== -1 ? "dec1" : "int")
          : c.value;
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

  /* ======================================================
     10. DESTA AULA — A PRÓXIMA PALAVRA MAIS PROVÁVEL

     Um modelo de linguagem escreve uma palavra de cada vez:
     olha o texto até ali, dá uma probabilidade a cada
     palavra possível e escolhe uma. A temperatura achata ou
     afia essas probabilidades antes do sorteio.

     As probabilidades abaixo são ilustrativas (um modelo real
     escolhe entre dezenas de milhares de pedaços de palavra);
     o mecanismo de escolha é o de verdade.
     ====================================================== */

  (function () {
    var raiz = document.querySelector("[data-gerador]");
    if (!raiz) return;

    /* próxima palavra possível, conforme a última palavra escrita */
    var PROX = {
      "carga": [["chegará", 0.46], ["está", 0.30], ["foi", 0.14], ["sofreu", 0.07], ["dançou", 0.03]],
      "chegará": [["com", 0.55], ["amanhã", 0.25], ["hoje", 0.15], ["voando", 0.05]],
      "com": [["atraso", 0.60], ["duas", 0.25], ["segurança", 0.12], ["purpurina", 0.03]],
      "atraso": [["de", 0.50], [".", 0.35], ["por", 0.15]],
      "de": [["duas", 0.55], ["uma", 0.30], ["três", 0.15]],
      "duas": [["horas", 0.90], ["semanas", 0.07], ["luas", 0.03]],
      "três": [["horas", 0.95], ["luas", 0.05]],
      "uma": [["hora", 0.85], ["semana", 0.15]],
      "horas": [[".", 0.50], ["devido", 0.30], ["por", 0.20]],
      "hora": [[".", 0.60], ["devido", 0.40]],
      "semana": [[".", 1]],
      "semanas": [[".", 1]],
      "devido": [["ao", 0.60], ["à", 0.40]],
      "ao": [["trânsito", 0.45], ["pneu", 0.30], ["temporal", 0.20], ["dragão", 0.05]],
      "à": [["chuva", 0.65], ["fila", 0.35]],
      "por": [["causa", 0.80], ["conta", 0.20]],
      "causa": [["da", 0.55], ["do", 0.45]],
      "conta": [["da", 0.60], ["do", 0.40]],
      "da": [["chuva", 0.60], ["fila", 0.40]],
      "do": [["trânsito", 0.70], ["pneu", 0.30]],
      "trânsito": [[".", 0.60], ["na", 0.40]],
      "chuva": [[".", 0.60], ["na", 0.40]],
      "fila": [["na", 0.70], [".", 0.30]],
      "na": [["BR-277", 0.55], ["fronteira", 0.40], ["Lua", 0.05]],
      "está": [["a", 0.45], ["em", 0.35], ["atrasada", 0.15], ["feliz", 0.05]],
      "a": [["caminho", 1]],
      "caminho": [[".", 0.60], ["e", 0.40]],
      "e": [["chegará", 1]],
      "em": [["trânsito", 0.60], ["Cascavel", 0.30], ["órbita", 0.10]],
      "atrasada": [[".", 0.45], ["por", 0.35], ["devido", 0.20]],
      "foi": [["entregue", 0.55], ["liberada", 0.38], ["abduzida", 0.07]],
      "entregue": [[".", 0.50], ["hoje", 0.30], ["com", 0.20]],
      "liberada": [[".", 0.40], ["no", 0.40], ["hoje", 0.20]],
      "no": [["porto", 0.60], ["pátio", 0.40]],
      "porto": [["seco", 0.90], [".", 0.10]],
      "hoje": [[".", 0.60], ["às", 0.40]],
      "às": [["14h", 0.60], ["10h", 0.40]],
      "sofreu": [["um", 0.70], ["atraso", 0.30]],
      "um": [["atraso", 0.60], ["imprevisto", 0.40]],
      "imprevisto": [[".", 0.60], ["na", 0.40]],
      "amanhã": [[".", 0.50], ["cedo", 0.30], ["às", 0.20]]
    };
    var INICIO = ["Prezado", "cliente,", "sua", "carga"];
    var LIMITE = 16;

    var elGerado = raiz.querySelector("[data-gerado]");
    var elCand = raiz.querySelector("[data-candidatos]");
    var elTemp = raiz.querySelector("[data-temp]");
    var elTempEco = raiz.querySelector("[data-temp-eco]");
    var elNota = raiz.querySelector("[data-gerador-nota]");
    var btGerar = raiz.querySelector("[data-gerar]");
    var btCompletar = raiz.querySelector("[data-completar]");
    var btRecomecar = raiz.querySelector("[data-recomecar]");
    var texto;

    function opcoes() {
      var ultima = texto[texto.length - 1];
      if (ultima === "." || texto.length - INICIO.length >= LIMITE) return [];
      return PROX[ultima] || [[".", 1]];
    }

    /* temperatura 0: sempre a mais provável; acima de 1, as improváveis ganham força */
    function ajustar(lista) {
      var T = parseFloat(elTemp.value);
      if (T <= 0.001) {
        var max = Math.max.apply(null, lista.map(function (o) { return o[1]; }));
        var escolhida = false;
        return lista.map(function (o) { var p = !escolhida && o[1] === max ? 1 : 0; if (p) escolhida = true; return [o[0], p]; });
      }
      var pesos = lista.map(function (o) { return Math.pow(o[1], 1 / T); });
      var soma = pesos.reduce(function (s, p) { return s + p; }, 0);
      return lista.map(function (o, i) { return [o[0], pesos[i] / soma]; });
    }

    function sortear(lista) {
      var r = Math.random(), acc = 0;
      for (var i = 0; i < lista.length; i++) { acc += lista[i][1]; if (r < acc) return lista[i][0]; }
      return lista[lista.length - 1][0];
    }

    function escrever(palavra) {
      texto.push(palavra);
      desenhar();
    }

    function desenhar() {
      var frase = texto.slice(INICIO.length).map(function (w, i, arr) {
        var ultima = i === arr.length - 1;
        return (w === "." ? "" : " ") + '<span class="palavra' + (ultima ? " palavra--nova" : "") + '">' + esc(w) + "</span>";
      }).join("");
      elGerado.innerHTML = frase;
      var lista = ajustar(opcoes());
      var fim = !lista.length;
      elCand.innerHTML = fim ? '<p class="gerador-fim">frase completa. Recomece para gerar outra.</p>' : lista.map(function (o) {
        var pct = Math.round(o[1] * 100);
        return '<button type="button" class="candidato" data-palavra="' + esc(o[0]) + '"><span class="candidato-palavra">' + esc(o[0] === "." ? ". (fim)" : o[0]) + "</span>" +
          '<span class="candidato-trilho"><i style="width:' + Math.max(pct, 0.5) + '%"></i></span><b>' + (o[1] > 0 && pct === 0 ? "&lt;1" : pct) + "%</b></button>";
      }).join("");
      btGerar.disabled = fim;
      btCompletar.disabled = fim;
      var T = parseFloat(elTemp.value);
      elTempEco.textContent = formatar(T, "dec1");
      elNota.textContent = T <= 0.001 ? "temperatura 0: a escolha é sempre a palavra mais provável; a frase sai igual toda vez"
        : T < 1 ? "temperatura baixa: as palavras prováveis ganham ainda mais chance; a frase varia pouco"
        : T === 1 ? "temperatura 1: o sorteio segue as probabilidades do modelo"
        : "temperatura alta: as improváveis ganham chance; a frase fica criativa e pode sair absurda";
    }

    elCand.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-palavra]");
      if (b) escrever(b.getAttribute("data-palavra"));
    });
    btGerar.addEventListener("click", function () {
      var lista = ajustar(opcoes());
      if (lista.length) escrever(sortear(lista));
    });
    btCompletar.addEventListener("click", function () {
      var guarda = 0, lista;
      while ((lista = ajustar(opcoes())).length && guarda++ < 40) texto.push(sortear(lista));
      desenhar();
    });
    btRecomecar.addEventListener("click", function () { texto = INICIO.slice(); desenhar(); });
    elTemp.addEventListener("input", desenhar);

    texto = INICIO.slice();
    desenhar();
  })();

  /* ======================================================
     11. DESTA AULA — COPIAR O PROMPT MONTADO

     <button data-copiar="#id-do-pre">: copia o texto do alvo
     para colar numa ferramenta de IA de verdade.
     ====================================================== */

  document.querySelectorAll("[data-copiar]").forEach(function (b) {
    var original = b.textContent;
    b.addEventListener("click", function () {
      var alvo = document.querySelector(b.getAttribute("data-copiar"));
      if (!alvo) return;
      var t = alvo.textContent;
      function avisar(ok) {
        b.textContent = ok ? "copiado" : "não foi possível copiar";
        setTimeout(function () { b.textContent = original; }, 1600);
      }
      function reserva() {
        var area = document.createElement("textarea");
        area.value = t;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(area);
        avisar(ok);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { avisar(true); }, reserva);
      } else reserva();
    });
  });
})();
