# Aula — Bootstrap 5

Página única (single page) da aula de Bootstrap, para ser projetada e rolada durante a exposição.
Basta abrir `index.html` no navegador — **não precisa de servidor, build nem internet**: o Bootstrap e
os ícones estão em `vendor/` como cópias locais.

Baseado em: Mariano, D. *Bootstrap 5 – Guia Rápido para Iniciantes*. 1ª ed. Alfahelix, Lagoa Santa, 2022 —
com o conteúdo conferido e atualizado para a versão atual do framework.

## Versões usadas

| Pacote | Versão | Observação |
|---|---|---|
| Bootstrap | **5.3.8** | a apostila de 2022 usa a 5.1.3 |
| Bootstrap Icons | **1.13.1** | a apostila usa a 1.8.1 |

Todo o conteúdo foi conferido contra a documentação atual: a aula já ensina `text-body-secondary`
no lugar de `text-muted`, `data-bs-theme="dark"` no lugar de `navbar-dark`, a nova marcação da barra
de progresso, `data-bs-root-margin` no scrollspy e `form-check-input` (a apostila traz
`form-input-check`, que nunca existiu no framework). Onde a diferença importa, um cartão de alerta
avisa na própria seção.

## Estrutura

```
aula-bootstrap/
├── index.html                 a aula inteira: 30 seções, 9 laboratórios, 8 simuladores
├── css/
│   ├── estilo.css             identidade visual da aula (carregado DEPOIS do Bootstrap)
│   └── demos.css              marcação das demonstrações, simuladores e laboratórios
├── js/
│   └── aula.js                realce de código, navegação, simuladores, laboratórios, playground
├── demos/                     páginas carregadas dentro dos simuladores de tela
│   ├── demo.css  demo.js      estilo e altura automática comuns
│   ├── breakpoints.html       qual ponto de quebra está ativo agora
│   ├── containers.html        os sete contêineres lado a lado
│   ├── grade.html             grade, col automática, col-auto, offset e grade aninhada
│   ├── posicao.html           fixed-top, fixed-bottom, position-absolute, translate-middle
│   ├── navbar.html            barra de navegação que colapsa em sanduíche
│   ├── menus.html             list-group, abas, offcanvas, breadcrumb e paginação
│   ├── scrollspy.html         menu que marca sozinho o trecho visível
│   └── pagina.html            página completa — o resultado esperado da atividade
├── img/
│   ├── logo.png               logotipo
│   └── foto-1..3.svg          imagens de exemplo (cards, carrossel, figuras)
└── vendor/
    ├── bootstrap/             bootstrap.min.css + bootstrap.bundle.min.js (5.3.8)
    └── bootstrap-icons/       bootstrap-icons.min.css + fontes (1.13.1)
```

## Laboratórios

| # | Assunto | Onde |
|---|---|---|
| 1 | Utilitários de cor (`bg-*`, `text-*`, `border-*`, `rounded-*`, sombra, opacidade) | seção Cores |
| 2 | Sistema de grade (colunas por ponto de quebra, calha, alinhamento) | seção Sistema de grade |
| 3 | Espaçamento (`m`/`p` + posição + nível) | seção Margem e preenchimento |
| 4 | Tipografia (`display-*`, `lead`, `fw-*`, alinhamento, cor) | seção Tipografia |
| 5 | Tabelas (listras, bordas, cor, condensada, responsiva) | seção Tabelas |
| 6 | Formulários (control, select, check, floating, input-group, estados) | seção Formulários |
| 7 | Botões (cor, contorno, tamanho, estado, ícone, largura total) | seção Botões |
| 8 | Componentes (alert, badge, card, progress, spinner, toast) | seção própria |
| 9 | Playground livre: escreva qualquer HTML e veja renderizar | seção Laboratório livre |

Todos mostram o código gerado junto com o resultado, para o aluno copiar e testar.

## Simuladores de tela

Oito quadros redimensionáveis (arraste a borda direita ou use os botões de largura) que mostram a
largura atual em pixels e o ponto de quebra ativo. São a forma de demonstrar responsividade sem
precisar redimensionar a janela do projetor.

## Convenção visual das demonstrações

- **Contorno tracejado verde** = uma linha `.row` ou um contêiner.
- **Contorno tracejado cinza** = uma coluna `.col-*`.
- Toda caixa marcada como *preview* é Bootstrap de verdade rodando na própria página.

## Observações técnicas

- O `estilo.css` é carregado **depois** do Bootstrap e não usa nenhum nome de classe do framework
  (o invólucro de largura é `.wrap`, não `.container`; o selo numerado é `.selo`, não `.badge`),
  então a identidade da aula e os componentes demonstrados não brigam entre si.
- A fonte de títulos (Barlow Semi Condensed) vem do Google Fonts, com Arial Narrow/Arial como
  alternativa — a página continua correta sem internet.
- Paleta herdada da aula de Flexbox: verde `#00E88F`, fundo `#FAFAFA`, painel de código `#0E1A15`
  com realce de sintaxe em ciano, roxo, amarelo e verde.
- A aula ensina o template com **CDN** (é o que o aluno deve usar); a própria página usa as cópias
  locais só para não depender da rede da sala.
