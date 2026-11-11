/* =========================================================
   aula.js — motor da aula em página única (Power BI · Aula 4)
   1. Colorização dos painéis (fórmula DAX, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Laboratórios interativos (construtores desta aula)
   4. Materiais para baixar (cópia embutida quando aberta por file://)
   5. Quiz de verificação

   O Editor do Power Query mora em js/pq.js e o simulador do
   Power BI em js/pbi.js. Os laboratórios daqui mostram as
   linhas reais de js/dados-modelo.js.
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. COLORIZAÇÃO

     data-lang no <pre>: formula (DAX e Power Query) ou texto.
     O conteúdo é lido de pre.textContent, então no HTML fonte
     todo "<" precisa estar escapado como &lt;.
     ====================================================== */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function span(cls, txt) {
    return '<span class="' + cls + '">' + esc(txt) + "</span>";
  }

  /* uma linha de fórmula: Qtd Produzida = SUM(BaseProdução[Qtd Produzida]),
     Text.BetweenDelimiters([Endereço], ", ", " - ", 1, 0). Função em ciano,
     tabela e coluna em azul-claro, texto entre aspas em amarelo, número em lilás. */
  function hlFormula(linha) {
    var re = /("(?:[^"]|"")*")|([A-Za-zÀ-ú_][\wÀ-ú]*\[[^\]]+\]|'[^']+'\[[^\]]+\]|\[[^\]]+\])|([A-Za-zÀ-ú][\wÀ-ú.]*)(?=\s*\()|(\b\d+(?:[.,]\d+)?%?)/g;
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
     3. LABORATÓRIOS

     O HTML descreve o laboratório (data-lab, data-campo,
     data-palco, data-saida, data-eco); aqui mora só o
     construtor de cada um. Cada construtor devolve
     { html, codigo }: o palco e o painel de saída.
     ====================================================== */

  var D = window.DADOS_ENTREGAS;

  function mil(v) { return v.toLocaleString("pt-BR"); }
  function reais(v) { return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(v) { return (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%"; }
  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function dataTexto(dia) { var x = new Date(dia * 864e5); return dois(x.getUTCDate()) + "/" + dois(x.getUTCMonth() + 1) + "/" + x.getUTCFullYear(); }
  function iso(seg) {
    var x = new Date(seg * 1000);
    return x.getUTCFullYear() + "-" + dois(x.getUTCMonth() + 1) + "-" + dois(x.getUTCDate()) + " " + dois(x.getUTCHours()) + ":" + dois(x.getUTCMinutes()) + ":" + dois(x.getUTCSeconds());
  }
  function numero(v) { return typeof v === "number" ? String(v).replace(".", ",") : v; }

  function grade(cab, linhas, o) {
    o = o || {};
    return '<div class="tabela-modelo"><p class="chave-nome">' + esc(o.nome || "") + (o.nota ? " <small>" + esc(o.nota) + "</small>" : "") + "</p><table><thead><tr>" +
      cab.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      linhas.map(function (l) {
        return "<tr" + (l.every(function (c) { return c === null; }) ? ' class="linha-vazia"' : "") + ">" + l.map(function (c) {
          return "<td" + (typeof c === "number" ? ' class="num"' : "") + ">" + (c === null ? "" : esc(numero(c))) + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  /* as abas como o Excel mostra (datas já formatadas) */
  function abaBruta(nome) {
    var cad = function (k, i) { return D[k].linhas[i]; };
    if (nome === "entregas") {
      var E = D.entregas;
      return { cab: E.cab, n: E.seg.length + E.vazias, linha: function (i) {
        if (i >= E.seg.length) return [null, null, null, null, null, null, null, null, null];
        return ["ENT" + ("0000" + (i + 1)).slice(-5), cad("entregadores", E.cpf[i])[0], cad("empresas", E.cnpj[i])[0], cad("veiculos", E.placa[i])[1],
          iso(E.seg[i]), E.descricoes[E.desc[i]], E.conteudo[i] / 100, E.final[i] / 100, E.taxa[i] / 100];
      } };
    }
    var datas = { entregadores: [3, 6, 7], empresas: [5], veiculos: [5] }[nome];
    return { cab: D[nome].cab, n: D[nome].linhas.length, linha: function (i) {
      return D[nome].linhas[i].map(function (v, k) { return datas.indexOf(k) !== -1 && typeof v === "number" ? dataTexto(v) : v; });
    } };
  }

  var ABAS = {
    entregas: { titulo: "Entregas", cada: "uma entrega feita", chave: "Código", liga: "CPF do Entregador → Entregadores · CNPJ do Solicitante → Empresas Clientes · Placa do Veículo → Veículos" },
    entregadores: { titulo: "Entregadores", cada: "um entregador (contratado ou já demitido)", chave: "CPF", liga: "é apontada por Entregas[CPF do Entregador]" },
    empresas: { titulo: "Empresas Clientes", cada: "uma empresa com contrato", chave: "CNPJ", liga: "é apontada por Entregas[CNPJ do Solicitante]" },
    veiculos: { titulo: "Veículos", cada: "um veículo da frota", chave: "Placa", liga: "é apontada por Entregas[Placa do Veículo]" }
  };

  var ETAPAS = {
    receber: { n: "Receber", o: "Ler o pedido: quem é o cliente, o que ele quer saber, que arquivo mandou.", f: "conversa e os slides do caso", a: "aula 1", e: "a missão em uma frase", enc: 1 },
    conhecer: { n: "Conhecer", o: "Abrir a planilha, ver as abas, as colunas e o que cada linha representa.", f: "Excel e o Navegador do Power BI", a: "aula 1", e: "o mapa das quatro abas", enc: 1 },
    tratar: { n: "Tratar", o: "Limpar e padronizar no Power Query: linhas em branco, colunas juntas, prefixos, datas.", f: "Power Query", a: "aulas 1, 3 e 4", e: "tabelas limpas, com as etapas registradas", enc: 1 },
    modelar: { n: "Modelar", o: "Ligar as tabelas pelas chaves para um filtro chegar às outras.", f: "Exibição de modelo", a: "aula 4", e: "três relacionamentos 1 para muitos", enc: 1 },
    calcular: { n: "Calcular", o: "Criar colunas calculadas e medidas em DAX que respondem às perguntas.", f: "barra de fórmulas", a: "aulas 2, 3 e 4", e: "as medidas que sustentam cada análise", enc: 2 },
    apresentar: { n: "Apresentar", o: "Escolher o visual certo para cada pergunta e montar o relatório sobre o fundo.", f: "Visualizações e o Canva", a: "aulas 2 e 3", e: "o relatório numa página", enc: 2 },
    concluir: { n: "Concluir", o: "Transformar números em frases que a empresa entende e em recomendações.", f: "a conversa da turma", a: "esta aula", e: "as conclusões por escrito", enc: 2 },
    compartilhar: { n: "Compartilhar", o: "Entregar o relatório e a documentação de um jeito que o cliente consiga abrir.", f: "Publicar, PDF ou o arquivo .pbix", a: "esta aula", e: "o relatório e o documento entregues", enc: 2 }
  };

  /* faturamento de cada entrega, nas três leituras da regra da taxa */
  var TAXA = { Pequeno: 0.05, "Médio": 0.08, Grande: 0.095 };
  var REGRAS = {
    a: { nome: "Taxa sobre o valor da entrega", dax: "Faturamento da Entrega =\n    Entregas[Valor Final da Entrega] * (1 + Entregas[Taxa por Porte])", f: function (fin, cont, t) { return fin * (1 + t); },
      conta: function (fin, cont, t) { return reais(fin) + " × (1 + " + pct(t) + ")"; } },
    b: { nome: "Taxa sobre o valor do conteúdo", dax: "Faturamento da Entrega =\n    Entregas[Valor Final da Entrega]\n    + Entregas[Valor do Conteúdo] * Entregas[Taxa por Porte]", f: function (fin, cont, t) { return fin + cont * t; },
      conta: function (fin, cont, t) { return reais(fin) + " + " + reais(cont) + " × " + pct(t); } },
    c: { nome: "Só a taxa é da empresa", dax: "Faturamento da Entrega =\n    Entregas[Valor Final da Entrega] * Entregas[Taxa por Porte]", f: function (fin, cont, t) { return fin * t; },
      conta: function (fin, cont, t) { return reais(fin) + " × " + pct(t); } }
  };

  var MEDIDAS_P = {
    faturamento: { n: "o faturamento", m: "Faturamento Entregas", soEntregas: true },
    quantidade: { n: "o número de entregas", m: "Total de Entregas", soEntregas: true },
    ticket: { n: "o faturamento médio por entrega", m: "Faturamento Entregas ÷ Total de Entregas (DIVIDE)", soEntregas: true },
    contratos: { n: "o valor dos contratos", m: "Faturamento com Contratos", tabela: "Empresas Clientes" },
    salarios: { n: "a despesa com salários", m: "Despesa com Salários", tabela: "Entregadores" }
  };
  var DIMENSOES = {
    uf: { n: "UF da empresa cliente", c: "'Empresas Clientes'[UF]", t: "Empresas Clientes", v: "Gráfico de colunas (ou de barras, com muitas UFs)" },
    porte: { n: "porte da empresa cliente", c: "'Empresas Clientes'[Porte]", t: "Empresas Clientes", v: "Gráfico de colunas, de área ou de rosca (só 3 categorias)" },
    entregador: { n: "entregador", c: "Entregadores[Nome Completo]", t: "Entregadores", v: "Gráfico de barras com N superior (124 nomes não cabem)" },
    mes: { n: "mês", c: "Entregas[Data da Entrega] › Ano e Mês", t: "Entregas", v: "Gráfico de linhas ou de colunas, em ordem de data" },
    hora: { n: "hora do dia", c: "Entregas[Hora da Entrega] (extraia a hora numa coluna)", t: "Entregas", v: "Gráfico de colunas de 0 a 23 h" },
    conteudo: { n: "tipo de conteúdo", c: "Entregas[Descrição do Conteúdo]", t: "Entregas", v: "Gráfico de barras, do maior para o menor" },
    veiculo: { n: "tipo de veículo", c: "Veículos[Tipo]", t: "Veículos", v: "Gráfico de rosca ou de colunas" },
    manutencao: { n: "veículo com manutenção em breve", c: "Veículos[Manutenção em Breve]", t: "Veículos", v: "Cartão ou rosca (Sim × Não)" }
  };

  var CANAIS = {
    gestor: { titulo: "O gestor quer ver no celular e no computador, sempre atualizado", jeito: "Publicar no serviço do Power BI e compartilhar o relatório",
      caminho: "Página Inicial › Publicar › escolher o workspace\nno navegador: abrir o relatório › Compartilhar › e-mail da pessoa",
      cuidado: "Quem publica precisa de conta corporativa ou de estudante (não serve e-mail pessoal). Para compartilhar, a regra geral é: quem compartilha e quem recebe precisam de licença Pro, exceto em capacidade Premium ou Fabric." },
    reuniao: { titulo: "Uma reunião com a diretoria, com o relatório impresso ou na tela", jeito: "Exportar para PDF",
      caminho: "Arquivo › Exportar › Exportar para PDF\nescolher as páginas, abrir o PDF e conferir",
      cuidado: "O PDF é uma foto: não tem filtro nem clique. Deixe a segmentação no período certo antes de exportar." },
    analista: { titulo: "Outro analista vai continuar o trabalho", jeito: "Enviar o arquivo .pbix e o documento do projeto",
      caminho: "Arquivo › Salvar como › Estudo de Caso.pbix\njunto: a planilha e o documento .txt das decisões",
      cuidado: "O .pbix guarda os dados importados. Confira se a pessoa pode ver tudo o que está nele (salários, CPFs, telefones)." },
    publico: { titulo: "Mostrar o projeto num site aberto ou num portfólio", jeito: "Publicar na Web (público), com dados fictícios",
      caminho: "no serviço: Arquivo › Inserir relatório › Publicar na Web (público)\ncopiar o link ou o código de incorporação",
      cuidado: "Qualquer pessoa com o link vê tudo, sem senha. Nunca use com dados reais de pessoas ou de clientes. A organização pode ter desligado a opção." }
  };

  var construtores = {

    /* 01 · as etapas da análise */
    fluxo: function (v) {
      var chaves = Object.keys(ETAPAS), e = ETAPAS[v.etapa];
      var html = '<ol class="fluxo">' + chaves.map(function (k, i) {
        var x = ETAPAS[k];
        return '<li class="fluxo-passo' + (k === v.etapa ? " fluxo-passo--atual" : "") + (x.enc === 2 ? " fluxo-passo--e2" : "") + '"><span>' + (i + 1) + "</span>" + esc(x.n) + "</li>";
      }).join("") + "</ol>" +
        '<div class="fluxo-card"><p class="fluxo-enc">Encontro ' + e.enc + "</p><h4>" + esc(e.n) + "</h4><p>" + esc(e.o) + "</p>" +
        "<dl><dt>Ferramenta</dt><dd>" + esc(e.f) + "</dd><dt>Onde vimos</dt><dd>" + esc(e.a) + "</dd><dt>Entregável</dt><dd>" + esc(e.e) + "</dd></dl></div>";
      return { html: html, codigo: "etapa " + (chaves.indexOf(v.etapa) + 1) + " de 8 · " + e.n + "\nencontro " + e.enc + "\n\nentregável:\n  " + e.e };
    },

    /* 02 · as quatro abas da planilha */
    abas: function (v) {
      var a = abaBruta(v.aba), info = ABAS[v.aba], cab = a.cab, linhas = [], i;
      for (i = 0; i < 5; i++) linhas.push(a.linha(i));
      var fim = v.aba === "entregas";
      if (fim) { linhas.push(a.linha(D.entregas.seg.length - 1)); linhas.push(a.linha(D.entregas.seg.length)); }
      var html = grade(cab, linhas, { nome: "aba " + info.titulo, nota: mil(a.n) + " linhas · " + cab.length + " colunas" + (fim ? " · amostra: 5 primeiras, a última entrega e a primeira linha depois dela" : " · 5 primeiras linhas") });
      return { html: html, codigo: "aba " + info.titulo + "\n  " + mil(a.n) + " linhas, " + cab.length + " colunas\n  cada linha é " + info.cada + "\n  chave: " + info.chave + "\n  " + info.liga +
        "\n\ncolunas:\n  " + cab.join("\n  ") };
    },

    /* 08 · a regra da taxa: três leituras, três faturamentos */
    taxa: function (v) {
      var R = REGRAS[v.regra], E = D.entregas, C = D.empresas.linhas, porte = function (i) { return C[E.cnpj[i]][7]; };
      var tot = { Pequeno: 0, "Médio": 0, Grande: 0 }, n = { Pequeno: 0, "Médio": 0, Grande: 0 }, total = 0;
      for (var i = 0; i < E.seg.length; i++) {
        var p = porte(i), x = R.f(E.final[i] / 100, E.conteudo[i] / 100, TAXA[p]);
        tot[p] += x; n[p]++; total += x;
      }
      var k = +v.exemplo, p0 = porte(k), fin = E.final[k] / 100, cont = E.conteudo[k] / 100;
      var max = Math.max(tot.Pequeno, tot["Médio"], tot.Grande);
      var html = '<div class="taxa">' +
        '<div class="taxa-ex"><p class="chave-nome">ENT' + ("0000" + (k + 1)).slice(-5) + " · " + esc(E.descricoes[E.desc[k]]) + "</p>" +
        "<dl><dt>Valor do Conteúdo</dt><dd>" + reais(cont) + "</dd><dt>Valor Final da Entrega</dt><dd>" + reais(fin) + "</dd>" +
        "<dt>Porte do cliente</dt><dd>" + esc(p0) + " → taxa " + pct(TAXA[p0]) + "</dd>" +
        "<dt>Faturamento da Entrega</dt><dd><b>" + reais(R.f(fin, cont, TAXA[p0])) + "</b><small>" + esc(R.conta(fin, cont, TAXA[p0])) + "</small></dd></dl></div>" +
        '<div class="taxa-barras"><p class="chave-nome">Faturamento das entregas por porte</p>' +
        ["Pequeno", "Médio", "Grande"].map(function (q) {
          return '<div class="taxa-barra"><span>' + q + '</span><i style="width:' + (tot[q] / max * 100).toFixed(1) + '%"></i><b>' + reais(tot[q]) + "</b></div>";
        }).join("") + '<p class="taxa-total">Total das 4.598 entregas: <b>' + reais(total) + "</b></p></div></div>";
      return { html: html, codigo: "// " + R.nome + "\n" + R.dax + "\n\n// total: " + reais(total) };
    },

    /* 09 · de uma medida e uma dimensão nasce uma pergunta */
    perguntas: function (v) {
      var m = MEDIDAS_P[v.medida], d = DIMENSOES[v.dimensao];
      var semRelacao = m.tabela && m.tabela !== d.t;
      var texto = "Qual é " + m.n + " por " + d.n + "?";
      var html = '<div class="pergunta-gerada"><p class="pergunta-texto">' + esc(texto) + "</p>" +
        '<dl><dt>Medida</dt><dd>' + esc(m.m) + "</dd><dt>Eixo</dt><dd>" + esc(d.c) + "</dd><dt>Visual sugerido</dt><dd>" + esc(d.v) + "</dd></dl>" +
        (semRelacao ? '<p class="pergunta-alerta">Cuidado: ' + esc(m.m) + " está em " + esc(m.tabela) + " e o filtro de " + esc(d.t) + " não chega lá pelas relações (o filtro anda do lado 1 para o lado *). O número vai se repetir em todas as categorias. Essa pergunta faz sentido para a empresa?</p>"
          : '<p class="pergunta-ok">O filtro de ' + esc(d.t) + " chega às entregas pelas relações: a pergunta funciona no modelo.</p>") + "</div>";
      return { html: html, codigo: "pergunta:\n  " + texto + "\n\nmedida: " + m.m + "\neixo:   " + d.c + "\nvisual: " + d.v };
    },

    /* 15 · como compartilhar depende de quem vai receber */
    compartilhar: function (v) {
      var c = CANAIS[v.canal];
      var html = '<div class="canal"><p class="canal-situacao">' + esc(c.titulo) + '</p><p class="canal-jeito">' + esc(c.jeito) + "</p>" +
        '<p class="canal-cuidado"><b>Cuidado:</b> ' + esc(c.cuidado) + "</p></div>";
      return { html: html, codigo: c.jeito + "\n\n" + c.caminho };
    }
  };

  document.querySelectorAll("[data-lab]").forEach(function (lab) {
    var construtor = construtores[lab.getAttribute("data-lab")];
    if (!construtor || !D) return;
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
      palco.innerHTML = r.html;
      if (saida) { saida.textContent = r.codigo; colorir(saida); }
    }

    campos.forEach(function (c) {
      c.addEventListener("input", atualizar);
      c.addEventListener("change", atualizar);
    });
    atualizar();
  });

  /* ======================================================
     4. QUADROS DA TURMA E DOCUMENTO DO PROJETO

     Perguntas, decisões e conclusões que a turma escreve
     durante a aula. Ficam guardadas neste navegador
     (localStorage), para o segundo encontro começar de onde o
     primeiro parou. O documento junta tudo num .txt para baixar.
     ====================================================== */

  var PREFIXO = "pbi-aula5:";
  function ler(chave, padrao) {
    try { var x = localStorage.getItem(PREFIXO + chave); return x === null ? padrao : JSON.parse(x); } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento: o quadro funciona até fechar a página */ }
  }

  /* a mesma lista pode aparecer em mais de uma seção (as perguntas do
     encontro 1 voltam no encontro 2): todas as cópias andam juntas */
  var QUADROS = {}, LISTAS = {};
  function lista(nome) {
    if (!LISTAS[nome]) LISTAS[nome] = { itens: ler(nome, []), vistas: [] };
    return LISTAS[nome];
  }
  document.querySelectorAll("[data-quadro]").forEach(function (q) {
    var nome = q.getAttribute("data-quadro"), L = lista(nome);
    var ol = q.querySelector("[data-lista]"), campo = q.querySelector("[data-novo]"), form = q.querySelector("form");
    var marcavel = q.hasAttribute("data-marcavel");
    function salvar() { gravar(nome, L.itens); L.vistas.forEach(function (f) { f(); }); avisarDoc(); }
    function render() {
      ol.innerHTML = L.itens.length ? L.itens.map(function (it, i) {
        return '<li class="' + (it.feito ? "feito" : "") + '">' +
          (marcavel ? '<button type="button" class="quadro-marca" data-i="' + i + '" aria-pressed="' + !!it.feito + '" title="Marcar como respondida">' + (it.feito ? "✓" : "") + "</button>" : '<span class="quadro-num">' + (i + 1) + "</span>") +
          '<span class="quadro-texto">' + esc(it.texto) + '</span><button type="button" class="quadro-x" data-x="' + i + '" title="Apagar">✕</button></li>';
      }).join("") : '<li class="quadro-vazio">' + esc(q.getAttribute("data-vazio") || "Nada ainda.") + "</li>";
    }
    L.vistas.push(render);
    if (form) form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var t = campo.value.trim();
      if (!t) return;
      L.itens.push({ texto: t, feito: false });
      campo.value = "";
      salvar();
    });
    ol.addEventListener("click", function (ev) {
      var x = ev.target.closest("[data-x]"), m = ev.target.closest(".quadro-marca");
      if (x) { L.itens.splice(+x.getAttribute("data-x"), 1); salvar(); }
      else if (m) { var it = L.itens[+m.getAttribute("data-i")]; it.feito = !it.feito; salvar(); }
    });
    QUADROS[nome] = function () { return L.itens; };
    render();
  });

  /* documento: quatro partes editáveis + os quadros */
  var doc = document.querySelector("[data-documento]");
  var avisarDoc = function () {};
  if (doc) {
    var partes = Array.prototype.slice.call(doc.querySelectorAll("textarea[data-parte]"));
    var previa = doc.querySelector("[data-previa]");
    partes.forEach(function (t) {
      var salvo = ler("doc-" + t.getAttribute("data-parte"), null);
      if (salvo !== null) t.value = salvo;
      t.addEventListener("input", function () { gravar("doc-" + t.getAttribute("data-parte"), t.value); montar(); });
    });
    var montar = function () {
      var linhas = ["Análise de Dados para Empresa de Entregas", "Estudo de caso · Análise de Dados com Power BI · Aula 5 · SEST SENAT, Unidade B086 - Foz do Iguaçu/PR", ""];
      partes.forEach(function (t) {
        linhas.push(t.getAttribute("data-titulo") + ":");
        linhas.push(t.value.trim() ? t.value.replace(/\s+$/, "") : "\t(a preencher)");
        linhas.push("");
      });
      [["perguntas", "Perguntas da turma"], ["decisoes", "Decisões da turma"], ["conclusoes", "Conclusões"]].forEach(function (q) {
        var it = QUADROS[q[0]] ? QUADROS[q[0]]() : [];
        linhas.push(q[1] + ":");
        linhas.push(it.length ? it.map(function (x, i) { return "\t" + (i + 1) + " - " + x.texto; }).join("\n") : "\t(a preencher)");
        linhas.push("");
      });
      previa.textContent = linhas.join("\n");
      return previa.textContent;
    };
    avisarDoc = montar;
    doc.querySelector("[data-baixar-doc]").addEventListener("click", function () {
      var blob = new Blob([montar()], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Análise de Dados para Empresa de Entregas.txt";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
    montar();
  }

  /* ======================================================
     5. QUIZ DE VERIFICAÇÃO

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
})();
