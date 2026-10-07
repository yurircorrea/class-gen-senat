# Verificação e armadilhas

Uma aula tem 20–31 seções e centenas de demonstrações. Olhar só o topo da página não encontra nada.
Este é o fluxo que achou defeito real nas duas aulas.

---

## 1. Fluxo de verificação

### 1.1 Servir a pasta

```bash
python -m http.server 8788 --directory <pasta-da-aula>
```

### 1.2 Medir no console (o que mais rende)

```js
// transbordo horizontal: fatal em projeção
document.documentElement.scrollWidth > document.documentElement.clientWidth

// área vazia entre código e preview (ver SKILL.md §5)
// erro de console
// laboratórios que não renderizaram
[...document.querySelectorAll('[data-lab] [data-palco]')].filter(x => !x.children.length)

// saídas de código vazias
[...document.querySelectorAll('[data-saida]')].filter(p => p.textContent.trim().length < 10)

// sobra dentro dos iframes
[...document.querySelectorAll('.simulador iframe')].map(f => ({
  src: f.getAttribute('src'),
  iframe: Math.round(f.getBoundingClientRect().height),
  conteudo: Math.round(f.contentDocument.body.getBoundingClientRect().height)
}))

// menu cortado
const m = document.querySelector('.barra-menu'); m.scrollWidth > m.clientWidth
```

### 1.3 Captura por seção com Chrome headless

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

### 1.4 Testar por `file://`

O professor vai dar duplo clique. Repita a captura com
`file:///C:/.../index.html` e confira iframes, fontes e playground.

### 1.5 Limpar

Remova o `<link>` do `_qa.css`, o arquivo e qualquer `.claude/launch.json` ou backup antes de
entregar. **Confira que o link saiu**: deixar `_qa.css` ligado esconde a aula inteira, e o sintoma
(página com uma seção só, tudo com altura 0) parece um bug gravíssimo em outro lugar.

---

## 2. Armadilhas já encontradas

### Colisão de nomes de classe

Quando a aula **ensina um framework CSS** e a própria página **usa** esse framework, os nomes
batem. `.container`, `.badge`, `.row`, `.card`, `.table`, `.small`, `.lead` são do framework.

Renomeie tudo o que é da aula: `.wrap` em vez de `.container`, `.selo` em vez de `.badge`,
`.tabela` em vez de `.table`. Carregue o CSS da aula **depois** do framework.

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

`↓` (U+2193) tem variante emoji e o Chrome a escolhe em alguns contextos: a seta sai laranja. Setas
decorativas: desenhe com `border` (triângulo CSS) em vez de caractere.

### `writing-mode:vertical-rl` gira o glifo

Rótulo vertical com seta junto gira a seta também. Separe: texto no elemento vertical, seta em um
elemento normal ao lado.

### Código cortado na horizontal

`white-space:pre` esconde o fim das linhas longas (URLs de CDN, hashes de `integrity`) atrás de uma
barra de rolagem que ninguém usa em projeção. Use `pre-wrap` + `overflow-wrap:anywhere`.

### Previsão de altura dentro de iframe

Ver `references/interatividade.md` §3: medir `documentElement` cria realimentação.

### Heredoc do shell e conteúdo grande

Escrever HTML/CSS extenso por heredoc (`cat > arquivo <<'EOF'`) falha de forma intermitente com
`unexpected EOF while looking for matching quote`. Para arquivos grandes use a ferramenta de
escrita de arquivo, ou escreva um script Python em disco e execute-o. Transformações pontuais em
arquivo existente: script Python com `str.replace` e `assert` de que o alvo foi encontrado.

---

## 3. Lista de conferência final

- [ ] `scrollWidth == clientWidth` (sem transbordo horizontal)
- [ ] zero erros no console
- [ ] todos os laboratórios renderizam e geram código
- [ ] todos os iframes carregam, com altura justa
- [ ] menu da barra sem itens cortados
- [ ] nenhuma área vazia maior que ~250px entre painéis
- [ ] abre por `file://` com tudo funcionando
- [ ] nenhum texto dirigido ao professor na página
- [ ] arquivos de QA removidos
- [ ] README com estrutura, versões e convenção visual
