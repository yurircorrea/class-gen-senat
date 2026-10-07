# Interatividade: realce, laboratórios, simuladores e playground

Tudo em JavaScript puro, sem dependência. O código completo está em `assets/aula.js`.

---

## 1. Realce de código

Não carregue uma biblioteca de highlight: são ~30 linhas e o resultado é previsível.

**Estratégia:** linha a linha, não um analisador de verdade. Os trechos de uma aula são curtos
e bem-comportados.

```
para cada linha:
  1. comentário HTML  <!--  → tudo dali em diante é comentário
  2. comentário CSS/JS /*   → idem
  3. comentário JS //       → idem (só quando data-lang="js")
  4. linha começa com < ou contém </tag  → regras de HTML
  5. caso contrário                      → regras de CSS
```

- HTML: `<tag` e `</tag` na cor de tag; nome de atributo na cor de propriedade; valor entre aspas
  na cor de texto.
- CSS: seletor antes de `{`; propriedade antes de `:`; no valor, textos entre aspas numa cor,
  números e palavras-chave em outra.

**Detalhes que importam:**

- O conteúdo é lido de `pre.textContent`, então no HTML fonte **todo `<` precisa estar escapado
  como `&lt;`**. É o erro mais comum ao escrever a aula.
- Escape ao emitir, não antes: tokenize o texto cru e passe cada pedaço por `esc()` na hora de
  montar o `<span>`.
- A mesma função serve para colorir a saída dos laboratórios depois de cada atualização.

---

## 2. Laboratórios

Painel de controles + palco com o resultado + código gerado. O aluno mexe e vê a classe mudar.

**Motor declarativo.** O HTML descreve o laboratório; o JS só conhece o construtor:

```html
<div class="lab" data-lab="espaco">
  <div class="lab-controles">
    <h4>controles</h4>
    <div class="lab-campo">
      <label for="e-tipo">tipo</label>
      <select id="e-tipo" data-campo="tipo">
        <option value="p" selected>p — padding</option>
        <option value="m">m — margin</option>
      </select>
    </div>
    <div class="lab-campo">
      <label for="e-nivel">nível — <span data-eco="nivel">3</span></label>
      <input type="range" id="e-nivel" data-campo="nivel" min="0" max="5" value="3">
    </div>
    <label class="lab-check"><input type="checkbox" data-campo="borda"> com borda</label>
  </div>
  <div class="lab-saida">
    <div class="lab-palco" data-palco></div>
    <div class="lab-codigo"><pre data-saida></pre></div>
  </div>
</div>
```

```js
const construtores = {
  espaco(v) {                         // v = { tipo:'p', nivel:'3', borda:'false' }
    const cls = v.tipo + '-' + v.nivel;
    return {
      html:   `<div class="alvo-externo"><div class="alvo ${cls}">conteúdo</div></div>`,
      codigo: `<div class="${cls}">\n  ...\n</div>`
    };
  }
};

document.querySelectorAll('[data-lab]').forEach(lab => {
  const construtor = construtores[lab.dataset.lab];
  if (!construtor) return;
  const campos = [...lab.querySelectorAll('[data-campo]')];
  const palco  = lab.querySelector('[data-palco]');
  const saida  = lab.querySelector('[data-saida]');

  function atualizar() {
    const v = {};
    campos.forEach(c => {
      v[c.dataset.campo] = c.type === 'checkbox' ? String(c.checked) : c.value;
      const eco = lab.querySelector(`[data-eco="${c.dataset.campo}"]`);
      if (eco) eco.textContent = c.value;            // mostra o valor do range no rótulo
    });
    let r = construtor(v, lab);
    if (typeof r === 'string') r = { html: r, codigo: r };
    palco.innerHTML = r.html;
    if (saida) { saida.textContent = r.codigo; colorir(saida); }
  }

  campos.forEach(c => { c.addEventListener('input', atualizar);
                        c.addEventListener('change', atualizar); });
  atualizar();
});
```

**Regras dos construtores:**

- Devolva `{ html, codigo }` quando o que é renderizado difere do que deve ser mostrado (envoltórios
  de marcação não entram no código exibido).
- **Nunca emita atributo vazio.** `class=""` no código gerado parece bug. Monte o atributo inteiro
  condicionalmente: `const extra = v.x === 'true' ? ' class="y"' : '';`
- Um laboratório por família de classes. Nas duas aulas: cores, grade, espaçamento, tipografia,
  tabelas, formulários, botões, componentes.

---

## 3. Simulador de largura de tela

O recurso mais valioso de uma aula sobre responsividade: uma caixa redimensionável que mostra a
largura em pixels e o ponto de quebra ativo. Evita redimensionar a janela do projetor.

```html
<div class="simulador">
  <div class="simulador-barra">
    <span class="larg">—</span>
    <span class="bp">—</span>
    <button data-larg="375" type="button">375</button>
    <button data-larg="768" type="button">768</button>
    <button data-larg="max" type="button">cheio</button>
  </div>
  <div class="simulador-caixa">
    <iframe src="demos/grade.html" title="Demonstração" style="height:420px"></iframe>
  </div>
</div>
```

```css
.simulador-caixa{resize:horizontal;overflow:hidden;min-width:320px;max-width:100%;width:100%;
                 padding-bottom:16px}   /* padding dá área para a alça de redimensionar */
.simulador-caixa iframe{display:block;width:100%;border:0;background:#fff}
```

```js
function nomeBreakpoint(w){
  if (w < 576)  return 'xs  (< 576)';
  if (w < 768)  return 'sm  (≥ 576)';
  if (w < 992)  return 'md  (≥ 768)';
  if (w < 1200) return 'lg  (≥ 992)';
  if (w < 1400) return 'xl  (≥ 1200)';
  return 'xxl (≥ 1400)';
}
new ResizeObserver(medir).observe(caixa);   // atualiza o rótulo de largura
```

### Altura do iframe

A página do demo informa a própria altura por `postMessage`; o pai ajusta o quadro.

```js
// dentro do demo
function medir(){
  const alvo = document.getElementById('palco-fixo');       // demos de altura fixa
  const h = alvo ? alvo.getBoundingClientRect().height
                 : document.body.getBoundingClientRect().height;
  parent.postMessage({ tipo:'altura-demo', altura: Math.ceil(h) + 2 }, '*');
}
window.addEventListener('load', medir);
new ResizeObserver(medir).observe(document.body);
```

```js
// no pai
window.addEventListener('message', ev => {
  if (ev.data?.tipo !== 'altura-demo') return;
  document.querySelectorAll('.simulador iframe').forEach(f => {
    if (f.contentWindow === ev.source) f.style.height = Math.max(120, ev.data.altura) + 'px';
  });
});
```

**Armadilha resolvida:** medir `document.documentElement` cria realimentação — a altura do `<html>`
é no mínimo a do próprio quadro, que o pai acabou de definir, então o iframe só cresce e nunca
encolhe, deixando uma sobra branca permanente. Meça sempre o `<body>`.

Complete com `body > *:last-child{margin-bottom:0}` no CSS do demo, senão a margem do último
parágrafo vira sobra.

`postMessage` funciona por `file://` — é por isso que esta abordagem foi escolhida em vez de ler
`contentDocument`, que o Chrome bloqueia em origens opacas.

### Demos de posicionamento fixo

Para demonstrar `fixed-top`, `fixed-bottom`, `100vh`: dentro de um iframe, "a janela" é o próprio
quadro. Dê altura fixa ao `html,body` do demo e envolva tudo em `#palco-fixo` com
`position:relative;overflow:hidden`.

---

## 4. Playground livre

Editor + resultado ao vivo. É o laboratório que cobre tudo o que os outros não cobrem.

```js
const cssFw  = new URL('vendor/framework/framework.min.css', location.href).href;
const baseImg = new URL('img/', location.href).href;

function montarDocumento(corpo){
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="${baseImg}">
<link rel="stylesheet" href="${cssFw}">
<style>body{padding:4px}</style></head><body>
${corpo}
<script src="${jsFw}"><\/script></body></html>`;
}

editor.addEventListener('input', () => { clearTimeout(t); t = setTimeout(rodar, 500); });
function rodar(){ quadro.srcdoc = montarDocumento(editor.value); }
```

- **URLs absolutas** via `new URL(..., location.href)`: um documento `srcdoc` tem URL
  `about:srcdoc`, e caminho relativo fica imprevisível.
- `<base href>` apontando para `img/` deixa o aluno escrever `<img src="foto.svg">` sem prefixo.
- Carregue uma lista de exemplos em um `<select>`: grade, componentes, formulário, modo escuro.
- Testado e funcionando por `file://`: o iframe `srcdoc` herda a origem do pai e consegue ler os
  arquivos locais.

---

## 5. Navegação

- Barra fixa com menu de âncoras e barra de progresso de rolagem.
- **Máximo de 16 itens no menu** em 1500px de largura. Acima disso os primeiros somem na borda
  esquerda sem aviso, porque o menu tem `overflow-x:auto` e `justify-content:flex-end`. Rótulos
  curtos; a marca com `white-space:nowrap;flex:0 0 auto` para não quebrar em duas linhas.
- Marcação do item ativo comparando `getBoundingClientRect().top <= 140` de cada alvo.
- `html{scroll-behavior:smooth;scroll-padding-top:84px}` — o padding evita que o título fique
  escondido atrás da barra fixa.
