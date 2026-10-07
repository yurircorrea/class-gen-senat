# Aula — CSS: layout com Flexbox

Página única (single page) da aula de Flexbox, para ser projetada e rolada durante a exposição.
Basta abrir `index.html` no navegador — não precisa de servidor, de build nem de internet.

**Curso e aula:** Desenvolvimento Web, Aula 1 · **Instrutor:** Yuri Reis Correa, Instrutor de Informática ·
**SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Exemplo de referência de qualidade do class-gen SEST SENAT. O curso e o número da aula nos chips da
capa são ilustrativos: mostram onde essas informações ficam numa aula de verdade.

## Estrutura

```
aula-flexbox/
├── index.html        conteúdo completo da aula, do problema histórico até a atividade
├── css/
│   ├── estilo.css    identidade visual (paleta, tipografia, seções, cartões, tabela)
│   └── demos.css     estilos das demonstrações ao vivo (contêineres, itens, receitas)
├── js/
│   └── aula.js       colorização dos blocos de código, barra de progresso e laboratório
├── fonts/
│   ├── roboto-latin.woff2   fonte dos títulos (Roboto), cópia local
│   └── OFL.txt              licença da fonte
└── img/
    ├── simbolo.svg                       meias-luas: barra e ícone da aba
    ├── logo-sest-senat-branco.png        capa e rodapé
    └── logo-sistema-transporte-branco.png  capa e rodapé
```

## Convenção visual das demonstrações

- **Borda tracejada azul** = o contêiner flex (o elemento pai).
- **Borda sólida azul-escura** = os flex items (os filhos diretos).
- Toda caixa marcada como *preview* mostra o resultado do código exibido ao lado.

## Seções

Capa · roteiro · 01 por que o Flexbox existe · 02 `display: flex` · 02 os dois eixos ·
03 `flex-direction` · 04 `justify-content` · 05 `align-items` · 06 centralizar ·
07 `gap` · 07 `flex-wrap` · 08 `flex-grow` · 08 `flex-basis`, `shrink` e `flex: 1` ·
09 `align-self` e `order` · 10 três receitas de layout · 11 erros comuns ·
laboratório interativo · referência rápida · atividade.

## Observações técnicas

- Identidade visual SEST SENAT (`material/designsystem.pdf`): azul `#00307C`, ciano `#5FE1FF`,
  azul-gelo `#EAF6FE`, azul-marinho `#002060`; contornos de estrutura em `#009EE2`; painel de código
  `#0A1A3A`. Títulos em Roboto (cópia local em `fonts/`, licença OFL), corpo em Calibri (Carlito
  como alternativa), nome do instrutor em Calibri negrito itálico.
- Capa no formato do slide de abertura institucional: meias-luas à direita e logotipos no canto.
- O laboratório interativo e a colorização de código são JavaScript puro, sem dependências.
