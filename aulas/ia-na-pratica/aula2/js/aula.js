/* =========================================================
   aula.js — motor da aula em página única
   1. Colorização dos painéis (fórmula, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   4. Formatos de número (moeda, porcentagem…) em pt-BR
   5. Mini planilha com fórmulas em português
   5b. Desta aula: esboço de cena em SVG
   6. Laboratórios interativos (construtores desta aula)
   8. Quiz de verificação
   9. Tour: passo a passo clicável sobre um aplicativo
   10. Desta aula: encontre as falhas nos quadros
   11. Desta aula: texto em fala (voz do navegador)
   12. Desta aula: copiar o prompt montado

   Aula: IA na Prática · Aula 2 · Criar com IA.
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
     5b. DESTA AULA — ESBOÇO DE CENA (SVG)

     Desenha, de forma esquemática, o que um prompt visual
     define: formato, luz, ambiente, sujeito, posição, plano,
     estilo, cores e elementos extras. O que o prompt não
     define aparece com "?": é o que a IA decidiria sozinha.
     Não gera imagem: mostra a composição pedida.

     esboco({ formato:"16:9"|"1:1"|"9:16", luz:"amanhecer"|"dia"|
       "noite"|"tarde", ambiente:"rodovia"|"patio"|"cidade"|"sala",
       sujeito:"caminhao"|"onibus"|"pessoa", posicao:"terco"|"centro",
       plano:"aberto"|"medio"|"close", estilo:"foto"|"vetorial"|"iso"|
       "cinema"|"cartaz", cores:"azul"|"quente", extras:{texto,logo,
       computadores,futurista,caminhaoFundo}, grade:true,
       animar:{camera:"fixa"|"lateral"|"aproxima"|"afasta"|"pan",
       dur:8, fim:"corte"|"fade"|"mensagem"} })
     ====================================================== */

  var esbocoN = 0;
  function esboco(o) {
    o = o || {};
    var n = ++esbocoN, ex = o.extras || {};
    var dims = { "16:9": [320, 180], "1:1": [240, 240], "9:16": [180, 320] }[o.formato] || [320, 180];
    var W = dims[0], H = dims[1];
    var vet = o.estilo === "vetorial" || o.estilo === "cartaz";
    var traco = vet ? ' stroke="#0B1F3F" stroke-width="1.6" stroke-linejoin="round"' : "";
    var noite = o.luz === "noite";
    var ceus = {
      amanhecer: ["#F7A86B", "#FCE1B0", "#A9D0F2"],
      dia: ["#4EA8EC", "#9FD0F6", "#DDF0FC"],
      noite: ["#071330", "#14284F", "#2B4372"],
      tarde: ["#E9783E", "#F6B26B", "#FBE0A6"]
    };
    var ceu = ceus[o.luz] || ["#D9DFE7", "#E6EAF0", "#EEF1F5"];
    var horizonte = Math.round(H * (o.formato === "9:16" ? 0.55 : 0.6));
    var s = "", fundo = "";

    /* céu: degradê na foto e no cinema, cor chapada no vetorial */
    s += '<defs><linearGradient id="ceu' + n + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + ceu[vet ? 1 : 0] + '"/><stop offset=".6" stop-color="' + ceu[1] + '"/>' +
      '<stop offset="1" stop-color="' + ceu[vet ? 1 : 2] + '"/></linearGradient>' +
      '<radialGradient id="vinheta' + n + '" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>';
    var X0 = -W, LW = W * 3;                    /* fundo largo: sobra para a câmera passear */

    if (o.ambiente === "sala") {
      s += '<rect x="' + X0 + '" y="0" width="' + LW + '" height="' + H + '" fill="#E9EEF5"/>';
      s += '<rect x="' + (W * 0.62) + '" y="' + (H * 0.12) + '" width="' + (W * 0.26) + '" height="' + (H * 0.3) + '" fill="url(#ceu' + n + ')"' + (traco || ' stroke="#B9C6D6" stroke-width="2"') + '/>';
      s += '<rect x="' + (W * 0.1) + '" y="' + (H * 0.14) + '" width="' + (W * 0.38) + '" height="' + (H * 0.26) + '" fill="#fff"' + (traco || ' stroke="#B9C6D6" stroke-width="2"') + '/>';
      s += '<rect x="' + X0 + '" y="' + (H * 0.7) + '" width="' + LW + '" height="' + (H * 0.3) + '" fill="#D8C4A2"' + traco + '/>';
      horizonte = H * 0.7;
    } else {
      s += '<rect x="' + X0 + '" y="0" width="' + LW + '" height="' + horizonte + '" fill="url(#ceu' + n + ')"/>';
      if (noite) for (var k = 0; k < 14; k++) s += '<circle cx="' + ((k * 53) % W) + '" cy="' + (8 + (k * 29) % (horizonte * 0.6)) + '" r="1" fill="#fff" opacity=".8"/>';
      if (!o.luz) s += '<text x="' + (W * 0.82) + '" y="' + (horizonte * 0.42) + '" class="esb-incognita">?</text>';
    }

    var chao = noite ? "#3D5A3C" : "#86B46F", asfalto = noite ? "#2A3240" : "#4B5563";
    if (o.ambiente === "rodovia" || o.ambiente === "cidade") {
      if (o.ambiente === "cidade") {
        var alt = [0.34, 0.5, 0.28, 0.6, 0.42, 0.3, 0.52, 0.38, 0.46, 0.33, 0.55, 0.3];
        for (var p = 0; p < alt.length; p++) {
          var bx = X0 + p * (LW / alt.length), bh = horizonte * alt[p];
          fundo += '<rect x="' + bx + '" y="' + (horizonte - bh) + '" width="' + (LW / alt.length - 4) + '" height="' + bh + '" fill="' + (noite ? "#22355A" : "#8EA0B8") + '"' + traco + '/>';
          if (noite) fundo += '<rect x="' + (bx + 6) + '" y="' + (horizonte - bh + 8) + '" width="5" height="5" fill="#FFD27A"/>';
        }
      } else {
        fundo += '<path d="M' + X0 + " " + horizonte + " Q" + (W * 0.2) + " " + (horizonte - H * 0.12) + " " + (W * 0.55) + " " + horizonte + " T" + (X0 + LW) + " " + horizonte + ' Z" fill="' + (noite ? "#2F4A3A" : "#A7C995") + '"' + traco + '/>';
      }
      fundo += '<rect x="' + X0 + '" y="' + horizonte + '" width="' + LW + '" height="' + (H - horizonte) + '" fill="' + (o.ambiente === "cidade" ? "#9AA5B4" : chao) + '"' + traco + '/>';
      fundo += '<rect x="' + X0 + '" y="' + (H * 0.72) + '" width="' + LW + '" height="' + (H * 0.2) + '" fill="' + asfalto + '"' + traco + '/>';
      for (var d = X0; d < X0 + LW; d += 28) fundo += '<rect class="esb-faixa" x="' + d + '" y="' + (H * 0.815) + '" width="14" height="2.4" fill="#F4F4F4"/>';
      if (o.ambiente === "rodovia") for (var q = X0 + 10; q < X0 + LW; q += 70) fundo += '<rect x="' + q + '" y="' + (H * 0.66) + '" width="2" height="' + (H * 0.06) + '" fill="#E5E7EB"/>';
    } else if (o.ambiente === "patio") {
      fundo += '<rect x="' + (W * 0.02) + '" y="' + (horizonte - H * 0.24) + '" width="' + (W * 0.36) + '" height="' + (H * 0.24) + '" fill="#AEB8C6"' + traco + '/>';
      fundo += '<rect x="' + (W * 0.12) + '" y="' + (horizonte - H * 0.15) + '" width="' + (W * 0.12) + '" height="' + (H * 0.15) + '" fill="#8592A3"/>';
      fundo += '<rect x="' + X0 + '" y="' + horizonte + '" width="' + LW + '" height="' + (H - horizonte) + '" fill="' + (noite ? "#6B7280" : "#C9CED6") + '"' + traco + '/>';
      for (var v = X0; v < X0 + LW; v += 36) fundo += '<line x1="' + v + '" y1="' + (H * 0.97) + '" x2="' + (v + 14) + '" y2="' + (horizonte + 6) + '" stroke="#F2C94C" stroke-width="2"/>';
    } else if (o.ambiente !== "sala") {
      fundo += '<rect x="' + X0 + '" y="' + horizonte + '" width="' + LW + '" height="' + (H - horizonte) + '" fill="#D5DBE3"/>';
      fundo += '<text x="' + (W * 0.12) + '" y="' + (horizonte + (H - horizonte) * 0.62) + '" class="esb-incognita">?</text>';
    }
    s += '<g class="esb-fundo">' + fundo + "</g>";

    /* elementos extras de cena */
    var extras = "";
    if (ex.caminhaoFundo && o.ambiente === "patio") extras += veiculo("caminhao", W * 0.78, horizonte + 6, 0.55, "#7C8794", "#A9B2BD", traco);
    if (ex.computadores) {
      for (var c = 0; c < 3; c++) {
        var cx = W * (0.08 + c * 0.13), cy = H * 0.62;
        extras += '<rect x="' + cx + '" y="' + cy + '" width="' + (W * 0.09) + '" height="' + (H * 0.07) + '" rx="2" fill="#1F2937"' + traco + '/>' +
          '<rect x="' + (cx + 2) + '" y="' + (cy + 2) + '" width="' + (W * 0.09 - 4) + '" height="' + (H * 0.07 - 4) + '" fill="#9EC3FF"/>' +
          '<rect x="' + (cx + W * 0.04) + '" y="' + (cy + H * 0.07) + '" width="3" height="' + (H * 0.02) + '" fill="#1F2937"/>';
      }
      extras += '<rect x="' + (W * 0.04) + '" y="' + (H * 0.71) + '" width="' + (W * 0.44) + '" height="4" fill="#8B6B43"/>';
    }
    if (ex.texto) extras += '<rect x="' + (W * 0.55) + '" y="' + (H * 0.08) + '" width="' + (W * 0.36) + '" height="' + (H * 0.1) + '" fill="#fff" stroke="#9CA3AF"/>' +
      '<text x="' + (W * 0.57) + '" y="' + (H * 0.155) + '" class="esb-garrancho" style="font-size:' + Math.round(W * 0.034) + 'px">TRANZPOTRE XZ</text>';
    if (ex.logo) extras += '<circle cx="' + (W * 0.12) + '" cy="' + (H * 0.12) + '" r="' + (H * 0.06) + '" fill="#D9480F"/>' +
      '<path d="M' + (W * 0.12) + " " + (H * 0.075) + " l" + (H * 0.02) + " " + (H * 0.035) + " l-" + (H * 0.04) + ' 0 Z" fill="#fff"/>';
    if (ex.futurista) extras += '<path d="M0 ' + (H * 0.3) + " L" + W + " " + (H * 0.22) + " M0 " + (H * 0.42) + " L" + W + " " + (H * 0.34) + '" stroke="#5FE1FF" stroke-width="2.5" opacity=".9"/>' +
      '<path d="M0 ' + (H * 0.36) + " L" + W + " " + (H * 0.28) + '" stroke="#E879F9" stroke-width="2" opacity=".9"/>';
    s += extras;

    /* sujeito: posição pela composição, tamanho pelo plano */
    var cores = { azul: ["#00307C", "#009EE2"], quente: ["#C2410C", "#F59F00"] }[o.cores] || ["#6B7280", "#B0B7BF"];
    var escala = ({ aberto: 0.55, medio: 0.95, close: 1.6 }[o.plano] || 0.95) * Math.min(W, H * 1.5) / 300;
    var sx = o.posicao === "terco" ? W / 3 : W / 2;
    var chaoY = o.ambiente === "sala" ? H * 0.86 : (o.ambiente === "patio" ? H * 0.86 : H * 0.84);
    var suj = "";
    if (o.semSujeito) suj = "";
    else if (o.sujeito === "pessoa") suj = pessoa(sx, chaoY, escala * 1.1, cores, traco);
    else if (o.sujeito) suj = veiculo(o.sujeito, sx, chaoY, escala, cores[0], cores[1], traco, noite);
    else suj = '<rect x="' + (sx - 40 * escala) + '" y="' + (chaoY - 50 * escala) + '" width="' + (80 * escala) + '" height="' + (50 * escala) + '" fill="none" stroke="#6B7280" stroke-width="1.6" stroke-dasharray="5 4"/>' +
      '<text x="' + sx + '" y="' + (chaoY - 16 * escala) + '" class="esb-incognita" text-anchor="middle">?</text>';
    if (o.estilo === "foto" || o.estilo === "cinema") suj = '<ellipse cx="' + sx + '" cy="' + (chaoY + 2) + '" rx="' + (52 * escala) + '" ry="' + (5 * escala) + '" fill="#000" opacity=".25"/>' + suj;
    if (o.estilo === "iso") suj = '<g transform="translate(' + (6 * escala) + "," + (4 * escala) + ')" opacity=".35">' + suj.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#0B1F3F"') + "</g>" +
      '<g transform="translate(' + sx + "," + chaoY + ") skewY(-12) translate(" + (-sx) + "," + (-chaoY) + ')">' + suj + "</g>";
    s += '<g class="esb-sujeito">' + suj + "</g>";

    /* tratamento de estilo */
    if (o.estilo === "cinema") {
      s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#vinheta' + n + ')"/>';
      s += '<rect x="0" y="0" width="' + W + '" height="' + (H * 0.11) + '" fill="#000"/><rect x="0" y="' + (H * 0.89) + '" width="' + W + '" height="' + (H * 0.11) + '" fill="#000"/>';
    }
    if (o.estilo === "cartaz") {
      s += '<rect x="0" y="0" width="' + W + '" height="' + (H * 0.22) + '" fill="#00307C"' + traco + '/>' +
        (o.semTexto ? "" : '<text x="' + (W / 2) + '" y="' + (H * 0.145) + '" text-anchor="middle" class="esb-cartaz" style="font-size:' + Math.round(Math.min(H * 0.09, W * 0.075)) + 'px">DIREÇÃO SEGURA</text>');
    }
    if (o.grade) s += '<g class="esb-grade"><line x1="' + (W / 3) + '" y1="0" x2="' + (W / 3) + '" y2="' + H + '"/><line x1="' + (2 * W / 3) + '" y1="0" x2="' + (2 * W / 3) + '" y2="' + H + '"/>' +
      '<line x1="0" y1="' + (H / 3) + '" x2="' + W + '" y2="' + (H / 3) + '"/><line x1="0" y1="' + (2 * H / 3) + '" x2="' + W + '" y2="' + (2 * H / 3) + '"/></g>';

    /* animação: a câmera do vídeo */
    var a = o.animar, estilo = "";
    if (a) {
      var cena = s;
      var ini = { fixa: [-W * 0.45, W * 0.55], pan: [W * 0.18, -W * 0.18] }[a.camera] || [0, 0];
      estilo = "--dur:" + a.dur + "s;--de:" + ini[0] + "px;--ate:" + ini[1] + "px;--meio:" + (W / 2) + "px " + (H / 2) + "px;--passo:-140px";
      s = '<g class="esb-cena cam-' + a.camera + '">' + cena + "</g>";
      if (a.fim === "fade" || a.fim === "mensagem") {
        s += '<g class="esb-fim">' + '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + (a.fim === "fade" ? "#000" : "#00307C") + '"/>' +
          (a.fim === "mensagem" ? '<text x="' + (W / 2) + '" y="' + (H / 2 + 6) + '" text-anchor="middle" class="esb-cartaz" style="font-size:' + Math.round(Math.min(W, H) * 0.09) + 'px">Direção segura</text>' : "") + "</g>";
      }
    }
    return '<svg class="esboco' + (a ? " esboco--anim" : "") + (o.formato ? "" : " esboco--sem-formato") + '" viewBox="0 0 ' + W + " " + H + '"' +
      (estilo ? ' style="' + estilo + '"' : "") + ' role="img" aria-label="Esboço da cena descrita no prompt">' +
      '<clipPath id="quadro' + n + '"><rect x="0" y="0" width="' + W + '" height="' + H + '"/></clipPath><g clip-path="url(#quadro' + n + ')">' + s + "</g></svg>";
  }

  /* veículo desenhado na origem (meio da roda traseira do cavalo), virado para a direita */
  function veiculo(tipo, x, y, e, cor, cor2, traco, farol) {
    var g = "";
    if (tipo === "onibus") {
      g += '<rect x="-58" y="-40" width="116" height="34" rx="5" fill="' + cor + '"' + traco + '/>';
      for (var j = 0; j < 6; j++) g += '<rect x="' + (-52 + j * 17) + '" y="-35" width="13" height="11" rx="2" fill="#DCEBFA"/>';
      g += '<rect x="-58" y="-16" width="116" height="4" fill="' + cor2 + '"/>';
      g += roda(-36) + roda(36);
      if (farol) g += '<path d="M58 -14 L110 -24 L110 0 Z" fill="#FFE8A3" opacity=".55"/>';
    } else {
      g += '<rect x="-60" y="-44" width="78" height="36" rx="2" fill="' + cor2 + '"' + traco + '/>';
      g += '<rect x="20" y="-36" width="32" height="28" rx="4" fill="' + cor + '"' + traco + '/>';
      g += '<rect x="34" y="-32" width="14" height="11" rx="2" fill="#DCEBFA"/>';
      g += '<rect x="-60" y="-12" width="112" height="5" fill="#374151"/>';
      g += roda(-46) + roda(-30) + roda(10) + roda(40);
      if (farol) g += '<path d="M52 -14 L104 -24 L104 0 Z" fill="#FFE8A3" opacity=".55"/>';
    }
    return '<g transform="translate(' + x + "," + y + ") scale(" + e + ')">' + g + "</g>";
    function roda(rx) { return '<circle cx="' + rx + '" cy="-6" r="7" fill="#111827"/><circle cx="' + rx + '" cy="-6" r="3" fill="#9CA3AF"/>'; }
  }

  function pessoa(x, y, e, cores, traco) {
    var g = '<rect x="-9" y="-30" width="7" height="30" fill="#1F2937"/><rect x="2" y="-30" width="7" height="30" fill="#1F2937"/>' +
      '<path d="M-14 -66 Q0 -72 14 -66 L16 -28 L-16 -28 Z" fill="' + cores[0] + '"' + traco + '/>' +
      '<rect x="-14" y="-60" width="28" height="5" fill="' + cores[1] + '"/>' +
      '<circle cx="0" cy="-80" r="11" fill="#C68B59"' + traco + '/>';
    return '<g transform="translate(' + x + "," + y + ") scale(" + e + ')">' + g + "</g>";
  }

  /* esboços fixos da página: <div data-esboco='{"formato":"16:9",…}'></div> */
  document.querySelectorAll("[data-esboco]").forEach(function (el) {
    try { el.innerHTML = esboco(JSON.parse(el.getAttribute("data-esboco"))); } catch (e) { el.textContent = "esboço indisponível"; }
  });

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
  function chips(itens) {
    return '<div class="checklist">' + itens.map(function (i) {
      return '<span class="check' + (i[1] ? " check--sim" : "") + '">' + (i[1] ? "✓ " : "") + esc(i[0]) + "</span>";
    }).join("") + "</div>";
  }
  function avisos(lista) {
    return lista.length ? '<div class="avisos">' + lista.map(function (a) { return '<p class="aviso">' + esc(a) + "</p>"; }).join("") + "</div>" : "";
  }

  var construtores = {

    /* 02 · Lab — prompt visual: os onze elementos e o esboço da composição */
    visual: function (v) {
      var ESTILOS = { foto: "Fotografia realista", vetorial: "Ilustração vetorial", iso: "Arte 3D isométrica", cinema: "Cena cinematográfica", cartaz: "Cartaz" };
      var SUJEITOS = { caminhao: "um caminhão moderno", onibus: "um ônibus de passageiros", pessoa: "um motorista profissional de colete" };
      var ACOES = {
        movimento: { caminhao: " circulando", onibus: " circulando", pessoa: " caminhando" },
        parado: { caminhao: " parado para inspeção", onibus: " parado no ponto de embarque", pessoa: " conferindo a carga" }
      };
      var AMBIENTES = { rodovia: " por uma rodovia brasileira", patio: " no pátio de uma transportadora", cidade: " em uma avenida da cidade" };
      var OBJETIVOS = { cartaz: ", para o mural da campanha interna de segurança", post: ", para um post de rede social", slide: ", para a capa de um slide de treinamento" };
      var COMPOSICAO = { terco: "sujeito no terço esquerdo, com espaço livre à direita", centro: "sujeito centralizado" };
      var PLANOS = { aberto: "plano aberto, mostrando o ambiente", medio: "plano médio", close: "close no sujeito" };
      var LUZES = { amanhecer: "amanhecer com luz dourada", dia: "dia claro, luz natural", noite: "noite, com faróis acesos" };
      var CORES = { azul: "tons de azul", quente: "cores quentes, laranja e amarelo" };
      var FORMATOS = { "16:9": "horizontal 16:9", "1:1": "quadrado 1:1", "9:16": "vertical 9:16" };

      var frase = (ESTILOS[v.estilo] || "Imagem") + (v.sujeito ? " de " + SUJEITOS[v.sujeito] : " sobre transporte") +
        (v.acao && v.sujeito ? ACOES[v.acao][v.sujeito] : "") + (AMBIENTES[v.ambiente] || "") + (OBJETIVOS[v.objetivo] || "") + ".";
      var det = [];
      if (v.composicao) det.push("Composição: " + COMPOSICAO[v.composicao]);
      if (v.plano) det.push("Enquadramento: " + PLANOS[v.plano]);
      if (v.luz) det.push("Iluminação: " + LUZES[v.luz]);
      if (v.cores) det.push("Cores: " + CORES[v.cores]);
      if (v.formato) det.push("Formato: " + FORMATOS[v.formato]);
      var restr = [];
      if (v.semTexto === "true") restr.push("sem textos");
      if (v.semLogo === "true") restr.push("sem marcas ou logotipos");
      if (v.semPessoas === "true") restr.push("sem pessoas reconhecíveis");
      var prompt = frase + (det.length ? "\n" + det.join(".\n") + "." : "") + (restr.length ? "\nRestrições: " + restr.join(", ") + "." : "");

      var ELEM = [
        ["objetivo", !!v.objetivo], ["sujeito", !!v.sujeito], ["ação", !!(v.acao && v.sujeito)], ["ambiente", !!v.ambiente],
        ["estilo", !!v.estilo], ["composição", !!v.composicao], ["enquadramento", !!v.plano], ["iluminação", !!v.luz],
        ["cores", !!v.cores], ["formato", !!v.formato], ["restrições", restr.length > 0]
      ];
      var definidos = ELEM.filter(function (e) { return e[1]; }).length;
      var aIA = ELEM.filter(function (e) { return !e[1]; }).map(function (e) { return e[0]; });

      var notas = [];
      if (v.semPessoas === "true" && v.sujeito === "pessoa") notas.push("Conflito: o sujeito é uma pessoa, mas o prompt pede \"sem pessoas reconhecíveis\". Peça a pessoa de costas ou com o rosto fora do quadro.");
      if (v.estilo === "cartaz" && v.semTexto === "true") notas.push("Cartaz sem textos: a faixa do título fica livre e o texto entra depois, no editor, sem risco de letra trocada.");
      if (v.estilo === "cartaz" && v.semTexto !== "true") notas.push("Texto dentro da imagem: confira letra por letra, principalmente os acentos. Para um cartaz oficial, prefira escrever o título depois, no editor.");

      var html =
        esboco({ formato: v.formato, luz: v.luz, ambiente: v.ambiente, sujeito: v.sujeito, posicao: v.composicao, plano: v.plano,
          estilo: v.estilo, cores: v.cores, grade: !!v.composicao, semTexto: v.semTexto === "true" }) +
        '<p class="nota-demo">esboço da composição que o prompt descreve, não a imagem gerada · "?" = a IA decide</p>' +
        chips(ELEM) +
        '<p class="placar-linha"><b>' + definidos + " de 11</b> elementos definidos" + (aIA.length ? " · a IA decide: " + esc(aIA.join(", ")) : "") + "</p>" +
        avisos(notas);
      return { html: html, codigo: prompt };
    },

    /* 04 · Lab — rubrica para avaliar a imagem gerada */
    rubrica: function (v) {
      var CRIT = [
        ["c1", "Aderência ao prompt", "Reforce no prompt o que ficou de fora e repita o pedido."],
        ["c2", "Composição", "Peça a posição do sujeito e o enquadramento: \"no terço esquerdo\", \"plano aberto\"."],
        ["c3", "Realismo e estilo", "Nomeie o estilo: \"fotografia realista\", \"ilustração vetorial\"."],
        ["c4", "Coerência", "Procure mãos, rodas, sombras e reflexos estranhos e peça a correção de um por vez."],
        ["c5", "Facilidade de refinar", "Se a ferramenta perde o que estava bom a cada ajuste, teste outra."],
        ["c6", "Sem elementos indevidos", "Liste o que evitar: textos, marcas, logotipos, pessoas reconhecíveis."]
      ];
      var total = 0, piores = [], menor = 6;
      var barras = CRIT.map(function (c) {
        var n = +v[c[0]]; total += n;
        if (n < menor) { menor = n; piores = [c]; } else if (n === menor) piores.push(c);
        return '<div class="barra-h"><span>' + c[1] + '</span><span class="barra-h-trilho"><i style="width:' + (n / 5 * 100) + '%"></i></span><b>' + n + " de 5</b></div>";
      }).join("");
      var veredito = total >= 24 ? ["boa", "Pronta para usar, depois da revisão final."]
        : total >= 15 ? ["refinar", "Vale refinar: ajuste o ponto fraco e gere de novo."]
        : ["refazer", "Refaça o prompt ou teste outra ferramenta."];
      var html =
        '<div class="rubrica"><div class="rubrica-barras">' + barras + "</div>" +
        '<div class="rubrica-total rubrica-total--' + veredito[0] + '"><span>nota da imagem</span><b>' + total + '</b><small>de 30</small><p>' + veredito[1] + "</p></div></div>";
      var codigo =
        "nota: " + total + " de 30 (" + veredito[0] + ")\n" +
        "ponto mais fraco: " + piores.map(function (p) { return p[1].toLowerCase(); }).join(", ") + "\n" +
        "próximo passo: " + piores[0][2];
      return { html: html, codigo: codigo };
    },

    /* 05 · Lab — refinar por feedback: versão 1 → versão 2 */
    feedback: function (v) {
      var v1 = { formato: "1:1", luz: "tarde", ambiente: "patio", sujeito: "pessoa", posicao: "centro", plano: "medio", estilo: "foto", cores: "azul",
        extras: { texto: true, logo: true, caminhaoFundo: true } };
      var v2 = JSON.parse(JSON.stringify(v1)), linhas = [], notas = [];
      if (v.tipo === "vago") {
        linhas.push("Deixe melhor.");
        v2.luz = "noite"; v2.plano = "close"; v2.estilo = "cinema";
        v2.extras = { texto: true, logo: true, futurista: true, caminhaoFundo: true };
        notas.push("Feedback vago: a IA mudou o que quis. A luz e o enquadramento, que estavam bons, se perderam; o texto e o logotipo continuam lá.");
      } else {
        if (v.mantenha === "true") linhas.push("Mantenha a iluminação e o enquadramento.");
        else { v2.luz = "dia"; v2.plano = "aberto"; notas.push("Sem \"mantenha\", a IA também mexeu na luz e no enquadramento."); }
        if (v.altere === "true") { linhas.push("Altere o fundo para uma sala de treinamento."); v2.ambiente = "sala"; }
        if (v.remova === "true") { linhas.push("Remova textos e símbolos."); v2.extras.texto = false; v2.extras.logo = false; }
        if (v.adicione === "true") { linhas.push("Adicione computadores."); v2.extras.computadores = true; }
        if (v.evite === "true") linhas.push("Evite aparência futurista exagerada.");
        else if (v.adicione === "true") { v2.extras.futurista = true; notas.push("Sem \"evite\", os computadores vieram com luzes de ficção científica."); }
        if (v.formato === "true") { linhas.push("Utilize formato horizontal 16:9."); v2.formato = "16:9"; }
        if (!linhas.length) { linhas.push("(nenhum feedback)"); notas.push("Sem feedback, a próxima geração repete os mesmos problemas."); }
      }
      var NOMES = { luz: "iluminação", plano: "enquadramento", ambiente: "fundo", formato: "formato", estilo: "estilo" };
      var mudou = Object.keys(NOMES).filter(function (k) { return v1[k] !== v2[k]; }).map(function (k) { return NOMES[k]; });
      ["texto", "logo", "computadores", "futurista"].forEach(function (k) {
        if (!!v1.extras[k] !== !!v2.extras[k]) mudou.push({ texto: "texto ilegível", logo: "logotipo inventado", computadores: "computadores", futurista: "efeito futurista" }[k] + (v2.extras[k] ? " (entrou)" : " (saiu)"));
      });
      var html =
        '<div class="versoes"><figure><figcaption>versão 1</figcaption>' + esboco(v1) + "</figure>" +
        '<figure><figcaption>versão 2</figcaption>' + esboco(v2) + "</figure></div>" +
        '<p class="placar-linha"><b>o que mudou:</b> ' + (mudou.length ? esc(mudou.join(", ")) : "nada") + "</p>" + avisos(notas);
      return { html: html, codigo: linhas.join("\n") };
    },

    /* 08 · Lab — prompt audiovisual com pré-visualização do movimento de câmera */
    video: function (v) {
      var OBJ = { institucional: "institucional", post: "curto para redes sociais", treinamento: "de abertura de treinamento" };
      var FORM = { "16:9": "horizontal 16:9", "9:16": "vertical 9:16", "1:1": "quadrado 1:1" };
      var SUJ = { caminhao: "um caminhão moderno", onibus: "um ônibus de passageiros" };
      var AMB = { rodovia: "por uma rodovia brasileira", cidade: "por uma avenida da cidade" };
      var LUZ = { amanhecer: "ao amanhecer, com luz dourada", dia: "em um dia claro", noite: "à noite, com faróis acesos" };
      var EST = { foto: "Cena realista", cinema: "Cena cinematográfica", vetorial: "Animação em estilo ilustração" };
      var CAM = {
        fixa: "A câmera fica parada e o veículo atravessa o quadro.",
        lateral: "A câmera acompanha o veículo lateralmente, com movimento suave.",
        aproxima: "A câmera se aproxima lentamente do veículo.",
        afasta: "A câmera sobe e se afasta, como um drone.",
        pan: "A câmera faz uma panorâmica lenta da esquerda para a direita."
      };
      var AUD = { nenhum: "Sem áudio.", ambiente: "Som ambiente discreto.", narracao: "Narração calma, em português.", musica: "Música instrumental suave." };
      var FIM = { corte: "Termina em corte seco.", fade: "Termina escurecendo até o preto.", mensagem: "Termina em tela azul com a mensagem \"Direção segura\"." };
      var dur = +v.dur;
      var linhas = [];
      linhas.push("Vídeo " + (OBJ[v.objetivo] || "") + (v.objetivo ? " " : "") + "de " + dur + " segundos" + (v.formato ? ", formato " + FORM[v.formato] : "") + ".");
      linhas.push((EST[v.estilo] || "Cena") + " de " + SUJ[v.sujeito] + " circulando " + AMB[v.ambiente] + (v.luz ? " " + LUZ[v.luz] : "") + ".");
      if (v.camera) linhas.push(CAM[v.camera]);
      if (v.audio) linhas.push(AUD[v.audio]);
      if (v.fim) linhas.push(FIM[v.fim]);
      var restr = [];
      if (v.semLogo === "true") restr.push("logotipos");
      if (v.semTexto === "true") restr.push("textos ou placas legíveis");
      if (v.semManobra === "true") restr.push("manobras perigosas");
      if (restr.length) linhas.push("Sem " + listaE(restr) + ".");

      var BLOCOS = [
        ["objetivo + duração + formato", !!(v.objetivo && v.formato)],
        ["sujeito + ambiente + ação", true],
        ["câmera + iluminação + estilo", !!(v.camera && v.luz && v.estilo)],
        ["áudio + encerramento + restrições", !!(v.audio && v.fim && restr.length)]
      ];
      var notas = [];
      if (v.fim === "mensagem" && v.semTexto === "true") notas.push("Conflito: o encerramento pede uma mensagem escrita, mas as restrições proíbem textos. Escolha um dos dois, ou acrescente a mensagem depois, no editor.");
      if (!v.camera) notas.push("Sem câmera definida, a IA escolhe o movimento: o resultado muda a cada geração.");
      if (dur > 10) notas.push("Muitas ferramentas geram clipes de poucos segundos: um vídeo de " + dur + " s costuma ser montado com mais de um clipe.");

      var cena = esboco({ formato: v.formato || "16:9", luz: v.luz || "dia", ambiente: v.ambiente, sujeito: v.sujeito, posicao: "centro", plano: "aberto",
        estilo: v.estilo === "vetorial" ? "vetorial" : v.estilo, cores: "azul",
        animar: v.camera ? { camera: v.camera, dur: dur, fim: v.fim } : null });
      var fimS = Math.min(2, dur * 0.2);
      var marcas = "";
      for (var t = 0; t <= dur; t += (dur > 12 ? 2 : 1)) marcas += '<span style="left:' + (t / dur * 100) + '%">' + t + "s</span>";
      var trilha = '<div class="linha-tempo">' +
        '<div class="lt-faixa"><span class="lt-rot">imagem</span><div class="lt-barra"><i style="flex:' + (dur - fimS) + '">' + esc(v.camera ? { fixa: "veículo atravessa o quadro", lateral: "câmera acompanha", aproxima: "aproximação", afasta: "afastamento", pan: "panorâmica" }[v.camera] : "movimento: a IA decide") + "</i>" +
        '<i class="lt-fim" style="flex:' + fimS + '">' + esc(v.fim ? { corte: "corte", fade: "escurece", mensagem: "mensagem" }[v.fim] : "?") + "</i></div></div>" +
        '<div class="lt-faixa"><span class="lt-rot">áudio</span><div class="lt-barra lt-barra--audio"><i style="flex:1">' + esc(v.audio ? { nenhum: "sem áudio", ambiente: "som ambiente", narracao: "narração", musica: "música" }[v.audio] : "a IA decide") + "</i></div></div>" +
        '<div class="lt-marcas">' + marcas + "</div></div>";
      var html = '<div class="video-quadro' + (v.formato === "9:16" ? " video-quadro--vertical" : "") + '">' + cena + "</div>" +
        '<p class="nota-demo">pré-visualização do movimento pedido, não o vídeo gerado</p>' + trilha + chips(BLOCOS) + avisos(notas);
      return { html: html, codigo: linhas.join("\n") };
    },

    /* 09 · Lab — qual ferramenta de vídeo usar */
    escolha: function (v) {
      var rec = [], vistos = {}, alerta = "";
      function add(f, motivo) { if (!vistos[f]) { vistos[f] = 1; rec.push([f, motivo]); } }
      var avatar = v.avatar === "true", audio = v.audio === "true", cont = v.continuidade === "true", comparar = v.comparar === "true";
      if (v.autorizacao === "nao" && (avatar || v.base === "video")) {
        alerta = "Sem autorização, não use rosto nem voz de pessoas reais. Use um avatar genérico da própria ferramenta e informe que o apresentador é sintético.";
      }
      if (cont && (v.base === "ideia" || v.base === "roteiro")) add("FLUX", "cria antes as imagens de referência do personagem e do cenário, para manter a mesma aparência em todas as cenas");
      if (v.produto === "completo") {
        if (v.base === "ideia") add("LTX Studio", "organiza a ideia em roteiro, cenas e storyboard antes de gerar");
        add("InVideo", "transforma o roteiro em vídeo completo, com cenas, locução, música e transições");
      } else if (v.produto === "curto") {
        add("Revid", v.base === "longo" ? "corta o conteúdo longo em vídeos curtos e verticais, com legendas e narração" : "produz vídeo curto e vertical, com narração e legendas");
      } else {
        if (audio || cont) add("Flow (Veo)", "gera cenas com referências de personagem, quadro inicial e final, extensão e áudio nativo");
        if (v.base === "video") add("Runway", "transforma o vídeo existente: troca cenário, luz, estilo, remove ou acrescenta elementos");
        else if (v.base === "imagem") add("Runway", "dá movimento à imagem (imagem para vídeo) e refina o clipe no mesmo lugar");
        else add("Runway", "gera o clipe a partir do texto e permite editar e estender a cena");
      }
      if (avatar) add("HeyGen", "apresentador virtual com sincronização labial, a partir do roteiro");
      if (comparar) add("OpenArt", "reúne vários modelos para comparar o mesmo pedido lado a lado");
      if (!audio && !cont && v.produto === "clipe" && v.base === "imagem") add("Flow (Veo)", "alternativa com quadro inicial e final para controlar o começo e o fim do clipe");

      var cards = rec.map(function (r, i) {
        return '<div class="ferramenta-card"><span class="ferramenta-ordem">' + (i + 1) + "</span><div><b>" + r[0] + "</b><p>" + esc(r[1]) + "</p></div></div>";
      }).join("");
      var html = (alerta ? '<div class="avisos"><p class="aviso aviso--forte">' + esc(alerta) + "</p></div>" : "") +
        '<div class="ferramentas-rec">' + cards + "</div>" +
        '<p class="nota-demo">sugestão a partir das perguntas orientadoras; teste e compare antes de decidir</p>';
      var codigo = "fluxo sugerido: " + rec.map(function (r) { return r[0]; }).join(" → ") + " → revisão humana" +
        (alerta ? "\natenção: sem autorização de imagem e voz" : "");
      return { html: html, codigo: codigo };
    },

    /* 12 · Lab — reescrita de texto: o que mudou e se o sentido continua o mesmo */
    reescrita: function (v) {
      var ORIGINAL = "Oi pessoal, só passando pra avisar que a gente vai fazer a revisão dos caminhões na semana que vem, e aí todo mundo tem que deixar o caminhão no pátio até sexta-feira às 18h, menos quem estiver em viagem, que pode deixar na segunda. Quem não deixar vai ficar sem a revisão, e a revisão é importante pra segurança de todo mundo. Qualquer dúvida é só falar comigo.";
      var MODOS = {
        formal: ["Mais formal", "Prezados, informamos que a revisão dos caminhões será realizada na próxima semana. Todos os veículos devem ser deixados no pátio até sexta-feira, às 18h; quem estiver em viagem poderá entregá-los na segunda-feira. Quem não entregar o veículo ficará sem a revisão, que é importante para a segurança de todos. Em caso de dúvidas, estou à disposição.", []],
        simples: ["Mais simples", "Revisão dos caminhões na semana que vem. Deixe o caminhão no pátio até sexta, às 18h. Sem entrega, sem revisão. Dúvidas? Fale comigo.", ["A exceção para quem está em viagem (entregar na segunda) sumiu: o sentido mudou."]],
        repeticao: ["Sem repetições", "Oi, pessoal! Na semana que vem faremos a revisão dos caminhões. Deixem os veículos no pátio até sexta-feira, às 18h; quem estiver em viagem pode deixar na segunda. Quem não entregar fica sem essa manutenção, importante para a segurança de todos. Dúvidas, é só falar comigo.", []],
        objetivo: ["Mais objetivo", "Revisão dos caminhões: semana que vem. Prazo para deixar no pátio: sexta-feira, até 18h (em viagem: segunda-feira, até 18h). Sem entrega, sem revisão. Dúvidas: falar comigo.", ["Apareceu \"segunda-feira, até 18h\": o original não dava horário para a segunda. A IA acrescentou uma informação."]]
      };
      var m = MODOS[v.modo] || MODOS.formal;
      var a = ORIGINAL.split(/\s+/), b = m[1].split(/\s+/);
      var na = function (w) { return semAcentoMin(w).replace(/[^a-z0-9]/g, ""); };
      /* maior subsequência comum, palavra a palavra */
      var L = [], i, j;
      for (i = 0; i <= a.length; i++) { L.push([]); for (j = 0; j <= b.length; j++) L[i].push(0); }
      for (i = a.length - 1; i >= 0; i--) for (j = b.length - 1; j >= 0; j--)
        L[i][j] = na(a[i]) && na(a[i]) === na(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      var outA = [], outB = [], fica = 0;
      i = 0; j = 0;
      while (i < a.length && j < b.length) {
        if (na(a[i]) && na(a[i]) === na(b[j])) { outA.push(esc(a[i])); outB.push(esc(b[j])); i++; j++; fica++; }
        else if (L[i + 1][j] >= L[i][j + 1]) { outA.push("<del>" + esc(a[i]) + "</del>"); i++; }
        else { outB.push("<ins>" + esc(b[j]) + "</ins>"); j++; }
      }
      for (; i < a.length; i++) outA.push("<del>" + esc(a[i]) + "</del>");
      for (; j < b.length; j++) outB.push("<ins>" + esc(b[j]) + "</ins>");
      var html =
        '<div class="reescrita"><div class="reescrita-col"><span class="rotulo-antigo">original · ' + a.length + " palavras</span><p>" + outA.join(" ") + "</p></div>" +
        '<div class="reescrita-col"><span class="rotulo-atual">' + m[0].toLowerCase() + " · " + b.length + " palavras</span><p>" + outB.join(" ") + "</p></div></div>" +
        '<p class="nota-demo">riscado = saiu do original · destacado = entrou na versão sugerida · versões de exemplo</p>' + avisos(m[2]);
      var codigo = "modo: " + m[0].toLowerCase() + " · palavras: " + a.length + " → " + b.length + " · palavras mantidas: " + fica + "\n" +
        (m[2].length ? "confira: " + m[2].join(" ") : "confira: o sentido foi preservado, mas leia as duas versões lado a lado antes de enviar");
      return { html: html, codigo: codigo };
    },

    /* 14 · Lab — perguntar ao documento: a resposta aponta a página de origem */
    documento: function (v, lab) {
      var DOC = [
        [1, "Este manual vale para todos os motoristas que utilizam veículos da frota da empresa, próprios ou alugados."],
        [1, "Antes de cada viagem, o motorista deve fazer a inspeção visual do veículo: pneus, luzes, freios, nível de óleo e lacres da carga, registrando a conferência no aplicativo de checklist."],
        [2, "A troca de óleo do motor deve ser feita a cada 20.000 km ou a cada 6 meses, o que ocorrer primeiro, sempre na oficina credenciada."],
        [2, "Multas de trânsito devem ser comunicadas ao setor de frota em até 3 dias úteis após o recebimento da notificação, para que haja tempo de indicar o condutor."],
        [3, "É proibido transportar passageiros que não sejam funcionários da empresa, mesmo em trechos curtos."],
        [3, "Em caso de acidente, o motorista deve sinalizar o local, acionar o socorro se houver vítimas e comunicar a central em até 1 hora."],
        [4, "O abastecimento deve ser feito apenas nos postos conveniados, usando o cartão-combustível; o comprovante deve ser guardado até o fechamento do mês."],
        [4, "O descanso obrigatório segue a legislação vigente; a escala de jornada é publicada semanalmente pelo setor de operações."]
      ];
      var PERGUNTAS = {
        multa: "Qual o prazo para comunicar uma multa?",
        oleo: "De quanto em quanto tempo devo trocar o óleo?",
        carona: "Posso dar carona no caminhão?",
        acidente: "O que fazer em caso de acidente?",
        velocidade: "Qual a velocidade máxima na BR-277?"
      };
      var SINONIMOS = { carona: "passageiros", batida: "acidente", gasolina: "abastecimento", diesel: "abastecimento", abastecer: "abastecimento", folga: "descanso", jornada: "jornada" };
      var PARADA = "qual quais quando onde como devo pode posso fazer feita feito para pelo pela com sem que uma umas uns caso deve devem tempo quanto sobre isso esta este".split(" ");
      var campo = lab.querySelector('[data-campo="livre"]');
      if (v.pergunta !== lab._ultimaPergunta) { lab._ultimaPergunta = v.pergunta; if (campo) { campo.value = ""; v.livre = ""; } }
      var pergunta = (v.livre || "").trim() || PERGUNTAS[v.pergunta] || "";
      var original = {};          /* radical → palavra como foi escrita na pergunta */
      function radicais(t, guardar) {
        return semAcentoMin(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3 && PARADA.indexOf(w) === -1; })
          .map(function (w) { var r = SINONIMOS[w] || w; r = r.length > 5 ? r.slice(0, 5) : r; if (guardar && !original[r]) original[r] = w; return r; });
      }
      var rq = radicais(pergunta, true), melhor = -1, pontos = 0, comuns = [];
      DOC.forEach(function (p, k) {
        var rp = radicais(p[1]), achou = rq.filter(function (r, x) { return rq.indexOf(r) === x && rp.indexOf(r) !== -1; });
        if (achou.length > pontos) { pontos = achou.length; melhor = k; comuns = achou; }
      });
      var doc = DOC.map(function (p, k) {
        return '<p class="doc-par' + (k === melhor ? " doc-par--achado" : "") + '"><span class="doc-ref">pág. ' + p[0] + " · § " + (k + 1) + "</span>" + esc(p[1]) + "</p>";
      }).join("");
      var resposta = melhor === -1
        ? '<div class="doc-resposta doc-resposta--nao"><b>Não encontrei essa informação no documento.</b><p>A resposta certa é essa. Uma ferramenta descuidada poderia inventar um número; confira sempre na página de origem.</p></div>'
        : '<div class="doc-resposta"><b>Resposta, a partir da página ' + DOC[melhor][0] + ", § " + (melhor + 1) + ":</b><p>" + esc(DOC[melhor][1]) + "</p></div>";
      var html = '<div class="chat-msg chat-msg--voce doc-pergunta">' + esc(pergunta || "(escreva uma pergunta)") + "</div>" + resposta +
        '<div class="documento"><div class="documento-topo">Manual de uso dos veículos da frota <small>documento fictício · 4 páginas</small></div>' + doc + "</div>";
      var codigo = melhor === -1 ? "pergunta: " + pergunta + "\nresultado: nenhum trecho do documento responde a pergunta"
        : "pergunta: " + pergunta + "\ntrecho usado: página " + DOC[melhor][0] + ", § " + (melhor + 1) + "\npalavras em comum: " + comuns.map(function (r) { return original[r]; }).join(", ");
      return { html: html, codigo: codigo };
    },

    /* 15 · Lab — mapa mental, com revisão */
    mapa: function (v) {
      var MAPAS = {
        aula: {
          centro: "Utilidades de IA para o trabalho",
          ramos: [["Escrever", ["QuillBot: corrigir e reformular"]], ["Narrar", ["ElevenLabs: texto em fala"]], ["Ler documentos", ["ChatPDF: perguntas e resumos"]],
            ["Aprender", ["Tutor AI: percursos e exercícios"]], ["Organizar", ["Mapify: mapas mentais"]], ["Apresentar", ["Gamma: cria a versão final"]], ["Registrar", ["tl;dv: transcrição e ata"]]],
          erro: [5, 0, "Gamma: cria a primeira versão", "Simplificação: a IA cria a primeira versão; a versão final é responsabilidade de quem apresenta."]
        },
        reuniao: {
          centro: "Reunião de segurança · 07/10",
          ramos: [["Decisões", ["Renovar os extintores da frota", "Treinamento de direção defensiva"]], ["Responsáveis", ["Bruno: extintores", "Carla: treinamento"]],
            ["Prazos", ["Extintores: até 31/10", "Treinamento: 15/11"]], ["Pendências", ["Orçamento do treinamento"]]],
          erro: [1, 0, "Ana: extintores", "Relação errada: na transcrição, quem ficou com os extintores foi a Ana, não o Bruno."]
        }
      };
      var m = MAPAS[v.fonte] || MAPAS.aula, revisar = v.revisar === "true";
      var ramos = m.ramos.map(function (r, i) {
        return '<div class="mapa-ramo"><b>' + esc(r[0]) + "</b><ul>" + r[1].map(function (f, k) {
          var errado = m.erro[0] === i && m.erro[1] === k;
          return "<li" + (errado && revisar ? ' class="mapa-erro"' : "") + ">" + esc(f) + (errado && revisar ? '<span class="mapa-correcao">' + esc(m.erro[2]) + "</span>" : "") + "</li>";
        }).join("") + "</ul></div>";
      }).join("");
      var fonte = v.fonte === "reuniao" ? '<div class="mapa-fonte"><span>trecho da transcrição</span><p>[10:02] Ana: eu fico com os extintores, até o fim do mês.<br>[10:05] Carla: o treinamento de direção defensiva eu organizo para 15 de novembro.<br>[10:07] Bruno: falta aprovar o orçamento do treinamento.</p></div>' : "";
      var html = fonte + '<div class="mapa"><div class="mapa-centro">' + esc(m.centro) + '</div><div class="mapa-ramos">' + ramos + "</div></div>" +
        (revisar ? avisos([m.erro[3]]) : '<p class="nota-demo">marque "revisar" para conferir o mapa com a fonte</p>');
      var codigo = m.centro + "\n" + m.ramos.map(function (r) { return "  " + r[0] + "\n" + r[1].map(function (f) { return "    · " + f; }).join("\n"); }).join("\n");
      return { html: html, codigo: codigo };
    },

    /* 16 · Lab — contraste e legibilidade de um slide */
    contraste: function (v) {
      var CORES = { azul: ["azul SEST SENAT", "#00307C"], marinho: ["azul-marinho", "#002060"], ciano: ["ciano", "#5FE1FF"], gelo: ["azul-gelo", "#EAF6FE"],
        branco: ["branco", "#FFFFFF"], cinzaClaro: ["cinza claro", "#D1D5DB"], cinza: ["cinza médio", "#9CA3AF"], amarelo: ["amarelo", "#FACC15"], vermelho: ["vermelho", "#DC2626"], preto: ["preto", "#111827"] };
      function lum(hex) {
        var c = [1, 3, 5].map(function (i) { var x = parseInt(hex.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      }
      var t = CORES[v.texto], f = CORES[v.fundo], tam = +v.tamanho;
      var l1 = lum(t[1]), l2 = lum(f[1]), razao = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      var r = Math.round(razao * 10) / 10;
      var corpoGrande = tam >= 24, minCorpo = corpoGrande ? 3 : 4.5;
      var okCorpo = razao >= minCorpo, okTitulo = razao >= 3;
      function selo(ok) { return '<span class="selo-teste ' + (ok ? "selo-teste--ok" : "selo-teste--nao") + '">' + (ok ? "aprovado" : "reprovado") + "</span>"; }
      var html =
        '<div class="slide" style="background:' + f[1] + ";color:" + t[1] + '"><b style="font-size:' + Math.round(tam * 1.6) + 'px">Direção defensiva na chuva</b>' +
        '<p style="font-size:' + tam + 'px">Aumente a distância do veículo da frente e freie antes, sem travar as rodas.</p></div>' +
        '<div class="contraste-resumo"><b class="contraste-num">' + formatar(r, "dec1") + ":1</b>" +
        "<span>título " + selo(okTitulo) + "</span><span>texto de " + tam + " px " + selo(okCorpo) + "</span></div>";
      var codigo = "contraste: " + formatar(r, "dec1") + ":1 (" + t[0] + " sobre " + f[0] + ")\n" +
        "título: " + (okTitulo ? "aprovado" : "reprovado") + " (mínimo 3:1)\n" +
        "texto de " + tam + " px: " + (okCorpo ? "aprovado" : "reprovado") + " (mínimo " + formatar(minCorpo, "geral") + ":1" + (corpoGrande ? ", texto grande" : "") + ")";
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
     10. DESTA AULA — ENCONTRE AS FALHAS NOS QUADROS

     Três quadros de um clipe gerado por IA, com seis falhas
     típicas. Clicar numa falha marca e explica; o contador
     mostra quantas faltam.
     ====================================================== */

  (function () {
    var raiz = document.querySelector("[data-falhas]");
    if (!raiz) return;
    var palco = raiz.querySelector("[data-falhas-palco]");
    var lista = raiz.querySelector("[data-falhas-lista]");
    var cont = raiz.querySelector("[data-falhas-contador]");
    var FALHAS = [
      ["Inconsistência", "A cabine do caminhão era azul no quadro 1 e ficou laranja no quadro 2."],
      ["Deformação", "Uma roda a mais, flutuando acima da carreta."],
      ["Objeto que desaparece", "O poste que estava nos quadros 1 e 2 sumiu no quadro 3."],
      ["Movimento estranho", "No quadro 3 o caminhão está atrás de onde estava no quadro 2: andou de ré."],
      ["Texto ilegível", "A placa da rodovia tem letras sem sentido."],
      ["Problema de áudio", "Som de sirene numa cena sem ambulância."]
    ];
    var W = 320, H = 180, G = 24;
    function quadro(i, x, cor, extras) {
      var c = { formato: "16:9", luz: "dia", ambiente: "rodovia", estilo: "foto", semSujeito: true };
      var base = esboco(c).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
      return '<g transform="translate(' + (i * (W + G)) + ',0)"><g class="falhas-fundo">' + base + "</g>" +
        veiculo("caminhao", x, H * 0.84, 0.95, cor, "#B0B7BF", "") + extras +
        '<text x="8" y="16" class="falhas-num">quadro ' + (i + 1) + "</text></g>";
    }
    var poste = function (px) { return '<rect x="' + px + '" y="' + (H * 0.3) + '" width="4" height="' + (H * 0.42) + '" fill="#6B7280"/><rect x="' + (px - 10) + '" y="' + (H * 0.3) + '" width="24" height="4" fill="#6B7280"/>'; };
    var svg =
      quadro(0, 90, "#00307C", poste(250)) +
      quadro(1, 170, "#C2410C", poste(250) + '<circle cx="140" cy="' + (H * 0.84 - 52) + '" r="7" fill="#111827"/><circle cx="140" cy="' + (H * 0.84 - 52) + '" r="3" fill="#9CA3AF"/>') +
      quadro(2, 130, "#00307C", '<rect x="20" y="' + (H * 0.3) + '" width="104" height="26" fill="#166534"/><text x="26" y="' + (H * 0.3 + 17) + '" class="falhas-placa">BR-2Z7 CASVEL</text>');
    /* áreas clicáveis: [x, y, largura, altura], na ordem de FALHAS */
    var alvos = [
      [W + G + 110, 90, 100, 60], [W + G + 126, H * 0.84 - 64, 28, 26], [2 * (W + G) + 228, H * 0.26, 34, 84],
      [2 * (W + G) + 60, 96, 120, 60], [2 * (W + G) + 16, H * 0.27, 112, 34], [W + G + 4, H + 6, 210, 22]
    ];
    var hs = alvos.map(function (a, i) {
      return '<rect class="falha-alvo" data-falha="' + i + '" x="' + a[0] + '" y="' + a[1] + '" width="' + a[2] + '" height="' + a[3] + '" rx="6"/>';
    }).join("");
    palco.innerHTML = '<svg class="falhas-svg" viewBox="0 0 ' + (3 * W + 2 * G) + " " + (H + 30) + '" role="img" aria-label="Três quadros de um clipe gerado por IA">' +
      svg + '<text x="' + (W + G + 8) + '" y="' + (H + 22) + '" class="falhas-som">[som: sirene de ambulância]</text>' +
      '<text x="8" y="' + (H + 22) + '" class="falhas-som-ok">[som: motor e vento]</text><text x="' + (2 * (W + G) + 8) + '" y="' + (H + 22) + '" class="falhas-som-ok">[som: motor e vento]</text>' +
      hs + "</svg>";
    var achadas = {};
    function desenhar() {
      var n = Object.keys(achadas).length;
      cont.textContent = n + " de " + FALHAS.length + " falhas encontradas";
      lista.innerHTML = FALHAS.map(function (f, i) {
        return achadas[i] ? '<li class="falha-item falha-item--achada"><b>' + f[0] + "</b> " + esc(f[1]) + "</li>" : '<li class="falha-item">?</li>';
      }).join("");
      palco.querySelectorAll("[data-falha]").forEach(function (el) { el.classList.toggle("achada", !!achadas[el.getAttribute("data-falha")]); });
    }
    palco.addEventListener("click", function (ev) {
      var el = ev.target.closest("[data-falha]");
      if (el) { achadas[el.getAttribute("data-falha")] = true; desenhar(); }
    });
    raiz.querySelector("[data-falhas-todas]").addEventListener("click", function () { FALHAS.forEach(function (f, i) { achadas[i] = true; }); desenhar(); });
    raiz.querySelector("[data-falhas-limpar]").addEventListener("click", function () { achadas = {}; desenhar(); });
    desenhar();
  })();

  /* ======================================================
     11. DESTA AULA — TEXTO EM FALA (voz do próprio navegador)

     Usa a síntese de voz do sistema (Web Speech API): funciona
     sem internet com as vozes instaladas no Windows. Mostra o
     efeito de "escrever como se fala" em siglas e números.
     ====================================================== */

  (function () {
    var raiz = document.querySelector("[data-voz]");
    if (!raiz) return;
    var area = raiz.querySelector("[data-voz-texto]");
    var lista = raiz.querySelector("[data-voz-lista]");
    var vel = raiz.querySelector("[data-voz-vel]");
    var tom = raiz.querySelector("[data-voz-tom]");
    var falado = raiz.querySelector("[data-voz-falado]");
    var leitura = raiz.querySelector("[data-voz-leitura]");
    var status = raiz.querySelector("[data-voz-status]");
    var btOuvir = raiz.querySelector("[data-voz-ouvir]");
    var btParar = raiz.querySelector("[data-voz-parar]");
    var TROCAS = [
      [/BR-(\d+)/g, function (m, n) { return "BR " + n; }],
      [/\bkm (\d+)/g, "quilômetro $1"],
      [/\bCNH\b/g, "cê ene agá"],
      [/\b(\d{1,2})h\b/g, "$1 horas"]
    ];
    function textoFinal() {
      var t = area.value;
      if (falado.checked) TROCAS.forEach(function (tr) { t = t.replace(tr[0], tr[1]); });
      return t;
    }
    function mostrar(destaque) {
      var t = textoFinal();
      if (destaque) t = esc(t.slice(0, destaque[0])) + "<mark>" + esc(t.slice(destaque[0], destaque[0] + destaque[1])) + "</mark>" + esc(t.slice(destaque[0] + destaque[1]));
      else t = esc(t);
      leitura.innerHTML = t;
      raiz.querySelector("[data-voz-vel-eco]").textContent = formatar(parseFloat(vel.value), "dec1") + "×";
      raiz.querySelector("[data-voz-tom-eco]").textContent = formatar(parseFloat(tom.value), "dec1");
    }
    [area, falado, vel, tom].forEach(function (el) { el.addEventListener("input", function () { mostrar(); }); el.addEventListener("change", function () { mostrar(); }); });
    mostrar();

    if (!("speechSynthesis" in window)) {
      status.textContent = "Este navegador não tem síntese de voz. Abra a página no Chrome ou no Edge.";
      btOuvir.disabled = true; btParar.disabled = true; lista.disabled = true;
      return;
    }
    var vozes = [];
    function carregar() {
      vozes = window.speechSynthesis.getVoices();
      var pt = vozes.filter(function (vz) { return /^pt/i.test(vz.lang); });
      var usar = pt.length ? pt : vozes;
      lista.innerHTML = usar.length ? usar.map(function (vz) {
        return '<option value="' + esc(vz.name) + '">' + esc(vz.name + " (" + vz.lang + ")") + "</option>";
      }).join("") : '<option value="">voz padrão do sistema</option>';
      var br = usar.filter(function (vz) { return /pt[-_]BR/i.test(vz.lang); })[0];
      if (br) lista.value = br.name;
      status.textContent = pt.length ? pt.length + " voz(es) em português neste computador." :
        vozes.length ? "Nenhuma voz em português instalada: a leitura sai com sotaque de outro idioma." : "Carregando as vozes do sistema…";
    }
    carregar();
    if (typeof window.speechSynthesis.addEventListener === "function") window.speechSynthesis.addEventListener("voiceschanged", carregar);
    setTimeout(function () {
      if (!vozes.length) status.textContent = "Nenhuma voz instalada foi encontrada: o navegador tenta usar a voz padrão.";
    }, 2000);

    btOuvir.addEventListener("click", function () {
      var t = textoFinal();
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t);
      var vz = vozes.filter(function (x) { return x.name === lista.value; })[0];
      if (vz) { u.voice = vz; u.lang = vz.lang; } else u.lang = "pt-BR";
      u.rate = parseFloat(vel.value);
      u.pitch = parseFloat(tom.value);
      u.onboundary = function (ev) {
        if (ev.name && ev.name !== "word") return;
        var fimP = t.slice(ev.charIndex).search(/[\s.,;:!?]/);
        mostrar([ev.charIndex, fimP === -1 ? t.length - ev.charIndex : fimP]);
      };
      u.onend = function () { mostrar(); status.textContent = "Leitura concluída."; };
      u.onerror = function () { mostrar(); };
      status.textContent = "Lendo…";
      window.speechSynthesis.speak(u);
    });
    btParar.addEventListener("click", function () { window.speechSynthesis.cancel(); mostrar(); status.textContent = "Leitura interrompida."; });
  })();

  /* ======================================================
     12. DESTA AULA — COPIAR O PROMPT MONTADO

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
