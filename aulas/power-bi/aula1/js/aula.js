/* =========================================================
   aula.js — motor da aula em página única
   1. Colorização dos painéis (fórmula, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Formatos de número em pt-BR e no padrão do Power BI
   4. Mini planilha com fórmulas em português
   5. Dados da aula e desenho dos visuais (grade do Power
      Query, barras, colunas e linha, mapa)
   6. Laboratórios interativos (construtores)
   7. Quiz de verificação
   8. Tour: passo a passo clicável sobre um aplicativo
   9. Componentes desta aula: exibições do Power BI, etapas
      aplicadas, pincel de formatação, relatório interativo

   Aula: Análise de Dados com Power BI · Aula 1.
   Os números dos visuais vêm de js/dados.js (totais reais da
   BaseVendas.xlsx), carregado antes deste arquivo. Sem
   simuladores de tela e sem playground: não é aula de código.
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. COLORIZAÇÃO

     Análise linha a linha, não um analisador de verdade: os
     trechos de uma aula são curtos e bem-comportados.
     O conteúdo é lido de pre.textContent, então no HTML fonte
     todo "<" precisa estar escapado como &lt;.

     data-lang no <pre>: formula (Excel em português, DAX e as
     fórmulas M do Power Query) ou texto (sem cor).
     ====================================================== */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function span(cls, txt) {
    return '<span class="' + cls + '">' + esc(txt) + "</span>";
  }

  /* uma linha de fórmula: =SOMASE(A2:A9;F2;D2:D9), [Preço Unitário] * [Qtd. Vendida],
     Text.Combine({…}). Função em ciano, referência e coluna em azul-claro,
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
    if (lang !== "formula") return esc(linha);
    var iF = linha.indexOf("//");
    if (iF !== -1) return hlFormula(linha.slice(0, iF)) + span("tk-com", linha.slice(iF));
    return hlFormula(linha);
  }

  /* exposta porque os laboratórios recolorem a saída a cada mudança */
  function colorir(pre) {
    var lang = pre.getAttribute("data-lang") || "texto";
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
     3. FORMATOS DE NÚMERO

     formatar(): os formatos da mini planilha (moeda, pct…).
     valorPbi(): como o Power BI mostra um valor num visual,
     com unidades de exibição (Mil, Mi, Bi) e, se a coluna
     estiver no formato Moeda, o símbolo R$.
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

  function decimal(v, casas) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function inteiro(v) { return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 }); }
  function pct(v) { return decimal(v * 100, 1) + "%"; }

  /* o = { unidade: "auto" | "nenhum" | "mil" | "mi", casas: 0..2, moeda: true } */
  function valorPbi(v, o) {
    o = o || {};
    var unidade = o.unidade || "auto", casas = o.casas == null ? 2 : o.casas;
    var a = Math.abs(v), div = 1, suf = "";
    if (unidade === "auto") unidade = a >= 1e9 ? "bi" : a >= 1e6 ? "mi" : a >= 1e3 ? "mil" : "nenhum";
    if (unidade === "mil") { div = 1e3; suf = " Mil"; }
    if (unidade === "mi") { div = 1e6; suf = " Mi"; }
    if (unidade === "bi") { div = 1e9; suf = " Bi"; }
    var t = decimal(v / div, casas) + suf;
    return o.moeda ? "R$ " + t : t;
  }
  function reais(v) { return valorPbi(v, { moeda: true }); }

  /* ======================================================
     4. MINI PLANILHA

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
    var pc = /%$/.test(s);
    var n = parseFloat(s.replace(/%$/, "").replace(/\./g, "").replace(",", "."));
    return pc ? n / 100 : n;
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
     5. DADOS DA AULA E DESENHO DOS VISUAIS

     D vem de js/dados.js: totais reais da BaseVendas, já
     tratada (Faturamento = Preço × Qtd, País e Continente
     separados, marcas aparadas). AMOSTRA são oito linhas
     reais do arquivo, como chegam no Power Query.
     ====================================================== */

  var D = window.DADOS_AULA || { meses: [], marcas: [], total: { cont: {}, contq: {}, pais: {}, paisq: {}, topq: [], topf: [], baixoq: [], baixof: [] } };
  var MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var MES_LONGO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  /* Data da Venda, Produto, Categoria, PrecoUnitario, Custo Unitário, Marca, Qtd. Vendida, Nome Cliente, Localidade
     (linhas 2, 3, 12, 13, 15, 16, 26 e 800 da planilha; repare no espaço depois de "Litware") */
  var AMOSTRA = [
    ["01/06/2017 00:00:00", "Sistema de Som 7.1 Channel X711 Prata", "Sistema de Som", 1109, 367.43, "Litware ", 1, "Pinheiro, Vicente", "França - Europa"],
    ["01/06/2017 00:00:00", "180 CFM Ventilador de Coluna X450 Preto", "Ventiladores", 215.62, 71.44, "Litware", 1, "Lopez, Marlon", "Estados Unidos - América do Norte"],
    ["01/06/2017 00:00:00", "Macro Zoom Lens X300 Branco", "Acessórios para Câmeras", 366.55, 121.45, "Contoso", 5, "Subram, Gerald", "Estados Unidos - América do Norte"],
    ["01/06/2017 00:00:00", "Sistema de Som 2.1 Channel E211 Marrom", "Sistema de Som", 269.9, 137.6, "Litware ", 5, "Tang, Raul", "Chile - América do Sul"],
    ["01/06/2017 00:00:00", "Sistema de Som 2.1 Channel E211 Marrom", "Sistema de Som", 269.9, 137.6, "Litware ", 2, "Guo, Brittney", "África do Sul - África"],
    ["01/06/2017 00:00:00", "Simulador de Vôo de Combate 3 E119", "Games", 28, 14.28, "Hashtag Toys", 1, "Murphy, Isabella", "Brasil - América do Sul"],
    ["01/06/2017 00:00:00", "Age of Mythology 2009 E158", "Games", 32, 16.31, "Hashtag Toys", 3, "Raji, Melvin", "Singapura - Ásia"],
    ["03/06/2017 00:00:00", "Hand Games men M30 Prata", "Jogos de Tabuleiro", 6.88, 3.16, "Southridge Video", 1, "Raji, Sheena", "Austrália - Oceania"]
  ];
  var C = { data: 0, produto: 1, categoria: 2, preco: 3, custo: 4, marca: 5, qtd: 6, cliente: 7, local: 8 };
  var LINHAS_BASE = 203882, LINHAS_EM_BRANCO = 6;

  function marcasSel(sel) {
    return D.marcas.filter(function (m) { return !sel || !sel.length || sel.indexOf(m.nome) !== -1; });
  }
  function serieMensal(sel) {
    var ms = marcasSel(sel), fat = [], qtd = [];
    D.meses.forEach(function (_, i) {
      fat.push(ms.reduce(function (s, m) { return s + m.mf[i]; }, 0));
      qtd.push(ms.reduce(function (s, m) { return s + m.mq[i]; }, 0));
    });
    return { fat: fat, qtd: qtd };
  }
  function serieAnual(sel) {
    var s = serieMensal(sel), anos = [], fat = [], qtd = [];
    D.meses.forEach(function (m, i) {
      var a = m.slice(0, 4), k = anos.indexOf(a);
      if (k === -1) { anos.push(a); fat.push(0); qtd.push(0); k = anos.length - 1; }
      fat[k] += s.fat[i]; qtd[k] += s.qtd[i];
    });
    return { anos: anos, fat: fat, qtd: qtd };
  }
  /* segunda linha do eixo X no nível Mês: um grupo por ano */
  function gruposAno() {
    var g = [];
    D.meses.forEach(function (m, i) {
      var a = m.slice(0, 4), u = g[g.length - 1];
      if (u && u.rotulo === a) u.ate = i; else g.push({ rotulo: a, de: i, ate: i });
    });
    return g;
  }
  function rotuloMes(m) { return MES[+m.slice(5) - 1]; }

  /* escala com passos redondos (1, 2, 2,5, 5 × 10^k) e n divisões */
  function escala(max, n) {
    n = n || 4;
    if (!(max > 0)) return { passo: 1, n: n, max: n };
    var bruto = max / n, pot = Math.pow(10, Math.floor(Math.log10(bruto)));
    var passos = [1, 2, 2.5, 5, 10], passo = pot * 10;
    for (var i = 0; i < passos.length; i++) { if (passos[i] * pot >= bruto) { passo = passos[i] * pot; break; } }
    return { passo: passo, n: n, max: passo * n };
  }

  /* ---------- grade do Power Query ---------- */

  var TIPO_ROTULO = { texto: "ABC", inteiro: "123", decimal: "1.2", qualquer: "ABC 123", tabela: "▦" };
  var TIPO_NOME = { texto: "Texto", inteiro: "Número inteiro", decimal: "Número decimal", qualquer: "Qualquer", data: "Data/Hora", tabela: "Tabela" };
  function tipoPQ(t) {
    if (t === "data") return '<span class="pq-tipo pq-tipo--data" title="Data/Hora"><i></i></span>';
    return '<span class="pq-tipo" title="' + (TIPO_NOME[t] || "") + '">' + esc(TIPO_ROTULO[t] || "") + "</span>";
  }
  function marcasEspaco(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<span class="espaco" title="espaço"></span>';
    return s;
  }
  /* null em itálico; espaço no começo ou no fim do texto vira marcador amarelo */
  function textoPQ(v) {
    if (v === null || v === undefined) return '<span class="pq-nulo">null</span>';
    if (typeof v === "number") return esc(v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(String(v));
    return marcasEspaco(m[1].length) + esc(m[2]) + marcasEspaco(m[3].length);
  }
  /* cols: [{ nome, tipo, cls }]  cls: "sel" (selecionada) ou "nova" (acabou de nascer)
     linhas: [valores] ou { v: [valores], cls: "vazia" } ou { pulo: "texto" } */
  function gradePQ(cols, linhas, o) {
    o = o || {};
    var h = '<div class="pq-rolagem"><table class="pq-grade"><thead><tr><th class="pq-canto"></th>';
    cols.forEach(function (c) {
      h += "<th" + (c.cls ? ' class="pq-' + c.cls + '"' : "") + "><span>" + tipoPQ(c.tipo) + esc(c.nome) + "</span></th>";
    });
    h += "</tr></thead><tbody>";
    var n = 0;
    linhas.forEach(function (l) {
      if (l.pulo) {
        h += '<tr class="pq-pulo"><th>⋮</th><td colspan="' + cols.length + '">' + esc(l.pulo) + "</td></tr>";
        n = l.retoma ? l.retoma - 1 : n;
        return;
      }
      n++;
      var vals = l.v || l;
      h += "<tr" + (l.cls ? ' class="pq-l-' + l.cls + '"' : "") + "><th>" + inteiro(n) + "</th>";
      vals.forEach(function (v, j) {
        var c = cols[j] || {};
        var cl = [typeof v === "number" ? "pq-n" : "", c.cls ? "pq-" + c.cls : "", l.prev && c.cls === "nova" ? "pq-prev" : ""].filter(Boolean).join(" ");
        h += "<td" + (cl ? ' class="' + cl + '"' : "") + ">" + textoPQ(v) + "</td>";
      });
      h += "</tr>";
    });
    h += "</tbody></table></div>";
    if (o.status) h += '<p class="pq-status">' + esc(o.status) + "</p>";
    return h;
  }
  function amostraCol(i, linhas) { return (linhas || AMOSTRA).map(function (l) { return l[i]; }); }
  function paraLinhas(colunas) {          /* [[col1…], [col2…]] -> linhas */
    return colunas[0].map(function (_, i) { return colunas.map(function (c) { return c[i]; }); });
  }
  function dividirLocal(t, delim) {
    var i = t.indexOf(delim);
    return i === -1 ? [t, null] : [t.slice(0, i), t.slice(i + delim.length)];
  }
  function nomeInvertido(t) {
    var i = t.indexOf(",");
    return t.slice(i + 1).trim() + " " + t.slice(0, i).trim();
  }

  /* ---------- barras horizontais (Gráfico de barras clusterizado) ----------
     itens [{ rotulo, valor, cls, chave }]; o = { rotulos, semEixo, fmt, fmtEixo, tituloX, tituloY } */
  function barrasH(itens, o) {
    o = o || {};
    var max = Math.max.apply(null, itens.map(function (x) { return x.valor; }));
    var e = escala(max * (o.rotulos ? 1.22 : 1), 4);
    var h = '<div class="hb' + (o.largo ? " hb--largo" : "") + '">';
    if (o.tituloY) h += '<span class="hb-titulo-y">' + esc(o.tituloY) + "</span>";
    h += '<div class="hb-corpo">';
    itens.forEach(function (x) {
      var p = (x.valor / e.max) * 100;
      h += '<div class="hb-linha' + (x.cls ? " hb-" + x.cls : "") + '"' + (x.chave ? ' data-chave="' + esc(x.chave) + '"' : "") + ">" +
        '<span class="hb-rotulo">' + esc(x.rotulo) + "</span>" +
        '<span class="hb-trilho"><i style="width:' + p.toFixed(2) + '%"></i>' +
        (o.rotulos ? "<b>" + esc((o.fmt || inteiro)(x.valor)) + "</b>" : "") + "</span></div>";
    });
    if (!o.semEixo) {
      h += '<div class="hb-linha hb-eixo"><span class="hb-rotulo"></span><span class="hb-trilho">';
      for (var k = 0; k <= e.n; k++) {
        h += '<em style="left:' + (k / e.n * 100) + '%">' + esc((o.fmtEixo || o.fmt || inteiro)(k * e.passo)) + "</em>";
      }
      h += "</span></div>";
      if (o.tituloX) h += '<p class="hb-titulo-x">' + esc(o.tituloX) + "</p>";
    }
    return h + "</div></div>";
  }

  /* ---------- colunas (e linha, no eixo secundário) em SVG ----------
     o = { colunas, rotulos, linha, realce, destaque, faixas, grupos, rotulosDados,
           fmtCol, fmtEixo, fmtLinha, largura, alto, titulo } */
  function grafColunas(o) {
    var W = o.largura || 1000, H = o.alto || 330, n = o.colunas.length;
    var temLinha = !!o.linha;
    var mL = 84, mR = temLinha ? 84 : 20, mT = 30, mB = o.grupos ? 74 : 44;
    var pw = W - mL - mR, ph = H - mT - mB;
    var ec = escala(Math.max.apply(null, o.colunas) * (o.rotulosDados ? 1.12 : 1), 4);
    var el = temLinha ? escala(Math.max.apply(null, o.linha), 4) : null;
    var slot = pw / n, bw = Math.min(slot * 0.62, 90);
    var fmtEixo = o.fmtEixo || inteiro, fmtCol = o.fmtCol || fmtEixo;
    var s = '<svg class="graf" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.titulo || "gráfico de colunas") + '">';
    (o.faixas || []).forEach(function (f) {
      var x = mL + f.de * slot, w = (f.ate - f.de + 1) * slot;
      s += '<rect class="graf-faixa graf-faixa--' + (f.cls || "padrao") + '" x="' + x.toFixed(1) + '" y="' + (mT - 26) + '" width="' + w.toFixed(1) + '" height="' + (ph + 26) + '" rx="6"/>';
      if (f.rotulo) s += '<text class="graf-faixa-rotulo" x="' + (x + w / 2).toFixed(1) + '" y="' + (mT - 8) + '" text-anchor="middle">' + esc(f.rotulo) + "</text>";
    });
    for (var k = 0; k <= ec.n; k++) {
      var y = mT + ph - (k / ec.n) * ph;
      s += '<line class="graf-grade" x1="' + mL + '" x2="' + (W - mR) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>';
      s += '<text class="graf-eixo" x="' + (mL - 10) + '" y="' + (y + 5).toFixed(1) + '" text-anchor="end">' + esc(fmtEixo(k * ec.passo)) + "</text>";
      if (el) s += '<text class="graf-eixo graf-eixo--linha" x="' + (W - mR + 10) + '" y="' + (y + 5).toFixed(1) + '">' + esc((o.fmtLinha || inteiro)(k * el.passo)) + "</text>";
    }
    o.colunas.forEach(function (v, i) {
      var cx = mL + slot * i + slot / 2, x = cx - bw / 2;
      var h = Math.max((v / ec.max) * ph, 0.5), yb = mT + ph - h;
      var dica = "<title>" + esc(o.rotulos[i] + ": " + fmtCol(v)) + "</title>";
      if (o.realce) {
        var hr = Math.max((o.realce[i] / ec.max) * ph, 0);
        s += '<rect class="graf-col graf-col--fundo" x="' + x.toFixed(1) + '" y="' + yb.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '">' + dica + "</rect>";
        s += '<rect class="graf-col" x="' + x.toFixed(1) + '" y="' + (mT + ph - hr).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hr.toFixed(1) + '">' + dica + "</rect>";
      } else {
        var cls = "graf-col" + (o.destaque && o.destaque.indexOf(i) !== -1 ? " graf-col--destaque" : "") + (o.apagadas && o.apagadas.indexOf(i) !== -1 ? " graf-col--apagada" : "");
        s += '<rect class="' + cls + '" x="' + x.toFixed(1) + '" y="' + yb.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '">' + dica + "</rect>";
      }
      if (o.rotulosDados) s += '<text class="graf-rotulo" x="' + cx.toFixed(1) + '" y="' + (yb - 8).toFixed(1) + '" text-anchor="middle">' + esc(fmtCol(v)) + "</text>";
      s += '<text class="graf-eixo" x="' + cx.toFixed(1) + '" y="' + (mT + ph + 26) + '" text-anchor="middle">' + esc(o.rotulos[i]) + "</text>";
    });
    (o.grupos || []).forEach(function (g) {
      var x1 = mL + g.de * slot, x2 = mL + (g.ate + 1) * slot;
      s += '<line class="graf-grupo" x1="' + (x1 + 6).toFixed(1) + '" x2="' + (x2 - 6).toFixed(1) + '" y1="' + (mT + ph + 40) + '" y2="' + (mT + ph + 40) + '"/>';
      s += '<text class="graf-eixo graf-eixo--grupo" x="' + ((x1 + x2) / 2).toFixed(1) + '" y="' + (mT + ph + 64) + '" text-anchor="middle">' + esc(g.rotulo) + "</text>";
    });
    if (el) {
      var pts = o.linha.map(function (v, i) { return [mL + slot * i + slot / 2, mT + ph - (v / el.max) * ph]; });
      s += '<polyline class="graf-linha" points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '"/>';
      pts.forEach(function (p, i) {
        s += '<circle class="graf-ponto" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (n > 12 ? 4 : 6) + '"><title>' + esc(o.rotulos[i] + ": " + (o.fmtLinha || inteiro)(o.linha[i])) + "</title></circle>";
      });
    }
    s += '<line class="graf-base" x1="' + mL + '" x2="' + (W - mR) + '" y1="' + (mT + ph) + '" y2="' + (mT + ph) + '"/>';
    return s + "</svg>";
  }

  /* ---------- mapa esquemático (projeção equirretangular) ----------
     Contornos simplificados à mão, [lon, lat, lon, lat, …]: servem para
     situar as bolhas, não para medir distância. */
  var MAPA = [
    [-166,68.5,-157,71.2,-141,69.7,-128,70.2,-115,68.5,-100,68,-94,70.5,-88,68.5,-82,66.8,-87,64.5,-92,62.5,-94.5,59,-92.5,57,-87,55.5,-82.3,55.2,-80,51.5,-78.5,55,-77.5,58.5,-78,62.3,-73,62.3,-69.5,59,-65,60.2,-61.5,56.5,-57,52.5,-59.5,50.2,-66,49.8,-64.3,48.6,-64.5,46.3,-61.2,45.6,-63.5,44.6,-65.8,43.7,-67.5,44.6,-70,43.7,-70.5,41.8,-74,40.5,-75.5,38,-75.6,35.3,-78,33.8,-81.2,31.5,-80.1,26.5,-80.6,25.2,-82.7,28,-84.3,30,-89,30.3,-90.5,29,-94,29.6,-97.2,27.6,-97.7,22.5,-96,19,-92,18.6,-90.4,21,-87,21.5,-88.3,17,-88.5,15.8,-84,15.8,-83.6,11.5,-81.6,9,-79.5,9.6,-77.4,8.6,-78.4,7.4,-80.4,7.6,-82.5,8.2,-85.7,10,-87.5,13,-91.5,14,-94.5,16,-96.5,15.7,-101.5,17.8,-105.5,20.5,-106.3,23.3,-109,25.5,-112.6,29.8,-114.6,31.6,-112.7,28,-110,24,-109.5,23.2,-112.2,25.6,-115.8,30.4,-117.1,32.5,-120.6,34.6,-123,38,-124.3,42,-124,46.2,-124.7,48.4,-127.5,51,-130,54.5,-133.5,57.2,-137,58.6,-142,60.1,-146.7,61,-151,60.8,-154,58,-157.5,56.5,-163,54.8,-158,57.8,-162,59.6,-165.5,61.5,-164.5,63.3,-161,64.6,-166.5,65.4,-163.5,66.6],
    [-90,73.5,-80,73.7,-70,70.5,-62,66.8,-64,63.5,-68,62.5,-72,63.8,-77.5,64.3,-74,67,-81,68.5,-85,70,-89,71],
    [-118,72.5,-105,73,-101,70,-110,69,-118,70],
    [-92,76.3,-80,77,-70,79,-62,82,-78,83,-92,81,-96,78.5],
    [-73,78.2,-66,80.5,-56,82.2,-40,83.5,-25,83,-18,81.5,-19,77.5,-18.5,75,-22,71.5,-24,69.8,-32,68,-38,65.6,-42,62.5,-44,60,-48.5,61.2,-51.5,64.5,-53.5,67.5,-54,70.5,-56,73,-62,76,-68.5,76.8],
    [-24,65.5,-22,66.4,-18,66.2,-14.5,66,-13.5,65,-15,64.3,-18.5,63.4,-22,63.8],
    [-59.3,47.6,-55.5,46.8,-52.8,46.7,-52.7,48.5,-55.6,49.6,-55.5,51.6,-57.3,50.6],
    [-84.9,21.9,-82,23.1,-77.5,22.3,-74.2,20.2,-77.7,19.9,-80.5,21.8,-83,21.6],
    [-74.4,19.9,-72.8,19.9,-69.5,19.7,-68.4,18.6,-71.4,17.7,-74.4,18.4],
    [-77.4,8.6,-75.6,10.5,-72,12,-66.5,10.6,-62,10.7,-60,8.5,-57,6,-52.5,5.2,-50,1.8,-50.3,0,-48.5,-1,-44.5,-2.6,-40,-2.9,-37.2,-4.8,-35.2,-5.6,-34.9,-8,-35.7,-9.7,-38.5,-13,-39,-17.7,-40.6,-20.8,-42,-22.9,-44.6,-23.4,-46.4,-24,-48.5,-26.5,-48.6,-28.5,-50.8,-31.3,-53,-33.7,-55,-34.9,-58.4,-34.6,-57.3,-36.1,-57.6,-38.3,-62,-38.9,-62.2,-40.6,-65,-40.9,-64.3,-42.6,-65.3,-44.5,-67.3,-46,-65.8,-47.8,-68.2,-50.1,-69,-51.6,-68.4,-52.4,-68.6,-54.9,-71.5,-54.2,-74.5,-52.3,-75.4,-50,-74.6,-47.5,-73.4,-44.5,-73.9,-41.5,-73.6,-37.3,-71.6,-33,-71.4,-30,-70.5,-25,-70.2,-20,-70.4,-18.4,-72.5,-16.7,-76.2,-13.8,-77.2,-12,-79.3,-7.6,-81.2,-6,-81,-4.3,-80.1,-3,-80.9,-1.5,-80,0.5,-78.6,2.5,-77.3,4,-77.4,6.8],
    [-9.5,37,-9.3,38.7,-8.9,41,-9.3,43,-8,43.7,-4,43.5,-1.8,43.4,-1.3,44.7,-1.2,46,-2.3,47.2,-4.6,48.4,-1.6,48.7,-1.4,49.7,0.2,49.7,1.6,50.9,3.5,51.4,4.6,52.6,6,53.4,8.5,53.6,8.6,55,8.2,56.7,10.3,57.6,10.6,56.3,10,55,11,54,14,54,18.5,54.6,21.2,55.3,21,57,23.5,58.4,24.2,59.4,28,59.6,30,60,26,60.4,22.5,60.2,21.5,61.5,21.4,63,25,65,24,65.8,21.5,64.5,19,63.3,17.3,61.4,18.8,59.8,16.5,57,14.3,55.4,12.8,55.6,12.7,56.4,11.2,58.5,10.5,59.3,8.2,58.1,6.3,58.3,5,60,5.3,62,8,63.3,11,64.8,13.3,66.7,15.5,68.5,18.5,69.8,22,70.4,26,71,29,70.6,31.5,69.8,33,69.3,36.5,69,40.7,67.8,44,68.5,46,68,50,68,54,68.7,58,68.9,60.5,69.8,64,69.3,66.8,69.2,69,72.9,72.8,72.6,74,72.8,80,73.5,86.8,74.4,95,76,104,77.7,112,76.2,113.5,73.5,120,73,127,73.5,130,71,140,72.5,150,71.5,160,69.6,170,70,176,69.8,180,68.9,180,65.5,177,62.6,172,60.5,164,59.9,163,57.5,162.5,56,160.3,54,158.5,52.9,156.7,51.2,156.2,53.5,155.8,57,158,61.8,154,59.5,149,59.5,143.5,59.3,140.6,57.8,137.5,56,135.2,54.7,138,53.8,140.3,53.2,141.4,52.2,140.4,50,140.5,48.4,138,46.5,135.5,43.8,133,42.8,131.5,43,130.6,42.4,129.7,40.9,128,39.5,129.4,37.5,129.4,35.5,127.5,34.6,126.3,34.6,126.6,36.9,125.3,37.7,124.7,39.6,121.2,38.8,122.2,40.5,121,40.9,119.5,39.9,118,39.2,117.7,38.5,118.9,37.4,120.7,37.8,122.5,37.2,120.3,36,119.2,34.8,120.5,33.2,121.8,31.7,121.9,30.8,121.9,29,120.6,27.3,119.5,25.7,118,24.5,116.5,23,113.6,22.2,111,21.5,110.2,20.5,109.7,21.6,108.3,21.6,106.7,20.6,105.8,19,107,17,108.8,15.4,109.4,12.8,109,11.4,106.8,10.4,104.8,8.6,105.1,10,104.4,10.4,103,11.6,102.2,12.3,100.9,13.4,100.1,13.4,99.5,10.6,99.2,9.2,100.3,8.2,101.3,6.8,102.3,6.1,103.4,4.2,104.2,1.4,103.4,1.3,101.3,2.9,100.3,5.2,98.3,8.2,98.5,10.5,98.6,13.2,97.6,16.5,95.4,15.8,94.2,16,94.5,18.4,93.1,19.8,92.2,21.3,91.8,22.4,90.5,22.2,88.9,21.6,87,21.5,86.6,20.2,84.9,19.3,82.3,16.6,80.3,15.6,80.2,13,79.8,10.3,78.2,8.9,77.5,8.1,76.6,8.9,75.7,11.5,74.7,13.7,73.4,16.6,72.8,19.2,72.6,21.2,70.6,20.8,69,22.4,68.4,23.5,66.7,25.4,62.3,25.1,58.5,25.6,57.3,26.8,56.4,27.1,54.7,26.5,51.5,27.9,50.1,30.1,48.6,29.9,48.3,28.5,50.2,26.6,50.8,25,52.3,24.2,54.2,24.1,56.3,24.8,58.6,23.6,59.8,22.4,58.8,20.4,57.8,19,56.3,17.9,55.2,17.2,52.2,15.8,49.2,14.6,45.2,13,43.5,12.7,42.7,15.6,41.5,17.6,40.8,19.8,39.2,21.5,38.4,24,36.6,26,35,28,34.9,29.5,34.2,31.3,34.9,32.8,35.6,34.5,35.9,35.9,36.2,36.6,34.7,36.8,32.5,36.1,30.6,36.7,29.2,36.6,27.3,37,26.3,38.3,26.6,39.6,26.2,40.3,26.1,40.8,24.5,40.9,23.4,40,22.6,40.3,23,39,22.8,37.4,21.7,36.8,21.1,37.9,21,39.4,19.5,41,19.4,41.9,18.4,42.5,16,43.5,15,44.6,14,44.9,13.6,45.6,12.3,45.3,12.4,44.2,13.6,43.5,14.5,42.2,16,41.4,18.5,40.2,17.1,40.5,16.5,39.5,16.6,38.4,15.7,37.9,15.6,38.3,16.1,39.4,15.6,40.1,14.5,40.7,13,41.3,11.2,42.4,10.2,43.9,8.8,44.4,7.5,43.8,6.2,43.1,4.6,43.4,3.1,43.1,3.2,41.9,0.8,41,-0.3,39.5,0.2,38.8,-0.7,37.6,-2.1,36.7,-4.4,36.7,-5.6,36,-6.4,36.8,-7.4,37.2,-8.9,37],
    [-5.7,50.1,-3,50.6,1.4,51.2,1.7,52.7,0.3,53.5,-0.5,54.5,-1.6,55.6,-2,56.4,-1.8,57.6,-3.1,58.6,-5,58.6,-6.2,57.5,-5.6,56.3,-4.9,54.7,-3.2,54.9,-3.4,54.3,-3,53.4,-4.6,53.3,-4.1,52.3,-5.3,51.8,-3.2,51.4,-4.2,51.2],
    [-6,52,-6.2,53.9,-5.6,54.6,-6.2,55.2,-7.3,55.4,-8.5,54.9,-8.3,54.3,-10,54.2,-9.6,53.4,-10.3,52.2,-9.8,51.6,-8.3,51.7,-6.4,52.2],
    [52,71.5,56,73.5,60,76.2,68,76.8,64,75.4,57.5,72.5,55,70.7],
    [11,78.5,16,80,27,80.2,22,77.5,17,76.6],
    [-17.2,14.7,-16.5,16.5,-16,19.5,-17,21,-15.8,23.8,-14.5,26,-13,27.8,-11.5,28.3,-9.8,29.8,-9.7,32,-8.5,33.3,-6.8,34.1,-5.9,35.8,-5.3,35.9,-2.2,35.1,1,36.6,3,36.8,7,37.1,9.8,37.3,11.1,37,10.5,36.4,10.9,35.5,10.1,34.3,11.2,33.2,15.2,32.3,17.5,30.9,19,30.3,20.1,31.5,20,32.3,21.6,32.9,23.1,32.6,25.2,31.6,29,30.9,32.3,31.3,32.6,29.9,33.2,28.4,33.9,27,35.2,24,36.9,22,37.3,18.8,38.5,18,39.3,15.8,40.7,14.4,41.7,13.4,43.3,12.4,43.4,11.5,44,10.4,45,10.4,48.5,11.2,51.2,11.9,51,10.4,50.8,9.2,49.8,7.4,48.6,5.5,47.8,4.2,46,2,44.5,1.3,42.6,-0.6,41.3,-1.9,40.1,-3.2,39.2,-4.7,38.8,-6.5,39.5,-8,39.7,-10.2,40.5,-11.3,40.7,-14.6,39.4,-16.6,37,-17.8,35.3,-21,35.5,-22.2,35.5,-24,33,-25.5,32.6,-26.1,32.5,-28.6,31.2,-29.9,30,-31.3,28.2,-32.8,26.5,-33.8,25.6,-34,22.5,-34,20,-34.8,18.4,-34.3,18.3,-33.2,17.9,-31.5,16.5,-28.6,15.2,-27,14.5,-22.9,13.2,-20,11.8,-17.3,11.9,-15.8,12.4,-13.6,13.6,-11.6,13.2,-9,12.3,-6,11.6,-3.6,9.4,-0.7,9.6,2.5,9.6,3.9,8.5,4.5,7,4.4,5.5,4.3,4.5,6.3,3.4,6.4,1.2,6.1,-1.6,4.9,-2.9,5,-4,5.2,-7.5,4.4,-9.1,5,-10.8,6.3,-12.5,7.5,-13.3,8.5,-13.2,9.5,-14.7,10.7,-15.7,11.5,-16.7,12.4,-16.8,13.6],
    [49.3,-12,50.5,-15.5,49.4,-17.8,48.6,-20.5,47.2,-24.9,45.2,-25.6,43.7,-23.5,43.3,-21.6,44.4,-19.5,44.1,-16.9,46.4,-15.8,48,-13.8],
    [79.8,6.2,80.1,9.8,81.2,8.5,81.8,7.2,81,6,80.1,6],
    [130.9,34,132.5,35.4,135,35.7,136.8,37.2,138.5,37.7,140,39.8,140,41.3,141.5,40.6,142,39.2,141,37.5,140.8,35.7,139.7,35,138.7,34.6,137,34.6,135.2,33.8,133,34.3],
    [140,41.5,141.3,43.2,141.8,45.4,143.3,44.3,145.5,43.3,143.5,42,141,41.8],
    [130.9,33.9,131.9,33,131.5,31.4,130.6,31,130.2,32.6],
    [121,25.2,121.9,25,121.4,23.2,120.8,21.9,120.1,23,120.2,24.2],
    [142,46,143.5,46.8,143,49.5,143.2,52.5,142.8,54.3,142.3,53,141.7,49,141.9,46.6],
    [120.6,18.5,122.3,18.4,121.6,15.5,124,13.7,123.3,13,120.6,14.3,119.9,16.2],
    [122.1,6.9,124,8.6,125.5,9.7,126.6,7.2,126.2,6.2,125,5.8,123.6,7.7],
    [109,-1,109.6,1.8,111.5,2.6,113,3.2,115.5,5.2,116.7,6.9,117.7,6,119,5,118.5,4.4,117.6,3.2,118,1.3,117.5,0,116.5,-1.5,116.2,-3.9,114.5,-3.6,111.5,-3.2,110.2,-2.9],
    [95.3,5.6,97.5,5.2,100.4,2.3,103.7,-0.9,104.6,-2.4,106,-3.2,105.8,-5.8,104.5,-5.8,102.3,-4,100.7,-1.2,98.7,1.8,96.3,3.7],
    [105.2,-6.8,106.5,-6,108.3,-6.3,110.4,-6.9,112.6,-6.9,114.4,-7.8,114.6,-8.7,111,-8.2,108.6,-7.8,106.4,-7.4],
    [119.5,-5.5,120.4,-5.6,120.3,-2.9,121.5,-1,123.3,-0.9,124.5,1.3,120.8,1.3,119.8,0,118.8,-2.7],
    [130.9,-1.4,134.2,-0.8,137.4,-1.5,141,-2.6,144.5,-3.8,146.1,-5.6,147.6,-6.1,147.2,-7.4,150,-10.3,147.9,-10.1,146,-8.1,143.3,-9,142.5,-9.3,141,-9.1,139,-8,137.8,-8.4,138.7,-6.9,138,-5.4,135.2,-4.4,133.2,-4,132.3,-2.9],
    [114.2,-22,113.4,-24.5,114.5,-28.5,115,-33.6,117.9,-35.1,123.5,-33.9,126,-32.3,131.2,-31.5,134.2,-32.8,135.9,-34.8,137.8,-33,138.1,-35.6,140,-37.8,143.5,-38.8,146.3,-39.1,149.9,-37.5,151.3,-33.8,153.1,-30,153.5,-27.5,150.8,-22.6,148.7,-20.3,146.3,-18.9,145.4,-15,143.5,-12.8,142.5,-10.7,141.6,-12.8,141.5,-15.5,140.6,-17.6,139,-17,136.7,-15.9,135.9,-13.4,136.9,-12.2,132.7,-11.5,130.1,-13.2,129.5,-14.9,127.4,-14,125,-15.5,122.3,-17.5,121.2,-19.5,117.5,-20.7],
    [144.6,-40.7,148.3,-40.9,148.2,-42.6,146.9,-43.6,145.3,-42.4],
    [172.7,-34.4,174.6,-36.3,175.9,-37.6,178.5,-37.7,177.9,-39.2,176.8,-40,175.2,-41.6,174.6,-41.3,174.8,-39.8,173.8,-39.2,174.6,-37.4],
    [172.7,-40.5,174.3,-41.7,173.3,-43.2,171.2,-44.4,170.6,-45.9,169,-46.6,166.5,-46,166.8,-45.2,168.4,-44,170.8,-42.7,172,-41.4]
  ];
  /* mares fechados, desenhados por cima da terra: Negro e Cáspio */
  var MAPA_AGUA = [
    [27.5,42.5,28.6,44,29.7,45.3,30.8,46.5,32.5,45.4,33.6,44.4,35.2,44.8,36.5,45.2,37.5,44.7,38.3,44.3,39.8,43.3,41.6,41.6,40.3,40.9,37.8,41,35.2,42,33.3,42,31.5,41.2,29.1,41.2,28.1,41.6],
    [47,45,49.2,46.4,51.5,46.9,53.2,46.6,53,45.3,50.3,44.4,52.7,42,53,40,53.9,38,53.9,37.3,51.6,36.8,50.3,37.4,49,38.4,49.5,40.3,48.6,41.8,47.4,43]
  ];
  /* onde o mapa põe a bolha de cada lugar [lon, lat] */
  var CONTINENTES = { "América do Norte": [-102, 45], "América do Sul": [-58, -14], "Europa": [15, 50], "África": [20, 4], "Ásia": [95, 40], "Oceania": [134, -24] };
  var PAISES = {
    "Estados Unidos": [-98, 39], "Reino Unido": [-2, 54], "Alemanha": [10, 51], "França": [2, 46.5], "Chile": [-71, -33],
    "Brasil": [-52, -10], "Canadá": [-104, 57], "África do Sul": [24, -29], "Japão": [138, 37], "Itália": [12.5, 42.5],
    "China": [104, 35], "Austrália": [134, -25], "Índia": [79, 22], "Rússia": [95, 62], "Paquistão": [69, 30],
    "Coreia do Sul": [128, 36], "Romênia": [25, 46], "Irlanda": [-8, 53], "Turcomenistão": [59, 39], "Espanha": [-3.7, 40],
    "Suécia": [16, 62], "Suíça": [8.2, 46.8], "Tailândia": [101, 15], "Eslovênia": [14.8, 46.1], "Malta": [14.4, 35.9],
    "Irã": [53, 32], "Dinamarca": [10, 56], "Polônia": [19, 52], "Taiwã": [121, 23.7], "Portugal": [-8, 39.5],
    "Quirguistão": [74.8, 41.4], "Butão": [90.4, 27.5], "Armênia": [45, 40.1], "Holanda": [5.3, 52.2], "Grécia": [22, 39],
    "Singapura": [103.8, 1.35], "Síria": [38.5, 35]
  };
  function caminhoMapa(lista) {
    return lista.map(function (p) {
      var d = "";
      for (var i = 0; i < p.length; i += 2) d += (i ? "L" : "M") + (p[i] + 180).toFixed(1) + " " + (90 - p[i + 1]).toFixed(1);
      return d + "Z";
    }).join("");
  }
  var TERRA = caminhoMapa(MAPA), AGUA = caminhoMapa(MAPA_AGUA);

  /* bolhas [{ nome, lon, lat, valor, rotulo }]; área proporcional ao valor, como no visual Mapa */
  function mapaSvg(bolhas, o) {
    o = o || {};
    var max = Math.max.apply(null, bolhas.map(function (b) { return b.valor; })), rmax = o.rmax || 13;
    var s = '<svg class="mapa" viewBox="0 6 360 144" role="img" aria-label="' + esc(o.titulo || "mapa com bolhas") + '">' +
      '<rect class="mapa-mar" x="0" y="6" width="360" height="144"/>' +
      '<path class="mapa-terra" d="' + TERRA + '"/><path class="mapa-agua" d="' + AGUA + '"/>';
    var ordem = bolhas.slice().sort(function (a, b) { return b.valor - a.valor; });
    ordem.forEach(function (b) {
      var r = Math.max(rmax * Math.sqrt(b.valor / max), 1.1);
      s += '<circle class="mapa-bolha" cx="' + (b.lon + 180).toFixed(1) + '" cy="' + (90 - b.lat).toFixed(1) + '" r="' + r.toFixed(2) + '">' +
        "<title>" + esc(b.nome + ": " + (o.fmt || inteiro)(b.valor)) + "</title></circle>";
    });
    ordem.forEach(function (b) {
      if (!b.rotulo) return;
      var r = Math.max(rmax * Math.sqrt(b.valor / max), 1.1);
      var x = (b.lon + 180).toFixed(1), y = 90 - b.lat;
      s += '<text class="mapa-rotulo" x="' + x + '" y="' + (y - r - 1.6).toFixed(1) + '" text-anchor="middle">' + esc(b.nome) + "</text>";
      s += '<text class="mapa-rotulo mapa-rotulo--valor" x="' + x + '" y="' + (y + 1.6).toFixed(1) + '" text-anchor="middle">' + esc(b.rotulo) + "</text>";
    });
    return s + "</svg>";
  }

  /* moldura de um visual no relatório: título opcional, contorno de seleção */
  function visual(conteudo, o) {
    o = o || {};
    return '<div class="pbi-visual' + (o.sel ? " pbi-visual--sel" : "") + (o.cls ? " " + o.cls : "") + '">' +
      (o.titulo ? '<p class="pbi-titulo">' + esc(o.titulo) + "</p>" : "") + conteudo + "</div>";
  }
  function cartaoPbi(valor, rotulo, o) {
    o = o || {};
    return '<div class="pbi-cartao' + (o.texto ? " pbi-cartao--texto" : "") + '"><b>' + esc(valor) + "</b>" + (rotulo ? "<span>" + esc(rotulo) + "</span>" : "") + "</div>";
  }

  /* ======================================================
     6. LABORATÓRIOS

     O HTML descreve o laboratório (data-lab, data-campo,
     data-palco, data-saida, data-eco); aqui mora só o
     construtor de cada um.

     Cada construtor recebe os valores dos controles e devolve
     uma string, ou { html, codigo } quando o que é renderizado
     difere do que deve ser mostrado no painel de saída.

     A saída não precisa ser código: aqui ela é o caminho de
     menus do Power BI e do Power Query, os campos do visual e,
     às vezes, a fórmula M que o Power Query grava.

     Botões de opção (type="radio") entram com o valor do
     marcado; o rótulo do marcado ganha a classe "marcado".

     NUNCA emita atributo vazio (class="") no código gerado:
     monte o atributo inteiro condicionalmente.
     ====================================================== */

  var construtores = {

    /* 01 — análise de dados e as ciências (diagrama de Venn) */
    ciencias: function (v) {
      var a = v.area || "centro";
      var info = {
        computacao: ["Ciência da Computação", "Coletar, guardar e processar os dados com programas.", "Na aula: carregar a BaseVendas e tratá-la no Power Query."],
        matematica: ["Matemática e Estatística", "Somar, contar, comparar, achar médias, tendências e padrões.", "Na aula: o faturamento somado por marca, por mês e por continente."],
        dominio: ["Domínio de aplicação", "Conhecer o negócio: o que é uma venda, um cliente, um custo, e o que vale a pena decidir.", "Na aula: uma loja de eletrônicos que vende em 37 países."],
        centro: ["Ciência de Dados", "Onde as três áreas se encontram. A análise de dados faz parte dela.", "Ninguém domina as três sozinho: equipes de dados juntam gente de cada área."]
      };
      function circulo(id, cx, cy, cor) {
        var cls = "venn-c" + (a === id ? " ativo" : a !== "centro" ? " apagado" : "");
        return '<circle class="' + cls + '" cx="' + cx + '" cy="' + cy + '" r="125" fill="' + cor + '"/>';
      }
      function texto(x, y, l1, l2, cls) {
        return '<text class="venn-t' + (cls ? " " + cls : "") + '" x="' + x + '" y="' + y + '" text-anchor="middle"><tspan x="' + x + '">' + esc(l1) + '</tspan><tspan x="' + x + '" dy="21">' + esc(l2) + "</tspan></text>";
      }
      var s = '<svg class="venn" viewBox="70 30 500 520" role="img" aria-label="Diagrama: Ciência da Computação, Matemática e Estatística e Domínio de aplicação se cruzam na Ciência de Dados">';
      s += circulo("computacao", 245, 165, "#009EE2") + circulo("matematica", 395, 165, "#5FE1FF") + circulo("dominio", 320, 290, "#00307C");
      s += '<circle class="venn-centro' + (a === "centro" ? " ativo" : "") + '" cx="320" cy="207" r="42"/>';
      s += texto(205, 118, "Ciência da", "Computação") + texto(435, 118, "Matemática", "e Estatística") + texto(320, 340, "Domínio de", "Aplicação", a === "dominio" ? "venn-t--claro" : "");
      s += texto(320, 203, "Ciência", "de Dados", "venn-t--centro");
      var dominios = [["Ciências", "Sociais"], ["Finanças", ""], ["Economia", ""], ["Engenharia", ""], ["Transporte", ""], ["Direito", ""], ["Medicina", ""], ["Ciências", ""]];
      dominios.forEach(function (d, i) {
        var ang = (172 - i * (164 / 7)) * Math.PI / 180;
        var x = 320 + 196 * Math.cos(ang), y = 290 + 196 * Math.sin(ang);
        var cls = "venn-dom" + (d[0] === "Transporte" ? " venn-dom--local" : "") + (a === "dominio" ? " ativo" : "");
        s += '<circle class="' + cls + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="37"/>';
        s += d[1] ? texto(x.toFixed(1), (y - 4).toFixed(1), d[0], d[1], "venn-t--dom") :
          '<text class="venn-t venn-t--dom" x="' + x.toFixed(1) + '" y="' + (y + 5).toFixed(1) + '" text-anchor="middle">' + esc(d[0]) + "</text>";
      });
      s += "</svg>";
      var i = info[a];
      return {
        html: '<div class="venn-palco">' + s + '<div class="venn-info"><b>' + esc(i[0]) + "</b><p>" + esc(i[1]) + "</p><p class=\"venn-aula\">" + esc(i[2]) + "</p></div></div>" +
          '<p class="nota-demo">diagrama adaptado de Alexandre Duarte (UFPB); a bolha Transporte foi acrescentada</p>',
        codigo: i[0] + "\n" + i[1]
      };
    },

    /* 03 — tipos de análise: o mesmo histórico de vendas, quatro perguntas */
    tipos: function (v) {
      var t = v.tipo || "descritiva";
      var vendas = [62, 55, 38, 14, 6, 3, 4, 9, 18, 32, 47, 60];
      var cfg = {
        descritiva: { perg: "O que aconteceu?", resp: "Foram vendidas 348 unidades do produto “Biquíni” em 2024.", faixas: [], pbi: "cartões e gráficos com os totais do período" },
        diagnostica: { perg: "Por que aconteceu?", resp: "O “Biquíni” não vendeu o esperado entre abril e julho, pois é o período mais frio do ano.", faixas: [{ de: 3, ate: 6, rotulo: "frio: abril a julho", cls: "frio" }], destaque: [3, 4, 5, 6], pbi: "filtros, comparação entre períodos, detalhar um mês" },
        preditiva: { perg: "O que vai acontecer?", resp: "O “Biquíni” tende a ser mais vendido entre novembro e março.", faixas: [{ de: 0, ate: 2, rotulo: "tende a subir", cls: "alta" }, { de: 10, ate: 11, rotulo: "tende a subir", cls: "alta" }], destaque: [0, 1, 2, 10, 11], pbi: "linha de tendência e previsão nos gráficos de linhas" },
        prescritiva: { perg: "O que devemos fazer?", resp: "Baseado nas vendas no verão, recomenda-se aumentar as compras do “Biquíni” nessa época em 2025.", faixas: [{ de: 8, ate: 9, rotulo: "comprar estoque", cls: "acao" }, { de: 10, ate: 11, rotulo: "verão", cls: "alta" }, { de: 0, ate: 2, rotulo: "verão", cls: "alta" }], destaque: [8, 9], pbi: "o relatório mostra a evidência; a decisão é de quem gerencia" }
      };
      var c = cfg[t], ordem = ["descritiva", "diagnostica", "preditiva", "prescritiva"];
      var nomes = { descritiva: "Descritiva", diagnostica: "Diagnóstica", preditiva: "Preditiva", prescritiva: "Prescritiva" };
      var perguntas = { descritiva: "o que aconteceu?", diagnostica: "por que aconteceu?", preditiva: "o que vai acontecer?", prescritiva: "o que fazer?" };
      var escada = '<ol class="escada">' + ordem.map(function (k, i) {
        return "<li" + (k === t ? ' class="ativo"' : "") + ' style="--d:' + i + '"><b>' + nomes[k] + "</b><span>" + perguntas[k] + "</span></li>";
      }).join("") + '</ol><p class="escada-seta">mais difícil de fazer · mais valor para a decisão</p>';
      var graf = grafColunas({
        colunas: vendas, rotulos: MES, faixas: c.faixas, destaque: c.destaque || [], rotulosDados: true,
        apagadas: c.destaque ? vendas.map(function (_, i) { return i; }).filter(function (i) { return c.destaque.indexOf(i) === -1; }) : [],
        largura: 980, alto: 330, titulo: "Vendas do Biquíni em 2024, por mês", fmtEixo: inteiro
      });
      return {
        html: '<p class="tipos-pergunta">' + esc(c.perg) + "</p>" +
          (t === "descritiva" ? '<p class="tipos-total"><b>348</b> unidades vendidas em 2024</p>' : "") +
          '<p class="nota-demo">Biquíni · unidades vendidas por mês em 2024 (exemplo da apresentação)</p>' + graf + escada,
        codigo: "análise " + nomes[t].toLowerCase() + ": " + perguntas[t] + "\n" + c.resp + "\nno Power BI: " + c.pbi
      };
    },

    /* 04 — o passo a passo da análise, com a BaseVendas */
    jornada: function (v) {
      var p = v.passo || "coleta";
      var passos = [
        ["coleta", "Coleta e tratamento", "Computação"],
        ["informacao", "Geração de informação", "Matemática e Estatística"],
        ["apresentacao", "Apresentação da informação", "Comunicação"],
        ["conhecimento", "Geração de conhecimento", "Conhecimento do negócio"]
      ];
      var topo = '<ol class="jornada">' + passos.map(function (x) {
        return "<li" + (x[0] === p ? ' class="ativo"' : "") + "><b>" + esc(x[1]) + "</b><span>" + esc(x[2]) + "</span></li>";
      }).join("") + "</ol>";
      var corpo = "", cod = "";
      var total = D.total.fat;
      if (p === "coleta") {
        var bruto = [AMOSTRA[0], AMOSTRA[3], AMOSTRA[5]].map(function (l) { return [l[C.marca], l[C.qtd], l[C.local]]; });
        bruto.push({ v: [null, null, null], cls: "vazia" });
        var limpo = [AMOSTRA[0], AMOSTRA[3], AMOSTRA[5]].map(function (l) {
          var d = dividirLocal(l[C.local], " - ");
          return [l[C.marca].trim(), l[C.qtd], d[0], d[1]];
        });
        corpo = '<div class="antes-depois"><div><p class="nota-demo">como chega da planilha</p>' +
          gradePQ([{ nome: "Marca", tipo: "texto" }, { nome: "Qtd. Vendida", tipo: "inteiro" }, { nome: "Localidade", tipo: "texto" }], bruto) +
          '</div><div><p class="nota-demo">depois de tratar</p>' +
          gradePQ([{ nome: "Marca", tipo: "texto" }, { nome: "Qtd. Vendida", tipo: "inteiro" }, { nome: "País", tipo: "texto", cls: "nova" }, { nome: "Continente", tipo: "texto", cls: "nova" }], limpo) + "</div></div>";
        cod = "habilidade: Computação\nentra: a planilha como veio (espaço sobrando, linha em branco, país e continente juntos)\nsai: uma tabela limpa, uma informação por coluna";
      } else if (p === "informacao") {
        corpo = '<table class="mini-tabela"><thead><tr><th>Marca</th><th>Faturamento</th><th>% do total</th></tr></thead><tbody>' +
          D.marcas.map(function (m) { return "<tr><td>" + esc(m.nome) + "</td><td>" + esc(formatar(m.fat, "moeda")) + "</td><td>" + pct(m.fat / total) + "</td></tr>"; }).join("") +
          '</tbody><tfoot><tr><td>Total</td><td>' + esc(formatar(total, "moeda")) + "</td><td>100%</td></tr></tfoot></table>";
        cod = "habilidade: Matemática e Estatística\nFaturamento = Preço Unitário × Qtd. Vendida, linha a linha\ndepois: somar por marca e calcular a fatia de cada uma";
      } else if (p === "apresentacao") {
        corpo = visual(barrasH(D.marcas.map(function (m) { return { rotulo: m.nome, valor: m.fat }; }), { rotulos: true, semEixo: true, fmt: reais }), { titulo: "Faturamento por marca" });
        cod = "habilidade: Comunicação\no mesmo número da tabela, agora em barras ordenadas:\nem dois segundos se vê quem lidera";
      } else {
        var dois = D.marcas[0].fat + D.marcas[1].fat;
        var ht = D.marcas.filter(function (m) { return m.nome === "Hashtag Toys"; })[0];
        var qtdTotal = D.total.qtd;
        var mf = serieMensal().fat, iMax = mf.indexOf(Math.max.apply(null, mf));
        corpo = '<div class="conclusoes">' +
          "<article><b>" + pct(dois / total) + " do faturamento vem de 2 marcas</b><p>" + esc(D.marcas[0].nome + " e " + D.marcas[1].nome) + ". Ação: negociar melhores condições com esses fornecedores.</p></article>" +
          "<article><b>Hashtag Toys vende " + pct(ht.qtd / qtdTotal) + " das unidades, mas fatura " + pct(ht.fat / total) + "</b><p>Preço médio de " + esc(formatar(ht.fat / ht.qtd, "moeda")) + ". Ação: avaliar se vale o espaço no estoque.</p></article>" +
          "<article><b>" + esc(MES_LONGO[+D.meses[iMax].slice(5) - 1]) + " de " + D.meses[iMax].slice(0, 4) + " foi o melhor mês</b><p>" + esc(reais(mf[iMax])) + ". Black Friday? Ação: preparar estoque para novembro.</p></article></div>";
        cod = "habilidade: Conhecimento do negócio\nos números viram frases e ações;\nquem decide precisa entender o porquê, não a fórmula";
      }
      return { html: topo + corpo, codigo: cod };
    },

    /* 05 — perguntas de negócio respondidas com a BaseVendas */
    perguntas: function (v) {
      var q = v.pergunta || "marca", total = D.total.fat, html = "", cod = "";
      if (q === "marca") {
        var m0 = D.marcas[0];
        html = '<p class="resposta"><b>' + esc(m0.nome) + "</b> · " + esc(reais(m0.fat)) + " (" + pct(m0.fat / total) + " do faturamento)</p>" +
          barrasH(D.marcas.map(function (m, i) { return { rotulo: m.nome, valor: m.fat, cls: i ? "apagada" : "" }; }), { rotulos: true, semEixo: true, fmt: reais });
        cod = "dado usado: Faturamento somado por Marca\nno Power BI: gráfico de barras com Marca e Faturamento";
      } else if (q === "continente") {
        var cont = Object.keys(D.total.cont);
        html = '<p class="resposta"><b>' + esc(cont[0]) + "</b> · " + esc(reais(D.total.cont[cont[0]])) + " (" + pct(D.total.cont[cont[0]] / total) + ")</p>" +
          barrasH(cont.map(function (c, i) { return { rotulo: c, valor: D.total.cont[c], cls: i ? "apagada" : "" }; }), { rotulos: true, semEixo: true, fmt: reais });
        cod = "dado usado: Faturamento somado por Continente\n(precisa separar o continente da coluna Localidade)\nno Power BI: mapa ou barras";
      } else if (q === "mes") {
        var mf = serieMensal().fat, iMax = mf.indexOf(Math.max.apply(null, mf));
        html = '<p class="resposta"><b>' + esc(MES_LONGO[+D.meses[iMax].slice(5) - 1] + " de " + D.meses[iMax].slice(0, 4)) + "</b> · " + esc(reais(mf[iMax])) + "</p>" +
          grafColunas({ colunas: mf, rotulos: D.meses.map(rotuloMes), grupos: gruposAno(), destaque: [iMax], apagadas: mf.map(function (_, i) { return i; }).filter(function (i) { return i !== iMax; }), fmtEixo: function (x) { return valorPbi(x, { casas: 0 }); }, fmtCol: reais, largura: 1000, alto: 300, titulo: "Faturamento por mês" });
        cod = "dado usado: Faturamento somado por Ano e Mês da Data da Venda\nno Power BI: gráfico de colunas com a hierarquia de datas";
      } else if (q === "produto") {
        var t0 = D.total.topq[0];
        html = '<p class="resposta"><b>' + esc(t0[0]) + "</b> · " + inteiro(t0[1]) + " unidades</p>" +
          barrasH(D.total.topq.map(function (x, i) { return { rotulo: x[0], valor: x[1], cls: i ? "apagada" : "" }; }), { rotulos: true, semEixo: true, fmt: inteiro, largo: true });
        cod = "dado usado: Qtd. Vendida somada por Produto, os 5 maiores\nno Power BI: filtro N superior";
      } else {
        var ht = D.marcas.filter(function (m) { return m.nome === "Hashtag Toys"; })[0], ct = D.marcas[0];
        html = '<p class="resposta"><b>Não.</b> Quem mais vende unidades não é quem mais fatura.</p>' +
          '<table class="mini-tabela"><thead><tr><th>Marca</th><th>% das unidades</th><th>% do faturamento</th><th>preço médio</th></tr></thead><tbody>' +
          [ht, ct].map(function (m) { return "<tr><td>" + esc(m.nome) + "</td><td>" + pct(m.qtd / D.total.qtd) + "</td><td>" + pct(m.fat / total) + "</td><td>" + esc(formatar(m.fat / m.qtd, "moeda")) + "</td></tr>"; }).join("") + "</tbody></table>";
        cod = "dados usados: Qtd. Vendida e Faturamento por Marca\nanálise diagnóstica: o porquê está no preço médio";
      }
      return { html: html, codigo: cod };
    },

    /* 07 — no Power BI você escolhe os campos; o visual faz a conta */
    campos: function (v) {
      var cat = v.categoria || "marca", med = v.valor || "fat";
      var nomeCat = { nenhuma: "", marca: "Marca", continente: "Continente" }[cat];
      var nomeMed = med === "qtd" ? "Qtd. Vendida" : "Faturamento";
      var fmt = med === "qtd" ? function (x) { return valorPbi(x, { casas: 1 }); } : reais;
      var dados = '<div class="pbi-dados"><p>Dados</p><b>Vendas</b>' +
        [["Marca", cat === "marca"], ["Continente", cat === "continente"], ["Faturamento", med === "fat"], ["Qtd. Vendida", med === "qtd"]].map(function (c) {
          return '<span class="' + (c[1] ? "marcado" : "livre") + '"><i></i>' + (c[0] === "Faturamento" || c[0] === "Qtd. Vendida" ? "Σ " : "") + esc(c[0]) + "</span>";
        }).join("") + "</div>";
      var vis;
      if (cat === "nenhuma") {
        vis = visual(cartaoPbi(fmt(med === "qtd" ? D.total.qtd : D.total.fat), "Soma de " + nomeMed));
      } else {
        var itens = cat === "marca"
          ? D.marcas.map(function (m) { return { rotulo: m.nome, valor: med === "qtd" ? m.qtd : m.fat }; })
          : Object.keys(D.total.cont).map(function (c) { return { rotulo: c, valor: med === "qtd" ? D.total.contq[c] : D.total.cont[c] }; });
        itens.sort(function (a, b) { return b.valor - a.valor; });
        vis = visual(barrasH(itens, { rotulos: true, semEixo: true, fmt: fmt }), { titulo: nomeMed + " por " + nomeCat.toLowerCase() });
      }
      return {
        html: '<div class="pbi-mini">' + vis + dados + "</div>",
        codigo: cat === "nenhuma"
          ? "visual: Cartão\nCampos: Soma de " + nomeMed + "\n(203.882 linhas somadas sem escrever fórmula)"
          : "visual: Gráfico de barras clusterizado\nEixo Y: " + nomeCat + "\nEixo X: Soma de " + nomeMed + "\n(o Power BI agrupa e soma sozinho)"
      };
    },

    /* 10 — o editor do Power Query e o nome da consulta */
    consulta: function (v) {
      var nome = (v.nome || "").trim(), exibido = nome || "Planilha1";
      var linhas = AMOSTRA.slice(0, 4).map(function (l) { return [l[C.data], l[C.produto], l[C.marca], l[C.qtd]]; });
      var html = '<div class="app pq-app">' +
        '<div class="app-titulo"><b>' + esc(exibido) + ' - Editor do Power Query</b><span class="app-botoes">— ▢ ✕</span></div>' +
        '<div class="pq-area pq-area--faixa"><span class="pq-num">1</span>' +
        '<div class="app-guias"><span>Arquivo</span><span class="ativa">Página Inicial</span><span>Transformar</span><span>Adicionar Coluna</span><span>Exibição</span><span>Ferramentas</span><span>Ajuda</span></div>' +
        '<div class="app-faixa">' +
        '<div class="app-grupo"><div><span class="app-btn">Fechar e Aplicar</span></div><small>Fechar</small></div>' +
        '<div class="app-grupo"><div><span class="app-btn">Propriedades</span><span class="app-btn">Editor Avançado</span></div><small>Consulta</small></div>' +
        '<div class="app-grupo"><div><span class="app-btn">Escolher Colunas</span><span class="app-btn">Remover Colunas</span></div><small>Gerenciar Colunas</small></div>' +
        '<div class="app-grupo"><div><span class="app-btn">Manter Linhas</span><span class="app-btn">Remover Linhas</span></div><small>Reduzir Linhas</small></div>' +
        '<div class="app-grupo"><div><span class="app-btn">Dividir Coluna</span><span class="app-btn">Agrupar por</span></div><small>Transformar</small></div>' +
        "</div></div>" +
        '<div class="pq-corpo">' +
        '<div class="pq-area pq-consultas"><span class="pq-num">2</span><small>Consultas [1]</small><span class="pq-consulta"><i class="ico-tabela"></i>' + esc(exibido) + "</span></div>" +
        '<div class="pq-centro">' +
        '<div class="pq-area pq-fx"><span class="pq-num">3</span><i>fx</i><code>= Table.TransformColumnTypes(#"Cabeçalhos Promovidos",{{"Data da Venda", type datetime}, …})</code></div>' +
        '<div class="pq-area"><span class="pq-num">4</span>' + gradePQ([{ nome: "Data da Venda", tipo: "data" }, { nome: "Produto", tipo: "texto" }, { nome: "Marca", tipo: "texto" }, { nome: "Qtd. Vendida", tipo: "inteiro" }], linhas, { status: "10 COLUNAS, 999+ LINHAS" }) + "</div>" +
        "</div>" +
        '<div class="pq-area pq-config"><span class="pq-num">5</span><b>Configurações de Consulta</b><small>PROPRIEDADES</small><label>Nome</label>' +
        '<span class="pq-nome' + (nome ? "" : " pq-nome--erro") + '">' + esc(nome || " ") + "</span>" +
        "<small>ETAPAS APLICADAS</small><ol><li>Fonte</li><li>Navegação</li><li>Cabeçalhos Promovidos</li><li class=\"ativa\">Tipo Alterado</li></ol></div>" +
        "</div></div>";
      return {
        html: html,
        codigo: nome
          ? "Configurações de Consulta › Propriedades › Nome: " + nome + "\nou: clique duas vezes no nome da consulta, no painel Consultas\n\no nome da consulta vira o nome da tabela no Power BI"
          : "nome vazio não vale: digite um nome para a consulta\n(ex.: Vendas)"
      };
    },

    /* 11 — limpeza: coluna em branco, linhas em branco, espaço sobrando */
    limpeza: function (v) {
      var tiraCol = v.coluna === "true", tiraLin = v.linhas === "true", apara = v.aparar === "true";
      var cols = [{ nome: "Data da Venda", tipo: "data" }, { nome: "Produto", tipo: "texto" }, { nome: "Marca", tipo: "texto", cls: apara ? "nova" : "" }, { nome: "Qtd. Vendida", tipo: "inteiro" }, { nome: "Localidade", tipo: "texto" }];
      if (!tiraCol) cols.push({ nome: "Column10", tipo: "texto", cls: "sel" });
      cols.forEach(function (c) { if (!c.cls) delete c.cls; });
      var linhas = AMOSTRA.slice(0, 6).map(function (l) {
        var r = [l[C.data], l[C.produto], apara ? l[C.marca].trim() : l[C.marca], l[C.qtd], l[C.local]];
        if (!tiraCol) r.push(null);
        return r;
      });
      linhas.push({ pulo: "mais " + inteiro(LINHAS_BASE - 6) + " linhas de vendas", retoma: LINHAS_BASE + 1 });
      if (!tiraLin) {
        for (var k = 0; k < 2; k++) {
          var vazia = [null, null, null, null, null];
          if (!tiraCol) vazia.push(null);
          linhas.push({ v: vazia, cls: "vazia" });
        }
        linhas.push({ pulo: "e mais " + (LINHAS_EM_BRANCO - 2) + " linhas em branco no fim do arquivo" });
      }
      var marcas = apara ? ["Contoso", "Hashtag Toys", "Litware", "Northwind Traders", "Proseware", "Southridge Video", "Wide World Importers"]
        : ["Contoso", "Contoso ", "Hashtag Toys", "Litware", "Litware ", "Northwind Traders", "Proseware", "Southridge Video", "Wide World Importers"];
      var html = gradePQ(cols, linhas, { status: (tiraCol ? 9 : 10) + " COLUNAS · " + inteiro(LINHAS_BASE + (tiraLin ? 0 : LINHAS_EM_BRANCO)) + " LINHAS NO ARQUIVO" }) +
        '<div class="distintos"><p class="nota-demo">valores diferentes na coluna Marca: <b>' + marcas.length + "</b></p><div>" +
        marcas.map(function (m) { return "<span>" + textoPQ(m) + "</span>"; }).join("") + "</div></div>";
      var cod = [], etapas = ["Fonte", "Navegação", "Cabeçalhos Promovidos", "Tipo Alterado"];
      if (tiraCol) { cod.push("clique no cabeçalho Column10 › Página Inicial › Remover Colunas"); etapas.push("Colunas Removidas"); }
      if (tiraLin) { cod.push("Página Inicial › Remover Linhas › Remover Linhas em Branco"); etapas.push("Linhas em Branco Removidas"); }
      if (apara) { cod.push("clique no cabeçalho Marca › Transformar › Formato › Aparar"); etapas.push("Texto Aparado"); }
      if (!cod.length) cod.push("nada aplicado ainda: marque uma limpeza");
      return { html: html, codigo: cod.join("\n") + "\n\nEtapas Aplicadas: " + etapas.join(" · ") };
    },

    /* 12 — dividir a Localidade em País e Continente */
    dividir: function (v) {
      var delim = { traco: " - ", hifen: "-", virgula: "," }[v.delim || "traco"];
      var nomes = v.renomear === "true" ? ["País", "Continente"] : ["Localidade.1", "Localidade.2"];
      var partes = AMOSTRA.map(function (l) {
        var t = l[C.local];
        if (v.modo === "direita") {
          var i = t.lastIndexOf(delim);
          return i === -1 ? [t, null] : [t.slice(0, i), t.slice(i + delim.length)];
        }
        return dividirLocal(t, delim);
      });
      var achou = partes.some(function (p) { return p[1] !== null; });
      var cols = [{ nome: "Localidade", tipo: "texto", cls: "antiga" }, { nome: nomes[0], tipo: "texto", cls: "nova" }];
      if (achou) cols.push({ nome: nomes[1], tipo: "texto", cls: "nova" });
      var linhas = AMOSTRA.map(function (l, i) { return achou ? [l[C.local], partes[i][0], partes[i][1]] : [l[C.local], partes[i][0]]; });
      var sobra = achou && partes.some(function (p) { return /\s$/.test(p[0]) || /^\s/.test(p[1] || ""); });
      var aviso = !achou ? '<p class="aviso">O delimitador não aparece no texto: nada foi dividido.</p>'
        : sobra ? '<p class="aviso">Sobrou espaço no fim do país e no começo do continente (as marcas amarelas). "Estados Unidos " e "Estados Unidos" viram valores diferentes.</p>'
        : '<p class="aviso aviso--ok">Um lugar por coluna, sem espaço sobrando.</p>';
      var nomeDelim = { traco: "--Personalizado--  [ - ]  (espaço, hífen, espaço)", hifen: "--Personalizado--  [-]  (só o hífen)", virgula: "Vírgula" }[v.delim || "traco"];
      var nomeModo = { cada: "Cada ocorrência do delimitador", esquerda: "Delimitador mais à esquerda", direita: "Delimitador mais à direita" }[v.modo || "cada"];
      return {
        html: '<p class="nota-demo">a coluna original (cinza) é substituída pelas novas</p>' + gradePQ(cols, linhas) + aviso,
        codigo: "clique no cabeçalho Localidade\nTransformar › Dividir Coluna › Por Delimitador\n  Selecione ou insira o delimitador: " + nomeDelim + "\n  Dividir em: " + nomeModo +
          (v.renomear === "true" ? "\n\nrenomear: clique duas vezes no cabeçalho\n  Localidade.1 → País\n  Localidade.2 → Continente" : "")
      };
    },

    /* 13 — coluna calculada pelo menu Adicionar Coluna › Padrão */
    calculo: function (v) {
      var conta = {
        faturamento: { a: "Preço Unitário", b: "Qtd. Vendida", op: "Multiplicar", padrao: "Multiplicação", novo: "Faturamento", f: function (l) { return l[C.preco] * l[C.qtd]; }, m: "[Preço Unitário] * [Qtd. Vendida]" },
        custo: { a: "Custo Unitário", b: "Qtd. Vendida", op: "Multiplicar", padrao: "Multiplicação", novo: "Custo Total", f: function (l) { return l[C.custo] * l[C.qtd]; }, m: "[Custo Unitário] * [Qtd. Vendida]" },
        lucro: { a: "Preço Unitário", b: "Custo Unitário", op: "Subtrair", padrao: "Subtração", novo: "Lucro Unitário", f: function (l) { return l[C.preco] - l[C.custo]; }, m: "[Preço Unitário] - [Custo Unitário]" }
      }[v.coluna || "faturamento"];
      var nome = v.renomear === "true" ? conta.novo : conta.padrao;
      var cols = [{ nome: "Produto", tipo: "texto" }, { nome: "Preço Unitário", tipo: "decimal" }, { nome: "Custo Unitário", tipo: "decimal" }, { nome: "Qtd. Vendida", tipo: "inteiro" }, { nome: nome, tipo: "decimal", cls: "nova" }];
      cols.forEach(function (c) { if (c.nome === conta.a || c.nome === conta.b) c.cls = "sel"; });
      var soma = 0;
      var linhas = AMOSTRA.map(function (l) {
        var r = Math.round(conta.f(l) * 100) / 100;
        soma += r;
        return [l[C.produto], l[C.preco], l[C.custo], l[C.qtd], r];
      });
      return {
        html: gradePQ(cols, linhas) + '<p class="nota-demo">soma da coluna ' + esc(nome) + " nesta amostra: <b>" + esc(formatar(soma, "dec2")) + "</b></p>",
        codigo: "clique em " + conta.a + ", Ctrl + clique em " + conta.b + "\nAdicionar Coluna › Do Número › Padrão › " + conta.op + "\nnasce a coluna " + conta.padrao +
          (v.renomear === "true" ? " → renomeie para " + conta.novo : "") + "\n\no Power Query grava a conta assim:\n= Table.AddColumn(…, \"" + conta.padrao + "\", each " + conta.m + ", type number)"
      };
    },

    /* 14 — coluna de exemplos: o Power Query adivinha a regra pelo exemplo digitado */
    exemplos: function (v) {
      var ex = (v.exemplo || "").replace(/\s+/g, " ").trim();
      var nomes = AMOSTRA.map(function (l) { return l[C.cliente]; });
      function partes(t) { var i = t.indexOf(","); return { s: t.slice(0, i).trim(), n: t.slice(i + 1).trim() }; }
      var regras = [
        { f: function (p) { return p.n + " " + p.s; }, m: 'Text.Combine({Text.AfterDelimiter([Nome Cliente], ", "), Text.BeforeDelimiter([Nome Cliente], ",")}, " ")' },
        { f: function (p) { return (p.n + " " + p.s).toUpperCase(); }, m: 'Text.Upper(Text.Combine({Text.AfterDelimiter([Nome Cliente], ", "), Text.BeforeDelimiter([Nome Cliente], ",")}, " "))' },
        { f: function (p) { return p.n; }, m: 'Text.AfterDelimiter([Nome Cliente], ", ")' },
        { f: function (p) { return p.s; }, m: 'Text.BeforeDelimiter([Nome Cliente], ",")' },
        { f: function (p) { return p.s + " " + p.n; }, m: 'Text.Replace([Nome Cliente], ",", "")' },
        { f: function (p) { return p.n + " " + p.s.charAt(0) + "."; }, m: 'Text.Combine({Text.AfterDelimiter([Nome Cliente], ", "), Text.Start([Nome Cliente], 1)}, " ") & "."' },
        { f: function (p) { return (p.n + "." + p.s).toLowerCase(); }, m: 'Text.Lower(Text.Combine({Text.AfterDelimiter([Nome Cliente], ", "), Text.BeforeDelimiter([Nome Cliente], ",")}, "."))' }
      ];
      var regra = null;
      for (var i = 0; i < regras.length; i++) { if (ex && regras[i].f(partes(nomes[0])) === ex) { regra = regras[i]; break; } }
      var nomeCol = v.renomear === "true" ? "Nome Completo Cliente" : "Personalizar";
      var linhas = nomes.map(function (n, k) {
        if (k === 0) return { v: [n, ex || null] };
        return { v: [n, regra ? regra.f(partes(n)) : null], prev: true };
      });
      var html = gradePQ([{ nome: "Nome Cliente", tipo: "texto", cls: "sel" }, { nome: nomeCol, tipo: "texto", cls: "nova" }], linhas) +
        (regra ? '<p class="aviso aviso--ok">O Power Query achou a regra e preencheu as outras linhas (em cinza, até você confirmar com OK).</p>'
          : '<p class="aviso">' + (ex ? "Nenhuma regra explica esse exemplo. Confira a grafia ou digite o exemplo de mais uma linha." : "Digite, na primeira linha, como o nome deve ficar.") + "</p>");
      return {
        html: html,
        codigo: "clique no cabeçalho Nome Cliente\nAdicionar Coluna › Coluna de Exemplos › Da Seleção\ndigite o exemplo na primeira linha e tecle Enter" +
          (regra ? "\n\nTransformação que o Power Query descobriu:\n" + regra.m : "") +
          (v.renomear === "true" ? "\n\nOK › clique duas vezes no cabeçalho: Personalizar → Nome Completo Cliente" : "")
      };
    },

    /* 16 — cartão de faturamento: unidades de exibição, moeda, rótulo e título */
    cartao: function (v) {
      var o = { moeda: v.moeda === "true", unidade: v.unidade || "auto", casas: +v.casas };
      var nomes = { auto: "Automático", nenhum: "Nenhum", mil: "Milhares", mi: "Milhões" };
      var html = '<div class="pbi-tela">' + visual(cartaoPbi(valorPbi(D.total.fat, o), v.rotulo === "true" ? "Soma de Faturamento" : ""), { sel: true, titulo: v.titulo === "true" ? (v.texto || " ") : "" }) + "</div>";
      var cod = [
        "Visualizações › Cartão · Campos: Faturamento",
        "Formatar visual › Visual › Valor do balão",
        "  Unidades de exibição: " + nomes[o.unidade] + " · Casas decimais: " + o.casas,
        "Formatar visual › Visual › Rótulo da categoria: " + (v.rotulo === "true" ? "Ligado" : "Desligado"),
        "Formatar visual › Geral › Título: " + (v.titulo === "true" ? "Ligado · Texto: " + (v.texto || "") : "Desligado"),
        o.moeda ? "Dados › Faturamento › Ferramentas de coluna › Formato: Moeda (R$)" : "formato da coluna: Número decimal (sem R$)"
      ];
      return { html: html, codigo: cod.join("\n") };
    },

    /* 17 — cartão de texto com filtro N superior */
    topn: function (v) {
      var filtrar = v.tipo === "topn", n = +v.n || 1, porQtd = v.por !== "fat", inferior = v.mostrar === "inferior";
      var lista = porQtd ? (inferior ? D.total.baixoq : D.total.topq) : (inferior ? D.total.baixof : D.total.topf);
      var itens = lista.slice(0, n);
      var mostrado = filtrar
        ? itens.map(function (x) { return x[0]; }).sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; })[0]
        : D.total.primeiro;
      var fmt = porQtd ? function (x) { return inteiro(x) + " un."; } : function (x) { return formatar(x, "moeda"); };
      var tabela = filtrar
        ? '<table class="mini-tabela"><thead><tr><th>#</th><th>Produto que passou pelo filtro</th><th>' + (porQtd ? "Qtd. Vendida" : "Faturamento") + "</th></tr></thead><tbody>" +
          itens.map(function (x, i) { return "<tr" + (x[0] === mostrado ? ' class="marcada"' : "") + "><td>" + (i + 1) + '</td><td class="txt">' + esc(x[0]) + "</td><td>" + esc(fmt(x[1])) + "</td></tr>"; }).join("") + "</tbody></table>"
        : '<p class="aviso">Sem filtro, os 447 produtos chegam ao cartão e ele mostra o <b>primeiro em ordem alfabética</b>, não o mais vendido.</p>';
      var pegadinha = filtrar && n > 1 && mostrado !== itens[0][0]
        ? '<p class="aviso">Com ' + n + " itens, o cartão mostra o primeiro em ordem alfabética entre eles, não o nº 1. Para um cartão, use N = 1.</p>" : "";
      return {
        html: '<div class="pbi-tela">' + visual(cartaoPbi(mostrado, "Primeiro Produto", { texto: true }), { sel: true }) + "</div>" + tabela + pegadinha,
        codigo: "Visualizações › Cartão · Campos: Produto\n" +
          (filtrar ? "Filtros › Filtros neste visual › Produto\n  Tipo de filtro: N superior\n  Mostrar itens: " + (inferior ? "Inferior" : "Superior") + " " + n + "\n  Por valor: " + (porQtd ? "Qtd. Vendida" : "Faturamento") + "\n  Aplicar filtro"
            : "Filtros › Filtros neste visual › Produto\n  Tipo de filtro: Filtragem básica (nada marcado)")
      };
    },

    /* 17 — onde o filtro vale: neste visual, nesta página, em todas as páginas */
    escopo: function (v) {
      var e = v.escopo || "visual", ct = D.marcas[0];
      function pagina(nome, cartaoFiltrado, outroFiltrado, filtroNaPagina, visualSel, ehP1) {
        var card = visual(cartaoPbi(reais(cartaoFiltrado ? ct.fat : D.total.fat), "Soma de Faturamento"),
          { sel: visualSel, cls: cartaoFiltrado ? "pbi-visual--filtrado" : "", titulo: "Faturamento" });
        var outro;
        if (ehP1) {
          var itens = outroFiltrado ? [{ rotulo: ct.nome, valor: ct.fat }] : D.marcas.slice(0, 4).map(function (m) { return { rotulo: m.nome, valor: m.fat }; });
          outro = visual(barrasH(itens, { semEixo: true, rotulos: true, fmt: reais }), { titulo: "Faturamento por marca", cls: outroFiltrado ? "pbi-visual--filtrado" : "" });
        } else {
          var fonte = outroFiltrado ? ct.cont : D.total.cont;
          var cs = Object.keys(fonte).sort(function (a, b) { return fonte[b] - fonte[a]; }).slice(0, 3);
          outro = visual(barrasH(cs.map(function (c) { return { rotulo: c, valor: fonte[c] }; }), { semEixo: true, rotulos: true, fmt: reais }), { titulo: "Faturamento por continente", cls: outroFiltrado ? "pbi-visual--filtrado" : "" });
        }
        return '<div class="pbi-pagina"><p class="pbi-pagina-nome">' + esc(nome) + (filtroNaPagina ? ' <span class="pilula-filtro">Marca é Contoso</span>' : "") + "</p>" + card + outro + "</div>";
      }
      var p1, p2;
      if (e === "visual") { p1 = pagina("Página 1", true, false, false, true, true); p2 = pagina("Página 2", false, false, false, false, false); }
      else if (e === "pagina") { p1 = pagina("Página 1", true, true, true, false, true); p2 = pagina("Página 2", false, false, false, false, false); }
      else { p1 = pagina("Página 1", true, true, true, false, true); p2 = pagina("Página 2", true, true, true, false, false); }
      var onde = { visual: "Filtros neste visual (com o cartão da Página 1 selecionado)", pagina: "Filtros nesta página (Página 1)", todas: "Filtros em todas as páginas" }[e];
      var efeito = { visual: "só o cartão selecionado muda", pagina: "todos os visuais da Página 1 mudam; a Página 2 não", todas: "todos os visuais de todas as páginas mudam" }[e];
      return {
        html: '<div class="pbi-paginas">' + p1 + p2 + '</div><p class="nota-demo">contorno azul tracejado = visual que recebeu o filtro</p>',
        codigo: "painel Filtros › " + onde + "\n  arraste o campo Marca e marque Contoso\n→ " + efeito
      };
    },

    /* 18 — gráfico de barras: título, eixo X e rótulos de dados */
    barras: function (v) {
      var itens = D.marcas.map(function (m) { return { rotulo: m.nome, valor: m.fat }; });
      if (v.ordem === "marca") itens.sort(function (a, b) { return a.rotulo.localeCompare(b.rotulo, "pt-BR"); });
      var rot = v.rotulos === "true", eixo = v.eixox === "true";
      var html = '<div class="pbi-tela">' + visual(barrasH(itens, {
        rotulos: rot, semEixo: !eixo, fmt: reais, fmtEixo: function (x) { return valorPbi(x, { moeda: true, casas: 0 }); },
        tituloY: "Marca", tituloX: "Faturamento"
      }), { sel: true, titulo: v.titulo === "true" ? (v.texto || " ") : "" }) + "</div>";
      var cod = [
        "Visualizações › Gráfico de barras clusterizado",
        "  Eixo Y: Marca · Eixo X: Faturamento",
        "Formatar visual › Geral › Título: " + (v.titulo === "true" ? "Ligado · Texto: " + (v.texto || "") : "Desligado"),
        "Formatar visual › Visual › Eixo X: " + (eixo ? "Ligado" : "Desligado"),
        "Formatar visual › Visual › Rótulos de dados: " + (rot ? "Ligado" : "Desligado"),
        "Classificar: ... (Mais opções) › Classificar eixo › " + (v.ordem === "marca" ? "Marca, Classificação crescente" : "Soma de Faturamento, Classificação decrescente")
      ];
      return { html: html, codigo: cod.join("\n") };
    },

    /* 20 — gráfico de linhas e colunas: hierarquia de datas e eixo secundário */
    combo: function (v) {
      var mes = v.nivel === "mes", linha = v.linha === "true", rot = v.rotulos === "true";
      var dados = mes ? serieMensal() : serieAnual();
      var rotulos = mes ? D.meses.map(rotuloMes) : dados.anos;
      var graf = grafColunas({
        colunas: dados.fat, linha: linha ? dados.qtd : null, rotulos: rotulos, grupos: mes ? gruposAno() : null,
        rotulosDados: rot && !mes, fmtEixo: function (x) { return valorPbi(x, { moeda: true, casas: 0 }); }, fmtCol: reais,
        fmtLinha: function (x) { return valorPbi(x, { casas: 0 }); }, largura: 1100, alto: mes ? 380 : 360, titulo: "Faturamento e quantidade vendida por data"
      });
      var leg = '<p class="graf-legenda"><span class="graf-legenda-col"></span>Soma de Faturamento' + (linha ? ' <span class="graf-legenda-linha"></span>Soma de Qtd. Vendida' : "") + "</p>";
      var aviso = mes ? "" : '<p class="aviso">2017 tem só 7 meses (junho a dezembro) e 2019, só 8 (janeiro a agosto). Comparar os três anos lado a lado engana.</p>';
      return {
        html: '<div class="pbi-tela">' + visual(leg + graf, { sel: true, titulo: "Faturamento e quantidade por " + (mes ? "ano e mês" : "ano") }) + "</div>" + aviso,
        codigo: "Visualizações › Gráfico de linhas e colunas clusterizado\n  Eixo X: Data da Venda (Ano, Mês: remova Trimestre e Dia)\n  Eixo Y da coluna: Faturamento\n" +
          (linha ? "  Eixo Y da linha: Qtd. Vendida\n" : "") +
          (mes ? "no topo do visual: Expandir tudo um nível abaixo na hierarquia" : "nível atual: Ano (o topo da hierarquia)") +
          (rot && !mes ? "\nFormatar visual › Visual › Rótulos de dados: Ligado" : "")
      };
    },

    /* 21 — mapa com bolhas */
    mapa: function (v) {
      var porPais = v.local === "pais", qtd = v.tamanho === "qtd";
      var fonte = porPais ? (qtd ? D.total.paisq : D.total.pais) : (qtd ? D.total.contq : D.total.cont);
      var coords = porPais ? PAISES : CONTINENTES;
      var fmt = qtd ? function (x) { return valorPbi(x, { casas: 1 }) + " un."; } : reais;
      var chaves = Object.keys(fonte).sort(function (a, b) { return fonte[b] - fonte[a]; });
      var bolhas = chaves.filter(function (k) { return coords[k]; }).map(function (k, i) {
        return { nome: k, lon: coords[k][0], lat: coords[k][1], valor: fonte[k], rotulo: !porPais || i < 4 ? fmt(fonte[k]) : "" };
      });
      return {
        html: '<div class="pbi-tela">' + visual(mapaSvg(bolhas, { fmt: fmt, rmax: porPais ? 11 : 14, titulo: "Mapa de " + (qtd ? "quantidade" : "faturamento") + " por " + (porPais ? "país" : "continente") }),
          { sel: true, titulo: (qtd ? "Qtd. Vendida" : "Faturamento") + " por " + (porPais ? "país" : "continente") }) + "</div>" +
          '<p class="nota-demo">mapa esquemático · passe o mouse numa bolha para ver o valor' + (porPais ? " · " + chaves.length + " países" : "") + "</p>",
        codigo: "Visualizações › Mapa\n  Localização: " + (porPais ? "País" : "Continente") + "\n  Tamanho da bolha: " + (qtd ? "Qtd. Vendida" : "Faturamento") +
          "\ndica: Ferramentas de coluna › Categoria de dados: " + (porPais ? "País" : "Continente") + "\n\numa vez só, antes do primeiro mapa:\nArquivo › Opções e configurações › Opções › Segurança\n  › Usar visuais de Mapa e Mapa Coroplético"
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
        var nome = c.getAttribute("data-campo");
        if (c.type === "radio") {
          if (c.checked) v[nome] = c.value;
          if (c.parentNode) c.parentNode.classList.toggle("marcado", c.checked);
          return;
        }
        v[nome] = c.type === "checkbox" ? String(c.checked) : c.value;
        var eco = lab.querySelector('[data-eco="' + nome + '"]');
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
     7. QUIZ DE VERIFICAÇÃO

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
     8. TOUR — PASSO A PASSO CLICÁVEL

     Sobre um aplicativo reconstruído em HTML (.app), cada
     controle da sequência ganha data-passo="1", "2"… e
     data-legenda="o que fazer". Os botões avançam e voltam;
     o controle da vez pisca com .alvo-clique.
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
     9. COMPONENTES DESTA AULA
     ====================================================== */

  /* ---------- 08 · as exibições do Power BI Desktop ----------
     <div data-exibicoes> com botões [data-exibe="relatorio"] na
     barra lateral e painéis [data-vista="relatorio"] */
  document.querySelectorAll("[data-exibicoes]").forEach(function (raiz) {
    var botoes = Array.prototype.slice.call(raiz.querySelectorAll("[data-exibe]"));
    var vistas = Array.prototype.slice.call(raiz.querySelectorAll("[data-vista]"));
    var rotulos = (raiz.closest(".secao") || raiz).querySelectorAll("[data-exibe-nome]");
    function mostrar(qual) {
      botoes.forEach(function (b) {
        var ativo = b.getAttribute("data-exibe") === qual;
        b.classList.toggle("ativo", ativo);
        b.setAttribute("aria-pressed", ativo ? "true" : "false");
        if (ativo) rotulos.forEach(function (r) { r.textContent = b.getAttribute("title"); });
      });
      vistas.forEach(function (v) { v.hidden = v.getAttribute("data-vista") !== qual; });
    }
    botoes.forEach(function (b) { b.addEventListener("click", function () { mostrar(b.getAttribute("data-exibe")); }); });
    mostrar(botoes[0].getAttribute("data-exibe"));
  });

  /* visuais prontos espalhados pela página (exibição de relatório, resultado esperado) */
  document.querySelectorAll("[data-cartao-total]").forEach(function (el) { el.innerHTML = cartaoPbi(reais(D.total.fat), ""); });
  document.querySelectorAll("[data-barras-marca]").forEach(function (el) {
    el.innerHTML = barrasH(D.marcas.map(function (m) { return { rotulo: m.nome, valor: m.fat }; }), { rotulos: true, semEixo: true, fmt: reais });
  });
  document.querySelectorAll("[data-combo-mes]").forEach(function (el) {
    var m = serieMensal();
    el.innerHTML = grafColunas({ colunas: m.fat, linha: m.qtd, rotulos: D.meses.map(rotuloMes), grupos: gruposAno(), fmtEixo: function (x) { return valorPbi(x, { moeda: true, casas: 0 }); }, fmtCol: reais, fmtLinha: function (x) { return valorPbi(x, { casas: 0 }); }, largura: 1100, alto: 360, titulo: "Faturamento e quantidade por ano e mês" });
  });
  document.querySelectorAll("[data-mapa-continente]").forEach(function (el) {
    el.innerHTML = mapaSvg(Object.keys(D.total.cont).map(function (k) {
      return { nome: k, lon: CONTINENTES[k][0], lat: CONTINENTES[k][1], valor: D.total.cont[k], rotulo: reais(D.total.cont[k]) };
    }), { fmt: reais, titulo: "Faturamento por continente" });
  });
  /* resultado da consulta DAX da Exibição de consulta DAX */
  document.querySelectorAll("[data-dax-resultado]").forEach(function (el) {
    el.innerHTML = '<table class="mini-tabela"><thead><tr><th>Vendas[Marca]</th><th>[Faturamento]</th></tr></thead><tbody>' +
      D.marcas.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }).map(function (m) { return "<tr><td>" + esc(m.nome) + "</td><td>" + esc(formatar(m.fat, "dec2")) + "</td></tr>"; }).join("") + "</tbody></table>";
  });
  /* prévia do Navegador: a planilha como está no arquivo */
  document.querySelectorAll("[data-navegador]").forEach(function (el) {
    el.innerHTML = gradePQ(
      ["Data da Venda", "Produto", "Marca", "Qtd. Vendida", "Localidade"].map(function (c) { return { nome: c, tipo: "qualquer" }; }),
      AMOSTRA.slice(0, 5).map(function (l) { return [l[C.data], l[C.produto], l[C.marca], l[C.qtd], l[C.local]]; })
    );
  });

  /* tabela de vendas já tratada (Exibição de tabela e Fechar e Aplicar) */
  function linhasTratadas(n) {
    return AMOSTRA.slice(0, n).map(function (l) {
      var d = dividirLocal(l[C.local], " - ");
      return [l[C.data].replace(" 00:00:00", ""), l[C.produto], l[C.marca].trim(), formatar(l[C.preco], "dec2"), l[C.qtd], d[0], d[1], formatar(l[C.preco] * l[C.qtd], "moeda"), nomeInvertido(l[C.cliente])];
    });
  }
  var COLS_TRATADAS = ["Data da Venda", "Produto", "Marca", "Preço Unitário", "Qtd. Vendida", "País", "Continente", "Faturamento", "Nome Completo Cliente"];
  function tabelaModelo(n) {
    return '<div class="tabela-modelo"><table><thead><tr>' + COLS_TRATADAS.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      linhasTratadas(n).map(function (l) { return "<tr>" + l.map(function (x, i) { return "<td" + (i === 3 || i === 4 || i === 7 ? ' class="num"' : "") + ">" + esc(x) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>";
  }
  document.querySelectorAll("[data-tabela-modelo]").forEach(function (el) {
    el.innerHTML = tabelaModelo(+el.getAttribute("data-tabela-modelo") || 6);
  });

  /* ---------- 15 · etapas aplicadas: clique numa etapa e veja a tabela daquele momento ---------- */
  var ETAPAS = (function () {
    var A = AMOSTRA.slice(0, 5);
    var VAZIAS = [{ pulo: "mais " + inteiro(LINHAS_BASE - 5) + " linhas de vendas", retoma: LINHAS_BASE + 1 }, { v: null, cls: "vazia" }, { pulo: "e mais " + (LINHAS_EM_BRANCO - 1) + " linhas em branco" }];
    function comVazias(linhas, nCols) {
      return linhas.concat(VAZIAS.map(function (x) {
        if (x.pulo) return x;
        var v = []; for (var i = 0; i < nCols; i++) v.push(null);
        return { v: v, cls: "vazia" };
      }));
    }
    var SEM_VAZIAS = [{ pulo: "mais " + inteiro(LINHAS_BASE - 5) + " linhas" }];
    function base(tipos) {
      return [
        { nome: "Data da Venda", tipo: tipos ? "data" : "qualquer" }, { nome: "Produto", tipo: tipos ? "texto" : "qualquer" },
        { nome: "Marca", tipo: tipos ? "texto" : "qualquer" }, { nome: "Qtd. Vendida", tipo: tipos ? "inteiro" : "qualquer" },
        { nome: "Localidade", tipo: tipos ? "texto" : "qualquer" }
      ];
    }
    function vals(l, idx) { return idx.map(function (i) { return l[i]; }); }
    var I5 = [C.data, C.produto, C.marca, C.qtd, C.local];
    var lista = [];
    lista.push({
      nome: "Fonte", m: '= Excel.Workbook(File.Contents("C:\\Aula\\BaseVendas.xlsx"), null, true)',
      cols: [{ nome: "Name", tipo: "texto" }, { nome: "Data", tipo: "tabela" }, { nome: "Item", tipo: "texto" }, { nome: "Kind", tipo: "texto" }, { nome: "Hidden", tipo: "qualquer" }],
      linhas: [["Planilha1", "Table", "Planilha1", "Sheet", "FALSE"]], n: 5, explica: "O arquivo inteiro: cada planilha é uma linha. A BaseVendas tem uma só, Planilha1."
    });
    lista.push({
      nome: "Navegação", m: '= Fonte{[Item="Planilha1",Kind="Sheet"]}[Data]',
      cols: ["Column1", "Column2", "Column6", "Column7", "Column9", "Column10"].map(function (c) { return { nome: c, tipo: "qualquer" }; }),
      linhas: comVazias([["Data da Venda", "Produto", "Marca", "Qtd. Vendida", "Localidade", null]].concat(A.map(function (l) { return vals(l, I5).concat([null]); })), 6),
      n: 10, explica: "A planilha como está, com nomes genéricos de coluna. Os títulos ainda são a primeira linha de dados."
    });
    lista.push({
      nome: "Cabeçalhos Promovidos", m: '= Table.PromoteHeaders(Planilha1_Sheet, [PromoteAllScalars=true])',
      cols: base(false).concat([{ nome: "Column10", tipo: "qualquer" }]),
      linhas: comVazias(A.map(function (l) { return vals(l, I5).concat([null]); }), 6), n: 10,
      explica: "A primeira linha virou cabeçalho. A décima coluna não tinha título: ficou Column10."
    });
    lista.push({
      nome: "Tipo Alterado", m: '= Table.TransformColumnTypes(#"Cabeçalhos Promovidos",{{"Data da Venda", type datetime}, {"Produto", type text}, …})',
      cols: base(true).concat([{ nome: "Column10", tipo: "texto" }]),
      linhas: comVazias(A.map(function (l) { return vals(l, I5).concat([null]); }), 6), n: 10,
      explica: "O Power Query deu um tipo a cada coluna: data, texto, número. Repare nos ícones dos cabeçalhos."
    });
    lista.push({
      nome: "Colunas Removidas", m: '= Table.RemoveColumns(#"Tipo Alterado",{"Column10"})',
      cols: base(true), linhas: comVazias(A.map(function (l) { return vals(l, I5); }), 5), n: 9,
      explica: "Column10 saiu: estava em branco."
    });
    lista.push({
      nome: "Linhas em Branco Removidas", m: '= Table.SelectRows(#"Colunas Removidas", each not List.IsEmpty(List.RemoveMatchingItems(Record.FieldValues(_), {"", null})))',
      cols: base(true), linhas: A.map(function (l) { return vals(l, I5); }).concat(SEM_VAZIAS), n: 9,
      explica: "As linhas vazias do fim do arquivo sumiram: sobram " + inteiro(LINHAS_BASE) + " vendas."
    });
    function split(l) { return dividirLocal(l[C.local], " - "); }
    lista.push({
      nome: "Dividir Coluna por Delimitador", m: '= Table.SplitColumn(#"Linhas em Branco Removidas", "Localidade", Splitter.SplitTextByDelimiter(" - ", QuoteStyle.Csv), {"Localidade.1", "Localidade.2"})',
      cols: base(true).slice(0, 4).concat([{ nome: "Localidade.1", tipo: "qualquer", cls: "nova" }, { nome: "Localidade.2", tipo: "qualquer", cls: "nova" }]),
      linhas: A.map(function (l) { return vals(l, I5).slice(0, 4).concat(split(l)); }).concat(SEM_VAZIAS), n: 10,
      explica: "Localidade virou duas colunas, cortadas no \" - \"."
    });
    lista.push({
      nome: "Tipo Alterado1", m: '= Table.TransformColumnTypes(#"Dividir Coluna por Delimitador",{{"Localidade.1", type text}, {"Localidade.2", type text}})',
      cols: base(true).slice(0, 4).concat([{ nome: "Localidade.1", tipo: "texto" }, { nome: "Localidade.2", tipo: "texto" }]),
      linhas: A.map(function (l) { return vals(l, I5).slice(0, 4).concat(split(l)); }).concat(SEM_VAZIAS), n: 10,
      explica: "Etapa automática: depois de dividir, o Power Query define o tipo das colunas novas."
    });
    lista.push({
      nome: "Colunas Renomeadas", m: '= Table.RenameColumns(#"Tipo Alterado1",{{"Localidade.1", "País"}, {"Localidade.2", "Continente"}, {"PrecoUnitario", "Preço Unitário"}})',
      cols: [{ nome: "Produto", tipo: "texto" }, { nome: "Preço Unitário", tipo: "decimal", cls: "nova" }, { nome: "Qtd. Vendida", tipo: "inteiro" }, { nome: "País", tipo: "texto", cls: "nova" }, { nome: "Continente", tipo: "texto", cls: "nova" }],
      linhas: A.map(function (l) { return [l[C.produto], l[C.preco], l[C.qtd]].concat(split(l)); }).concat(SEM_VAZIAS), n: 10,
      explica: "Nomes que qualquer pessoa entende: País, Continente, Preço Unitário."
    });
    lista.push({
      nome: "Multiplicação Inserida", m: '= Table.AddColumn(#"Colunas Renomeadas", "Multiplicação", each [Preço Unitário] * [Qtd. Vendida], type number)',
      cols: [{ nome: "Produto", tipo: "texto" }, { nome: "Preço Unitário", tipo: "decimal", cls: "sel" }, { nome: "Qtd. Vendida", tipo: "inteiro", cls: "sel" }, { nome: "Multiplicação", tipo: "decimal", cls: "nova" }],
      linhas: A.map(function (l) { return [l[C.produto], l[C.preco], l[C.qtd], Math.round(l[C.preco] * l[C.qtd] * 100) / 100]; }).concat(SEM_VAZIAS), n: 11,
      explica: "Preço × quantidade, linha a linha."
    });
    lista.push({
      nome: "Colunas Renomeadas1", m: '= Table.RenameColumns(#"Multiplicação Inserida",{{"Multiplicação", "Faturamento"}})',
      cols: [{ nome: "Produto", tipo: "texto" }, { nome: "Preço Unitário", tipo: "decimal" }, { nome: "Qtd. Vendida", tipo: "inteiro" }, { nome: "Faturamento", tipo: "decimal", cls: "nova" }],
      linhas: A.map(function (l) { return [l[C.produto], l[C.preco], l[C.qtd], Math.round(l[C.preco] * l[C.qtd] * 100) / 100]; }).concat(SEM_VAZIAS), n: 11,
      explica: "Multiplicação passou a se chamar Faturamento."
    });
    lista.push({
      nome: "Personalização Adicionada", m: '= Table.AddColumn(#"Colunas Renomeadas1", "Personalizar", each Text.Combine({Text.AfterDelimiter([Nome Cliente], ", "), Text.BeforeDelimiter([Nome Cliente], ",")}, " "), type text)',
      cols: [{ nome: "Nome Cliente", tipo: "texto", cls: "sel" }, { nome: "Personalizar", tipo: "texto", cls: "nova" }],
      linhas: A.map(function (l) { return [l[C.cliente], nomeInvertido(l[C.cliente])]; }).concat(SEM_VAZIAS), n: 12,
      explica: "A coluna de exemplos: nome antes do sobrenome, no padrão brasileiro."
    });
    lista.push({
      nome: "Colunas Renomeadas2", m: '= Table.RenameColumns(#"Personalização Adicionada",{{"Personalizar", "Nome Completo Cliente"}})',
      cols: [{ nome: "Nome Cliente", tipo: "texto" }, { nome: "Nome Completo Cliente", tipo: "texto", cls: "nova" }],
      linhas: A.map(function (l) { return [l[C.cliente], nomeInvertido(l[C.cliente])]; }).concat(SEM_VAZIAS), n: 12,
      explica: "Pronto para Fechar e Aplicar."
    });
    return lista;
  })();

  document.querySelectorAll("[data-etapas]").forEach(function (raiz) {
    var lista = raiz.querySelector("[data-etapas-lista]");
    var grade = raiz.querySelector("[data-etapas-grade]");
    var fx = raiz.querySelector("[data-etapas-fx]");
    var texto = raiz.querySelector("[data-etapas-texto]");
    var contador = raiz.querySelector("[data-etapas-contador]");
    var editor = raiz.querySelector("[data-etapas-editor]");
    var carga = raiz.querySelector("[data-etapas-carga]");
    var atual = ETAPAS.length - 1;
    lista.innerHTML = ETAPAS.map(function (e, i) { return '<li><button type="button" data-i="' + i + '">' + esc(e.nome) + "</button></li>"; }).join("");
    function mostrar(i) {
      atual = i;
      var e = ETAPAS[i];
      lista.querySelectorAll("button").forEach(function (b, k) { b.classList.toggle("ativa", k === i); b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      fx.textContent = e.m;
      grade.innerHTML = gradePQ(e.cols, e.linhas, { status: e.n + " COLUNAS · mostrando " + e.cols.length });
      texto.innerHTML = "<b>" + esc(e.nome) + "</b> " + esc(e.explica);
      if (contador) contador.textContent = (i + 1) + " / " + ETAPAS.length;
    }
    lista.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-i]");
      if (b) mostrar(+b.getAttribute("data-i"));
    });
    raiz.querySelectorAll("[data-etapas-ir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var d = +b.getAttribute("data-etapas-ir");
        mostrar(Math.max(0, Math.min(ETAPAS.length - 1, atual + d)));
      });
    });
    raiz.querySelectorAll("[data-etapas-aplicar]").forEach(function (b) {
      b.addEventListener("click", function () {
        var aplicar = b.getAttribute("data-etapas-aplicar") === "sim";
        editor.hidden = aplicar;
        carga.hidden = !aplicar;
      });
    });
    mostrar(0);
  });

  /* ---------- 17 · pincel de formatação: copia a formatação de um visual para outro ---------- */
  document.querySelectorAll("[data-pincel]").forEach(function (raiz) {
    var botao = raiz.querySelector("[data-pincel-botao]");
    var origem = raiz.querySelector("[data-pincel-origem]");
    var destino = raiz.querySelector("[data-pincel-destino]");
    var desfazer = raiz.querySelector("[data-pincel-desfazer]");
    var legenda = raiz.querySelector("[data-pincel-legenda]");
    var original = destino.className;
    var etapa = 0;
    function dizer(t) { if (legenda) legenda.textContent = t; }
    function marcar() {
      origem.classList.toggle("alvo-clique", etapa === 0);
      botao.classList.toggle("alvo-clique", etapa === 1);
      destino.classList.toggle("alvo-clique", etapa === 2);
    }
    var COMECO = "1. Clique no visual que já está formatado.";
    origem.addEventListener("click", function () {
      if (etapa === 0) { etapa = 1; dizer("2. Agora clique em Pincel de Formatação."); marcar(); }
    });
    botao.addEventListener("click", function () {
      if (etapa === 1) { etapa = 2; botao.classList.add("ligado"); raiz.classList.add("pincel-ativo"); dizer("3. Clique no visual que vai receber a formatação."); marcar(); }
    });
    destino.addEventListener("click", function () {
      if (etapa !== 2) return;
      destino.className = original + " " + origem.getAttribute("data-pincel-origem");
      etapa = 3; botao.classList.remove("ligado"); raiz.classList.remove("pincel-ativo");
      dizer("Pronto: título, cor e borda copiados. O conteúdo (o produto) continua o mesmo.");
      marcar();
    });
    desfazer.addEventListener("click", function () {
      destino.className = original; etapa = 0; botao.classList.remove("ligado"); raiz.classList.remove("pincel-ativo");
      dizer(COMECO); marcar();
    });
    dizer(COMECO);
    marcar();
  });

  /* ---------- 19 · relatório interativo: clicar numa barra filtra os outros visuais ---------- */
  document.querySelectorAll("[data-relatorio]").forEach(function (raiz) {
    var sel = [];
    var alvo = {
      fat: raiz.querySelector("[data-rel-fat]"), prod: raiz.querySelector("[data-rel-prod]"),
      barras: raiz.querySelector("[data-rel-barras]"), anos: raiz.querySelector("[data-rel-anos]"),
      estado: raiz.querySelector("[data-rel-estado]")
    };
    function desenhar() {
      var ms = marcasSel(sel);
      var fat = ms.reduce(function (s, m) { return s + m.fat; }, 0);
      var top = sel.length ? ms.map(function (m) { return m.topq; }).sort(function (a, b) { return b[1] - a[1]; })[0] : D.total.topq[0];
      alvo.fat.innerHTML = cartaoPbi(reais(fat), sel.length ? sel.join(" + ") : "todas as marcas");
      alvo.prod.innerHTML = cartaoPbi(top[0], inteiro(top[1]) + " unidades", { texto: true });
      alvo.barras.innerHTML = barrasH(D.marcas.map(function (m) {
        return { rotulo: m.nome, valor: m.fat, chave: m.nome, cls: sel.length && sel.indexOf(m.nome) === -1 ? "apagada" : "" };
      }), { rotulos: true, semEixo: true, fmt: reais });
      var todos = serieAnual(), parte = serieAnual(sel);
      alvo.anos.innerHTML = grafColunas({
        colunas: todos.fat, realce: sel.length ? parte.fat : null, rotulos: todos.anos, rotulosDados: true,
        fmtEixo: function (x) { return valorPbi(x, { moeda: true, casas: 0 }); }, fmtCol: function (x) { return reais(x); },
        largura: 640, alto: 330, titulo: "Faturamento por ano"
      });
      if (sel.length) {
        alvo.anos.querySelectorAll(".graf-rotulo").forEach(function (t, i) { t.textContent = reais(parte.fat[i]); });
      }
      alvo.estado.textContent = sel.length ? "seleção: " + sel.join(" + ") + " · clique de novo na barra para limpar" : "nenhuma marca selecionada · clique numa barra (Ctrl + clique para somar outra)";
    }
    alvo.barras.addEventListener("click", function (ev) {
      var linha = ev.target.closest("[data-chave]");
      if (!linha) { sel = []; desenhar(); return; }
      var k = linha.getAttribute("data-chave"), i = sel.indexOf(k);
      if (ev.ctrlKey || ev.metaKey) { if (i === -1) sel.push(k); else sel.splice(i, 1); }
      else sel = i !== -1 && sel.length === 1 ? [] : [k];
      desenhar();
    });
    var limpar = raiz.querySelector("[data-rel-limpar]");
    if (limpar) limpar.addEventListener("click", function () { sel = []; desenhar(); });
    desenhar();
  });
})();
