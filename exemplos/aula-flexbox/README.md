# Aula — CSS: layout com Flexbox

Página única (single page) da aula de Flexbox, para ser projetada e rolada durante a exposição.
Basta abrir `index.html` no navegador — não precisa de servidor nem de build.

## Estrutura

```
aula-flexbox/
├── index.html        conteúdo completo da aula, do problema histórico até a atividade
├── css/
│   ├── estilo.css    identidade visual (paleta, tipografia, seções, cartões, tabela)
│   └── demos.css     estilos das demonstrações ao vivo (contêineres, itens, receitas)
├── js/
│   └── aula.js       colorização dos blocos de código, barra de progresso e laboratório
└── img/
    └── logo.png      logotipo usado na capa e no rodapé
```

## Convenção visual das demonstrações

- **Borda tracejada verde** = o contêiner flex (o elemento pai).
- **Borda sólida escura** = os flex items (os filhos diretos).
- Toda caixa marcada como *preview* mostra o resultado do código exibido ao lado.

## Seções

Capa · roteiro · 01 por que o Flexbox existe · 02 `display: flex` · 02 os dois eixos ·
03 `flex-direction` · 04 `justify-content` · 05 `align-items` · 06 centralizar ·
07 `gap` · 07 `flex-wrap` · 08 `flex-grow` · 08 `flex-basis`, `shrink` e `flex: 1` ·
09 `align-self` e `order` · 10 três receitas de layout · 11 erros comuns ·
laboratório interativo · referência rápida · atividade.

## Observações técnicas

- A fonte de títulos (Barlow Semi Condensed) vem do Google Fonts, com Arial Narrow/Arial
  como alternativa — a página continua correta sem internet.
- Paleta e tipografia reproduzem a apresentação original: verde `#00E88F`, fundo `#FAFAFA`,
  painel de código `#0E1A15` com realce de sintaxe em ciano, roxo, amarelo e verde.
- O laboratório interativo e a colorização de código são JavaScript puro, sem dependências.
