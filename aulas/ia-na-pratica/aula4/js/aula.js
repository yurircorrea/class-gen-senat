/* =========================================================
   aula.js — motor da aula em página única
   1. Colorização dos painéis (texto)
   2. Navegação: progresso, menu ativo, voltar ao topo
   4. Formatos de número em pt-BR
   6. Laboratórios interativos (construtores desta aula)
   8. Quiz de verificação
   10. Desta aula: encontre os problemas no texto
   12. Desta aula: copiar o texto montado

   Aula: IA na Prática · Aula 4 · IA com responsabilidade.
   As seções 3 (simuladores de tela), 5 (mini planilha),
   7 (playground) e 9 (tour) do modelo não são usadas e
   foram retiradas.
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
     4. FORMATOS DE NÚMERO (usados pelos labs)
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
     6. LABORATÓRIOS

     O HTML descreve o laboratório (data-lab, data-campo,
     data-palco, data-saida, data-eco); aqui mora só o
     construtor de cada um.

     Cada construtor recebe os valores dos controles e devolve
     uma string, ou { html, codigo } quando o que é renderizado
     difere do que deve ser mostrado no painel de saída.

     A saída não precisa ser código: pode ser o pedido, o texto
     anonimizado ou o registro de revisão (marque o
     <pre data-saida> com data-lang="texto").

     NUNCA emita atributo vazio (class="") no código gerado:
     monte o atributo inteiro condicionalmente.
     ====================================================== */

  /* utilitários dos laboratórios desta aula */
  function semAcento(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function chips(itens) {
    return '<div class="checklist">' + itens.map(function (i) {
      return '<span class="check' + (i[1] ? " check--sim" : "") + '">' + (i[1] ? "✓ " : "") + esc(i[0]) + "</span>";
    }).join("") + "</div>";
  }
  function avisos(lista) {
    return lista.length ? '<div class="avisos">' + lista.map(function (a) {
      var forte = a.charAt(0) === "!";
      return '<p class="aviso' + (forte ? " aviso--forte" : "") + '">' + esc(forte ? a.slice(1) : a) + "</p>";
    }).join("") + "</div>" : "";
  }
  /* caixa de veredito: tipo ok, atencao ou erro */
  function veredito(tipo, titulo, texto) {
    return '<div class="veredito veredito--' + tipo + '"><b>' + esc(titulo) + "</b><p>" + esc(texto) + "</p></div>";
  }
  /* texto com marcações {p:…} pessoal, {s:…} sensível, {i:…} sigiloso */
  var CAT = { p: ["pessoal", "dado pessoal"], s: ["sensivel", "dado sensível"], i: ["sigiloso", "informação sigilosa"] };
  function marcar(txt) {
    var cont = { p: 0, s: 0, i: 0 };
    var html = esc(txt).replace(/\{([psi]):([^}]+)\}/g, function (m, c, t) {
      cont[c]++;
      return '<mark class="dado dado--' + CAT[c][0] + '" title="' + CAT[c][1] + '">' + t + "</mark>";
    });
    return { html: html, cont: cont };
  }
  function contagem(cont) {
    var partes = [];
    if (cont.p) partes.push(cont.p + (cont.p === 1 ? " dado pessoal" : " dados pessoais"));
    if (cont.s) partes.push(cont.s + (cont.s === 1 ? " dado sensível" : " dados sensíveis"));
    if (cont.i) partes.push(cont.i + (cont.i === 1 ? " informação sigilosa" : " informações sigilosas"));
    return partes;
  }
  function listaE(itens) {
    if (itens.length < 2) return itens.join("");
    return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
  }

  var construtores = {

    /* 02 · Lab — a mesma tarefa: pedido arriscado × pedido seguro */
    pedidos: function (v) {
      var P = {
        email: ["E-mail",
          "Melhore este e-mail: Prezado {p:Sr. Roberto Almeida}, o reembolso de {i:R$ 1.850,00} do curso foi negado porque o {s:laudo médico} apresentado não cobre o período. Seu CPF {p:987.654.321-00} consta como pendente.",
          "Melhore a redação de um e-mail que informa a um aluno que o pedido de reembolso foi negado e explica o motivo com respeito. Use [NOME] e [MOTIVO] no lugar dos dados; eu completo depois."],
        ata: ["Ata",
          "Organize esta ata: na reunião, {p:Márcia Souza} relatou o {s:afastamento por depressão} de {p:Paulo Henrique}, e a diretoria decidiu {i:cortar 20% do orçamento do setor}.",
          "Crie a estrutura de uma ata de reunião administrativa: cabeçalho, participantes, pauta, decisões, encaminhamentos e responsáveis, com os campos em branco."],
        relatorio: ["Relatório",
          "Analise esta planilha e faça um relatório: [colada a planilha com {p:nome}, {p:matrícula} e {i:salário} dos 42 colaboradores da unidade]",
          "Sugira a estrutura de um relatório de quadro de pessoal: seções, indicadores agregados (total, média por setor) e gráficos indicados, sem dados individuais."],
        comunicado: ["Comunicado",
          "Escreva um comunicado avisando que a instrutora {p:Fernanda Lopes} foi {s:afastada por problema de saúde} e que as turmas dela vão mudar de data.",
          "Escreva um comunicado curto avisando que as turmas de um curso terão nova data por motivo administrativo, em tom institucional e cordial, sem citar pessoas."],
        organizacao: ["Organização",
          "Organize minha semana: segunda, audiência do {i:processo nº 0001234-56.2026} de {p:Rafael Gomes}; terça, entrevista com {p:Juliana Prado}, {s:candidata com deficiência}; quarta, fechar a {i:folha de pagamento}.",
          "Monte um modelo de planejamento semanal com blocos para reuniões, entrevistas, prazos e tarefas recorrentes, com prioridade e responsável."]
      };
      var p = P[v.processo], r = marcar(p[1]);
      var achados = contagem(r.cont);
      var html =
        '<div class="pedidos-par">' +
        '<div class="pedido-caixa pedido-caixa--risco"><span class="rotulo-antigo">com dados reais</span><p>' + r.html + "</p>" +
        '<p class="pedido-conta">' + esc(listaE(achados)) + "</p></div>" +
        '<div class="pedido-caixa pedido-caixa--seguro"><span class="rotulo-atual">só a estrutura</span><p>' + esc(p[2]) + "</p>" +
        '<p class="pedido-conta">nenhum dado identificável</p></div></div>' +
        veredito("ok", "A IA dá a estrutura; os dados ficam com você", "O texto final é completado depois, no sistema oficial ou no seu editor, sem passar pela ferramenta externa.");
      return { html: html, codigo: p[2] };
    },

    /* 04 · Lab — por onde o dado passa, conforme a ferramenta */
    ambiente: function (v) {
      var F = {
        pessoal: ["conta pessoal gratuita", "servidores da empresa da IA, em geral fora do país",
          [["Quem controla", "a empresa da IA, pelos termos que você aceitou"], ["Treino de modelos", "em geral, sim, por padrão (com opção de desligar)"],
           ["Contrato com a instituição", "não existe"], ["Registro e auditoria da instituição", "não existem"]]],
        corporativa: ["conta corporativa contratada pela instituição", "servidores da empresa da IA, sob contrato",
          [["Quem controla", "o administrador da conta da instituição"], ["Treino de modelos", "em geral, não: o contrato proíbe"],
           ["Contrato com a instituição", "sim, com regras de uso e de dados"], ["Registro e auditoria da instituição", "conforme o contrato"]]],
        interno: ["sistema oficial da instituição", "servidores da própria instituição",
          [["Quem controla", "a equipe de TI da instituição"], ["Treino de modelos", "não se aplica"],
           ["Contrato com a instituição", "é o sistema oficial"], ["Registro e auditoria da instituição", "sim, com perfis de acesso"]]]
      };
      var D = { modelo: "modelo de ofício em branco", financeiro: "relatório financeiro da unidade", ficha: "ficha de um colaborador com CPF e endereço" };
      var M = {
        pessoal: { modelo: ["ok", "Pode", "Modelo em branco não expõe ninguém."], financeiro: ["erro", "Não pode", "Informação sigilosa da instituição numa conta pessoal, fora de qualquer controle."], ficha: ["erro", "Não pode", "Dados pessoais numa conta pessoal: risco de violação à LGPD."] },
        corporativa: { modelo: ["ok", "Pode", "Modelo em branco não expõe ninguém."], financeiro: ["atencao", "Depende da política", "Só se a política interna autorizar esse uso na ferramenta contratada."], ficha: ["atencao", "Depende da política", "Só com autorização expressa e o mínimo necessário de dados."] },
        interno: { modelo: ["ok", "Pode", "Modelo em branco não expõe ninguém."], financeiro: ["ok", "Pode, com perfil de acesso", "É para isso que o sistema oficial existe."], ficha: ["ok", "Pode, com perfil de acesso", "O sistema oficial tem registro de quem acessou o quê."] }
      };
      var f = F[v.ferramenta], m = M[v.ferramenta][v.dado];
      var html =
        '<ol class="trajeto">' +
        '<li class="trajeto-no">o seu texto<small>' + esc(D[v.dado]) + "</small></li>" +
        (v.ferramenta === "interno" ? "" : '<li class="trajeto-no">internet</li>') +
        '<li class="trajeto-no trajeto-no--' + (v.ferramenta === "interno" ? "dentro" : "fora") + '">' + esc(f[1]) + "</li></ol>" +
        '<table class="tabela tabela--props"><tbody>' + f[2].map(function (r) {
          return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>";
        }).join("") + "</tbody></table>" +
        veredito(m[0], m[1], m[2]);
      var codigo = "Ferramenta: " + f[0] + "\nO que vai: " + D[v.dado] + "\nDecisão: " + m[1].toLowerCase() +
        "\n\nRegra: se não pode ir por e-mail, não pode ir para a IA.";
      return { html: html, codigo: codigo };
    },

    /* 08 · Lab — detector de dados antes de colar (funciona com qualquer texto) */
    detector: function (v) {
      var texto = String(v.texto || "");
      var trocar = v.trocar === "true";
      var L = "A-Za-zÀ-ÖØ-öø-ÿ";
      var MAI = "A-ZÁÂÃÀÉÊÍÓÔÕÚÇ", MIN = "a-záâãàéêíóôõúç";
      var PADROES = [
        ["E-MAIL", "pessoal", /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, true],
        ["CNH", "pessoal", /\bCNH\s*(?:n[º°o.]*\s*)?\d{9,11}\b/gi, true],
        ["CPF", "pessoal", /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\bCPF\s*(?:n[º°o.]*\s*)?\d{11}\b/gi, true],
        ["RG", "pessoal", /\bRG\s*(?:n[º°o.]*\s*)?[\d.]{5,12}-?[\dxX]?/gi, true],
        ["TELEFONE", "pessoal", /\(\d{2}\)\s?9?\d{4}-?\d{4}|\b\d{2}\s9\d{4}-\d{4}\b/g, true],
        ["CEP", "pessoal", /\b\d{5}-\d{3}\b/g, true],
        ["PLACA", "pessoal", /\b[A-Z]{3}-?\d[A-Z0-9]\d{2}\b/g, true],
        ["ENDEREÇO", "pessoal", new RegExp("\\b(?:Rua|Avenida|Av\\.|Travessa|Alameda|Estrada)\\s+[^,;\\n]{2,40},?\\s*(?:n[º°o.]*\\s*)?\\d+", "g"), true],
        ["MATRÍCULA", "pessoal", /\bmatr[ií]cula\s*(?:n[º°o.]*\s*)?\d+/gi, true],
        ["NASCIMENTO", "pessoal", /\bnascid[oa] em \d{1,2}\/\d{1,2}\/\d{2,4}|\bnascimento:?\s*\d{1,2}\/\d{1,2}\/\d{2,4}/gi, true],
        ["SAÚDE", "sensivel", /\bCID[-\s]?(?:10\s)?[A-Z]\d{2}(?:\.\d)?\b/g, true],
        ["SAÚDE", "sensivel", new RegExp("(?<![" + L + "])(?:atestado|laudo|diagn[oó]stico|doen[cç]a|exame m[eé]dico|licen[cç]a m[eé]dica|problema de sa[uú]de|gestante|gravidez|depress[aã]o|defici[eê]ncia|PcD)(?![" + L + "])", "gi"), false],
        ["SENSÍVEL", "sensivel", new RegExp("(?<![" + L + "])(?:religi[aã]o|sindicalizad[oa]|filiad[oa] ao sindicato|biometria|origem racial)(?![" + L + "])", "gi"), false],
        ["PROCESSO", "sigiloso", /\bprocesso\s*(?:n[º°o.]*\s*)?[\d.\-\/]{6,}/gi, true],
        ["VALOR", "sigiloso", /R\$\s?\d[\d.]*(?:,\d{2})?/g, true],
        ["SIGILOSO", "sigiloso", new RegExp("(?<![" + L + "])(?:sal[aá]rios?|folha de pagamento|advert[eê]ncia|confidencial|sigiloso)(?![" + L + "])", "gi"), false],
        ["NOME", "pessoal", new RegExp("(?<![" + L + "])(?:(?:Sr|Sra|Dr|Dra)\\.?\\s+)?[" + MAI + "][" + MIN + "]+(?:\\s+(?:(?:da|de|do|das|dos|e)\\s+)?[" + MAI + "][" + MIN + "]+)+", "g"), true]
      ];
      var NAO_NOME = /^(Prezad[oa]s?|Car[oa]s?|Olá|Oi|Bom|Boa|Atenciosamente|Segue|Informamos|Equipe|Unidade|Curso|Turma)$/;
      var LUGARES = ["Foz do Iguaçu", "Cascavel", "Curitiba", "Paraná", "Brasil", "Ponte da Amizade"];
      var achados = [];
      PADROES.forEach(function (pd) {
        pd[2].lastIndex = 0;
        var m;
        while ((m = pd[2].exec(texto)) !== null) {
          var ini = m.index, t = m[0];
          if (pd[0] === "NOME") {
            var pal = t.split(/\s+/);
            while (pal.length && NAO_NOME.test(pal[0])) { ini += pal[0].length + 1; pal.shift(); }
            t = pal.join(" ");
            var nomes = pal.filter(function (w) { return !/^(da|de|do|das|dos|e)$/.test(w); });
            if (nomes.length < 2 || LUGARES.indexOf(t) !== -1) continue;
          }
          achados.push({ ini: ini, fim: ini + t.length, rot: pd[0], cat: pd[1], troca: pd[3], txt: t });
        }
      });
      achados.sort(function (a, b) { return a.ini - b.ini || (b.fim - b.ini) - (a.fim - a.ini); });
      var aceitos = [], fimAnt = -1;
      achados.forEach(function (a) { if (a.ini >= fimAnt) { aceitos.push(a); fimAnt = a.fim; } });

      var nomesVistos = {}, nNome = 0, cont = { pessoal: 0, sensivel: 0, sigiloso: 0 };
      var marcado = "", anon = "", pos = 0;
      aceitos.forEach(function (a) {
        cont[a.cat]++;
        marcado += esc(texto.slice(pos, a.ini)) + '<mark class="dado dado--' + a.cat + '" title="' + a.rot.toLowerCase() + '">' + esc(a.txt) + "</mark>";
        var rot = a.rot;
        if (a.rot === "NOME") {
          var chave = a.txt.replace(/^(Sr|Sra|Dr|Dra)\.?\s+/, "");
          if (!nomesVistos[chave]) nomesVistos[chave] = ++nNome;
          rot = "NOME " + nomesVistos[chave];
        }
        anon += texto.slice(pos, a.ini) + (a.troca ? "[" + rot + "]" : a.txt);
        pos = a.fim;
      });
      marcado += esc(texto.slice(pos));
      anon += texto.slice(pos);

      var total = cont.pessoal + cont.sensivel + cont.sigiloso;
      var restam = aceitos.filter(function (a) { return !a.troca; });
      var ver;
      if (!texto.trim()) ver = veredito("atencao", "Cole ou escreva um texto", "O detector procura CPF, RG, CNH, telefone, e-mail, endereço, placa, nomes, saúde e valores.");
      else if (!total) ver = veredito("ok", "Nenhum dado encontrado", "O detector é simples e não acha tudo: releia o texto antes de colar.");
      else if (!trocar) ver = veredito("erro", "Não cole este texto assim", "Ligue a troca por marcadores ou reescreva sem os dados destacados.");
      else if (restam.length) ver = veredito("atencao", "Quase: ainda há trechos para reescrever",
        "Os marcadores cobriram os números e os nomes, mas " + listaE(restam.map(function (a) { return "\"" + a.txt + "\""; })) + " continua no texto. Generalize ou retire.");
      else ver = veredito("ok", "A versão com marcadores pode ir para a IA", "Os dados reais você completa depois, fora da ferramenta.");
      var html =
        '<div class="detector-conta">' +
        '<span class="dado dado--pessoal">' + cont.pessoal + (cont.pessoal === 1 ? " pessoal" : " pessoais") + "</span>" +
        '<span class="dado dado--sensivel">' + cont.sensivel + (cont.sensivel === 1 ? " sensível" : " sensíveis") + "</span>" +
        '<span class="dado dado--sigiloso">' + cont.sigiloso + (cont.sigiloso === 1 ? " sigiloso" : " sigilosos") + "</span></div>" +
        '<div class="detector-texto">' + (marcado || '<span class="nota-demo">(texto vazio)</span>') + "</div>" + ver;
      return { html: html, codigo: trocar ? anon : texto };
    },

    /* 11 · Lab — revisar um anúncio de vaga com vieses */
    vies: function (v) {
      var g = v.genero === "true", i = v.idade === "true", a = v.aparencia === "true", r = v.requisitos === "true";
      var partes = [
        ["Procuramos ", null],
        [g ? "profissional" : "um homem", g ? null : "Gênero"],
        [i ? "" : " de até 40 anos", i ? null : "Idade"],
        [a ? "" : ", forte e de boa aparência,", a ? null : "Aparência"],
        [" para dirigir caminhão na rota Foz do Iguaçu–Curitiba. ", null],
        [r ? "Requisitos: CNH na categoria exigida, cursos obrigatórios em dia e experiência comprovada no transporte de carga." :
          "Precisa ter muita experiência e ser de confiança.", r ? null : "Requisitos vagos"]
      ];
      var fim = g && i && a ? " Vaga aberta a todas as pessoas que atendam aos requisitos." : "";
      var html = '<div class="anuncio"><span class="anuncio-selo">vaga</span><b>Motorista de caminhão</b><p>' +
        partes.map(function (p) { return p[1] ? '<mark class="vies" title="' + p[1] + '">' + esc(p[0]) + "</mark>" : esc(p[0]); }).join("") + esc(fim) + "</p></div>";
      var notas = [];
      if (!g) notas.push("!Restringe por gênero: prática discriminatória no acesso ao trabalho (Lei 9.029/1995).");
      if (!i) notas.push("!Limite de idade sem justificativa: a mesma lei proíbe discriminação por idade.");
      if (!a) notas.push("\"Forte e de boa aparência\" é critério subjetivo: abre espaço para preconceito.");
      if (!r) notas.push("\"Muita experiência\" e \"de confiança\" não se medem. Peça requisitos que dá para comprovar.");
      var ok = g && i && a && r;
      html += avisos(notas) + (ok ? veredito("ok", "Anúncio revisado", "Requisitos objetivos e nenhum critério que exclua pessoas sem motivo.")
        : veredito("atencao", "A IA reproduziu um padrão dos dados", "O texto saiu fluente e parece pronto. É exatamente por isso que precisa de revisão."));
      var codigo = partes.map(function (p) { return p[0]; }).join("") + fim;
      return { html: html, codigo: codigo.replace(/\s+/g, " ").trim() };
    },

    /* 12 · Lab — gerar, revisar, aprovar: o que falta para usar */
    checklist: function (v) {
      var ITENS = [
        ["fatos", "Fatos, leis e datas conferidos na fonte oficial", true, "conferir fatos, leis e datas"],
        ["numeros", "Números e cálculos refeitos", true, "refazer números e cálculos"],
        ["dados", "Dados pessoais e sigilosos retirados ou autorizados", true, "retirar os dados pessoais"],
        ["linguagem", "Linguagem da instituição, não o estilo da IA", false, "adaptar à linguagem da instituição"],
        ["transparencia", "Uso de IA informado, quando for o caso", false, "informar o uso de IA"],
        ["aprovacao", "Aprovado por quem responde pelo conteúdo", true, "aprovação de quem responde"]
      ];
      var oficial = v.destino === "oficial";
      var feitos = ITENS.filter(function (it) { return v[it[0]] === "true"; });
      var faltam = ITENS.filter(function (it) { return v[it[0]] !== "true" && (oficial || it[2]); });
      var liberado = !faltam.length;
      var etapas =
        '<ol class="etapas">' +
        '<li class="etapa etapa--feita"><b>Gerar com IA</b><span>rascunho pronto</span></li>' +
        '<li class="etapa' + (feitos.length === ITENS.length ? " etapa--feita" : " etapa--andando") + '"><b>Revisar e verificar</b><span>' + feitos.length + " de " + ITENS.length + " itens</span></li>" +
        '<li class="etapa' + (liberado ? " etapa--feita" : " etapa--parada") + '"><b>Aprovar e usar</b><span>' + (liberado ? "liberado" : "bloqueado") + "</span></li></ol>";
      var html = etapas + chips(ITENS.map(function (it) { return [it[1], v[it[0]] === "true"]; })) +
        (liberado ? veredito("ok", oficial ? "Pode publicar" : "Pode usar internamente", "Revisado, conferido e aprovado por uma pessoa responsável.")
          : veredito("erro", "Ainda não pode " + (oficial ? "publicar" : "usar"), "Falta: " + faltam.map(function (f) { return f[3]; }).join("; ") + "."));
      var codigo = "Registro de revisão · " + (oficial ? "comunicado oficial" : "rascunho interno") + "\n" +
        ITENS.map(function (it) { return (v[it[0]] === "true" ? "[x] " : "[ ] ") + it[1]; }).join("\n") +
        "\nSituação: " + (liberado ? "liberado" : "bloqueado");
      return { html: html, codigo: codigo };
    },

    /* 14 · Lab — a minuta do guia de uso de IA da turma */
    guia: function (v) {
      var setor = String(v.setor || "").trim() || "[setor]";
      var B = [
        ["Quando usar IA", [["u1", "estruturar textos e modelos em branco"], ["u2", "gerar ideias e organizar reuniões"], ["u3", "revisar a redação de textos sem dados pessoais"], ["u4", "resumir documentos públicos, como leis e normas"]]],
        ["Quando não usar", [["n1", "decisões administrativas sobre pessoas"], ["n2", "documentos com dados pessoais ou sigilosos"], ["n3", "normas, pareceres e documentos oficiais"], ["n4", "respostas com responsabilidade jurídica"]]],
        ["Validação obrigatória", [["v1", "quem assina revisa o texto inteiro"], ["v2", "fatos, leis e números conferidos na fonte"], ["v3", "comunicado oficial aprovado pela chefia"], ["v4", "uso de IA informado quando o conteúdo for publicado"]]],
        ["Dados que nunca entram", [["d1", "CPF, RG, CNH, telefone e endereço"], ["d2", "saúde e situações disciplinares"], ["d3", "salários, contratos e dados financeiros"], ["d4", "processos e documentos internos"]]]
      ];
      var vazios = [];
      var corpo = B.map(function (b, i) {
        var marcados = b[1].filter(function (it) { return v[it[0]] === "true"; });
        if (!marcados.length) vazios.push(b[0].toLowerCase());
        return "<section><h4>" + (i + 1) + ". " + esc(b[0]) + "</h4>" + (marcados.length
          ? "<ul>" + marcados.map(function (it) { return "<li>" + esc(it[1].charAt(0).toUpperCase() + it[1].slice(1)) + "</li>"; }).join("") + "</ul>"
          : '<p class="guia-vazio">bloco em branco</p>') + "</section>";
      }).join("");
      var html =
        '<article class="guia-doc"><header><small>minuta da turma · sem valor oficial</small><b>Guia de uso de IA · ' + esc(setor) + "</b></header>" +
        '<div class="guia-blocos">' + corpo + "</div>" +
        "<footer>A responsabilidade pelo uso da IA é sempre humana. Em caso de conflito, valem as políticas da instituição e a LGPD.</footer></article>" +
        avisos(vazios.map(function (b) { return "O bloco \"" + b + "\" está vazio: toda regra de uso precisa dele."; }));
      var codigo = "GUIA DE USO DE IA · " + setor.toUpperCase() + " (minuta da turma)\n" + B.map(function (b, i) {
        var m = b[1].filter(function (it) { return v[it[0]] === "true"; });
        return "\n" + (i + 1) + ". " + b[0] + "\n" + (m.length ? m.map(function (it) { return "- " + it[1]; }).join("\n") : "- (em branco)");
      }).join("\n");
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
     10. DESTA AULA — ENCONTRE OS PROBLEMAS NO TEXTO

     Um texto dividido em trechos clicáveis. O trecho com
     data-achado="Título|explicação" é um problema; clicar
     marca e revela na lista. Trecho sem problema fica verde
     por um instante. Usado nos termos de uso (03) e no
     comunicado gerado por IA (10).

     <div data-achados>
       <span data-trecho data-achado="Título|explicação">…</span>
       <span data-trecho>…</span>
       <ol data-achados-lista></ol>
       <span data-achados-contador></span>
       <button data-achados-todos>…</button> <button data-achados-limpar>…</button>
     </div>
     ====================================================== */

  document.querySelectorAll("[data-achados]").forEach(function (raiz) {
    var trechos = Array.prototype.slice.call(raiz.querySelectorAll("[data-trecho]"));
    var problemas = trechos.filter(function (t) { return t.hasAttribute("data-achado"); });
    var lista = raiz.querySelector("[data-achados-lista]");
    var cont = raiz.querySelector("[data-achados-contador]");
    var rotulo = raiz.getAttribute("data-achados") || "problemas";
    function desenhar() {
      var n = problemas.filter(function (t) { return t.classList.contains("trecho--achado"); }).length;
      if (cont) cont.textContent = n + " de " + problemas.length + " " + rotulo + " encontrados";
      if (lista) lista.innerHTML = problemas.map(function (t) {
        var d = t.getAttribute("data-achado").split("|");
        return t.classList.contains("trecho--achado")
          ? '<li class="achado-item achado-item--visto"><b>' + esc(d[0]) + "</b> " + esc(d[1]) + "</li>"
          : '<li class="achado-item">?</li>';
      }).join("");
    }
    trechos.forEach(function (t) {
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      function marcar() {
        if (t.hasAttribute("data-achado")) { t.classList.add("trecho--achado"); desenhar(); return; }
        t.classList.add("trecho--ok");
        setTimeout(function () { t.classList.remove("trecho--ok"); }, 900);
      }
      t.addEventListener("click", marcar);
      t.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); marcar(); } });
    });
    var todos = raiz.querySelector("[data-achados-todos]");
    var limpar = raiz.querySelector("[data-achados-limpar]");
    if (todos) todos.addEventListener("click", function () { problemas.forEach(function (t) { t.classList.add("trecho--achado"); }); desenhar(); });
    if (limpar) limpar.addEventListener("click", function () { problemas.forEach(function (t) { t.classList.remove("trecho--achado"); }); desenhar(); });
    desenhar();
  });

  /* ======================================================
     12. DESTA AULA — COPIAR O TEXTO MONTADO

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
