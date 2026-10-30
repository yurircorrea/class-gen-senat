/* =========================================================
   pq.js — simulador do Editor do Power Query (aula 3)

   Não é o Power Query, mas faz o que a aula ensina sobre as
   linhas reais da Base Vendas e da Base Devoluções: cada
   comando vira uma etapa aplicada (com a fórmula M), clicar
   numa etapa mostra a tabela daquele momento e o ✕ apaga a
   etapa. Datas em texto americano viram Error ou data errada
   com a localidade Português (Brasil), como no programa.

   1. Utilidades: valores, datas, erros
   2. Fontes: as planilhas como chegam ao Power Query
   3. Operações (etapas) e a fórmula M de cada uma
   4. Interface: faixa de opções, menus, caixas de diálogo,
      grade com qualidade da coluna, Etapas Aplicadas
   5. Laboratórios desta aula (configuração e tarefas)

   Uso no HTML: <div class="pq-sim" data-pq="vendasLimpeza"></div>
   Depende de js/dados-vendas.js.
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
    qualquer: { nome: "Qualquer", icone: "ABC123", m: "type any" }
  };

  /* converte um valor para o tipo, com a localidade (texto de data "6/30/2018") */
  function converter(v, tipo, loc) {
    if (vazio(v) && v !== "") return null;
    if (eErro(v)) return v;
    if (tipo === "texto") return typeof v === "number" ? String(v) : String(v);
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

  function fonteVendas() {
    var V = window.DADOS_VENDAS, c = V.colunas, n = c.qtd.length, linhas = new Array(n);
    for (var i = 0; i < n; i++) {
      linhas[i] = [V.sku[c.sku[i]], V.produtos[c.prod[i]], c.qtd[i], V.nomes[c.nome[i]], V.sobrenomes[c.sob[i]], c.data[i], V.lojas[c.loja[i]], c.preco[i], null];
    }
    return { arquivo: "Base Vendas.xlsx", aba: V.aba, cab: V.cabecalho.concat([null]), linhas: linhas };
  }
  function fonteDevolucoes() {
    var D = window.DADOS_DEVOLUCOES, linhas = D.linhas.map(function (l) { return l.concat([null]); });
    for (var i = 0; i < D.brancas; i++) linhas.push([null, null, null, null, null, null, null]);
    return { arquivo: "Base Devoluções.xlsx", aba: D.aba, cab: D.cabecalho.concat([null]), linhas: linhas };
  }
  var FONTES = {};
  function fonte(nome) {
    if (!FONTES[nome]) FONTES[nome] = nome === "vendas" ? fonteVendas() : fonteDevolucoes();
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
      formula: function (e) { return '= Excel.Workbook(File.Contents("C:\\Aula 3\\' + fonte(e.base).arquivo + '"), null, true)'; }
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
      aplicar: function (t) {
        return {
          cols: t.cols.map(function (c, i) {
            var amostra = t.linhas.slice(0, 200).map(function (l) { return l[i]; }).filter(function (v) { return !vazio(v); });
            var tipo = !amostra.length ? "qualquer" : amostra.every(function (v) { return typeof v === "number"; }) ? "inteiro" : "texto";
            return { nome: c.nome, tipo: tipo };
          }),
          linhas: t.linhas
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
        if (t.cols[i].tipo !== "data") throw new PQErro("Expression.Error: Não é possível converter o valor do tipo Text para o tipo Date.");
        var f = function (v) { return eErro(v) ? v : vazio(v) ? null : e.nomeMes ? MESES[partes(v)[1] - 1] : partes(v)[1]; };
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
      { op: "tipoAuto", nome: "Tipo Alterado" }
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
    this.raiz.addEventListener("dblclick", function (ev) {
      var th = ev.target.closest("th[data-col]");
      if (th) self.abrirDialogo("renomear", { col: th.getAttribute("data-col") });
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
  function iconeTipo(tipo) { return tipo === "data" ? ICO_DATA : '<span class="pq-tipo">' + TIPOS[tipo].icone + "</span>"; }

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
      html += grupo("Transformar", b("menu-tipo-faixa", "Tipo de Dados: " + this.tipoSel() + " ▾"));
    } else if (g === "transformar") {
      html += grupo("Qualquer Coluna", b("menu-tipo-faixa", "Tipo de Dados: " + this.tipoSel() + " ▾") + b("renomear", "Renomear"));
      html += grupo("Coluna de Texto", b("mesclar", "Mesclar Colunas"));
      html += grupo("Coluna de Data e Hora", b("menu-data-transformar", "Data ▾"));
    } else {
      html += grupo("De Texto", b("mesclar", "Mesclar Colunas"));
      html += grupo("De Data e Hora", b("menu-data-adicionar", "Data ▾"));
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
    t.cols.forEach(function (c, i) { if (c.tipo === "data") ci = i; });
    if (ci !== -1) t.linhas.forEach(function (l) { if (eErro(l[ci])) erros++; });
    html += '<p class="pq-status">' + t.cols.length + " COLUNAS, " + mil(n) + " LINHAS · Qualidade da coluna com base nas 1000 primeiras linhas" +
      (erros ? ' · <b class="pq-status-erro">' + mil(erros) + " ERROS NA COLUNA " + esc(t.cols[ci].nome.toUpperCase()) + "</b>" : "") + "</p>";
    this.el.grade.innerHTML = html;
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
    var tiposLista = ["decimal", "inteiro", "data", "texto"].map(function (t) { return ["tipo:" + t, TIPOS[t].nome]; });
    if (this.menu.tipo === "linhas") itens = [["brancas", "Remover Linhas em Branco"]];
    else if (this.menu.tipo === "tipo") itens = tiposLista.concat([["-"], ["localidade", "Usando a Localidade..."]]);
    else if (this.menu.tipo === "coluna") itens = [["remover", "Remover"], ["renomear", "Renomear..."], ["-"], ["tipo:texto", "Alterar Tipo › Texto"], ["tipo:inteiro", "Alterar Tipo › Número Inteiro"], ["tipo:data", "Alterar Tipo › Data"], ["localidade", "Alterar Tipo › Usando a Localidade..."], ["-"], ["mesclar", "Mesclar Colunas"]];
    else if (this.menu.tipo === "data-transformar" || this.menu.tipo === "data-adicionar") itens = [["mes:" + this.menu.tipo, "Mês › Mês"], ["nomemes:" + this.menu.tipo, "Mês › Nome do Mês"]];
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
    else if (d.tipo === "mesclar") this.aplicar({ op: "mesclar", cols: this.sel.slice(), sep: val("sep"), novo: val("novo").trim() || "Mesclado" });
    else if (d.tipo === "renomear") {
      var para = val("para").trim();
      if (para && para !== d.dados.col) this.aplicar({ op: "renomear", de: d.dados.col, para: para });
    }
    this.dialogo = null;
    this.render();
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
        if (t.erro || this.colSel(t).tipo !== "data") { this.avisar("Data fica cinza: a coluna " + this.sel[0] + " não é do tipo Data (ícone de calendário)."); return; }
        this.abrirMenu(acao.replace("menu-", ""), a); return;
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
  function temEtapa(ed, op, fn) { return ed.etapas.some(function (e) { return e.op === op && (!fn || fn(e)); }); }
  function errosData(ed) { var x = col(ed, "Data"); if (!x) return 0; return x.t.linhas.filter(function (l) { return eErro(l[x.i]); }).length; }

  var LIMPAS = [{ op: "remover", cols: ["Column9"] }, { op: "brancas" }];
  var DATA_OK = { op: "tipo", col: "Data", tipo: "data", loc: "en-US" };
  var NOME = { op: "mesclar", cols: ["Primeiro Nome", "Sobrenome"], sep: " ", novo: "Nome Completo" };

  CFG.vendasLimpeza = {
    base: "vendas", consulta: "Vendas 2019",
    tarefas: [
      { texto: "Em Configurações de Consulta › Nome, renomeie a consulta para <b>Base Vendas</b>.", teste: function (ed) { return ed.consulta === "Base Vendas"; } },
      { texto: "Selecione a última coluna (<b>Column9</b>, toda vazia) e use <b>Remover Colunas</b>.", teste: function (ed) { return !col(ed, "Column9") && !ultima(ed).erro; } },
      { texto: "<b>Remover Linhas › Remover Linhas em Branco</b>. Confira quantas linhas sobraram.", teste: function (ed) { return temEtapa(ed, "brancas"); } },
      { texto: "Clique em <b>Cabeçalhos Promovidos</b> em Etapas Aplicadas: a tabela volta no tempo. Depois clique na última etapa.", teste: function (ed) { return ed.visitou[2] && ed.atual === ed.etapas.length - 1; } }
    ]
  };

  CFG.vendasData = {
    base: "vendas", consulta: "Base Vendas", prontas: LIMPAS,
    tarefas: [
      { texto: "Clique no ícone <b>ABC</b> da coluna Data e escolha <b>Data</b>. Olhe a qualidade da coluna.", teste: function (ed) { return temEtapa(ed, "tipo", function (e) { return e.col === "Data" && !e.loc; }) || ed.feitas[0]; } },
      { texto: "Apague a etapa que deu errado (o <b>✕</b> ao lado dela em Etapas Aplicadas).", teste: function (ed) { return ed.feitas[0] && !temEtapa(ed, "tipo", function (e) { return e.col === "Data" && !e.loc; }); } },
      { texto: "Botão direito no título Data › <b>Alterar Tipo › Usando a Localidade</b>: Data, <b>Inglês (Estados Unidos)</b>.", teste: function (ed) { var x = col(ed, "Data"); return x && x.c.tipo === "data" && errosData(ed) === 0 && x.t.linhas[0][x.i] === diaDe(2018, 6, 30); } }
    ]
  };

  CFG.vendasNome = {
    base: "vendas", consulta: "Base Vendas", prontas: LIMPAS.concat([DATA_OK]),
    tarefas: [
      { texto: "Clique em <b>Primeiro Nome</b> e Ctrl + clique em <b>Sobrenome</b> (a ordem da seleção é a ordem do texto).", teste: function (ed) { return ed.sel.length === 2 && ed.sel[0] === "Primeiro Nome" || temEtapa(ed, "mesclar"); } },
      { texto: "Transformar › <b>Mesclar Colunas</b>, separador <b>Espaço</b>, nome <b>Nome Completo</b>.", teste: function (ed) { var x = col(ed, "Nome Completo"); return x && x.t.linhas[0][x.i] === "Gabriel Thoni"; } }
    ]
  };

  CFG.vendasMes = {
    base: "vendas", consulta: "Base Vendas", prontas: LIMPAS.concat([DATA_OK, NOME]),
    tarefas: [
      { texto: "Selecione a coluna Data e use <b>Adicionar Coluna › Data › Mês › Mês</b>: a coluna Data continua lá.", teste: function (ed) { var x = col(ed, "Mês"); return x && x.t.linhas[0][x.i] === 6 && col(ed, "Data"); } },
      { texto: "Compare com <b>Transformar › Data › Mês</b>: ele troca a própria coluna Data pelo número do mês. Se testar, apague a etapa.", teste: function (ed) { return temEtapa(ed, "mes", function (e) { return !e.adicionar; }) || ed.feitas[1]; } },
      { texto: "<b>Fechar e Aplicar</b>: 9.999 linhas, sem erros.", teste: function (ed) { return ed.carregado && ed.carregado.erros === 0 && col(ed, "Mês"); } }
    ]
  };

  CFG.devolucoes = {
    base: "devolucoes", consulta: "Devoluções 2019", outras: ["Base Vendas"],
    tarefas: [
      { texto: "Renomeie a consulta para <b>Base Devoluções</b>.", teste: function (ed) { return ed.consulta === "Base Devoluções"; } },
      { texto: "Remova a coluna vazia (<b>Column7</b>) e as <b>linhas em branco</b>: de 9.999 linhas para 499.", teste: function (ed) { var t = ultima(ed); return !t.erro && !col(ed, "Column7") && t.linhas.length === 499; } },
      { texto: "Data com localidade <b>Inglês (Estados Unidos)</b>, como na Base Vendas.", teste: function (ed) { var x = col(ed, "Data"); return x && x.c.tipo === "data" && errosData(ed) === 0 && x.t.linhas[0][x.i] === diaDe(2018, 12, 14); } },
      { texto: "<b>Fechar e Aplicar</b>.", teste: function (ed) { return ed.carregado && ed.carregado.linhas === 499 && ed.carregado.erros === 0; } }
    ]
  };

  document.querySelectorAll("[data-pq]").forEach(function (el) {
    var cfg = CFG[el.getAttribute("data-pq")];
    if (!cfg) return;
    if (!window.DADOS_VENDAS) { el.textContent = "Os dados da aula não carregaram (js/dados-vendas.js)."; return; }
    INST.push(new Editor(el, cfg));
  });

  window.PQ = { instancias: INST, CFG: CFG, converter: converter, diaDe: diaDe, LOCALIDADES: LOCALIDADES };
})();
