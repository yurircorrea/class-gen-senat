/* Informa a altura desta página ao documento que a carregou em um <iframe>,
   para que o simulador de tela ajuste o quadro sem sobra e sem barra de rolagem.

   A medida sai do <body> (que tem só a altura do conteúdo) e não do
   <html>, que sempre ocupa pelo menos a altura do próprio quadro — usar o
   <html> faria a altura só crescer, nunca diminuir. */
(function () {
  "use strict";

  function medir() {
    var alvo = document.getElementById("palco-fixo");
    var h = alvo
      ? alvo.getBoundingClientRect().height
      : document.body.getBoundingClientRect().height;
    parent.postMessage({ tipo: "altura-demo", altura: Math.ceil(h) + 2 }, "*");
  }

  window.addEventListener("load", medir);
  window.addEventListener("resize", medir);
  if (window.ResizeObserver) new ResizeObserver(medir).observe(document.body);
  document.addEventListener("shown.bs.collapse", medir);
  document.addEventListener("hidden.bs.collapse", medir);
  setTimeout(medir, 300);
  setTimeout(medir, 1200);
})();
