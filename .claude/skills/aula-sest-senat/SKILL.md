---
name: aula-sest-senat
description: Constrói aulas dos cursos livres de informática do SEST SENAT (Unidade B086 - Foz do Iguaçu/PR) como página única em HTML/CSS/JS para o instrutor projetar e rolar na tela, a partir de material de origem (PPTX, PDF, apostila). Cada conceito vira uma seção com "o que se faz" (fórmula, caminho de menus, atalho ou código) ao lado de uma demonstração ao vivo, mais laboratórios interativos (mini planilha que calcula, aplicativo reconstruído em HTML, passo a passo clicável, quiz) e uma atividade final em três partes, na identidade visual SEST SENAT. Organiza por curso e aula e atribui a aula ao instrutor. Use quando o pedido falar em aula, curso, slide, apostila, material didático, conteúdo para projetor, ou em transformar uma apresentação em página de ensino.
---

# Aula SEST SENAT em página única para projeção

Produz uma pasta de projeto estático que o instrutor abre no navegador e rola durante a aula
inteira. Não é um site institucional nem um slide deck: é um documento longo, de leitura
vertical, em que **cada conceito aparece com o que se faz e o resultado visível ao mesmo tempo**.

A instituição é o **SEST SENAT, Unidade B086 - Foz do Iguaçu/PR**, com cursos livres de
informática e tecnologia (Excel, Power BI, informática básica, internet e segurança, Word,
programação…). Muitos assuntos **não são código**: a aula mostra a fórmula, o caminho de menus ou
o atalho, e reproduz em HTML o programa funcionando.

Testado em duas aulas completas de código (Flexbox a partir de um PPTX; Bootstrap 5 a partir de
uma apostila em PDF de 108 páginas, em `exemplos/`) e com os blocos sem código do
`assets/modelo-aula.html` (mini planilha, faixa de opções refeita em HTML, tour, quiz).

---

## 1. Quando usar

- "transforme esta apresentação/apostila em uma aula"
- "faça um material de aula de Excel / Power BI / informática para eu projetar"
- "preciso de uma página com exemplos ao vivo de cada conceito"
- qualquer pedido que combine **material de origem + ensinar + projetar/rolar a tela**

Não use para: landing page, documentação de produto, portfólio, slide deck em PPTX.

---

## 2. O que entregar

```
aulas/<curso>/<aula>/
├── index.html          a aula inteira, uma página só (copie de assets/modelo-aula.html)
├── css/
│   ├── estilo.css      sistema de design SEST SENAT (copie de assets/estilo.css)
│   └── demos.css       demos, laboratórios, planilha, quiz, tour (copie de assets/demos.css)
├── js/
│   └── aula.js         realce, navegação, planilha, labs, quiz, tour (copie de assets/aula.js)
├── fonts/              roboto-latin.woff2 + OFL.txt (copie de assets/fonts/)
├── img/                simbolo.svg + logotipos brancos (copie de assets/img/) e imagens da aula
├── demos/              páginas carregadas dentro dos simuladores (quando houver)
├── vendor/             cópias locais de qualquer framework ensinado (quando houver)
└── README.md           curso, aula, instrutor, unidade, material de origem, estrutura, versões
```

Abre por duplo clique (`file://`), sem servidor, sem build e **sem internet** (a fonte Roboto é
local; Calibri vem do Windows, com Carlito como alternativa).

---

## 3. Processo

### 3.0 Situar a aula no curso (vem antes de tudo)

O projeto organiza material e aulas por **curso** e por **aula**:
`material/<curso>/<aula>/` e `aulas/<curso>/<aula>/`. Antes de qualquer outra coisa, a aula precisa
de quatro informações:

| Informação | Pasta / atributo | Exibido na página | Se faltar |
|---|---|---|---|
| curso | `excel-basico` | "Excel Básico" (chip da capa) | pergunte |
| aula | `aula1`, `aula2`… | "Aula 1" (chip da capa) | pergunte |
| instrutor | `data-instrutor` | nome na capa e no rodapé | pergunte |
| cargo | — | "Instrutor de Informática" | pergunte junto com o nome |
| unidade | `data-unidade="B086"` | "Unidade B086 - Foz do Iguaçu/PR" | fixa nesta instância |
| e-mail | — | linha opcional da assinatura | só se for informado |

1. Use o que o pedido já disser ("curso de Excel Básico, aula 3, instrutor Yuri Reis Correa").
2. O que faltar, **pergunte numa única rodada**, oferecendo como opções os cursos que já existem
   em `material/` e `aulas/` e, se o curso já tem aulas, o instrutor que aparece nelas
   (`data-instrutor` do `index.html` ou o `README.md`). Não deduza o curso pelo assunto.
3. **Cargo do instrutor:** use exatamente a forma que o pedido usar ("instrutor", "instrutora",
   "Instrutor de Informática"). Se o pedido não disser, pergunte junto com o nome. Não deduza pelo
   nome da pessoa.
4. Nomes de pasta: curso em minúsculas, sem acento, com hífen (`excel-basico`, `power-bi`,
   `informatica-basica`); aula como `aula` + número, sem zero à esquerda (`aula1`, `aula12`). O
   rótulo exibido do curso é o nome com acentos que o pedido usar ("Excel Básico"); confirme na
   mesma pergunta quando o curso for novo.
5. Guarde o material em `material/<curso>/<aula>/` (vários materiais da mesma aula ficam juntos).
   Material que serve ao curso inteiro (uma apostila usada em várias aulas) fica em
   `material/<curso>/` e é citado no README de cada aula que o usar. Se o arquivo veio de outro
   lugar do disco, **copie** (não mova).
6. Crie a aula em `aulas/<curso>/<aula>/`, com os mesmos nomes de curso e aula de `material/`.
7. Registre tudo **dentro da página** (ver `references/design-system.md` §8): chips de curso e
   aula na capa, assinatura do instrutor com cargo e unidade, linha no rodapé e
   `data-curso`/`data-aula`/`data-instrutor`/`data-unidade` no `<body>`.

### 3.1 Extrair o material de origem

| Origem | Como ler |
|---|---|
| `.pptx` | `zipfile` + `xml.etree`: percorra `ppt/slides/slideN.xml` lendo `<a:t>`; `ppt/media/` para imagens. |
| `.pdf` | `pip install pypdf`, `PdfReader(...).pages[i].extract_text()`. |
| `.docx` | `zipfile` + `word/document.xml`. |
| `.xlsx` | `openpyxl` (com `data_only=False` para ver as fórmulas): vira dados de uma `.planilha`. |

**A identidade visual é sempre a do SEST SENAT**, não a do material: o PDF da Microsoft ou a
apostila de terceiros traz outra marca. Os tokens e logotipos já estão em `assets/` (origem:
`material/designsystem.pdf`; ver `references/design-system.md` §1 e §9).

### 3.2 Conferir se o conteúdo envelheceu

**Sempre faça isso quando o material tiver mais de um ano.** Apostilas erram, programas mudam de
menu e frameworks mudam de classe.

1. Busque a versão atual na documentação oficial (`WebFetch` no suporte da Microsoft, na
   documentação do Power BI, na página de migração do framework).
2. Compare item por item: nome do menu e da guia na versão em português, atalho, nome da função
   (`PROCV` x `PROCX`), classe, propriedade.
3. Corrija no conteúdo da aula e sinalize a diferença onde ela importa, num cartão `.cartao--erro`
   ("na versão 2016 este botão ficava em…") ou `.cartao--novo` (recurso novo).

Na aula de Bootstrap isso achou: versão desatualizada (5.1.3 → 5.3.8), cinco classes
descontinuadas, marcação de componente alterada e **uma classe que a apostila inventou e nunca
existiu** (`form-input-check` em vez de `form-check-input`). Vale o esforço.

### 3.3 Mapear o conteúdo em seções

Uma seção por conceito, na ordem do material de origem. Entre 20 e 31 seções é o tamanho normal
de uma aula de código; aulas de curso livre (uma noite de Excel, por exemplo) costumam ter de 10 a
20. Guarde a numeração dos capítulos do original nos selos (`01`, `02`…) para o aluno achar o
trecho correspondente na apostila.

### 3.4 Escolher a demonstração de cada conceito

O painel escuro mostra **o que se faz**; o preview mostra **o que acontece**, funcionando. Escolha
pelo tipo de conceito (detalhes em `references/interatividade.md`):

| O conceito é… | Painel escuro | Preview / laboratório |
|---|---|---|
| fórmula, função, cálculo | a fórmula (`data-lang="formula"`) | `.planilha` com `data-planilha`: calcula de verdade |
| formatação, configuração | caminho de menus (`.caminho`) + atalho (`<kbd>`) | laboratório com construtor: controles → resultado + caminho |
| "onde fica o botão" | caminho de menus | `.app` refeito em HTML com `.alvo-clique`, ou tour (`data-tour`) |
| sequência de passos | `.passos` | tour clicável sobre o `.app` |
| medida DAX, consulta | a medida (`data-lang="formula"`) | `.grafico` + construtor com segmentação (filtro) |
| conceito, regra, segurança | frase-regra ou exemplo de texto (`data-lang="texto"`) | quiz (`data-quiz`), comparativo `.par` certo/errado |
| layout, código web | código | demo ao vivo com bordas revelando a estrutura, simulador de tela |

### 3.5 Montar

Siga `references/design-system.md` para a anatomia de cada bloco e `assets/modelo-aula.html`
como esqueleto. Copie `assets/estilo.css`, `assets/demos.css`, `assets/aula.js`, `assets/fonts/` e
`assets/img/` e ajuste. Apague do `aula.js` e do `index.html` os blocos que a aula não usa.

### 3.6 Verificar

Obrigatório, e é onde aparecem os defeitos de verdade. Siga `references/qa-e-armadilhas.md`.

### 3.7 Entregar

README com curso, aula, instrutor, unidade, material de origem, estrutura, versões dos programas
ou frameworks e a convenção visual das demonstrações.

---

## 4. Regras que não se negociam

1. **Nada de comunicação com o instrutor na página.** A aula é projetada para os alunos. Sem
   "peça aos alunos que…", sem "neste momento, explique…", sem notas de condução. Instruções de
   uso vão no README, que não é projetado.

2. **Todo conceito tem o que se faz e o resultado visível juntos.** Fórmula, caminho de menus,
   atalho ou código no painel escuro + caixa de preview com o resultado **funcionando** (a
   planilha calcula, o botão do aplicativo refeito em HTML está no lugar certo, o código roda).
   **Nunca uma captura de tela** no lugar da demonstração: reconstrua a interface em HTML, só com
   o que interessa.

3. **Bordas revelam a estrutura.** Em demonstrações de layout, contorne os elementos para que a
   organização fique explícita: contêiner com tracejado azul (`--azul-linha`), filho com tracejado
   cinza. Use `outline` em vez de `border` para não deslocar o layout. Em planilhas, as células
   citadas pela fórmula ganham as cores de referência do Excel. Declare a convenção na legenda.

4. **Funciona offline.** Baixe qualquer framework ensinado para `vendor/` e aponte para lá; a
   fonte Roboto vai em `fonts/`. Ensine o CDN no código (é o que o aluno vai usar), mas rode local
   — a rede da sala de aula cai.

5. **Funciona por `file://`.** O instrutor vai dar duplo clique no arquivo. Teste nesse modo:
   iframes, fontes e `srcdoc` precisam carregar.

6. **Nenhuma linha escondida.** `white-space: pre-wrap` nos blocos de código e fórmula. Em
   projeção ninguém rola uma barra horizontal dentro de uma caixa.

7. **Atividade final em três partes** (ver `references/design-system.md` §7): obrigatória,
   desafio e investigação. O desafio existe para quebrar a solução preguiçosa.

8. **Curso, aula, instrutor e unidade na página** (§3.0): chips na capa, assinatura do
   instrutor, linha no rodapé, atributos no `<body>`. Material e aula ficam nas pastas do curso e
   da aula correspondentes.

9. **Identidade SEST SENAT intacta.** Cores, fontes e logotipos de `assets/`; logotipo branco
   sobre azul, nunca esticado, recolorido ou sobre a meia-lua clara (ver design-system.md §9).

10. **Termos como o aluno vê na tela.** Nomes de guia, botão, menu e função exatamente como na
    versão em português do programa ("Página Inicial", "AutoSoma", `PROCV`), com `;` separando
    argumentos e vírgula decimal nas fórmulas.

---

## 5. Regra estrutural mais importante

**Painel alto ao lado de preview baixo = área vazia enorme.** Foi o defeito mais visível das
primeiras aulas, e o único que o cliente reclamou.

Decida por seção, medindo:

| Situação | Layout |
|---|---|
| alturas parecidas (diferença < ~250px) | `.dupla` — painel e preview lado a lado |
| painel bem mais alto que o preview | `.pilha` — **preview em largura total em cima, painel em largura total embaixo com `columns:2`** |

O painel em duas colunas mantém a leitura contínua (desce a primeira coluna, segue na segunda),
corta a altura pela metade e não remove nenhuma linha. Nas seções que continuam lado a lado,
`.dupla > .preview { position: sticky; top: 84px }` faz o preview acompanhar a rolagem, então a
diferença residual nunca aparece como vazio. Com o painel **mais baixo** que o preview (uma
fórmula curta ao lado de uma planilha), complete o painel com o caminho de menus, o atalho ou
`.passos`, ou passe a planilha para a largura toda.

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
| `references/design-system.md` | tokens SEST SENAT, anatomia de cada bloco, capa, roteiro, legenda, referência rápida, atividade, curso/aula/instrutor na página, uso dos logotipos |
| `references/interatividade.md` | blocos sem código (planilha, caminho, atalhos, aplicativo refeito, tour, quiz, gráfico), laboratórios, simuladores de largura, playground e realce |
| `references/qa-e-armadilhas.md` | fluxo de verificação com Chrome headless e o catálogo de erros que já apareceram |
| `assets/estilo.css` | sistema de design completo, pronto para copiar |
| `assets/demos.css` | demos, laboratórios, planilha, quiz, tour, aplicativo, simuladores e playground |
| `assets/aula.js` | realce, navegação, formatos pt-BR, motor da planilha, labs, playground, quiz e tour |
| `assets/modelo-aula.html` | esqueleto com um exemplo funcionando de cada tipo de bloco |
| `assets/fonts/` | Roboto (títulos) em cópia local e a licença OFL |
| `assets/img/` | símbolo das meias-luas e logotipos SEST SENAT (branco e azul) |
