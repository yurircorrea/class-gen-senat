/* =========================================================
   aula.js — motor da aula em página única (Power BI · Aula 2)
   1. Colorização dos painéis (fórmula DAX, texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Laboratórios interativos (construtores desta aula)
   4. Materiais para baixar (cópia embutida quando aberta por file://)
   5. Quiz de verificação

   O simulador do Power BI (barra de fórmulas, visuais,
   segmentações) mora em js/pbi.js. Os laboratórios daqui
   usam o mesmo motor de DAX (window.PBI) para calcular.
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

  /* modelo da BaseProdução com as medidas da Parte 1, criado na primeira vez */
  var modeloProd = null;
  function producao() {
    if (!modeloProd) modeloProd = PBI.novoModelo(PBI.SIMS.dashProducao);
    return modeloProd;
  }
  function valorMedida(nome) {
    var M = producao();
    return M.avMedida(M.medida(nome), { filtros: [], linha: null, pilha: [] });
  }

  var FUNCOES = {
    SUM: "soma os valores da coluna",
    AVERAGE: "calcula a média dos valores da coluna",
    MIN: "devolve o menor valor da coluna",
    MAX: "devolve o maior valor da coluna",
    COUNT: "conta as células da coluna que não estão em branco",
    DISTINCTCOUNT: "conta quantos valores diferentes a coluna tem (o branco também conta como um valor)"
  };

  var construtores = {

    /* 02 · a anatomia de uma medida, calculada de verdade */
    anatomia: function (v) {
      var nome = (v.nome || "").trim() || "Medida";
      var formula = nome + " = " + v.funcao + "(BaseProdução[" + v.coluna + "])";
      var M = producao(), valor, erro = null;
      try {
        var r = M.compilar(formula);
        valor = M.av(r.ast, { filtros: [], linha: null, pilha: [] });
      } catch (e) {
        if (!(e instanceof PBI.DaxErro)) throw e;
        erro = e.msg;
      }
      var partes =
        '<div class="anatomia">' +
          '<div class="anat-parte anat-nome"><b>' + esc(nome) + "</b><small>nome da medida</small></div>" +
          '<div class="anat-parte anat-sinal"><b>=</b><small>&nbsp;</small></div>' +
          '<div class="anat-parte anat-fn"><b>' + esc(v.funcao) + "(</b><small>função, em inglês</small></div>" +
          '<div class="anat-parte anat-tab"><b>BaseProdução</b><small>tabela</small></div>' +
          '<div class="anat-parte anat-col"><b>[' + esc(v.coluna) + "]</b><small>coluna, entre colchetes</small></div>" +
          '<div class="anat-parte anat-fn"><b>)</b><small>&nbsp;</small></div>' +
        "</div>";
      var resultado = erro
        ? '<div class="sim-erro"><b>Não foi possível calcular</b>' + esc(erro) + "</div>"
        : '<div class="anat-resultado"><div class="pv pv--cartao"><div class="pv-corpo"><div class="pv-cartoes"><div class="pv-cartao"><b>' +
          esc(PBI.formatar(valor, "auto", "cartao")) + "</b><span>" + esc(nome) + "</span></div></div></div></div>" +
          '<p class="resposta"><b>' + esc(v.funcao) + "</b> " + FUNCOES[v.funcao] + ".<br>Valor exato: <b>" + esc(PBI.formatar(valor, "auto", "celula") || "(em branco)") + "</b></p></div>";
      return {
        html: partes + resultado,
        codigo: formula + "\n// " + (erro ? "erro: " + erro : "resultado: " + (PBI.formatar(valor, "auto", "celula") || "(em branco)"))
      };
    },

    /* 07 · plano de fundo da página e ícones */
    fundo: function (v) {
      var transp = +v.transp, comImagem = v.imagem === "sim";
      var tam = { normal: "156.4% auto", ajustar: "100% 100%", preencher: "cover" }[v.ajuste];
      var camada = comImagem
        ? '<div class="fundo-imagem" style="background-size:' + tam + ";opacity:" + (1 - transp / 100).toFixed(2) + '"></div>'
        : "";
      var cartoes = "";
      if (v.icones === "true") {
        var itens = [
          ["icone-produzido.png", "Qtd Produzida", 81, 72, 144],
          ["icone-rejeitado.png", "Qtd Rejeitada", 299, 72, 354],
          ["icone-hora-produtiva.png", "Horas Produtivas", 507, 70, 567],
          ["icone-hora-parada.png", "Horas Paradas", 723, 72, 780]
        ];
        cartoes = itens.map(function (it) {
          return '<img class="fundo-icone" src="img/' + it[0] + '" alt="" style="left:' + (it[2] / 12.8) + "%;top:" + (it[3] / 7.2) + '%">' +
            '<div class="fundo-cartao" style="left:' + (it[4] / 12.8) + "%;top:" + (it[3] / 7.2) + '%"><b>' + esc(PBI.formatar(valorMedida(it[1]), "auto", "cartao")) + "</b><span>" + esc(it[1]) + "</span></div>";
        }).join("");
      }
      var aviso = "";
      if (comImagem && transp === 100) aviso = '<p class="aviso">A imagem está aplicada, mas a transparência de 100% (o padrão) a deixa invisível. Baixe para 0%.</p>';
      else if (comImagem && v.ajuste === "normal") aviso = '<p class="aviso">Em Normal a imagem fica no tamanho original (2002 × 1127 pixels) e a página (1280 × 720) mostra só um pedaço dela.</p>';
      else if (comImagem && transp === 0) aviso = '<p class="aviso aviso--ok">Pronto: a imagem cobre a página inteira e os visuais ficam por cima dela.</p>';
      var linhas = ["Clique numa área vazia da página (nenhum visual selecionado)", "Visualizações › Formatar página › Tela de fundo"];
      if (comImagem) {
        linhas.push("  Imagem: Procurar… › Parte1 - Plano de Fundo.png");
        linhas.push("  Ajuste da imagem: " + { normal: "Normal", ajustar: "Ajustar", preencher: "Preencher" }[v.ajuste]);
        linhas.push("  Transparência: " + transp + "%");
      } else linhas.push("  Imagem: (nenhuma)");
      if (v.icones === "true") {
        linhas.push("");
        linhas.push("Inserir › Elementos › Imagem   (um ícone por vez)");
        linhas.push("Formatar imagem › Geral › Efeitos › Tela de fundo: Desativado");
        linhas.push("Cartão de linha múltipla ao lado de cada ícone");
      }
      var vazio = !comImagem || transp === 100
        ? '<span class="fundo-vazio">página de 1280 × 720' + (comImagem ? ": a imagem está aqui, com 100% de transparência" : " sem imagem de fundo") + "</span>" : "";
      return {
        html: '<div class="fundo-pagina">' + vazio + camada + cartoes + "</div>" + aviso,
        codigo: linhas.join("\n")
      };
    },

    /* 12 · Cidade a partir de um exemplo (Power Query › Coluna de Exemplos) */
    cidade: function (v, lab) {
      var R = window.DADOS_RH.linhas;
      var REGRAS = [
        { nome: "o texto entre a 2ª vírgula e o hífen", m: 'Text.BetweenDelimiters([Endereço], ", ", " - ", 1, 0)', f: function (e) { return PBI.cidadeDe(e); }, rotulo: "Cidade" },
        { nome: "o texto entre o último hífen e a última vírgula", m: 'Text.BetweenDelimiters([Endereço], " - ", ", ", {0, RelativePosition.FromEnd}, 0)', f: function (e) { var p = e.split(", "); return p[2].slice(p[2].lastIndexOf(" - ") + 3); }, rotulo: "UF" },
        { nome: "o texto depois da última vírgula", m: 'Text.AfterDelimiter([Endereço], ", ", {0, RelativePosition.FromEnd})', f: function (e) { var p = e.split(", "); return p[p.length - 1]; }, rotulo: "CEP" },
        { nome: "o texto antes da 1ª vírgula", m: 'Text.BeforeDelimiter([Endereço], ", ")', f: function (e) { return e.split(", ")[0]; }, rotulo: "Rua" }
      ];
      var ex = (v.ex1 || "").trim(), regra = null;
      if (ex) {
        regra = REGRAS.filter(function (r) { return r.f(R[0][5]).toLowerCase() === ex.toLowerCase(); })[0] || null;
      }
      /* sugestões enquanto digita, como o Power Query mostra */
      var lista = lab.querySelector("#cidade-sugestoes");
      if (lista && !lista.children.length) {
        lista.innerHTML = REGRAS.map(function (r) { return '<option value="' + esc(r.f(R[0][5])) + '">'; }).join("");
      }
      var linhas = R.slice(0, 8).map(function (l, i) {
        var val = i === 0 ? ex : regra ? regra.f(l[5]) : "";
        return "<tr><td>" + l[0] + "</td><td>" + esc(l[1]) + '</td><td class="ex-endereco">' + esc(l[5]) + '</td><td class="' + (i === 0 ? "ex-digitado" : "ex-sugestao") + '">' + esc(val) + "</td></tr>";
      }).join("");
      var html = '<div class="tabela-modelo ex-grade"><table><thead><tr><th>ID RH</th><th>Nome Completo</th><th>Endereço</th><th class="ex-nova">' + esc(v.nomeCol || "Personalizar") + "</th></tr></thead><tbody>" + linhas + "</tbody></table></div>";
      var codigo;
      if (!ex) {
        html += '<p class="nota-demo">Digite na primeira linha da coluna nova o que você quer tirar do endereço.</p>';
        codigo = "Adicionar Coluna › Coluna de Exemplos › A partir de Todas as Colunas\n// digite um exemplo na primeira linha";
      } else if (!regra) {
        html += '<p class="aviso">O Power Query ainda não achou um padrão para "' + esc(ex) + '". Confira a grafia: o exemplo precisa ser um pedaço do endereço da primeira linha.</p>';
        codigo = "Adicionar Coluna › Coluna de Exemplos › A partir de Todas as Colunas\n// nenhuma transformação encontrada";
      } else {
        var cont = {};
        R.forEach(function (l) { var c = regra.f(l[5]); cont[c] = (cont[c] || 0) + 1; });
        var top = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; });
        html += '<p class="resposta">Regra encontrada: <b>' + esc(regra.nome) + "</b>. As 234 linhas ganham o valor.</p>" +
          '<div class="ex-contagem">' + top.slice(0, 9).map(function (c) { return "<span>" + esc(c) + " <b>" + cont[c] + "</b></span>"; }).join("") +
          (top.length > 9 ? "<span>… mais " + (top.length - 9) + "</span>" : "") + "</div>";
        codigo = "Adicionar Coluna › Coluna de Exemplos › A partir de Todas as Colunas\n" +
          "Nome da coluna: " + (v.nomeCol || "Personalizar") + "  ·  OK\n\n" +
          "// a fórmula que o Power Query escreveu:\n" + regra.m;
      }
      return { html: html, codigo: codigo };
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

     Os links apontam para material/power-bi/aula2/. Aberta por
     duplo clique (file://), a página não baixa uma imagem pelo
     link: o navegador abre a imagem. Nesse caso o download sai
     da cópia embutida em js/materiais.js.
     ====================================================== */

  if (location.protocol === "file:" && window.MATERIAIS) {
    document.querySelectorAll("a[data-material]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var nome = a.getAttribute("data-material"), b64 = window.MATERIAIS[nome];
        if (!b64) return;
        ev.preventDefault();
        var t = document.createElement("a");
        t.href = "data:image/png;base64," + b64;
        t.download = nome.split("/").pop();
        document.body.appendChild(t);
        t.click();
        t.remove();
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
