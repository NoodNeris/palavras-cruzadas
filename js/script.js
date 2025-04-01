document.addEventListener("DOMContentLoaded", function() {
    // Animação do título com anime.js
    anime({
      targets: '#title',
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo'
    });
  
    // Geração dinâmica da grade de palavras cruzadas
    const puzzle = document.getElementById('puzzle');
    const gridSize = 10; // Grade de 10x10
  
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        // Permite que a célula seja editável (para inserir letras)
        cell.setAttribute('contenteditable', 'true');
  
        // Animação ao clicar na célula
        cell.addEventListener('click', () => {
          anime({
            targets: cell,
            scale: [1.2, 1],
            duration: 300,
            easing: 'easeOutElastic(1, .8)'
          });
        });
  
        // Opcional: você pode definir células bloqueadas (preenchidas de preto) para simular os espaços não utilizados
        // Exemplo: se (row, col) estiver em uma lista de bloqueadas, aplique:
        // cell.style.background = '#333';
        // cell.setAttribute('contenteditable', 'false');
  
        puzzle.appendChild(cell);
      }
    }
  
    // Futuramente, você pode adicionar a lógica do jogo:
    // - Carregar um dicionário de palavras
    // - Posicionar palavras na grade
    // - Verificar respostas e fornecer dicas
  });
  