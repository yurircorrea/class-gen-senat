# Verificação e armadilhas

Uma aula tem de 10 a 31 seções e dezenas de demonstrações. Olhar só o topo da página não encontra
nada. Este é o fluxo que achou defeito real nas aulas já feitas.

---

## 1. Fluxo de verificação

### 1.1 Servir a pasta

```bash
python -m http.server 8788 --directory aulas/<curso>/<aula>
```

### 1.2 Medir no console (o que mais rende)

```js
// transbordo horizontal: fatal em projeção
document.documentElement.scrollWidth > document.documentElement.clientWidth

// área vazia entre painel e preview (ver SKILL.md §5)
// erro de console
// laboratórios que não renderizaram
[...document.querySelectorAll('[data-lab] [data-palco]')].filter(x => !x.children.length)

// saídas vazias
[...document.querySelectorAll('[data-saida]')].filter(p => p.textContent.trim().length < 5)

// planilhas: algum erro que a lição não pretendia mostrar?
[...document.querySelectorAll('.planilha-grade td.erro')].map(td => td.dataset.celula + ' ' + td.textContent)

// identidade: fonte local carregada e logotipos presentes
document.fonts.check('700 40px Roboto')
[...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute('src'))

// curso, aula, instrutor e unidade
Object.assign({}, document.body.dataset)
[...document.querySelectorAll('.capa-meta span')].map(s => s.textContent)

// sobra dentro dos iframes (aulas com simulador)
[...document.querySelectorAll('.simulador iframe')].map(f => ({
  src: f.getAttribute('src'),
  iframe: Math.round(f.getBoundingClientRect().height),
  conteudo: Math.round(f.contentDocument.body.getBoundingClientRect().height)
}))

// menu cortado
const m = document.querySelector('.barra-menu'); m.scrollWidth > m.clientWidth
```

### 1.3 Testar a interação

Clique como o instrutor vai clicar, não só olhe:

- planilha: selecione a célula da lição, troque um número na barra, confira o recálculo;
- laboratórios: passe por todas as opções de cada controle;
- quiz: responda certo e errado, confira explicação e placar;
- tour: avance até o fim e volte ao começo.

Com o Playwright (se estiver instalado), isso vira um script: `page.click`, `page.fill`,
`page.selectOption` e `page.textContent` na célula/saída esperada.

### 1.4 Captura por seção com Chrome headless

Screenshot da página inteira não serve: o arquivo fica gigante e ilegível. Isole uma seção por
captura com uma folha de estilo temporária.

```bash
# css/_qa.css  (link temporário no index.html, removido no fim)
.capa,.rodape,.secao{display:none!important}
#<id-da-secao>{display:block!important}
.barra{display:none}
```

```bash
chrome --headless=new --disable-gpu --hide-scrollbars \
       --window-size=1500,1500 --virtual-time-budget=4000 \
       --user-data-dir=<perfil-novo-a-cada-captura> \
       --screenshot=secao.png http://localhost:8788/index.html
```

**Use um perfil novo a cada captura.** Com perfil compartilhado o Chrome serve `_qa.css` do cache
e você fotografa a seção anterior sem perceber — aconteceu, e quase passou batido.

Com Playwright, `elemento.screenshot()` dispensa o `_qa.css`; a barra fixa pode aparecer por cima
de seções altas na captura (é a barra `sticky` no meio do recorte, não defeito da página).

Capture também a capa em 1500px, 1200px e 900px: as meias-luas encolhem e depois somem, e os
logotipos sobem para o topo.

### 1.5 Testar por `file://`

O instrutor vai dar duplo clique. Repita a verificação com `file:///C:/.../index.html` e confira
iframes, a fonte Roboto (vem de `fonts/`), os logotipos e o playground.

### 1.6 Limpar

Remova o `<link>` do `_qa.css`, o arquivo e qualquer `.claude/launch.json` ou backup antes de
entregar. **Confira que o link saiu**: deixar `_qa.css` ligado esconde a aula inteira, e o sintoma
(página com uma seção só, tudo com altura 0) parece um bug gravíssimo em outro lugar.

---

## 2. Armadilhas já encontradas

### Fórmula em português, com ponto e vírgula

O Excel instalado no Brasil usa `;` entre argumentos e vírgula decimal: `=SE(A1>=7;"Aprovado";"")`,
`=ARRED(2,345;2)`. Material copiado de site em inglês traz `=IF(A1>=7,"Pass","")` — na mini
planilha (e no Excel do aluno) isso dá `#NOME?`. Traduza função e separador.

### `>` e `<` dentro da fórmula no HTML

`<td>=SE(E2>=7;…)</td>` funciona na maioria dos casos, mas `<` abre tag. Escape sempre:
`=SE(E2&gt;=7;…)`, `=SE(A1&lt;0;…)`. O motor lê `textContent`, então recebe o caractere certo.

### Atalho ou menu de outra versão

Atalhos mudam com o teclado (ABNT2 x americano) e menus mudam entre Office 2016, 2019 e 365.
Confira na documentação da Microsoft em português antes de escrever; na dúvida, mostre o caminho
de menus e deixe o atalho de fora.

### Formato de porcentagem

O botão "Estilo de Porcentagem" (`Ctrl`+`Shift`+`5`) usa zero casas: 0,075 aparece como 8%. O
formato `pct` da planilha faz o mesmo; use `pct2` para duas casas.

### Logotipo no fundo errado

Logotipo branco sobre a meia-lua clara ou sobre a atividade (ciano) some. Os logotipos vão só na
capa (à direita do eixo das meias-luas, acima da meia-lua ciano) e no rodapé marinho.

### Ciano como linha ou texto sobre branco

`#5FE1FF` sobre branco tem contraste de 1,5:1: tracejado e texto somem no projetor. Para linha
use `--azul-linha` (`#009EE2`); para texto, `--azul`.

### Colisão de nomes de classe

Quando a aula **ensina um framework CSS** e a própria página **usa** esse framework, os nomes
batem. `.container`, `.badge`, `.row`, `.card`, `.table`, `.small`, `.lead` são do framework.

Renomeie tudo o que é da aula: `.wrap` em vez de `.container`, `.selo` em vez de `.badge`,
`.tabela` em vez de `.table`. Carregue o CSS da aula **depois** do framework. O aplicativo refeito
em HTML usa `.app` (e não `.janela`, que a aula de Flexbox usa como demonstração).

### Contêiner flex quebrando componentes

`.preview-corpo` como flex container transforma cada componente demonstrado em flex item e muda a
largura de botões, cards e alertas. Use bloco com `> * + * { margin-top }`.

### `min-width:auto` falseando a demonstração

Em Flexbox, item com `flex:1` não encolhe abaixo do conteúdo. Uma demo de "três colunas iguais"
aparece com colunas desiguais e contradiz a legenda. Adicione `min-width:0` onde a proporção é a
lição.

### Elemento que deveria colapsar e não colapsa

Demonstrar "o pai colapsa sem clearfix" não funciona se o pai for um flex item — flex items criam
contexto de formatação de bloco e contêm os floats. Envolva em um `<div>` neutro.

### Pontos de quebra respondem à janela, não ao contêiner

Dentro de um preview de 700px, `col-lg-4` ainda aplica se a *janela* tiver 1500px. Resultado:
três cards espremidos em meia largura. Para demonstrar responsividade de verdade, use o simulador
em iframe; para demonstrar o componente, escolha colunas que caibam na largura do preview.

### Emoji disfarçado de símbolo

Algumas setas e símbolos têm variante emoji e o Chrome a escolhe em alguns contextos: a seta sai
colorida. Setas decorativas (como as do `.caminho`): desenhe com `border` em vez de caractere. Em
botões refeitos, prefira texto ("A a Z") a setas.

### `writing-mode:vertical-rl` gira o glifo

Rótulo vertical com seta junto gira a seta também. Separe: texto no elemento vertical, seta em um
elemento normal ao lado.

### Código cortado na horizontal

`white-space:pre` esconde o fim das linhas longas (URLs de CDN, hashes de `integrity`) atrás de uma
barra de rolagem que ninguém usa em projeção. Use `pre-wrap` + `overflow-wrap:anywhere`.

### Previsão de altura dentro de iframe

Ver `references/interatividade.md` §8: medir `documentElement` cria realimentação.

### Método de protótipo usado antes de existir

No `aula.js`, funções declaradas (`function x(){}`) existem desde o início, mas métodos atribuídos
(`Planilha.prototype.montar = …`) só depois que a linha roda. Um laboratório que monta uma planilha
no palco precisa rodar **depois** da seção da planilha — por isso a ordem das seções do arquivo
(formatos e planilha antes dos laboratórios).

### Heredoc do shell e conteúdo grande

Escrever HTML/CSS extenso por heredoc (`cat > arquivo <<'EOF'`) falha de forma intermitente com
`unexpected EOF while looking for matching quote`. Para arquivos grandes use a ferramenta de
escrita de arquivo, ou escreva um script Python em disco e execute-o. Transformações pontuais em
arquivo existente: script Python com `str.replace` e `assert` de que o alvo foi encontrado.

---

## 3. Lista de conferência final

- [ ] `scrollWidth == clientWidth` (sem transbordo horizontal) em 1500, 1200 e 900px
- [ ] zero erros no console
- [ ] todos os laboratórios renderizam e geram saída; planilhas sem erro não intencional
- [ ] quiz e tour funcionam do primeiro ao último item
- [ ] todos os iframes carregam, com altura justa
- [ ] menu da barra sem itens cortados
- [ ] nenhuma área vazia maior que ~250px entre painéis
- [ ] abre por `file://` com tudo funcionando, Roboto e logotipos carregados
- [ ] chips de curso e aula na capa; instrutor, cargo e unidade na capa e no rodapé;
      `data-curso`, `data-aula`, `data-instrutor`, `data-unidade` no `<body>`
- [ ] nenhum texto dirigido ao instrutor na página
- [ ] nomes de menu, função e atalho conferidos na versão atual em português
- [ ] arquivos de QA removidos
- [ ] README com curso, aula, instrutor, unidade, material de origem, estrutura, versões e
      convenção visual
