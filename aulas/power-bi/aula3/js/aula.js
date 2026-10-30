/* =========================================================
   aula.js — motor da aula em página única (Power BI · Aula 3)
   1. Colorização dos painéis (fórmula DAX, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Laboratórios interativos (construtores desta aula)
   4. Quiz de verificação

   O Editor do Power Query mora em js/pq.js e o simulador do
   Power BI em js/pbi.js. Os laboratórios daqui desenham os
   visuais com os totais reais de js/dados-vendas.js.
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

  var PBI = window.PBI;

  /* totais reais das duas bases (Base Vendas e Base Devoluções) */
  var TOT = null;
  function totais() {
    if (TOT) return TOT;
    var V = window.DADOS_VENDAS, c = V.colunas, n = c.qtd.length;
    var qtd = {}, fatMes = {}, fatLoja = {}, qtdLoja = {}, fat = 0;
    for (var i = 0; i < n; i++) {
      var p = V.produtos[c.prod[i]], f = c.qtd[i] * c.preco[i], mes = +c.data[i].split("/")[0], loja = V.lojas[c.loja[i]];
      qtd[p] = (qtd[p] || 0) + c.qtd[i];
      fatMes[mes] = (fatMes[mes] || 0) + f;
      fatLoja[loja] = (fatLoja[loja] || 0) + f;
      qtdLoja[loja] = (qtdLoja[loja] || 0) + c.qtd[i];
      fat += f;
    }
    var dev = {};
    window.DADOS_DEVOLUCOES.linhas.forEach(function (l) { dev[l[1]] = (dev[l[1]] || 0) + l[2]; });
    function ordenar(o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }); }
    TOT = { qtd: ordenar(qtd), fatMes: fatMes, fatLoja: fatLoja, qtdLoja: qtdLoja, fat: fat, dev: ordenar(dev), produtos: V.produtos.slice() };
    return TOT;
  }
  function f(v, o) { return PBI.valorPbi(v, o || {}); }
  function mil(v) { return v.toLocaleString("pt-BR"); }

  /* temas de relatório (Exibição › Temas): as primeiras cores de cada um */
  var TEMAS = {
    padrao: { nome: "Padrão", cores: ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300"] },
    classico: { nome: "Clássico", cores: ["#01B8AA", "#374649", "#FD625E", "#F2C80F", "#5F6B6D", "#8AD4EB", "#FE9666"] },
    executivo: { nome: "Executivo", cores: ["#3257A8", "#37A794", "#8B3D88", "#DD6B7F", "#6B91C9", "#F5C869", "#77C4A8"] }
  };

  /* barras horizontais em SVG, no jeito do Power BI */
  function barrasSvg(itens, o) {
    o = o || {};
    var W = 560, linha = 34, esq = 110, H = itens.length * linha + 8, max = itens[0][1];
    var s = '<svg class="graf graf--pbi' + (o.escuro ? " graf--escuro" : "") + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.titulo || "") + '">';
    if (o.grade) for (var k = 1; k <= 4; k++) { var gx = esq + (W - esq - 70) * k / 4; s += '<line class="g-grade" x1="' + gx + '" x2="' + gx + '" y1="0" y2="' + H + '"/>'; }
    itens.forEach(function (it, i) {
      var y = 4 + i * linha, w = it[1] / max * (W - esq - 70);
      s += '<text class="g-eixo" x="' + (esq - 8) + '" y="' + (y + 19) + '" text-anchor="end">' + esc(it[0]) + "</text>" +
        '<rect x="' + esq + '" y="' + y + '" width="' + w.toFixed(1) + '" height="24" fill="' + (o.cor || "#118DFF") + '"/>' +
        (o.rotulos === false ? "" : '<text class="g-rotulo" x="' + (esq + w + 6).toFixed(1) + '" y="' + (y + 18) + '">' + (o.fmt ? o.fmt(it[1]) : mil(it[1])) + "</text>");
    });
    return s + "</svg>";
  }

  function visualPbi(titulo, corpo, o) {
    o = o || {};
    return '<div class="pbi-visual' + (o.classe ? " " + o.classe : "") + '"' + (o.estilo ? ' style="' + o.estilo + '"' : "") + ">" +
      (titulo ? '<p class="pbi-titulo"' + (o.estiloTitulo ? ' style="' + o.estiloTitulo + '"' : "") + ">" + esc(titulo) + "</p>" : "") + corpo + "</div>";
  }

  /* nome da loja ao lado da bolha; no Sudeste, uns à esquerda e outros à direita para não encavalar */
  var LADO = { "São Paulo": "esq", "Curitiba": "esq", "Porto Alegre": "esq", "Rio de Janeiro": "dir", "Belo Horizonte": "dir", "Goiás": "esq", "Salvador": "esq", "Fortaleza": "esq", "Recife": "esq" };
  function rotuloMapa(loja, c, r) {
    var lado = LADO[loja], dir = lado === "dir";
    return '<text class="mapa-nome' + (loja === "Goiás" ? " mapa-nome--alerta" : "") + '" x="' + (c[0] + (dir ? r + 4 : -r - 4)).toFixed(1) + '" y="' + (c[1] + 4).toFixed(1) +
      '" text-anchor="' + (dir ? "start" : "end") + '">' + esc(loja) + "</text>";
  }

  var construtores = {

    /* 07 · tema do relatório e rótulos de dados */
    tema: function (v) {
      var T = totais(), tema = TEMAS[v.tema];
      var corpo = barrasSvg(T.qtd, { cor: tema.cores[0], rotulos: v.rotulos === "true", titulo: "Quantidade Vendida por Produto" });
      var amostra = '<div class="tema-cores">' + tema.cores.map(function (c) { return '<i style="background:' + c + '" title="' + c + '"></i>'; }).join("") + "<span>cores do tema " + tema.nome + "</span></div>";
      return {
        html: visualPbi("Quantidade Vendida por Produto", corpo) + amostra,
        codigo: "Visualizações › Gráfico de barras clusterizado\n  Eixo Y: Produto\n  Eixo X: Quantidade Vendida (Soma)\n" +
          "Exibição › Temas › " + tema.nome + "\n" +
          "Formatar visual › Visual › Rótulos de dados: " + (v.rotulos === "true" ? "Ativado" : "Desativado")
      };
    },

    /* 08 · cartões: moeda e o produto mais vendido */
    primeiro: function (v) {
      var T = totais(), alfabetica = T.produtos.slice().sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
      var produto, explica, filtro;
      if (v.filtro === "basica") { produto = alfabetica[0]; explica = "Sem filtro, o cartão mostra o <b>Primeiro</b> Produto em ordem alfabética: " + produto + "."; filtro = "Tipo de filtro: Filtragem básica (nada marcado)"; }
      else if (v.filtro === "qtd") { produto = T.qtd[0][0]; explica = "<b>N superior 1</b> por Quantidade Vendida: sobra só o produto que mais vendeu unidades, " + produto + " (" + mil(T.qtd[0][1]) + ")."; filtro = "Tipo de filtro: N superior\n  Mostrar itens: Em cima · 1\n  Por valor: Quantidade Vendida (Soma)\n  Aplicar filtro"; }
      else { produto = T.qtd[T.qtd.length - 1][0]; explica = "<b>N inferior 1</b>: o que menos vendeu, " + produto + ". Útil para achar o produto parado."; filtro = "Tipo de filtro: N superior\n  Mostrar itens: Embaixo · 1\n  Por valor: Quantidade Vendida (Soma)\n  Aplicar filtro"; }
      var fat = v.moeda === "true" ? f(T.fat, { moeda: true }) : f(T.fat);
      return {
        html: '<div class="cartoes-pbi">' +
          visualPbi("", '<div class="pbi-cartao"><b>' + fat + "</b><span>Faturamento da Venda</span></div>") +
          visualPbi("", '<div class="pbi-cartao pbi-cartao--texto"><b>' + esc(produto) + "</b><span>Primeiro Produto</span></div>") +
          "</div>" + '<p class="resposta">' + explica + "</p>",
        codigo: "Cartão 1 · Campos: Faturamento da Venda\n  Formato da coluna: " + (v.moeda === "true" ? "Moeda (Ferramentas de coluna)" : "Geral") +
          "\nCartão 2 · Campos: Produto (Primeiro)\n  Filtros › Filtros neste visual › Produto\n  " + filtro.replace(/\n/g, "\n  ") +
          "\nPincel de Formatação: do cartão 1 para o cartão 2"
      };
    },

    /* 09 · faturamento por mês e onde o eixo Y começa */
    eixo: function (v) {
      var T = totais(), ini = +v.inicio, W = 640, H = 300, esq = 56, base = H - 30, topo = 26, max = 10000000;
      var y = function (val) { return base - Math.max(0, (val - ini) / (max - ini)) * (base - topo); };
      var s = '<svg class="graf graf--pbi" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Faturamento por mês">';
      for (var k = 0; k <= 4; k++) {
        var val = ini + (max - ini) * k / 4, yy = y(val);
        s += '<line class="g-grade" x1="' + esq + '" x2="' + (W - 8) + '" y1="' + yy + '" y2="' + yy + '"/><text class="g-eixo" x="' + (esq - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + f(val, { casas: 0 }) + "</text>";
      }
      var slot = (W - esq - 8) / 12, menor = Infinity, maior = 0;
      for (var m = 1; m <= 12; m++) {
        var vm = T.fatMes[m], top = y(vm), x = esq + slot * (m - 1) + slot * 0.18;
        menor = Math.min(menor, vm); maior = Math.max(maior, vm);
        s += '<rect x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + (slot * 0.64).toFixed(1) + '" height="' + (base - top).toFixed(1) + '" fill="#118DFF"/>' +
          '<text class="g-rotulo" x="' + (x + slot * 0.32).toFixed(1) + '" y="' + (top - 5).toFixed(1) + '" text-anchor="middle">' + f(vm, { casas: 1 }) + "</text>" +
          '<text class="g-eixo" x="' + (x + slot * 0.32).toFixed(1) + '" y="' + (base + 18) + '" text-anchor="middle">' + m + "</text>";
      }
      s += '<line class="g-base" x1="' + esq + '" x2="' + (W - 8) + '" y1="' + base + '" y2="' + base + '"/></svg>';
      var real = (maior / menor - 1) * 100, visual = ((maior - ini) / (menor - ini) - 1) * 100;
      return {
        html: visualPbi("Faturamento da Venda por Mês", s) +
          '<p class="resposta">O melhor mês (dezembro) vendeu <b>' + PBI.formatar(real / 100, "pct") + "</b> a mais que o pior (maio); a barra dele aparece <b>" + PBI.formatar(visual / 100, "pct") + "</b> maior.</p>",
        codigo: "Gráfico de colunas clusterizado\n  Eixo X: Mês\n  Eixo Y: Faturamento da Venda (Soma)\nFormatar visual › Eixo Y › Intervalo\n  Mínimo: " + (ini ? mil(ini) : "Automático") +
          "\nFormatar visual › Rótulos de dados: Ativado"
      };
    },

    /* 10 · pizza das devoluções e o estilo do rótulo */
    pizza: function (v) {
      var T = totais(), itens = T.dev, tot = itens.reduce(function (a, x) { return a + x[1]; }, 0);
      var W = 560, H = 300, cx = 280, cy = 150, r = 105, a = -Math.PI / 2, cores = TEMAS.padrao.cores;
      var s = '<svg class="graf graf--pbi" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Quantidade Devolvida por Produto">';
      itens.forEach(function (it, i) {
        var fr = it[1] / tot, b = a + fr * Math.PI * 2, gr = fr > 0.5 ? 1 : 0, meio = (a + b) / 2;
        function pt(ang, raio) { return (cx + raio * Math.cos(ang)).toFixed(1) + " " + (cy + raio * Math.sin(ang)).toFixed(1); }
        var pct = PBI.formatar(fr, "pct"), rot = {
          categoria: it[0], valor: mil(it[1]), porcentagem: pct, ambos: it[0] + " " + mil(it[1]),
          catpct: it[0] + " " + pct, todos: it[0] + " " + mil(it[1]) + " (" + pct + ")"
        }[v.estilo];
        var lx = cx + (r + 14) * Math.cos(meio), ly = cy + (r + 14) * Math.sin(meio) + 4;
        s += '<path d="M' + cx + " " + cy + " L" + pt(a, r) + " A" + r + " " + r + " 0 " + gr + " 1 " + pt(b, r) + ' Z" fill="' + cores[i % cores.length] + '" stroke="#fff" stroke-width="1.5"/>' +
          '<text class="g-rotulo g-rotulo--leve" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + (Math.cos(meio) >= 0 ? "start" : "end") + '">' + esc(rot) + "</text>";
        a = b;
      });
      s += "</svg>";
      var nomes = { categoria: "Categoria", valor: "Valor dos dados", porcentagem: "Porcentagem do total", ambos: "Categoria, valor dos dados", catpct: "Categoria, porcentagem do total", todos: "Todos os rótulos de detalhes" };
      return {
        html: visualPbi("Quantidade Devolvida por Produto", s) + '<p class="nota-demo">' + mil(tot) + " unidades devolvidas em 499 devoluções · Base Devoluções</p>",
        codigo: "Gráfico de pizza (tabela Base Devoluções)\n  Legenda: Produto\n  Valores: Quantidade Devolvida (Soma)\nFormatar visual › Rótulos de detalhes\n  Conteúdo do rótulo: " + nomes[v.estilo]
      };
    },

    /* 11 · mapa das lojas */
    mapa: function (v) {
      var T = totais(), dados = v.tamanho === "qtd" ? T.qtdLoja : T.fatLoja;
      var LUG = {
        "São Paulo": [-46.63, -23.55], "Rio de Janeiro": [-43.2, -22.91], "Fortaleza": [-38.54, -3.73], "Salvador": [-38.5, -12.97], "Goiás": [-49.8, -15.9],
        "Recife": [-34.88, -8.05], "Curitiba": [-49.27, -25.43], "Porto Alegre": [-51.23, -30.03], "Belo Horizonte": [-43.94, -19.92]
      };
      var W = 520, H = 470, k = 11.5, ox = 30, oy = 10;
      function xy(p) { return [ox + (p[0] + 74) * k, oy + (5.5 - p[1]) * k]; }
      var contorno = PBI.BRASIL.map(function (p) { return xy(p).map(function (n) { return n.toFixed(1); }).join(" "); }).join(" L");
      var max = Math.max.apply(null, Object.keys(dados).map(function (x) { return dados[x]; }));
      var s = '<svg class="graf mapa-br mapa-br--' + v.estilo + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Faturamento por Loja"><rect class="mapa-agua" width="' + W + '" height="' + H + '"/><path class="mapa-terra" d="M' + contorno + ' Z"/>';
      Object.keys(dados).sort(function (a, b) { return dados[b] - dados[a]; }).forEach(function (loja) {
        var c = xy(LUG[loja]), r = Math.max(5, Math.sqrt(dados[loja] / max) * 34);
        s += '<circle class="mapa-bolha" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + r.toFixed(1) + '"><title>' + esc(loja) + "</title></circle>" +
          rotuloMapa(loja, c, r);
      });
      s += "</svg>";
      var top = Object.keys(dados).sort(function (a, b) { return dados[b] - dados[a]; })[0];
      var estilos = { estrada: "Estrada", aereo: "Aéreo", escuro: "Escuro", claro: "Claro", cinza: "Escala de cinza" };
      return {
        html: visualPbi("Faturamento por Loja", s, { classe: "visual-mapa" }) +
          '<p class="resposta">Maior bolha: <b>' + top + "</b> (" + (v.tamanho === "qtd" ? mil(dados[top]) + " unidades" : f(dados[top], { moeda: true })) + "). " +
          "<b>Goiás</b> é um estado, não uma cidade: a bolha cai no meio dele.</p>",
        codigo: "Visualizações › Mapa\n  Localização: Loja\n  Tamanho da bolha: " + (v.tamanho === "qtd" ? "Quantidade Vendida" : "Faturamento da Venda") + " (Soma)\n" +
          "Formatar visual › Configurações do mapa › Estilo: " + estilos[v.estilo] + "\nTítulo: Faturamento por Loja"
      };
    },

    /* 12 · tema escuro, passo a passo, e o Pincel de Formatação */
    escuro: function (v) {
      var T = totais(), on = function (k) { return v[k] === "true"; };
      var fundo = on("fundo"), branco = fundo ? "#fff" : "#252423";
      var estiloVisual = "background:" + (fundo ? "transparent" : "#fff") + ";" + (on("borda") ? "border:2px solid " + branco + ";border-radius:12px;" : "");
      var tituloCss = on("titulo") ? "color:#A0A0A0;text-align:center" : "color:" + (fundo ? "#fff" : "#252423");
      var barra = barrasSvg(T.qtd, { cor: "#118DFF", rotulos: true, escuro: fundo, grade: !on("grade"), titulo: "Quantidade Vendida por Produto" });
      if (fundo && !on("eixos")) barra = barra.replace('class="graf graf--pbi graf--escuro"', 'class="graf graf--pbi graf--escuro graf--eixos-escuros"');
      var colunas = "";
      if (on("pincel")) {
        var ms = [], max = 9000000;
        for (var m = 1; m <= 12; m++) ms.push([String(m), T.fatMes[m]]);
        var W = 560, H = 170, esq = 10, slot = (W - 20) / 12;
        colunas = '<svg class="graf graf--pbi' + (fundo ? " graf--escuro" : "") + '" viewBox="0 0 ' + W + " " + H + '">' + ms.map(function (x, i) {
          var hgt = (x[1] - 6000000) / (max - 6000000) * (H - 50), xx = esq + slot * i + slot * 0.2;
          return '<rect x="' + xx.toFixed(1) + '" y="' + (H - 24 - hgt).toFixed(1) + '" width="' + (slot * 0.6).toFixed(1) + '" height="' + hgt.toFixed(1) + '" fill="#118DFF"/>' +
            '<text class="g-rotulo" x="' + (xx + slot * 0.3).toFixed(1) + '" y="' + (H - 28 - hgt).toFixed(1) + '" text-anchor="middle">' + f(x[1], { casas: 1 }) + "</text>" +
            '<text class="g-eixo" x="' + (xx + slot * 0.3).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + x[0] + "</text>";
        }).join("") + "</svg>";
      }
      var html = '<div class="escuro-tela' + (fundo ? " escuro-tela--preta" : "") + '">' +
        visualPbi("Quantidade Vendida por Produto", barra, { estilo: estiloVisual, estiloTitulo: tituloCss }) +
        (on("pincel") ? visualPbi("Faturamento da Venda por Mês", colunas, { estilo: estiloVisual, estiloTitulo: tituloCss, classe: "pincel-copiado" }) : "") + "</div>";
      var passos = [];
      passos.push("Clique fora dos visuais › Formatar página › Tela de fundo\n  Cor: Preto · Transparência: 0%" + (fundo ? "" : "   (falta)"));
      passos.push("Gráfico de barras › Formatar visual");
      passos.push("  Geral › Título: cor cinza, Alinhamento: Centralizado" + (on("titulo") ? "" : "   (falta)"));
      passos.push("  Eixo Y e Eixo X: valores em branco, fonte maior" + (on("eixos") ? "" : "   (falta)"));
      passos.push("  Rótulos de dados: branco, fonte maior");
      passos.push("  Eixo X › Linhas de grade: Desativado" + (on("grade") ? "" : "   (falta)"));
      passos.push("  Geral › Efeitos › Borda visual: branca, Cantos arredondados" + (on("borda") ? "" : "   (falta)"));
      if (on("pincel")) passos.push("\nPágina Inicial › Pincel de Formatação\n  clique no gráfico de barras, no Pincel e no gráfico de colunas");
      return { html: html, codigo: passos.join("\n") };
    }
  };

  document.querySelectorAll("[data-lab]").forEach(function (lab) {
    var construtor = construtores[lab.getAttribute("data-lab")];
    if (!construtor || !PBI) return;
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
     4. QUIZ DE VERIFICAÇÃO

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
