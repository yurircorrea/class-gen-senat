/* =========================================================
   aula.js — motor da aula em página única
   1. Colorização dos painéis (fórmula, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   4. Formatos de número (moeda, porcentagem…) em pt-BR
   5. Mini planilha com fórmulas em português
   6. Laboratórios interativos (construtores desta aula)
   8. Quiz de verificação
   9. Tour: passo a passo clicável sobre um aplicativo
   10. Desta aula: valores colados × fórmulas
   11. Desta aula: o cardápio no navegador
   12. Desta aula: copiar o pedido montado

   Aula: IA na Prática · Aula 3 · O Claude no trabalho.
   As seções 3 (simuladores de tela) e 7 (playground) do
   modelo não são usadas e foram retiradas.
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

     A saída não precisa ser código: pode ser o pedido, o
     caminho de menus ou o arquivo que produz o resultado do
     palco (marque o <pre data-saida> com data-lang="texto").

     NUNCA emita atributo vazio (class="") no código gerado:
     monte o atributo inteiro condicionalmente.
     ====================================================== */

  /* utilitários dos laboratórios desta aula */
  function semAcentoMin(s) { return semAcento(String(s).toLowerCase()); }
  function listaE(itens) {
    if (itens.length < 2) return itens.join("");
    return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
  }
  function chips(itens) {
    return '<div class="checklist">' + itens.map(function (i) {
      return '<span class="check' + (i[1] ? " check--sim" : "") + '">' + (i[1] ? "✓ " : "") + esc(i[0]) + "</span>";
    }).join("") + "</div>";
  }
  function avisos(lista) {
    return lista.length ? '<div class="avisos">' + lista.map(function (a) {
      var forte = a.charAt(0) === "!";
      return '<p class="aviso' + (forte ? " aviso--forte" : "") + '">' + esc(forte ? a.slice(1) : a) + "</p>";
    }).join("") + "</div>" : "";
  }
  /* caixa de veredito: tipo ok, atencao ou erro */
  function veredito(tipo, titulo, texto) {
    return '<div class="veredito veredito--' + tipo + '"><b>' + esc(titulo) + "</b><p>" + esc(texto) + "</p></div>";
  }
  function barra(rotulo, frac, valor) {
    return '<div class="barra-h"><span>' + esc(rotulo) + '</span><span class="barra-h-trilho"><i style="width:' +
      Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%"></i></span><b>' + esc(valor) + "</b></div>";
  }
  function milhar(n) { return formatar(n, "int"); }

  /* 05 · dados fictícios do dashboard de vendas (54 linhas: 6 meses × 3 vendedores × 3 categorias) */
  var VENDAS = (function () {
    var vend = { Ana: 1.15, Bruno: 0.9, Carla: 1.0 };
    var cat = { "Peças": [4200, 38], "Pneus": [3600, 9], "Serviços": [2500, 21] };
    var saz = [0.9, 0.85, 1.05, 1.0, 1.2, 1.1];
    var linhas = [];
    saz.forEach(function (s, i) {
      Object.keys(vend).forEach(function (vd, j) {
        Object.keys(cat).forEach(function (c, k) {
          var ruido = 1 + (((i * 7 + j * 5 + k * 3) % 9) - 4) / 40;
          linhas.push({
            mes: i, vend: vd, cat: c,
            valor: Math.round(cat[c][0] * vend[vd] * s * ruido / 10) * 10,
            pedidos: Math.max(1, Math.round(cat[c][1] * vend[vd] * s * ruido))
          });
        });
      });
    });
    return linhas;
  })();

  var construtores = {

    /* 01 · Lab — conversar ou executar: quem faz cada passo */
    quemfaz: function (v) {
      var T = {
        relatorio: {
          conversa: ["Como eu faço o relatório da semana a partir de extratos em PDF e de uma planilha?", [
            ["voce", "pergunta como fazer o relatório"], ["claude", "explica os passos e sugere um modelo de texto"],
            ["voce", "abre cada PDF e a planilha e copia os números"], ["voce", "cola os números na conversa e pede o texto"],
            ["voce", "abre o Word, cola o texto e formata as tabelas"], ["voce", "salva o arquivo na pasta"]]],
          agente: ["Acesse a pasta Relatório semanal, consolide os dados dos arquivos e crie o relatório da semana em Word nessa mesma pasta.", [
            ["voce", "pede o resultado e indica a pasta"], ["decide", "autoriza o acesso à pasta"],
            ["claude", "lê os PDFs e a planilha"], ["claude", "consolida os dados"],
            ["claude", "cria o Word formatado na própria pasta"], ["decide", "confere o resumo e o arquivo"]]]
        },
        notas: {
          conversa: ["Como eu padronizo o nome de 20 notas fiscais em PDF?", [
            ["voce", "pergunta como padronizar os nomes"], ["claude", "sugere um padrão: data, número e fornecedor"],
            ["voce", "abre nota por nota para ver a data"], ["voce", "renomeia os 20 arquivos à mão"],
            ["voce", "confere se nenhum ficou de fora"]]],
          agente: ["Acesse a pasta Notas fiscais e organize as notas. Padronize nome e data.", [
            ["voce", "pede o resultado e indica a pasta"], ["decide", "autoriza o acesso à pasta"],
            ["claude", "lista os 20 PDFs e analisa os nomes"], ["claude", "lê a data dentro das notas que não têm data no nome"],
            ["claude", "renomeia tudo no padrão combinado"], ["decide", "confere o resumo do que foi feito"]]]
        },
        email: {
          conversa: ["Escreva uma resposta para este e-mail: [texto do e-mail colado aqui]", [
            ["voce", "copia o e-mail do cliente para a conversa"], ["claude", "escreve uma resposta"],
            ["voce", "copia a resposta"], ["voce", "abre o Gmail, cola e ajusta"], ["voce", "envia"]]],
          agente: ["Responda ao e-mail do suporte sobre a fatura de setembro. Quero ver antes de enviar.", [
            ["voce", "pede o resultado, sem copiar nada"], ["claude", "busca e lê a mensagem no Gmail (conector)"],
            ["claude", "escreve duas versões do rascunho"], ["decide", "escolhe a versão e aprova o envio"],
            ["claude", "envia a resposta"]]]
        }
      };
      var QUEM = { voce: "você faz", claude: "o Claude faz", decide: "você decide" };
      var t = T[v.tarefa][v.modo];
      var n = { voce: 0, claude: 0, decide: 0 };
      var itens = t[1].map(function (p) {
        n[p[0]]++;
        return '<li class="qf qf--' + p[0] + '"><span class="qf-quem">' + QUEM[p[0]] + "</span><span>" + esc(p[1]) + "</span></li>";
      }).join("");
      var html =
        '<ol class="quem-faz">' + itens + "</ol>" +
        '<p class="placar-linha"><b>Você executou ' + n.voce + " de " + t[1].length + " passos.</b> O Claude executou " + n.claude +
        (n.decide ? "; você só decidiu em " + n.decide + "." : ".") + "</p>";
      return { html: html, codigo: t[0] };
    },

    /* 02 · Lab — modelo e esforço pela tarefa */
    modelo: function (v) {
      var M = { haiku: ["Haiku 5.5", 1], sonnet: ["Sonnet 5.5", 2], opus: ["Opus 5.5", 3], fable: ["Fable 5.1", 4] };
      var NOMES = ["", "Haiku 5.5", "Sonnet 5.5", "Opus 5.5", "Fable 5.1"];
      var E = { baixo: ["baixo", 1], medio: ["médio", 2], alto: ["alto", 3] };
      var ESF = ["", "baixo", "médio", "alto"];
      var T = {
        classificar: ["Classificar 5.000 comentários de clientes em elogio, reclamação ou dúvida", 1, 1, "Tarefa simples em grande volume: o mais rápido e mais barato resolve."],
        resumo: ["Resumir a ata de uma reunião de duas páginas", 1, 1, "Tarefa curta e simples: não precisa de um modelo forte."],
        email: ["Responder ao e-mail de um cliente, no dia a dia", 2, 1, "É o uso diário: equilíbrio entre qualidade, velocidade e custo."],
        analise: ["Analisar uma base de vendas em sete etapas encadeadas", 3, 2, "Muitas etapas encadeadas: o perfil do dia a dia pesado."],
        sistema: ["Reescrever um sistema inteiro, com dezenas de arquivos, numa sessão só", 4, 3, "Tarefa longa e muito complexa: capacidade vale mais que custo."]
      };
      var t = T[v.tarefa], m = M[v.modelo], e = E[v.esforco];
      var dif = m[1] - t[1];
      var ver = dif < 0 ? ["erro", "Modelo insuficiente", "Pode patinar nesta tarefa. Suba para o " + NOMES[t[1]] + "."]
        : dif === 0 ? ["ok", "Modelo na medida", t[3]]
        : dif === 1 ? ["atencao", "Funciona, mas gasta mais", "O " + NOMES[t[1]] + " já resolve e consome menos da sua cota."]
        : ["atencao", "Capacidade sobrando", "Gasta bem mais cota sem melhorar o resultado. O " + NOMES[t[1]] + " resolve."];
      var notas = [];
      if (e[1] > t[2]) notas.push("Esforço acima do necessário: mais raciocínio, mais tokens, a mesma resposta. Para esta tarefa, esforço " + ESF[t[2]] + ".");
      if (e[1] < t[2]) notas.push("Pouco esforço para uma tarefa difícil: mais raciocínio antes de responder ajuda aqui. Tente o esforço " + ESF[t[2]] + ".");
      var consumo = m[1] * [0, 1, 1.5, 2][e[1]];
      var html =
        '<div class="seletor-modelo"><span class="seletor-pilula">' + esc(m[0]) + ' <i class="seta-baixo"></i></span>' +
        '<span class="seletor-pilula seletor-pilula--claro">esforço ' + esc(e[0]) + ' <i class="seta-baixo"></i></span></div>' +
        barra("capacidade do modelo", m[1] / 4, m[1] + " de 4") +
        barra("consumo da cota", consumo / 8, consumo <= 2 ? "baixo" : consumo <= 4 ? "médio" : "alto") +
        veredito(ver[0], ver[1], ver[2]) + avisos(notas) +
        '<p class="nota-demo">escalas ilustrativas, para comparar os modelos entre si</p>';
      var codigo =
        "Modelo: " + m[0] + "\nEsforço: " + e[0] + "\n\n" +
        "Tarefa: " + t[0] + "\n" +
        "Na medida: " + NOMES[t[1]] + ", esforço " + ESF[t[2]];
      return { html: html, codigo: codigo };
    },

    /* 03 · Lab — antes de enviar: plano, treinamento e tipo de dado */
    privacidade: function (v) {
      var PL = { free: ["Free", true], pro: ["Pro", true], max: ["Max", true], team: ["Team", false], enterprise: ["Enterprise", false] };
      var D = {
        cardapio: ["o cardápio público da lanchonete", 0],
        vendas: ["a planilha de vendas interna da empresa", 1],
        motoristas: ["a lista de motoristas com nome, CPF e CNH", 2],
        contrato: ["um contrato assinado com um cliente", 2]
      };
      var p = PL[v.plano], d = D[v.dado], individual = p[1];
      var treino = individual
        ? (v.treino === "ligado" ? "pode ser usada para treinar novos modelos" : "não é usada para treinar novos modelos")
        : "não é usada para treinar modelos, por padrão";
      var ver, notas = [];
      if (d[1] === 0) ver = ["ok", "Pode enviar", "É informação pública: não há o que proteger."];
      else if (d[1] === 1) ver = individual
        ? ["atencao", "Envie com cuidado", "Informação interna: confira a política da empresa antes. Prefira a conta da empresa a uma conta pessoal."]
        : ["ok", "Pode enviar, seguindo a política", "Conta da empresa: siga as regras internas de uso de IA."];
      else ver = individual
        ? ["erro", "Não envie assim", "Dados pessoais e documentos confidenciais não vão para uma conta pessoal. Troque nomes e documentos por códigos, ou use a conta da empresa com autorização."]
        : ["atencao", "Só com autorização", "Mesmo na conta da empresa, envie o mínimo necessário: troque CPF e CNH por códigos sempre que possível."];
      if (individual && v.treino === "ligado" && d[1] > 0) notas.push("Com o treinamento ligado, esta conversa pode entrar no treino de novos modelos.");
      if (!individual) notas.push("Nos planos Team e Enterprise, quem define as regras é o administrador da conta da empresa.");
      if (d[1] === 2) notas.push("Desligar o treinamento não libera qualquer dado: a LGPD e as regras da empresa continuam valendo.");
      var html =
        '<div class="ficha-privacidade">' +
        '<div><span>plano</span><b>' + esc(p[0]) + "</b><small>" + (individual ? "individual" : "comercial") + "</small></div>" +
        '<div><span>esta conversa</span><b class="ficha-menor">' + esc(treino) + "</b></div>" +
        "</div>" +
        veredito(ver[0], ver[1], ver[2]) + avisos(notas);
      var codigo =
        "Plano: " + p[0] + (individual ? " (individual)" : " (comercial)") + "\n" +
        (individual ? "Treinamento com as conversas: " + v.treino + "\n" : "Treinamento: não, por padrão\n") +
        "Dado: " + d[0] + "\n" +
        "Decisão: " + ver[1].toLowerCase();
      return { html: html, codigo: codigo };
    },

    /* 04 · Demo — o dashboard que o pedido curto gerou (filtros de verdade) */
    dashboard: function (v) {
      var MESES = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun."];
      var f = VENDAS.filter(function (l) {
        return (v.vendedor === "todos" || l.vend === v.vendedor) && (v.categoria === "todas" || l.cat === v.categoria);
      });
      var fat = 0, ped = 0, porMes = [0, 0, 0, 0, 0, 0], porCat = {};
      f.forEach(function (l) {
        fat += l.valor; ped += l.pedidos; porMes[l.mes] += l.valor;
        porCat[l.cat] = (porCat[l.cat] || 0) + l.valor;
      });
      var max = Math.max.apply(null, porMes) || 1;
      var melhor = porMes.indexOf(max);
      var cols = porMes.map(function (x, i) {
        return '<div class="grafico-col' + (i === melhor ? " grafico-col--destaque" : "") + '"><b>' + formatar(x / 1000, "dec1") + '</b><i style="--v:' + (x / max).toFixed(3) + '"></i></div>';
      }).join("");
      var rot = MESES.map(function (m) { return "<span>" + m + "</span>"; }).join("");
      var cats = Object.keys(porCat).map(function (c) { return barra(c, porCat[c] / fat, formatar(porCat[c] / fat, "pct")); }).join("");
      return (
        '<div class="dash-kpis">' +
        '<div><span>faturamento</span><b>' + formatar(fat, "moeda") + "</b></div>" +
        '<div><span>pedidos</span><b>' + milhar(ped) + "</b></div>" +
        '<div><span>ticket médio</span><b>' + formatar(fat / ped, "moeda") + "</b></div>" +
        '<div><span>melhor mês</span><b>' + MESES[melhor] + "</b></div></div>" +
        '<div class="dash-corpo"><div class="dash-bloco"><p class="dash-rotulo">faturamento por mês (R$ mil)</p>' +
        '<div class="grafico grafico--dash">' + cols + '</div><div class="grafico-rotulos">' + rot + "</div></div>" +
        '<div class="dash-bloco"><p class="dash-rotulo">participação por categoria</p>' + cats + "</div></div>"
      );
    },

    /* 05 · Lab — o prompt de artefato em seis blocos */
    artefato: function (v) {
      var FUNC = {
        gastos: ["um painel de controle de gastos pessoais", "Meus gastos", [["Mercado", "R$ 640,00"], ["Combustível", "R$ 380,00"], ["Conta de luz", "R$ 162,40"]]],
        frota: ["um controle de manutenção da frota", "Manutenção da frota", [["Caminhão 01 · troca de óleo", "12/11"], ["Caminhão 02 · pneus", "18/11"], ["Van 03 · revisão", "02/12"]]],
        checklist: ["um checklist de inspeção do veículo antes da viagem", "Inspeção antes da viagem", [["Pneus e estepe", "✓"], ["Freios", "✓"], ["Faróis e setas", "pendente"]]]
      };
      var ESTILO = {
        claro: "minimalista e claro, com bastante espaço em branco",
        escuro: "escuro, com destaque em ciano, parecido com o painel de um carro",
        colorido: "colorido e alegre, com ícones grandes"
      };
      var FUNCS = [["fCad", "cadastrar e editar itens", "+ novo"], ["fFiltro", "filtrar e buscar", "filtrar"], ["fGrafico", "ver um gráfico com o resumo", "gráfico"]];
      var DADOS = { ficticios: "use dados fictícios para validar; depois eu envio os reais", reais: "use os dados da planilha que vou anexar" };
      var CONTEXTO = {
        aula: "vai ser usado em uma aula e compartilhado com os alunos por link",
        equipe: "vai ser usado pela equipe da oficina, pelo celular",
        pessoal: "é para uso pessoal, no computador"
      };
      var EXTRAS = [["xCelular", "funcionar bem no celular"], ["xExportar", "ter um botão para exportar os dados"], ["xAnim", "ter animações suaves"]];

      var fn = FUNCS.filter(function (f) { return v[f[0]] === "true"; });
      var ex = EXTRAS.filter(function (x) { return v[x[0]] === "true"; });
      var linhas = [];
      linhas.push(v.func ? "Crie um artefato que funcione como " + FUNC[v.func][0] + "." : "Crie um artefato.");
      if (v.estilo) linhas.push("Estilo visual: " + ESTILO[v.estilo] + ".");
      if (fn.length) linhas.push("Funções: o usuário precisa conseguir " + listaE(fn.map(function (f) { return f[1]; })) + ".");
      if (v.dados) linhas.push("Dados: " + DADOS[v.dados] + ".");
      if (v.contexto) linhas.push("Contexto de uso: " + CONTEXTO[v.contexto] + ".");
      if (ex.length) linhas.push("Extras: quero " + listaE(ex.map(function (x) { return x[1]; })) + ".");

      var BLOCOS = [["funcionalidade", !!v.func], ["estilo visual", !!v.estilo], ["funções", fn.length > 0],
        ["dados", !!v.dados], ["contexto de uso", !!v.contexto], ["extras", ex.length > 0]];
      var feitos = BLOCOS.filter(function (b) { return b[1]; }).length;
      var decide = [];
      if (!v.func) decide.push("o que construir");
      if (!v.estilo) decide.push("cores e visual");
      if (!fn.length) decide.push("quais botões existem");
      if (!v.dados) decide.push("de onde vêm os números");
      if (!v.contexto) decide.push("para quem é e onde será usado");

      /* esboço do artefato que o pedido descreve */
      var f = FUNC[v.func];
      var botoes = fn.map(function (x) { return '<span class="art-botao">' + esc(x[2]) + "</span>"; }).join("") +
        (v.xExportar === "true" ? '<span class="art-botao art-botao--exportar">exportar</span>' : "");
      var corpo;
      if (!v.func) corpo = '<p class="art-vazio">?</p>';
      else if (v.dados === "reais") corpo = '<p class="art-espera">aguardando a planilha anexada…</p>';
      else if (v.dados === "ficticios") corpo = '<ul class="art-lista">' + f[2].map(function (r) {
        return "<li><span>" + esc(r[0]) + "</span><b>" + esc(r[1]) + "</b></li>";
      }).join("") + "</ul>";
      else corpo = '<ul class="art-lista art-lista--incerta"><li><span>?</span><b>?</b></li><li><span>?</span><b>?</b></li></ul>';
      if (v.func && v.fGrafico === "true") corpo += '<div class="art-grafico"><i style="--v:.55"></i><i style="--v:.9"></i><i style="--v:.4"></i><i style="--v:.7"></i></div>';
      var janela =
        '<div class="artefato artefato--' + (v.estilo || "indefinido") + (v.xAnim === "true" ? " artefato--anim" : "") + '">' +
        '<div class="art-topo"><b>' + (v.func ? esc(f[1]) : "artefato") + "</b>" +
        (v.dados === "ficticios" ? '<span class="art-selo">dados fictícios</span>' : "") + "</div>" +
        (botoes ? '<div class="art-botoes">' + botoes + "</div>" : "") +
        '<div class="art-corpo">' + corpo + "</div></div>";
      if (v.xCelular === "true") janela = '<div class="celular">' + janela + "</div>";

      var notas = [];
      if (v.dados === "reais") notas.push("Comece com dados fictícios: valide o artefato antes de expor os dados reais.");
      if (v.contexto === "aula" && v.dados === "reais") notas.push("!Artefato compartilhado por link público com dados reais: qualquer pessoa com o link vê os números.");
      var html =
        '<div class="art-palco">' + janela + "</div>" +
        chips(BLOCOS) +
        '<p class="placar-linha"><b>' + feitos + " de 6</b> blocos" + (decide.length ? " · o Claude decide sozinho: " + esc(listaE(decide)) : "") + "</p>" +
        avisos(notas);
      return { html: html, codigo: linhas.join("\n") };
    },

    /* 05 · Lab — compartilhar o artefato: quem vê e qual versão */
    compartilhar: function (v) {
      var privado = v.quem === "privado", ultima = v.versao === "v3";
      var corpo, ver;
      if (privado) {
        corpo = '<p class="link-fechado">Este artefato é privado.<br>Só quem o criou consegue abrir.</p>';
        ver = veredito("atencao", "O link não abre para mais ninguém", "Artefatos começam privados. Para enviar a alguém, escolha quem pode ver.");
      } else {
        corpo = '<div class="link-artefato"><b>Dashboard de vendas</b><small>versão ' + (ultima ? "3" : "2") + "</small>" +
          chips([["filtro por categoria", true], ["filtro por vendedor", ultima], ["clique na barra filtra o painel", ultima]]) + "</div>";
        ver = ultima
          ? veredito("ok", "O colega vê a versão mais recente", "Quem recebe um link público abre o artefato sem ter conta no Claude.")
          : veredito("erro", "O link mostra a versão antiga", "Você editou depois de compartilhar, mas a versão publicada continua a 2. Publique a mais recente.");
      }
      var html = '<div class="navegador"><div class="navegador-barra"><i></i><i></i><i></i><span class="navegador-endereco">link do artefato, aberto pelo colega</span></div>' +
        '<div class="link-corpo">' + corpo + "</div></div>" + ver;
      var codigo = "Abrir o artefato › Compartilhar\nQuem pode ver: " + (privado ? "somente você" : "qualquer pessoa com o link") +
        (privado ? "" : "\nVersão compartilhada: " + (ultima ? "3 (a mais recente)" : "2") + "\nCopiar o link");
      return { html: html, codigo: codigo };
    },

    /* 06 · Lab — um pedido seguro para o Cowork */
    cowork: function (v) {
      var caminho = String(v.caminho || "").trim();
      var pasta = caminho.split(/[\\\/]/).filter(Boolean).pop() || "";
      var naoApagar = v.naoApagar === "true", resumo = v.resumo === "true", dentro = v.dataDentro === "true";
      var linhas = [], html = "", notas = [];
      if (v.tarefa === "notas") {
        linhas.push(caminho ? "Acesse a pasta " + caminho + " e organize as notas fiscais." : "Organize as notas fiscais.");
        linhas.push("Padronize o nome como AAAA-MM_NF-número_fornecedor.");
        if (dentro) linhas.push("Se a data não estiver no nome, abra a nota e use a data de emissão.");
      } else {
        linhas.push(caminho ? "Acesse a pasta " + caminho + " e consolide os dados dos arquivos." : "Consolide os dados dos arquivos.");
        linhas.push("Quero o relatório da semana em Word, criado nessa mesma pasta.");
      }
      if (naoApagar) linhas.push("Você pode ler, criar e renomear arquivos, mas nunca apague nada.");
      if (resumo) linhas.push("Ao terminar, faça um resumo de tudo o que foi feito.");

      if (!caminho) {
        html = '<div class="chat"><div class="chat-corpo"><div class="chat-msg chat-msg--ia">Em qual pasta estão os arquivos? Preciso do caminho para começar.</div></div></div>' +
          '<p class="placar-linha">Sem o caminho, o trabalho para na primeira pergunta.</p>';
        return { html: html, codigo: linhas.join("\n") };
      }
      var arqs;
      if (v.tarefa === "notas") {
        arqs = [
          ["nf posto sol março.pdf", "2026-03_NF-1187_posto-sol.pdf", "ok"],
          ["NOTA 1203.pdf", dentro ? "2026-03_NF-1203_auto-pecas-iguacu.pdf" : "2026-xx_NF-1203.pdf", dentro ? "ok" : "falta"],
          ["pneus_abril_nf1251.pdf", "2026-04_NF-1251_pneus-fronteira.pdf", "ok"],
          ["scan0007.pdf", dentro ? "2026-04_NF-1276_oficina-trevo.pdf" : "xxxx-xx_scan0007.pdf", dentro ? "ok" : "falta"],
          ["NF 1302 lava jato maio.pdf", "2026-05_NF-1302_lava-jato-277.pdf", "ok"],
          ["NF 1302 lava jato maio (1).pdf", naoApagar ? "mantido · possível cópia do anterior" : "apagado: o Claude julgou ser cópia", naoApagar ? "mantido" : "apagado"]
        ];
      } else {
        arqs = [
          ["extrato-semana-41.pdf", "lido", "ok"],
          ["lancamentos-semana-41.pdf", "lido", "ok"],
          ["planilha-semana-41.xlsx", "lida", "ok"],
          ["relatorio-semana.docx (semana 40)", naoApagar ? "mantido" : "substituído pelo relatório novo", naoApagar ? "mantido" : "apagado"],
          [naoApagar ? "relatorio-semana-41.docx" : "relatorio-semana.docx", "criado: resumo e tabelas", "novo"]
        ];
      }
      var faltam = arqs.filter(function (a) { return a[2] === "falta"; }).length;
      var apagados = arqs.filter(function (a) { return a[2] === "apagado"; }).length;
      var tabela = '<table class="pasta-lista"><thead><tr><th>na pasta</th><th>depois</th></tr></thead><tbody>' +
        arqs.map(function (a) {
          return '<tr class="arq--' + a[2] + '"><td>' + esc(a[0]) + "</td><td>" + esc(a[1]) + "</td></tr>";
        }).join("") + "</tbody></table>";
      if (faltam) notas.push(faltam + " arquivos ficaram sem data: o nome não tinha a data e o pedido não mandou abrir a nota.");
      if (apagados) notas.push("!Sem a proibição, o Claude decidiu apagar " + (apagados === 1 ? "um arquivo" : apagados + " arquivos") + " por conta própria.");
      if (!resumo) notas.push("Sem o resumo, você confere a pasta arquivo por arquivo para saber o que mudou.");
      html =
        '<div class="permissao"><p>O Claude quer acessar a pasta <b>' + esc(pasta) + '</b></p><span class="permissao-sim">Permitir</span><span class="permissao-nao">Negar</span></div>' +
        tabela + avisos(notas) +
        (resumo ? '<div class="resumo-cowork"><b>Resumo do Claude</b><p>' +
          (v.tarefa === "notas"
            ? arqs.length + " arquivos analisados, " + (arqs.length - apagados - (naoApagar ? 1 : 0)) + " renomeados no padrão" +
              (faltam ? ", " + faltam + " sem data no nome (abra e confira)" : dentro ? ", 2 com a data lida dentro da nota" : "") +
              (naoApagar ? ", 1 possível cópia mantida para você decidir. Nada foi apagado." : ", 1 cópia apagada.")
            : "3 arquivos lidos e consolidados; relatório da semana 41 criado na pasta" + (naoApagar ? "; nada foi apagado ou substituído." : "; o relatório da semana 40 foi substituído.")) +
          "</p></div>" : "");
      return { html: html, codigo: linhas.join("\n") };
    },

    /* 09 · Lab — a mesma informação para três públicos */
    publico: function (v) {
      var P = {
        sindico: ["o síndico", "impacto financeiro e preparação para as perguntas", "direto, baseado em dados, sem jargão financeiro", [
          ["Resumo do período", "R$ 21.350 em atraso de janeiro a maio", "taxa de 20%: de cada 10 cobranças, 2 atrasam"],
          ["Evolução mensal", "Março e maio, meses de alerta", "maio teve R$ 5.690 em atraso, o pior mês"],
          ["Concentração por torre", "Torre D lidera, todas acima do limite", "limite combinado: 10% por torre"],
          ["Perguntas e respostas", "Cinco perguntas que o conselho vai fazer", "cada uma com a resposta baseada nos dados"]]],
        conselho: ["o conselho do condomínio", "riscos e decisões", "objetivo, com critérios e cenários", [
          ["Risco financeiro", "Com multa e juros, a dívida passa de R$ 22 mil", "exposição total corrigida até maio"],
          ["Inadimplentes crônicos", "Nove unidades com mais de 90 dias de atraso", "concentram a maior parte do valor"],
          ["Critérios para o jurídico", "Proposta: jurídico após 90 dias de atraso", "para votação na próxima reunião"],
          ["Cenários", "Sem acordos, a perda projetada cresce", "com acordos, o valor em risco cai"]]],
        moradores: ["a assembleia de moradores", "entendimento e participação", "simples, com exemplos do dia a dia, sem gráficos técnicos", [
          ["O que é inadimplência", "De cada 10 taxas, 2 ficam em atraso", "é a taxa paga depois do vencimento"],
          ["Como afeta os moradores", "Taxa atrasada vira conserto que demora", "elevador, portaria e limpeza dependem dela"],
          ["O que está sendo feito", "Lembrete antes do vencimento e acordos", "para quem está com dificuldade"],
          ["Como cada um pode ajudar", "Pague em dia ou procure a administração", "um acordo é melhor que a dívida crescendo"]]]
      };
      var p = P[v.publico], af = v.afirmativos === "true";
      var html = '<div class="slides">' + p[3].map(function (s, i) {
        return '<div class="slide-mini"><small>slide ' + (i + 2) + "</small><b>" + esc(af ? s[1] : s[0]) + "</b><p>" + esc(s[2]) + "</p></div>";
      }).join("") + "</div>" +
        '<p class="placar-linha">' + (af ? "<b>Títulos afirmativos:</b> quem lê só o título já sabe a conclusão." : "<b>Títulos genéricos:</b> dizem o assunto, não a conclusão.") + "</p>";
      var codigo =
        "Usando as abas da planilha, sem inventar dados,\ncrie a versão da apresentação para " + p[0] + ".\n" +
        "Enfatize: " + p[1] + ".\nTom: " + p[2] + "." +
        (af ? "\nTítulos que já digam a conclusão de cada slide." : "");
      return { html: html, codigo: codigo };
    },

    /* 10 · Lab — permissões por ação de um conector */
    permissoes: function (v) {
      var A = {
        buscar: ["Buscar e-mails", false], ler: ["Ler mensagem", false], rascunho: ["Criar rascunho", true],
        enviar: ["Enviar e-mail", true], encaminhar: ["Encaminhar e-mail", true]
      };
      var NOME = { sempre: "Sempre permitir", aprovacao: "Requer aprovação", bloqueado: "Bloqueado" };
      var PED = {
        resumir: ["Faça um resumo dos e-mails desta semana.", ["buscar", "ler"]],
        responder: ["Responda ao e-mail do suporte sobre a fatura.", ["buscar", "ler", "rascunho", "enviar"]],
        encaminhar: ["Encaminhe o boleto do fornecedor para o financeiro.", ["buscar", "ler", "encaminhar"]]
      };
      var ped = PED[v.pedido], parou = false;
      var passos = ped[1].map(function (k) {
        var st = v[k], cls, txt;
        if (parou) { cls = "nao"; txt = "não chegou a acontecer"; }
        else if (st === "sempre") { cls = "sempre"; txt = "executou sem perguntar"; }
        else if (st === "aprovacao") { cls = "aprovacao"; txt = "pediu a sua aprovação antes"; }
        else { cls = "bloqueado"; txt = "bloqueado: o Claude para e avisa que não pode"; parou = true; }
        return '<li class="acao acao--' + cls + '"><b>' + esc(A[k][0]) + "</b><span>" + esc(txt) + "</span></li>";
      }).join("");
      var notas = [];
      ["enviar", "encaminhar"].forEach(function (k) {
        if (v[k] === "sempre") notas.push("!" + A[k][0] + " em sempre permitir: algo sai em seu nome sem você ver.");
      });
      if (v.buscar === "bloqueado" || v.ler === "bloqueado") notas.push("Leitura bloqueada: o conector fica travado e o Claude não consegue nem achar o e-mail.");
      if (v.rascunho === "sempre" && !notas.length) notas.push("Rascunho em sempre permitir é aceitável: ele fica na sua caixa até alguém enviar.");
      var equilibrada = v.buscar === "sempre" && v.ler === "sempre" && v.enviar !== "sempre" && v.encaminhar !== "sempre";
      var html =
        '<div class="chat"><div class="chat-corpo"><div class="chat-msg chat-msg--voce">' + esc(ped[0]) + "</div></div></div>" +
        '<ol class="acoes">' + passos + "</ol>" +
        (equilibrada ? veredito("ok", "Configuração equilibrada", "Leituras liberadas, e nada sai em seu nome sem a sua aprovação.")
          : veredito("atencao", "Reveja a configuração", "O ponto de equilíbrio: leituras e buscas em sempre permitir; o que cria, altera ou envia, em requer aprovação.")) +
        avisos(notas);
      var codigo = "Gmail · permissões das ações\n" + Object.keys(A).map(function (k) { return A[k][0] + ": " + NOME[v[k]]; }).join("\n");
      return { html: html, codigo: codigo };
    },

    /* 11 · Lab — prompt estruturado no Claude Code */
    code: function (v) {
      var OBJ = { cardapio: ["um cardápio digital para a lanchonete Parada 277", "parada-277"], portfolio: ["um site de portfólio pessoal", "meu-portfolio"] };
      var CTX = { celular: "os clientes vão abrir pelo celular, por um link público", recrutador: "recrutadores vão abrir pelo computador e pelo celular" };
      var MODO = {
        planejamento: ["ok", "Planejamento", "Mostra o plano completo e espera o seu ok antes de criar qualquer arquivo."],
        solicitar: ["ok", "Solicitar permissões", "Pede autorização a cada arquivo e a cada comando."],
        automatico: ["ok", "Automático", "Cria os arquivos direto e pergunta antes dos comandos mais sensíveis."],
        ignorar: ["erro", "Ignorar permissões", "Executa tudo sem perguntar. Só quando você confia totalmente na tarefa."]
      };
      var linhas = [];
      if (v.objetivo) linhas.push("Objetivo: " + OBJ[v.objetivo][0] + ".");
      if (v.contexto) linhas.push("Contexto: " + CTX[v.contexto] + ".");
      if (v.stack === "simples") linhas.push("Stack técnica: HTML, CSS e JavaScript, sem framework pesado.");
      if (v.entregavel === "estrutura") linhas.push("Entregável: só a estrutura inicial do projeto, com as pastas, os arquivos\ne a configuração exigida pelo Netlify. Não construa o site ainda.");
      if (v.entregavel === "tudo") linhas.push("Entregável: o site completo, pronto para publicar.");
      if (!linhas.length) linhas.push("Faça um site.");

      var feitos = [["objetivo", !!v.objetivo], ["contexto", !!v.contexto], ["stack técnica", !!v.stack], ["entregável", !!v.entregavel]];
      var html = chips(feitos), notas = [];
      if (!v.objetivo) {
        html += '<div class="chat"><div class="chat-corpo"><div class="chat-msg chat-msg--ia">Que tipo de site você quer? Para quem, e o que ele precisa ter?</div></div></div>';
        return { html: html, codigo: linhas.join("\n") };
      }
      if (!v.stack) notas.push("!Sem stack: o Claude escolhe as tecnologias sozinho e pode instalar dezenas de dependências num projeto simples.");
      if (!v.contexto) notas.push("Sem contexto: ele não sabe que o público abre pelo celular nem como o site será acessado.");
      if (!v.entregavel) notas.push("Sem entregável: ele decide sozinho até onde ir nesta etapa.");
      if (v.entregavel === "tudo") notas.push("Tudo de uma vez: mais difícil de revisar. Etapas pequenas (estrutura, depois o conteúdo, depois as fotos) dão mais controle.");
      var raiz = OBJ[v.objetivo][1];
      var arvore =
        '<div class="arvore"><span class="arvore-raiz">' + raiz + '/</span><ul>' +
        "<li>index.html <small>a estrutura da página</small></li>" +
        '<li class="arvore-pasta">css/<ul><li>estilo.css <small>o visual</small></li></ul></li>' +
        '<li class="arvore-pasta">js/<ul><li>' + (v.objetivo === "cardapio" ? "cardapio.js" : "principal.js") + " <small>o comportamento</small></li></ul></li>" +
        '<li class="arvore-pasta">assets/ <small>fotos, fontes e ícones</small></li>' +
        "<li>package.json <small>os comandos: dev e build</small></li>" +
        (v.entregavel === "estrutura" ? "<li>netlify.toml <small>a configuração da publicação</small></li>" : "") +
        "<li>README.md <small>a descrição do projeto</small></li></ul></div>";
      var m = MODO[v.modo];
      html += (v.stack && v.entregavel === "estrutura" ? arvore : "") +
        avisos(notas) + veredito(m[0], "Modo: " + m[1], m[2]);
      return { html: html, codigo: linhas.join("\n") };
    },

    /* 14 · Lab — os três níveis de carregamento de uma skill */
    niveis: function (v) {
      var n = parseInt(v.skills, 10);
      var P = {
        tempo: ["Qual é a previsão do tempo para amanhã?", 0, null],
        relatorio: ["Faça o relatório da semana.", 2, null],
        grafico: ["Faça o relatório da semana com o gráfico de entregas por rota.", 3, "script"],
        padrao: ["Escreva a análise do relatório no padrão de texto da empresa.", 3, "ref"]
      };
      var p = P[v.pedido];
      var t1 = n * 100, t2 = p[1] >= 2 ? 2000 : 0, t3 = p[2] === "ref" ? 3000 : p[2] === "script" ? 150 : 0;
      var total = t1 + t2 + t3, tudo = n * 5100;
      function nivel(num, titulo, ativo, texto, tok) {
        return '<div class="nivel-skill' + (ativo ? " nivel-skill--ativo" : "") + '"><span class="nivel-num">' + num + "</span>" +
          "<div><b>" + titulo + "</b><p>" + texto + "</p></div><span class=\"nivel-tok\">" + (ativo ? "≈ " + milhar(tok) + " tokens" : "não carregado") + "</span></div>";
      }
      var html =
        '<div class="chat"><div class="chat-corpo"><div class="chat-msg chat-msg--voce">' + esc(p[0]) + "</div></div></div>" +
        nivel(1, "name e description", true, "de todas as " + n + " skills instaladas, sempre: é assim que o Claude sabe qual usar", t1) +
        nivel(2, "corpo do SKILL.md", p[1] >= 2, p[1] >= 2 ? "o Claude achou a skill relatorio-semanal relevante e leu as instruções" : "nenhuma skill combina com o pedido", t2) +
        nivel(3, "arquivos de apoio", !!p[2], p[2] === "script" ? "scripts/grafico_rotas.py: o script roda e só o resultado entra na conversa"
          : p[2] === "ref" ? "references/padrao-de-texto.md: lido só porque o pedido precisava dele" : "nenhum arquivo extra foi necessário", t3) +
        barra("carregado agora", total / tudo, "≈ " + milhar(total)) +
        barra("se tudo entrasse sempre", 1, "≈ " + milhar(tudo)) +
        '<p class="nota-demo">tamanhos aproximados, para comparar: cada skill tem ≈ 100 tokens de descrição, 2.000 de instruções e 3.000 de referência</p>';
      var codigo = "nível 1: name + description de " + n + " skills (sempre)\n" +
        "nível 2: " + (p[1] >= 2 ? "relatorio-semanal/SKILL.md" : "—") + "\n" +
        "nível 3: " + (p[2] === "script" ? "scripts/grafico_rotas.py (executado)" : p[2] === "ref" ? "references/padrao-de-texto.md" : "—");
      return { html: html, codigo: codigo };
    },

    /* 15 · Lab — validar o frontmatter do SKILL.md e testar a ativação */
    skillmd: function (v, lab) {
      var MODELOS = {
        vaga: "Ajuda com relatórios.",
        semquando: "Gera o relatório semanal de entregas da transportadora a partir da planilha de rotas, com totais por rota, atrasos e um parágrafo de análise.",
        completa: "Gera o relatório semanal de entregas da transportadora a partir da planilha de rotas, com totais por rota, atrasos e um parágrafo de análise. Use quando o usuário pedir o relatório da semana, o resumo semanal das entregas ou o fechamento de sexta.",
        generica: "Ajuda com qualquer texto, planilha, e-mail ou relatório. Use sempre que o usuário pedir alguma coisa."
      };
      var area = lab.querySelector('[data-campo="descricao"]');
      if (v.modelo !== "propria") { area.value = MODELOS[v.modelo]; area.readOnly = true; }
      else area.readOnly = false;
      var desc = area.value.replace(/\s+/g, " ").trim();
      var nome = String(v.nome || "").trim();

      var semAc = semAcentoMin(desc);
      var regras = [
        ["name em kebab-case: minúsculas, números e hífens", /^[a-z0-9]+(-[a-z0-9]+)*$/.test(nome)],
        ["name sem as palavras reservadas claude e anthropic", !/claude|anthropic/i.test(nome)],
        ["description diz o que a skill faz", desc.split(" ").length >= 8],
        ["description diz quando usar", /\b(use|usar|usada|acionar) quando\b|\buse when\b/.test(semAc)],
        ["description com até 1.024 caracteres", desc.length > 0 && desc.length <= 1024],
        ["sem os sinais < e > no frontmatter", !/[<>]/.test(desc + nome)]
      ];
      var ok = regras.filter(function (r) { return r[1]; }).length;
      var lista = '<ul class="validacao">' + regras.map(function (r) {
        return '<li class="' + (r[1] ? "val-ok" : "val-falha") + '"><span>' + (r[1] ? "✓" : "✗") + "</span>" + esc(r[0]) + "</li>";
      }).join("") + "</ul>";

      /* teste de ativação: simulação simplificada por palavras-chave */
      var PARADAS = { para: 1, como: 1, com: 1, das: 1, dos: 1, uma: 1, que: 1, pedir: 1, quando: 1, usuario: 1, alguma: 1, coisa: 1, partir: 1, qual: 1, faca: 1, sobre: 1, preciso: 1, monte: 1 };
      function raizes(txt) {
        var r = {};
        semAcentoMin(txt).replace(/[^a-z0-9\- ]/g, " ").split(/\s+/).forEach(function (w) {
          if (w.length >= 4 && !PARADAS[w]) r[w.slice(0, 5)] = 1;
        });
        return r;
      }
      var rd = raizes(desc);
      var generica = /\b(qualquer|tudo|sempre)\b/.test(semAc);
      var limiar = generica ? 1 : 2;
      var FRASES = [
        ["Faça o relatório da semana", true],
        ["Monte o resumo semanal das entregas", true],
        ["Preciso fechar o relatório de sexta", true],
        ["Qual a previsão do tempo para amanhã?", false],
        ["Escreva um e-mail de aniversário para a equipe", false],
        ["Crie uma planilha de gastos pessoais", false]
      ];
      var acertos = 0;
      var linhasT = FRASES.map(function (f) {
        var rf = raizes(f[0]), comum = Object.keys(rf).filter(function (k) { return rd[k]; }).length;
        var ativou = comum >= limiar, certo = ativou === f[1];
        if (certo) acertos++;
        return '<tr class="' + (certo ? "teste-certo" : "teste-errado") + '"><td>' + esc(f[0]) + "</td><td>" + (f[1] ? "deve ativar" : "não deve") +
          "</td><td>" + (ativou ? "ativou" : "não ativou") + "</td></tr>";
      }).join("");
      var notas = [];
      var faltou = FRASES.some(function (f) { var c = Object.keys(raizes(f[0])).filter(function (k) { return rd[k]; }).length; return f[1] && c < limiar; });
      var sobrou = FRASES.some(function (f) { var c = Object.keys(raizes(f[0])).filter(function (k) { return rd[k]; }).length; return !f[1] && c >= limiar; });
      if (faltou) notas.push("Ativa de menos: acrescente à description as palavras que o usuário diria (\"relatório da semana\", \"resumo semanal\").");
      if (sobrou) notas.push("!Ativa demais: description genérica liga a skill em pedidos que não são dela. Seja específico e diga quando não usar.");
      var html =
        lista + '<p class="placar-linha"><b>' + ok + " de 6</b> regras · description com " + milhar(desc.length) + " caracteres</p>" +
        '<table class="tabela tabela--testes"><thead><tr><th>frase de teste</th><th>esperado</th><th>simulação</th></tr></thead><tbody>' + linhasT + "</tbody></table>" +
        '<p class="placar-linha"><b>' + acertos + " de " + FRASES.length + "</b> testes de ativação certos</p>" + avisos(notas) +
        '<p class="nota-demo">simulação simplificada: aqui a skill ativa quando a frase e a description têm palavras-chave em comum; o Claude de verdade decide pelo sentido</p>';
      var codigo = "---\nname: " + nome + "\ndescription: " + desc + "\n---";
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
     10. DESTA AULA — VALORES COLADOS × FÓRMULAS

     A planilha da seção 08 tem o total calculado por fórmula
     (B7) e o mesmo total como valor colado (B8). Mudar um mês
     muda só a fórmula; o aviso mostra a diferença.
     ====================================================== */

  (function () {
    var el = document.querySelector("[data-colados]");
    var aviso = document.querySelector("[data-colados-aviso]");
    if (!el || !aviso) return;
    function conferir(p) {
      var f = p.ler("B7"), c = p.ler("B8");
      if (typeof f !== "number" || typeof c !== "number") return;
      var igual = Math.abs(f - c) < 0.005;
      aviso.className = "veredito veredito--" + (igual ? "ok" : "erro");
      aviso.innerHTML = igual
        ? "<b>Os dois totais batem</b><p>Por enquanto. Mude o valor de um mês e veja qual dos dois acompanha.</p>"
        : "<b>O valor colado ficou desatualizado</b><p>A fórmula já mostra " + esc(formatar(f, "moeda")) + "; o valor colado continua em " +
          esc(formatar(c, "moeda")) + ". Diferença: " + esc(formatar(Math.abs(f - c), "moeda")) + ".</p>";
    }
    el.addEventListener("planilha-calculada", function (e) { conferir(e.detail.planilha); });
    if (el.planilha) conferir(el.planilha);
  })();

  /* ======================================================
     11. DESTA AULA — O CARDÁPIO NO NAVEGADOR

     O resultado das etapas 2 e 3 do Claude Code: filtros que
     funcionam e a "rede de proteção" (bloco vermelho com o
     nome do item quando a foto não carrega).

     <div data-cardapio>
       <button data-filtro="todos">…</button>
       <article data-cat="lanches">…</article>
     </div>
     ====================================================== */

  document.querySelectorAll("[data-cardapio]").forEach(function (raiz) {
    var botoes = Array.prototype.slice.call(raiz.querySelectorAll("[data-filtro]"));
    var itens = Array.prototype.slice.call(raiz.querySelectorAll("[data-cat]"));
    var cont = raiz.querySelector("[data-cardapio-contador]");
    function filtrar(cat) {
      var n = 0;
      itens.forEach(function (it) {
        var mostra = cat === "todos" || it.getAttribute("data-cat") === cat;
        it.hidden = !mostra;
        if (mostra) n++;
      });
      botoes.forEach(function (b) { b.classList.toggle("ativo", b.getAttribute("data-filtro") === cat); });
      if (cont) cont.textContent = n + (n === 1 ? " item" : " itens");
    }
    botoes.forEach(function (b) { b.addEventListener("click", function () { filtrar(b.getAttribute("data-filtro")); }); });
    filtrar("todos");
  });

  /* ======================================================
     12. DESTA AULA — COPIAR O PEDIDO MONTADO

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
