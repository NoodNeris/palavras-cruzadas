document.addEventListener("DOMContentLoaded", function() {
  // Seleção de elementos
  const gridContainer = document.getElementById('grid-container');
  const horizontalList = document.getElementById('horizontal-list');
  const verticalList = document.getElementById('vertical-list');
  const startGameBtn = document.getElementById('startGameBtn');
  const instructionsBtn = document.getElementById('instructionsBtn');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('closeModal');

  // Animação do título usando anime.js
  anime({
    targets: '#title',
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: 1000,
    easing: 'easeOutExpo'
  });

  // Dados do puzzle (Exemplo simples 10x10)
  // 0 = célula bloqueada (não jogável), 1 = célula jogável
  const puzzleData = [
    [1,1,1,0,1,1,1,1,1,1],
    [1,0,1,1,1,0,1,0,1,1],
    [1,1,1,0,1,1,1,1,0,1],
    [0,1,1,1,1,1,0,1,1,1],
    [1,1,0,1,0,1,1,1,1,0],
    [1,1,1,1,1,1,1,0,1,1],
    [1,0,1,1,1,0,1,1,1,1],
    [1,1,1,0,1,1,1,1,1,0],
    [1,1,0,1,1,1,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1]
  ];

  // Exemplos de dicas (apenas ilustrativas)
  const horizontalClues = [
    "1. Palavra horizontal 1",
    "3. Palavra horizontal 2",
    "5. Palavra horizontal 3"
  ];

  const verticalClues = [
    "2. Palavra vertical 1",
    "4. Palavra vertical 2",
    "6. Palavra vertical 3"
  ];

  // Função para gerar a grade do puzzle
  function generateGrid() {
    gridContainer.innerHTML = ''; // Limpa a grade anterior
    for (let row = 0; row < puzzleData.length; row++) {
      for (let col = 0; col < puzzleData[row].length; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (puzzleData[row][col] === 0) {
          // Célula bloqueada
          cell.classList.add('blocked');
          cell.textContent = ''; // Você pode colocar um símbolo se preferir
          cell.contentEditable = false;
        } else {
          // Célula jogável (para inserir letras)
          cell.setAttribute('contenteditable', 'true');
          cell.addEventListener('click', function() {
            anime({
              targets: cell,
              scale: [1.2, 1],
              duration: 300,
              easing: 'easeOutElastic(1, .8)'
            });
          });
        }

        gridContainer.appendChild(cell);
      }
    }
  }

  // Função para exibir as dicas
  function displayClues() {
    horizontalList.innerHTML = '';
    verticalList.innerHTML = '';
    horizontalClues.forEach(clue => {
      const li = document.createElement('li');
      li.textContent = clue;
      horizontalList.appendChild(li);
    });
    verticalClues.forEach(clue => {
      const li = document.createElement('li');
      li.textContent = clue;
      verticalList.appendChild(li);
    });
  }

  // Evento para iniciar o jogo
  startGameBtn.addEventListener('click', function() {
    generateGrid();
    displayClues();
    anime({
      targets: '#grid-container',
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo'
    });
  });

  // Configura o modal de instruções
  instructionsBtn.addEventListener('click', function() {
    modal.style.display = 'block';
    anime({
      targets: '.modal-content',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutExpo'
    });
  });

  // Fecha o modal ao clicar no "x"
  closeModal.addEventListener('click', function() {
    modal.style.display = 'none';
  });

  // Fecha o modal se clicar fora dele
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});

  