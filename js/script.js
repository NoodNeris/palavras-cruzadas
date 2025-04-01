document.addEventListener("DOMContentLoaded", function() {
  // Elementos da página
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

  // Puzzle pré-definido: padrão 5x5
  // 1 = célula jogável, 0 = bloqueada
  const puzzleData = [
    [1, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 0]
  ];

  // Solução do puzzle – cada letra na célula jogável
  // Linhas com células bloqueadas terão strings vazias ("") nas posições bloqueadas.
  const solutionData = [
    ["G", "A", "T", "O", ""],       // Palavra horizontal 1: GATO
    ["", "", "A", "", ""],           // Letra isolada (parte da vertical)
    ["C", "A", "M", "A", "S"],       // Palavra horizontal 2: CAMAS
    ["", "", "A", "", ""],           // Letra isolada (vertical)
    ["L", "I", "R", "A", ""]         // Palavra horizontal 3: LIRA
  ];

  // Função para calcular os números (crossword numbering)
  function computeNumbers() {
    const numbers = [];
    let num = 1;
    for (let r = 0; r < puzzleData.length; r++) {
      numbers[r] = [];
      for (let c = 0; c < puzzleData[r].length; c++) {
        if (puzzleData[r][c] === 1) {
          // Se estiver na borda ou à esquerda/acima for bloqueada, marca número
          const leftBlocked = (c === 0) || (puzzleData[r][c - 1] === 0);
          const topBlocked = (r === 0) || (puzzleData[r - 1][c] === 0);
          if (leftBlocked || topBlocked) {
            numbers[r][c] = num;
            num++;
          } else {
            numbers[r][c] = "";
          }
        } else {
          numbers[r][c] = "";
        }
      }
    }
    return numbers;
  }

  const numberData = computeNumbers();

  // Clues definidas manualmente com base na numeração:
  // Horizontal: 1-across (GATO), 6-across (CAMAS), 11-across (LIRA)
  const horizontalClues = [
    "1. GATO – Animal que mia",
    "6. CAMAS – Móveis para dormir",
    "11. LIRA – Instrumento musical antigo"
  ];

  // Vertical: a única palavra vertical é a coluna 2: T, A, M, A, R = TAMAR
  const verticalClues = [
    "3. TAMAR – Nome próprio bíblico"
  ];

  // Gera a grade com inputs e números
  function generateGrid() {
    gridContainer.innerHTML = '';
    for (let r = 0; r < puzzleData.length; r++) {
      for (let c = 0; c < puzzleData[r].length; c++) {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.dataset.row = r;
        cellDiv.dataset.col = c;
        if (puzzleData[r][c] === 0) {
          cellDiv.classList.add('blocked');
          cellDiv.textContent = '';
        } else {
          // Se houver número para a célula, exibe-o
          if (numberData[r][c] !== "") {
            const numSpan = document.createElement('span');
            numSpan.classList.add('cell-number');
            numSpan.textContent = numberData[r][c];
            cellDiv.appendChild(numSpan);
          }
          // Cria o input para a letra
          const input = document.createElement('input');
          input.setAttribute('maxlength', '1');
          input.dataset.row = r;
          input.dataset.col = c;
          input.addEventListener('input', function() {
            input.value = input.value.toUpperCase();
            moveToNextCell(r, c);
          });
          input.addEventListener('keydown', function(e) {
            handleArrowKeys(e, r, c);
          });
          cellDiv.appendChild(input);
        }
        gridContainer.appendChild(cellDiv);
      }
    }
  }

  // Move o foco para a próxima célula jogável (varre linha a linha)
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
      moveToNextCell(nextRow, nextCol);
    }
  }

  // Navegação com as teclas de seta
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

  // Exibe as dicas nas áreas laterais
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
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      if (solutionData[r] && solutionData[r][c] && input.value !== solutionData[r][c]) {
        input.style.backgroundColor = '#ffcccc';
      } else {
        input.style.backgroundColor = '#ccffcc';
      }
    });
  }

  // Limpa os inputs e restaura o fundo padrão
  function clearGrid() {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(input => {
      input.value = '';
      input.style.backgroundColor = '';
    });
  }

  // Eventos de botões e modal
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




  