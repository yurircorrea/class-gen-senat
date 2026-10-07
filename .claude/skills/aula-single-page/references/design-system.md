# Sistema de design e anatomia dos blocos

Todo o CSS citado aqui está pronto em `assets/estilo.css` e `assets/demos.css`.

---

## 1. Tokens

Extraia os valores do material de origem do cliente. Os abaixo vieram de um PPTX institucional
(verde de marca + painel de código estilo Monokai) e funcionam bem como ponto de partida:

```css
:root{
  --verde:        #00E88F;   /* cor de destaque: capa, selos, atividade */
  --verde-escuro: #0A2A1E;   /* texto sobre a cor de destaque, cabeçalho de tabela */
  --tinta:        #000000;
  --fundo:        #FAFAFA;
  --superficie:   #FFFFFF;   /* cartões, previews */
  --borda:        #DFE4E1;
  --texto:        #5B6660;   /* texto secundário */

  --code-bg:      #0E1A15;   /* painel de código */
  --code-fg:      #F2F5F3;
  --code-com:     #8A9199;   /* comentário */
  --code-cia:     #78DCE8;   /* tag, seletor */
  --code-rox:     #AB9DF2;   /* valor, número */
  --code-ama:     #FFD866;   /* texto entre aspas */

  --erro-bg:      #FFF3F1;   /* cartão de alerta */
  --erro-bd:      #F6CFC8;
  --erro-tx:      #8C2F1F;

  --titulo: "Barlow Semi Condensed", "Arial Narrow", Arial, sans-serif;
  --corpo:  Arial, Helvetica, "Segoe UI", sans-serif;
  --mono:   ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;

  --raio: 14px;
  --largura: 1680px;
}
```

**Escala para projeção, não para leitura de perto:** corpo 18px, lead 24px, título de seção 58px,
código 16px. Em um projetor de sala, 16px é o mínimo legível no fundo da turma.

**Fonte de título com alternativa real.** `Barlow Semi Condensed` vem do Google Fonts, mas
`Arial Narrow, Arial` precisa estar na pilha: a sala pode estar sem internet.

---

## 2. Esqueleto da página

```
barra fixa (marca + menu + barra de progresso)
capa (cor de destaque, logo, título gigante, assinatura, arte)
main
├── roteiro            o que vamos ver hoje + legenda das demonstrações
├── seção por conceito ×N
├── laboratório livre
└── referência rápida  tabela-resumo
atividade (fundo na cor de destaque)
rodapé (escuro)
botão voltar ao topo
```

---

## 3. Anatomia de uma seção

```html
<section class="secao" id="identificador">
  <div class="secao-topo">
    <span class="selo">04</span>
    <h2 class="secao-titulo">justify-content</h2>
  </div>
  <p class="secao-lead">Uma frase que diz para que serve e quando se usa.</p>

  <!-- par código + preview -->
  <div class="dupla">
    <figure class="painel-codigo">
      <figcaption>arquivo.css</figcaption>
      <pre class="codigo">/* código escapado: &lt; vira &amp;lt; */</pre>
    </figure>

    <div class="preview">
      <div class="preview-topo">
        <span class="preview-selo">preview</span>
        <code>o que esta caixa demonstra</code>
      </div>
      <div class="preview-corpo">
        <!-- resultado real do código acima -->
      </div>
    </div>
  </div>

  <!-- variações do conceito, uma mini por valor -->
  <div class="galeria">
    <div class="mini">
      <div class="mini-titulo"><code>center</code><span>bloco de itens no meio</span></div>
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

Variantes de largura:

- `.dupla--preview` — preview ganha o dobro da largura do código
- `.dupla--codigo` — o contrário
- `.pilha` — preview em cima em largura total, código embaixo (ver seção 5)
- `.galeria--duplo` (2 por linha), `--largo`, `--cheio`; `.mini--largo` força 100%

**Regra das galerias:** mostre *todos* os valores da propriedade simultaneamente, um por mini.
O professor rola e vê a diferença; nada fica escondido atrás de clique.

**Regra dos cartões:** três por seção. O terceiro costuma ser a armadilha (`.cartao--erro`) ou a
novidade da versão (`.cartao--novo`).

---

## 4. Marcação das demonstrações

Convenção declarada na legenda do roteiro e usada na aula inteira:

```css
.demo-grade .row      { outline:2px dashed var(--verde); outline-offset:-2px;
                        background:rgba(0,232,143,.06); border-radius:8px }
.demo-grade [class*="col"] { outline:2px dashed #98A2A9; outline-offset:-4px; min-height:42px }
```

`outline` e não `border`: contorno não entra no box model, então a demonstração continua medindo
exatamente o que o código produz.

Quando a aula ensina CSS puro (Flexbox, Grid), use `border` sólida/tracejada mesmo — ali a borda
faz parte da lição. Quando a aula ensina um framework, use `outline` para não interferir nos
componentes.

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
  columns:2;column-gap:40px;column-rule:1px solid #22332c;orphans:3;widows:3;
}
@media (max-width:1200px){ .painel-codigo--duplo > .codigo{columns:1;column-rule:none} }

/* nas que continuam lado a lado */
.dupla > .preview{position:sticky;top:84px}
```

Também enxugue código repetitivo: se o preview já mostra as oito cores de botão, o código precisa
mostrar o padrão e um comentário com a lista, não oito linhas iguais.

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
    <!-- … 8 itens, agrupando as seções em blocos temáticos -->
  </div>

  <h3 class="sub-titulo">Como ler as demonstrações desta página</h3>
  <div class="legenda">
    <div class="legenda-item"><span class="amostra amostra--linha"></span> tracejado verde = o contêiner</div>
    <div class="legenda-item"><span class="amostra amostra--coluna"></span> tracejado cinza = cada filho</div>
    <div class="legenda-item">Toda caixa de <b>preview</b> é código de verdade rodando nesta página.</div>
  </div>
</section>
```

### Comparativo antes/depois

Para o jeito antigo vs. o jeito atual, ou errado vs. certo:

```html
<div class="par">
  <div><span class="rotulo-antigo">como era</span>  … </div>
  <div><span class="rotulo-atual">como é hoje</span> … </div>
</div>
```

### Referência rápida (fecha o conteúdo)

`<table class="tabela">` dentro de `<div class="rolagem-x">`, com as colunas
*família · classes · para que serve*. É a cola que o aluno fotografa.

---

## 7. Atividade final

Fundo na cor de destaque, três partes, mais resultado esperado e critérios.

```html
<section class="secao atividade" id="atividade">
  <div class="wrap">
    <div class="secao-topo">
      <span class="selo selo--escuro">Atividade</span>
      <h2 class="secao-titulo">Monte o layout</h2>
    </div>
    <p class="secao-lead">Uma frase que descreve o produto final.</p>

    <div class="dupla">
      <div class="bloco-branco">
        <span class="nivel">Parte 1 · obrigatória</span>
        <h3>O que a página precisa ter</h3>
        <ul class="requisitos"><li>…</li></ul>
      </div>
      <figure class="painel-codigo">
        <figcaption>estrutura HTML — já está pronta</figcaption>
        <pre class="codigo">…</pre>
      </figure>
    </div>

    <div class="dupla">
      <div class="bloco-branco">
        <span class="nivel">Parte 2 · desafio</span>
        <h3>Exigências que quebram a solução preguiçosa</h3>
        <ul class="requisitos"><li>…</li></ul>
      </div>
      <div class="bloco-branco">
        <span class="nivel">Parte 3 · investigação</span>
        <h3>Responda em comentário no próprio código</h3>
        <ul class="requisitos"><li>…</li></ul>
      </div>
    </div>

    <h3 class="sub-titulo">Resultado esperado na tela</h3>
    <div class="bloco-branco"><!-- simulador ou demonstração do alvo --></div>

    <div class="criterios">
      <article class="cartao"><h3>Entrega</h3><p>…</p></article>
      <article class="cartao"><h3>Critério técnico</h3><p>…</p></article>
      <article class="cartao"><h3>Critério de acessibilidade</h3><p>…</p></article>
    </div>
  </div>
</section>
```

**Como escrever cada parte:**

- **Parte 1 — obrigatória.** Lista do que a página precisa ter. Cada item cita a classe ou
  propriedade que resolve. É o aluno reproduzindo o que viu.
- **Parte 2 — desafio.** De cinco a seis exigências que a solução ingênua não atende: um item que
  precisa do dobro do espaço só a partir de um ponto de quebra, botões de cartões com textos
  diferentes alinhados na mesma linha, um elemento que aparece primeiro na tela mas é o último no
  HTML, um contador sobreposto, um bloco que não pode encolher. **Cada exigência deve forçar uma
  propriedade específica da aula.**
- **Parte 3 — investigação.** Perguntas respondidas em comentário no próprio código: por que A dá
  resultado diferente de B, o que acontece se trocar X por Y, onde você usou Z e para que aponta.
  Transforma o exercício de cópia em entendimento.

Proibições explícitas valem mais que requisitos: "sem `float`, sem `position`, sem `@media`" obriga
a usar o que foi ensinado.

---

## 8. Referência de período e PM na página

Quando o projeto organiza as aulas por período e PM (projeto mensal), a página mostra onde ela se
encaixa no curso. Três pontos, sempre os mesmos, para o aluno reconhecer a aula de longe:

**Capa** — chips entre o logotipo e o título. O primeiro é só contorno, o segundo é preenchido:

```html
<div class="capa-meta"><span>2º período</span><span>PM 2 · Projeto Mensal</span></div>
```

**Rodapé** — linha abaixo da frase de fechamento, dentro do `<div>` que tem o `<h2>`:

```html
<div class="rodape-meta">2º período · PM 2 — Projeto Mensal</div>
```

**Metadados** — para ferramentas e scripts localizarem a aula sem ler o texto:

```html
<body data-periodo="2o_periodo" data-pm="pm2">
```

Use `<div>` com `<span>` (e não `<p>`) na capa: o CSS da capa dá corpo de 40px aos parágrafos e os
chips herdariam o tamanho.

Rótulos: `1o_periodo` → "1º período"; `pm3` → "PM 3 · Projeto Mensal". O CSS (`.capa-meta`,
`.rodape-meta`) já está em `assets/estilo.css`.

**Onde ficam os arquivos:** material em `material/<periodo>/<pm>/`, aula em
`aulas/<periodo>/<pm>/<tema>/` (o material em `material/<periodo>/<pm>/<tema>/`). Os caminhos relativos dentro da aula (`css/`, `js/`, `img/`,
`vendor/`) não mudam, porque a pasta da aula continua autônoma.
