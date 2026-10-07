---
description: Cria uma aula SEST SENAT em página única (HTML/CSS/JS para projetar) a partir de um material, guardando tudo no curso e na aula corretos e atribuída ao instrutor
argument-hint: <arquivo> [curso] [aula] [instrutor]
---

Crie uma aula nova com a habilidade `aula-sest-senat`.

**Argumentos recebidos:** $ARGUMENTS

Siga este roteiro, sem pular etapas:

1. **Descobrir curso, aula e instrutor (obrigatório, vem primeiro).**
   Procure nos argumentos e na mensagem do usuário:
   - o **curso** (`excel-basico`, "Excel Básico", "curso de Power BI");
   - a **aula** (`aula3`, "aula 3", "terceira aula");
   - o **instrutor**: nome e cargo como devem aparecer ("Yuri Reis Correa, Instrutor de
     Informática"), e o e-mail, se for informado.

   **O que faltar, pergunte antes de fazer qualquer outra coisa**, tudo numa rodada só:
   - curso: ofereça como opções os cursos que já existem em `material/` e `aulas/`;
   - aula: diga quais aulas o curso já tem e sugira a próxima;
   - instrutor: se o curso já tem aulas, ofereça o instrutor delas (`data-instrutor` do
     `index.html` ou o `README.md`). Pergunte também o cargo como deve aparecer ("Instrutor de
     Informática", "Instrutora de Informática"), a menos que o pedido já diga. Não deduza o cargo
     pelo nome da pessoa.

   Nunca deduza o curso pelo assunto do material. A unidade é sempre **B086 - Foz do Iguaçu/PR**.

2. **Guardar o material no lugar certo.**
   Nomes de pasta: curso em minúsculas, sem acento, com hífen (`excel-basico`, `power-bi`); aula
   como `aula` + número, sem zero à esquerda (`aula1`, `aula12`). Se o curso é novo, proponha o
   nome da pasta e o rótulo com acentos ("Excel Básico") na mesma pergunta do passo 1.
   O primeiro argumento é um arquivo (PPTX, PDF, DOCX, XLSX ou texto). Procure em
   `material/<curso>/<aula>/`, depois em `material/<curso>/`, depois em `material/` (raiz) e, se
   for um caminho, no caminho dado.
   **O material de uma aula fica em `material/<curso>/<aula>/`**; material que serve ao curso
   inteiro (apostila usada em várias aulas) fica em `material/<curso>/`. Se o arquivo estiver em
   outro lugar, **copie** (não mova) para lá.
   Se não vier argumento, liste o que existe em `material/<curso>/<aula>/` e `material/<curso>/` e
   pergunte qual usar.

3. **Identidade visual: sempre a do SEST SENAT.** Use os assets da habilidade (cores, Roboto local,
   logotipos e símbolo). Não extraia cores nem fontes do material de origem: ele pode ter a marca
   de outra empresa.

4. **Ler o material por inteiro** antes de planejar. Em PDFs longos, extraia o texto para um
   arquivo temporário e leia em blocos.

5. **Conferir se o conteúdo envelheceu**, se o material tiver mais de um ano: busque a versão
   atual na documentação oficial e compare menu por menu, função por função, classe por classe.
   Registre o que mudou em um cartão de alerta dentro da seção correspondente.

6. **Escolher a demonstração de cada conceito** (habilidade, §3.4): fórmula + mini planilha que
   calcula, caminho de menus + aplicativo refeito em HTML, tour clicável, quiz, laboratório com
   construtor; código + demo ao vivo quando o assunto é programação. Nunca captura de tela.

7. **Criar `aulas/<curso>/<aula>/`** com os mesmos nomes de `material/`. Use a estrutura da
   habilidade (`index.html` a partir de `assets/modelo-aula.html`, `css/`, `js/`, `fonts/`, `img/`,
   `demos/` e `vendor/` quando houver, `README.md`), copiando os arquivos de `assets/` e adaptando.

8. **Inserir curso, aula, instrutor e unidade na página**: chips de curso e aula na capa
   (`.capa-meta`), assinatura do instrutor com cargo e unidade (`.assinatura`), linha no rodapé
   (`.rodape-meta`) e `data-curso`/`data-aula`/`data-instrutor`/`data-unidade` no `<body>`. Modelo
   em `references/design-system.md` §8. Repita tudo no `README.md` da aula.

9. **Referência de qualidade:** `exemplos/aula-excel/` (aula completa sem código: planilhas que
   calculam, laboratórios com construtor, tour, quiz, gráfico que acompanha a planilha, atividade) e
   `.claude/skills/aula-sest-senat/assets/modelo-aula.html` (todos os blocos, com e sem código).

10. **Verificar** conforme `references/qa-e-armadilhas.md`: sem transbordo horizontal, sem erro de
    console, laboratórios, planilhas, quiz e tour funcionando, iframes com altura justa, sem área
    vazia entre painéis, abrindo por `file://` com a Roboto e os logotipos, nenhum texto dirigido
    ao instrutor, chips de curso/aula e assinatura do instrutor visíveis na capa.

11. **Entregar** com um resumo curto: onde ficaram o material e a aula (caminhos completos), o
    curso, a aula e o instrutor registrados, e o que foi corrigido em relação ao material de
    origem. Não apague nem edite o material original.
