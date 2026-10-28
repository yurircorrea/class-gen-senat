/* =========================================================
   pbi.js — simulador do Power BI Desktop (aula 2)

   Não é o Power BI, mas se comporta como ele no que a aula
   ensina: as medidas são escritas em DAX numa barra de
   fórmulas e calculadas de verdade sobre as linhas reais da
   BaseProdução e da BaseFuncionarios, respeitando o contexto
   de filtro (segmentações, categoria do gráfico, CALCULATE).

   1. Utilidades: escape, formatos de número, datas
   2. Modelo de dados: tabelas, colunas, medidas
   3. DAX: análise léxica, sintática e avaliação
   4. Visuais: cartão, cartão de linha múltipla, barras,
      colunas, área, rosca, funil, medidor, segmentação,
      tabela, árvore hierárquica, sparkline, imagem
   5. Simulador: faixa de opções, barra de fórmulas, painéis
      Visualizações e Dados, tela, exibição de tabela, tarefas
   6. Laboratórios desta aula (configuração) e inicialização

   Uso no HTML: <div class="pbi-sim" data-sim="medidas"></div>
   Depende de js/dados-producao.js e js/dados-rh.js.
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. UTILIDADES
     ====================================================== */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function decimal(v, casas) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function semAcento(s) {
    return String(s).normalize ? String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() : String(s).toLowerCase();
  }
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  /* datas guardadas como dias desde 01/01/1970 (UTC) */
  function diaDeIso(s) {
    if (!s) return null;
    var p = s.split("-");
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5);
  }
  function dataDe(d) { return new Date(d * 864e5); }
  function anoDe(d) { return dataDe(d).getUTCFullYear(); }
  function mesDe(d) { return dataDe(d).getUTCMonth() + 1; }
  function diaDoMes(d) { return dataDe(d).getUTCDate(); }
  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function dataTexto(d) { return dois(diaDoMes(d)) + "/" + dois(mesDe(d)) + "/" + anoDe(d); }

  /* como o Power BI mostra um número: unidades de exibição (Mil, Mi, Bi) */
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

  /* formata um valor de medida ou de coluna
     modo "cartao": unidades automáticas; "celula": número inteiro, com separador;
     "rotulo": rótulo de dados, curto */
  function formatar(v, formato, modo) {
    if (v === null || v === undefined) return modo === "celula" ? "" : "(Em branco)";
    if (typeof v === "boolean") return v ? "Verdadeiro" : "Falso";
    if (typeof v === "string") return v;
    if (isNaN(v)) return "NaN";
    if (!isFinite(v)) return v > 0 ? "Infinito" : "-Infinito";
    if (formato === "pct") return decimal(v * 100, 2) + "%";
    if (formato === "data") return dataTexto(v);
    var moeda = formato === "moeda";
    if (modo === "celula") {
      var inteiroV = formato === "inteiro" || Math.abs(v - Math.round(v)) < 1e-9;
      return (moeda ? "R$ " : "") + decimal(formato === "inteiro" ? Math.round(v) : v, inteiroV && !moeda ? 0 : 2);
    }
    if (Math.abs(v) < 1000) {
      if (formato === "inteiro" || Math.abs(v - Math.round(v)) < 1e-9) return (moeda ? "R$ " : "") + decimal(Math.round(v), 0);
      return (moeda ? "R$ " : "") + decimal(v, 2);
    }
    return valorPbi(v, { moeda: moeda, casas: modo === "rotulo" ? 1 : 2 });
  }

  /* ======================================================
     2. MODELO DE DADOS

     Cada laboratório tem o seu modelo (as medidas e colunas
     calculadas que a turma cria ficam nele). As colunas
     originais são compartilhadas, porque não mudam.
     ====================================================== */

  var BRUTO = {};

  function coluna(nome, tipo, dados, extra) {
    var c = { nome: nome, tipo: tipo, dados: dados };
    for (var k in extra || {}) c[k] = extra[k];
    return c;
  }

  function tabelaProducao() {
    if (BRUTO.producao) return BRUTO.producao;
    var P = window.DADOS_PRODUCAO, c = P.colunas, d0 = diaDeIso(P.inicio);
    var ocs = P.ocorrencias.map(function (o) { return o === "" ? null : o; });
    BRUTO.producao = {
      nome: "BaseProdução", n: P.n, colunas: [
        coluna("Numero Ordem", "inteiro", c.ordem),
        coluna("Operador", "texto", c.op.map(function (i) { return P.operadores[i]; })),
        coluna("Produto", "texto", c.prod.map(function (i) { return P.produtos[i]; })),
        coluna("Ocorrência", "texto", c.oc.map(function (i) { return ocs[i]; })),
        coluna("Data Inicio", "data", c.dia.map(function (x) { return d0 + x; })),
        coluna("Total Horas", "decimal", c.horas.map(function (x) { return x / 10000; })),
        coluna("Qtd Produzida", "inteiro", c.qp),
        coluna("Qtd Rejeitada", "inteiro", c.qr)
      ]
    };
    return BRUTO.producao;
  }

  /* Cidade: o trecho antes de " - UF" no penúltimo pedaço do endereço */
  function cidadeDe(endereco) {
    var p = String(endereco).split(", ");
    return p.length > 1 ? p[p.length - 2].replace(/ - [A-Z]{2}$/, "") : null;
  }

  function tabelaRh(comCidade) {
    var chave = comCidade ? "rhCidade" : "rh";
    if (BRUTO[chave]) return BRUTO[chave];
    var R = window.DADOS_RH, L = R.linhas;
    function col(i) { return L.map(function (l) { return l[i]; }); }
    function datas(i) { return L.map(function (l) { return diaDeIso(l[i]); }); }
    var cols = [
      coluna("ID RH", "inteiro", col(0)),
      coluna("Nome Completo", "texto", col(1)),
      coluna("Estado Civil", "texto", col(2)),
      coluna("Genero", "texto", col(3)),
      coluna("Data de Nascimento", "data", datas(4)),
      coluna("Endereço", "texto", col(5)),
      coluna("Data de Contratacao", "data", datas(6)),
      coluna("Data de Demissao", "data", datas(7)),
      coluna("Salario", "inteiro", col(8)),
      coluna("Cargo", "texto", col(9)),
      coluna("Área", "texto", col(10)),
      coluna("Horas Extras", "inteiro", col(11)),
      coluna("Avaliação do Funcionário", "decimal", col(12))
    ];
    if (comCidade) cols.splice(6, 0, coluna("Cidade", "texto", col(5).map(cidadeDe), { pq: true }));
    BRUTO[chave] = { nome: "BaseFuncionarios", n: L.length, colunas: cols };
    return BRUTO[chave];
  }

  function DaxErro(msg) { this.msg = msg; }

  function Modelo() {
    this.tabelas = [];
    this.medidas = [];
    this.seq = 0;
    this.limpar();
  }
  Modelo.prototype.limpar = function () { this.cacheLinhas = {}; this.cacheAgg = {}; this.cacheMed = {}; this.nCache = 0; };
  Modelo.prototype.addTabela = function (bruta, extra) {
    var t = { nome: bruta.nome, n: bruta.n, colunas: bruta.colunas.slice() };
    for (var k in extra || {}) t[k] = extra[k];
    this.tabelas.push(t);
    return t;
  };
  Modelo.prototype.tabela = function (nome) {
    var a = semAcento(nome);
    for (var i = 0; i < this.tabelas.length; i++) if (semAcento(this.tabelas[i].nome) === a) return this.tabelas[i];
    return null;
  };
  Modelo.prototype.col = function (t, nome) {
    if (typeof t === "string") t = this.tabela(t);
    if (!t) return null;
    var a = nome.toLowerCase();
    for (var i = 0; i < t.colunas.length; i++) if (t.colunas[i].nome.toLowerCase() === a) return t.colunas[i];
    return null;
  };
  Modelo.prototype.medida = function (nome) {
    var a = String(nome).toLowerCase();
    for (var i = 0; i < this.medidas.length; i++) if (this.medidas[i].nome.toLowerCase() === a) return this.medidas[i];
    return null;
  };
  Modelo.prototype.donoColuna = function (nome) {
    for (var i = 0; i < this.tabelas.length; i++) if (this.col(this.tabelas[i], nome)) return this.tabelas[i];
    return null;
  };

  /* ---------- contexto de filtro ----------
     filtro = { tabela, cols: [colunas afetadas], pred(i), chave, unica? } */
  function chaveDe(filtros) {
    return filtros.map(function (f) { return f.tabela + ":" + f.chave; }).join("|");
  }
  Modelo.prototype.visiveis = function (t, filtros) {
    var fs = filtros.filter(function (f) { return f.tabela === t.nome; });
    var i, unica = null;
    for (i = 0; i < fs.length; i++) if (fs[i].unica !== undefined) unica = fs[i].unica;
    if (unica !== null) {
      return fs.every(function (f) { return f.pred(unica); }) ? [unica] : [];
    }
    if (!fs.length) {
      var chaveTudo = t.nome + "§*" + t.n;
      if (!this.cacheLinhas[chaveTudo]) {
        var todas = new Array(t.n);
        for (i = 0; i < t.n; i++) todas[i] = i;
        this.cacheLinhas[chaveTudo] = todas;
      }
      return this.cacheLinhas[chaveTudo];
    }
    var chave = t.nome + "§" + chaveDe(fs);
    if (this.cacheLinhas[chave]) return this.cacheLinhas[chave];
    var res = [];
    for (i = 0; i < t.n; i++) {
      var ok = true;
      for (var k = 0; k < fs.length && ok; k++) ok = fs[k].pred(i);
      if (ok) res.push(i);
    }
    if (++this.nCache > 400) this.limpar();
    this.cacheLinhas[chave] = res;
    return res;
  };

  /* ======================================================
     3. DAX

     O suficiente para a aula: agregações (SUM, AVERAGE, MIN,
     MAX, COUNT, COUNTA, COUNTBLANK, DISTINCTCOUNT), COUNTROWS,
     iteradores (SUMX, AVERAGEX, MINX, MAXX, COUNTX), FILTER,
     ALL, CALCULATE, DIVIDE, IF, BLANK, ISBLANK, AND, OR, NOT,
     ROUND, INT, ABS, YEAR, MONTH, DAY, TODAY, DATEDIFF, textos.
     Nomes de função em inglês, como no Power BI. Separador ","
     (";" também é aceito), ponto decimal.
     As mensagens de erro imitam as do Power BI em português.
     ====================================================== */

  function lexDax(s) {
    var toks = [], i = 0, m, r;
    var RE = [
      [/^\s+/, null], [/^(\/\/|--)[^\n]*/, null], [/^\/\*[\s\S]*?\*\//, null],
      [/^(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?/, "num"], [/^"(?:[^"]|"")*"/, "str"],
      [/^\[[^\]\n]*\]/, "col"], [/^'(?:[^'\n]|'')+'/, "tab"],
      [/^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_.]*/, "id"],
      [/^(<>|<=|>=|==|&&|\|\||[-+*\/^&=<>(),;])/, "op"]
    ];
    while (i < s.length) {
      r = s.slice(i);
      var achou = false;
      for (var k = 0; k < RE.length; k++) {
        m = RE[k][0].exec(r);
        if (!m) continue;
        achou = true;
        var t = RE[k][1];
        if (t === "num") toks.push({ t: t, v: parseFloat(m[0]), txt: m[0] });
        else if (t === "str") toks.push({ t: t, v: m[0].slice(1, -1).replace(/""/g, '"'), txt: m[0] });
        else if (t === "col") toks.push({ t: t, v: m[0].slice(1, -1).trim(), txt: m[0] });
        else if (t === "tab") toks.push({ t: t, v: m[0].slice(1, -1).replace(/''/g, "'"), txt: m[0] });
        else if (t === "id") toks.push({ t: t, v: m[0], txt: m[0] });
        else if (t === "op") toks.push({ t: t, v: m[0] === ";" ? "," : m[0], txt: m[0] });
        i += m[0].length;
        break;
      }
      if (!achou) {
        if (r.charAt(0) === "[") throw new DaxErro("Falta fechar o colchete: o nome da coluna ou da medida vai entre [ e ].");
        if (r.charAt(0) === '"') throw new DaxErro("Falta fechar as aspas do texto.");
        throw new DaxErro("A sintaxe para '" + r.charAt(0) + "' está incorreta.");
      }
    }
    return toks;
  }

  function parseDax(toks) {
    var i = 0;
    function ver() { return toks[i]; }
    function eOp(v) { var t = toks[i]; return t && t.t === "op" && t.v === v; }
    function erroEm(t) {
      if (!t) throw new DaxErro("A fórmula terminou antes da hora: falta fechar um parêntese ou completar um argumento.");
      throw new DaxErro("A sintaxe para '" + t.txt + "' está incorreta.");
    }
    function exige(v) { if (!eOp(v)) erroEm(ver()); i++; }
    function bin(prox, ops) {
      return function () {
        var e = prox();
        while (ver() && ver().t === "op" && ops.indexOf(ver().v) !== -1) {
          var op = toks[i++].v;
          e = { k: "bin", op: op, a: e, b: prox() };
        }
        return e;
      };
    }
    function un() {
      if (eOp("-")) { i++; return { k: "neg", a: un() }; }
      if (eOp("+")) { i++; return un(); }
      return prim();
    }
    function prim() {
      var t = toks[i++];
      if (!t) erroEm(null);
      if (t.t === "num") return { k: "num", v: t.v };
      if (t.t === "str") return { k: "str", v: t.v };
      if (t.t === "col") return { k: "ref", nome: t.v };
      if (t.t === "tab" || t.t === "id") {
        if (t.t === "id" && eOp("(")) {
          i++;
          var args = [];
          if (!eOp(")")) {
            args.push(ou());
            while (eOp(",")) { i++; args.push(ou()); }
          }
          exige(")");
          return { k: "fn", nome: t.v.toUpperCase(), orig: t.v, args: args };
        }
        if (ver() && ver().t === "col") { var c = toks[i++]; return { k: "col", tabela: t.v, coluna: c.v }; }
        if (t.t === "id" && /^(TRUE|FALSE)$/i.test(t.v)) return { k: "bool", v: /^TRUE$/i.test(t.v) };
        return { k: "tab", nome: t.v };
      }
      if (t.t === "op" && t.v === "(") { var e = ou(); exige(")"); return e; }
      erroEm(t);
    }
    var pot = bin(un, ["^"]);
    var prod = bin(pot, ["*", "/"]);
    var soma = bin(prod, ["+", "-"]);
    var cat = bin(soma, ["&"]);
    var cmp = bin(cat, ["=", "==", "<>", "<", ">", "<=", ">="]);
    var e = bin(cmp, ["&&"]);
    var ou = bin(e, ["||"]);
    if (!toks.length) throw new DaxErro("A expressão está vazia: escreva a fórmula depois do sinal de igual.");
    var ast = ou();
    if (i < toks.length) erroEm(toks[i]);
    return ast;
  }

  /* texto de volta, para chave de cache e mensagens */
  function textoAst(n) {
    switch (n.k) {
      case "num": return String(n.v);
      case "str": return '"' + n.v + '"';
      case "bool": return n.v ? "TRUE()" : "FALSE()";
      case "ref": return "[" + n.nome + "]";
      case "col": return n.tabela + "[" + n.coluna + "]";
      case "tab": return n.nome;
      case "neg": return "-" + textoAst(n.a);
      case "bin": return "(" + textoAst(n.a) + n.op + textoAst(n.b) + ")";
      case "fn": return n.nome + "(" + n.args.map(textoAst).join(",") + ")";
    }
    return "?";
  }

  function eBlank(v) { return v === null || v === undefined; }
  function tipoNome(v) {
    return typeof v === "string" ? "Texto" : typeof v === "boolean" ? "Verdadeiro/Falso" : "Número";
  }
  function paraNum(v) {
    if (eBlank(v)) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    var s = String(v).trim(), n = Number(s);
    if (s !== "" && !isNaN(n)) return n;
    throw new DaxErro("Não é possível converter o valor '" + v + "' do tipo Texto para o tipo Número.");
  }
  function paraTexto(v) {
    if (eBlank(v)) return "";
    if (typeof v === "boolean") return v ? "True" : "False";
    if (typeof v === "number") return String(v).replace(".", ",");
    return String(v);
  }
  function verdade(v) {
    if (eBlank(v)) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    throw new DaxErro("Não é possível converter o valor '" + v + "' do tipo Texto para o tipo Verdadeiro/Falso.");
  }
  /* operador "=": BLANK é igual a 0, a "" e a FALSE; textos sem diferenciar maiúsculas */
  function igual(a, b) {
    if (eBlank(a) && eBlank(b)) return true;
    if (eBlank(a)) return b === 0 || b === "" || b === false;
    if (eBlank(b)) return a === 0 || a === "" || a === false;
    if (typeof a === "string" && typeof b === "string") return a.toLowerCase() === b.toLowerCase();
    if (typeof a === "boolean" || typeof b === "boolean") return paraNum(a) === paraNum(b);
    if (typeof a !== typeof b) {
      throw new DaxErro("As operações de comparação do DAX não aceitam comparar valores do tipo " + tipoNome(a) + " com valores do tipo " + tipoNome(b) + ".");
    }
    return Math.abs(a - b) < 1e-9;
  }
  function comparar(a, b) {
    if (eBlank(a)) a = typeof b === "string" ? "" : 0;
    if (eBlank(b)) b = typeof a === "string" ? "" : 0;
    if (typeof a === "string" && typeof b === "string") { a = a.toLowerCase(); b = b.toLowerCase(); return a < b ? -1 : a > b ? 1 : 0; }
    if (typeof a === "string" || typeof b === "string") {
      throw new DaxErro("As operações de comparação do DAX não aceitam comparar valores do tipo " + tipoNome(a) + " com valores do tipo " + tipoNome(b) + ".");
    }
    a = paraNum(a); b = paraNum(b);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  var EXCEL_PARA_DAX = {
    SOMA: "SUM", MEDIA: "AVERAGE", "MÉDIA": "AVERAGE", "MÁXIMO": "MAX", MAXIMO: "MAX", "MÍNIMO": "MIN", MINIMO: "MIN",
    "CONT.NÚM": "COUNT", "CONT.NUM": "COUNT", "CONT.VALORES": "COUNTA", "CONT.SE": "CALCULATE com COUNTROWS", SE: "IF",
    SOMASE: "CALCULATE com SUM", DIVIDIR: "DIVIDE", CALCULAR: "CALCULATE", ANO: "YEAR", "MÊS": "MONTH", MES: "MONTH",
    CONTAR: "COUNTROWS", "SEERRO": "IFERROR (prefira DIVIDE)"
  };

  /* colunas citadas numa expressão de filtro */
  function colunasDe(n, lista) {
    lista = lista || [];
    if (n.k === "col") lista.push(n);
    if (n.a) colunasDe(n.a, lista);
    if (n.b) colunasDe(n.b, lista);
    if (n.args) n.args.forEach(function (x) { colunasDe(x, lista); });
    return lista;
  }
  function citaMedida(n, modelo) {
    if (n.k === "ref" && modelo.medida(n.nome)) return true;
    if (n.k === "fn" && /^(CALCULATE|SUM|AVERAGE|COUNTROWS|SUMX|MIN|MAX|COUNT|DISTINCTCOUNT)$/.test(n.nome)) return true;
    return !!((n.a && citaMedida(n.a, modelo)) || (n.b && citaMedida(n.b, modelo)) || (n.args && n.args.some(function (x) { return citaMedida(x, modelo); })));
  }

  function erroColunaSolta(t, c) {
    return new DaxErro("Não é possível determinar um único valor para a coluna '" + c + "' na tabela '" + t +
      "'. Isso pode acontecer quando uma fórmula de medida se refere a uma coluna que contém muitos valores sem especificar uma agregação, como mín., máx., contagem ou soma, para obter um único resultado.");
  }

  Modelo.prototype.av = function (n, ctx) {
    switch (n.k) {
      case "num": case "str": case "bool": return n.v;
      case "neg": var a = this.av(n.a, ctx); return eBlank(a) ? null : -paraNum(a);
      case "bin": return this.bin(n, ctx);
      case "ref": return this.refColchete(n, ctx);
      case "col": return this.refColuna(n, ctx);
      case "tab":
        if (!this.tabela(n.nome)) throw new DaxErro("Falha ao resolver o nome '" + n.nome + "'. Ele não é um identificador válido.");
        throw new DaxErro("A tabela '" + n.nome + "' foi usada onde se espera um valor único. Para contar as linhas, use COUNTROWS(" + n.nome + ").");
      case "fn": return this.fn(n, ctx);
    }
    throw new DaxErro("Expressão inválida.");
  };

  Modelo.prototype.bin = function (n, ctx) {
    var op = n.op;
    if (op === "&&") return verdade(this.av(n.a, ctx)) && verdade(this.av(n.b, ctx));
    if (op === "||") return verdade(this.av(n.a, ctx)) || verdade(this.av(n.b, ctx));
    return testar(op, this.av(n.a, ctx), this.av(n.b, ctx));
  };

  function testar(op, a, b) {
    switch (op) {
      case "+": if (eBlank(a) && eBlank(b)) return null; return paraNum(a) + paraNum(b);
      case "-": if (eBlank(a) && eBlank(b)) return null; return paraNum(a) - paraNum(b);
      case "*": if (eBlank(a) || eBlank(b)) return null; return paraNum(a) * paraNum(b);
      case "/": if (eBlank(a)) return null; return paraNum(a) / paraNum(b);
      case "^": if (eBlank(a)) return null; return Math.pow(paraNum(a), paraNum(b));
      case "&": return paraTexto(a) + paraTexto(b);
      case "=": return igual(a, b);
      case "==": return eBlank(a) || eBlank(b) ? eBlank(a) && eBlank(b) : igual(a, b);
      case "<>": return !igual(a, b);
      case "<": return comparar(a, b) < 0;
      case ">": return comparar(a, b) > 0;
      case "<=": return comparar(a, b) <= 0;
      case ">=": return comparar(a, b) >= 0;
    }
    throw new DaxErro("Operador desconhecido: " + op);
  }

  Modelo.prototype.refColchete = function (n, ctx) {
    var m = this.medida(n.nome);
    if (m) return this.avMedida(m, ctx);
    if (ctx.linha) {
      var c = this.col(ctx.linha.tabela, n.nome);
      if (c) return c.dados[ctx.linha.i];
    }
    var dono = this.donoColuna(n.nome);
    if (dono) throw erroColunaSolta(dono.nome, this.col(dono, n.nome).nome);
    throw new DaxErro("A coluna ou medida '" + n.nome + "' não pode ser encontrada ou não pode ser usada nesta expressão.");
  };

  Modelo.prototype.refColuna = function (n, ctx) {
    var t = this.tabela(n.tabela);
    if (!t) throw new DaxErro("Falha ao resolver o nome '" + n.tabela + "'. Ele não é um identificador válido.");
    var c = this.col(t, n.coluna);
    if (!c) {
      var m = this.medida(n.coluna);
      if (m) return this.avMedida(m, ctx);
      throw new DaxErro("A coluna '" + n.coluna + "' não pode ser encontrada na tabela '" + t.nome + "' ou não pode ser usada nesta expressão.");
    }
    if (ctx.linha && ctx.linha.tabela === t.nome) return c.dados[ctx.linha.i];
    throw erroColunaSolta(t.nome, c.nome);
  };

  /* transição de contexto: a linha atual vira filtro */
  Modelo.prototype.transicao = function (ctx) {
    var l = ctx.linha;
    return {
      filtros: ctx.filtros.filter(function (f) { return f.unica === undefined || f.tabela !== l.tabela; }).concat([{
        tabela: l.tabela, cols: ["*"], unica: l.i, chave: "L" + l.i, pred: function (i) { return i === l.i; }
      }]),
      linha: null, pilha: ctx.pilha
    };
  };

  Modelo.prototype.avMedida = function (m, ctx) {
    if (m.erro) throw new DaxErro("A medida '" + m.nome + "' tem um erro e não pode ser calculada.");
    if (ctx.pilha.indexOf(m.nome) !== -1) {
      throw new DaxErro("Foi detectada uma dependência circular: " + ctx.pilha.concat(m.nome).join(" → ") + ".");
    }
    var c2 = ctx.linha ? this.transicao(ctx) : ctx;
    var chave = m.nome + "§" + chaveDe(c2.filtros);
    if (!this.cacheMed.hasOwnProperty(chave)) {
      this.cacheMed[chave] = this.av(m.ast, { filtros: c2.filtros, linha: null, pilha: ctx.pilha.concat(m.nome) });
    }
    return this.cacheMed[chave];
  };

  Modelo.prototype.colDeArg = function (n, fn) {
    if (n.k !== "col") {
      if (n.k === "ref" && this.donoColuna(n.nome) && !this.medida(n.nome)) {
        throw new DaxErro("Na função " + fn + ", escreva o nome da tabela antes da coluna: Tabela[" + n.nome + "].");
      }
      throw new DaxErro("A função " + fn + " só aceita uma referência de coluna como argumento.");
    }
    var t = this.tabela(n.tabela);
    if (!t) throw new DaxErro("Falha ao resolver o nome '" + n.tabela + "'. Ele não é um identificador válido.");
    var c = this.col(t, n.coluna);
    if (!c) throw new DaxErro("A coluna '" + n.coluna + "' não pode ser encontrada na tabela '" + t.nome + "' ou não pode ser usada nesta expressão.");
    return { t: t, c: c };
  };

  Modelo.prototype.agregar = function (fn, n, ctx) {
    var tc = this.colDeArg(n, fn), t = tc.t, c = tc.c;
    var fs = ctx.filtros.filter(function (f) { return f.tabela === t.nome; });
    var chave = fn + "§" + t.nome + "§" + c.nome + "§" + chaveDe(fs);
    if (this.cacheAgg.hasOwnProperty(chave)) return this.cacheAgg[chave];
    if (c.tipo === "texto" && /^(SUM|AVERAGE)$/.test(fn)) {
      throw new DaxErro("A função " + fn + " não pode trabalhar com valores do tipo String.");
    }
    var idx = this.visiveis(t, ctx.filtros), d = c.dados, r = null, k, v, n2 = 0;
    if (fn === "SUM" || fn === "AVERAGE") {
      var s = 0;
      for (k = 0; k < idx.length; k++) { v = d[idx[k]]; if (v !== null && v !== undefined) { s += v; n2++; } }
      r = n2 ? (fn === "SUM" ? s : s / n2) : null;
    } else if (fn === "MIN" || fn === "MAX") {
      for (k = 0; k < idx.length; k++) {
        v = d[idx[k]];
        if (v === null || v === undefined) continue;
        if (r === null || (fn === "MIN" ? comparar(v, r) < 0 : comparar(v, r) > 0)) r = v;
      }
    } else if (fn === "COUNT" || fn === "COUNTA") {
      for (k = 0; k < idx.length; k++) { v = d[idx[k]]; if (v !== null && v !== undefined) n2++; }
      r = n2 || null;
    } else if (fn === "COUNTBLANK") {
      for (k = 0; k < idx.length; k++) { v = d[idx[k]]; if (v === null || v === undefined || v === "") n2++; }
      r = n2 || null;
    } else if (fn === "DISTINCTCOUNT" || fn === "DISTINCTCOUNTNOBLANK") {
      var vistos = {};
      for (k = 0; k < idx.length; k++) {
        v = d[idx[k]];
        if (fn === "DISTINCTCOUNTNOBLANK" && (v === null || v === undefined)) continue;
        var kk = typeof v === "string" ? "s" + v.toLowerCase() : "n" + v;
        if (!vistos[kk]) { vistos[kk] = 1; n2++; }
      }
      r = n2 || null;
    }
    this.cacheAgg[chave] = r;
    return r;
  };

  /* expressão de tabela: nome da tabela, FILTER(...) ou ALL(...) */
  Modelo.prototype.avTabela = function (n, ctx) {
    var self = this;
    if (n.k === "tab") {
      var t = this.tabela(n.nome);
      if (!t) throw new DaxErro("Falha ao resolver o nome '" + n.nome + "'. Ele não é um identificador válido.");
      return { t: t, idx: this.visiveis(t, ctx.filtros) };
    }
    if (n.k === "fn" && n.nome === "FILTER") {
      if (n.args.length !== 2) throw new DaxErro("A função FILTER precisa de dois argumentos: a tabela e a condição.");
      var base = this.avTabela(n.args[0], ctx);
      return {
        t: base.t, idx: base.idx.filter(function (i) {
          return verdade(self.av(n.args[1], { filtros: ctx.filtros, linha: { tabela: base.t.nome, i: i }, pilha: ctx.pilha }));
        })
      };
    }
    if (n.k === "fn" && (n.nome === "ALL" || n.nome === "REMOVEFILTERS")) {
      var a = n.args[0];
      if (!a || a.k !== "tab") throw new DaxErro("Nesta simulação, use ALL com o nome de uma tabela: ALL(Tabela).");
      var t2 = this.tabela(a.nome);
      if (!t2) throw new DaxErro("Falha ao resolver o nome '" + a.nome + "'. Ele não é um identificador válido.");
      return { t: t2, idx: this.visiveis(t2, []) };
    }
    if (n.k === "col" || n.k === "ref") {
      throw new DaxErro("A função espera uma tabela, e recebeu uma coluna. Para contar as linhas, use o nome da tabela: COUNTROWS(Tabela).");
    }
    throw new DaxErro("A função espera uma tabela como argumento, como o nome da tabela ou FILTER(...).");
  };

  Modelo.prototype.calcular = function (args, ctx) {
    var self = this;
    var base = ctx.linha ? this.transicao(ctx) : { filtros: ctx.filtros, linha: null, pilha: ctx.pilha };
    var filtros = base.filtros.slice();
    for (var k = 1; k < args.length; k++) {
      var f = args[k];
      if (f.k === "fn" && (f.nome === "ALL" || f.nome === "REMOVEFILTERS")) {
        f.args.forEach(function (a) {
          if (a.k === "tab") {
            var t = self.tabela(a.nome);
            if (!t) throw new DaxErro("Falha ao resolver o nome '" + a.nome + "'. Ele não é um identificador válido.");
            filtros = filtros.filter(function (x) { return x.tabela !== t.nome; });
          } else if (a.k === "col") {
            var tc = self.colDeArg(a, f.nome);
            filtros = filtros.filter(function (x) { return !(x.tabela === tc.t.nome && (x.cols.indexOf(tc.c.nome) !== -1 || x.cols.indexOf("*") !== -1)); });
          } else throw new DaxErro("A função " + f.nome + " espera uma tabela ou uma coluna.");
        });
        continue;
      }
      if ((f.k === "fn" && f.nome === "FILTER") || f.k === "tab") {
        var tb = this.avTabela(f, base), conj = {};
        tb.idx.forEach(function (i) { conj[i] = 1; });
        filtros.push({ tabela: tb.t.nome, cols: [], chave: "F" + (++this.seq), pred: function (i) { return conj[i] === 1; } });
        continue;
      }
      f = this.qualificar(f);
      var cols = colunasDe(f);
      if (!cols.length) {
        throw new DaxErro("Cada filtro do CALCULATE precisa citar uma coluna, como Tabela[Coluna] = valor.");
      }
      if (citaMedida(f, this)) {
        throw new DaxErro("Uma função 'CALCULATE' foi usada em uma expressão True/False usada como expressão de filtro de tabela. Isso não é permitido.");
      }
      var tcs = cols.map(function (c) { return self.colDeArg(c, "CALCULATE"); });
      var tn = tcs[0].t.nome;
      if (tcs.some(function (x) { return x.t.nome !== tn; })) {
        throw new DaxErro("Um filtro do CALCULATE pode citar colunas de uma tabela só.");
      }
      var nomes = tcs.map(function (x) { return x.c.nome; });
      filtros = filtros.filter(function (x) {
        return !(x.tabela === tn && x.cols.some(function (c) { return nomes.indexOf(c) !== -1; }));
      });
      filtros.push({
        tabela: tn, cols: nomes, chave: "C" + textoAst(f),
        pred: this.predRapido(f) || (function (expr, tabela) {
          return function (i) { return verdade(self.av(expr, { filtros: [], linha: { tabela: tabela, i: i }, pilha: [] })); };
        })(f, tn)
      });
    }
    return this.av(args[0], { filtros: filtros, linha: null, pilha: ctx.pilha });
  };

  /* [Coluna] sem a tabela, dentro de um filtro: o DAX acha a tabela pelo nome */
  Modelo.prototype.qualificar = function (n) {
    var self = this;
    if (n.k === "ref" && !this.medida(n.nome) && this.donoColuna(n.nome)) {
      return { k: "col", tabela: this.donoColuna(n.nome).nome, coluna: n.nome };
    }
    var c = {};
    for (var k in n) c[k] = n[k];
    if (n.a) c.a = this.qualificar(n.a);
    if (n.b) c.b = this.qualificar(n.b);
    if (n.args) c.args = n.args.map(function (x) { return self.qualificar(x); });
    return c;
  };

  /* Tabela[Coluna] op constante: compara direto no vetor da coluna,
     sem interpretar a expressão a cada linha (31 mil linhas por filtro) */
  var INVERSO = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
  Modelo.prototype.predRapido = function (f) {
    if (f.k !== "bin" || !/^(=|==|<>|<|>|<=|>=)$/.test(f.op)) return null;
    var a = f.a, b = f.b, op = f.op;
    if (b.k === "col" && a.k !== "col") { a = f.b; b = f.a; op = INVERSO[op] || op; }
    if (a.k !== "col" || colunasDe(b).length || citaMedida(b, this)) return null;
    var d = this.colDeArg(a, "CALCULATE").c.dados;
    var k = this.av(b, { filtros: [], linha: null, pilha: [] });
    var memo = {};
    return function (i) {
      var v = d[i], chave = (typeof v) + ":" + v, r = memo[chave];
      if (r === undefined) r = memo[chave] = testar(op, v, k);
      return r;
    };
  };

  Modelo.prototype.fn = function (n, ctx) {
    var N = n.nome, A = n.args, self = this;
    function qtd(min, max) {
      if (max === undefined) max = min;
      if (A.length < min) throw new DaxErro("Poucos argumentos foram passados para a função " + N + ". A contagem mínima de argumentos para a função é " + min + ".");
      if (A.length > max) throw new DaxErro("Muitos argumentos foram passados para a função " + N + ". A contagem máxima de argumentos para a função é " + max + ".");
    }
    function av(i) { return self.av(A[i], ctx); }
    var v, t, k, s, r;
    switch (N) {
      case "SUM": case "AVERAGE": case "COUNT": case "COUNTA": case "COUNTBLANK": case "DISTINCTCOUNT": case "DISTINCTCOUNTNOBLANK":
        qtd(1); return this.agregar(N, A[0], ctx);
      case "MIN": case "MAX":
        if (A.length === 2) {
          var a = av(0), b = av(1);
          if (eBlank(a)) return b;
          if (eBlank(b)) return a;
          return (N === "MIN" ? comparar(a, b) <= 0 : comparar(a, b) >= 0) ? a : b;
        }
        qtd(1); return this.agregar(N, A[0], ctx);
      case "COUNTROWS":
        qtd(1); t = this.avTabela(A[0], ctx); return t.idx.length || null;
      case "SUMX": case "AVERAGEX": case "MINX": case "MAXX": case "COUNTX":
        qtd(2); t = this.avTabela(A[0], ctx);
        s = 0; k = 0; r = null;
        t.idx.forEach(function (i) {
          var x = self.av(A[1], { filtros: ctx.filtros, linha: { tabela: t.t.nome, i: i }, pilha: ctx.pilha });
          if (eBlank(x)) return;
          k++;
          if (N === "SUMX" || N === "AVERAGEX") s += paraNum(x);
          else if (N === "MINX") { if (r === null || comparar(x, r) < 0) r = x; }
          else if (N === "MAXX") { if (r === null || comparar(x, r) > 0) r = x; }
        });
        if (N === "SUMX") return k ? s : null;
        if (N === "AVERAGEX") return k ? s / k : null;
        if (N === "COUNTX") return k || null;
        return r;
      case "FILTER": case "ALL": case "REMOVEFILTERS":
        throw new DaxErro("A expressão se refere a várias colunas. Não é possível converter várias colunas em um valor escalar.");
      case "CALCULATE":
        qtd(1, 20); return this.calcular(A, ctx);
      case "DIVIDE":
        qtd(2, 3);
        var den = av(1);
        if (eBlank(den) || paraNum(den) === 0) return A[2] ? av(2) : null;
        var num = av(0);
        return eBlank(num) ? null : paraNum(num) / paraNum(den);
      case "IF":
        qtd(2, 3); return verdade(av(0)) ? av(1) : (A[2] ? av(2) : null);
      case "BLANK": qtd(0); return null;
      case "ISBLANK": qtd(1); return eBlank(av(0));
      case "TRUE": qtd(0); return true;
      case "FALSE": qtd(0); return false;
      case "AND": qtd(2); return verdade(av(0)) && verdade(av(1));
      case "OR": qtd(2); return verdade(av(0)) || verdade(av(1));
      case "NOT": qtd(1); return !verdade(av(0));
      case "ROUND": qtd(2); v = av(0); if (eBlank(v)) return null; k = Math.pow(10, paraNum(av(1))); return Math.round(paraNum(v) * k) / k;
      case "INT": qtd(1); v = av(0); return eBlank(v) ? null : Math.floor(paraNum(v));
      case "ABS": qtd(1); v = av(0); return eBlank(v) ? null : Math.abs(paraNum(v));
      case "YEAR": case "MONTH": case "DAY":
        qtd(1); v = av(0);
        if (eBlank(v)) return null;
        if (typeof v !== "number") throw new DaxErro("A função " + N + " espera uma data.");
        return N === "YEAR" ? anoDe(v) : N === "MONTH" ? mesDe(v) : diaDoMes(v);
      case "TODAY": qtd(0); return Math.floor(Date.now() / 864e5);
      case "DATEDIFF":
        qtd(3);
        var d1 = av(0), d2 = av(1), u = A[2].k === "tab" ? A[2].nome.toUpperCase() : "";
        if (eBlank(d1) || eBlank(d2)) return null;
        if (u === "DAY") return d2 - d1;
        if (u === "MONTH") return (anoDe(d2) - anoDe(d1)) * 12 + mesDe(d2) - mesDe(d1);
        if (u === "YEAR") return anoDe(d2) - anoDe(d1);
        throw new DaxErro("O terceiro argumento de DATEDIFF deve ser DAY, MONTH ou YEAR.");
      case "CONCATENATE": qtd(2); return paraTexto(av(0)) + paraTexto(av(1));
      case "UPPER": qtd(1); return paraTexto(av(0)).toUpperCase();
      case "LOWER": qtd(1); return paraTexto(av(0)).toLowerCase();
      case "LEN": qtd(1); return paraTexto(av(0)).length;
      case "LEFT": qtd(2); return paraTexto(av(0)).slice(0, paraNum(av(1)));
      case "RIGHT": qtd(2); s = paraTexto(av(0)); return s.slice(Math.max(0, s.length - paraNum(av(1))));
    }
    var dica = EXCEL_PARA_DAX[N];
    throw new DaxErro("A função '" + n.orig + "' não existe." + (dica ? " No DAX os nomes das funções são em inglês: use " + dica + "." : ""));
  };

  /* "Nome = expressão" → { nome, expr } */
  function separarFormula(texto) {
    var m = /^\s*([^=\n]*?)\s*=(?![=])([\s\S]*)$/.exec(texto);
    if (!m || !m[1].trim()) throw new DaxErro("Comece pelo nome, seguido do sinal de igual: Nome = expressão.");
    var nome = m[1].trim().replace(/^\[(.*)\]$/, "$1").trim();
    if (/[\[\]]/.test(nome)) throw new DaxErro("O nome não pode ter colchetes.");
    return { nome: nome, expr: m[2] };
  }

  Modelo.prototype.compilar = function (texto) {
    var f = separarFormula(texto);
    return { nome: f.nome, ast: parseDax(lexDax(f.expr)) };
  };

  /* cria ou altera uma medida; devolve null ou a mensagem de erro */
  Modelo.prototype.salvarMedida = function (texto, tabela, antigo) {
    var f;
    try { f = this.compilar(texto); } catch (e) { if (e instanceof DaxErro) return e.msg; throw e; }
    var existe = this.medida(f.nome);
    if (existe && existe !== antigo) return "Já existe uma medida chamada '" + existe.nome + "'. Escolha outro nome.";
    var casa = antigo ? antigo.tabela : tabela;
    if (this.col(casa, f.nome)) return "O nome '" + f.nome + "' já é usado por uma coluna da tabela '" + casa + "'. Escolha outro nome ou crie a medida em outra tabela, como a tabela Medidas.";
    var m = antigo || { formato: "auto" };
    var nomeAntigo = antigo ? antigo.nome : null;
    m.nome = f.nome; m.texto = texto.trim(); m.ast = f.ast; m.tabela = antigo ? antigo.tabela : tabela; m.erro = null;
    if (!antigo) this.medidas.push(m);
    if (f.ast.k === "fn" && /^(MIN|MAX)$/.test(f.ast.nome) && f.ast.args.length === 1 && f.ast.args[0].k === "col") {
      var cd = this.col(f.ast.args[0].tabela, f.ast.args[0].coluna);
      if (cd && cd.tipo === "data") m.formato = "data";
      else if (m.formato === "data") m.formato = "auto";
    }
    this.limpar();
    try {
      this.avMedida(m, { filtros: [], linha: null, pilha: [] });
    } catch (e) {
      if (!(e instanceof DaxErro)) throw e;
      m.erro = e.msg;
      this.limpar();
      return { aviso: e.msg, nomeAntigo: nomeAntigo, medida: m };
    }
    return { medida: m, nomeAntigo: nomeAntigo };
  };

  /* coluna calculada: a expressão roda linha a linha */
  Modelo.prototype.salvarColuna = function (texto, tabela, antiga) {
    var f, self = this;
    try { f = this.compilar(texto); } catch (e) { if (e instanceof DaxErro) return { erro: e.msg }; throw e; }
    var t = this.tabela(tabela);
    var existe = this.col(t, f.nome);
    if (existe && existe !== antiga) return { erro: "A tabela '" + t.nome + "' já tem uma coluna chamada '" + existe.nome + "'." };
    var mesma = this.medida(f.nome);
    if (mesma && mesma.tabela === t.nome) return { erro: "O nome '" + f.nome + "' já é usado por uma medida desta tabela. Escolha outro nome." };
    var dados = new Array(t.n);
    this.limpar();
    try {
      for (var i = 0; i < t.n; i++) dados[i] = self.av(f.ast, { filtros: [], linha: { tabela: t.nome, i: i }, pilha: [] });
    } catch (e) {
      if (e instanceof DaxErro) return { erro: e.msg };
      throw e;
    }
    var tipo = "decimal", amostra = dados.filter(function (x) { return !eBlank(x); })[0];
    if (typeof amostra === "string") tipo = "texto";
    else if (typeof amostra === "boolean") tipo = "logico";
    else if (dados.every(function (x) { return eBlank(x) || Math.abs(x - Math.round(x)) < 1e-9; })) tipo = "inteiro";
    var c = antiga || coluna(f.nome, tipo, dados, { calc: true });
    c.nome = f.nome; c.tipo = tipo; c.dados = dados; c.texto = texto.trim(); c.calc = true;
    if (!antiga) t.colunas.push(c);
    this.limpar();
    return { coluna: c };
  };

  /* valor de um campo de visual (medida ou coluna com agregação implícita) */
  var AGG = { soma: "SUM", contagem: "COUNTA", media: "AVERAGE", distinta: "DISTINCTCOUNT", min: "MIN", max: "MAX" };
  var AGG_NOME = { soma: "Soma de ", contagem: "Contagem de ", media: "Média de ", distinta: "Contagem de ", min: "Mínimo de ", max: "Máximo de " };
  Modelo.prototype.valorCampo = function (campo, filtros) {
    if (campo.med) {
      var m = this.medida(campo.med);
      if (!m) throw new DaxErro("A medida '" + campo.med + "' não existe mais.");
      return this.avMedida(m, { filtros: filtros, linha: null, pilha: [] });
    }
    return this.agregar(AGG[campo.agg || "soma"], { k: "col", tabela: campo.tabela, coluna: campo.col }, { filtros: filtros, linha: null, pilha: [] });
  };
  Modelo.prototype.formatoCampo = function (campo) {
    if (campo.med) { var m = this.medida(campo.med); return m ? m.formato : "auto"; }
    if (campo.fmt) return campo.fmt;
    return "auto";
  };
  function nomeCampo(campo) {
    if (campo.rotulo) return campo.rotulo;
    if (campo.med) return campo.med;
    if (campo.nivel) return campo.nivel;
    return (AGG_NOME[campo.agg] || "") + campo.col;
  }

  /* categorias de uma coluna (ou nível da hierarquia de datas) nas linhas visíveis */
  Modelo.prototype.valorDeLinha = function (campo) {
    var c = this.col(campo.tabela, campo.col);
    if (!c) throw new DaxErro("A coluna '" + campo.col + "' não existe mais.");
    var d = c.dados;
    if (campo.nivel === "Ano") return function (i) { return eBlank(d[i]) ? null : anoDe(d[i]); };
    if (campo.nivel === "Mês") return function (i) { return eBlank(d[i]) ? null : mesDe(d[i]); };
    return function (i) { return d[i]; };
  };
  function rotuloCategoria(campo, v) {
    if (eBlank(v)) return "(Em branco)";
    if (campo.nivel === "Mês") return MESES[v - 1];
    if (typeof v === "number" && !campo.nivel) {
      return Math.abs(v - Math.round(v)) < 1e-9 ? String(v) : decimal(v, 2);
    }
    return String(v);
  }
  Modelo.prototype.categorias = function (campo, filtros) {
    var t = this.tabela(campo.tabela), val = this.valorDeLinha(campo);
    var idx = this.visiveis(t, filtros), vistos = {}, lista = [];
    for (var k = 0; k < idx.length; k++) {
      var v = val(idx[k]), kk = (typeof v) + ":" + v;
      if (!vistos[kk]) { vistos[kk] = 1; lista.push(v); }
    }
    lista.sort(function (a, b) {
      if (eBlank(a)) return 1;
      if (eBlank(b)) return -1;
      return typeof a === "string" ? a.localeCompare(b, "pt-BR") : a - b;
    });
    return lista;
  };
  function filtroDeValores(modelo, campo, valores, chave) {
    var val = modelo.valorDeLinha(campo), conj = {};
    valores.forEach(function (v) { conj[(typeof v) + ":" + v] = 1; });
    return {
      tabela: modelo.tabela(campo.tabela).nome, cols: [campo.col], chave: chave + campo.col + (campo.nivel || "") + "=" + valores.join("¦"),
      pred: function (i) { var v = val(i); return conj[(typeof v) + ":" + v] === 1; }
    };
  }

  /* ======================================================
     4. VISUAIS

     Cada visual devolve HTML (ou SVG) a partir do modelo e do
     contexto de filtro. Tamanho nominal em px da tela de
     1280 × 720 do Power BI; a tela inteira escala junto.
     ====================================================== */

  var TIPOS = {
    cartao: { nome: "Cartão", pocos: [["valores", "Campos"]] },
    cartaoMulti: { nome: "Cartão de linha múltipla", pocos: [["valores", "Campos"]] },
    barras: { nome: "Gráfico de barras clusterizado", pocos: [["eixo", "Eixo Y"], ["valores", "Eixo X"]] },
    colunas: { nome: "Gráfico de colunas clusterizado", pocos: [["eixo", "Eixo X"], ["valores", "Eixo Y"]] },
    area: { nome: "Gráfico de área", pocos: [["eixo", "Eixo X"], ["valores", "Eixo Y"]] },
    rosca: { nome: "Gráfico de rosca", pocos: [["eixo", "Legenda"], ["valores", "Valores"]] },
    funil: { nome: "Funil", pocos: [["eixo", "Categoria"], ["valores", "Valores"]] },
    medidor: { nome: "Medidor", pocos: [["valores", "Valor"]] },
    segmentacao: { nome: "Segmentação de dados", pocos: [["eixo", "Campo"]] },
    tabela: { nome: "Tabela", pocos: [["eixo", "Colunas"], ["valores", "Valores"]] },
    arvore: { nome: "Árvore hierárquica", pocos: [["valores", "Analisar"], ["explicar", "Explicar por"]] },
    sparkline: { nome: "Sparkline by OKViz", pocos: [["eixo", "Axis"], ["valores", "Measure"]], personalizado: true },
    imagem: { nome: "Imagem", pocos: [] }
  };
  var GALERIA = ["cartao", "cartaoMulti", "barras", "colunas", "area", "rosca", "funil", "medidor", "segmentacao", "tabela", "arvore"];
  var ICONES = {
    cartao: '<text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700">123</text>',
    cartaoMulti: '<rect x="4" y="5" width="16" height="3"/><rect x="4" y="11" width="11" height="3"/><rect x="4" y="17" width="14" height="3"/>',
    barras: '<rect x="4" y="4" width="15" height="4"/><rect x="4" y="10" width="10" height="4"/><rect x="4" y="16" width="6" height="4"/>',
    colunas: '<rect x="4" y="12" width="4" height="8"/><rect x="10" y="6" width="4" height="14"/><rect x="16" y="9" width="4" height="11"/>',
    area: '<path d="M3 20 L3 13 L8 9 L13 12 L21 5 L21 20 Z"/>',
    rosca: '<path d="M12 3a9 9 0 1 1-9 9h4a5 5 0 1 0 5-5z"/><path d="M12 3v4a5 5 0 0 0-5 5H3a9 9 0 0 1 9-9z" opacity=".5"/>',
    funil: '<rect x="3" y="4" width="18" height="4"/><rect x="6" y="10" width="12" height="4"/><rect x="9" y="16" width="6" height="4"/>',
    medidor: '<path d="M3 17a9 9 0 0 1 18 0h-4a5 5 0 0 0-10 0z"/>',
    segmentacao: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
    tabela: '<rect x="3" y="4" width="18" height="16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M3 15h18M10 4v16" stroke="currentColor" stroke-width="1.6"/>',
    arvore: '<rect x="2" y="9" width="6" height="5"/><rect x="15" y="3" width="7" height="5"/><rect x="15" y="15" width="7" height="5"/><path d="M8 11.5h3v-6h4M11 11.5v6h4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    sparkline: '<path d="M2 16 L7 11 L11 14 L16 6 L22 9" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    imagem: '<rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 17l5-6 4 4 2-2 3 4z"/>'
  };
  function icone(tipo) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[tipo] || "") + "</svg>"; }

  var CORES = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550", "#197278"];

  function escala(max, n) {
    n = n || 4;
    if (!(max > 0)) return { passo: 1, n: n, max: n };
    var bruto = max / n, pot = Math.pow(10, Math.floor(Math.log10(bruto))), passo = pot * 10;
    [1, 2, 2.5, 5, 10].some(function (p) { if (p * pot >= bruto) { passo = p * pot; return true; } return false; });
    return { passo: passo, n: n, max: passo * n };
  }

  function placeholder(v) {
    return '<div class="pv-vazio">' + icone(v.tipo) + "<span>" + (TIPOS[v.tipo].pocos.length ? "Adicione campos em " + TIPOS[v.tipo].pocos.map(function (p) { return p[1]; }).join(" e ") : "") + "</span></div>";
  }
  function erroVisual(msg) {
    return '<div class="pv-erro"><b>Não é possível exibir o visual.</b><span>' + esc(msg) + "</span></div>";
  }

  /* pontos de uma série por categoria: [{v, rotulo, valor, sel}] */
  function serie(ctx, v, ordenarPorValor) {
    var M = ctx.modelo, cat = v.campos.eixo[0], val = v.campos.valores[0];
    var cats = M.categorias(cat, ctx.filtros);
    var pts = cats.map(function (c) {
      var f = filtroDeValores(M, cat, [c], "cat:");
      return { c: c, rotulo: rotuloCategoria(cat, c), valor: M.valorCampo(val, ctx.filtros.concat([f])) };
    }).filter(function (p) { return !eBlank(p.valor); });
    if (ordenarPorValor && !cat.nivel && !(v.ordem === "eixo")) pts.sort(function (a, b) { return paraNum(b.valor) - paraNum(a.valor); });
    var sel = ctx.selecao && ctx.selecao.vid === v.id ? ctx.selecao.valores : null;
    pts.forEach(function (p) { p.apagado = sel && sel.indexOf(p.c) === -1; });
    return pts;
  }

  var RENDER = {};

  RENDER.cartao = function (ctx, v, sim, multi) {
    var M = ctx.modelo, campos = v.campos.valores;
    if (!campos.length) return placeholder(v);
    return '<div class="' + (multi ? "pv-multi" : "pv-cartoes") + '">' + campos.map(function (c) {
      var val = M.valorCampo(c, ctx.filtros);
      var txt = formatar(val, M.formatoCampo(c), "cartao");
      return '<div class="pv-cartao' + (eBlank(val) ? " pv-cartao--branco" : "") + '"><b>' + esc(txt) + "</b>" +
        (v.fmt.semRotulo ? "" : "<span>" + esc(nomeCampo(c)) + "</span>") + "</div>";
    }).join("") + "</div>";
  };
  RENDER.cartaoMulti = function (ctx, v, sim) { return RENDER.cartao(ctx, v, sim, true); };

  RENDER.barras = function (ctx, v) {
    if (!v.campos.eixo.length || !v.campos.valores.length) return placeholder(v);
    var pts = serie(ctx, v, true), M = ctx.modelo, fmt = M.formatoCampo(v.campos.valores[0]);
    var W = v.w, H = v.h - 34, n = Math.max(pts.length, 1);
    var esq = Math.min(W * 0.38, 150), dir = 56, linha = Math.min((H - 8) / n, 34), alto = linha * 0.68;
    var max = Math.max.apply(null, pts.map(function (p) { return paraNum(p.valor); }).concat([0])) || 1;
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMinYMin meet">';
    pts.forEach(function (p, i) {
      var y = 4 + i * linha, w = Math.max((paraNum(p.valor) / max) * (W - esq - dir), 1);
      s += '<g class="pv-cat' + (p.apagado ? " pv-apagado" : "") + '" data-cat="' + esc(JSON.stringify(p.c)) + '">' +
        '<text class="pv-eixo" x="' + (esq - 8) + '" y="' + (y + alto * 0.75) + '" text-anchor="end">' + esc(cortar(p.rotulo, 22)) + "</text>" +
        '<rect x="' + esq + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + alto.toFixed(1) + '" fill="' + (v.fmt.cor || CORES[0]) + '"><title>' + esc(p.rotulo + ": " + formatar(p.valor, fmt, "celula")) + "</title></rect>" +
        (v.fmt.rotulos === false ? "" : '<text class="pv-rotulo" x="' + (esq + w + 5) + '" y="' + (y + alto * 0.75) + '">' + esc(formatar(p.valor, fmt, "rotulo")) + "</text>") + "</g>";
    });
    return s + "</svg>";
  };
  function cortar(t, n) { t = String(t); return t.length > n ? t.slice(0, n - 1) + "…" : t; }

  function eixoX(pts, W, esq, dir, y, slot) {
    var passo = Math.max(1, Math.ceil(pts.length * 62 / (W - esq - dir)));
    return pts.map(function (p, i) {
      if (i % passo) return "";
      return '<text class="pv-eixo" x="' + (esq + slot * i + slot / 2).toFixed(1) + '" y="' + y + '" text-anchor="middle">' + esc(cortar(p.rotulo, 11)) + "</text>";
    }).join("");
  }

  RENDER.colunas = function (ctx, v, sim, area) {
    if (!v.campos.eixo.length || !v.campos.valores.length) return placeholder(v);
    var pts = serie(ctx, v, !area), M = ctx.modelo, fmt = M.formatoCampo(v.campos.valores[0]);
    var W = v.w, H = v.h - 34, esq = v.fmt.eixoY === false ? 8 : 52, dir = 10, cima = 22, baixo = 26;
    var ph = H - cima - baixo, slot = (W - esq - dir) / Math.max(pts.length, 1);
    var vals = pts.map(function (p) { return paraNum(p.valor); });
    var e = escala(Math.max.apply(null, vals.concat([0])) * 1.08, 4);
    var min = v.fmt.eixoMin || 0;
    if (min >= e.max) min = 0;
    function y(val) { return cima + ph - Math.max(0, (val - min) / (e.max - min)) * ph; }
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMinYMin meet">';
    if (v.fmt.eixoY !== false) {
      for (var k = 0; k <= e.n; k++) {
        var val = min + (e.max - min) * k / e.n, yy = y(val);
        if (v.fmt.grade !== false) s += '<line class="pv-grade" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + yy + '" y2="' + yy + '"/>';
        s += '<text class="pv-eixo" x="' + (esq - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + esc(valorPbi(val, { casas: 0 })) + "</text>";
      }
    }
    var cor = v.fmt.cor || CORES[0];
    if (area) {
      var pontos = pts.map(function (p, i) { return [esq + slot * i + slot / 2, y(paraNum(p.valor))]; });
      if (pontos.length) {
        var d = "M" + pontos.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L");
        s += '<path class="pv-area" d="' + d + " L" + pontos[pontos.length - 1][0].toFixed(1) + " " + (cima + ph) + " L" + pontos[0][0].toFixed(1) + " " + (cima + ph) + ' Z" fill="' + cor + '"/>';
        s += '<path class="pv-linha" d="' + d + '" stroke="' + (v.fmt.corLinha || cor) + '"/>';
      }
      pts.forEach(function (p, i) {
        var cx = esq + slot * i + slot / 2, cy = y(paraNum(p.valor));
        s += '<g class="pv-cat' + (p.apagado ? " pv-apagado" : "") + '" data-cat="' + esc(JSON.stringify(p.c)) + '"><rect x="' + (cx - slot / 2) + '" y="' + cima + '" width="' + slot + '" height="' + ph + '" fill="transparent"><title>' + esc(p.rotulo + ": " + formatar(p.valor, fmt, "celula")) + "</title></rect>" +
          '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3.2" fill="' + (v.fmt.corLinha || cor) + '"/>' +
          (v.fmt.rotulos ? '<text class="pv-rotulo" x="' + cx.toFixed(1) + '" y="' + (cy - 9).toFixed(1) + '" text-anchor="middle">' + esc(rotuloUnidade(p.valor, fmt, v.fmt.unidades)) + "</text>" : "") + "</g>";
      });
    } else {
      var bw = Math.min(slot * 0.62, 60);
      pts.forEach(function (p, i) {
        var cx = esq + slot * i + slot / 2, top = y(paraNum(p.valor));
        s += '<g class="pv-cat' + (p.apagado ? " pv-apagado" : "") + '" data-cat="' + esc(JSON.stringify(p.c)) + '"><rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(cima + ph - top, 0.5).toFixed(1) + '" fill="' + cor + '"><title>' + esc(p.rotulo + ": " + formatar(p.valor, fmt, "celula")) + "</title></rect>" +
          (v.fmt.rotulos ? '<text class="pv-rotulo" x="' + cx.toFixed(1) + '" y="' + (top - 5).toFixed(1) + '" text-anchor="middle">' + esc(rotuloUnidade(p.valor, fmt, v.fmt.unidades)) + "</text>" : "") + "</g>";
      });
    }
    s += '<line class="pv-base" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + (cima + ph) + '" y2="' + (cima + ph) + '"/>';
    s += eixoX(pts, W, esq, dir, cima + ph + 17, slot);
    return s + "</svg>";
  };
  RENDER.area = function (ctx, v, sim) { return RENDER.colunas(ctx, v, sim, true); };
  function rotuloUnidade(val, fmt, unidades) {
    if (fmt === "pct") return formatar(val, "pct");
    if (unidades === "mil") return valorPbi(paraNum(val), { unidade: "mil", casas: 0 });
    return formatar(val, fmt, "rotulo");
  }

  RENDER.rosca = function (ctx, v) {
    if (!v.campos.eixo.length || !v.campos.valores.length) return placeholder(v);
    var pts = serie(ctx, v, true), M = ctx.modelo;
    var W = v.w, H = v.h - 34, cx = W / 2, cy = H / 2 + 4, r = Math.min(W * 0.26, H * 0.36), r2 = r * 0.6;
    var tot = pts.reduce(function (s, p) { return s + paraNum(p.valor); }, 0) || 1, a = -Math.PI / 2;
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '">';
    pts.forEach(function (p, i) {
      var frac = paraNum(p.valor) / tot, b = a + frac * Math.PI * 2, grande = frac > 0.5 ? 1 : 0;
      var cor = (v.fmt.cores && v.fmt.cores[p.c]) || CORES[i % CORES.length];
      function pt(ang, raio) { return (cx + raio * Math.cos(ang)).toFixed(1) + " " + (cy + raio * Math.sin(ang)).toFixed(1); }
      var d = frac >= 0.9999
        ? "M" + pt(-Math.PI / 2, r) + " A" + r + " " + r + " 0 1 1 " + pt(Math.PI * 1.5 - 0.001, r) + " L" + pt(Math.PI * 1.5 - 0.001, r2) + " A" + r2 + " " + r2 + " 0 1 0 " + pt(-Math.PI / 2, r2) + " Z"
        : "M" + pt(a, r) + " A" + r + " " + r + " 0 " + grande + " 1 " + pt(b, r) + " L" + pt(b, r2) + " A" + r2 + " " + r2 + " 0 " + grande + " 0 " + pt(a, r2) + " Z";
      var meio = (a + b) / 2, lx = cx + (r + 16) * Math.cos(meio), ly = cy + (r + 16) * Math.sin(meio);
      s += '<g class="pv-cat' + (p.apagado ? " pv-apagado" : "") + '" data-cat="' + esc(JSON.stringify(p.c)) + '"><path d="' + d + '" fill="' + cor + '"><title>' + esc(p.rotulo + ": " + formatar(p.valor, M.formatoCampo(v.campos.valores[0]), "celula")) + "</title></path>" +
        '<text class="pv-rotulo" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + (Math.cos(meio) >= 0 ? "start" : "end") + '">' + esc(p.rotulo + " " + decimal(frac * 100, 2) + "%") + "</text></g>";
      a = b;
    });
    return s + "</svg>";
  };

  RENDER.funil = function (ctx, v) {
    if (!v.campos.eixo.length || !v.campos.valores.length) return placeholder(v);
    var pts = serie(ctx, v, true), M = ctx.modelo, fmt = M.formatoCampo(v.campos.valores[0]);
    var W = v.w, H = v.h - 34, esq = Math.min(W * 0.32, 120), n = Math.max(pts.length, 1);
    var linha = Math.min((H - 6) / n, 40), alto = linha * 0.78, larg = W - esq - 10;
    var max = pts.length ? paraNum(pts[0].valor) || 1 : 1, centro = esq + larg / 2;
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMinYMin meet">';
    pts.forEach(function (p, i) {
      var w = Math.max(paraNum(p.valor) / max * larg, 2), y = 3 + i * linha;
      s += '<g class="pv-cat' + (p.apagado ? " pv-apagado" : "") + '" data-cat="' + esc(JSON.stringify(p.c)) + '" data-dica="1">' +
        '<text class="pv-eixo" x="' + (esq - 8) + '" y="' + (y + alto * 0.68) + '" text-anchor="end">' + esc(cortar(p.rotulo, 18)) + "</text>" +
        '<rect x="' + (centro - w / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + alto.toFixed(1) + '" fill="' + (v.fmt.cor || CORES[0]) + '"/>' +
        '<text class="pv-rotulo pv-rotulo--dentro" x="' + centro + '" y="' + (y + alto * 0.68) + '" text-anchor="middle">' + esc(formatar(p.valor, fmt, "rotulo")) + "</text></g>";
    });
    return s + "</svg>";
  };

  RENDER.medidor = function (ctx, v) {
    if (!v.campos.valores.length) return placeholder(v);
    var M = ctx.modelo, c = v.campos.valores[0], val = M.valorCampo(c, ctx.filtros), fmt = M.formatoCampo(c);
    var W = v.w, H = v.h - 34, cx = W / 2, r = Math.min(W * 0.36, H * 0.72), r2 = r * 0.62, cy = H * 0.5 + r * 0.42;
    var num = eBlank(val) || !isFinite(val) ? 0 : paraNum(val);
    var max = v.fmt.maximo === "auto" || v.fmt.maximo == null ? (num > 0 ? num * 2 : 1) : v.fmt.maximo;
    var frac = Math.max(0, Math.min(1, num / max)), ang = Math.PI * (1 - frac);
    function pt(a, raio) { return (cx + raio * Math.cos(a)).toFixed(1) + " " + (cy - raio * Math.sin(a)).toFixed(1); }
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '">';
    s += '<path class="pv-trilho" d="M' + pt(Math.PI, r) + " A" + r + " " + r + " 0 0 1 " + pt(0, r) + " L" + pt(0, r2) + " A" + r2 + " " + r2 + " 0 0 0 " + pt(Math.PI, r2) + ' Z"/>';
    if (frac > 0) s += '<path d="M' + pt(Math.PI, r) + " A" + r + " " + r + " 0 0 1 " + pt(ang, r) + " L" + pt(ang, r2) + " A" + r2 + " " + r2 + " 0 0 0 " + pt(Math.PI, r2) + ' Z" fill="' + (v.fmt.cor || CORES[0]) + '"/>';
    s += '<text class="pv-medidor-valor" x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle">' + esc(formatar(val, fmt, "cartao")) + "</text>";
    s += '<text class="pv-eixo" x="' + (cx - (r + r2) / 2) + '" y="' + (cy + 16) + '" text-anchor="middle">' + esc(formatar(0, fmt, "rotulo")) + "</text>";
    s += '<text class="pv-eixo" x="' + (cx + (r + r2) / 2) + '" y="' + (cy + 16) + '" text-anchor="middle">' + esc(formatar(max, fmt, "rotulo")) + "</text>";
    return s + "</svg>";
  };

  RENDER.segmentacao = function (ctx, v, sim) {
    if (!v.campos.eixo.length) return placeholder(v);
    var M = ctx.modelo, campo = v.campos.eixo[0];
    var todos = M.categorias(campo, []), marcados = sim.seg[v.id] || null;
    var resumo = !marcados || !marcados.length ? "Tudo" : marcados.length === 1 ? rotuloCategoria(campo, marcados[0]) : "Seleções múltiplas";
    var lista = v.fmt.estilo !== "suspensa", aberto = lista || sim.segAberta === v.id;
    var s = lista ? '<div class="pv-seg pv-seg--lista">'
      : '<div class="pv-seg"><button type="button" class="pv-seg-botao" data-acao="seg-abrir" data-v="' + v.id + '"><span>' + esc(resumo) + '</span><i></i></button>';
    if (aberto) {
      s += '<div class="pv-seg-lista"><label data-acao="seg-tudo" data-v="' + v.id + '"><i class="caixa' + (!marcados ? " caixa--marcada" : "") + '"></i>Selecionar tudo</label>' +
        todos.map(function (c) {
          var on = marcados && marcados.indexOf(c) !== -1;
          return '<label data-acao="seg-item" data-v="' + v.id + '" data-cat="' + esc(JSON.stringify(c)) + '"><i class="caixa' + (on ? " caixa--marcada" : "") + '"></i>' + esc(rotuloCategoria(campo, c)) + "</label>";
        }).join("") + "</div>";
    }
    return s + "</div>";
  };

  RENDER.tabela = function (ctx, v) {
    var M = ctx.modelo, cats = v.campos.eixo, vals = v.campos.valores;
    if (!cats.length && !vals.length) return placeholder(v);
    var linhas = [];
    if (cats.length) {
      var lista = M.categorias(cats[0], ctx.filtros);
      lista.forEach(function (c) {
        var f = ctx.filtros.concat([filtroDeValores(M, cats[0], [c], "tab:")]);
        linhas.push([rotuloCategoria(cats[0], c)].concat(vals.map(function (x) { return formatar(M.valorCampo(x, f), M.formatoCampo(x), "celula"); })));
      });
    }
    var total = ["Total"].concat(vals.map(function (x) { return formatar(M.valorCampo(x, ctx.filtros), M.formatoCampo(x), "celula"); }));
    var cab = (cats.length ? [nomeCampo(cats[0])] : []).concat(vals.map(nomeCampo));
    return '<div class="pv-tabela"><table><thead><tr>' + cab.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      linhas.map(function (l) { return "<tr>" + l.map(function (x, i) { return "<td" + (i ? ' class="num"' : "") + ">" + esc(x) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody>" + (vals.length ? '<tfoot><tr>' + (cats.length ? "" : "") + total.slice(cats.length ? 0 : 1).map(function (x, i) { return "<td" + (i || !cats.length ? ' class="num"' : "") + ">" + esc(x) + "</td>"; }).join("") + "</tr></tfoot>" : "") + "</table></div>";
  };

  RENDER.sparkline = function (ctx, v) {
    if (!v.campos.eixo.length || !v.campos.valores.length) return placeholder(v);
    var pts = serie(ctx, v, false), W = v.w, H = v.h - 34;
    if (pts.length < 2) return '<div class="pv-vazio"><span>Poucos pontos para desenhar a linha.</span></div>';
    var vals = pts.map(function (p) { return paraNum(p.valor); }), max = Math.max.apply(null, vals), min = 0;
    var x = function (i) { return 8 + i * (W - 16) / (pts.length - 1); }, y = function (val) { return 6 + (1 - (val - min) / ((max - min) || 1)) * (H - 22); };
    var d = "M" + pts.map(function (p, i) { return x(i).toFixed(1) + " " + y(vals[i]).toFixed(1); }).join(" L");
    var cor = v.fmt.cor || CORES[0];
    return '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '"><path d="' + d + " L" + x(pts.length - 1).toFixed(1) + " " + (H - 16) + " L8 " + (H - 16) + ' Z" fill="' + cor + '" opacity=".28"/>' +
      '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="2.4"/>' +
      pts.map(function (p, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(vals[i]).toFixed(1) + '" r="5" fill="transparent"><title>' + esc(p.rotulo + ": " + formatar(p.valor, "auto", "celula")) + "</title></circle>"; }).join("") +
      '<text class="pv-eixo" x="8" y="' + (H - 3) + '">' + esc(pts[0].rotulo) + '</text><text class="pv-eixo" x="' + (W - 8) + '" y="' + (H - 3) + '" text-anchor="end">' + esc(pts[pts.length - 1].rotulo) + "</text></svg>";
  };

  /* árvore hierárquica: clique num nó para abrir o próximo nível */
  RENDER.arvore = function (ctx, v, sim) {
    var M = ctx.modelo, val = v.campos.valores[0], niveis = v.campos.explicar;
    if (!val) return placeholder(v);
    var fmt = M.formatoCampo(val), caminho = sim.arvore[v.id] || [];
    var cols = [], filtros = ctx.filtros;
    var raiz = M.valorCampo(val, filtros);
    cols.push('<div class="pv-arv-col"><p class="pv-arv-titulo">' + esc(nomeCampo(val)) + '</p><button type="button" class="pv-arv-no pv-arv-no--raiz' + (caminho.length || niveis.length ? " aberto" : "") + '" data-acao="arvore" data-v="' + v.id + '" data-nivel="-1"><span>' + esc(nomeCampo(val)) + "</span><b>" + esc(formatar(raiz, fmt, "celula")) + '</b><i style="width:100%"></i></button></div>');
    for (var n = 0; n < niveis.length; n++) {
      if (n > caminho.length) break;
      var campo = niveis[n], cats = M.categorias(campo, filtros);
      var nos = cats.map(function (c) {
        return { c: c, valor: M.valorCampo(val, filtros.concat([filtroDeValores(M, campo, [c], "arv:")])) };
      }).filter(function (x) { return !eBlank(x.valor); }).sort(function (a, b) { return paraNum(b.valor) - paraNum(a.valor); });
      var max = nos.length ? paraNum(nos[0].valor) : 1;
      cols.push('<div class="pv-arv-col"><p class="pv-arv-titulo">' + esc(nomeCampo(campo)) + "</p>" + nos.slice(0, 8).map(function (x) {
        var on = caminho[n] !== undefined && caminho[n] === x.c;
        return '<button type="button" class="pv-arv-no' + (on ? " aberto" : "") + '" data-acao="arvore" data-v="' + v.id + '" data-nivel="' + n + '" data-cat="' + esc(JSON.stringify(x.c)) + '"><span>' + esc(rotuloCategoria(campo, x.c)) + "</span><b>" + esc(formatar(x.valor, fmt, "celula")) + '</b><i style="width:' + (paraNum(x.valor) / max * 100).toFixed(1) + '%"></i></button>';
      }).join("") + "</div>");
      if (caminho[n] === undefined) break;
      filtros = filtros.concat([filtroDeValores(M, campo, [caminho[n]], "arv:")]);
    }
    return '<div class="pv-arvore">' + cols.join("") + "</div>";
  };

  RENDER.imagem = function (ctx, v) {
    return '<img class="pv-imagem" src="' + esc(v.fmt.src) + '" alt="' + esc(v.fmt.alt || "") + '">';
  };

  function tituloPadrao(v) {
    var c = v.campos, nomes = function (l) { return l.map(nomeCampo).join(" e "); };
    if (v.tipo === "cartao" || v.tipo === "cartaoMulti" || v.tipo === "imagem" || v.tipo === "segmentacao") {
      return v.tipo === "segmentacao" && c.eixo.length ? nomeCampo(c.eixo[0]) : "";
    }
    if (v.tipo === "medidor") return c.valores.length ? nomes(c.valores) : "";
    if (v.tipo === "arvore") return c.valores.length ? nomes(c.valores) + (c.explicar.length ? " por " + nomes(c.explicar) : "") : "";
    if (c.valores.length && c.eixo.length) return nomes(c.valores) + " por " + nomes(c.eixo);
    return c.valores.length ? nomes(c.valores) : c.eixo.length ? nomes(c.eixo) : "";
  }

  function renderVisual(sim, v, filtros, emDica) {
    var corpo, ctx = { modelo: sim.modelo, filtros: filtros, selecao: emDica ? null : sim.selecao };
    try {
      corpo = RENDER[v.tipo](ctx, v, sim);
    } catch (e) {
      if (!(e instanceof DaxErro)) throw e;
      corpo = erroVisual(e.msg);
    }
    var titulo = v.fmt.titulo === false ? "" : v.fmt.titulo || tituloPadrao(v);
    return (titulo ? '<p class="pv-titulo">' + esc(titulo) + "</p>" : "") + '<div class="pv-corpo">' + corpo + "</div>";
  }

  /* ======================================================
     5. SIMULADOR
     ====================================================== */

  var SIMS = {};          /* configuração de cada laboratório (seção 6) */
  var INSTANCIAS = [];

  function novoModelo(cfg) {
    var M = new Modelo();
    if (cfg.base === "producao") M.addTabela(tabelaProducao());
    else M.addTabela(tabelaRh(!!cfg.cidade));
    if (cfg.tabelaMedidas) M.addTabela({ nome: "Medidas", n: 0, colunas: [] }, { soMedidas: true });
    (cfg.colunas || []).forEach(function (c) {
      var r = M.salvarColuna(c.texto, M.tabelas[0].nome);
      if (r.erro) throw new Error("coluna pronta com erro: " + r.erro);
    });
    (cfg.medidas || []).forEach(function (m) {
      var r = M.salvarMedida(m.texto, m.tabela || (cfg.tabelaMedidas ? "Medidas" : M.tabelas[0].nome));
      if (typeof r === "string" || r.aviso) throw new Error("medida pronta com erro: " + m.texto + " — " + (r.aviso || r));
      if (m.formato) r.medida.formato = m.formato;
    });
    return M;
  }

  function copiarVisual(v, i) {
    return {
      id: v.id || "v" + i, tipo: v.tipo, x: v.x || 0, y: v.y || 0, w: v.w || 420, h: v.h || 260,
      campos: {
        valores: (v.valores || []).slice(), eixo: (v.eixo || []).slice(), explicar: (v.explicar || []).slice()
      },
      fmt: JSON.parse(JSON.stringify(v.fmt || {})), dica: v.dica || null, travado: !!v.travado
    };
  }

  function Simulador(raiz, cfg) {
    this.raiz = raiz;
    this.cfg = cfg;
    this.iniciar();
    this.montar();
    this.render();
  }

  Simulador.prototype.iniciar = function () {
    var cfg = this.cfg;
    this.modelo = novoModelo(cfg);
    this.visuais = (cfg.visuais || []).map(copiarVisual);
    this.sel = cfg.selecionado || null;
    this.campoSel = null;
    this.edicao = null;
    this.erro = null;
    this.aviso = null;
    this.seg = {};
    this.segAberta = null;
    this.selecao = null;
    this.arvore = {};
    this.vista = cfg.vista || "relatorio";
    this.tabelaSel = cfg.tabelaMedidas ? "Medidas" : this.modelo.tabelas[0].nome;
    this.paineis = cfg.paineis !== false;
    this.feitas = {};
    this.importados = cfg.importados ? cfg.importados.slice() : [];
    this.menuVisuais = false;
  };

  Simulador.prototype.montar = function () {
    var cfg = this.cfg, self = this;
    this.raiz.innerHTML =
      '<div class="app pbi-app sim-janela' + (cfg.escuro ? " sim--escuro" : "") + '">' +
        '<div class="app-titulo"><b>' + esc(cfg.arquivo || "Aula 2") + ' - Power BI Desktop</b><span class="sim-aviso" data-r="aviso" role="status"></span><span class="app-botoes">— ▢ ✕</span></div>' +
        '<div data-r="faixa"></div>' +
        '<div class="sim-fx" data-r="fx" hidden>' +
          '<button type="button" class="sim-fx-btn" data-acao="fx-cancelar" title="Cancelar (Esc)">✕</button>' +
          '<button type="button" class="sim-fx-btn" data-acao="fx-confirmar" title="Confirmar (Enter)">✓</button>' +
          '<div class="sim-fx-caixa"><ol class="sim-fx-linhas" data-r="linhas" aria-hidden="true"></ol>' +
          '<textarea spellcheck="false" autocomplete="off" aria-label="Barra de fórmulas" data-r="texto"></textarea></div>' +
        "</div>" +
        '<div class="sim-erro" data-r="erro" hidden></div>' +
        '<div class="sim-corpo">' +
          (cfg.vistaTabela ? '<nav class="pbi-trilho" data-r="trilho"></nav>' : "") +
          '<div class="sim-area" data-r="area"></div>' +
          '<div class="sim-paineis" data-r="paineis"></div>' +
        "</div>" +
      "</div>" +
      (cfg.tarefas ? '<div class="sim-tarefas" data-r="tarefas"></div>' : "") +
      '<div class="sim-dica-flutuante" data-r="dica" hidden></div>';
    this.el = {};
    this.raiz.querySelectorAll("[data-r]").forEach(function (e) { self.el[e.getAttribute("data-r")] = e; });

    var tx = this.el.texto;
    tx.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); self.confirmar(); }
      else if (ev.key === "Escape") { ev.preventDefault(); self.cancelar(); }
    });
    tx.addEventListener("input", function () { self.linhas(); if (self.edicao) self.edicao.texto = tx.value; });
    this.raiz.addEventListener("click", function (ev) { self.clique(ev); });
    this.raiz.addEventListener("change", function (ev) { self.mudanca(ev); });
    this.raiz.addEventListener("mousemove", function (ev) { self.passarMouse(ev); });
    this.raiz.addEventListener("mouseleave", function () { self.el.dica.hidden = true; });
    if (window.ResizeObserver) new ResizeObserver(function () { self.ajustarEscala(); }).observe(this.raiz);
  };

  Simulador.prototype.linhas = function () {
    var n = this.el.texto.value.split("\n").length, s = "";
    for (var i = 1; i <= n; i++) s += "<li>" + i + "</li>";
    this.el.linhas.innerHTML = s;
    this.el.texto.rows = Math.min(Math.max(n, 1), 6);
  };

  /* ---------- faixa de opções ---------- */
  Simulador.prototype.renderFaixa = function () {
    var cfg = this.cfg, m = this.campoSel && this.campoSel.med ? this.modelo.medida(this.campoSel.med) : null;
    var guias = '<div class="app-guias"><span>Arquivo</span><span class="' + (m ? "" : "ativa") + '">Página Inicial</span><span>Inserir</span><span>Modelagem</span><span>Exibição</span>' +
      (m ? '<span class="ativa sim-guia-contexto">Ferramentas de medida</span>' : "") + "</div>";
    var grupos = [];
    if (m) {
      grupos.push('<div class="app-grupo"><div><span class="sim-campo-faixa">Nome <b>' + esc(m.nome) + "</b></span></div><small>Estrutura</small></div>");
      grupos.push('<div class="app-grupo"><div><label class="sim-campo-faixa">Tabela inicial <select data-acao-mudar="tabela-inicial">' +
        this.modelo.tabelas.map(function (t) { return "<option" + (t.nome === m.tabela ? " selected" : "") + ">" + esc(t.nome) + "</option>"; }).join("") + "</select></label></div><small>Estrutura</small></div>");
      grupos.push('<div class="app-grupo"><div><label class="sim-campo-faixa">Formato <select data-acao-mudar="formato">' +
        [["auto", "Geral"], ["inteiro", "Número inteiro"], ["decimal", "Número decimal"], ["pct", "Porcentagem"], ["moeda", "Moeda"], ["data", "Data"]].map(function (o) {
          return '<option value="' + o[0] + '"' + (m.formato === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
        }).join("") + '</select></label><button type="button" class="app-btn sim-btn-pct" data-acao="pct" title="Porcentagem">%</button></div><small>Formatação</small></div>');
      grupos.push('<div class="app-grupo"><div><button type="button" class="app-btn" data-acao="nova-medida">Nova medida</button></div><small>Cálculos</small></div>');
    } else {
      grupos.push('<div class="app-grupo"><div><span class="app-btn">Obter dados</span>' +
        (cfg.inserirDados ? '<button type="button" class="app-btn" data-acao="inserir-dados">Inserir dados</button>' : "") + "</div><small>Dados</small></div>");
      grupos.push('<div class="app-grupo"><div><button type="button" class="app-btn" data-acao="nova-medida">Nova medida</button>' +
        (cfg.novaColuna ? '<button type="button" class="app-btn" data-acao="nova-coluna">Nova coluna</button>' : "") + "</div><small>Cálculos</small></div>");
    }
    var direita = '<div class="app-grupo sim-grupo-direita"><div><button type="button" class="app-btn" data-acao="paineis">' + (this.paineis ? "Ocultar painéis" : "Mostrar painéis") + '</button><button type="button" class="app-btn" data-acao="redefinir" title="Volta ao começo do laboratório">Redefinir</button></div><small>Simulador</small></div>';
    this.el.faixa.innerHTML = guias + '<div class="app-faixa">' + grupos.join("") + direita + "</div>";
  };

  /* ---------- barra de fórmulas e mensagens ---------- */
  Simulador.prototype.renderFx = function () {
    var e = this.edicao;
    this.el.fx.hidden = !e;
    if (e && this.el.texto.value !== e.texto) { this.el.texto.value = e.texto; }
    this.linhas();
    this.el.erro.hidden = !this.erro;
    this.el.erro.className = "sim-erro" + (this.erro && this.erro.tipo === "aviso" ? " sim-erro--aviso" : "");
    this.el.erro.innerHTML = this.erro ? "<b>" + (this.erro.tipo === "aviso" ? "Medida salva, mas com erro" : "Não foi possível salvar") + "</b>" + esc(this.erro.msg) : "";
    this.el.aviso.textContent = this.aviso || "";
  };

  /* ---------- painéis Visualizações e Dados ---------- */
  Simulador.prototype.renderPaineis = function () {
    var self = this, M = this.modelo, v = this.visual(this.sel);
    this.raiz.querySelector(".sim-janela").classList.toggle("sim--leitura", !this.paineis);
    if (!this.paineis) { this.el.paineis.innerHTML = ""; this.el.paineis.hidden = true; return; }
    this.el.paineis.hidden = false;
    var tipos = GALERIA.concat(this.importados);
    var viz = '<div class="sim-painel sim-viz"><b>Visualizações</b><small>Construir visual</small><div class="sim-galeria">' +
      tipos.map(function (t) {
        return '<button type="button" class="sim-tipo' + (v && v.tipo === t ? " ativo" : "") + (TIPOS[t].personalizado ? " sim-tipo--perso" : "") + '" data-acao="tipo" data-tipo="' + t + '" title="' + esc(TIPOS[t].nome) + '">' + icone(t) + "</button>";
      }).join("") +
      (this.cfg.importavel ? '<button type="button" class="sim-tipo sim-tipo--mais' + (this.menuVisuais ? " ativo" : "") + '" data-acao="mais-visuais" title="Obter mais visuais">···</button>' : "") + "</div>";
    if (this.menuVisuais) {
      viz += '<div class="sim-appsource"><p><b>Obter mais visuais</b><small>Visuais do AppSource</small></p><span class="sim-busca">sparkline</span>' +
        this.cfg.importavel.map(function (t) {
          var ja = self.importados.indexOf(t) !== -1;
          return '<div class="sim-appsource-item">' + icone(t) + "<span><b>" + esc(TIPOS[t].nome) + "</b><small>OKViz · SQLBI</small></span>" +
            (ja ? "<em>adicionado</em>" : '<button type="button" class="app-btn app-btn--primario" data-acao="importar" data-tipo="' + t + '">Adicionar</button>') + "</div>";
        }).join("") + "</div>";
    }
    if (v && TIPOS[v.tipo].pocos.length) {
      viz += '<p class="sim-viz-nome">' + esc(TIPOS[v.tipo].nome) + "</p>" + TIPOS[v.tipo].pocos.map(function (p) {
        var lista = v.campos[p[0]] || [];
        return '<div class="sim-poco"><small>' + esc(p[1]) + "</small>" + (lista.length ? lista.map(function (c, i) {
          return '<span class="sim-chip">' + esc(nomeCampo(c)) + (v.travado ? "" : '<button type="button" data-acao="tirar" data-poco="' + p[0] + '" data-i="' + i + '" title="Remover campo">✕</button>') + "</span>";
        }).join("") : '<span class="sim-chip sim-chip--vazio">Adicionar campos de dados aqui</span>') + "</div>";
      }).join("");
    } else if (!v) {
      viz += '<p class="sim-viz-nome sim-viz-nome--nada">Clique num visual da tela para ver os campos dele.</p>';
    }
    viz += "</div>";
    if (this.vista === "tabela") viz = "";   /* na Exibição de tabela, só o painel Dados */

    var usados = {};
    if (v) ["valores", "eixo", "explicar"].forEach(function (p) {
      v.campos[p].forEach(function (c) { usados[c.med ? "m:" + c.med : "c:" + c.tabela + ":" + c.col + ":" + (c.nivel || "")] = 1; });
    });
    var dados = '<div class="sim-painel sim-dados"><b>Dados</b>' + M.tabelas.map(function (t) {
      var itens = [];
      t.colunas.forEach(function (c) {
        var chave = "c:" + t.nome + ":" + c.nome + ":";
        if (c.tipo === "data") {
          itens.push({ nome: c.nome, html: '<span class="sim-campo sim-campo--data"><i class="ico-cal"></i>' + esc(c.nome) + "</span>" +
            ["Ano", "Mês"].map(function (nv) {
              var k2 = "c:" + t.nome + ":" + c.nome + ":" + nv;
              return '<label class="sim-campo sim-campo--nivel"><input type="checkbox" data-acao-mudar="campo" data-tabela="' + esc(t.nome) + '" data-col="' + esc(c.nome) + '" data-nivel="' + nv + '"' + (usados[k2] ? " checked" : "") + "> " + nv + "</label>";
            }).join("") });
          return;
        }
        var ico = c.calc ? '<i class="ico-colcalc">fx</i>' : (c.tipo === "inteiro" || c.tipo === "decimal") ? '<i class="ico-soma">Σ</i>' : '<i class="ico-vazio"></i>';
        itens.push({ nome: c.nome, html: '<label class="sim-campo"><input type="checkbox" data-acao-mudar="campo" data-tabela="' + esc(t.nome) + '" data-col="' + esc(c.nome) + '"' + (usados[chave] ? " checked" : "") + ">" + ico +
          '<span data-acao="sel-coluna" data-tabela="' + esc(t.nome) + '" data-col="' + esc(c.nome) + '"' + (self.campoSel && self.campoSel.col === c.nome && self.campoSel.tabela === t.nome ? ' class="sel"' : "") + ">" + esc(c.nome) + (c.pq ? " <em>(Power Query)</em>" : "") + "</span></label>" });
      });
      M.medidas.filter(function (m) { return m.tabela === t.nome; }).forEach(function (m) {
        itens.push({ nome: m.nome, html: '<label class="sim-campo"><input type="checkbox" data-acao-mudar="campo" data-med="' + esc(m.nome) + '"' + (usados["m:" + m.nome] ? " checked" : "") + ">" +
          '<i class="ico-medida' + (m.erro ? " ico-medida--erro" : "") + '"></i><span data-acao="sel-medida" data-med="' + esc(m.nome) + '"' + (self.campoSel && self.campoSel.med === m.nome ? ' class="sel"' : "") + ">" + esc(m.nome) + "</span></label>" });
      });
      itens.sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
      return '<div class="sim-tabela-dados"><button type="button" class="sim-tabela-nome' + (self.tabelaSel === t.nome ? " sel" : "") + '" data-acao="sel-tabela" data-tabela="' + esc(t.nome) + '">' +
        (t.soMedidas ? '<i class="ico-medida"></i>' : '<i class="ico-tabela"></i>') + esc(t.nome) + "</button>" +
        (itens.length ? itens.map(function (x) { return x.html; }).join("") : '<small class="sim-vazio">sem campos</small>') + "</div>";
    }).join("") + "</div>";
    this.el.paineis.innerHTML = viz + dados;
  };

  /* ---------- tela do relatório ---------- */
  Simulador.prototype.filtrosDe = function (v) {
    var self = this, M = this.modelo, fs = [];
    this.visuais.forEach(function (o) {
      if (o.tipo === "segmentacao" && self.seg[o.id] && self.seg[o.id].length && o.campos.eixo.length && o !== v) {
        fs.push(filtroDeValores(M, o.campos.eixo[0], self.seg[o.id], "seg:"));
      }
    });
    if (this.selecao && v && this.selecao.vid !== v.id && v.tipo !== "segmentacao") {
      fs.push(filtroDeValores(M, this.selecao.campo, this.selecao.valores, "sel:"));
    }
    return fs;
  };

  Simulador.prototype.renderTela = function () {
    var self = this, cfg = this.cfg;
    if (this.vista === "tabela") { this.renderVistaTabela(); return; }
    var canvas = cfg.layout === "tela";
    var html = '<div class="sim-tela' + (canvas ? " sim-tela--livre" : " sim-tela--grade") + '" data-acao="tela"' +
      (cfg.fundo ? ' style="background-image:url(' + esc(cfg.fundo) + ')"' : "") + ">";
    this.visuais.forEach(function (v) {
      var estilo = canvas
        ? "left:" + (v.x / 12.8).toFixed(3) + "%;top:" + (v.y / 7.2).toFixed(3) + "%;width:" + (v.w / 12.8).toFixed(3) + "%;height:" + (v.h / 7.2).toFixed(3) + "%"
        : "flex-basis:" + v.w + "px;max-width:" + Math.round(v.w * 1.6) + "px;height:" + v.h + "px";
      html += '<div class="pv pv--' + v.tipo + (self.sel === v.id ? " pv--sel" : "") + '" data-v="' + v.id + '" style="' + estilo + '">' + renderVisual(self, v, self.filtrosDe(v)) + "</div>";
    });
    this.el.area.innerHTML = html + "</div>";
    this.ajustarEscala();
  };

  Simulador.prototype.ajustarEscala = function () {
    var tela = this.el.area.querySelector(".sim-tela--livre");
    if (tela) tela.style.setProperty("--e", (tela.getBoundingClientRect().width / 1280).toFixed(4));
  };

  /* ---------- exibição de tabela ---------- */
  Simulador.prototype.renderVistaTabela = function () {
    var M = this.modelo, t = M.tabela(this.tabelaSel);
    if (!t || t.soMedidas || !t.colunas.length) t = M.tabelas[0];
    var max = Math.min(t.n, 14), cols = t.colunas;
    var html = '<div class="sim-vista-tabela"><p class="pbi-vista-nome">Exibição de tabela · ' + esc(t.nome) + "</p><div class=\"tabela-modelo\"><table><thead><tr>" +
      cols.map(function (c) { return "<th" + (c.calc ? ' class="calc"' : "") + ">" + esc(c.nome) + "</th>"; }).join("") + "</tr></thead><tbody>";
    for (var i = 0; i < max; i++) {
      html += "<tr>" + cols.map(function (c) {
        var v = c.dados[i], num = typeof v === "number" && c.tipo !== "data";
        return "<td" + (num ? ' class="num"' : "") + (c.calc ? ' data-calc="1"' : "") + ">" + esc(c.tipo === "data" ? (eBlank(v) ? "" : dataTexto(v)) : formatar(v, "auto", "celula")) + "</td>";
      }).join("") + "</tr>";
    }
    html += '</tbody></table></div><p class="nota-demo">Tabela: ' + esc(t.nome) + " · " + t.n.toLocaleString("pt-BR") + " linhas · mostrando as " + max + " primeiras" +
      (t.nome === "BaseProdução" ? " · Hora Inicio, Data Fim e Hora Fim não entram na simulação" : "") + "</p></div>";
    this.el.area.innerHTML = html;
  };

  Simulador.prototype.renderTrilho = function () {
    if (!this.el.trilho) return;
    var v = this.vista;
    this.el.trilho.innerHTML =
      '<button type="button" class="pbi-ico' + (v === "relatorio" ? " ativo" : "") + '" data-acao="vista" data-vista="relatorio" title="Exibição de relatório"><svg viewBox="0 0 24 24"><rect x="4" y="12" width="3.4" height="8"/><rect x="10.3" y="7" width="3.4" height="13"/><rect x="16.6" y="3" width="3.4" height="17"/></svg></button>' +
      '<button type="button" class="pbi-ico' + (v === "tabela" ? " ativo" : "") + '" data-acao="vista" data-vista="tabela" title="Exibição de tabela"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M3 15h18M9.5 4v16M15 4v16" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>';
  };

  /* ---------- tarefas ---------- */
  Simulador.prototype.renderTarefas = function () {
    if (!this.el.tarefas) return;
    var self = this, total = 0, feitas = 0;
    var itens = this.cfg.tarefas.map(function (t, i) {
      var ok = false;
      try { ok = !!t.teste(self); } catch (e) { ok = false; }
      if (ok) self.feitas[i] = true;
      ok = ok || !!self.feitas[i];
      total++; if (ok) feitas++;
      return '<li class="' + (ok ? "feita" : "") + '"><span class="sim-check" aria-hidden="true"></span><div><p>' + t.texto + "</p>" +
        (t.formula ? '<code class="sim-formula">' + esc(t.formula) + '</code><button type="button" class="sim-usar" data-acao="usar" data-i="' + i + '">escrever na barra de fórmulas</button>' : "") + "</div></li>";
    });
    this.el.tarefas.innerHTML = '<p class="sim-tarefas-titulo">Tarefas deste laboratório <span>' + feitas + " de " + total + "</span></p><ol>" + itens.join("") + "</ol>";
  };

  Simulador.prototype.render = function () {
    this.renderFaixa();
    this.renderFx();
    this.renderTrilho();
    this.renderTela();
    this.renderPaineis();
    this.renderTarefas();
  };

  Simulador.prototype.visual = function (id) {
    for (var i = 0; i < this.visuais.length; i++) if (this.visuais[i].id === id) return this.visuais[i];
    return null;
  };

  /* ---------- ações ---------- */
  Simulador.prototype.avisar = function (msg) {
    var self = this;
    this.aviso = msg;
    this.el.aviso.textContent = msg;
    clearTimeout(this.tAviso);
    this.tAviso = setTimeout(function () { self.aviso = null; self.el.aviso.textContent = ""; }, 4500);
  };

  Simulador.prototype.abrirEdicao = function (tipo, texto, alvo) {
    var tabela = this.tabelaSel;
    if (tipo === "coluna") {
      var t = this.modelo.tabela(tabela);
      if (!t || t.soMedidas) tabela = this.modelo.tabelas[0].nome;
    }
    this.edicao = { tipo: tipo, texto: texto, alvo: alvo || null, tabela: alvo && alvo.tabela ? alvo.tabela : tabela };
    this.erro = null;
    this.renderFx();
    var tx = this.el.texto;
    tx.focus();
    var fim = texto.indexOf(" = ");
    if (!alvo && fim > 0 && /^(Medida|Coluna) = $/.test(texto)) tx.setSelectionRange(0, fim);
    else tx.setSelectionRange(texto.length, texto.length);
  };

  Simulador.prototype.confirmar = function () {
    var e = this.edicao, M = this.modelo;
    if (!e) return;
    e.texto = this.el.texto.value;
    if (e.tipo === "coluna") {
      var rc = M.salvarColuna(e.texto, e.tabela, e.alvo && e.alvo.coluna);
      if (rc.erro) { this.erro = { tipo: "erro", msg: rc.erro }; this.renderFx(); return; }
      this.edicao = null; this.erro = null;
      this.campoSel = { tabela: e.tabela, col: rc.coluna.nome };
      this.avisar("Coluna " + rc.coluna.nome + " criada em " + e.tabela + ".");
      this.render();
      return;
    }
    var r = M.salvarMedida(e.texto, e.tabela, e.alvo && e.alvo.medida);
    if (typeof r === "string") { this.erro = { tipo: "erro", msg: r }; this.renderFx(); return; }
    if (r.nomeAntigo && r.nomeAntigo !== r.medida.nome) this.renomearCampo(r.nomeAntigo, r.medida.nome);
    this.campoSel = { med: r.medida.nome };
    this.selecao = null;
    if (r.aviso) {
      this.edicao = { tipo: "medida", texto: r.medida.texto, alvo: { medida: r.medida }, tabela: r.medida.tabela };
      this.erro = { tipo: "aviso", msg: r.aviso };
    } else {
      this.edicao = { tipo: "medida", texto: r.medida.texto, alvo: { medida: r.medida }, tabela: r.medida.tabela };
      this.erro = null;
      this.avisar("Medida " + r.medida.nome + " salva em " + r.medida.tabela + ".");
    }
    this.render();
  };

  Simulador.prototype.cancelar = function () {
    this.edicao = null;
    this.erro = null;
    this.render();
  };

  Simulador.prototype.renomearCampo = function (de, para) {
    this.visuais.forEach(function (v) {
      ["valores", "eixo", "explicar"].forEach(function (p) { v.campos[p].forEach(function (c) { if (c.med === de) c.med = para; }); });
    });
  };

  Simulador.prototype.alternarCampo = function (alvo) {
    var v = this.visual(this.sel);
    if (!v) { this.avisar("Selecione um visual na tela antes de marcar um campo."); this.renderPaineis(); return; }
    if (v.travado || !TIPOS[v.tipo].pocos.length) { this.avisar("Este visual não recebe campos."); this.renderPaineis(); return; }
    var M = this.modelo, campo;
    if (alvo.med) campo = { med: alvo.med };
    else {
      var c = M.col(alvo.tabela, alvo.col);
      campo = { tabela: alvo.tabela, col: c.nome };
      if (alvo.nivel) campo.nivel = alvo.nivel;
    }
    var mesmo = function (x) { return campo.med ? x.med === campo.med : x.tabela === campo.tabela && x.col === campo.col && (x.nivel || "") === (campo.nivel || ""); };
    var achou = false;
    ["valores", "eixo", "explicar"].forEach(function (p) {
      var i = v.campos[p].findIndex ? v.campos[p].findIndex(mesmo) : -1;
      if (i !== -1) { v.campos[p].splice(i, 1); achou = true; }
    });
    if (!achou) {
      var numerico = campo.med || (!campo.nivel && /inteiro|decimal/.test(M.col(campo.tabela, campo.col).tipo));
      var pocos = TIPOS[v.tipo].pocos.map(function (p) { return p[0]; });
      /* ano, número de ordem e ID são números que se usam como categoria */
      if (!campo.med && numerico && pocos.indexOf("eixo") !== -1 && /^(ano|id|numero|número)\b/i.test(campo.col)) numerico = false;
      var destino;
      if (v.tipo === "segmentacao") destino = "eixo";
      else if (v.tipo === "tabela") destino = numerico ? "valores" : "eixo";
      else if (v.tipo === "arvore") destino = campo.med || numerico ? "valores" : "explicar";
      else if (numerico && pocos.indexOf("valores") !== -1) destino = "valores";
      else if (pocos.indexOf("eixo") !== -1) destino = "eixo";
      else destino = "valores";
      if (!campo.med && destino === "valores" && !numerico) campo.agg = "contagem";
      if (!campo.med && destino === "valores" && numerico) campo.agg = "soma";
      var um = (destino === "eixo" && v.tipo !== "tabela") || (destino === "valores" && /medidor|barras|colunas|area|rosca|funil|sparkline|arvore/.test(v.tipo));
      if (um) v.campos[destino] = [campo]; else v.campos[destino].push(campo);
      if (v.tipo === "segmentacao") delete this.seg[v.id];
    }
    this.selecao = null;
    delete this.arvore[v.id];
    this.render();
  };

  Simulador.prototype.trocarTipo = function (tipo) {
    var v = this.visual(this.sel);
    if (!v) {
      if (this.cfg.layout === "tela") { this.avisar("Selecione um visual da tela para trocar o tipo."); return; }
      v = copiarVisual({ id: "n" + Date.now(), tipo: tipo, w: 400, h: 250 }, this.visuais.length);
      this.visuais.push(v);
      this.sel = v.id;
      this.render();
      return;
    }
    if (v.travado) { this.avisar("Este visual é só de exemplo: o tipo dele não muda."); return; }
    var todos = v.campos.valores.concat([]), cats = v.campos.eixo.concat(v.campos.explicar);
    v.tipo = tipo;
    v.campos = { valores: [], eixo: [], explicar: [] };
    if (tipo === "segmentacao") v.campos.eixo = cats.slice(0, 1);
    else if (tipo === "arvore") { v.campos.valores = todos.slice(0, 1); v.campos.explicar = cats; }
    else if (tipo === "cartao" || tipo === "cartaoMulti" || tipo === "tabela") { v.campos.valores = todos; v.campos.eixo = tipo === "tabela" ? cats.slice(0, 1) : []; }
    else { v.campos.valores = todos.slice(0, 1); v.campos.eixo = cats.slice(0, 1); }
    v.fmt.titulo = undefined;
    this.selecao = null;
    this.render();
  };

  Simulador.prototype.clique = function (ev) {
    var a = ev.target.closest("[data-acao]");
    var self = this;
    if (this.segAberta && !(a && /^seg-/.test(a.getAttribute("data-acao")))) { this.segAberta = null; this.renderTela(); }
    if (!a) return;
    var acao = a.getAttribute("data-acao");
    switch (acao) {
      case "nova-medida": this.campoSel = null; this.renderFaixa(); this.abrirEdicao("medida", "Medida = "); return;
      case "nova-coluna": this.campoSel = null; this.renderFaixa(); this.abrirEdicao("coluna", "Coluna = "); return;
      case "fx-confirmar": this.confirmar(); return;
      case "fx-cancelar": this.cancelar(); return;
      case "inserir-dados":
        if (!this.modelo.tabela("Medidas")) {
          this.modelo.addTabela({ nome: "Medidas", n: 0, colunas: [] }, { soMedidas: true });
          this.tabelaSel = "Medidas";
          this.avisar("Tabela Medidas criada: as novas medidas vão para ela.");
        } else this.avisar("A tabela Medidas já existe.");
        this.render();
        return;
      case "paineis": this.paineis = !this.paineis; this.render(); return;
      case "mais-visuais": this.menuVisuais = !this.menuVisuais; this.renderPaineis(); return;
      case "importar":
        this.importados.push(a.getAttribute("data-tipo"));
        this.menuVisuais = false;
        this.avisar("Importação bem-sucedida: " + TIPOS[a.getAttribute("data-tipo")].nome + " está na galeria de Visualizações.");
        this.renderPaineis(); this.renderTarefas();
        return;
      case "redefinir": this.iniciar(); this.el.texto.value = ""; this.render(); return;
      case "vista": this.vista = a.getAttribute("data-vista"); this.render(); return;
      case "sel-tabela":
        this.tabelaSel = a.getAttribute("data-tabela");
        if (this.vista === "tabela") this.renderTela();
        this.renderPaineis();
        return;
      case "sel-medida":
        ev.preventDefault();
        var m = this.modelo.medida(a.getAttribute("data-med"));
        this.campoSel = { med: m.nome };
        this.edicao = { tipo: "medida", texto: m.texto, alvo: { medida: m }, tabela: m.tabela };
        this.erro = m.erro ? { tipo: "aviso", msg: m.erro } : null;
        this.renderFaixa(); this.renderFx(); this.renderPaineis();
        return;
      case "sel-coluna":
        ev.preventDefault();
        var t = this.modelo.tabela(a.getAttribute("data-tabela")), c = this.modelo.col(t, a.getAttribute("data-col"));
        this.campoSel = { tabela: t.nome, col: c.nome };
        this.tabelaSel = t.nome;
        if (c.calc) { this.edicao = { tipo: "coluna", texto: c.texto, alvo: { coluna: c }, tabela: t.nome }; this.erro = null; }
        else this.edicao = null;
        this.render();
        return;
      case "tipo": this.trocarTipo(a.getAttribute("data-tipo")); return;
      case "tirar":
        var v = this.visual(this.sel);
        v.campos[a.getAttribute("data-poco")].splice(+a.getAttribute("data-i"), 1);
        if (v.tipo === "segmentacao") delete this.seg[v.id];
        this.selecao = null; delete this.arvore[v.id];
        this.render();
        return;
      case "usar":
        var tarefa = this.cfg.tarefas[+a.getAttribute("data-i")];
        this.campoSel = null;
        this.renderFaixa();
        this.abrirEdicao(tarefa.coluna ? "coluna" : "medida", tarefa.formula);
        return;
      case "pct":
        var mm = this.modelo.medida(this.campoSel.med);
        mm.formato = mm.formato === "pct" ? "auto" : "pct";
        this.render();
        return;
      case "seg-abrir":
        ev.stopPropagation();
        this.segAberta = this.segAberta === a.getAttribute("data-v") ? null : a.getAttribute("data-v");
        this.sel = a.getAttribute("data-v");
        this.renderTela(); this.renderPaineis();
        return;
      case "seg-tudo":
        delete this.seg[a.getAttribute("data-v")];
        this.selecao = null;
        this.renderTela(); this.renderTarefas();
        return;
      case "seg-item":
        var vid = a.getAttribute("data-v"), cat = JSON.parse(a.getAttribute("data-cat"));
        var lista = this.seg[vid] ? this.seg[vid].slice() : [];
        var p = lista.indexOf(cat);
        if (ev.ctrlKey || ev.metaKey) { if (p === -1) lista.push(cat); else lista.splice(p, 1); }
        else lista = p !== -1 && lista.length === 1 ? [] : [cat];
        if (lista.length) this.seg[vid] = lista; else delete this.seg[vid];
        this.selecao = null;
        this.renderTela(); this.renderTarefas();
        return;
      case "arvore":
        var va = this.visual(a.getAttribute("data-v")), nivel = +a.getAttribute("data-nivel");
        var caminho = (this.arvore[va.id] || []).slice(0, Math.max(nivel, 0));
        if (nivel >= 0) {
          var catA = JSON.parse(a.getAttribute("data-cat"));
          var atual = (this.arvore[va.id] || [])[nivel];
          if (atual !== catA && nivel < va.campos.explicar.length - 1) caminho.push(catA);
          else if (atual !== catA) caminho.push(catA);
        }
        this.arvore[va.id] = caminho;
        this.sel = va.id;
        this.renderTela(); this.renderPaineis();
        return;
      case "tela":
        var pv = ev.target.closest(".pv");
        if (pv) {
          var id = pv.getAttribute("data-v"), alvoV = this.visual(id);
          var catEl = ev.target.closest("[data-cat]");
          if (catEl && alvoV && alvoV.campos.eixo.length && /barras|colunas|area|rosca|funil/.test(alvoV.tipo)) {
            var valor = JSON.parse(catEl.getAttribute("data-cat"));
            var s = this.selecao && this.selecao.vid === id ? this.selecao.valores.slice() : [];
            var q = s.indexOf(valor);
            if (ev.ctrlKey || ev.metaKey) { if (q === -1) s.push(valor); else s.splice(q, 1); }
            else s = q !== -1 && s.length === 1 ? [] : [valor];
            this.selecao = s.length ? { vid: id, campo: alvoV.campos.eixo[0], valores: s } : null;
          } else if (this.selecao && this.selecao.vid === id) {
            this.selecao = null;
          }
          if (this.sel !== id) this.campoSel = null;
          this.sel = id;
        } else {
          this.sel = null;
          this.selecao = null;
        }
        this.renderFaixa(); this.renderTela(); this.renderPaineis(); this.renderTarefas();
        return;
    }
    void self;
  };

  Simulador.prototype.mudanca = function (ev) {
    var a = ev.target.closest("[data-acao-mudar]");
    if (!a) return;
    var acao = a.getAttribute("data-acao-mudar");
    if (acao === "campo") {
      this.alternarCampo({ med: a.getAttribute("data-med"), tabela: a.getAttribute("data-tabela"), col: a.getAttribute("data-col"), nivel: a.getAttribute("data-nivel") });
    } else if (acao === "formato") {
      this.modelo.medida(this.campoSel.med).formato = a.value;
      this.render();
    } else if (acao === "tabela-inicial") {
      this.modelo.medida(this.campoSel.med).tabela = a.value;
      this.render();
    }
  };

  /* página de dica de ferramenta: aparece ao passar o mouse numa categoria */
  Simulador.prototype.passarMouse = function (ev) {
    var dicaEl = this.el.dica, alvo = ev.target.closest("[data-dica]");
    var pv = alvo && alvo.closest(".pv");
    var v = pv && this.visual(pv.getAttribute("data-v"));
    if (!v || !v.dica || !this.cfg.paginas || !this.cfg.paginas[v.dica]) { dicaEl.hidden = true; return; }
    var cat = JSON.parse(alvo.getAttribute("data-cat")), pag = this.cfg.paginas[v.dica], self = this;
    var chave = v.id + "|" + cat;
    if (this.dicaChave !== chave) {
      this.dicaChave = chave;
      var fs = this.filtrosDe(v).concat([filtroDeValores(this.modelo, v.campos.eixo[0], [cat], "dica:")]);
      dicaEl.innerHTML = '<div class="sim-dica-pagina" style="background-image:url(' + esc(pag.fundo) + ')">' + pag.visuais.map(function (pvis, i) {
        var vis = pag.cache && pag.cache[i] || (pag.cache = pag.cache || [], pag.cache[i] = copiarVisual(pvis, i));
        return '<div class="pv pv--' + vis.tipo + '" style="left:' + (vis.x / 3.2) + "%;top:" + (vis.y / 2.4) + "%;width:" + (vis.w / 3.2) + "%;height:" + (vis.h / 2.4) + '%">' + renderVisual(self, vis, fs, true) + "</div>";
      }).join("") + '</div><p class="sim-dica-legenda">' + esc(rotuloCategoria(v.campos.eixo[0], cat)) + "</p>";
    }
    var caixa = this.raiz.getBoundingClientRect();
    var x = ev.clientX - caixa.left + 18, y = ev.clientY - caixa.top + 18;
    if (x + 340 > caixa.width) x = ev.clientX - caixa.left - 350;
    dicaEl.style.left = x + "px";
    dicaEl.style.top = y + "px";
    dicaEl.hidden = false;
  };

  /* ======================================================
     6. LABORATÓRIOS DESTA AULA

     Cada um começa no ponto da aula em que está: as medidas
     que já foram criadas antes vêm prontas. As tarefas se
     marcam sozinhas quando o modelo tem o que se pediu.
     ====================================================== */

  /* uma medida qualquer com este valor (sem filtro) — o nome é livre */
  function temMedida(sim, valor, tol, fn) {
    tol = tol || 0.5;
    return sim.modelo.medidas.some(function (m) {
      if (m.erro) return false;
      if (fn && !new RegExp("\\b" + fn + "\\s*\\(", "i").test(m.texto)) return false;
      try {
        var v = sim.modelo.avMedida(m, { filtros: [], linha: null, pilha: [] });
        return typeof v === "number" && Math.abs(v - valor) <= tol;
      } catch (e) { return false; }
    });
  }
  function medidaPorNome(sim, nome) { return sim.modelo.medida(nome); }
  function noVisual(sim, nome) {
    return sim.visuais.some(function (v) { return v.campos.valores.some(function (c) { return c.med && c.med.toLowerCase() === nome.toLowerCase(); }); });
  }

  var P = "BaseProdução", F = "BaseFuncionarios";
  var MED_PROD = [
    { texto: "Qtd Produzida = SUM(BaseProdução[Qtd Produzida])" },
    { texto: "Qtd Rejeitada = SUM(BaseProdução[Qtd Rejeitada])" },
    { texto: "Horas Produtivas = CALCULATE(SUM(BaseProdução[Total Horas]), BaseProdução[Ocorrência] = BLANK())" },
    { texto: "Horas Paradas = CALCULATE(SUM(BaseProdução[Total Horas]), BaseProdução[Ocorrência] <> BLANK())" },
    { texto: "Disponibilidade = DIVIDE([Horas Produtivas], [Horas Produtivas] + [Horas Paradas])", formato: "pct" },
    { texto: "Qualidade = DIVIDE([Qtd Produzida] - [Qtd Rejeitada], [Qtd Produzida])", formato: "pct" }
  ];
  var MED_RH = [
    { texto: "Contratações = COUNTROWS(BaseFuncionarios)" },
    { texto: "Func. Ativos = CALCULATE(COUNTROWS(BaseFuncionarios), BaseFuncionarios[Data de Demissao] = BLANK())" },
    { texto: "Func. Desligados = CALCULATE(COUNTROWS(BaseFuncionarios), BaseFuncionarios[Data de Demissao] <> BLANK())" },
    { texto: "% Rotatividade = [Func. Desligados] / [Contratações]", formato: "pct" }
  ];
  var COL_ANO = { texto: "Ano da Contratação = YEAR(BaseFuncionarios[Data de Contratacao])" };
  function med(n) { return { med: n }; }
  function col(t, c, extra) { var o = { tabela: t, col: c }; for (var k in extra || {}) o[k] = extra[k]; return o; }

  SIMS.excel = {
    base: "producao", tabelaMedidas: true, medidas: MED_PROD.slice(0, 1), paineis: false, arquivo: "Dashboard de Produção",
    visuais: [
      { id: "seg", tipo: "segmentacao", eixo: [col(P, "Operador")], w: 230, h: 300 },
      { id: "c1", tipo: "cartao", valores: [med("Qtd Produzida")], w: 280, h: 300 },
      { id: "m1", tipo: "colunas", eixo: [col(P, "Data Inicio", { nivel: "Mês" })], valores: [med("Qtd Produzida")], w: 640, h: 300, fmt: { titulo: "Qtd Produzida por Mês", rotulos: true, unidades: "mil" } }
    ]
  };

  SIMS.medidas = {
    base: "producao", inserirDados: true, vistaTabela: true, arquivo: "Dashboard de Produção",
    visuais: [
      { id: "c1", tipo: "cartao", w: 240, h: 230 },
      { id: "c2", tipo: "cartao", w: 240, h: 230 },
      { id: "seg", tipo: "segmentacao", eixo: [col(P, "Operador")], w: 210, h: 230 }
    ],
    selecionado: "c1",
    tarefas: [
      { texto: "Crie a tabela <b>Medidas</b> em Página Inicial › Inserir dados.", teste: function (s) { return !!s.modelo.tabela("Medidas"); } },
      { texto: "Crie a medida da quantidade produzida.", formula: "Qtd Produzida = SUM(BaseProdução[Qtd Produzida])", teste: function (s) { return temMedida(s, 3084251, 0.5, "SUM"); } },
      { texto: "Crie a medida da quantidade rejeitada.", formula: "Qtd Rejeitada = SUM(BaseProdução[Qtd Rejeitada])", teste: function (s) { return temMedida(s, 21076, 0.5, "SUM"); } },
      { texto: "Selecione cada cartão e marque uma medida no painel Dados.", teste: function (s) { return s.visuais.filter(function (v) { return v.tipo === "cartao" && v.campos.valores.length; }).length >= 2; } },
      { texto: "Bônus: quantas ordens de produção diferentes existem?", formula: "Ordens = DISTINCTCOUNT(BaseProdução[Numero Ordem])", teste: function (s) { return temMedida(s, 8595, 0.5, "DISTINCTCOUNT"); } }
    ]
  };

  SIMS.calculate = {
    base: "producao", tabelaMedidas: true, medidas: MED_PROD.slice(0, 2), arquivo: "Dashboard de Produção",
    visuais: [
      { id: "b1", tipo: "barras", eixo: [col(P, "Ocorrência")], valores: [col(P, "Total Horas", { agg: "soma" })], w: 560, h: 360, fmt: { titulo: "Total Horas por Ocorrência" } },
      { id: "c1", tipo: "cartao", w: 260, h: 170 },
      { id: "c2", tipo: "cartao", w: 260, h: 170 }
    ],
    selecionado: "c1",
    tarefas: [
      { texto: "Horas trabalhadas sem ocorrência (a barra <b>(Em branco)</b>).", formula: "Horas Produtivas = CALCULATE(SUM(BaseProdução[Total Horas]), BaseProdução[Ocorrência] = BLANK())", teste: function (s) { return temMedida(s, 30956.15, 0.6, "CALCULATE"); } },
      { texto: "Horas com alguma ocorrência: as outras barras somadas.", formula: "Horas Paradas = CALCULATE(SUM(BaseProdução[Total Horas]), BaseProdução[Ocorrência] <> BLANK())", teste: function (s) { return temMedida(s, 8890.40, 0.6, "CALCULATE"); } },
      { texto: "Coloque as duas medidas nos cartões e clique numa barra: o cartão não muda. O CALCULATE troca o filtro de Ocorrência pelo dele.", teste: function (s) { return noVisual(s, "Horas Produtivas") || s.visuais.filter(function (v) { return v.tipo === "cartao" && v.campos.valores.length; }).length >= 2; } }
    ]
  };

  SIMS.divide = {
    base: "producao", tabelaMedidas: true, medidas: MED_PROD.slice(0, 4), arquivo: "Dashboard de Produção",
    visuais: [
      { id: "g1", tipo: "medidor", w: 250, h: 240, fmt: { maximo: 1, cor: "#2A928E" } },
      { id: "g2", tipo: "medidor", w: 250, h: 240, fmt: { maximo: 1, cor: "#43B091" } },
      { id: "seg", tipo: "segmentacao", eixo: [col(P, "Operador")], w: 210, h: 240 }
    ],
    selecionado: "g1",
    tarefas: [
      { texto: "Disponibilidade: das horas registradas, quanto foi produtivo.", formula: "Disponibilidade = DIVIDE([Horas Produtivas], [Horas Produtivas] + [Horas Paradas])", teste: function (s) { return temMedida(s, 0.7769, 0.0005, "DIVIDE"); } },
      { texto: "Qualidade: das peças produzidas, quantas saíram boas.", formula: "Qualidade = DIVIDE([Qtd Produzida] - [Qtd Rejeitada], [Qtd Produzida])", teste: function (s) { return temMedida(s, 0.99317, 0.0005, "DIVIDE"); } },
      { texto: "Coloque cada medida num medidor e mude o formato das duas para <b>Porcentagem</b> (Ferramentas de medida).", teste: function (s) {
        return s.modelo.medidas.filter(function (m) { return m.formato === "pct" && /DIVIDE/i.test(m.texto); }).length >= 2;
      } },
      { texto: "Na segmentação, escolha <b>Manuela Merege</b> (não produziu nenhuma peça). Depois troque o DIVIDE da Qualidade por uma divisão com / e compare.", teste: function (s) {
        return (s.seg.seg || []).indexOf("Manuela Merege") !== -1;
      } }
    ]
  };

  SIMS.coluna = {
    base: "producao", tabelaMedidas: true, medidas: MED_PROD.slice(0, 2), novaColuna: true, vistaTabela: true, vista: "tabela", arquivo: "Dashboard de Produção",
    visuais: [
      { id: "c1", tipo: "cartao", w: 300, h: 170 },
      { id: "c2", tipo: "cartao", w: 300, h: 170 }
    ],
    selecionado: "c1",
    tarefas: [
      { texto: "Uma <b>coluna calculada</b>: as peças boas de cada linha (Exibição de tabela, Nova coluna).", coluna: true, formula: "Peças Boas = BaseProdução[Qtd Produzida] - BaseProdução[Qtd Rejeitada]", teste: function (s) {
        var c = s.modelo.col(P, "Peças Boas");
        return !!(c && c.calc && c.dados[2] === 388);
      } },
      { texto: "A mesma conta como <b>medida</b>: um número só, que obedece aos filtros.", formula: "Total Peças Boas = [Qtd Produzida] - [Qtd Rejeitada]", teste: function (s) { return temMedida(s, 3063175, 0.5); } },
      { texto: "Teste o erro clássico: uma coluna com SUM. Todas as linhas recebem o total da tabela.", coluna: true, formula: "Total Geral = SUM(BaseProdução[Qtd Produzida])", teste: function (s) {
        return s.modelo.tabela(P).colunas.some(function (c) { return c.calc && c.dados[0] === 3084251 && c.dados[1] === 3084251; });
      } },
      { texto: "E o contrário: uma medida com a coluna sem agregação. Leia o erro.", formula: "Teste = BaseProdução[Qtd Produzida]", teste: function (s) {
        return s.modelo.medidas.some(function (m) { return m.erro && /único valor/.test(m.erro); });
      } }
    ]
  };

  var DASH_PROD = [
    { id: "i1", tipo: "imagem", x: 81, y: 72, w: 63, h: 59, fmt: { src: "img/icone-produzido.png", titulo: false }, travado: true },
    { id: "k1", tipo: "cartaoMulti", x: 144, y: 72, w: 143, h: 64, valores: [med("Qtd Produzida")], fmt: { titulo: false } },
    { id: "i2", tipo: "imagem", x: 299, y: 72, w: 56, h: 59, fmt: { src: "img/icone-rejeitado.png", titulo: false }, travado: true },
    { id: "k2", tipo: "cartaoMulti", x: 354, y: 71, w: 147, h: 72, valores: [med("Qtd Rejeitada")], fmt: { titulo: false } },
    { id: "i3", tipo: "imagem", x: 507, y: 70, w: 67, h: 62, fmt: { src: "img/icone-hora-produtiva.png", titulo: false }, travado: true },
    { id: "k3", tipo: "cartaoMulti", x: 567, y: 70, w: 163, h: 72, valores: [med("Horas Produtivas")], fmt: { titulo: false } },
    { id: "i4", tipo: "imagem", x: 723, y: 72, w: 59, h: 61, fmt: { src: "img/icone-hora-parada.png", titulo: false }, travado: true },
    { id: "k4", tipo: "cartaoMulti", x: 780, y: 72, w: 133, h: 73, valores: [med("Horas Paradas")], fmt: { titulo: false } },
    { id: "s1", tipo: "segmentacao", x: 932, y: 71, w: 157, h: 66, eixo: [col(P, "Operador")], fmt: { estilo: "suspensa" } },
    { id: "s2", tipo: "segmentacao", x: 1101, y: 72, w: 158, h: 64, eixo: [col(P, "Data Inicio", { nivel: "Mês" })], fmt: { estilo: "suspensa" } },
    { id: "a1", tipo: "area", x: 51, y: 162, w: 1208, h: 333, eixo: [col(P, "Data Inicio", { nivel: "Mês" })], valores: [med("Qtd Produzida")], fmt: { titulo: "Produção Mensal", rotulos: true, unidades: "mil", eixoY: false, cor: "#30747E", corLinha: "#1A6570" } },
    { id: "g1", tipo: "medidor", x: 79, y: 503, w: 573, h: 184, valores: [med("Disponibilidade")], fmt: { maximo: 1, cor: "#2A928E" } },
    { id: "g2", tipo: "medidor", x: 670, y: 498, w: 578, h: 189, valores: [med("Qualidade")], fmt: { maximo: 1, cor: "#43B091" } }
  ];

  SIMS.dashProducao = {
    base: "producao", tabelaMedidas: true, medidas: MED_PROD, layout: "tela", escuro: true, fundo: "img/fundo-producao.jpg",
    paineis: false, arquivo: "Dashboard de Produção", visuais: DASH_PROD
  };

  SIMS.contar = {
    base: "rh", arquivo: "Dashboard RH",
    visuais: [
      { id: "c1", tipo: "cartao", w: 260, h: 160 },
      { id: "c2", tipo: "cartao", w: 260, h: 160 },
      { id: "c3", tipo: "cartao", w: 260, h: 160 }
    ],
    selecionado: "c1", vistaTabela: true,
    tarefas: [
      { texto: "Quantas pessoas a empresa já contratou: cada linha é uma contratação.", formula: "Contratações = COUNTROWS(BaseFuncionarios)", teste: function (s) { return temMedida(s, 234, 0.1, "COUNTROWS"); } },
      { texto: "COUNT conta os <b>valores</b> de uma coluna: as células em branco ficam de fora.", formula: "Datas de Demissão = COUNT(BaseFuncionarios[Data de Demissao])", teste: function (s) { return temMedida(s, 17, 0.1, "COUNT"); } },
      { texto: "Quantos cargos diferentes existem.", formula: "Cargos = DISTINCTCOUNT(BaseFuncionarios[Cargo])", teste: function (s) { return temMedida(s, 5, 0.1, "DISTINCTCOUNT"); } },
      { texto: "Coloque as três medidas nos cartões.", teste: function (s) { return s.visuais.filter(function (v) { return v.campos.valores.length; }).length >= 3; } }
    ]
  };

  SIMS.ano = {
    base: "rh", medidas: MED_RH.slice(0, 1), novaColuna: true, vistaTabela: true, importavel: ["sparkline"], arquivo: "Dashboard RH",
    visuais: [
      { id: "c1", tipo: "cartao", valores: [med("Contratações")], w: 300, h: 220 }
    ],
    selecionado: "c1",
    tarefas: [
      { texto: "Com o cartão selecionado, troque o visual para <b>Cartão de linha múltipla</b> na galeria.", teste: function (s) {
        return s.visuais.some(function (v) { return v.tipo === "cartaoMulti" && v.campos.valores.length; });
      } },
      { texto: "Uma coluna com o ano da contratação de cada pessoa (Nova coluna).", coluna: true, formula: "Ano da Contratação = YEAR(BaseFuncionarios[Data de Contratacao])", teste: function (s) {
        return s.modelo.tabela(F).colunas.some(function (c) { return c.calc && c.dados[0] === 2015; });
      } },
      { texto: "Em Visualizações, clique em <b>···</b> (Obter mais visuais) e adicione o <b>Sparkline by OKViz</b>.", teste: function (s) {
        return s.importados.indexOf("sparkline") !== -1;
      } },
      { texto: "Clique numa área vazia da tela e depois no ícone do Sparkline. Marque <b>Ano da Contratação</b> (vai para Axis) e <b>Contratações</b> (Measure).", teste: function (s) {
        return s.visuais.some(function (v) { return v.tipo === "sparkline" && v.campos.eixo.length && v.campos.valores.length; });
      } }
    ]
  };

  SIMS.ativos = {
    base: "rh", medidas: MED_RH.slice(0, 1), arquivo: "Dashboard RH",
    visuais: [
      { id: "c1", tipo: "cartao", valores: [med("Contratações")], w: 240, h: 160 },
      { id: "c2", tipo: "cartao", w: 240, h: 160 },
      { id: "c3", tipo: "cartao", w: 240, h: 160 },
      { id: "c4", tipo: "cartao", w: 240, h: 160 }
    ],
    selecionado: "c2",
    tarefas: [
      { texto: "Quem ainda trabalha na empresa: a Data de Demissao está em branco.", formula: "Func. Ativos = CALCULATE(\n    COUNTROWS(BaseFuncionarios),\n    BaseFuncionarios[Data de Demissao] = BLANK()\n)", teste: function (s) { return temMedida(s, 217, 0.1, "CALCULATE"); } },
      { texto: "Quem saiu: a Data de Demissao <b>não</b> está em branco.", formula: "Func. Desligados = CALCULATE(\n    COUNTROWS(BaseFuncionarios),\n    BaseFuncionarios[Data de Demissao] <> BLANK()\n)", teste: function (s) { return temMedida(s, 17, 0.1, "CALCULATE"); } },
      { texto: "A rotatividade usa duas medidas prontas. Depois, formato <b>Porcentagem</b>.", formula: "% Rotatividade = [Func. Desligados] / [Contratações]", teste: function (s) {
        return s.modelo.medidas.some(function (m) {
          if (m.erro || m.formato !== "pct") return false;
          try { return Math.abs(s.modelo.avMedida(m, { filtros: [], linha: null, pilha: [] }) - 17 / 234) < 0.0005; } catch (e) { return false; }
        });
      } },
      { texto: "Coloque as medidas nos cartões vazios.", teste: function (s) { return s.visuais.filter(function (v) { return v.campos.valores.length; }).length >= 4; } }
    ]
  };

  SIMS.visuaisRh = {
    base: "rh", cidade: true, medidas: MED_RH, colunas: [COL_ANO], arquivo: "Dashboard RH",
    visuais: [
      { id: "f1", tipo: "funil", eixo: [col(F, "Cidade")], valores: [med("Func. Ativos")], w: 400, h: 330, fmt: { cor: "#2A928E" } },
      { id: "r1", tipo: "rosca", eixo: [col(F, "Genero")], valores: [med("Func. Ativos")], w: 320, h: 330, fmt: { cores: { M: "#2A928E", F: "#9BD7C6" } } },
      { id: "t1", tipo: "arvore", valores: [med("Func. Ativos")], explicar: [col(F, "Área"), col(F, "Cargo")], w: 620, h: 360 }
    ],
    selecionado: "t1"
  };

  var DICA_RH = {
    fundo: "img/fundo-dica.jpg",
    visuais: [
      { tipo: "cartao", x: 4, y: 4, w: 156, h: 64, valores: [med("Func. Ativos")], fmt: { titulo: "Funcionários Ativos", semRotulo: true } },
      { tipo: "cartao", x: 167, y: 4, w: 148, h: 64, valores: [col(F, "Salario", { agg: "soma", rotulo: "Folha Salarial", fmt: "moeda" })], fmt: { titulo: "Folha Salarial", semRotulo: true } },
      { tipo: "barras", x: 7, y: 71, w: 310, h: 165, eixo: [col(F, "Cargo")], valores: [col(F, "Horas Extras", { agg: "soma" })], fmt: { cor: "#C2F743" } }
    ]
  };

  SIMS.dashRh = {
    base: "rh", cidade: true, medidas: MED_RH, colunas: [COL_ANO], importados: ["sparkline"], layout: "tela", escuro: true,
    fundo: "img/fundo-rh.jpg", paineis: false, arquivo: "Dashboard RH", paginas: { tooltip: DICA_RH },
    visuais: [
      { id: "k1", tipo: "cartaoMulti", x: 28, y: 104, w: 171, h: 79, valores: [med("Contratações")], fmt: { titulo: "Contratações", semRotulo: true } },
      { id: "sp", tipo: "sparkline", x: 13, y: 190, w: 341, h: 100, eixo: [col(F, "Ano da Contratação")], valores: [med("Contratações")], fmt: { titulo: "Total Contratações Anual", cor: "#C2F743" } },
      { id: "k2", tipo: "cartaoMulti", x: 362, y: 104, w: 125, h: 79, valores: [med("Func. Ativos")], fmt: { titulo: "Func. Ativos", semRotulo: true } },
      { id: "k3", tipo: "cartaoMulti", x: 362, y: 208, w: 171, h: 79, valores: [med("Func. Desligados")], fmt: { titulo: "Demissões", semRotulo: true } },
      { id: "k4", tipo: "cartaoMulti", x: 533, y: 208, w: 140, h: 79, valores: [med("% Rotatividade")], fmt: { titulo: "Turnover", semRotulo: true } },
      { id: "f1", tipo: "funil", x: 28, y: 307, w: 356, h: 386, eixo: [col(F, "Cidade")], valores: [med("Func. Ativos")], fmt: { cor: "#AEDE3C" }, dica: "tooltip" },
      { id: "r1", tipo: "rosca", x: 384, y: 307, w: 277, h: 386, eixo: [col(F, "Genero")], valores: [med("Func. Ativos")], fmt: { cores: { M: "#AEDE3C", F: "#ECFCC6" } } },
      { id: "t1", tipo: "arvore", x: 682, y: 98, w: 579, h: 598, valores: [med("Func. Ativos")], explicar: [col(F, "Área"), col(F, "Cargo")] }
    ]
  };

  /* inicializa todos os simuladores da página */
  document.querySelectorAll("[data-sim]").forEach(function (el) {
    var cfg = SIMS[el.getAttribute("data-sim")];
    if (!cfg) return;
    if (!window.DADOS_PRODUCAO || !window.DADOS_RH) { el.textContent = "Os dados da aula não carregaram (js/dados-producao.js e js/dados-rh.js)."; return; }
    INSTANCIAS.push(new Simulador(el, cfg));
  });

  /* exposto para os laboratórios simples do aula.js e para testes */
  window.PBI = {
    Modelo: Modelo, novoModelo: novoModelo, formatar: formatar, valorPbi: valorPbi, cidadeDe: cidadeDe,
    instancias: INSTANCIAS, SIMS: SIMS, DaxErro: DaxErro, lexDax: lexDax, parseDax: parseDax
  };
})();
