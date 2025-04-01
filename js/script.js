document.addEventListener("DOMContentLoaded", function() {
  // Elementos principais
  const gridContainer = document.getElementById('grid-container');
  const horizontalList = document.getElementById('horizontal-list');
  const verticalList = document.getElementById('vertical-list');
  const startGameBtn = document.getElementById('startGameBtn');
  const instructionsBtn = document.getElementById('instructionsBtn');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('closeModal');

  // Animação do título
  anime({
    targets: '#title',
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: 1000,
    easing: 'easeOutExpo'
  });

  // Dados de exemplo para o puzzle
  // 1 = célula jogável, 0 = célula bloqueada
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

  // Exemplos de dicas
  const horizontalClues = [
    "1. Exemplo de palavra horizontal 1",
    "3. Exemplo de palavra horizontal 2",
    "5. Exemplo de palavra horizontal 3"
  ];
  const verticalClues = [
    "2. Exemplo de palavra vertical 1",
    "4. Exemplo de palavra vertical 2",
    "6. Exemplo de palavra vertical 3"
  ];

  // Função que gera a grade do puzzle
  function generateGrid() {
    gridContainer.innerHTML = '';
    for (let row = 0; row < puzzleData.length; row++) {
      for (let col = 0; col < puzzleData[row].length; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        if (puzzleData[row][col] === 0) {
          cell.classList.add('blocked');
          cell.contentEditable = false;
        } else {
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

  // Função que exibe as dicas
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

  // Eventos para o Modal de Instruções
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
  closeModal.addEventListener('click', function() {
    modal.style.display = 'none';
  });
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});


  