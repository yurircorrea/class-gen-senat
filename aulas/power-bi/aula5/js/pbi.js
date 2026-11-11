/* =========================================================
   pbi.js — simulador do Power BI Desktop (aula 5)

   O simulador das aulas 2 a 4 (motor de DAX, painéis, filtros,
   relacionamentos na Exibição de modelo), agora com as quatro
   tabelas do estudo de caso da empresa de entregas, já tratadas
   no Power Query: Entregas, Entregadores, Empresas Clientes e
   Veículos. Ganha SWITCH, MEDIAN e MEDIANX no DAX e o filtro
   "N superior" no painel do visual (Filtros neste visual).

   1. Utilidades: escape, formatos de número, datas
   2. Modelo de dados: tabelas, colunas, medidas, relações
   3. DAX: análise léxica, sintática e avaliação
   4. Visuais
   5. Simulador: faixa, barra de fórmulas, painéis, tela,
      exibições de tabela e de modelo, tarefas
   6. Laboratórios desta aula (configuração) e inicialização

   Uso no HTML: <div class="pbi-sim" data-sim="modelo"></div>
   Depende de js/dados-entregas.js.
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

  /* as quatro tabelas como saem do Power Query, já tratadas:
     sem linhas em branco, Data e Hora separadas, Nome Completo,
     telefone sem +55, endereço dividido em Endereço, CEP, Cidade e UF */
  function tabelasEntregas() {
    if (BRUTO.entregas) return BRUTO.entregas;
    var D = window.DADOS_ENTREGAS, E = D.entregas;
    function col(linhas, i) { return linhas.map(function (l) { return l[i]; }); }
    function endereco(txt) {
      var u = txt.lastIndexOf(" / "), resto = txt.slice(0, u), v = resto.lastIndexOf(", "), cepCid = resto.slice(v + 2), e = cepCid.indexOf(" ");
      return { rua: resto.slice(0, v), cep: cepCid.slice(0, e), cidade: cepCid.slice(e + 1), uf: txt.slice(u + 3) };
    }
    function tel(t) { return String(t).replace("+55 ", ""); }
    function hora(s) { s = ((s % 86400) + 86400) % 86400; return dois(Math.floor(s / 3600)) + ":" + dois(Math.floor(s / 60) % 60) + ":" + dois(s % 60); }
    var R = D.entregadores.linhas, C = D.empresas.linhas, V = D.veiculos.linhas;
    var eR = R.map(function (l) { return endereco(l[9]); }), eC = C.map(function (l) { return endereco(l[2]); });
    BRUTO.entregas = [
      { nome: "Entregas", n: E.seg.length, colunas: [
        coluna("Código", "texto", E.seg.map(function (_, i) { return "ENT" + ("0000" + (i + 1)).slice(-5); })),
        coluna("CPF do Entregador", "texto", E.cpf.map(function (i) { return R[i][0]; })),
        coluna("CNPJ do Solicitante", "texto", E.cnpj.map(function (i) { return C[i][0]; })),
        coluna("Placa do Veículo", "texto", E.placa.map(function (i) { return V[i][1]; })),
        coluna("Data da Entrega", "data", E.seg.map(function (s) { return Math.floor(s / 86400); })),
        coluna("Hora da Entrega", "texto", E.seg.map(hora)),
        coluna("Descrição do Conteúdo", "texto", E.desc.map(function (i) { return E.descricoes[i]; })),
        coluna("Valor do Conteúdo", "decimal", E.conteudo.map(function (v) { return v / 100; })),
        coluna("Valor Final da Entrega", "decimal", E.final.map(function (v) { return v / 100; })),
        coluna("Porcentagem de Taxa", "decimal", E.taxa.map(function (v) { return v / 100; }))
      ] },
      { nome: "Entregadores", n: R.length, colunas: [
        coluna("CPF", "texto", col(R, 0)),
        coluna("Nome Completo", "texto", R.map(function (l) { return l[1] + " " + l[2]; })),
        coluna("Data de Nascimento", "data", col(R, 3)),
        coluna("Categoria da CNH", "texto", col(R, 4)),
        coluna("Veículo Próprio", "texto", col(R, 5)),
        coluna("Data da Contratação", "data", col(R, 6)),
        coluna("Data da Demissão", "data", col(R, 7)),
        coluna("Telefone", "texto", R.map(function (l) { return tel(l[8]); })),
        coluna("Endereço", "texto", eR.map(function (x) { return x.rua; })),
        coluna("CEP", "texto", eR.map(function (x) { return x.cep; })),
        coluna("Cidade", "texto", eR.map(function (x) { return x.cidade; })),
        coluna("UF", "texto", eR.map(function (x) { return x.uf; })),
        coluna("Salário Mensal", "decimal", col(R, 10))
      ] },
      { nome: "Empresas Clientes", n: C.length, colunas: [
        coluna("CNPJ", "texto", col(C, 0)),
        coluna("Razão Social", "texto", col(C, 1)),
        coluna("Endereço", "texto", eC.map(function (x) { return x.rua; })),
        coluna("CEP", "texto", eC.map(function (x) { return x.cep; })),
        coluna("Cidade", "texto", eC.map(function (x) { return x.cidade; })),
        coluna("UF", "texto", eC.map(function (x) { return x.uf; })),
        coluna("Telefone de Contato", "texto", C.map(function (l) { return tel(l[3]); })),
        coluna("Nome do Contato", "texto", col(C, 4)),
        coluna("Data de Assinatura do Contrato", "data", col(C, 5)),
        coluna("Valor mensal do contrato", "decimal", col(C, 6)),
        coluna("Porte", "texto", col(C, 7))
      ] },
      { nome: "Veículos", n: V.length, colunas: [
        coluna("Renavam", "inteiro", col(V, 0)),
        coluna("Placa", "texto", col(V, 1)),
        coluna("Marca", "texto", col(V, 2)),
        coluna("Modelo", "texto", col(V, 3)),
        coluna("Tipo", "texto", col(V, 4)),
        coluna("Data da Aquisição", "data", col(V, 5)),
        coluna("Quilometragem rodada", "inteiro", col(V, 6)),
        coluna("Quilometragem da Próxima Revisão", "inteiro", col(V, 7)),
        coluna("Possui débitos", "texto", col(V, 8))
      ] }
    ];
    return BRUTO.entregas;
  }

  function DaxErro(msg) { this.msg = msg; }

  function Modelo() {
    this.tabelas = [];
    this.relacoes = [];
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
  /* ---------- relações ----------
     { id, um: {tabela, col}, muitos: {tabela, col}, card: "1:*" | "1:1" }
     O filtro anda do lado 1 para o lado *; numa relação 1:1, nos dois sentidos. */
  function chaveValor(v) { return (typeof v) + ":" + (typeof v === "string" ? v.toLowerCase() : v); }
  Modelo.prototype.unica = function (t, nome) {
    var c = this.col(t, nome), vistos = {};
    for (var i = 0; i < c.dados.length; i++) {
      var v = c.dados[i];
      if (v === null || v === undefined) return false;
      var k = chaveValor(v);
      if (vistos[k]) return false;
      vistos[k] = 1;
    }
    return true;
  };
  Modelo.prototype.relacaoEntre = function (a, b) {
    return this.relacoes.filter(function (r) {
      return (r.um.tabela === a && r.muitos.tabela === b) || (r.um.tabela === b && r.muitos.tabela === a);
    })[0] || null;
  };
  /* devolve { relacao } ou { erro } */
  Modelo.prototype.criarRelacao = function (ta, ca, tb, cb) {
    if (ta === tb) return { erro: "Escolha duas tabelas diferentes." };
    var A = this.tabela(ta), B = this.tabela(tb), colA = this.col(A, ca), colB = this.col(B, cb);
    if (!colA || !colB) return { erro: "Escolha uma coluna em cada tabela." };
    if ((colA.tipo === "texto") !== (colB.tipo === "texto")) {
      return { erro: "As colunas " + ta + "[" + ca + "] e " + tb + "[" + cb + "] têm tipos de dados diferentes. A relação precisa ligar colunas do mesmo tipo." };
    }
    if (this.relacaoEntre(A.nome, B.nome)) return { erro: "Já existe uma relação ativa entre " + A.nome + " e " + B.nome + "." };
    var ua = this.unica(A, colA.nome), ub = this.unica(B, colB.nome), r;
    if (!ua && !ub) {
      return { erro: "Nenhuma das duas colunas tem valores únicos: seria uma relação muitos para muitos (*:*). Ligue a coluna da base à coluna-chave do cadastro, que não se repete." };
    }
    if (ua && ub) r = { um: { tabela: A.nome, col: colA.nome }, muitos: { tabela: B.nome, col: colB.nome }, card: "1:1" };
    else if (ua) r = { um: { tabela: A.nome, col: colA.nome }, muitos: { tabela: B.nome, col: colB.nome }, card: "1:*" };
    else r = { um: { tabela: B.nome, col: colB.nome }, muitos: { tabela: A.nome, col: colA.nome }, card: "1:*" };
    var chaveUm = {}, d = colA.nome === r.um.col && A.nome === r.um.tabela ? colA.dados : colB.dados;
    d.forEach(function (v) { chaveUm[chaveValor(v)] = 1; });
    var dm = this.col(r.muitos.tabela, r.muitos.col).dados, sem = 0;
    dm.forEach(function (v) { if (!chaveUm[chaveValor(v)]) sem++; });
    r.semPar = sem;
    r.id = "r" + (++this.seq);
    this.relacoes.push(r);
    this.limpar();
    return { relacao: r };
  };
  Modelo.prototype.excluirRelacao = function (id) {
    this.relacoes = this.relacoes.filter(function (r) { return r.id !== id; });
    this.limpar();
  };
  /* Detecção automática: colunas com o mesmo nome e tipo, com valores únicos de um lado */
  Modelo.prototype.detectar = function () {
    var self = this, criadas = [];
    this.tabelas.forEach(function (A, ia) {
      self.tabelas.forEach(function (B, ib) {
        if (ib <= ia || A.soMedidas || B.soMedidas || self.relacaoEntre(A.nome, B.nome)) return;
        A.colunas.some(function (ca) {
          var cb = self.col(B, ca.nome);
          if (!cb || ca.calc || cb.calc || (ca.tipo === "texto") !== (cb.tipo === "texto")) return false;
          if (!self.unica(A, ca.nome) && !self.unica(B, cb.nome)) return false;
          /* como no Power BI: mesmo nome não basta, os valores precisam se encontrar */
          var vistos = {}, comum = false;
          ca.dados.forEach(function (v) { vistos[chaveValor(v)] = 1; });
          cb.dados.some(function (v) { return (comum = !!vistos[chaveValor(v)]); });
          if (!comum) return false;
          var r = self.criarRelacao(A.nome, ca.nome, B.nome, cb.nome);
          if (r.relacao) criadas.push(r.relacao);
          return !!r.relacao;
        });
      });
    });
    return criadas;
  };
  /* posição de cada valor da chave no lado 1, para o RELATED */
  Modelo.prototype.indiceUm = function (r) {
    var chave = "idx§" + r.id;
    if (this.cacheLinhas[chave]) return this.cacheLinhas[chave];
    var idx = {}, d = this.col(r.um.tabela, r.um.col).dados;
    d.forEach(function (v, i) { idx[chaveValor(v)] = i; });
    this.cacheLinhas[chave] = idx;
    return idx;
  };
  /* filtros que chegam a t pelas relações: um filtro sobre o lado 1 vira um filtro sobre o lado * */
  Modelo.prototype.temFiltro = function (t, filtros, pilha) {
    var self = this;
    if (filtros.some(function (f) { return f.tabela === t.nome; })) return true;
    return this.relacoes.some(function (r) {
      var outra = r.muitos.tabela === t.nome ? r.um.tabela : r.card === "1:1" && r.um.tabela === t.nome ? r.muitos.tabela : null;
      return outra && pilha.indexOf(outra) === -1 && self.temFiltro(self.tabela(outra), filtros, pilha.concat(t.nome));
    });
  };
  Modelo.prototype.filtrosRelacao = function (t, filtros, pilha) {
    var self = this, extras = [];
    this.relacoes.forEach(function (r) {
      var lado = r.muitos.tabela === t.nome ? { de: r.um, para: r.muitos } : r.card === "1:1" && r.um.tabela === t.nome ? { de: r.muitos, para: r.um } : null;
      if (!lado || pilha.indexOf(lado.de.tabela) !== -1) return;
      var origem = self.tabela(lado.de.tabela);
      if (!self.temFiltro(origem, filtros, pilha.concat(t.nome))) return;
      var vis = self.visiveis(origem, filtros, pilha.concat(t.nome)), dOrig = self.col(origem, lado.de.col).dados, conj = {};
      vis.forEach(function (i) { conj[chaveValor(dOrig[i])] = 1; });
      var dPara = self.col(t, lado.para.col).dados;
      extras.push({ tabela: t.nome, cols: ["§rel"], chave: "R" + r.id + "(" + chaveDe(filtros) + ")", pred: function (i) { return conj[chaveValor(dPara[i])] === 1; } });
    });
    return extras;
  };

  Modelo.prototype.visiveis = function (t, filtros, pilha) {
    var fs = filtros.filter(function (f) { return f.tabela === t.nome; });
    if (this.relacoes.length) fs = fs.concat(this.filtrosRelacao(t, filtros, pilha || []));
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
        if (t.t === "id" && ver() && ver().t === "id" && toks[i + 1] && toks[i + 1].t === "col") {
          throw new DaxErro("A sintaxe para '" + ver().txt + "' está incorreta. Nome de tabela com espaço vai entre aspas simples: '" + t.v + " " + ver().v + "'" + toks[i + 1].txt + ".");
        }
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

  function mediana(lista) {
    if (!lista.length) return null;
    lista.sort(function (a, b) { return a - b; });
    var m = lista.length >> 1;
    return lista.length % 2 ? lista[m] : (lista[m - 1] + lista[m]) / 2;
  }

  Modelo.prototype.agregar = function (fn, n, ctx) {
    var tc = this.colDeArg(n, fn), t = tc.t, c = tc.c;
    var chave = fn + "§" + t.nome + "§" + c.nome + "§" + chaveDe(ctx.filtros);
    if (this.cacheAgg.hasOwnProperty(chave)) return this.cacheAgg[chave];
    if (c.tipo === "texto" && /^(SUM|AVERAGE|MEDIAN)$/.test(fn)) {
      throw new DaxErro("A função " + fn + " não pode trabalhar com valores do tipo String.");
    }
    var idx = this.visiveis(t, ctx.filtros), d = c.dados, r = null, k, v, n2 = 0;
    if (fn === "SUM" || fn === "AVERAGE") {
      var s = 0;
      for (k = 0; k < idx.length; k++) { v = d[idx[k]]; if (v !== null && v !== undefined) { s += v; n2++; } }
      r = n2 ? (fn === "SUM" ? s : s / n2) : null;
    } else if (fn === "MEDIAN") {
      var lista = [];
      for (k = 0; k < idx.length; k++) { v = d[idx[k]]; if (v !== null && v !== undefined) lista.push(v); }
      r = mediana(lista);
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
      case "SUM": case "AVERAGE": case "MEDIAN": case "COUNT": case "COUNTA": case "COUNTBLANK": case "DISTINCTCOUNT": case "DISTINCTCOUNTNOBLANK":
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
      case "MEDIANX":
        qtd(2); t = this.avTabela(A[0], ctx);
        var lx = [];
        t.idx.forEach(function (i) {
          var x = self.av(A[1], { filtros: ctx.filtros, linha: { tabela: t.t.nome, i: i }, pilha: ctx.pilha });
          if (!eBlank(x)) lx.push(paraNum(x));
        });
        return mediana(lx);
      case "SWITCH":
        if (A.length < 3) throw new DaxErro("Poucos argumentos foram passados para a função SWITCH. A contagem mínima de argumentos para a função é 3.");
        var alvo = av(0);
        for (k = 1; k + 1 < A.length; k += 2) if (igual(alvo, av(k))) return av(k + 1);
        return A.length % 2 === 0 ? av(A.length - 1) : null;
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
      case "RELATED":
        qtd(1);
        var tr = this.colDeArg(A[0], "RELATED");
        if (!ctx.linha) throw new DaxErro("A função RELATED precisa de um contexto de linha: use numa coluna calculada ou dentro de um iterador, como SUMX.");
        if (ctx.linha.tabela === tr.t.nome) return tr.c.dados[ctx.linha.i];
        var rel = this.relacoes.filter(function (r) {
          return (r.muitos.tabela === ctx.linha.tabela && r.um.tabela === tr.t.nome) || (r.card === "1:1" && r.um.tabela === ctx.linha.tabela && r.muitos.tabela === tr.t.nome);
        })[0];
        if (!rel) throw new DaxErro("A coluna '" + tr.t.nome + "[" + tr.c.nome + "]' não existe ou não tem uma relação com nenhuma tabela disponível no contexto atual.");
        var ladoAqui = rel.muitos.tabela === ctx.linha.tabela ? rel.muitos : rel.um, ladoLa = ladoAqui === rel.muitos ? rel.um : rel.muitos;
        var fk = this.col(ctx.linha.tabela, ladoAqui.col).dados[ctx.linha.i];
        var mapa = {}, dLa = this.col(ladoLa.tabela, ladoLa.col).dados;
        if (ladoLa === rel.um) mapa = this.indiceUm(rel); else dLa.forEach(function (x, i) { mapa[chaveValor(x)] = i; });
        var achou = mapa[chaveValor(fk)];
        return achou === undefined ? null : tr.c.dados[achou];
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
  var AGG = { soma: "SUM", contagem: "COUNTA", media: "AVERAGE", distinta: "DISTINCTCOUNT", min: "MIN", max: "MAX", primeiro: "MIN" };
  var AGG_NOME = { soma: "Soma de ", contagem: "Contagem de ", media: "Média de ", distinta: "Contagem de ", min: "Mínimo de ", max: "Máximo de ", primeiro: "Primeiro " };
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
    var c = this.col(campo.tabela, campo.col);
    return (c && c.formato) || "auto";
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
    pizza: { nome: "Gráfico de pizza", pocos: [["eixo", "Legenda"], ["valores", "Valores"]] },
    mapa: { nome: "Mapa", pocos: [["eixo", "Localização"], ["valores", "Tamanho da bolha"]] },
    cascata: { nome: "Gráfico de cascata", pocos: [["eixo", "Categoria"], ["valores", "Y"]] },
    imagens: { nome: "Image Grid", pocos: [["eixo", "Image URL"]], personalizado: true },
    historia: { nome: "Enlighten Data Story", pocos: [["valores", "Measures"]], personalizado: true },
    letreiro: { nome: "Scroller", pocos: [["eixo", "Category"], ["valores", "Measure Absolute e Measure Deviation"]], personalizado: true },
    funil: { nome: "Funil", pocos: [["eixo", "Categoria"], ["valores", "Valores"]] },
    medidor: { nome: "Medidor", pocos: [["valores", "Valor"]] },
    segmentacao: { nome: "Segmentação de dados", pocos: [["eixo", "Campo"]] },
    tabela: { nome: "Tabela", pocos: [["eixo", "Colunas"], ["valores", "Valores"]] },
    arvore: { nome: "Árvore hierárquica", pocos: [["valores", "Analisar"], ["explicar", "Explicar por"]] },
    sparkline: { nome: "Sparkline by OKViz", pocos: [["eixo", "Axis"], ["valores", "Measure"]], personalizado: true },
    imagem: { nome: "Imagem", pocos: [] }
  };
  var GALERIA = ["cartao", "cartaoMulti", "barras", "colunas", "area", "pizza", "rosca", "funil", "medidor", "segmentacao", "tabela", "arvore"];
  var ICONES = {
    cartao: '<text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700">123</text>',
    cartaoMulti: '<rect x="4" y="5" width="16" height="3"/><rect x="4" y="11" width="11" height="3"/><rect x="4" y="17" width="14" height="3"/>',
    barras: '<rect x="4" y="4" width="15" height="4"/><rect x="4" y="10" width="10" height="4"/><rect x="4" y="16" width="6" height="4"/>',
    colunas: '<rect x="4" y="12" width="4" height="8"/><rect x="10" y="6" width="4" height="14"/><rect x="16" y="9" width="4" height="11"/>',
    area: '<path d="M3 20 L3 13 L8 9 L13 12 L21 5 L21 20 Z"/>',
    rosca: '<path d="M12 3a9 9 0 1 1-9 9h4a5 5 0 1 0 5-5z"/><path d="M12 3v4a5 5 0 0 0-5 5H3a9 9 0 0 1 9-9z" opacity=".5"/>',
    pizza: '<path d="M12 3a9 9 0 1 1-9 9h9z"/><path d="M11 2v9H2a9 9 0 0 1 9-9z" opacity=".55"/>',
    cascata: '<rect x="3" y="12" width="4" height="8"/><rect x="8.5" y="7" width="4" height="5"/><rect x="14" y="7" width="4" height="3" opacity=".55"/><rect x="19" y="10" width="3" height="10"/>',
    imagens: '<circle cx="7" cy="7" r="3.4"/><circle cx="17" cy="7" r="3.4"/><circle cx="7" cy="17" r="3.4"/><circle cx="17" cy="17" r="3.4"/>',
    historia: '<path d="M4 6h16M4 10h11M4 14h16M4 18h8" stroke="currentColor" stroke-width="2" fill="none"/>',
    letreiro: '<rect x="2" y="8" width="20" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 12h8M16 10l3 2-3 2" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    mapa: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="2.4"/><circle cx="15.5" cy="13" r="3.2"/>',
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
    if (v.fmt && v.fmt.livre) return '<div class="pv-vazio pv-vazio--livre"><span>espaço livre</span></div>';
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
    var numerico = pts.length && pts.every(function (p) { return typeof p.c === "number"; });
    if (ordenarPorValor && !cat.nivel && !numerico && !(v.ordem === "eixo")) pts.sort(function (a, b) { return paraNum(b.valor) - paraNum(a.valor); });
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
      var txt = formatar(val, M.formatoCampo(c), v.fmt.unidades === "nenhum" ? "celula" : "cartao");
      return '<div class="pv-cartao' + (eBlank(val) ? " pv-cartao--branco" : "") + '"><b' + (v.fmt.tamanho ? ' style="font-size:calc(' + v.fmt.tamanho + 'px * var(--e, 1))"' : "") + ">" + esc(txt) + "</b>" +
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

  RENDER.pizza = function (ctx, v, sim) { return RENDER.rosca(ctx, v, sim, true); };
  RENDER.rosca = function (ctx, v, sim, pizza) {
    if (!v.campos.valores.length || (!v.campos.eixo.length && v.campos.valores.length < 2)) return placeholder(v);
    var M = ctx.modelo, fmtV = M.formatoCampo(v.campos.valores[0]);
    /* sem Legenda e com duas medidas em Valores, cada fatia é uma medida (% Margem e o complemento) */
    var pts = v.campos.eixo.length ? serie(ctx, v, true) : v.campos.valores.map(function (c) {
      return { c: nomeCampo(c), rotulo: nomeCampo(c), valor: M.valorCampo(c, ctx.filtros) };
    }).filter(function (p) { return !eBlank(p.valor) && paraNum(p.valor) > 0; });
    var W = v.w, H = v.h - 34, cx = W / 2, cy = H / 2 + 4, r = Math.min(W * 0.26, H * 0.36), r2 = pizza ? 0 : r * 0.6;
    var tot = pts.reduce(function (s, p) { return s + paraNum(p.valor); }, 0) || 1, a = -Math.PI / 2;
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '">';
    pts.forEach(function (p, i) {
      var frac = paraNum(p.valor) / tot, b = a + frac * Math.PI * 2, grande = frac > 0.5 ? 1 : 0;
      var cor = (v.fmt.cores && v.fmt.cores[p.c]) || CORES[i % CORES.length];
      function pt(ang, raio) { return (cx + raio * Math.cos(ang)).toFixed(1) + " " + (cy + raio * Math.sin(ang)).toFixed(1); }
      var d = pizza
        ? (frac >= 0.9999 ? "M" + pt(-Math.PI / 2, r) + " A" + r + " " + r + " 0 1 1 " + pt(Math.PI * 1.5 - 0.001, r) + " Z"
          : "M" + cx.toFixed(1) + " " + cy.toFixed(1) + " L" + pt(a, r) + " A" + r + " " + r + " 0 " + grande + " 1 " + pt(b, r) + " Z")
        : frac >= 0.9999
        ? "M" + pt(-Math.PI / 2, r) + " A" + r + " " + r + " 0 1 1 " + pt(Math.PI * 1.5 - 0.001, r) + " L" + pt(Math.PI * 1.5 - 0.001, r2) + " A" + r2 + " " + r2 + " 0 1 0 " + pt(-Math.PI / 2, r2) + " Z"
        : "M" + pt(a, r) + " A" + r + " " + r + " 0 " + grande + " 1 " + pt(b, r) + " L" + pt(b, r2) + " A" + r2 + " " + r2 + " 0 " + grande + " 0 " + pt(a, r2) + " Z";
      var rot = v.fmt.rotulos === false ? "" : v.fmt.estiloRotulo === "ambos" ? p.rotulo + " " + formatar(p.valor, fmtV, "rotulo") : p.rotulo + " " + decimal(frac * 100, 2) + "%";
      var meio = (a + b) / 2, lx = cx + (r + 16) * Math.cos(meio), ly = cy + (r + 16) * Math.sin(meio);
      s += '<g class="pv-cat' + (p.apagado ? " pv-apagado" : "") + '" data-cat="' + esc(JSON.stringify(p.c)) + '"><path d="' + d + '" fill="' + cor + '"><title>' + esc(p.rotulo + ": " + formatar(p.valor, M.formatoCampo(v.campos.valores[0]), "celula")) + "</title></path>" +
        '<text class="pv-rotulo" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + (Math.cos(meio) >= 0 ? "start" : "end") + '">' + esc(rot) + "</text></g>";
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
        var brutos = vals.map(function (x) { return M.valorCampo(x, f); });
        /* como no Power BI: linha com todas as medidas em branco não aparece */
        if (vals.length && brutos.every(eBlank)) return;
        linhas.push([rotuloCategoria(cats[0], c)].concat(vals.map(function (x, k) { return formatar(brutos[k], M.formatoCampo(x), "celula"); })));
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

  /* mapa esquemático do Brasil (contorno simplificado) com bolhas por loja */
  var BRASIL = [[-51.6,4.2],[-50,1.8],[-49.9,-0.9],[-48.4,-1.4],[-44.3,-2.5],[-41.8,-2.9],[-38.5,-3.7],[-35.3,-5.2],[-34.8,-7.1],[-35,-9],[-37.1,-11],
    [-38.5,-13],[-39,-15],[-39.2,-17.7],[-40.2,-20.3],[-41,-22],[-43.2,-23],[-46.3,-24],[-48.5,-26],[-48.6,-28.5],[-50.2,-30.8],[-52.1,-32.2],
    [-53.4,-33.7],[-53.6,-32.5],[-55.6,-30.9],[-57.6,-30.2],[-55.8,-28.2],[-53.8,-27.1],[-54.6,-25.6],[-54.3,-24],[-55.4,-23.9],[-57.8,-22.1],
    [-58,-20],[-58.2,-17.4],[-60.2,-16.3],[-60.4,-13.5],[-62.2,-12.2],[-63.4,-11.9],[-65.3,-10.8],[-65.4,-9.7],[-68.6,-11],[-70.6,-11],[-72.4,-10],
    [-73.9,-7.4],[-72.9,-5.2],[-70,-4.2],[-69.4,-1.1],[-69.8,1.1],[-67.3,2],[-66.9,1.2],[-64,1.9],[-63.4,3.9],[-60.7,5.2],[-59.8,4],[-59.6,1.9],
    [-56.5,1.9],[-54.2,2.3]];
  /* "Goiás" é um estado: o mapa põe a bolha no meio dele */
  var LUGARES = {
    "São Paulo": [-46.63, -23.55], "Rio de Janeiro": [-43.2, -22.91], "Fortaleza": [-38.54, -3.73], "Salvador": [-38.5, -12.97],
    "Goiás": [-49.8, -15.9], "Recife": [-34.88, -8.05], "Curitiba": [-49.27, -25.43], "Porto Alegre": [-51.23, -30.03], "Belo Horizonte": [-43.94, -19.92]
  };
  RENDER.mapa = function (ctx, v) {
    if (!v.campos.eixo.length) return placeholder(v);
    var pts = v.campos.valores.length ? serie(ctx, v, true) : ctx.modelo.categorias(v.campos.eixo[0], ctx.filtros).map(function (c) { return { c: c, rotulo: String(c), valor: 1 }; });
    var W = v.w, H = v.h - 34, fmt = v.campos.valores.length ? ctx.modelo.formatoCampo(v.campos.valores[0]) : "auto";
    var esc2 = Math.min((W - 20) / 40, (H - 16) / 39.5), ox = (W - 40 * esc2) / 2, oy = (H - 39.5 * esc2) / 2;
    function xy(p) { return [(ox + (p[0] + 74) * esc2).toFixed(1), (oy + (5.5 - p[1]) * esc2).toFixed(1)]; }
    var max = Math.max.apply(null, pts.map(function (p) { return paraNum(p.valor); }).concat([1]));
    var s = '<svg class="pv-svg pv-mapa pv-mapa--' + (v.fmt.estiloMapa || "estrada") + '" viewBox="0 0 ' + W + " " + H + '">' +
      '<rect class="pv-mapa-agua" x="0" y="0" width="' + W + '" height="' + H + '"/>' +
      '<path class="pv-mapa-terra" d="M' + BRASIL.map(function (p) { return xy(p).join(" "); }).join(" L") + ' Z"/>';
    pts.slice().sort(function (a, b) { return paraNum(b.valor) - paraNum(a.valor); }).forEach(function (p) {
      var lugar = LUGARES[p.c];
      if (!lugar) return;
      var c = xy(lugar), r = Math.max(4, Math.sqrt(paraNum(p.valor) / max) * Math.min(W, H) * 0.085);
      s += '<g class="pv-cat' + (p.apagado ? " pv-apagado" : "") + '" data-cat="' + esc(JSON.stringify(p.c)) + '"><circle class="pv-bolha" cx="' + c[0] + '" cy="' + c[1] + '" r="' + r.toFixed(1) + '"><title>' +
        esc(p.rotulo + (v.campos.valores.length ? ": " + formatar(p.valor, fmt, "celula") : "")) + '</title></circle>' + (v.fmt.nomes ? '<text class="pv-mapa-nome" x="' + c[0] + '" y="' + (+c[1] + r + 9).toFixed(1) + '" text-anchor="middle">' + esc(p.rotulo) + "</text>" : "") + "</g>";
    });
    return s + "</svg>";
  };

  /* Gráfico de cascata: cada categoria sobe ou desce a partir do acumulado; a última coluna é o Total */
  RENDER.cascata = function (ctx, v) {
    if (!v.campos.eixo.length || !v.campos.valores.length) return placeholder(v);
    var pts = serie(ctx, v, false), M = ctx.modelo, fmt = M.formatoCampo(v.campos.valores[0]);
    var W = v.w, H = v.h - 34, esq = 10, dir = 10, cima = 20, baixo = 24, ph = H - cima - baixo;
    var acum = 0, barras = pts.map(function (p) { var ini = acum; acum += paraNum(p.valor); return { p: p, ini: ini, fim: acum }; });
    barras.push({ p: { rotulo: "Total", valor: acum, total: true }, ini: 0, fim: acum });
    var max = Math.max.apply(null, barras.map(function (b) { return Math.max(b.ini, b.fim); }).concat([0]));
    var min = Math.min.apply(null, barras.map(function (b) { return Math.min(b.ini, b.fim); }).concat([0]));
    var faixa = (max - min) || 1, slot = (W - esq - dir) / barras.length;
    function y(val) { return cima + (max - val) / faixa * ph; }
    var s = '<svg class="pv-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMinYMin meet">';
    s += '<line class="pv-base" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '"/>';
    barras.forEach(function (b, i) {
      var x = esq + slot * i + slot * 0.15, w = slot * 0.7, topo = y(Math.max(b.ini, b.fim)), alt = Math.max(Math.abs(y(b.ini) - y(b.fim)), 1);
      var cor = b.p.total ? (v.fmt.corTotal || "#118DFF") : paraNum(b.p.valor) >= 0 ? (v.fmt.corSobe || "#3BB273") : (v.fmt.corDesce || "#E1575A");
      var rot = formatar(b.p.valor, fmt, "rotulo"), yRot = paraNum(b.p.valor) >= 0 ? topo - 5 : topo + alt + 12;
      s += '<g class="' + (b.p.total ? "" : "pv-cat") + (b.p.apagado ? " pv-apagado" : "") + '"' + (b.p.total ? "" : ' data-cat="' + esc(JSON.stringify(b.p.c)) + '"') + ">" +
        '<rect x="' + x.toFixed(1) + '" y="' + topo.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + alt.toFixed(1) + '" fill="' + cor + '"><title>' + esc(b.p.rotulo + ": " + formatar(b.p.valor, fmt, "celula")) + "</title></rect>" +
        (v.fmt.rotulos === false ? "" : '<text class="pv-rotulo" x="' + (x + w / 2).toFixed(1) + '" y="' + yRot.toFixed(1) + '" text-anchor="middle">' + esc(rot) + "</text>") +
        '<text class="pv-eixo" x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(cortar(b.p.rotulo, 9)) + "</text></g>";
    });
    return s + "</svg>";
  };

  /* Image Grid (visual personalizado): uma imagem por valor da coluna de endereços.
     As imagens da internet são trocadas pelas cópias locais (cfg.imagens) para funcionar offline. */
  RENDER.imagens = function (ctx, v, sim) {
    if (!v.campos.eixo.length) return placeholder(v);
    var M = ctx.modelo, campo = v.campos.eixo[0], cats = M.categorias(campo, ctx.filtros), mapa = (sim.cfg.imagens || {});
    var sel = ctx.selecao && ctx.selecao.vid === v.id ? ctx.selecao.valores : null;
    return '<div class="pv-imagens" style="--colunas:' + (v.fmt.colunas || 4) + '">' + cats.map(function (c) {
      var img = mapa[c];
      return '<button type="button" class="pv-cat pv-img' + (sel && sel.indexOf(c) === -1 ? " pv-apagado" : "") + (v.fmt.circulo === false ? "" : " pv-img--circulo") + '" data-cat="' + esc(JSON.stringify(c)) + '" title="' + esc(c) + '">' +
        (img ? '<img src="' + esc(img.src) + '" alt="' + esc(img.nome) + '">' : '<span class="pv-img-url">' + esc(c) + "</span>") + "</button>";
    }).join("") + "</div>";
  };

  /* Enlighten Data Story (visual personalizado): o texto com # trocado pelas medidas, na ordem */
  RENDER.historia = function (ctx, v) {
    var M = ctx.modelo, k = 0, campos = v.campos.valores, texto = v.fmt.texto || "Escreva o texto com # no lugar de cada número.";
    var html = esc(texto).replace(/#/g, function () {
      var c = campos[k++];
      if (!c) return "#";
      return "<b>" + esc(formatar(M.valorCampo(c, ctx.filtros), M.formatoCampo(c), "celula")) + "</b>";
    });
    return '<p class="pv-historia">' + html + "</p>";
  };

  /* Scroller (visual personalizado): letreiro com a medida e o desvio de cada categoria */
  RENDER.letreiro = function (ctx, v) {
    if (!v.campos.eixo.length || !v.campos.valores.length) return placeholder(v);
    var M = ctx.modelo, campo = v.campos.eixo[0], abs = v.campos.valores[0], desv = v.campos.valores[1];
    var itens = M.categorias(campo, ctx.filtros).map(function (c) {
      var fs = ctx.filtros.concat([filtroDeValores(M, campo, [c], "let:")]);
      var a = M.valorCampo(abs, fs), d = desv ? M.valorCampo(desv, fs) : null, pos = paraNum(d) >= 0;
      return '<span class="pv-letreiro-item">' + esc(rotuloCategoria(campo, c)) + " <b>" + esc(formatar(a, M.formatoCampo(abs), "celula")) + "</b>" +
        (desv ? ' <em class="' + (pos ? "sobe" : "desce") + '">' + (pos ? "▲" : "▼") + " " + esc(formatar(Math.abs(paraNum(d)), M.formatoCampo(desv), "celula")) + "</em>" : "") + "</span>";
    }).join("");
    return '<div class="pv-letreiro" style="background:' + (v.fmt.fundoLetreiro || "#365160") + '"><div class="pv-letreiro-faixa">' + itens + itens + "</div></div>";
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
    tabelasEntregas().forEach(function (t) { M.addTabela(t); });
    (cfg.relacoes || []).forEach(function (r) {
      var x = M.criarRelacao(r[0], r[1], r[2], r[3]);
      if (x.erro) throw new Error("relação pronta com erro: " + x.erro);
    });
    if (cfg.tabelaMedidas) M.addTabela({ nome: "Medidas", n: 0, colunas: [] }, { soMedidas: true });
    (cfg.colunas || []).forEach(function (c) {
      var r = M.salvarColuna(c.texto, c.tabela || M.tabelas[0].nome);
      if (r.erro) throw new Error("coluna pronta com erro: " + r.erro);
      if (c.formato) r.coluna.formato = c.formato;
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
      fmt: JSON.parse(JSON.stringify(v.fmt || {})), dica: v.dica || null, travado: !!v.travado, ordem: v.ordem,
      topN: v.topN ? JSON.parse(JSON.stringify(v.topN)) : null
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
    this.tabelaSel = cfg.tabelaInicial || (cfg.tabelaMedidas ? "Medidas" : this.modelo.tabelas[0].nome);
    this.viuSemRelacao = false;
    this.paineis = cfg.paineis !== false;
    this.feitas = {};
    this.importados = cfg.importados ? cfg.importados.slice() : [];
    this.relSel = null;
    this.relDlg = null;
    this.arrasto = null;
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
        '<div class="sim-modal" data-r="modal" hidden></div>' +
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
    /* Exibição de modelo: arrastar uma coluna sobre a coluna de outra tabela cria a relação */
    this.raiz.addEventListener("pointerdown", function (ev) {
      var c = ev.target.closest("[data-mvcol]");
      if (!c || self.vista !== "modelo") return;
      ev.preventDefault();
      self.arrasto = { tabela: c.getAttribute("data-tabela"), col: c.getAttribute("data-mvcol"), x: ev.clientX, y: ev.clientY };
      c.classList.add("mv-col--origem");
    });
    this.raiz.addEventListener("pointermove", function (ev) {
      if (!self.arrasto) return;
      var linha = self.el.area.querySelector(".mv-arrasto"), svg = self.el.area.querySelector(".mv-svg");
      if (!linha || !svg) return;
      var r = svg.getBoundingClientRect(), k = 1000 / r.width;
      linha.setAttribute("x1", ((self.arrasto.x - r.left) * k).toFixed(1)); linha.setAttribute("y1", ((self.arrasto.y - r.top) * k).toFixed(1));
      linha.setAttribute("x2", ((ev.clientX - r.left) * k).toFixed(1)); linha.setAttribute("y2", ((ev.clientY - r.top) * k).toFixed(1));
      linha.style.display = "";
    });
    document.addEventListener("pointerup", function (ev) {
      if (!self.arrasto) return;
      var de = self.arrasto, alvo = document.elementFromPoint(ev.clientX, ev.clientY);
      self.arrasto = null;
      var c = alvo && alvo.closest && alvo.closest("[data-mvcol]");
      if (c && self.raiz.contains(c) && c.getAttribute("data-tabela") !== de.tabela) {
        self.novaRelacao(de.tabela, de.col, c.getAttribute("data-tabela"), c.getAttribute("data-mvcol"));
      } else self.renderTela();
    });
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
    var cc = this.campoSel && this.campoSel.col ? this.modelo.col(this.campoSel.tabela, this.campoSel.col) : null;
    var guias = '<div class="app-guias"><span>Arquivo</span><span class="' + (m || cc ? "" : "ativa") + '">Página Inicial</span><span>Inserir</span><span>Modelagem</span><span>Exibição</span>' +
      (m ? '<span class="ativa sim-guia-contexto">Ferramentas de medida</span>' : "") + (cc ? '<span class="ativa sim-guia-contexto">Ferramentas de coluna</span>' : "") + "</div>";
    var grupos = [];
    if (cc) {
      grupos.push('<div class="app-grupo"><div><span class="sim-campo-faixa">Nome <b>' + esc(cc.nome) + "</b></span></div><small>Estrutura</small></div>");
      grupos.push('<div class="app-grupo"><div><label class="sim-campo-faixa">Formato <select data-acao-mudar="formato-col">' +
        [["auto", "Geral"], ["inteiro", "Número inteiro"], ["decimal", "Número decimal"], ["moeda", "Moeda"], ["data", "Data"]].map(function (o) {
          return '<option value="' + o[0] + '"' + ((cc.formato || "auto") === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
        }).join("") + "</select></label></div><small>Formatação</small></div>");
      grupos.push('<div class="app-grupo"><div><span class="sim-campo-faixa">Resumo <b>' + (/inteiro|decimal/.test(cc.tipo) && !/^(mês|ano)/i.test(cc.nome) ? "Soma" : "Não resumir") + "</b></span></div><small>Propriedades</small></div>");
      grupos.push('<div class="app-grupo"><div><button type="button" class="app-btn" data-acao="nova-medida">Nova medida</button>' +
        (cfg.novaColuna ? '<button type="button" class="app-btn" data-acao="nova-coluna">Nova coluna</button>' : "") + "</div><small>Cálculos</small></div>");
    } else if (m) {
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
    if (this.vista === "modelo") {
      grupos.push('<div class="app-grupo"><div><button type="button" class="app-btn" data-acao="rel-gerenciar">Gerenciar relações</button></div><small>Relações</small></div>');
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
      /* Filtros neste visual: Filtragem básica ou N superior pela primeira medida */
      if (!v.travado && v.campos.eixo.length && v.campos.valores.length && ["segmentacao", "cartao", "cartaoMulti", "arvore"].indexOf(v.tipo) === -1) {
        viz += '<div class="sim-filtro-visual"><small>Filtros neste visual · ' + esc(nomeCampo(v.campos.eixo[0])) + "</small>" +
          '<label>Tipo de filtro<select data-acao-mudar="topn-tipo"><option value="">Filtragem básica</option><option value="n"' + (v.topN ? " selected" : "") + ">N superior</option></select></label>" +
          (v.topN ? '<label>Mostrar itens: Em cima<input type="number" min="1" max="50" data-acao-mudar="topn-n" value="' + v.topN.n + '"></label><small>Por valor: ' + esc(nomeCampo(v.campos.valores[0])) + "</small>" : "") + "</div>";
      }
    } else if (!v) {
      viz += '<p class="sim-viz-nome sim-viz-nome--nada">Clique num visual da tela para ver os campos dele.</p>';
    }
    viz += "</div>";
    if (this.vista === "tabela" || this.vista === "modelo") viz = "";   /* nas exibições de tabela e de modelo, só o painel Dados */

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
    /* Filtros neste visual › Tipo de filtro: N superior */
    if (v && v.topN && (!v.topN.auto || (v.campos.eixo.length && v.campos.valores.length))) {
      var tn = v.topN.auto ? { campo: v.campos.eixo[0], por: v.campos.valores[0], n: v.topN.n } : v.topN, base = fs.slice();
      var ordem = M.categorias(tn.campo, base).map(function (c) {
        return { c: c, v: paraNum(M.valorCampo(tn.por, base.concat([filtroDeValores(M, tn.campo, [c], "tn:")])) || 0) };
      }).sort(function (a, b) { return b.v - a.v; });
      fs.push(filtroDeValores(M, tn.campo, ordem.slice(0, tn.n).map(function (x) { return x.c; }), "topn:"));
    }
    return fs;
  };

  Simulador.prototype.renderTela = function () {
    var self = this, cfg = this.cfg;
    if (this.vista === "tabela") { this.renderVistaTabela(); return; }
    if (this.vista === "modelo") { this.renderModelo(); return; }
    var canvas = cfg.layout === "tela";
    if (!this.modelo.relacoes.length) this.viuSemRelacao = true;
    var html = '<div class="sim-tela' + (canvas ? " sim-tela--livre" : " sim-tela--grade") + '" data-acao="tela"' +
      (cfg.fundo ? ' style="background-image:url(' + esc(cfg.fundo) + ')"' : cfg.fundoCor ? ' style="background-color:' + esc(cfg.fundoCor) + '"' : "") + ">";
    this.visuais.forEach(function (v) {
      var estilo = canvas
        ? "left:" + (v.x / 12.8).toFixed(3) + "%;top:" + (v.y / 7.2).toFixed(3) + "%;width:" + (v.w / 12.8).toFixed(3) + "%;height:" + (v.h / 7.2).toFixed(3) + "%"
        : "flex-basis:" + v.w + "px;max-width:" + Math.round(v.w * 1.6) + "px;height:" + v.h + "px";
      if (v.fmt.fundo) estilo += ";background-color:" + v.fmt.fundo;
      html += '<div class="pv pv--' + v.tipo + (v.fmt.borda ? " pv--borda" : "") + (self.sel === v.id ? " pv--sel" : "") + '" data-v="' + v.id + '" style="' + estilo + '">' + renderVisual(self, v, self.filtrosDe(v)) + "</div>";
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
        return "<td" + (num ? ' class="num"' : "") + (c.calc ? ' data-calc="1"' : "") + ">" + esc(c.tipo === "data" ? (eBlank(v) ? "" : dataTexto(v)) : formatar(v, c.formato || "auto", "celula")) + "</td>";
      }).join("") + "</tr>";
    }
    html += '</tbody></table></div><p class="nota-demo">Tabela: ' + esc(t.nome) + " · " + t.n.toLocaleString("pt-BR") + " linhas · mostrando as " + max + " primeiras" +
      "</p></div>";
    this.el.area.innerHTML = html;
  };

  /* ---------- exibição de modelo ---------- */
  var MV = { larg: 230, cab: 30, linha: 22 };
  Simulador.prototype.renderModelo = function () {
    var self = this, M = this.modelo, pos = this.cfg.diagrama || {}, H = this.cfg.alturaDiagrama || 520;
    var caixas = {};
    M.tabelas.forEach(function (t, i) {
      var p = pos[t.nome] || [20 + (i % 4) * 245, 20 + Math.floor(i / 4) * 260];
      caixas[t.nome] = { x: p[0], y: p[1], t: t };
    });
    function yCol(nome, col) {
      var b = caixas[nome], idx = b.t.colunas.map(function (c) { return c.nome; }).indexOf(col);
      return b.y + MV.cab + idx * MV.linha + MV.linha / 2;
    }
    var linhas = M.relacoes.map(function (r) {
      var A = caixas[r.muitos.tabela], B = caixas[r.um.tabela];
      var ya = yCol(r.muitos.tabela, r.muitos.col), yb = yCol(r.um.tabela, r.um.col), xa, xb;
      if (B.x > A.x + MV.larg) { xa = A.x + MV.larg; xb = B.x; } else if (A.x > B.x + MV.larg) { xa = A.x; xb = B.x + MV.larg; } else { xa = A.x + MV.larg; xb = B.x + MV.larg; }
      var dx = Math.max(40, Math.abs(xb - xa) / 2) * (xb >= xa ? 1 : -1);
      var c1 = xa === xb ? xa + 60 : xa + dx, c2 = xa === xb ? xb + 60 : xb - dx;
      var sel = self.relSel === r.id, meio = [(xa + xb) / 2, (ya + yb) / 2];
      return '<g class="mv-rel' + (sel ? " mv-rel--sel" : "") + '" data-acao="rel-sel" data-id="' + r.id + '">' +
        '<path class="mv-rel-toque" d="M' + xa + " " + ya + " C" + c1 + " " + ya + " " + c2 + " " + yb + " " + xb + " " + yb + '"/>' +
        '<path class="mv-rel-linha" d="M' + xa + " " + ya + " C" + c1 + " " + ya + " " + c2 + " " + yb + " " + xb + " " + yb + '"/>' +
        '<text class="mv-card" x="' + (xa + (xb >= xa ? 10 : -10)) + '" y="' + (ya - 6) + '" text-anchor="' + (xb >= xa ? "start" : "end") + '">' + (r.card === "1:1" ? "1" : "*") + "</text>" +
        '<text class="mv-card" x="' + (xb + (xb >= xa ? -10 : 10)) + '" y="' + (yb - 6) + '" text-anchor="' + (xb >= xa ? "end" : "start") + '">1</text>' +
        '<text class="mv-seta" x="' + meio[0].toFixed(0) + '" y="' + (meio[1] + 5).toFixed(0) + '" text-anchor="middle">' + (r.card === "1:1" ? "⇄" : xb >= xa ? "◀" : "▶") + "</text></g>";
    }).join("");
    var tabelas = M.tabelas.filter(function (t) { return !t.soMedidas; }).map(function (t) {
      var b = caixas[t.nome], h = MV.cab + t.colunas.length * MV.linha;
      return '<g class="mv-tab"><rect class="mv-caixa" x="' + b.x + '" y="' + b.y + '" width="' + MV.larg + '" height="' + h + '" rx="6"/>' +
        '<rect class="mv-cabeca" x="' + b.x + '" y="' + b.y + '" width="' + MV.larg + '" height="' + MV.cab + '" rx="6"/>' +
        '<text class="mv-nome" x="' + (b.x + 12) + '" y="' + (b.y + 20) + '">' + esc(t.nome) + "</text>" +
        t.colunas.map(function (c, i) {
          var y = b.y + MV.cab + i * MV.linha;
          return '<g class="mv-col" data-mvcol="' + esc(c.nome) + '" data-tabela="' + esc(t.nome) + '"><rect x="' + (b.x + 1) + '" y="' + y + '" width="' + (MV.larg - 2) + '" height="' + MV.linha + '"/>' +
            '<text class="mv-col-ico" x="' + (b.x + 12) + '" y="' + (y + 15) + '">' + (c.calc ? "fx" : /inteiro|decimal/.test(c.tipo) ? "Σ" : c.tipo === "data" ? "▦" : "") + "</text>" +
            '<text class="mv-col-nome" x="' + (b.x + 30) + '" y="' + (y + 15) + '">' + esc(c.nome) + "</text></g>";
        }).join("") + "</g>";
    }).join("");
    var r = this.relSel ? M.relacoes.filter(function (x) { return x.id === self.relSel; })[0] : null;
    var info = r ? '<div class="mv-info"><span><b>' + esc(r.muitos.tabela) + "</b> (" + esc(r.muitos.col) + ") " + (r.card === "1:1" ? "1 — 1" : "* — 1") + " <b>" + esc(r.um.tabela) + "</b> (" + esc(r.um.col) + ")" +
      (r.semPar ? " · " + r.semPar.toLocaleString("pt-BR") + " linhas sem par" : "") + '</span><button type="button" class="app-btn" data-acao="rel-excluir" data-id="' + r.id + '">Excluir</button></div>' : "";
    this.el.area.innerHTML = '<div class="mv">' + info + '<svg class="mv-svg" viewBox="0 0 1000 ' + H + '" role="img" aria-label="Exibição de modelo">' + linhas + tabelas +
      '<line class="mv-arrasto" x1="0" y1="0" x2="0" y2="0" style="display:none"/></svg>' +
      '<p class="nota-demo">Arraste uma coluna sobre a coluna da outra tabela para criar a relação · clique numa linha para ver ou excluir</p></div>';
  };

  Simulador.prototype.novaRelacao = function (ta, ca, tb, cb) {
    var r = this.modelo.criarRelacao(ta, ca, tb, cb);
    if (r.erro) { this.avisar(r.erro); if (this.relDlg && this.relDlg.novo) this.relDlg.erro = r.erro; this.render(); return false; }
    this.relSel = r.relacao.id;
    this.selecao = null;
    this.avisar("Relação criada: " + r.relacao.muitos.tabela + " (" + r.relacao.muitos.col + ") " + (r.relacao.card === "1:1" ? "1:1" : "*:1") + " " + r.relacao.um.tabela + " (" + r.relacao.um.col + ").");
    this.render();
    return true;
  };

  function nomeCard(M, ta, ca, tb, cb) {
    var A = M.tabela(ta), B = M.tabela(tb);
    if (!A || !B || !M.col(A, ca) || !M.col(B, cb)) return "";
    var ua = M.unica(A, ca), ub = M.unica(B, cb);
    return ua && ub ? "Um para um (1:1)" : ua ? "Um para muitos (1:*)" : ub ? "Muitos para um (*:1)" : "Muitos para muitos (*:*)";
  }

  Simulador.prototype.renderModal = function () {
    var d = this.relDlg, m = this.el.modal, M = this.modelo;
    if (!d) { m.hidden = true; m.innerHTML = ""; return; }
    m.hidden = false;
    var tabs = M.tabelas.filter(function (t) { return !t.soMedidas; });
    function opcoes(lista, atual) { return lista.map(function (n) { return "<option" + (n === atual ? " selected" : "") + ">" + esc(n) + "</option>"; }).join(""); }
    function cols(t) { var x = M.tabela(t); return x ? x.colunas.map(function (c) { return c.nome; }) : []; }
    var linhas = M.relacoes.length ? M.relacoes.map(function (r) {
      return "<tr><td>✓</td><td>" + esc(r.muitos.tabela) + " (" + esc(r.muitos.col) + ")</td><td>" + esc(r.um.tabela) + " (" + esc(r.um.col) + ")</td><td>" + (r.card === "1:1" ? "1:1" : "*:1") +
        '</td><td><button type="button" class="app-btn" data-acao="rel-excluir" data-id="' + r.id + '">Excluir</button></td></tr>';
    }).join("") : '<tr><td colspan="5" class="sim-vazio">Nenhuma relação ainda.</td></tr>';
    var html = '<div class="sim-dialogo" role="dialog" aria-modal="true"><h4>Gerenciar relações</h4>' +
      '<table class="sim-rel-lista"><thead><tr><th>Ativa</th><th>De: Tabela (Coluna)</th><th>Para: Tabela (Coluna)</th><th>Cardinalidade</th><th></th></tr></thead><tbody>' + linhas + "</tbody></table>" +
      '<div class="sim-dialogo-botoes"><button type="button" class="app-btn" data-acao="rel-novo">Novo relacionamento</button><button type="button" class="app-btn" data-acao="rel-detectar">Detecção automática</button><button type="button" class="app-btn app-btn--primario" data-acao="rel-fechar">Fechar</button></div>';
    if (d.novo) {
      var n = d.novo;
      html += '<fieldset class="sim-rel-novo"><legend>Novo relacionamento</legend>' +
        '<label>Da tabela<select data-acao-mudar="rel-ta">' + opcoes(tabs.map(function (t) { return t.nome; }), n.ta) + "</select></label>" +
        '<label>Coluna<select data-acao-mudar="rel-ca">' + opcoes(cols(n.ta), n.ca) + "</select></label>" +
        '<label>Para a tabela<select data-acao-mudar="rel-tb">' + opcoes(tabs.map(function (t) { return t.nome; }), n.tb) + "</select></label>" +
        '<label>Coluna<select data-acao-mudar="rel-cb">' + opcoes(cols(n.tb), n.cb) + "</select></label>" +
        "<p>Cardinalidade: <b>" + esc(nomeCard(M, n.ta, n.ca, n.tb, n.cb)) + "</b> · Direção do filtro cruzado: <b>Único</b></p>" +
        (d.erro ? '<p class="sim-dialogo-erro">' + esc(d.erro) + "</p>" : "") +
        '<div class="sim-dialogo-botoes"><button type="button" class="app-btn app-btn--primario" data-acao="rel-salvar">Salvar</button><button type="button" class="app-btn" data-acao="rel-cancelar">Cancelar</button></div></fieldset>';
    }
    m.innerHTML = html + "</div>";
  };

  /* ao trocar a tabela, a coluna de mesmo nome (se houver) já vem escolhida — confira */
  Simulador.prototype.colunaPar = function (tabela, nomeOutra) {
    var t = this.modelo.tabela(tabela);
    if (!t) return "";
    var igual = this.modelo.col(t, nomeOutra);
    return igual ? igual.nome : t.colunas[0].nome;
  };

  Simulador.prototype.renderTrilho = function () {
    if (!this.el.trilho) return;
    var v = this.vista;
    this.el.trilho.innerHTML =
      '<button type="button" class="pbi-ico' + (v === "relatorio" ? " ativo" : "") + '" data-acao="vista" data-vista="relatorio" title="Exibição de relatório"><svg viewBox="0 0 24 24"><rect x="4" y="12" width="3.4" height="8"/><rect x="10.3" y="7" width="3.4" height="13"/><rect x="16.6" y="3" width="3.4" height="17"/></svg></button>' +
      '<button type="button" class="pbi-ico' + (v === "tabela" ? " ativo" : "") + '" data-acao="vista" data-vista="tabela" title="Exibição de tabela"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M3 15h18M9.5 4v16M15 4v16" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>' +
      (this.cfg.vistaModelo ? '<button type="button" class="pbi-ico' + (v === "modelo" ? " ativo" : "") + '" data-acao="vista" data-vista="modelo" title="Exibição de modelo"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="8" height="7" rx="1"/><rect x="14" y="3" width="8" height="7" rx="1"/><rect x="8" y="14" width="8" height="7" rx="1"/><path d="M6 10v3h6v1M18 10v3h-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>' : "");
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
    this.renderModal();
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
      if (!campo.med && numerico && pocos.indexOf("eixo") !== -1 && /^(ano|id|numero|número|mês|mes)\b/i.test(campo.col)) numerico = false;
      var destino;
      if (v.tipo === "segmentacao") destino = "eixo";
      else if (v.tipo === "tabela") destino = numerico ? "valores" : "eixo";
      else if (v.tipo === "arvore") destino = campo.med || numerico ? "valores" : "explicar";
      else if (numerico && pocos.indexOf("valores") !== -1) destino = "valores";
      else if (pocos.indexOf("eixo") !== -1) destino = "eixo";
      else destino = "valores";
      if (!campo.med && destino === "valores" && !numerico) campo.agg = /^cartao/.test(v.tipo) ? "primeiro" : "contagem";
      if (!campo.med && destino === "valores" && numerico) campo.agg = "soma";
      var um = (destino === "eixo" && v.tipo !== "tabela") || (destino === "valores" && /medidor|barras|colunas|area|pizza|mapa|funil|sparkline|arvore|cascata/.test(v.tipo)) ||
        (destino === "valores" && v.tipo === "rosca" && v.campos.eixo.length);
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
    v.fmt.livre = false;
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
      case "vista": this.vista = a.getAttribute("data-vista"); this.relSel = null; this.render(); return;
      case "rel-gerenciar": this.relDlg = { novo: null, erro: null }; this.renderModal(); return;
      case "rel-fechar": this.relDlg = null; this.render(); return;
      case "rel-novo":
        var t0 = this.modelo.tabelas[0].nome, t1 = this.modelo.tabelas[1].nome;
        this.relDlg = { novo: { ta: t0, ca: this.modelo.tabelas[0].colunas[0].nome, tb: t1, cb: this.colunaPar(t1, this.modelo.tabelas[0].colunas[0].nome) }, erro: null };
        this.renderModal(); return;
      case "rel-cancelar": this.relDlg.novo = null; this.relDlg.erro = null; this.renderModal(); return;
      case "rel-salvar":
        var nv = this.relDlg.novo;
        if (this.novaRelacao(nv.ta, nv.ca, nv.tb, nv.cb)) { this.relDlg.novo = null; this.relDlg.erro = null; this.render(); }
        return;
      case "rel-detectar":
        var criadas = this.modelo.detectar();
        this.detectou = true;
        this.avisar(criadas.length ? "Detecção automática: " + criadas.length + " relação(ões) nova(s)." : "Detecção automática: nenhuma relação nova encontrada.");
        this.selecao = null;
        this.render(); return;
      case "rel-excluir":
        this.modelo.excluirRelacao(a.getAttribute("data-id"));
        this.relSel = null; this.selecao = null;
        this.avisar("Relação excluída.");
        this.render(); return;
      case "rel-sel": this.relSel = a.getAttribute("data-id"); this.renderTela(); return;
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
        if (tarefa.tabela) { this.tabelaSel = tarefa.tabela; this.render(); }
        this.renderFaixa();
        /* se o campo da tarefa já existe (por exemplo, salvo com erro), a fórmula vai para ele */
        var nomeT = tarefa.formula.split(" = ")[0].trim(), alvoT = null;
        if (tarefa.coluna) {
          var tt = this.modelo.tabela(tarefa.tabela || this.tabelaSel), cc = tt && this.modelo.col(tt, nomeT);
          if (cc && cc.calc) alvoT = { coluna: cc, tabela: tt.nome };
        } else {
          var mt = this.modelo.medida(nomeT);
          if (mt) { alvoT = { medida: mt, tabela: mt.tabela }; this.campoSel = { med: mt.nome }; }
        }
        this.abrirEdicao(tarefa.coluna ? "coluna" : "medida", tarefa.formula, alvoT);
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
          if (catEl && alvoV && alvoV.campos.eixo.length && /barras|colunas|area|rosca|pizza|mapa|funil|cascata|imagens|tabela/.test(alvoV.tipo)) {
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
    } else if (/^rel-(ta|ca|tb|cb)$/.test(acao)) {
      var n = this.relDlg.novo, k = acao.slice(4);
      n[k] = a.value;
      if (k === "ta") n.ca = this.modelo.tabela(n.ta).colunas[0].nome;
      if (k === "ta" || k === "ca" || k === "tb") n.cb = this.colunaPar(n.tb, n.ca);
      this.relDlg.erro = null;
      this.renderModal();
    } else if (acao === "formato-col") {
      this.modelo.col(this.campoSel.tabela, this.campoSel.col).formato = a.value;
      this.modelo.limpar();
      this.render();
    } else if (acao === "topn-tipo" || acao === "topn-n") {
      var vv = this.visual(this.sel);
      if (!vv) return;
      if (acao === "topn-tipo") vv.topN = a.value ? { auto: true, n: 3 } : null;
      else if (vv.topN) vv.topN.n = Math.max(1, Math.min(50, parseInt(a.value, 10) || 1));
      this.selecao = null;
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

     Cada laboratório começa no ponto da aula em que está: as
     medidas e as relações das seções anteriores vêm prontas.
     As tarefas se marcam sozinhas (o nome da medida é livre).
     ====================================================== */

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
  function medidaCom(sim, valor, tol) {
    return sim.modelo.medidas.filter(function (m) {
      try { var v = sim.modelo.avMedida(m, { filtros: [], linha: null, pilha: [] }); return typeof v === "number" && Math.abs(v - valor) <= tol; } catch (e) { return false; }
    })[0] || null;
  }
  function noVisual(sim, tipo) {
    return sim.visuais.some(function (v) { return (!tipo || v.tipo === tipo) && v.campos.valores.length; });
  }
  function med(n) { return { med: n }; }
  function col(t, c, extra) { var o = { tabela: t, col: c }; for (var k in extra || {}) o[k] = extra[k]; return o; }

  /* ---------- Estudo de caso: empresa de entregas ---------- */
  var EN = "Entregas", ER = "Entregadores", EC = "Empresas Clientes", VE = "Veículos";
  var REL = [
    [EN, "CPF do Entregador", ER, "CPF"],
    [EN, "CNPJ do Solicitante", EC, "CNPJ"],
    [EN, "Placa do Veículo", VE, "Placa"]
  ];
  var DIAGRAMA = { Entregadores: [20, 30], Entregas: [385, 110], "Empresas Clientes": [750, 20], "Veículos": [750, 320] };
  var COLS = [
    { texto: "Manutenção em Breve = IF(Veículos[Quilometragem da Próxima Revisão] - Veículos[Quilometragem rodada] <= 10000, \"Sim\", \"Não\")", tabela: VE },
    { texto: "Taxa por Porte = SWITCH(RELATED('Empresas Clientes'[Porte]), \"Pequeno\", 0.05, \"Médio\", 0.08, \"Grande\", 0.095)", tabela: EN, formato: "pct" },
    { texto: "Faturamento da Entrega = Entregas[Valor Final da Entrega] * (1 + Entregas[Taxa por Porte])", tabela: EN, formato: "moeda" }
  ];
  var MED = [
    { texto: "Total de Entregas = COUNTROWS(Entregas)", tabela: EN },
    { texto: "Faturamento Entregas = SUM(Entregas[Faturamento da Entrega])", tabela: EN, formato: "moeda" },
    { texto: "Faturamento com Contratos = SUM('Empresas Clientes'[Valor mensal do contrato])", tabela: EC, formato: "moeda" },
    { texto: "Faturamento Total = [Faturamento Entregas] + [Faturamento com Contratos]", tabela: EN, formato: "moeda" },
    { texto: "Despesa com Salários = SUM(Entregadores[Salário Mensal])", tabela: ER, formato: "moeda" },
    { texto: "Lucro = [Faturamento Total] - [Despesa com Salários]", tabela: EN, formato: "moeda" }
  ];
  /* valores de conferência (calculados a partir da planilha) */
  var FAT_A = 186333.07, FAT_B = 531055.76, CONTRATOS = 651204.58, SAL_TODOS = 317315.90, SAL_ATIVOS = 231068.30;

  function relacao(s, ta, ca, tb, cb) {
    return s.modelo.relacoes.some(function (r) { return r.muitos.tabela === ta && r.muitos.col === ca && r.um.tabela === tb && r.um.col === cb; });
  }
  function colunaCalc(s, tabela, f) {
    var t = s.modelo.tabela(tabela);
    return !!t && t.colunas.some(function (c) { return c.calc && f(c); });
  }
  function soma(d) { var x = 0; d.forEach(function (v) { if (typeof v === "number") x += v; }); return x; }
  function medidaVale(s, alvos, tol) {
    return s.modelo.medidas.filter(function (m) {
      if (m.erro) return false;
      try { var v = s.modelo.avMedida(m, { filtros: [], linha: null, pilha: [] }); return typeof v === "number" && alvos.some(function (a) { return Math.abs(v - a) <= tol; }); } catch (e) { return false; }
    })[0] || null;
  }
  function moeda(m) { return !!m && m.formato === "moeda"; }

  SIMS.modelo = {
    vistaTabela: true, vistaModelo: true, vista: "modelo", diagrama: DIAGRAMA, alturaDiagrama: 560, arquivo: "Estudo de Caso",
    medidas: [MED[0]],
    visuais: [
      { id: "t1", tipo: "tabela", eixo: [col(ER, "Nome Completo")], valores: [med("Total de Entregas")], w: 430, h: 330 },
      { id: "c1", tipo: "colunas", eixo: [col(EC, "Porte")], valores: [med("Total de Entregas")], w: 470, h: 330, fmt: { rotulos: true } }
    ],
    tarefas: [
      { texto: "Clique em <b>Gerenciar relações › Detecção automática</b>. Quantas relações ela achou? Por quê?", teste: function (s) { return !!s.detectou; } },
      { texto: "Na Exibição de modelo, arraste <b>Entregas[CPF do Entregador]</b> até <b>Entregadores[CPF]</b>.", teste: function (s) { return relacao(s, EN, "CPF do Entregador", ER, "CPF"); } },
      { texto: "Ligue <b>Entregas[CNPJ do Solicitante]</b> a <b>Empresas Clientes[CNPJ]</b>.", teste: function (s) { return relacao(s, EN, "CNPJ do Solicitante", EC, "CNPJ"); } },
      { texto: "Ligue <b>Entregas[Placa do Veículo]</b> a <b>Veículos[Placa]</b>.", teste: function (s) { return relacao(s, EN, "Placa do Veículo", VE, "Placa"); } },
      { texto: "Volte à <b>Exibição de relatório</b>: cada entregador e cada porte agora têm a sua contagem.", teste: function (s) { return s.modelo.relacoes.length >= 3 && s.vista === "relatorio"; } }
    ]
  };

  SIMS.colunas = {
    novaColuna: true, vistaTabela: true, vistaModelo: true, vista: "tabela", diagrama: DIAGRAMA, alturaDiagrama: 560, relacoes: REL, arquivo: "Estudo de Caso",
    tabelaInicial: VE,
    visuais: [],
    tarefas: [
      { texto: "Em <b>Veículos</b>: a manutenção deve ser feita em breve quando faltam <b>10.000 km ou menos</b> para a próxima revisão.", coluna: true, tabela: VE, formula: COLS[0].texto,
        teste: function (s) { return colunaCalc(s, VE, function (c) { return c.dados.filter(function (v) { return v === "Sim"; }).length === 111; }); } },
      { texto: "Em <b>Entregas</b>: a taxa pelo porte da empresa que pediu a entrega (Pequeno 5%, Médio 8%, Grande 9,5%). O porte está na outra tabela: RELATED.", coluna: true, tabela: EN, formula: COLS[1].texto,
        teste: function (s) { return colunaCalc(s, EN, function (c) { var d = c.dados; return d.every(function (v) { return v === 0.05 || v === 0.08 || v === 0.095; }); }); } },
      { texto: "Em <b>Entregas</b>: o faturamento de cada entrega com a taxa que a turma decidiu.", coluna: true, tabela: EN, formula: COLS[2].texto,
        teste: function (s) { return colunaCalc(s, EN, function (c) { var x = soma(c.dados); return Math.abs(x - FAT_A) < 1 || Math.abs(x - FAT_B) < 1; }); } }
    ]
  };

  SIMS.medidas = {
    arquivo: "Estudo de Caso", relacoes: REL, colunas: COLS, tabelaInicial: EN,
    visuais: [
      { id: "k1", tipo: "cartao", w: 250, h: 220, fmt: { unidades: "nenhum" } },
      { id: "k2", tipo: "cartao", w: 250, h: 220, fmt: { unidades: "nenhum" } },
      { id: "k3", tipo: "cartao", w: 250, h: 220, fmt: { unidades: "nenhum" } },
      { id: "k4", tipo: "cartao", w: 250, h: 220, fmt: { unidades: "nenhum" } },
      { id: "k5", tipo: "cartao", w: 250, h: 220, fmt: { unidades: "nenhum" } },
      { id: "k6", tipo: "cartao", w: 250, h: 220, fmt: { unidades: "nenhum" } }
    ],
    selecionado: "k1",
    tarefas: [
      { texto: "Quantas entregas a empresa fez? Uma linha da tabela Entregas é uma entrega.", formula: MED[0].texto, tabela: EN, teste: function (s) { return !!medidaVale(s, [4598], 0.1); } },
      { texto: "Quanto as entregas faturaram? A soma da coluna que a turma criou. Formato Moeda.", formula: MED[1].texto, tabela: EN, teste: function (s) { return moeda(medidaVale(s, [FAT_A, FAT_B], 1)); } },
      { texto: "Quanto os contratos faturam por mês? Clique em <b>Empresas Clientes</b> antes de criar. Formato Moeda.", formula: MED[2].texto, tabela: EC, teste: function (s) { return moeda(medidaVale(s, [CONTRATOS], 1)); } },
      { texto: "Faturamento Total: entregas mais contratos.", formula: MED[3].texto, tabela: EN, teste: function (s) { return moeda(medidaVale(s, [FAT_A + CONTRATOS, FAT_B + CONTRATOS], 1)); } },
      { texto: "A despesa com salários dos entregadores. Formato Moeda.", formula: MED[4].texto, tabela: ER, teste: function (s) { return moeda(medidaVale(s, [SAL_TODOS, SAL_ATIVOS], 1)); } },
      { texto: "Lucro: o que sobra do faturamento depois dos salários.", formula: MED[5].texto, tabela: EN, teste: function (s) {
        return s.modelo.medidas.some(function (m) { return !m.erro && /lucro/i.test(m.nome) && /-/.test(m.texto); });
      } },
      { texto: "Coloque as seis medidas nos seis cartões.", teste: function (s) { return s.visuais.filter(function (v) { return v.campos.valores.length; }).length >= 6; } }
    ]
  };

  /* o relatório sobre o fundo de exemplo: espaços do fundo, em 1280 × 720 */
  function caixa(id, tipo, x, y, w, h, extra) {
    var v = { id: id, tipo: tipo, x: x + 3, y: y + 3, w: w - 6, h: h - 6, fmt: { titulo: false, unidades: "nenhum", tamanho: 22, livre: !(extra && extra.valores) } };
    for (var k in extra || {}) { if (k === "fmt") { for (var f in extra.fmt) v.fmt[f] = extra.fmt[f]; } else v[k] = extra[k]; }
    return v;
  }
  SIMS.relatorio = {
    arquivo: "Estudo de Caso", relacoes: REL, colunas: COLS, medidas: MED, layout: "tela", escuro: true, fundo: "img/fundo-exemplo.jpg", tabelaInicial: EN,
    visuais: [
      caixa("s1", "cartao", 45, 120, 224, 67),
      caixa("s2", "cartao", 45, 202, 224, 134, { valores: [med("Total de Entregas")], fmt: { titulo: "Total de Entregas", tamanho: 34 } }),
      caixa("s3", "cartao", 301, 120, 285, 67, { valores: [med("Faturamento Total")] }),
      caixa("s4", "cartao", 301, 195, 285, 67, { valores: [med("Despesa com Salários")] }),
      caixa("s5", "cartao", 301, 269, 285, 67, { valores: [med("Lucro")] }),
      caixa("s6", "cartao", 640, 120, 285, 67, { valores: [med("Faturamento Entregas")] }),
      caixa("s7", "cartao", 948, 120, 285, 67),
      caixa("s8", "cartao", 640, 209, 285, 67, { valores: [med("Faturamento com Contratos")] }),
      caixa("s9", "cartao", 948, 209, 285, 67),
      caixa("s10", "cartao", 35, 360, 593, 215, { fmt: { titulo: undefined } }),
      caixa("s11", "cartao", 792, 315, 289, 204, { fmt: { titulo: undefined } }),
      caixa("s12", "cartao", 640, 557, 593, 130, { fmt: { titulo: undefined } })
    ],
    tarefas: [
      { texto: "Escolha um espaço vazio, um tipo de visual em <b>Visualizações</b> e os campos de uma análise da turma.", teste: function (s) {
        return ["s1", "s7", "s9", "s10", "s11", "s12"].some(function (id) { var v = s.visual(id); return v && (v.campos.valores.length || v.campos.eixo.length); });
      } },
      { texto: "Preencha <b>todos</b> os espaços vazios do fundo.", teste: function (s) {
        return ["s1", "s7", "s9", "s10", "s11", "s12"].every(function (id) { var v = s.visual(id); return v && (v.campos.valores.length || v.campos.eixo.length); });
      } },
      { texto: "Use uma <b>segmentação de dados</b> e confira quais números mudam quando você escolhe um mês (e quais não mudam).", teste: function (s) {
        return s.visuais.some(function (v) { return v.tipo === "segmentacao" && v.campos.eixo.length; }) && Object.keys(s.seg).some(function (k) { return s.seg[k] && s.seg[k].length; });
      } },
      { texto: "Em algum gráfico, use <b>Filtros neste visual › N superior</b> para mostrar só os primeiros.", teste: function (s) { return s.visuais.some(function (v) { return !!v.topN; }); } }
    ]
  };

  /* inicializa todos os simuladores da página */
  document.querySelectorAll("[data-sim]").forEach(function (el) {
    var cfg = SIMS[el.getAttribute("data-sim")];
    if (!cfg) return;
    if (!window.DADOS_ENTREGAS) { el.textContent = "Os dados da aula não carregaram (js/dados-entregas.js)."; return; }
    INSTANCIAS.push(new Simulador(el, cfg));
  });

  /* exposto para os laboratórios simples do aula.js e para testes */
  window.PBI = {
    Modelo: Modelo, novoModelo: novoModelo, formatar: formatar, valorPbi: valorPbi, BRASIL: BRASIL,
    instancias: INSTANCIAS, SIMS: SIMS, DaxErro: DaxErro, lexDax: lexDax, parseDax: parseDax
  };
})();
