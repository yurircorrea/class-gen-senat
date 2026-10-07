---
name: aula-single-page
description: Constrói aulas de tecnologia como página única em HTML/CSS/JS para o professor projetar e rolar na tela, a partir de material de origem (PPTX, PDF, apostila). Cada conceito vira uma seção com trecho de código e demonstração ao vivo lado a lado, mais laboratórios interativos, simuladores de largura de tela e uma atividade final em três partes. Use quando o pedido falar em aula, slide, apostila, material didático, conteúdo para projetor, ou em transformar uma apresentação em página web de ensino.
---

# Aula em página única para projeção

Produz uma pasta de projeto estático que o professor abre no navegador e rola durante a aula
inteira. Não é um site institucional nem um slide deck: é um documento longo, de leitura
vertical, em que **cada conceito aparece com o código e o resultado visível ao mesmo tempo**.

Testado em duas aulas completas (Flexbox a partir de um PPTX; Bootstrap 5 a partir de uma
apostila em PDF de 108 páginas).

---

## 1. Quando usar

- "transforme esta apresentação/apostila em uma aula em HTML"
- "faça um material de aula sobre X para eu projetar"
- "preciso de uma página com exemplos ao vivo de cada conceito"
- qualquer pedido que combine **material de origem + ensinar + projetar/rolar a tela**

Não use para: landing page, documentação de produto, portfólio, slide deck em PPTX.

---

## 2. O que entregar

```
<tema>/
├── index.html          a aula inteira, uma página só
├── css/
│   ├── estilo.css      sistema de design (copie de assets/estilo.css)
│   └── demos.css       marcação das demos, laboratórios, simuladores
├── js/
│   └── aula.js         realce de código, navegação, labs, simuladores, playground
├── demos/              páginas carregadas dentro dos simuladores (quando houver)
├── img/                logotipo e imagens de exemplo
├── vendor/             cópias locais de qualquer framework ensinado
└── README.md           estrutura, versões e convenções
```

Abre por duplo clique (`file://`), sem servidor, sem build e **sem internet**.

---

## 3. Processo

### 3.0 Situar a aula no currículo

Quando o projeto organiza o conteúdo por **período** e **PM (projeto mensal)** (por exemplo, o
projeto `class-gen`, com `aulas/<periodo>/<pm>/<tema>/` e `material/<periodo>/<pm>/<tema>/`), a aula
precisa saber a que lugar do curso pertence **antes** de qualquer outra coisa:

1. Se o pedido já disser o período e o PM (ex.: "2º período, PM2", `2o_periodo/pm2`), use.
2. Se não disser, **pergunte** (duas perguntas curtas, com as opções existentes como alternativas).
   Não adivinhe a partir do assunto.
3. Guarde o material de origem em `material/<periodo>/<pm>/<tema>/` (uma pasta por tema, para
   vários materiais do mesmo tema ficarem juntos) e crie a aula em
   `aulas/<periodo>/<pm>/<tema>/`, **sem prefixo `aula-`** e com o mesmo nome de tema nas duas
   árvores. O tema é um nome curto: minúsculas, sem acento, com hífen. Se o material veio de outro lugar do disco, **copie**
   (não mova) para a pasta certa.
4. Registre a referência **dentro da página** (ver `references/design-system.md` §8): chips de
   período e PM na capa, linha no rodapé e `data-periodo`/`data-pm` no `<body>`.

Nomes de pasta: `1o_periodo`, `2o_periodo`, …; `pm1` a `pm4`. Rótulo exibido na página:
`2º período` e `PM 2 · Projeto Mensal`.

Fora de um projeto assim estruturado, pule este passo (ou pergunte se o professor quer a
referência mesmo assim).

### 3.1 Extrair o material de origem

| Origem | Como ler |
|---|---|
| `.pptx` | `zipfile` + `xml.etree`: percorra `ppt/slides/slideN.xml` lendo `<a:t>`. Pegue também `<a:srgbClr val>` e `typeface` para **herdar a identidade visual do material** (paleta, fontes), e `ppt/media/` para o logotipo. |
| `.pdf` | `pip install pypdf`, `PdfReader(...).pages[i].extract_text()`. |
| `.docx` | `zipfile` + `word/document.xml`. |

Extraia a identidade visual real do material: cor de destaque, cor de fundo, cor do painel de
código, fontes de título e de corpo. O arquivo `assets/estilo.css` já vem com uma paleta que
funciona; troque os tokens do `:root` pelos do cliente.

### 3.2 Conferir se o conteúdo envelheceu

**Sempre faça isso quando o material tiver mais de um ano.** Apostilas erram e frameworks mudam.

1. Busque a versão atual na documentação oficial (`WebFetch` na página de introdução/migração).
2. Compare classe por classe o que o material ensina com o que existe hoje.
3. Corrija no conteúdo da aula e sinalize a diferença onde ela importa, num cartão `.cartao--erro`
   dentro da própria seção.

Na aula de Bootstrap isso achou: versão desatualizada (5.1.3 → 5.3.8), cinco classes
descontinuadas, marcação de componente alterada e **uma classe que a apostila inventou e nunca
existiu** (`form-input-check` em vez de `form-check-input`). Vale o esforço.

### 3.3 Mapear o conteúdo em seções

Uma seção por conceito, na ordem do material de origem. Entre 20 e 31 seções é o tamanho normal
de uma aula. Guarde a numeração dos capítulos do original nos selos (`01`, `02`…) para o aluno
achar o trecho correspondente na apostila.

### 3.4 Montar

Siga `references/design-system.md` para a anatomia de cada bloco e `assets/modelo-aula.html`
como esqueleto. Copie `assets/estilo.css`, `assets/demos.css` e `assets/aula.js` e ajuste.

### 3.5 Verificar

Obrigatório, e é onde aparecem os defeitos de verdade. Siga `references/qa-e-armadilhas.md`.

### 3.6 Entregar

README com estrutura, versões usadas e a convenção visual das demonstrações.

---

## 4. Regras que não se negociam

1. **Nada de comunicação com o professor na página.** A aula é projetada para os alunos. Sem
   "peça aos alunos que…", sem "neste momento, explique…", sem notas de condução. Instruções de
   uso do projeto vão no README, que não é projetado.

2. **Todo conceito tem código e resultado visível juntos.** Trecho de código em painel escuro +
   caixa de *live preview* com o resultado real daquele código rodando. Nunca uma captura de tela
   no lugar do resultado ao vivo.

3. **Bordas revelam a estrutura.** Em demonstrações de layout, contorne os elementos para que a
   organização fique explícita: contêiner/linha com tracejado na cor de destaque, filho/coluna com
   tracejado cinza. Use `outline` em vez de `border` para não deslocar o layout. Declare a
   convenção numa legenda logo no começo da página.

4. **Funciona offline.** Baixe qualquer framework ensinado para `vendor/` e aponte para lá. Ensine
   o CDN no código (é o que o aluno vai usar), mas rode local — a rede da sala de aula cai.

5. **Funciona por `file://`.** O professor vai dar duplo clique no arquivo. Teste nesse modo:
   iframes, fontes e `srcdoc` precisam carregar.

6. **Nenhuma linha de código pode ficar escondida.** `white-space: pre-wrap` nos blocos de código.
   Em projeção ninguém rola uma barra horizontal dentro de uma caixa.

7. **Atividade final em três partes** (ver `references/design-system.md`): obrigatória, desafio e
   investigação. O desafio existe para quebrar a solução preguiçosa.

8. **Período e PM na página** quando o projeto os define (§3.0): chips na capa, linha no rodapé,
   atributos no `<body>`. Material e aula ficam nas pastas do período e do PM correspondentes.

---

## 5. Regra estrutural mais importante

**Painel de código alto ao lado de preview baixo = área vazia enorme.** Foi o defeito mais
visível das duas aulas, e o único que o cliente reclamou.

Decida por seção, medindo:

| Situação | Layout |
|---|---|
| alturas parecidas (diferença < ~250px) | `.dupla` — código e preview lado a lado |
| código bem mais alto que o preview | `.pilha` — **preview em largura total em cima, código em largura total embaixo com `columns:2`** |

O código em duas colunas mantém a leitura contínua (desce a primeira coluna, segue na segunda),
corta a altura pela metade e não remove nenhuma linha. Nas seções que continuam lado a lado,
`.dupla > .preview { position: sticky; top: 84px }` faz o preview acompanhar a rolagem, então a
diferença residual nunca aparece como vazio.

Meça assim, no console, antes e depois:

```js
let vazio = 0;
document.querySelectorAll('.dupla').forEach(d => {
  const k = [...d.children]; if (k.length !== 2) return;
  const h = k.map(x => x.getBoundingClientRect().height);
  const l = k.map(x => x.getBoundingClientRect().left);
  if (l[0] === l[1]) return;              // empilhado: não há vazio lateral
  vazio += Math.abs(h[0] - h[1]);
});
vazio;   // some de ~9000px para ~1200px quando está certo
```

---

## 6. Material de apoio

| Arquivo | Conteúdo |
|---|---|
| `references/design-system.md` | tokens, anatomia de cada bloco, HTML pronto de seção, roteiro, legenda, referência rápida e atividade |
| `references/interatividade.md` | motor dos laboratórios, simuladores de largura, playground livre e realce de código |
| `references/qa-e-armadilhas.md` | fluxo de verificação com Chrome headless e o catálogo de erros que já apareceram |
| `assets/estilo.css` | sistema de design completo, pronto para copiar |
| `assets/demos.css` | marcação de demos, laboratórios, simuladores e playground |
| `assets/aula.js` | realce de código, navegação, motor de labs, simuladores e playground |
| `assets/modelo-aula.html` | esqueleto com um exemplo de cada tipo de bloco |
