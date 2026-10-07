# Aula — Excel Básico: fórmulas e funções

Página única da aula de fórmulas e funções do Excel, para ser projetada e rolada durante a aula.
Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de internet.

**Curso e aula:** Excel Básico, Aula 3 · **Instrutor:** Yuri Reis Correa, Instrutor de Informática ·
**SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Exemplo de referência de qualidade do class-gen SEST SENAT para **cursos sem código**: todo conceito
aparece com o que se digita ou clica (painel escuro) ao lado de uma planilha que calcula de verdade.
O curso e o número da aula nos chips da capa são ilustrativos.

**Material de origem:** nenhum. Conteúdo escrito como referência para o Excel em português
(Microsoft 365). Atalhos usados, todos conferidos nas páginas de suporte da Microsoft em português e
em referências de atalhos do Excel: `Alt`+`=`
(AutoSoma), `F4` (alternar referências), `F2` (editar a célula), `Ctrl`+`D` (Preencher Abaixo),
`Ctrl`+`Shift`+`$` (Moeda), `Ctrl`+`Shift`+`%` (Porcentagem), `Ctrl`+`Shift`+`!` (Número).

## Seções

Capa · roteiro · 01 toda fórmula começa com = · 02 operadores e ordem das contas · 03 use o
endereço, não o número · 04 copiar fórmulas (referência relativa) · 05 referência absoluta ($ e F4) ·
06 funções SOMA, MÉDIA, MÁXIMO, MÍNIMO, CONT.NÚM · 07 AutoSoma passo a passo · 08 SE · 09 CONT.SE e
SOMASE · 10 formatos de número · 11 erros comuns · quiz · referência rápida · atividade.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01, 02, 06, 08, 11 | mini planilha (`data-planilha`) | clique numa célula: a fórmula aparece na barra e as células citadas ficam coloridas |
| 03 | duas planilhas editáveis lado a lado | troque o preço: o total com referência acompanha, o com número fixo não |
| 04 · Lab 1 | construtor `copiar` + planilha | arraste o controle: a fórmula de D2 é copiada para baixo e a saída lista cada cópia |
| 05 · Lab 2 | construtor `referencia` + planilha | F1, $F$1, F$1 e $F1 lado a lado: com F1 o desconto some sem mensagem de erro |
| 07 | tour (`data-tour`) sobre o Excel refeito em HTML | os quatro passos da AutoSoma, com o controle da vez piscando |
| 08 | planilha editável | troque uma nota: a média e a situação (SE) se refazem |
| 09 · Lab 3 | planilha editável + `.grafico` | troque categoria ou valor: SOMASE, CONT.SE e o gráfico acompanham |
| 10 · Lab 4 | construtor `formato` | Geral, Moeda, Porcentagem, Número: a aparência muda, o valor não |
| quiz | `data-quiz` | cinco perguntas com os erros que o aluno comete de verdade |

## Estrutura

```
aula-excel/
├── index.html        a aula inteira
├── css/
│   ├── estilo.css    identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css     planilha, laboratórios, tour, quiz, gráfico (cópia do asset)
├── js/
│   └── aula.js       motor do asset + construtores desta aula (copiar, referencia)
│                     + seção 10: gráfico que acompanha o resumo de gastos
├── fonts/            Roboto (títulos) em cópia local + licença OFL
└── img/              símbolo das meias-luas e logotipos SEST SENAT
```

## Convenção visual

- Painel escuro = o que se digita ou clica no Excel (fórmula, caminho de menus, atalho).
- Caixa branca = a planilha funcionando. Contorno verde = célula selecionada; contornos coloridos =
  as células que a fórmula usa (as cores de referência do Excel).
- Fórmulas em português, com `;` entre argumentos e vírgula decimal, como no Excel instalado no
  Brasil.

## Verificação

Conferida por `file://` em 1500, 1200 e 900 px: sem transbordo, sem erro de console, nenhuma seção
com vazio acima de 250 px entre painel e preview. Teste de interação: trocar o preço (03), copiar
até D5 (04), os quatro tipos de referência (05), trocar a categoria de um gasto e ver o gráfico
mudar (09), os quatro formatos (10), as cinco respostas do quiz e os quatro passos do tour. Os
únicos erros na página são os três demonstrados de propósito na seção 11.
