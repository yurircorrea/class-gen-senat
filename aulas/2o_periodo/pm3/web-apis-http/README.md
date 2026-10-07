# Aula — HTTP e Web APIs

**Período e PM:** 2º período · PM 3 (Projeto Mensal)
**Material de origem:** `material/2o_periodo/pm3/web-apis-http/`

- `Aula - Protocolo HTTP e Camadas de Aplicação.pptx.pdf` (parte 1, 31 slides)
- `Aula - Protocolo HTTP e Camadas de Aplicação - 2.pptx.pdf` (parte 2, 20 slides)
- `Curso Devops - Aula 06 - Introdução ao Desenvolvimento de Web APIs.pdf` (21 páginas)

Página única para projetar e rolar durante a aula: 24 seções numeradas, um laboratório livre, uma
referência rápida e a atividade final em três partes. Cada conceito tem o código (ou a mensagem HTTP)
ao lado de uma demonstração ao vivo.

## Os laboratórios usam a Internet

Diferente das outras aulas do projeto, **os laboratórios desta aula enviam requisições de verdade
para APIs públicas**. A aula é acessada pelos alunos pelo GitHub Pages, então a conexão faz parte do
uso normal. O texto, os diagramas e os exemplos de código funcionam sem Internet; só os botões
marcados com o selo **requisição real** precisam de conexão.

Sem conexão:

- uma **faixa amarela** aparece no topo da página enquanto o dispositivo estiver offline;
- cada laboratório confere `navigator.onLine` **antes** de enviar e mostra o aviso "Sem conexão com a
  Internet", sem disparar o pedido;
- se a conexão existe mas a resposta não chega (rede bloqueada, serviço fora do ar, CORS), o aviso é
  "Sem resposta de *host*"; se passar de 15 s, "não respondeu em 15 segundos";
- no laboratório livre, o `fetch` do aluno é envolvido para escrever o mesmo aviso no console.

A página continua abrindo por duplo clique (`file://`). Nesse modo só o quadro de cookies avisa que
não funciona, porque cookies precisam de um domínio.

## APIs públicas usadas

| API | Endereço | Onde | Observação |
|---|---|---|---|
| JSONPlaceholder | `https://jsonplaceholder.typicode.com` | seções 06, 16, 20, 21, 24, lab livre e atividade | CRUD de treino em `/users`. Responde como se gravasse, mas **não grava**: o POST devolve sempre o id 11. |
| httpbin | `https://httpbin.org` | seções 03, 04, 05, 08 a 13, 19, 23, 24 | Servidor de eco: `/anything`, `/status/{código}`, `/response-headers`, `/cache`, `/etag`, `/image`, `/bearer`, `/delay`, `/uuid`. |
| httpbingo | `https://httpbingo.org` | as mesmas do httpbin | Reserva do httpbin, com a mesma interface. Cada laboratório de eco tem um seletor para trocar; a escolha fica salva no navegador. |
| ViaCEP | `https://viacep.com.br/ws/{cep}/json/` | seção 22 e cliente HTTP | API brasileira real. CEP inexistente volta `200` com `"erro": "true"`. |
| Google Public DNS | `https://dns.google/resolve` | seção 15 e cliente HTTP | DNS sobre HTTPS, em JSON. |

Se uma dessas APIs mudar de endereço, os quatro endereços ficam no início de `js/aula.js`
(objeto `APIS`).

## Laboratórios

| Seção | O que o aluno faz |
|---|---|
| 03 Servidor | 5 pedidos de 1 s em fila e ao mesmo tempo: o servidor atende em paralelo |
| 04 URL | separa as partes de qualquer URL e envia caminho e consulta ao servidor de eco |
| 05 Documentos | documento dinâmico (`/uuid` novo a cada pedido) ao lado de um estático e um ativo |
| 06 HTTP | o primeiro pedido, com a mensagem enviada e a recebida lado a lado |
| 08 Métodos | GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS e TRACE (que o navegador bloqueia) |
| 09 Cabeçalhos de pedido | escreve os cabeçalhos e vê o que chegou ao servidor: seus, do navegador e da infraestrutura |
| 10 Cabeçalhos de resposta | pede cabeçalhos ao servidor e vê quais o JavaScript consegue ler (`Access-Control-Expose-Headers`) |
| 11 Status | um botão para cada código, de 200 a 503 |
| 12 Negociação | o mesmo GET com `Accept` diferente devolve PNG, JPEG, WebP ou SVG |
| 13 Condicional | `If-Modified-Since` e `If-None-Match` levando a `304 Not Modified` |
| 15 DNS | resolve um domínio em IP |
| 16 Versões | mede a versão do HTTP usada por cada servidor que a página contatou |
| 19 JSON | valida um JSON (aspas curvas, vírgula sobrando) e o envia como corpo de um POST |
| 20 Verbos | as seis caixas dos slides (start line, headers, body) preenchidas com uma troca real |
| 21 CRUD | a tabela "juntando as peças" com uma coluna que testa cada verbo |
| 22 APIs | consulta de CEP no ViaCEP |
| 23 REST | `/bearer` com e sem `Authorization` (sem estado, 401) |
| 24 Cliente HTTP | um "Postman" com 18 exemplos, código `fetch` e `curl` gerados |
| Lab livre | editor de JavaScript com `await` e console; 8 exemplos |
| Atividade | a miniaplicação de resultado esperado, fazendo o CRUD de verdade |

Os diagramas passo a passo (Web, cookies, FTP e e-mail) e o quadro de `document.cookie` não usam rede.
O quadro de cookies não usa uma API pública de propósito: cookies de outro site são cookies de
terceiros e os navegadores os bloqueiam; a seção explica isso aos alunos.

## O que foi corrigido em relação ao material

**A página não cita o material de origem** (slides e PDFs), porque ele não é distribuído aos alunos.
Na aula, cada ponto abaixo aparece num cartão vermelho como armadilha ou como "o que mudou", escrito
para se sustentar sozinho. Ao editar a página, mantenha essa regra: nada de "no slide" ou "o material
diz" no conteúdo. A única exceção é a linha discreta de créditos aos slides no rodapé
(`.rodape-creditos`), que fica, inclusive porque a licença CC BY-NC-SA pede o crédito.

- **Host** (tabela de cabeçalhos de pedido): o material diz que ele traz "o host e o número de porta
  do cliente"; traz os do **servidor de destino**.
- **Exemplo de GET de imagem**: `imagem/gif` → `image/gif`; `Content-encoding: MIME-version 1.0` não
  existe (`Content-Encoding` é compressão, `MIME-Version` é de e-mail); data sem hífens.
- **Pedido condicional**: datas no formato errado ("Thu, Sept 04 00:00:00 GMT", sem ano).
- **Slides de verbos**: JSON com aspas curvas (inválido); POST com JSON sem `Content-Type`;
  `Location` apontando para o id 2 com o corpo dizendo 3; "201 CREATED" → `201 Created`; linha
  inicial sem versão e na forma de proxy; `Postman-Token` não é cabeçalho do HTTP.
- **Tabela de métodos**: falta o PATCH; TRACE é bloqueado; CONNECT é o túnel dos proxies.
- **Cookies**: "o conteúdo do cookie nunca é lido pelo navegador" não vale mais (`document.cookie`,
  F12); boas práticas de guardar só o identificador de sessão (LGPD).
- **REST**: o slide de texto lista 5 restrições; Fielding define 6 (a sexta, código sob demanda, é
  opcional, como mostra o slide seguinte).
- **Atualizações**: HTTPS e porta 443 como padrão; consulta e fragmento na URL; HTTP/2 e HTTP/3;
  navegadores e servidores atuais (sem Internet Explorer, Netscape e applets Java); FTP removido dos
  navegadores em 2021, SFTP e FTPS; códigos de status além de 200, 400 e 404.

O roteiro do PDF de Web APIs cita Spring Boot e Swagger UI, mas o arquivo termina no slide 20 (REST).
Esses dois assuntos não entraram como seções; o Swagger UI aparece na seção 24 entre as ferramentas
de teste.

## Estrutura

```
web-apis-http/
├── index.html      a aula inteira
├── css/
│   ├── estilo.css  identidade visual (paleta Descomplica + UniAmérica, a mesma do PM 2)
│   └── demos.css   laboratórios, mensagens HTTP, avisos, diagramas de sequência
├── js/
│   └── aula.js     realce de código (HTML, JS, HTTP, JSON, curl), navegação,
│                   motor de requisições com avisos de conexão, laboratórios, playground
├── img/
│   └── logo.png
└── README.md
```

## Convenção visual

- Mensagens HTTP em painel escuro. **Em cinza e itálico**, o que o navegador acrescenta sozinho
  (`User-Agent`, `Origin`, `Accept: */*`, `Content-Length`).
- Contornos tracejados na anatomia das mensagens: verde = linha inicial, cinza = cabeçalhos,
  amarelo = linha em branco, roxo = corpo.
- Códigos de status por cor: 2xx verde, 3xx azul, 4xx laranja, 5xx vermelho. Métodos também têm
  cor fixa (GET verde, POST laranja, PUT azul, PATCH roxo, DELETE vermelho).
- Abaixo de cada resposta, uma nota avisa quando o navegador fez um `OPTIONS` antes (preflight do CORS).

## Dicas de uso

- Abra o F12 na aba **Rede** durante a aula: todo envio aparece lá com todos os cabeçalhos,
  inclusive os que o JavaScript não consegue ler. A aula chama atenção para isso em várias seções.
- O console do navegador mostra "Failed to load resource" nos pedidos com status 4xx e 5xx. É o
  comportamento normal do navegador, e não um erro da aula.
- A assinatura da capa não tem nome de professor. Para incluir, edite `.assinatura` em `index.html`.

## Atribuição

Baseada em: Gomes, D. L.; Alessio, G. C. *Protocolo HTTP e Camadas de Aplicação*, partes 1 e 2
(UniAmérica, 2025), e Cruz, G. J. A. *Introdução ao Desenvolvimento de Web APIs* (Fundamentos de
DevOps, Centro Universitário Senac, 2025), licenciado sob
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). As partes desta aula
adaptadas desse último material seguem a mesma licença. As tabelas dos slides de HTTP vêm de livros
de redes (Forouzan; Comer) e foram resumidas com outras palavras, sem reprodução das figuras.

## Verificação feita

- Chromium headless a 1500 px, 1920 px e 390 px: sem transbordo horizontal, sem erros de script,
  menu sem itens cortados, nenhuma área vazia acima de 250 px entre código e demonstração.
- Todos os 36 botões de requisição, os 18 exemplos do cliente HTTP, o laboratório livre e a
  miniaplicação da atividade exercitados contra um servidor local que imita as APIs acima (com
  CORS e preflight). O ambiente onde a aula foi gerada não alcança os domínios públicos, então
  **vale uma passada rápida nos laboratórios com Internet antes da primeira aula**.
- Modo sem conexão simulado: faixa no topo e aviso em cada laboratório, sem nenhum pedido enviado.
- Abertura por `file://`.
