# Sistema de design e anatomia dos blocos

Todo o CSS citado aqui está pronto em `assets/estilo.css` e `assets/demos.css`. A identidade vem
de `material/designsystem.pdf` (modelo institucional do SEST SENAT: slide de abertura, slide
interno e cartão do instrutor).

---

## 1. Tokens

A identidade é fixa: não extraia cores nem fontes do material de origem.

```css
:root{
  /* identidade SEST SENAT */
  --azul:        #00307C;   /* azul institucional: capa, títulos, selos escuros */
  --marinho:     #002060;   /* azul-marinho: rodapé, barra dos simuladores */
  --ciano:       #5FE1FF;   /* destaque: título da capa, selos, atividade */
  --gelo:        #EAF6FE;   /* azul-gelo: barra superior, fundos suaves */
  --azul-linha:  #009EE2;   /* azul da linha do logotipo: contornos de estrutura, progresso */
  --ciano-suave: rgba(95,225,255,.26);  /* fundo de termos e <code> no texto */

  --tinta:       #0B1F3F;   /* texto principal */
  --fundo:       #FFFFFF;
  --superficie:  #FFFFFF;
  --borda:       #D3E2F1;
  --texto:       #4A5B74;   /* texto secundário */

  /* painel escuro: código, fórmula, caminho de menus */
  --code-bg:     #0A1A3A;
  --code-fg:     #EEF4FB;
  --code-com:    #8FA4C2;   /* comentário */
  --code-cia:    #5FE1FF;   /* tag, seletor, nome de função */
  --code-pro:    #9EC3FF;   /* propriedade, atributo, referência de célula */
  --code-rox:    #C9B5FF;   /* valor, número */
  --code-ama:    #FFD27A;   /* texto entre aspas */

  --erro-bg: #FFF3F1;  --erro-bd: #F6CFC8;  --erro-tx: #8C2F1F;    /* cartão de alerta */
  --certo-bg:#EAF8F0;  --certo-bd:#A9DCC0;  --certo-tx:#17603A;    /* quiz, comparativo */

  --titulo: "Roboto", "Segoe UI", Arial, sans-serif;            /* Roboto Bold, local em fonts/ */
  --corpo:  Calibri, Carlito, "Segoe UI", Arial, sans-serif;    /* Calibri do Windows */
  --mono:   ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;

  --raio: 14px;
  --largura: 1680px;
}
```

**Como cada cor se usa:**

| Token | Fundo de | Texto/linha em |
|---|---|---|
| `--azul` | capa, selo de bloco (`.selo--escuro`), cabeçalho de tabela, menu ativo | títulos de seção, texto sobre ciano |
| `--ciano` | selo numerado, chip preenchido, atividade, `preview-selo` | título da capa, texto sobre azul |
| `--gelo` | barra fixa, meia-lua clara | — |
| `--marinho` | rodapé, barra do simulador | — |
| `--azul-linha` | barra de progresso | contorno tracejado de estrutura, foco |

Ciano sobre branco não tem contraste para texto nem para contorno: use `--azul-linha` para
linhas e `--azul` para texto. Ciano só aparece como **fundo** ou como **texto sobre azul**.

**Escala para projeção, não para leitura de perto:** corpo 19px (Calibri é menor que Arial no mesmo
tamanho), lead 25px, título de seção 56px, código 16px. Em um projetor de sala, 16px é o mínimo
legível no fundo da turma.

**Fontes sem internet.** Roboto vem de `fonts/roboto-latin.woff2` (fonte variável, pesos 100 a
900, licença `fonts/OFL.txt`), declarada no topo do `estilo.css`. Calibri é do Windows; fora dele
entra Carlito (mesmas medidas) ou Segoe UI/Arial.

---

## 2. Esqueleto da página

```
barra fixa (azul-gelo: símbolo + assunto + menu + barra de progresso)
capa (azul: chips de curso e aula, título em ciano, subtítulo, cartão do instrutor,
      meias-luas e logotipos à direita)
main
├── roteiro            o que vamos ver hoje + legenda das demonstrações
├── seção por conceito ×N
├── laboratórios       (planilha, construtores, tour, quiz, playground)
└── referência rápida  tabela-resumo
atividade (fundo ciano)
rodapé (azul-marinho: fechamento, curso · aula, instrutor, unidade, logotipos)
botão voltar ao topo
```

### Capa (slide de abertura do modelo)

```html
<header class="capa">
  <div class="capa-interna">
    <div class="capa-texto">
      <div class="capa-meta"><span>Excel Básico</span><span>Aula 3</span></div>
      <h1>Fórmulas</h1>
      <p class="subtitulo">Somar, calcular médias e decidir com SE</p>
      <div class="assinatura">
        <span class="instrutor">Nome do Instrutor</span>
        <span class="cargo">Instrutor de Informática · Unidade B086 - Foz do Iguaçu/PR</span>
        <span class="contato">E-mail: nome@sestsenat.org.br</span>   <!-- opcional -->
      </div>
    </div>
    <div class="capa-arte" aria-hidden="true"><span class="lua lua--gelo"></span><span class="lua lua--ciano"></span></div>
    <div class="capa-marcas">
      <img src="img/logo-sest-senat-branco.png" alt="SEST SENAT">
      <img src="img/logo-sistema-transporte-branco.png" alt="CNT / SEST SENAT / ITL — Sistema Transporte">
    </div>
  </div>
</header>
```

As meias-luas reproduzem o slide: a azul-gelo encosta no topo, a ciano encosta na base, as duas
sobre o mesmo eixo vertical; os logotipos ficam à direita do eixo, acima da meia-lua ciano. Abaixo
de 1100px as meias-luas somem e os logotipos sobem para o topo da capa. A capa é institucional:
não ponha arte do assunto nela (o assunto aparece no título e, se quiser, no roteiro).

O nome do instrutor usa Calibri negrito itálico em ciano, como no cartão do instrutor do modelo.

### Barra fixa (faixa do slide interno)

```html
<a class="barra-marca" href="#roteiro"><img class="simbolo" src="img/simbolo.svg" alt=""> Assunto</a>
```

O símbolo das meias-luas também é o ícone da aba: `<link rel="icon" href="img/simbolo.svg">`.

---

## 3. Anatomia de uma seção

```html
<section class="secao" id="identificador">
  <div class="secao-topo">
    <span class="selo">04</span>
    <h2 class="secao-titulo">PROCV</h2>
  </div>
  <p class="secao-lead">Uma frase que diz para que serve e quando se usa.</p>

  <!-- par "o que se faz" + "o que acontece" -->
  <div class="dupla">
    <figure class="painel-codigo">
      <figcaption>digite na célula F2</figcaption>
      <pre class="codigo" data-lang="formula">=PROCV(E2;A2:C10;3;FALSO)</pre>
      <!-- ou: <ol class="caminho">…</ol>, <p class="atalho"><kbd>Ctrl</kbd> + <kbd>C</kbd></p>,
           <ol class="passos">…</ol>, ou código escapado (&lt; vira &amp;lt;) -->
    </figure>

    <div class="preview">
      <div class="preview-topo">
        <span class="preview-selo">preview</span>
        <code>o que esta caixa demonstra</code>
      </div>
      <div class="preview-corpo">
        <!-- resultado funcionando: planilha, aplicativo refeito, demo ao vivo -->
      </div>
    </div>
  </div>

  <!-- variações do conceito, uma mini por valor -->
  <div class="galeria">
    <div class="mini">
      <div class="mini-titulo"><code>FALSO</code><span>correspondência exata</span></div>
      <!-- demonstração -->
    </div>
  </div>

  <!-- três lições que ficam da seção -->
  <div class="cartoes">
    <article class="cartao"><h3>Título curto</h3><p>Uma ou duas frases.</p></article>
    <article class="cartao"><h3>…</h3><p>…</p></article>
    <article class="cartao cartao--erro"><h3>Armadilha</h3><p>O erro que o aluno vai cometer.</p></article>
  </div>
</section>
```

Rótulo do painel (`figcaption`): diga o que o aluno faz com aquilo — "digite na célula D5",
"caminho e atalho", "medida DAX", "estilo.css".

Variantes de largura:

- `.dupla--preview` — preview ganha o dobro da largura do painel
- `.dupla--codigo` — o contrário
- `.pilha` — preview em cima em largura total, painel embaixo (ver seção 5)
- `.galeria--duplo` (2 por linha), `--largo`, `--cheio`; `.mini--largo` força 100%

**Regra das galerias:** mostre *todas* as variações simultaneamente, uma por mini (os quatro
formatos de número, os cinco valores de `justify-content`). O instrutor rola e a turma vê a
diferença; nada fica escondido atrás de clique.

**Regra dos cartões:** três por seção. O terceiro costuma ser a armadilha (`.cartao--erro`) ou a
novidade da versão (`.cartao--novo`).

---

## 4. Marcação das demonstrações

Convenção declarada na legenda do roteiro e usada na aula inteira:

```css
.demo-grade .row      { outline:2px dashed var(--azul-linha); outline-offset:-2px;
                        background:rgba(0,158,226,.06); border-radius:8px }
.demo-grade [class*="col"] { outline:2px dashed #98A2A9; outline-offset:-4px; min-height:42px }
```

`outline` e não `border`: contorno não entra no box model, então a demonstração continua medindo
exatamente o que o código produz. Quando a aula ensina CSS puro (Flexbox, Grid), use `border`
mesmo — ali a borda faz parte da lição.

Em aula sem código a convenção é outra e também vai na legenda: "painel escuro = o que você
digita ou clica; caixa branca = o que acontece"; na planilha, a célula ativa tem contorno verde e
as células citadas pela fórmula ganham as cores de referência do Excel (azul, vermelho, roxo…).

---

## 5. Evitar área vazia

Medida antes de escolher o layout da seção:

| Diferença de altura entre os dois painéis | Layout |
|---|---|
| < 250px | `.dupla` (lado a lado) |
| ≥ 250px | `.pilha` |

```css
.pilha{display:flex;flex-direction:column;gap:28px;margin-bottom:28px}
.painel-codigo--duplo > .codigo{
  columns:2;column-gap:40px;column-rule:1px solid #22355a;orphans:3;widows:3;
}
@media (max-width:1200px){ .painel-codigo--duplo > .codigo{columns:1;column-rule:none} }

/* nas que continuam lado a lado */
.dupla > .preview{position:sticky;top:84px}
```

Também enxugue código repetitivo: se o preview já mostra as oito cores de botão, o painel precisa
mostrar o padrão e um comentário com a lista, não oito linhas iguais. Em aula sem código, uma
fórmula curta ao lado de uma planilha alta: complete o painel com o caminho de menus, o atalho e um
comentário (`// soma o intervalo…`), ou use `.pilha`.

---

## 6. Blocos especiais

### Roteiro + legenda (abre a aula)

```html
<section class="secao" id="roteiro" style="border-top:none">
  <div class="secao-topo">
    <span class="selo selo--escuro">Aula</span>
    <h2 class="secao-titulo">O que vamos ver hoje</h2>
  </div>
  <p class="secao-lead">Uma frase sobre o arco da aula.</p>

  <div class="roteiro">
    <a href="#porque"><span class="num">01</span><span class="rotulo">Por que isso existe</span></a>
    <!-- … até 8 itens, agrupando as seções em blocos temáticos -->
  </div>

  <h3 class="sub-titulo">Como ler as demonstrações desta página</h3>
  <div class="legenda">
    <div class="legenda-item">Painel escuro = o que você digita ou clica. Caixa branca = o que acontece.</div>
    <div class="legenda-item">Toda caixa de <b>preview</b> funciona de verdade: clique, digite, teste.</div>
    <!-- aula de layout: -->
    <div class="legenda-item"><span class="amostra amostra--linha"></span> tracejado azul = o contêiner</div>
    <div class="legenda-item"><span class="amostra amostra--coluna"></span> tracejado cinza = cada filho</div>
  </div>
</section>
```

### Comparativo antes/depois

Para o jeito antigo vs. o jeito atual, ou errado vs. certo (e-mail legítimo x golpe, fórmula com
`,` x com `;`):

```html
<div class="par">
  <div><span class="rotulo-antigo">como era</span>  … </div>
  <div><span class="rotulo-atual">como é hoje</span> … </div>
</div>
```

### Referência rápida (fecha o conteúdo)

`<table class="tabela">` dentro de `<div class="rolagem-x">`. Em aula de código, as colunas são
*família · classes · para que serve*; em aula sem código, *para · use · onde / atalho*. É a cola
que o aluno fotografa.

---

## 7. Atividade final

Fundo ciano, três partes, mais resultado esperado e critérios.

```html
<section class="secao atividade" id="atividade">
  <div class="wrap">
    <div class="secao-topo">
      <span class="selo selo--escuro">Atividade</span>
      <h2 class="secao-titulo">Monte o controle de gastos</h2>
    </div>
    <p class="secao-lead">Uma frase que descreve o produto final.</p>

    <div class="dupla">
      <div class="bloco-branco">
        <span class="nivel">Parte 1 · obrigatória</span>
        <h3>O que a planilha precisa ter</h3>
        <ul class="requisitos"><li>…</li></ul>
      </div>
      <div class="bloco-branco">            <!-- ou <figure class="painel-codigo"> em aula de código -->
        <span class="nivel">ponto de partida</span>
        <h3>Já está pronto</h3>
        …
      </div>
    </div>

    <div class="dupla">
      <div class="bloco-branco">
        <span class="nivel">Parte 2 · desafio</span>
        <h3>Exigências que quebram a solução preguiçosa</h3>
        <ul class="requisitos"><li>…</li></ul>
      </div>
      <div class="bloco-branco">
        <span class="nivel">Parte 3 · investigação</span>
        <h3>Responda por escrito, junto da entrega</h3>
        <ul class="requisitos"><li>…</li></ul>
      </div>
    </div>

    <h3 class="sub-titulo">Resultado esperado na tela</h3>
    <div class="bloco-branco"><!-- planilha, aplicativo refeito ou simulador do alvo --></div>

    <div class="criterios">
      <article class="cartao"><h3>Entrega</h3><p>…</p></article>
      <article class="cartao"><h3>Critério técnico</h3><p>…</p></article>
      <article class="cartao"><h3>Critério de acessibilidade</h3><p>…</p></article>
    </div>
  </div>
</section>
```

**Como escrever cada parte:**

- **Parte 1 — obrigatória.** Lista do que o produto precisa ter. Cada item cita o recurso que
  resolve (a função, o botão, a classe). É o aluno reproduzindo o que viu.
- **Parte 2 — desafio.** De cinco a seis exigências que a solução ingênua não atende. **Cada
  exigência deve forçar um recurso específico da aula.** Em planilha: um total que precisa
  continuar certo quando se insere uma linha no meio (intervalo bem escolhido), uma célula que
  muda de texto conforme o valor (`SE`), um percentual que usa referência absoluta (`$B$1`), um
  resultado que não pode dar erro quando o item não existe (`SEERRO`). Em código: um item que
  precisa do dobro do espaço só a partir de um ponto de quebra, um elemento que aparece primeiro
  na tela mas é o último no HTML.
- **Parte 3 — investigação.** Perguntas respondidas por escrito junto da entrega (em aula de
  código, em comentário no próprio código; em planilha, numa aba "Respostas"): por que A dá
  resultado diferente de B, o que acontece se trocar X por Y, onde você usou Z. Transforma o
  exercício de cópia em entendimento.

Proibições explícitas valem mais que requisitos: "nenhum valor calculado digitado à mão: tudo por
fórmula", "sem `float`, sem `position`, sem `@media`" obrigam a usar o que foi ensinado.

---

## 8. Curso, aula, instrutor e unidade na página

Toda aula mostra onde se encaixa no curso e quem a ministra. Quatro pontos, sempre os mesmos, para
o aluno reconhecer a aula de longe:

**Capa — chips** entre o topo e o título. O primeiro (curso) é só contorno, o segundo (aula) é
preenchido de ciano:

```html
<div class="capa-meta"><span>Excel Básico</span><span>Aula 3</span></div>
```

Use `<div>` com `<span>` (e não `<p>`): parágrafos da capa herdam corpo grande.

**Capa — assinatura** (cartão do instrutor do modelo institucional):

```html
<div class="assinatura">
  <span class="instrutor">Nome do Instrutor</span>
  <span class="cargo">Instrutor de Informática · Unidade B086 - Foz do Iguaçu/PR</span>
  <span class="contato">E-mail: nome@sestsenat.org.br</span>   <!-- só se for informado -->
</div>
```

O cargo é escrito como o pedido disser ("Instrutor de Informática", "Instrutora de Informática");
na falta, pergunte. A unidade é sempre "Unidade B086 - Foz do Iguaçu/PR".

**Rodapé** — linha abaixo da frase de fechamento, dentro do `<div>` que tem o `<h2>`:

```html
<div class="rodape-meta">Excel Básico · Aula 3 — Nome do Instrutor, Instrutor de Informática<br>SEST SENAT · Unidade B086 - Foz do Iguaçu/PR</div>
```

**Metadados** — para ferramentas e scripts localizarem a aula sem ler o texto:

```html
<body data-curso="excel-basico" data-aula="aula3" data-instrutor="Nome do Instrutor" data-unidade="B086">
```

Rótulos: `aula3` → "Aula 3"; `excel-basico` → o nome do curso com acentos, como o pedido escreveu
("Excel Básico"). O `README.md` da aula repete curso, aula, instrutor e unidade.

**Onde ficam os arquivos:** material em `material/<curso>/<aula>/` (ou `material/<curso>/`
quando serve ao curso inteiro), aula em `aulas/<curso>/<aula>/`. Os caminhos relativos dentro da
aula (`css/`, `js/`, `fonts/`, `img/`, `vendor/`) não mudam, porque a pasta da aula é autônoma.

---

## 9. Logotipos e símbolo

Extraídos de `material/designsystem.pdf`, em `assets/img/`:

| Arquivo | Uso |
|---|---|
| `logo-sest-senat-branco.png` | capa e rodapé (fundo azul ou marinho) |
| `logo-sistema-transporte-branco.png` | "CNT / SEST SENAT / ITL — Sistema Transporte", sempre junto do anterior |
| `logo-sest-senat-azul.png`, `logo-sistema-transporte-azul.png` | fundos claros (gelo, branco), quando precisar |
| `simbolo.svg` | meias-luas: barra fixa e ícone da aba |

- Branco sobre azul/marinho, azul sobre gelo/branco. Nunca sobre a meia-lua clara nem sobre ciano.
- Não estique, não recolora, não aplique `filter`; largura mínima de 200px na capa.
- Os dois logotipos andam juntos, empilhados, com o "SEST SENAT" em cima.
