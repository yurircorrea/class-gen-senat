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

  var PBI = window.PBI;

  function mil(v) { return v.toLocaleString("pt-BR"); }

  /* as cinco tabelas da Parte 2, como linhas, para os laboratórios */
  var TAB = null;
  function tabelas() {
    if (TAB) return TAB;
    var D = window.DADOS_MODELO, v = D.vendas;
    var skus = D.produtos.linhas.map(function (l) { return l[0]; }), lojas = D.lojas.linhas.map(function (l) { return l[0]; });
    function data(dia) { var x = new Date(dia * 864e5); return ("0" + x.getUTCDate()).slice(-2) + "/" + ("0" + (x.getUTCMonth() + 1)).slice(-2) + "/" + x.getUTCFullYear(); }
    TAB = {
      venda: function (i) { return [skus[v.sku[i]], v.qtd[i], lojas[v.loja[i]], data(v.dia[i]), v.cliente[i]]; },
      nVendas: v.qtd.length,
      produtos: D.produtos.linhas, lojas: D.lojas.linhas, clientes: D.clientes.linhas
    };
    return TAB;
  }

  function grade(cab, linhas, o) {
    o = o || {};
    return '<div class="tabela-modelo chave-grade"><p class="chave-nome">' + esc(o.nome) + (o.nota ? " <small>" + esc(o.nota) + "</small>" : "") + "</p><table><thead><tr>" +
      cab.map(function (h, i) { return "<th" + (i === o.colChave ? ' class="' + o.tipoChave + '"' : "") + ">" + esc(h) + (i === o.colChave ? " <em>" + (o.tipoChave === "pk" ? "chave primária" : "chave estrangeira") + "</em>" : "") + "</th>"; }).join("") +
      "</tr></thead><tbody>" + linhas.map(function (l, k) {
        return "<tr" + (k === o.linhaSel ? ' class="chave-sel"' : "") + ">" + l.map(function (c, i) {
          return "<td" + (i === o.colChave && k === o.linhaSel ? ' class="chave-celula"' : typeof c === "number" ? ' class="num"' : "") + ">" + esc(c === null ? "" : c) + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  var construtores = {

    /* 09 · chave estrangeira na base, chave primária no cadastro */
    chaves: function (v) {
      var T = tabelas(), amostra = [0, 4000, 9000, 15000, 23000], i = amostra[+v.venda], venda = T.venda(i);
      var alvo = {
        produto: { fk: 0, cad: T.produtos, cab: ["SKU", "Produto", "Marca", "Preco Unitario", "Custo Unitario", "Lucro"], cols: [0, 1, 2, 5, 6, 7], nome: "CadastroProdutos", pk: "SKU", fkNome: "SKU Produto", mostra: 1 },
        loja: { fk: 2, cad: T.lojas, cab: ["Loja", "Estado", "Gerente", "ID Loja"], cols: [0, 1, 2, 3], nome: "CadastroLojas", pk: "Loja", fkNome: "Loja", mostra: 2 },
        cliente: { fk: 4, cad: T.clientes, cab: ["Código Cliente", "Nome Cliente", "Idade do Cliente", "Categoria de Cliente", "Gênero"], cols: [0, 5, 2, 3, 6], nome: "CadastroClientes", pk: "Código Cliente", fkNome: "Código Cliente", mostra: 5 }
      }[v.chave];
      var chave = venda[alvo.fk], pos = -1;
      alvo.cad.forEach(function (l, k) { if (l[0] === chave) pos = k; });
      var ini = Math.max(0, Math.min(pos - 2, alvo.cad.length - 5)), trecho = alvo.cad.slice(ini, ini + 5).map(function (l) { return alvo.cols.map(function (c) { return l[c]; }); });
      var vendas = amostra.map(function (k) { return T.venda(k); });
      var colVenda = { produto: 0, loja: 2, cliente: 4 }[v.chave];
      var html = '<div class="chaves">' +
        grade(["SKU Produto", "Qtd Vendida", "Loja", "Data da Venda", "Código Cliente"], vendas, { nome: "BaseVendas", nota: mil(T.nVendas) + " linhas · amostra", colChave: colVenda, tipoChave: "fk", linhaSel: +v.venda }) +
        '<p class="chave-seta">' + esc(alvo.fkNome) + " = " + esc(chave) + " &#8594; " + esc(alvo.pk) + " = " + esc(chave) + "</p>" +
        grade(alvo.cab, trecho, { nome: alvo.nome, nota: mil(alvo.cad.length) + " linhas · cada " + alvo.pk + " aparece uma vez só", colChave: 0, tipoChave: "pk", linhaSel: pos - ini }) +
        "</div>";
      var achado = alvo.cad[pos];
      return {
        html: html,
        codigo: "chave estrangeira: BaseVendas[" + alvo.fkNome + "] = " + chave + "\n  repete em várias vendas\n" +
          "chave primária: " + alvo.nome + "[" + alvo.pk + "] = " + chave + "\n  única, nunca vazia\n\n" +
          "a relação leva a venda até o cadastro:\n  RELATED(" + alvo.nome + "[" + (v.chave === "produto" ? "Produto" : v.chave === "loja" ? "Gerente" : "Nome Cliente") + "]) = " + achado[alvo.mostra]
      };
    },

    /* 10 · os três tipos de relação do slide */
    cardinalidade: function (v) {
      var EX = {
        um: {
          titulo: "1 para 1", tabelas: [
            ["Funcionários", ["ID", "Nome"], [[1, "Ana"], [2, "Bruno"], [3, "Carla"]]],
            ["Endereços", ["ID Funcionário", "Endereço"], [[1, "Rua das Flores, 10"], [2, "Av. Brasil, 250"], [3, "Rua Iguaçu, 31"]]]
          ],
          texto: "Cada registro de uma tabela está ligado a um único registro da outra.\nCada funcionário tem um endereço, e cada endereço é de um funcionário.\n\nChave estrangeira: pode ir para qualquer lado."
        },
        n: {
          titulo: "1 para N", tabelas: [
            ["Departamentos", ["ID", "Departamento"], [[10, "Vendas"], [20, "Logística"]]],
            ["Funcionários", ["Nome", "ID Departamento"], [["Ana", 10], ["Bruno", 20], ["Carla", 10], ["Davi", 10]]]
          ],
          texto: "Um registro de uma tabela está ligado a vários da outra.\nUm departamento tem vários funcionários; cada funcionário está em um só.\n\nChave estrangeira: vai para o lado N (Funcionários recebe o ID do\ndepartamento). É o caso desta aula: um produto, muitas vendas."
        },
        nn: {
          titulo: "N para N", tabelas: [
            ["Produtos", ["ID", "Produto"], [[1, "Notebook"], [2, "Celular"]]],
            ["ProdutoXCategoria", ["ID Produto", "ID Categoria"], [[1, "A"], [1, "B"], [2, "B"], [2, "C"]]],
            ["Categorias", ["ID", "Categoria"], [["A", "Informática"], ["B", "Promoção"], ["C", "Telefonia"]]]
          ],
          texto: "Os registros das duas tabelas podem estar ligados a vários da outra.\nUm produto em várias categorias, uma categoria com vários produtos.\n\nCria-se uma tabela no meio (ProdutoXCategoria) com as duas chaves\nestrangeiras. Produto e categoria podem repetir; o par, não."
        }
      }[v.tipo];
      var cores = { 1: "c1", 2: "c2", 3: "c3", 10: "c1", 20: "c2", A: "c1", B: "c2", C: "c3" };
      var html = '<div class="card-ex card-ex--' + v.tipo + '">' + EX.tabelas.map(function (t, k) {
        return '<div class="tabela-modelo card-tab"><p class="chave-nome">' + esc(t[0]) + "</p><table><thead><tr>" + t[1].map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") +
          "</tr></thead><tbody>" + t[2].map(function (l) {
            return "<tr>" + l.map(function (c, i) {
              var liga = (v.tipo === "nn" ? true : v.tipo === "n" ? (k === 0 ? i === 0 : i === 1) : i === 0) && cores[c];
              return "<td>" + (liga ? '<span class="liga liga--' + cores[c] + '">' + esc(c) + "</span>" : esc(c)) + "</td>";
            }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>" + (k < EX.tabelas.length - 1 ? '<span class="card-seta">' + (v.tipo === "um" ? "1 — 1" : v.tipo === "n" ? "1 — N" : k === 0 ? "1 — N" : "N — 1") + "</span>" : "");
      }).join("") + "</div>";
      return { html: html, codigo: "Relação " + EX.titulo + "\n\n" + EX.texto };
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
     4. MATERIAIS PARA BAIXAR

     Os links apontam para material/power-bi/aula4/. Aberta por
     duplo clique (file://), a página não baixa uma imagem pelo
     link: o navegador abre a imagem. Nesse caso o download sai
     da cópia embutida em js/materiais.js, que só é carregado
     no primeiro clique num desses links (são 2 MB de imagens).
     ====================================================== */

  function baixarEmbutido(nome) {
    var b64 = window.MATERIAIS && window.MATERIAIS[nome];
    if (!b64) return false;
    var t = document.createElement("a");
    t.href = "data:image/png;base64," + b64;
    t.download = nome.split("/").pop();
    document.body.appendChild(t);
    t.click();
    t.remove();
    return true;
  }
  if (location.protocol === "file:") {
    document.querySelectorAll("a[data-material]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var nome = a.getAttribute("data-material");
        ev.preventDefault();
        if (baixarEmbutido(nome)) return;
        var s = document.createElement("script");
        s.src = "js/materiais.js";
        s.onload = function () { baixarEmbutido(nome); };
        document.body.appendChild(s);
      });
    });
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
