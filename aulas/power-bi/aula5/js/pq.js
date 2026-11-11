/* =========================================================
   pq.js — simulador do Editor do Power Query (aula 5)

   O editor das aulas 3 e 4, agora com as quatro abas da
   DadosEmpresaEntregas.xlsx e os comandos que o estudo de caso
   pede: Dividir Coluna por Delimitador, Substituir Valores,
   Data › Somente Data e Hora › Somente Hora. Cada comando vira
   uma etapa aplicada (com a fórmula M), clicar numa etapa mostra
   a tabela daquele momento e o ✕ apaga a etapa.

   1. Utilidades: valores, datas, erros
   2. Fontes: as planilhas como chegam ao Power Query
   3. Operações (etapas) e a fórmula M de cada uma
   4. Interface: faixa de opções, menus, caixas de diálogo,
      grade com qualidade da coluna, Etapas Aplicadas
   5. Laboratórios desta aula (configuração e tarefas)

   Uso no HTML: <div class="pq-sim" data-pq="entregas"></div>
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
  function mil(n) { return n.toLocaleString("pt-BR"); }
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  /* erro de célula: aparece como "Error" na grade */
  function ErroCel(msg) { this.msg = msg; }
  function eErro(v) { return v instanceof ErroCel; }
  function vazio(v) { return v === null || v === undefined || v === ""; }

  /* erro da etapa inteira (coluna que sumiu, por exemplo) */
  function PQErro(msg) { this.msg = msg; }

  /* datas guardadas como dias desde 01/01/1970 */
  function diaDe(a, m, d) {
    var t = Date.UTC(a, m - 1, d), x = new Date(t);
    if (x.getUTCMonth() !== m - 1 || x.getUTCDate() !== d) return null;
    return Math.round(t / 864e5);
  }
  function partes(dia) { var x = new Date(dia * 864e5); return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]; }
  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function dataTexto(dia) { var p = partes(dia); return dois(p[2]) + "/" + dois(p[1]) + "/" + p[0]; }
  /* data/hora em segundos desde 01/01/1970; hora em segundos do dia */
  function horaTexto(s) { s = ((s % 86400) + 86400) % 86400; return dois(Math.floor(s / 3600)) + ":" + dois(Math.floor(s / 60) % 60) + ":" + dois(s % 60); }
  function dataHoraTexto(s) { return dataTexto(Math.floor(s / 86400)) + " " + horaTexto(s); }
  function isoTexto(s) { var p = partes(Math.floor(s / 86400)); return p[0] + "-" + dois(p[1]) + "-" + dois(p[2]) + " " + horaTexto(s); }

  var LOCALIDADES = {
    "pt-BR": { nome: "Português (Brasil)", ordem: "dma", exemplo: "31/12/2018" },
    "en-US": { nome: "Inglês (Estados Unidos)", ordem: "mda", exemplo: "12/31/2018" },
    "en-GB": { nome: "Inglês (Reino Unido)", ordem: "dma", exemplo: "31/12/2018" },
    "es-ES": { nome: "Espanhol (Espanha)", ordem: "dma", exemplo: "31/12/2018" }
  };
  var TIPOS = {
    texto: { nome: "Texto", icone: "ABC", m: "type text" },
    inteiro: { nome: "Número Inteiro", icone: "123", m: "Int64.Type" },
    decimal: { nome: "Número Decimal", icone: "1.2", m: "type number" },
    data: { nome: "Data", icone: "", m: "type date" },
    datahora: { nome: "Data/Hora", icone: "", m: "type datetime" },
    hora: { nome: "Hora", icone: "", m: "type time" },
    qualquer: { nome: "Qualquer", icone: "ABC123", m: "type any" }
  };

  /* converte um valor para o tipo, com a localidade (texto de data "6/30/2018") */
  function converter(v, tipo, loc) {
    if (vazio(v) && v !== "") return null;
    if (eErro(v)) return v;
    if (tipo === "texto") return typeof v === "number" ? String(v) : String(v);
    if (tipo === "datahora") {
      if (typeof v === "number") return v;
      var mm = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(v));
      if (!mm) return new ErroCel("DataFormat.Error: Não foi possível converter em DateTime.");
      return diaDe(+mm[1], +mm[2], +mm[3]) * 86400 + (+mm[4]) * 3600 + (+mm[5]) * 60 + (+mm[6]);
    }
    if (tipo === "inteiro" || tipo === "decimal") {
      var n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      if (isNaN(n)) return new ErroCel("DataFormat.Error: Não foi possível converter para Número.");
      return tipo === "inteiro" ? Math.round(n) : n;
    }
    if (tipo === "data") {
      if (typeof v === "number") return v;
      var p = String(v).split("/").map(Number);
      if (p.length !== 3 || p.some(isNaN)) return new ErroCel("DataFormat.Error: Não foi possível converter em Data.");
      var o = LOCALIDADES[loc || "pt-BR"].ordem;
      var dia = o === "mda" ? diaDe(p[2], p[0], p[1]) : diaDe(p[2], p[1], p[0]);
      return dia === null ? new ErroCel("DataFormat.Error: Não foi possível converter em Data. Detalhes: " + v) : dia;
    }
    return v;
  }

  /* ======================================================
     2. FONTES
     ====================================================== */

  /* as quatro abas da DadosEmpresaEntregas.xlsx, como o Excel entrega:
     na aba Entregas, 399 linhas em branco formatadas no fim */
  var ARQUIVO = "DadosEmpresaEntregas.xlsx";
  function fonteAba(nome) {
    var D = window.DADOS_ENTREGAS;
    if (nome === "entregas") {
      var E = D.entregas, cad = function (k, i) { return D[k].linhas[i]; };
      var linhas = E.seg.map(function (s, i) {
        return ["ENT" + ("0000" + (i + 1)).slice(-5), cad("entregadores", E.cpf[i])[0], cad("empresas", E.cnpj[i])[0], cad("veiculos", E.placa[i])[1],
          isoTexto(s), E.descricoes[E.desc[i]], E.conteudo[i] / 100, E.final[i] / 100, E.taxa[i] / 100];
      });
      for (var k = 0; k < E.vazias; k++) linhas.push([null, null, null, null, null, null, null, null, null]);
      return { arquivo: ARQUIVO, aba: "Entregas", cab: E.cab, linhas: linhas, tipos: { "Data e Hora da Entrega": "datahora", "Valor do Conteúdo (R$)": "decimal", "Valor Final da Entrega (R$)": "decimal", "Porcentagem de Taxa (%)": "decimal" } };
    }
    var T = { entregadores: ["Entregadores", { "Data de Nascimento": "data", "Data da Contratação": "data", "Data da Demissão": "data", "Salário Mensal": "decimal" }],
      empresas: ["Empresas Clientes", { "Data de Assinatura do Contrato": "data", "Valor mensal do contrato": "decimal" }],
      veiculos: ["Veículos", { "Data da Aquisição": "data" }] }[nome];
    return { arquivo: ARQUIVO, aba: T[0], cab: D[nome].cab, linhas: D[nome].linhas.map(function (l) { return l.slice(); }), tipos: T[1] };
  }
  var FONTES = {};
  function fonte(nome) {
    if (!FONTES[nome]) FONTES[nome] = fonteAba(nome);
    return FONTES[nome];
  }

  /* tabela: { cols: [{nome, tipo}], linhas: [[...]] } — as etapas nunca alteram a anterior */
  function idxCol(t, nome) {
    for (var i = 0; i < t.cols.length; i++) if (t.cols[i].nome === nome) return i;
    throw new PQErro("Expression.Error: A coluna '" + nome + "' da tabela não foi encontrada.");
  }
  function mNome(nome) { return /^[A-Za-zÀ-ú_][\wÀ-ú]*$/.test(nome) ? nome : '#"' + nome + '"'; }
  function lista(nomes) { return "{" + nomes.map(function (n) { return '"' + n + '"'; }).join(", ") + "}"; }

  /* ======================================================
     3. OPERAÇÕES

     Cada etapa: { op, nome, ...parâmetros }. aplicar(t, e)
     devolve a tabela nova; formula(e, anterior) devolve o M.
     ====================================================== */

  var OPS = {
    fonte: {
      aplicar: function (t, e) {
        var f = fonte(e.base);
        var cab = f.cab.map(function (_, i) { return { nome: "Column" + (i + 1), tipo: "qualquer" }; });
        return { cols: cab, linhas: [f.cab.map(function (x) { return x; })].concat(f.linhas) };
      },
      formula: function (e) { return '= Excel.Workbook(File.Contents("C:\\Estudo de Caso\\' + fonte(e.base).arquivo + '"), null, true)'; }
    },
    navegacao: {
      aplicar: function (t) { return t; },
      formula: function (e) { return '= Fonte{[Item="' + fonte(e.base).aba + '",Kind="Sheet"]}[Data]'; }
    },
    promover: {
      aplicar: function (t) {
        var cab = t.linhas[0];
        return { cols: cab.map(function (h, i) { return { nome: h === null ? "Column" + (i + 1) : String(h), tipo: "qualquer" }; }), linhas: t.linhas.slice(1) };
      },
      formula: function (e, ant) { return "= Table.PromoteHeaders(" + mNome(ant) + ", [PromoteAllScalars=true])"; }
    },
    tipoAuto: {
      aplicar: function (t, e) {
        var dica = fonte(e.base || "entregas").tipos || {};
        var cols = t.cols.map(function (c, i) {
          if (dica[c.nome]) return { nome: c.nome, tipo: dica[c.nome] };
          var amostra = t.linhas.slice(0, 200).map(function (l) { return l[i]; }).filter(function (v) { return !vazio(v); });
          var tipo = !amostra.length ? "qualquer" : amostra.every(function (v) { return typeof v === "number"; }) ? "inteiro" : "texto";
          return { nome: c.nome, tipo: tipo };
        });
        /* texto de data e hora ("2024-10-02 18:15:20") vira Data/Hora na detecção automática */
        var conv = cols.map(function (c, i) { return c.tipo === "datahora" ? i : -1; }).filter(function (i) { return i !== -1; });
        return {
          cols: cols,
          linhas: !conv.length ? t.linhas : t.linhas.map(function (l) { var n = l.slice(); conv.forEach(function (i) { if (!vazio(n[i])) n[i] = converter(n[i], "datahora"); }); return n; })
        };
      },
      formula: function (e, ant, t) {
        return "= Table.TransformColumnTypes(" + mNome(ant) + ",{" + t.cols.map(function (c) { return '{"' + c.nome + '", ' + TIPOS[c.tipo].m + "}"; }).join(", ") + "})";
      }
    },
    remover: {
      aplicar: function (t, e) {
        var ids = e.cols.map(function (n) { return idxCol(t, n); });
        var fica = t.cols.map(function (_, i) { return i; }).filter(function (i) { return ids.indexOf(i) === -1; });
        return { cols: fica.map(function (i) { return t.cols[i]; }), linhas: t.linhas.map(function (l) { return fica.map(function (i) { return l[i]; }); }) };
      },
      formula: function (e, ant) { return "= Table.RemoveColumns(" + mNome(ant) + "," + lista(e.cols) + ")"; }
    },
    brancas: {
      aplicar: function (t) {
        return { cols: t.cols, linhas: t.linhas.filter(function (l) { return !l.every(vazio); }) };
      },
      formula: function (e, ant) {
        return "= Table.SelectRows(" + mNome(ant) + ', each not List.IsEmpty(List.RemoveMatchingItems(Record.FieldValues(_), {"", null})))';
      }
    },
    tipo: {
      aplicar: function (t, e) {
        var i = idxCol(t, e.col), loc = e.loc || "pt-BR";
        var cols = t.cols.slice(); cols[i] = { nome: e.col, tipo: e.tipo };
        return {
          cols: cols,
          linhas: t.linhas.map(function (l) { var n = l.slice(); n[i] = converter(l[i], e.tipo, loc); return n; })
        };
      },
      formula: function (e, ant) {
        return "= Table.TransformColumnTypes(" + mNome(ant) + ',{{"' + e.col + '", ' + TIPOS[e.tipo].m + "}}" + (e.loc ? ', "' + e.loc + '"' : "") + ")";
      }
    },
    mesclar: {
      aplicar: function (t, e) {
        var ids = e.cols.map(function (n) { return idxCol(t, n); }), pos = Math.min.apply(null, ids);
        var cols = [], k;
        for (k = 0; k < t.cols.length; k++) {
          if (k === pos) cols.push({ nome: e.novo, tipo: "texto" });
          if (ids.indexOf(k) === -1) cols.push(t.cols[k]);
        }
        return {
          cols: cols,
          linhas: t.linhas.map(function (l) {
            var txt = ids.map(function (i) { return vazio(l[i]) ? "" : t.cols[i].tipo === "data" && !eErro(l[i]) ? dataTexto(l[i]) : eErro(l[i]) ? "Error" : String(l[i]); }).join(e.sep);
            var n = [];
            for (var j = 0; j < t.cols.length; j++) {
              if (j === pos) n.push(txt);
              if (ids.indexOf(j) === -1) n.push(l[j]);
            }
            return n;
          })
        };
      },
      formula: function (e, ant) {
        return "= Table.CombineColumns(" + mNome(ant) + "," + lista(e.cols) + ',Combiner.CombineTextByDelimiter("' + e.sep + '", QuoteStyle.None),"' + e.novo + '")';
      }
    },
    mes: {
      aplicar: function (t, e) {
        var i = idxCol(t, e.col);
        if (t.cols[i].tipo !== "data" && t.cols[i].tipo !== "datahora") throw new PQErro("Expression.Error: Não é possível converter o valor do tipo Text para o tipo Date.");
        var dh = t.cols[i].tipo === "datahora";
        var f = function (v) { if (eErro(v)) return v; if (vazio(v)) return null; var d = dh ? Math.floor(v / 86400) : v; return e.nomeMes ? MESES[partes(d)[1] - 1] : partes(d)[1]; };
        var tipo = e.nomeMes ? "texto" : "inteiro";
        if (e.adicionar) {
          return { cols: t.cols.concat([{ nome: e.novo, tipo: tipo }]), linhas: t.linhas.map(function (l) { return l.concat([f(l[i])]); }) };
        }
        var cols = t.cols.slice(); cols[i] = { nome: t.cols[i].nome, tipo: tipo };
        return { cols: cols, linhas: t.linhas.map(function (l) { var n = l.slice(); n[i] = f(l[i]); return n; }) };
      },
      formula: function (e, ant) {
        var fn = e.nomeMes ? "Date.MonthName" : "Date.Month", tipo = e.nomeMes ? "type text" : "Int64.Type";
        return e.adicionar
          ? "= Table.AddColumn(" + mNome(ant) + ', "' + e.novo + '", each ' + fn + "([" + e.col + "]), " + tipo + ")"
          : "= Table.TransformColumns(" + mNome(ant) + ',{{"' + e.col + '", ' + (e.nomeMes ? "each Date.MonthName(_)" : "Date.Month") + ", " + tipo + "}})";
      }
    },
    /* Tipo Alterado automático que o Power Query põe depois de Dividir Coluna */
    tipoNovas: {
      aplicar: function (t, e) {
        var cols = t.cols.map(function (c, i) {
          if (e.cols.indexOf(c.nome) === -1) return c;
          var amostra = t.linhas.slice(0, 200).map(function (l) { return l[i]; }).filter(function (v) { return !vazio(v); });
          var num = amostra.length && amostra.every(function (v) { return typeof v === "number" || /^-?\d+$/.test(String(v)); });
          return { nome: c.nome, tipo: num ? "inteiro" : "texto" };
        });
        var conv = cols.map(function (c, i) { return e.cols.indexOf(c.nome) !== -1 && c.tipo === "inteiro" ? i : -1; }).filter(function (i) { return i !== -1; });
        return { cols: cols, linhas: !conv.length ? t.linhas : t.linhas.map(function (l) { var n = l.slice(); conv.forEach(function (i) { if (!vazio(n[i])) n[i] = Number(n[i]); }); return n; }) };
      },
      formula: function (e, ant, t) {
        return "= Table.TransformColumnTypes(" + mNome(ant) + ",{" + e.cols.map(function (n) {
          var c = t ? t.cols.filter(function (x) { return x.nome === n; })[0] : null;
          return '{"' + n + '", ' + TIPOS[c ? c.tipo : "texto"].m + "}";
        }).join(", ") + "})";
      }
    },
    dividir: {
      aplicar: function (t, e) {
        var i = idxCol(t, e.col);
        if (t.cols[i].tipo !== "texto" && t.cols[i].tipo !== "qualquer") throw new PQErro("Expression.Error: Não é possível converter o valor do tipo " + TIPOS[t.cols[i].tipo].nome + " para o tipo Text.");
        if (!e.delim) throw new PQErro("Expression.Error: O delimitador não pode ser vazio.");
        var partesDe = function (v) {
          if (vazio(v)) return [v];
          var s = String(v), k;
          if (e.modo === "cada") return s.split(e.delim);
          k = e.modo === "direita" ? s.lastIndexOf(e.delim) : s.indexOf(e.delim);
          return k === -1 ? [s] : [s.slice(0, k), s.slice(k + e.delim.length)];
        };
        var n = e.modo === "cada" ? Math.max.apply(null, t.linhas.slice(0, 1000).map(function (l) { return partesDe(l[i]).length; }).concat([1])) : 2;
        var novas = [];
        for (var k = 1; k <= n; k++) novas.push({ nome: e.col + "." + k, tipo: "texto" });
        return {
          cols: t.cols.slice(0, i).concat(novas, t.cols.slice(i + 1)),
          linhas: t.linhas.map(function (l) {
            var p = partesDe(l[i]), x = [];
            for (var j = 0; j < n; j++) x.push(p[j] === undefined ? null : p[j]);
            return l.slice(0, i).concat(x, l.slice(i + 1));
          })
        };
      },
      formula: function (e, ant, t) {
        var n = 2;
        if (t) n = t.cols.filter(function (c) { return c.nome.indexOf(e.col + ".") === 0 && /^\d+$/.test(c.nome.slice(e.col.length + 1)); }).length || 2;
        var nomes = []; for (var k = 1; k <= n; k++) nomes.push(e.col + "." + k);
        var fn = e.modo === "cada" ? 'Splitter.SplitTextByDelimiter("' + e.delim + '", QuoteStyle.Csv)'
          : 'Splitter.SplitTextByEachDelimiter({"' + e.delim + '"}, QuoteStyle.Csv, ' + (e.modo === "direita" ? "true" : "false") + ")";
        return "= Table.SplitColumn(" + mNome(ant) + ', "' + e.col + '", ' + fn + ", " + lista(nomes) + ")";
      }
    },
    substituir: {
      aplicar: function (t, e) {
        var i = idxCol(t, e.col);
        if (!e.de) throw new PQErro("Expression.Error: O valor a ser localizado não pode ser vazio.");
        var texto = t.cols[i].tipo === "texto" || t.cols[i].tipo === "qualquer";
        return {
          cols: t.cols,
          linhas: t.linhas.map(function (l) {
            var v = l[i];
            if (vazio(v) || eErro(v)) return l;
            var n = l.slice();
            if (texto) n[i] = String(v).split(e.de).join(e.para);
            else if (String(v) === e.de) n[i] = converter(e.para, t.cols[i].tipo);
            return n;
          })
        };
      },
      formula: function (e, ant) {
        return "= Table.ReplaceValue(" + mNome(ant) + ',"' + e.de + '","' + e.para + '",Replacer.ReplaceText,{"' + e.col + '"})';
      }
    },
    somente: {
      aplicar: function (t, e) {
        var i = idxCol(t, e.col), tp = t.cols[i].tipo;
        if (tp !== "datahora" && !(e.parte === "data" && tp === "data")) throw new PQErro("Expression.Error: Não é possível converter o valor do tipo " + TIPOS[tp].nome + " para o tipo DateTime.");
        var f = function (v) { return eErro(v) ? v : vazio(v) ? null : tp === "data" ? v : e.parte === "data" ? Math.floor(v / 86400) : ((v % 86400) + 86400) % 86400; };
        var novoTipo = e.parte === "data" ? "data" : "hora";
        if (e.adicionar) return { cols: t.cols.concat([{ nome: e.novo, tipo: novoTipo }]), linhas: t.linhas.map(function (l) { return l.concat([f(l[i])]); }) };
        var cols = t.cols.slice(); cols[i] = { nome: t.cols[i].nome, tipo: novoTipo };
        return { cols: cols, linhas: t.linhas.map(function (l) { var n = l.slice(); n[i] = f(l[i]); return n; }) };
      },
      formula: function (e, ant) {
        var fn = e.parte === "data" ? "DateTime.Date" : "DateTime.Time", tipo = e.parte === "data" ? "type date" : "type time";
        return e.adicionar
          ? "= Table.AddColumn(" + mNome(ant) + ', "' + e.novo + '", each ' + fn + "([" + e.col + "]), " + tipo + ")"
          : "= Table.TransformColumns(" + mNome(ant) + ',{{"' + e.col + '", ' + fn + ", " + tipo + "}})";
      }
    },
    renomear: {
      aplicar: function (t, e) {
        var i = idxCol(t, e.de);
        if (t.cols.some(function (c, k) { return k !== i && c.nome === e.para; })) throw new PQErro("Expression.Error: A coluna '" + e.para + "' já existe na tabela.");
        var cols = t.cols.slice(); cols[i] = { nome: e.para, tipo: t.cols[i].tipo };
        return { cols: cols, linhas: t.linhas };
      },
      formula: function (e, ant) { return "= Table.RenameColumns(" + mNome(ant) + ',{{"' + e.de + '", "' + e.para + '"}})'; }
    }
  };

  /* nome padrão de cada etapa, numerado quando repete (Tipo Alterado1) */
  function nomeEtapa(e) {
    switch (e.op) {
      case "remover": return "Colunas Removidas";
      case "brancas": return "Linhas em Branco Removidas";
      case "tipo": return e.loc ? "Tipo Alterado com Localidade" : "Tipo Alterado";
      case "mesclar": return "Colunas Mescladas";
      case "mes": return e.adicionar ? (e.nomeMes ? "Nome do Mês Inserido" : "Mês Inserido") : (e.nomeMes ? "Nome do Mês Extraído" : "Mês Calculado");
      case "renomear": return "Colunas Renomeadas";
      case "dividir": return "Dividir Coluna por Delimitador";
      case "tipoNovas": return "Tipo Alterado";
      case "substituir": return "Valor Substituído";
      case "somente": return e.adicionar ? (e.parte === "data" ? "Data Inserida" : "Hora Inserida") : (e.parte === "data" ? "Data Extraída" : "Hora Extraída");
    }
    return "Etapa";
  }

  /* ======================================================
     4. INTERFACE
     ====================================================== */

  var CFG = {};
  var INST = [];

  function Editor(raiz, cfg) {
    this.raiz = raiz;
    this.cfg = cfg;
    this.iniciar();
    this.montar();
    this.render();
  }

  Editor.prototype.iniciar = function () {
    var cfg = this.cfg, self = this;
    this.consulta = cfg.consulta;
    this.etapas = [
      { op: "fonte", nome: "Fonte", base: cfg.base, fixa: true },
      { op: "navegacao", nome: "Navegação", base: cfg.base, fixa: true },
      { op: "promover", nome: "Cabeçalhos Promovidos" },
      { op: "tipoAuto", nome: "Tipo Alterado", base: cfg.base }
    ];
    (cfg.prontas || []).forEach(function (e) { self.adicionarEtapa(JSON.parse(JSON.stringify(e)), true); });
    this.atual = this.etapas.length - 1;
    this.sel = [];
    this.guia = "inicio";
    this.menu = null;
    this.dialogo = null;
    this.carregado = null;
    this.visitou = {};
    this.feitas = {};
    this.cache = {};
  };

  Editor.prototype.adicionarEtapa = function (e, silencioso) {
    var base = nomeEtapa(e), nome = base, n = 0, usados = this.etapas.map(function (x) { return x.nome; });
    while (usados.indexOf(nome) !== -1) nome = base + (++n);
    e.nome = nome;
    var pos = silencioso ? this.etapas.length : this.atual + 1;
    this.etapas.splice(pos, 0, e);
    this.cache = {};
    this.atual = pos;
    if (!silencioso && pos < this.etapas.length - 1) this.avisar("Etapa inserida depois de " + this.etapas[pos - 1].nome + ". As etapas seguintes podem quebrar.");
  };

  /* tabela depois da etapa k (com memória) */
  Editor.prototype.tabela = function (k) {
    if (this.cache[k]) return this.cache[k];
    var t = null, e;
    for (var i = 0; i <= k; i++) {
      if (this.cache[i]) { t = this.cache[i]; continue; }
      e = this.etapas[i];
      if (t && t.erro) { this.cache[i] = t; continue; }
      try { t = OPS[e.op].aplicar(t, e); }
      catch (err) { if (!(err instanceof PQErro)) throw err; t = { erro: err.msg, etapa: e.nome }; }
      this.cache[i] = t;
    }
    return t;
  };
  Editor.prototype.formula = function (k) {
    var e = this.etapas[k], ant = k > 0 ? this.etapas[k - 1].nome : "";
    if (e.op === "navegacao") return OPS.navegacao.formula(e);
    var t = this.tabela(k);
    return OPS[e.op].formula(e, ant, t && !t.erro ? t : null);
  };
  Editor.prototype.final = function () { return this.tabela(this.etapas.length - 1); };

  Editor.prototype.montar = function () {
    var self = this;
    this.raiz.innerHTML =
      '<div class="app pq-app pq-janela">' +
        '<div class="app-titulo"><b data-r="titulo"></b><span class="sim-aviso" data-r="aviso" role="status"></span><span class="app-botoes">— ▢ ✕</span></div>' +
        '<div data-r="faixa"></div>' +
        '<div class="pq-corpo">' +
          '<div class="pq-consultas" data-r="consultas"></div>' +
          '<div class="pq-centro"><div class="pq-fx"><i>fx</i><code data-r="fx"></code></div><div class="pq-grade-area" data-r="grade"></div></div>' +
          '<div class="pq-config" data-r="config"></div>' +
        '</div>' +
        '<div class="pq-modal" data-r="modal" hidden></div>' +
      '</div>' +
      (this.cfg.tarefas ? '<div class="sim-tarefas" data-r="tarefas"></div>' : "");
    this.el = {};
    this.raiz.querySelectorAll("[data-r]").forEach(function (e) { self.el[e.getAttribute("data-r")] = e; });
    this.raiz.addEventListener("click", function (ev) { self.clique(ev); });
    this.raiz.addEventListener("contextmenu", function (ev) {
      var th = ev.target.closest("th[data-col]");
      if (!th) return;
      ev.preventDefault();
      self.selecionar(th.getAttribute("data-col"), ev.ctrlKey || ev.metaKey, true);
      self.abrirMenu("coluna", th);
      self.renderGrade(); self.renderFaixa();
    });
    this.raiz.addEventListener("change", function (ev) {
      if (ev.target.matches('[data-d="loc"]')) {
        self.el.modal.querySelector('[data-d="exemplo"]').textContent = LOCALIDADES[ev.target.value].exemplo;
        return;
      }
      if (ev.target.matches("[data-nome-consulta]")) {
        var v = ev.target.value.trim();
        if (v) { self.consulta = v; self.avisar("Consulta renomeada para " + v + "."); }
        self.render();
      }
    });
    this.raiz.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && ev.target.matches("[data-nome-consulta]")) ev.target.blur();
      if (ev.key === "Escape" && (self.menu || self.dialogo)) { self.menu = null; self.dialogo = null; self.render(); }
      if (ev.key === "Enter" && ev.target.closest(".pq-dialogo") && ev.target.tagName === "INPUT") { ev.preventDefault(); self.confirmarDialogo(); }
    });
  };

  Editor.prototype.avisar = function (msg) {
    var self = this;
    this.el.aviso.textContent = msg;
    clearTimeout(this.tAviso);
    this.tAviso = setTimeout(function () { self.el.aviso.textContent = ""; }, 5000);
  };

  /* ---------- faixa de opções ---------- */
  var ICO_DATA = '<span class="pq-tipo pq-tipo--data"><i></i></span>';
  var ICO_DATAHORA = '<span class="pq-tipo pq-tipo--data pq-tipo--dh"><i></i><b></b></span>';
  var ICO_HORA = '<span class="pq-tipo pq-tipo--hora"><b></b></span>';
  function iconeTipo(tipo) { return tipo === "data" ? ICO_DATA : tipo === "datahora" ? ICO_DATAHORA : tipo === "hora" ? ICO_HORA : '<span class="pq-tipo">' + TIPOS[tipo].icone + "</span>"; }

  Editor.prototype.renderFaixa = function () {
    var g = this.guia;
    var guias = [["inicio", "Página Inicial"], ["transformar", "Transformar"], ["adicionar", "Adicionar Coluna"]];
    var html = '<div class="app-guias"><span>Arquivo</span>' + guias.map(function (x) {
      return '<button type="button" class="pq-guia' + (g === x[0] ? " ativa" : "") + '" data-acao="guia" data-guia="' + x[0] + '">' + x[1] + "</button>";
    }).join("") + "<span>Exibição</span></div><div class=\"app-faixa\">";
    function grupo(titulo, botoes) { return '<div class="app-grupo"><div>' + botoes + "</div><small>" + titulo + "</small></div>"; }
    function b(acao, rotulo, extra) { return '<button type="button" class="app-btn" data-acao="' + acao + '"' + (extra || "") + ">" + rotulo + "</button>"; }
    if (g === "inicio") {
      html += grupo("Fechar", b("fechar", "Fechar e Aplicar", ' data-destaque="1"'));
      html += grupo("Gerenciar Colunas", b("remover", "Remover Colunas"));
      html += grupo("Reduzir Linhas", b("menu-linhas", "Remover Linhas ▾"));
      html += grupo("Transformar", b("menu-dividir", "Dividir Coluna ▾") + b("menu-tipo-faixa", "Tipo de Dados: " + this.tipoSel() + " ▾") + b("substituir", "Substituir Valores"));
    } else if (g === "transformar") {
      html += grupo("Qualquer Coluna", b("menu-tipo-faixa", "Tipo de Dados: " + this.tipoSel() + " ▾") + b("substituir", "Substituir Valores") + b("renomear", "Renomear"));
      html += grupo("Coluna de Texto", b("menu-dividir", "Dividir Coluna ▾") + b("mesclar", "Mesclar Colunas"));
      html += grupo("Coluna de Data e Hora", b("menu-data-transformar", "Data ▾") + b("menu-hora-transformar", "Hora ▾"));
    } else {
      html += grupo("De Texto", b("mesclar", "Mesclar Colunas"));
      html += grupo("De Data e Hora", b("menu-data-adicionar", "Data ▾") + b("menu-hora-adicionar", "Hora ▾"));
    }
    this.el.faixa.innerHTML = html + '<div class="app-grupo sim-grupo-direita"><div><button type="button" class="app-btn" data-acao="redefinir" title="Volta ao começo do laboratório">Redefinir</button></div><small>Simulador</small></div></div>';
  };

  Editor.prototype.tipoSel = function () {
    var t = this.tabela(this.atual);
    if (!t || t.erro || this.sel.length !== 1) return "Qualquer";
    var c = t.cols.filter(function (x) { return x.nome === this.sel[0]; }, this)[0];
    return c ? TIPOS[c.tipo].nome : "Qualquer";
  };

  /* ---------- painéis laterais ---------- */
  Editor.prototype.renderLados = function () {
    var self = this;
    this.el.titulo.textContent = this.consulta + " - Editor do Power Query";
    var outras = (this.cfg.outras || []).map(function (n) { return '<div class="pq-consulta pq-consulta--outra"><i class="ico-tabela"></i>' + esc(n) + "</div>"; }).join("");
    this.el.consultas.innerHTML = "<small>Consultas [" + (1 + (this.cfg.outras || []).length) + "]</small>" + outras + '<div class="pq-consulta"><i class="ico-tabela"></i>' + esc(this.consulta) + "</div>";
    this.el.config.innerHTML =
      "<b>Configurações de Consulta</b><small>Propriedades</small>" +
      '<label>Nome<input class="pq-nome pq-nome--campo" data-nome-consulta value="' + esc(this.consulta) + '" aria-label="Nome da consulta"></label>' +
      "<small>Etapas Aplicadas</small><ol class=\"etapas-lista pq-etapas\">" +
      this.etapas.map(function (e, i) {
        var t = self.cache[i], quebrada = t && t.erro && t.etapa === e.nome;
        return '<li><button type="button" class="' + (i === self.atual ? "ativa" : "") + (quebrada ? " quebrada" : "") + '" data-acao="etapa" data-i="' + i + '">' + esc(e.nome) + "</button>" +
          (e.fixa ? "" : '<button type="button" class="pq-x" data-acao="apagar" data-i="' + i + '" title="Excluir etapa">✕</button>') + "</li>";
      }).join("") + "</ol>";
  };

  /* ---------- grade ---------- */
  function celula(v, tipo) {
    if (eErro(v)) return '<td class="pq-erro" title="' + esc(v.msg) + '">Error</td>';
    if (v === null || v === undefined) return '<td class="pq-nulo">null</td>';
    if (tipo === "data" && typeof v === "number") return '<td class="pq-n">' + dataTexto(v) + "</td>";
    if (tipo === "datahora" && typeof v === "number") return '<td class="pq-n">' + dataHoraTexto(v) + "</td>";
    if (tipo === "hora" && typeof v === "number") return '<td class="pq-n">' + horaTexto(v) + "</td>";
    if (tipo === "decimal" && typeof v === "number") return '<td class="pq-n">' + String(v).replace(".", ",") + "</td>";
    if (typeof v === "number") return '<td class="pq-n">' + v + "</td>";
    return "<td>" + esc(v) + "</td>";
  }

  Editor.prototype.renderGrade = function () {
    var t = this.tabela(this.atual), self = this;
    this.el.fx.textContent = this.formula(this.atual);
    if (t.erro) {
      this.el.grade.innerHTML = '<div class="pq-falha"><b>' + esc(t.erro.split(":")[0]) + "</b><span>" + esc(t.erro.slice(t.erro.indexOf(":") + 1).trim()) +
        "</span><small>Etapa com problema: " + esc(t.etapa) + ". Apague ou corrija a etapa em Etapas Aplicadas.</small></div>";
      return;
    }
    var n = t.linhas.length, cima = Math.min(n, 9), baixo = n > 12 ? 3 : Math.max(0, n - cima);
    var amostra = Math.min(n, 1000);
    var html = '<div class="pq-rolagem"><table class="pq-grade pq-grade--sim"><thead><tr><th class="pq-canto"></th>' +
      t.cols.map(function (c) {
        var sel = self.sel.indexOf(c.nome);
        return '<th data-col="' + esc(c.nome) + '" class="' + (sel !== -1 ? "pq-sel" : "") + '"><span><button type="button" class="pq-ico-tipo" data-acao="menu-tipo" data-col="' + esc(c.nome) + '" title="Alterar tipo">' + iconeTipo(c.tipo) + "</button>" +
          esc(c.nome) + (sel !== -1 && self.sel.length > 1 ? '<em class="pq-ordem">' + (sel + 1) + "</em>" : "") + "</span></th>";
      }).join("") + "</tr><tr class=\"pq-qualidade\"><th class=\"pq-canto\"></th>" +
      t.cols.map(function (c, i) {
        var e = 0, z = 0;
        for (var k = 0; k < amostra; k++) { var v = t.linhas[k][i]; if (eErro(v)) e++; else if (vazio(v)) z++; }
        var pe = amostra ? Math.round(e / amostra * 100) : 0, pz = amostra ? Math.round(z / amostra * 100) : 0, pv = 100 - pe - pz;
        return '<th><div class="pq-barra"><i style="width:' + pv + '%"></i><b style="width:' + pe + '%"></b><u style="width:' + pz + '%"></u></div>' +
          '<span class="pq-qtxt">' + (pe ? '<em>Erro ' + pe + "%</em>" : pz ? "Vazio " + pz + "%" : "Válido " + pv + "%") + "</span></th>";
      }).join("") + "</tr></thead><tbody>";
    function linha(k) {
      var l = t.linhas[k], branca = l.every(vazio);
      return "<tr" + (branca ? ' class="pq-l-vazia"' : "") + "><th>" + mil(k + 1) + "</th>" + t.cols.map(function (c, i) {
        return celula(l[i], c.tipo).replace("<td", '<td' + (self.sel.indexOf(c.nome) !== -1 ? ' data-s="1"' : ""));
      }).join("") + "</tr>";
    }
    for (var k = 0; k < cima; k++) html += linha(k);
    if (baixo && n > cima + baixo) html += '<tr class="pq-pulo"><th>⋮</th><td colspan="' + t.cols.length + '">mais ' + mil(n - cima - baixo) + " linhas</td></tr>";
    for (k = Math.max(cima, n - baixo); k < n; k++) html += linha(k);
    html += "</tbody></table></div>";
    var erros = 0, ci = -1;
    t.cols.forEach(function (c, i) { if (c.tipo === "data" || c.tipo === "datahora") ci = i; });
    if (ci !== -1) t.linhas.forEach(function (l) { if (eErro(l[ci])) erros++; });
    html += '<p class="pq-status">' + t.cols.length + " COLUNAS, " + mil(n) + " LINHAS · Qualidade da coluna com base nas 1000 primeiras linhas" +
      (erros ? ' · <b class="pq-status-erro">' + mil(erros) + " ERROS NA COLUNA " + esc(t.cols[ci].nome.toUpperCase()) + "</b>" : "") + "</p>";
    /* redesenhar a grade não pode jogar a rolagem horizontal de volta para o começo */
    var antes = this.el.grade.querySelector(".pq-rolagem"), sl = antes ? antes.scrollLeft : 0;
    this.el.grade.innerHTML = html;
    var depois = this.el.grade.querySelector(".pq-rolagem");
    if (depois && sl) depois.scrollLeft = sl;
  };

  /* ---------- menus e caixas de diálogo ---------- */
  /* a posição é calculada já, antes de a grade ser redesenhada */
  Editor.prototype.abrirMenu = function (tipo, ancora) {
    var r = ancora.getBoundingClientRect(), base = this.raiz.querySelector(".pq-janela").getBoundingClientRect();
    this.menu = { tipo: tipo, left: Math.max(0, Math.min(r.left - base.left, base.width - 260)), top: r.bottom - base.top + 2 };
    this.renderModal();
  };

  Editor.prototype.renderModal = function () {
    var m = this.el.modal, self = this;
    if (!this.menu && !this.dialogo) { m.hidden = true; m.innerHTML = ""; return; }
    m.hidden = false;
    if (this.dialogo) { m.innerHTML = this.htmlDialogo(); m.className = "pq-modal pq-modal--dialogo"; var f = m.querySelector("select, input"); if (f) f.focus(); return; }
    var itens = [];
    var tiposLista = ["decimal", "inteiro", "datahora", "data", "hora", "texto"].map(function (t) { return ["tipo:" + t, TIPOS[t].nome]; });
    if (this.menu.tipo === "linhas") itens = [["brancas", "Remover Linhas em Branco"]];
    else if (this.menu.tipo === "tipo") itens = tiposLista.concat([["-"], ["localidade", "Usando a Localidade..."]]);
    else if (this.menu.tipo === "coluna") itens = [["remover", "Remover"], ["renomear", "Renomear..."], ["-"], ["tipo:texto", "Alterar Tipo › Texto"], ["tipo:inteiro", "Alterar Tipo › Número Inteiro"], ["tipo:data", "Alterar Tipo › Data"], ["localidade", "Alterar Tipo › Usando a Localidade..."], ["-"], ["substituir", "Substituir Valores..."], ["dividir", "Dividir Coluna › Por Delimitador..."], ["mesclar", "Mesclar Colunas"]];
    else if (this.menu.tipo === "dividir") itens = [["dividir", "Por Delimitador"]];
    else if (this.menu.tipo === "data-transformar" || this.menu.tipo === "data-adicionar") itens = [["somente:data:" + this.menu.tipo, "Somente Data"], ["-"], ["mes:" + this.menu.tipo, "Mês › Mês"], ["nomemes:" + this.menu.tipo, "Mês › Nome do Mês"]];
    else if (this.menu.tipo === "hora-transformar" || this.menu.tipo === "hora-adicionar") itens = [["somente:hora:" + this.menu.tipo.replace("hora-", "data-"), "Somente Hora"]];
    m.className = "pq-modal pq-modal--menu";
    m.innerHTML = '<div class="pq-menu" style="left:' + this.menu.left + "px;top:" + this.menu.top + 'px" role="menu">' +
      itens.map(function (x) { return x[0] === "-" ? "<hr>" : '<button type="button" role="menuitem" data-acao="item" data-item="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>";
    void self;
  };

  Editor.prototype.abrirDialogo = function (tipo, dados) {
    this.menu = null;
    var t = this.tabela(this.atual);
    if (t.erro) { this.avisar("Corrija a etapa com erro antes."); this.renderModal(); return; }
    if (tipo === "localidade" && this.sel.length !== 1) { this.avisar("Selecione uma coluna (clique no título dela)."); this.renderModal(); return; }
    if (tipo === "mesclar" && this.sel.length < 2) { this.avisar("Selecione duas colunas: clique na primeira e Ctrl + clique na segunda."); this.renderModal(); return; }
    if ((tipo === "dividir" || tipo === "substituir") && this.sel.length !== 1) { this.avisar("Selecione uma coluna (clique no título dela)."); this.renderModal(); return; }
    if (tipo === "dividir" && ["texto", "qualquer"].indexOf(this.colSel(t).tipo) === -1) { this.avisar("Dividir Coluna fica cinza: a coluna " + this.sel[0] + " não é de texto (ABC)."); this.renderModal(); return; }
    this.dialogo = { tipo: tipo, dados: dados || {} };
    this.renderModal();
  };

  Editor.prototype.htmlDialogo = function () {
    var d = this.dialogo, html = '<div class="pq-dialogo" role="dialog" aria-modal="true">';
    if (d.tipo === "localidade") {
      html += "<h4>Alterar Tipo com Localidade</h4><p>Altere o tipo de dados e selecione a localidade de origem.</p>" +
        '<label>Tipo de Dados<select data-d="tipo">' + ["data", "texto", "inteiro", "decimal"].map(function (t) { return '<option value="' + t + '">' + TIPOS[t].nome + "</option>"; }).join("") + "</select></label>" +
        '<label>Localidade<select data-d="loc">' + Object.keys(LOCALIDADES).map(function (k) { return '<option value="' + k + '">' + LOCALIDADES[k].nome + "</option>"; }).join("") + "</select></label>" +
        '<p class="pq-exemplo">Valores de exemplo de uma data: <b data-d="exemplo">31/12/2018</b></p>' +
        '<p class="pq-coluna-d">Coluna: <b>' + esc(this.sel[0]) + "</b></p>";
    } else if (d.tipo === "mesclar") {
      html += "<h4>Mesclar Colunas</h4><p>Escolha como mesclar as colunas selecionadas: <b>" + this.sel.map(esc).join("</b>, depois <b>") + "</b>.</p>" +
        '<label>Separador<select data-d="sep"><option value="">--Nenhum--</option><option value=":">Dois-pontos</option><option value=",">Vírgula</option><option value="=">Sinal de igual</option><option value=";">Ponto e vírgula</option><option value=" ">Espaço</option></select></label>' +
        '<label>Novo nome da coluna (opcional)<input data-d="novo" value="Mesclado"></label>';
    } else if (d.tipo === "dividir") {
      html += "<h4>Dividir Coluna por Delimitador</h4><p>Especifique o delimitador usado para dividir a coluna de texto <b>" + esc(this.sel[0]) + "</b>.</p>" +
        '<label>Selecione ou insira o delimitador<select data-d="delim"><option value="§">--Personalizado--</option><option value=":">Dois-pontos</option><option value=",">Vírgula</option><option value="=">Sinal de igual</option><option value=";">Ponto e vírgula</option><option value=" ">Espaço</option></select></label>' +
        '<label>Personalizado (com os espaços, se houver)<input data-d="pers" value="" spellcheck="false" placeholder="ex.: , ou / com espaços"></label>' +
        '<fieldset class="pq-radios"><legend>Dividir em</legend>' +
        '<label><input type="radio" name="pq-modo" data-d-r="modo" value="esquerda" checked> Delimitador mais à esquerda</label>' +
        '<label><input type="radio" name="pq-modo" data-d-r="modo" value="direita"> Delimitador mais à direita</label>' +
        '<label><input type="radio" name="pq-modo" data-d-r="modo" value="cada"> Cada ocorrência do delimitador</label></fieldset>' +
        '<p class="pq-exemplo">Primeiro valor da coluna: <b class="pq-mono">' + esc(this.primeiroValor()) + "</b></p>";
    } else if (d.tipo === "substituir") {
      html += "<h4>Substituir Valores</h4><p>Substitua um valor por outro nas colunas selecionadas: <b>" + esc(this.sel[0]) + "</b>.</p>" +
        '<label>Valor a Ser Localizado<input data-d="de" value="" spellcheck="false"></label>' +
        '<label>Substituir Por<input data-d="para" value="" spellcheck="false"></label>' +
        '<p class="pq-exemplo">Primeiro valor da coluna: <b class="pq-mono">' + esc(this.primeiroValor()) + "</b></p>";
    } else if (d.tipo === "renomear") {
      var col = d.dados.col || this.sel[0];
      d.dados.col = col;
      html += "<h4>Renomear coluna</h4><label>Novo nome de " + esc(col) + '<input data-d="para" value="' + esc(col) + '"></label>';
    }
    return html + '<div class="pq-dialogo-botoes"><button type="button" class="app-btn app-btn--primario" data-acao="ok">OK</button><button type="button" class="app-btn" data-acao="cancelar">Cancelar</button></div></div>';
  };

  Editor.prototype.confirmarDialogo = function () {
    var d = this.dialogo, m = this.el.modal;
    function val(k) { var e = m.querySelector('[data-d="' + k + '"]'); return e ? e.value : ""; }
    if (d.tipo === "localidade") this.aplicar({ op: "tipo", col: this.sel[0], tipo: val("tipo"), loc: val("loc") });
    else if (d.tipo === "dividir") {
      var r = m.querySelector('[data-d-r="modo"]:checked'), delim = val("delim") === "§" ? val("pers") : val("delim");
      if (!delim) { this.avisar("Escolha o delimitador ou escreva um personalizado."); return; }
      this.aplicar({ op: "dividir", col: this.sel[0], delim: delim, modo: r ? r.value : "esquerda" });
      var tt = this.final();
      if (!tt.erro) {
        var col0 = this.sel[0], novas = tt.cols.map(function (c) { return c.nome; }).filter(function (n) { return n.indexOf(col0 + ".") === 0 && /^\d+$/.test(n.slice(col0.length + 1)); });
        this.adicionarEtapa({ op: "tipoNovas", cols: novas }, false);
        this.sel = [novas[0]];
      }
    } else if (d.tipo === "substituir") {
      if (!val("de")) { this.avisar("Escreva o valor a ser localizado."); return; }
      this.aplicar({ op: "substituir", col: this.sel[0], de: val("de"), para: val("para") });
    }
    else if (d.tipo === "mesclar") this.aplicar({ op: "mesclar", cols: this.sel.slice(), sep: val("sep"), novo: val("novo").trim() || "Mesclado" });
    else if (d.tipo === "renomear") {
      var para = val("para").trim();
      if (para && para !== d.dados.col) this.aplicar({ op: "renomear", de: d.dados.col, para: para });
    }
    this.dialogo = null;
    this.render();
  };

  Editor.prototype.primeiroValor = function () {
    var t = this.tabela(this.atual), i = -1, self = this;
    if (t.erro) return "";
    t.cols.forEach(function (c, k) { if (c.nome === self.sel[0]) i = k; });
    if (i === -1 || !t.linhas.length) return "";
    var v = t.linhas[0][i];
    return vazio(v) ? "null" : String(v);
  };

  Editor.prototype.aplicar = function (e) {
    this.adicionarEtapa(e);
    var t = this.final();
    if (e.op === "mesclar") this.sel = [e.novo];
    else if (e.op === "renomear") this.sel = [e.para];
    else if (e.op === "remover") this.sel = [];
    else if (e.op === "mes" && e.adicionar) this.sel = [e.novo];
    if (t.erro) this.avisar("A etapa " + e.nome + " deu erro.");
  };

  Editor.prototype.selecionar = function (col, ctrl, manter) {
    var i = this.sel.indexOf(col);
    if (ctrl) { if (i === -1) this.sel.push(col); else if (!manter) this.sel.splice(i, 1); }
    else if (!(manter && i !== -1)) this.sel = [col];
  };

  Editor.prototype.clique = function (ev) {
    var a = ev.target.closest("[data-acao]"), self = this;
    if (this.menu && !(a && a.getAttribute("data-acao") === "item") && !ev.target.closest(".pq-menu")) { this.menu = null; this.renderModal(); if (!a) return; }
    var th = ev.target.closest("th[data-col]");
    if (th && !(a && a.getAttribute("data-acao") === "menu-tipo")) {
      /* clique duplo no título = Renomear. O primeiro clique redesenha a grade,
         então o navegador não dispara dblclick: o par de cliques é contado aqui */
      var nomeCol = th.getAttribute("data-col"), agora = Date.now();
      if (!(ev.ctrlKey || ev.metaKey) && this.ultimoTh === nomeCol && agora - this.ultimoT < 500) {
        this.ultimoTh = null;
        this.abrirDialogo("renomear", { col: nomeCol });
        return;
      }
      this.ultimoTh = nomeCol; this.ultimoT = agora;
      this.selecionar(th.getAttribute("data-col"), ev.ctrlKey || ev.metaKey);
      this.renderGrade(); this.renderFaixa();
      return;
    }
    if (!a) return;
    var acao = a.getAttribute("data-acao"), t = this.tabela(this.atual);
    switch (acao) {
      case "guia": this.guia = a.getAttribute("data-guia"); this.renderFaixa(); return;
      case "redefinir": this.iniciar(); this.render(); return;
      case "etapa": this.atual = +a.getAttribute("data-i"); this.visitou[this.atual] = true; this.render(); return;
      case "apagar":
        var i = +a.getAttribute("data-i"), nome = this.etapas[i].nome;
        this.etapas.splice(i, 1); this.cache = {};
        this.atual = this.etapas.length - 1;
        this.avisar("Etapa " + nome + " excluída.");
        this.render(); return;
      case "menu-tipo":
        ev.stopPropagation();
        this.selecionar(a.getAttribute("data-col"), false);
        this.abrirMenu("tipo", a);
        this.renderGrade(); this.renderFaixa(); return;
      case "menu-tipo-faixa":
        if (this.sel.length !== 1) { this.avisar("Selecione uma coluna (clique no título dela)."); return; }
        this.abrirMenu("tipo", a); return;
      case "menu-linhas": this.abrirMenu("linhas", a); return;
      case "menu-data-transformar": case "menu-data-adicionar":
        if (this.sel.length !== 1) { this.avisar("Selecione a coluna de data."); return; }
        if (t.erro || ["data", "datahora"].indexOf(this.colSel(t).tipo) === -1) { this.avisar("Data fica cinza: a coluna " + this.sel[0] + " não é do tipo Data ou Data/Hora (ícone de calendário)."); return; }
        this.abrirMenu(acao.replace("menu-", ""), a); return;
      case "menu-hora-transformar": case "menu-hora-adicionar":
        if (this.sel.length !== 1) { this.avisar("Selecione a coluna de data e hora."); return; }
        if (t.erro || ["datahora", "hora"].indexOf(this.colSel(t).tipo) === -1) { this.avisar("Hora fica cinza: a coluna " + this.sel[0] + " não é do tipo Data/Hora (ícone de calendário com relógio)."); return; }
        this.abrirMenu(acao.replace("menu-", ""), a); return;
      case "menu-dividir":
        if (this.sel.length !== 1) { this.avisar("Selecione a coluna de texto que vai ser dividida."); return; }
        this.abrirMenu("dividir", a); return;
      case "substituir": this.abrirDialogo("substituir"); return;
      case "item": this.item(a.getAttribute("data-item")); return;
      case "remover":
        if (!this.sel.length) { this.avisar("Selecione a coluna que vai sair (clique no título dela)."); return; }
        this.aplicar({ op: "remover", cols: this.sel.slice() }); this.render(); return;
      case "renomear":
        if (this.sel.length !== 1) { this.avisar("Selecione uma coluna."); return; }
        this.abrirDialogo("renomear"); return;
      case "mesclar": this.abrirDialogo("mesclar"); return;
      case "ok": this.confirmarDialogo(); return;
      case "cancelar": this.dialogo = null; this.renderModal(); return;
      case "fechar": this.fecharAplicar(); return;
    }
    void self;
  };

  Editor.prototype.colSel = function (t) {
    var n = this.sel[0];
    return t.cols.filter(function (c) { return c.nome === n; })[0] || {};
  };

  Editor.prototype.item = function (it) {
    this.menu = null;
    if (it === "brancas") { this.aplicar({ op: "brancas" }); this.render(); return; }
    if (it === "remover") { this.aplicar({ op: "remover", cols: this.sel.slice() }); this.render(); return; }
    if (it === "renomear") { this.abrirDialogo("renomear"); return; }
    if (it === "mesclar") { this.abrirDialogo("mesclar"); return; }
    if (it === "localidade") { this.abrirDialogo("localidade"); return; }
    if (it === "dividir") { this.abrirDialogo("dividir"); return; }
    if (it === "substituir") { this.abrirDialogo("substituir"); return; }
    var so = /^somente:(data|hora):data-(transformar|adicionar)$/.exec(it);
    if (so) {
      var ad = so[2] === "adicionar";
      this.aplicar({ op: "somente", col: this.sel[0], parte: so[1], adicionar: ad, novo: so[1] === "data" ? "Data" : "Hora" });
      if (ad) this.sel = [so[1] === "data" ? "Data" : "Hora"];
      this.render();
      return;
    }
    if (/^tipo:/.test(it)) {
      var tipo = it.slice(5), t = this.tabela(this.atual);
      if (!t.erro && this.colSel(t).tipo === tipo) { this.avisar("A coluna já é do tipo " + TIPOS[tipo].nome + "."); this.renderModal(); return; }
      this.aplicar({ op: "tipo", col: this.sel[0], tipo: tipo });
      this.render();
      return;
    }
    var m = /^(mes|nomemes):data-(transformar|adicionar)$/.exec(it);
    if (m) {
      var nomeMes = m[1] === "nomemes", adicionar = m[2] === "adicionar";
      this.aplicar({ op: "mes", col: this.sel[0], nomeMes: nomeMes, adicionar: adicionar, novo: nomeMes ? "Nome do Mês" : "Mês" });
      this.render();
    }
  };

  Editor.prototype.fecharAplicar = function () {
    var t = this.final();
    if (t.erro) { this.avisar("Não dá para carregar: há uma etapa com erro."); return; }
    var erros = 0;
    t.linhas.forEach(function (l) { l.forEach(function (v) { if (eErro(v)) erros++; }); });
    this.carregado = { linhas: t.linhas.length, erros: erros, consulta: this.consulta };
    this.dialogo = { tipo: "carga" };
    this.el.modal.hidden = false;
    this.el.modal.className = "pq-modal pq-modal--dialogo";
    this.el.modal.innerHTML = '<div class="pq-dialogo" role="dialog"><h4>Carregar</h4><p><b>' + esc(this.consulta) + "</b>: " + mil(t.linhas.length) + " linhas carregadas" +
      (erros ? ' · <em class="pq-status-erro">' + mil(erros) + " erros</em>. Os erros viram células vazias no relatório." : ".") + "</p>" +
      '<p class="pq-exemplo">No Power BI, a tabela aparece no painel Dados com o nome da consulta.</p>' +
      '<div class="pq-dialogo-botoes"><button type="button" class="app-btn app-btn--primario" data-acao="cancelar">Fechar</button></div></div>';
    this.renderTarefas();
  };

  /* ---------- tarefas ---------- */
  Editor.prototype.renderTarefas = function () {
    if (!this.el.tarefas) return;
    var self = this, feitas = 0;
    var itens = this.cfg.tarefas.map(function (t, i) {
      var ok = false;
      try { ok = !!t.teste(self); } catch (e) { ok = false; }
      if (ok) self.feitas[i] = true;
      ok = ok || !!self.feitas[i];
      if (ok) feitas++;
      return '<li class="' + (ok ? "feita" : "") + '"><span class="sim-check" aria-hidden="true"></span><div><p>' + t.texto + "</p></div></li>";
    });
    this.el.tarefas.innerHTML = '<p class="sim-tarefas-titulo">Tarefas deste laboratório <span>' + feitas + " de " + itens.length + "</span></p><ol>" + itens.join("") + "</ol>";
  };

  Editor.prototype.render = function () {
    this.renderFaixa();
    this.renderGrade();
    this.renderLados();
    this.renderModal();
    this.renderTarefas();
  };

  /* ======================================================
     5. LABORATÓRIOS DESTA AULA
     ====================================================== */

  function ultima(ed) { return ed.final(); }
  function col(ed, nome) { var t = ultima(ed); if (t.erro) return null; var i = -1; t.cols.forEach(function (c, k) { if (c.nome === nome) i = k; }); return i === -1 ? null : { c: t.cols[i], i: i, t: t }; }
  function temEtapa(ed, op) { return ed.etapas.some(function (e) { return e.op === op; }); }

  function valores(ed, nome) { var c = col(ed, nome); return c ? c.t.linhas.map(function (l) { return l[c.i]; }) : null; }
  function todos(lista, f) { return !!lista && lista.length > 0 && lista.every(f); }
  var UF = /^[A-Z]{2}$/;
  /* nome da coluna que tem todos os valores como a regra pede, seja qual for o nome */
  function colunaQue(ed, f) {
    var t = ultima(ed); if (t.erro) return null;
    for (var i = 0; i < t.cols.length; i++) {
      var vs = t.linhas.map(function (l) { return l[i]; });
      if (todos(vs, f)) return t.cols[i].nome;
    }
    return null;
  }
  function telefoneLimpo(v) { return typeof v === "string" && /^\(\d{2}\) \d{5}-\d{4}$/.test(v); }
  function cidadeOk(v) { return typeof v === "string" && v.length > 1 && !/\d/.test(v) && !/\//.test(v) && !/,/.test(v); }
  function enderecoTarefas(nomeTel, nomeEnd, comFormula) {
    return [
      { texto: "<b>Telefone sem o +55</b>: selecione " + nomeTel + " e use <b>Substituir Valores</b>." + (comFormula ? " Valor a ser localizado: <code>+55 </code> (com o espaço); Substituir por: nada." : ""),
        teste: function (ed) { return !!colunaQue(ed, telefoneLimpo); } },
      { texto: "<b>UF numa coluna própria</b>: Dividir Coluna › Por Delimitador em " + nomeEnd + (comFormula ? ", delimitador personalizado <code> / </code>, delimitador mais à direita. Depois, renomeie a coluna nova para UF." : ".") ,
        teste: function (ed) { return !!col(ed, "UF") && todos(valores(ed, "UF"), function (v) { return UF.test(v); }); } },
      { texto: "<b>Cidade numa coluna própria</b>" + (comFormula ? ": a cidade vem depois do CEP. Divida o resto do endereço pela vírgula mais à direita (<code>, </code>) e o pedaço \"CEP Cidade\" pelo espaço mais à esquerda. Renomeie para CEP e Cidade." : ", sem o CEP grudado."),
        teste: function (ed) { return !!col(ed, "Cidade") && todos(valores(ed, "Cidade"), cidadeOk); } }
    ];
  }

  CFG.entregas = {
    base: "entregas", consulta: "Entregas", outras: ["Entregadores", "Empresas Clientes", "Veículos"],
    tarefas: [
      { texto: "<b>Remover Linhas › Remover Linhas em Branco</b>. A tabela chega com 4.997 linhas. Quantas eram linhas em branco?", teste: function (ed) { var t = ultima(ed); return !t.erro && t.linhas.length === 4598; } },
      { texto: "Selecione <b>Data e Hora da Entrega</b> e, em <b>Adicionar Coluna</b>, use <b>Data › Somente Data</b> e <b>Hora › Somente Hora</b>.", teste: function (ed) {
        var t = ultima(ed); return !t.erro && t.cols.some(function (c) { return c.tipo === "data"; }) && t.cols.some(function (c) { return c.tipo === "hora"; });
      } },
      { texto: "Renomeie as colunas novas para <b>Data da Entrega</b> e <b>Hora da Entrega</b> (clique duplo no título) e remova a coluna original.", teste: function (ed) {
        return !!col(ed, "Data da Entrega") && !!col(ed, "Hora da Entrega") && !col(ed, "Data e Hora da Entrega");
      } },
      { texto: "Tire o <b>(R$)</b> e o <b>(%)</b> dos nomes: Valor do Conteúdo, Valor Final da Entrega e Porcentagem de Taxa.", teste: function (ed) {
        return !!col(ed, "Valor do Conteúdo") && !!col(ed, "Valor Final da Entrega") && !!col(ed, "Porcentagem de Taxa");
      } },
      { texto: "<b>Fechar e Aplicar</b>: as 4.598 entregas vão para o modelo.", teste: function (ed) { return ed.carregado && ed.carregado.linhas === 4598; } }
    ]
  };

  CFG.entregadores = {
    base: "entregadores", consulta: "Entregadores", outras: ["Entregas", "Empresas Clientes", "Veículos"],
    tarefas: [
      { texto: "<b>Nome Completo</b>: clique em Nome, Ctrl + clique em Sobrenome e use <b>Mesclar Colunas</b> com o separador Espaço.", teste: function (ed) {
        var v = valores(ed, "Nome Completo"); return !!v && v[0] === "Vinícius Nunes";
      } }
    ].concat(enderecoTarefas("Telefone", "Endereço", true), [
      { texto: "<b>Fechar e Aplicar</b>: os 124 entregadores vão para o modelo.", teste: function (ed) { return ed.carregado && ed.carregado.linhas === 124 && !!col(ed, "UF"); } }
    ])
  };

  CFG.empresas = {
    base: "empresas", consulta: "Empresas Clientes", outras: ["Entregas", "Entregadores", "Veículos"],
    tarefas: enderecoTarefas("Telefone de Contato", "Endereço", false).concat([
      { texto: "<b>Fechar e Aplicar</b>: as 111 empresas vão para o modelo.", teste: function (ed) { return ed.carregado && ed.carregado.linhas === 111 && !!col(ed, "UF"); } }
    ])
  };

  document.querySelectorAll("[data-pq]").forEach(function (el) {
    var cfg = CFG[el.getAttribute("data-pq")];
    if (!cfg) return;
    if (!window.DADOS_ENTREGAS) { el.textContent = "Os dados da aula não carregaram (js/dados-entregas.js)."; return; }
    INST.push(new Editor(el, cfg));
  });

  window.PQ = { instancias: INST, CFG: CFG, converter: converter, diaDe: diaDe, LOCALIDADES: LOCALIDADES, OPS: OPS, fonte: fonte };
})();
