document.addEventListener("DOMContentLoaded", function() {
  // Selecionar elementos
  const gridContainer = document.getElementById('grid-container');
  const horizontalList = document.getElementById('horizontal-list');
  const verticalList = document.getElementById('vertical-list');
  const startGameBtn = document.getElementById('startGameBtn');
  const checkAnswersBtn = document.getElementById('checkAnswersBtn');
  const clearBtn = document.getElementById('clearBtn');
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

  // Dados do puzzle: 1 = célula jogável, 0 = célula bloqueada
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

  // Solução do puzzle (exemplo)
  // Para células bloqueadas, o valor pode ser ignorado ou vazio
  const solutionData = [
    ['C','A','T','','D','O','G','S','P','Y'],
    ['O','','B','I','R','D','','F','I','N'],
    ['W','E','L','','L','I','O','N','','P'],
    ['','P','A','R','K','S','','H','O','P'],
    ['D','O','','G','','B','A','T','S',''],
    ['H','E','N','R','A','T','E','','L','O'],
    ['M','','E','N','U',' ','P','E','A','R'],
    ['S','U','N','','S','E','T','','C','A'],
    ['T','O','','L','A','R','Y','','D','O'],
    ['R','O','S','E','S','','','','','']
  ];

  // Dicas de exemplo
  const horizontalClues = [
    "1. Animal que mia (3 letras)",
    "3. Animal que late (3 letras)",
    "5. Animal voador (4 letras)"
  ];
  const verticalClues = [
    "2. Fruta amarela (5 letras)",
    "4. Lugar com parques (3 letras)",
    "6. Flor vermelha (5 letras)"
  ];

  // Gera a grade do puzzle
  function generateGrid() {
    gridContainer.innerHTML = '';
    for (let row = 0; row < puzzleData.length; row++) {
      for (let col = 0; col < puzzleData[row].length; col++) {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.dataset.row = row;
        cellDiv.dataset.col = col;
        if (puzzleData[row][col] === 0) {
          cellDiv.classList.add('blocked');
          cellDiv.textContent = '';
        } else {
          const input = document.createElement('input');
          input.setAttribute('maxlength', '1');
          input.dataset.row = row;
          input.dataset.col = col;
          // Ao digitar, transforma a letra em maiúscula e move para a próxima célula
          input.addEventListener('input', function() {
            input.value = input.value.toUpperCase();
            moveToNextCell(row, col);
          });
          // Navegação com setas
          input.addEventListener('keydown', function(e) {
            handleArrowKeys(e, row, col);
          });
          cellDiv.appendChild(input);
        }
        gridContainer.appendChild(cellDiv);
      }
    }
  }

  // Função para mover para a próxima célula jogável
  function moveToNextCell(row, col) {
    let nextCol = col + 1;
    let nextRow = row;
    if (nextCol >= puzzleData[0].length) {
      nextCol = 0;
      nextRow = row + 1;
      if (nextRow >= puzzleData.length) return;
    }
    const nextInput = document.querySelector(`.cell input[data-row="${nextRow}"][data-col="${nextCol}"]`);
    if (nextInput) {
      nextInput.focus();
    } else {
      // Se a célula seguinte for bloqueada, procura a próxima célula jogável
      moveToNextCell(nextRow, nextCol);
    }
  }

  // Função para navegação com as teclas de seta
  function handleArrowKeys(e, row, col) {
    let targetRow = row;
    let targetCol = col;
    if (e.key === "ArrowRight") {
      targetCol++;
    } else if (e.key === "ArrowLeft") {
      targetCol--;
    } else if (e.key === "ArrowUp") {
      targetRow--;
    } else if (e.key === "ArrowDown") {
      targetRow++;
    } else {
      return;
    }
    e.preventDefault();
    if (targetRow < 0 || targetRow >= puzzleData.length || targetCol < 0 || targetCol >= puzzleData[0].length) return;
    const targetInput = document.querySelector(`.cell input[data-row="${targetRow}"][data-col="${targetCol}"]`);
    if (targetInput) {
      targetInput.focus();
    }
  }

  // Exibe as dicas
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

  // Verifica as respostas comparando com a solução
  function checkAnswers() {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(input => {
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      if (solutionData[row] && solutionData[row][col] && input.value !== solutionData[row][col]) {
        input.style.backgroundColor = '#ffcccc';
      } else {
        input.style.backgroundColor = '#ccffcc';
      }
    });
  }

  // Limpa todos os inputs e restaura o fundo
  function clearGrid() {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(input => {
      input.value = '';
      input.style.backgroundColor = '';
    });
  }

  // Eventos
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

  checkAnswersBtn.addEventListener('click', checkAnswers);
  clearBtn.addEventListener('click', clearGrid);

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



  