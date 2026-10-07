# Interatividade: demonstrações sem código, laboratórios, simuladores e playground

Tudo em JavaScript puro, sem dependência. O código completo está em `assets/aula.js` e os estilos
em `assets/demos.css`; `assets/modelo-aula.html` tem um exemplo funcionando de cada bloco.

Os cursos do SEST SENAT são de informática e tecnologia, e boa parte do conteúdo **não é código**:
fórmulas de planilha, onde fica cada botão, atalhos, configurações, conceitos de segurança. A regra
continua a mesma — o aluno vê **o que se faz** e **o que acontece**, ao vivo —, só muda o
instrumento.

---

## 1. Qual instrumento para qual curso

| Curso / assunto | Painel escuro ("o que se faz") | Demonstração / laboratório |
|---|---|---|
| Excel, Calc, Planilhas Google | fórmula (`data-lang="formula"`), caminho de menus, atalho | mini planilha que calcula (§4); construtor de formatos, classificação, filtro, formatação condicional (§5); `.grafico` |
| Power BI | medida DAX (`data-lang="formula"`), caminho no painel | construtor com segmentação: o filtro muda o `.grafico` e o cartão de total (§5); tabela agrupada |
| Word, PowerPoint, Writer | caminho de menus + atalho | `.app` com a faixa de opções refeita (§3); construtor que muda alinhamento, espaçamento, estilo de um parágrafo de verdade |
| Windows, arquivos, informática básica | caminho, `<kbd>` | tour clicável sobre o Explorador refeito em HTML (§7); construtor que monta o caminho `C:\Usuários\…` a partir das pastas escolhidas |
| Internet, e-mail, segurança digital | o texto suspeito, a URL (`data-lang="texto"`) | quiz "golpe ou legítimo?" (§6); construtor de força de senha; `.par` certo/errado |
| Hardware, redes, conceitos | a regra em uma frase | diagrama em HTML/CSS com bordas, quiz, galeria de minis |
| Programação, web | código | demo ao vivo, simulador de tela (§8), playground (§9) |

**Nunca captura de tela.** Uma imagem do Excel não responde ao clique, fica borrada no projetor e
envelhece com a próxima versão. Refaça em HTML só o pedaço da interface que interessa.

---

## 2. Realce do painel

Não carregue uma biblioteca de highlight: o realce é linha a linha, com `data-lang` no `<pre>`:

| `data-lang` | Para | Cores |
|---|---|---|
| `formula` | Excel em português e DAX | função em ciano, referência (`B2`, `A1:C9`, `Vendas[Valor]`) em azul-claro, texto em amarelo, número em lilás, `//` comentário |
| `texto` | URL, e-mail, caminho, qualquer coisa sem cor | nenhuma |
| `html`, `css`, `js` | código | tag/seletor, atributo/propriedade, valor, texto |
| (sem) | código misto | cada linha é tratada como HTML ou CSS |

- O conteúdo é lido de `pre.textContent`, então no HTML fonte **todo `<` e `>` precisa estar
  escapado** (`&lt;`, `&gt;`). Vale para fórmulas: `=SE(A1&gt;=7;…)`.
- Escape ao emitir, não antes: tokenize o texto cru e passe cada pedaço por `esc()` na hora de
  montar o `<span>`.
- A mesma função (`colorir`) recolore a saída dos laboratórios depois de cada atualização.

---

## 3. Blocos para assuntos sem código

### Teclas de atalho

```html
<p class="atalho">copiar: <kbd>Ctrl</kbd> + <kbd>C</kbd></p>
```

`kbd` vira tecla desenhada (no painel escuro também). Escreva o nome da tecla como está no teclado
brasileiro (`Ctrl`, `Shift`, `Alt`, `Enter`, `Tab`, `Esc`, `F4`).

### Caminho de menus

```html
<ol class="caminho">
  <li><span>Página Inicial</span></li>
  <li><span>Estilos</span></li>
  <li><span>Formatação Condicional</span></li>
</ol>
```

O último item fica destacado. A seta entre os itens é desenhada com borda (caractere de seta pode
virar emoji colorido). Nomes **exatamente** como na versão em português do programa.

### Passo a passo

```html
<ol class="passos">
  <li>Selecione o intervalo <code>A1:D10</code>.</li>
  <li>Clique em <b>Classificar e Filtrar</b>.</li>
</ol>
```

### Aplicativo refeito em HTML

```html
<div class="app">
  <div class="app-titulo"><b>Pasta1 - Excel</b><span class="app-botoes">— ▢ ✕</span></div>
  <div class="app-guias"><span>Arquivo</span><span class="ativa">Página Inicial</span><span>Inserir</span></div>
  <div class="app-faixa">
    <div class="app-grupo"><div><span class="app-btn">Colar</span></div><small>Área de Transferência</small></div>
    <div class="app-grupo"><div><span class="app-btn alvo-clique">Σ AutoSoma</span></div><small>Edição</small></div>
  </div>
  <div class="app-corpo">…</div>
</div>
```

- Só o necessário: três guias e dois grupos dizem mais que a faixa inteira.
- `.alvo-clique` faz o controle da vez pulsar em azul (para quem prefere sem animação, fica fixo).
- `.marcador` (círculo numerado, `position:absolute`) aponta pontos da tela: dê
  `position:relative` ao `.app` e `style="top:…;left:…"` ao marcador.
- O corpo pode conter uma `.planilha`, um parágrafo formatado, uma lista de arquivos.

### Gráfico de barras

```html
<div class="grafico">
  <div class="grafico-col" style="--v:.62"><b>R$ 6,2 mil</b><i></i></div>
  <div class="grafico-col grafico-col--destaque" style="--v:1"><b>R$ 10 mil</b><i></i></div>
</div>
<div class="grafico-rotulos"><span>Jan</span><span>Fev</span></div>
```

`--v` vai de 0 a 1 (proporção do maior valor). Um construtor (§5) recalcula `--v` quando o aluno
muda o filtro: a barra anima a altura sozinha.

---

## 4. Mini planilha

Uma planilha de verdade, pequena: o aluno clica numa célula, vê a fórmula na barra, troca um número
ou a fórmula e tudo recalcula; as células citadas ganham as cores de referência do Excel.

```html
<div class="planilha" data-planilha data-selecionar="D5">
  <table class="planilha-grade" data-formatos="texto,int,moeda,moeda">
    <tr><td class="titulo">Produto</td><td class="titulo">Qtd</td><td class="titulo">Preço</td><td class="titulo">Total</td></tr>
    <tr><td>Arroz 5 kg</td><td>2</td><td>27,90</td><td>=B2*C2</td></tr>
    <tr><td>Feijão 1 kg</td><td>3</td><td>8,49</td><td>=B3*C3</td></tr>
    <tr><td class="titulo">Total</td><td></td><td></td><td>=SOMA(D2:D3)</td></tr>
  </table>
</div>
```

Escreva a tabela **sem** cabeçalhos: o motor acrescenta as letras das colunas, os números das
linhas e a barra de fórmulas (caixa de nome + `fx` + entrada).

| Atributo | Efeito |
|---|---|
| `data-selecionar="D5"` | célula selecionada ao abrir (a fórmula da lição já aparece na barra) |
| `data-somente-leitura` | o aluno clica e vê as fórmulas, mas não edita (demonstração dentro de preview) |
| `data-formatos="texto,int,moeda"` | formato por coluna: `geral`, `texto`, `int`, `dec1`, `dec2`, `moeda`, `pct`, `pct2` |
| `<td data-formato="pct">` | formato de uma célula |
| `<td data-f="=A1&amp;B1">` | fórmula em atributo (alternativa ao texto da célula) |
| `<td class="titulo">` | cabeçalho da tabela de dados (negrito, fundo claro) |

**Valores:** número em formato brasileiro (`1.234,5`, `12%`), texto, ou fórmula começando com `=`.
`'123` guarda como texto, como no Excel. Número alinha à direita e texto à esquerda — o aluno vê o
"número armazenado como texto".

**Fórmulas:** em português, `;` entre argumentos, vírgula decimal; operadores `+ - * / ^ & %` e
comparações `= <> < > <= >=`, com a precedência do Excel (`-2^2` dá 4). Funções:

`SOMA MÉDIA MÁXIMO MÍNIMO CONT.NÚM CONT.VALORES CONTAR.VAZIO CONT.SE SOMASE MÉDIASE SE SEERRO E OU
NÃO ARRED INT ABS CONCAT CONCATENAR MAIÚSCULA MINÚSCULA ARRUMAR ESQUERDA DIREITA NÚM.CARACT PROCV`

(acentos opcionais: `MEDIA` também funciona). Critérios de `CONT.SE`/`SOMASE` aceitam `">=7"`,
`"<>Pago"` e curingas `"Ana*"`. `PROCV` faz correspondência exata (`FALSO`/`0`) e aproximada.

**Erros como no Excel:** `#NOME?` (função desconhecida ou fórmula em inglês, como `=SUM(…)`),
`#DIV/0!`, `#VALOR!`, `#N/D`, `#REF!`. Referência circular mostra 0, como o Excel.

**Limites:** sem datas, sem matrizes dinâmicas, sem `PROCX`, sem formatação condicional
automática. Para esses assuntos, use um construtor (§5) que monta a tabela já com o resultado.

Conferido com uma bateria de 35 fórmulas (somas, médias, `CONT.SE` com curinga, `PROCV` exato e
aproximado, `SEERRO`, concatenação, precedência, erros) contra o resultado que o Excel dá para
cada uma. Ao usar uma função pela primeira vez numa aula, confira o resultado na planilha.

---

## 5. Laboratórios (construtores)

Painel de controles + palco com o resultado + painel de saída. O aluno mexe e vê o resultado e o
"como se faz" mudarem juntos. A saída pode ser código, fórmula ou **o caminho de menus**.

**Motor declarativo.** O HTML descreve o laboratório; o JS só conhece o construtor:

```html
<div class="lab" data-lab="formato">
  <div class="lab-controles">
    <h4>controles</h4>
    <div class="lab-campo">
      <label for="f-formato">formato da coluna A</label>
      <select id="f-formato" data-campo="formato">
        <option value="geral" selected>Geral</option>
        <option value="moeda">Moeda</option>
      </select>
    </div>
    <div class="lab-campo">
      <label for="f-casas">casas decimais — <span data-eco="casas">2</span></label>
      <input type="range" id="f-casas" data-campo="casas" min="0" max="4" value="2">
    </div>
    <label class="lab-check"><input type="checkbox" data-campo="milhar"> separador de milhar</label>
  </div>
  <div class="lab-saida">
    <div class="lab-palco" data-palco></div>
    <div class="lab-codigo"><p class="lab-codigo-titulo">onde clicar</p><pre data-saida data-lang="texto"></pre></div>
  </div>
</div>
```

```js
var construtores = {
  formato: function (v) {             // v = { formato:'moeda', casas:'2', milhar:'false' }
    return {
      html:   '<div class="planilha">…tabela já formatada…</div>',
      codigo: "Página Inicial › Número › Moeda\natalho: Ctrl + Shift + 4"
    };
  }
};
```

O motor lê os controles, chama o construtor a cada mudança, põe `html` no palco e `codigo` na
saída (recolorida conforme o `data-lang` do `<pre>`). Se o palco contiver um `data-planilha`, ele
é ativado sozinho.

**Regras dos construtores:**

- Devolva `{ html, codigo }` quando o que é renderizado difere do que deve ser mostrado.
- **Nunca emita atributo vazio.** `class=""` no código gerado parece bug. Monte o atributo inteiro
  condicionalmente: `const extra = v.x === 'true' ? ' class="y"' : '';`
- Um laboratório por família de recursos. Nas aulas de código: cores, grade, espaçamento,
  tipografia, tabelas, formulários, botões, componentes. Em planilha: formatos, classificar,
  filtrar, formatação condicional, gráfico. Em Power BI: segmentação → gráfico + cartão.
- Use `formatar(valor, 'moeda')` (já está no `aula.js`) para números no padrão brasileiro.
- Atalhos e caminhos só depois de conferidos na versão atual do programa em português.

---

## 6. Quiz de verificação

```html
<div class="quiz" data-quiz>
  <p class="quiz-placar" data-placar></p>
  <div class="quiz-item" data-resposta="b">
    <p class="quiz-pergunta">Qual fórmula soma as células de A1 até A10?</p>
    <div class="quiz-opcoes">
      <button type="button" data-opcao="a">=SOMA(A1;A10)</button>
      <button type="button" data-opcao="b">=SOMA(A1:A10)</button>
    </div>
    <p class="quiz-explica">Os dois-pontos indicam um intervalo; o ponto e vírgula separa argumentos.</p>
  </div>
</div>
```

A turma responde em voz alta; um clique marca a escolha, mostra a certa em verde e revela a
explicação. Clicar em outra opção troca a resposta. O placar conta acertos. Bom para fechar um
bloco de conceitos (segurança, hardware, "qual função usar").

Os distratores precisam ser erros que o aluno comete de verdade (vírgula no lugar de dois-pontos,
link com domínio parecido), não opções absurdas.

---

## 7. Tour: passo a passo clicável

Sobre um `.app` refeito em HTML, cada controle da sequência ganha `data-passo` e `data-legenda`:

```html
<div class="tour" data-tour>
  <div class="tour-barra">
    <button type="button" data-tour-anterior>anterior</button>
    <span class="tour-contador" data-tour-contador></span>
    <button type="button" data-tour-proximo>próximo</button>
  </div>
  <p class="tour-legenda" data-tour-legenda></p>
  <div class="app">
    … <span class="app-btn" data-passo="1" data-legenda="1. Abra a guia Dados.">Dados</span> …
  </div>
</div>
```

O controle da vez pulsa (`.alvo-clique`) e a legenda mostra o que fazer. O instrutor avança no
ritmo da turma, sem trocar de janela para o programa real.

---

## 8. Simulador de largura de tela (aulas de web)

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
// dentro do demo (assets/demo-iframe.js → demos/demo.js)
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
parágrafo vira sobra. As páginas do demo não herdam os tokens da aula: use as cores em hexadecimal
(`#009EE2` para o contorno de estrutura).

`postMessage` funciona por `file://` — é por isso que esta abordagem foi escolhida em vez de ler
`contentDocument`, que o Chrome bloqueia em origens opacas.

### Demos de posicionamento fixo

Para demonstrar `fixed-top`, `fixed-bottom`, `100vh`: dentro de um iframe, "a janela" é o próprio
quadro. Dê altura fixa ao `html,body` do demo e envolva tudo em `#palco-fixo` com
`position:relative;overflow:hidden`.

---

## 9. Playground livre (aulas de código)

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

Em aula de planilha, o "playground" é a própria mini planilha editável (§4) em largura total.

---

## 10. Navegação

- Barra fixa (azul-gelo) com o símbolo, o assunto, o menu de âncoras e a barra de progresso.
- **Máximo de 16 itens no menu** em 1500px de largura. Acima disso os primeiros somem na borda
  esquerda sem aviso, porque o menu tem `overflow-x:auto` e `justify-content:flex-end`. Rótulos
  curtos; a marca com `white-space:nowrap;flex:0 0 auto` para não quebrar em duas linhas.
- Marcação do item ativo comparando `getBoundingClientRect().top <= 140` de cada alvo.
- `html{scroll-behavior:smooth;scroll-padding-top:84px}` — o padding evita que o título fique
  escondido atrás da barra fixa.
