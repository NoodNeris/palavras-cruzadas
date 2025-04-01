document.addEventListener("DOMContentLoaded", function() {
  // Seleção de elementos
  const gridContainer = document.getElementById('grid-container');
  const horizontalList = document.getElementById('horizontal-list');
  const verticalList = document.getElementById('vertical-list');
  const startGameBtn = document.getElementById('startGameBtn');
  const checkAnswersBtn = document.getElementById('checkAnswersBtn');
  const clearBtn = document.getElementById('clearBtn');
  const instructionsBtn = document.getElementById('instructionsBtn');
  const puzzleSelect = document.getElementById('puzzleSelect');
  const timerDisplay = document.getElementById('timer');
  const messageDiv = document.getElementById('message');
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

  // Array de puzzles – exemplo com um puzzle 5x5
  const puzzles = [
    {
      id: 0,
      name: "Puzzle Diário",
      // 1 = célula jogável, 0 = bloqueada
      puzzleData: [
        [1, 1, 1, 1, 0],  // Linha 0: palavra horizontal (4 letras)
        [0, 0, 1, 0, 0],  // Linha 1: célula ativa (parte vertical)
        [1, 1, 1, 1, 1],  // Linha 2: palavra horizontal (5 letras)
        [0, 0, 1, 0, 0],  // Linha 3: célula ativa (parte vertical)
        [1, 1, 1, 1, 0]   // Linha 4: palavra horizontal (4 letras)
      ],
      // Solução do puzzle
      solutionData: [
        ["G", "A", "T", "O", ""],
        ["", "", "A", "", ""],
        ["C", "A", "M", "A", "S"],
        ["", "", "A", "", ""],
        ["L", "I", "R", "A", ""]
      ],
      // Dicas sem revelar as respostas
      horizontalClues: [
        "1. Animal que mia",             
        "6. Móveis para dormir",           
        "11. Instrumento musical antigo"   
      ],
      verticalClues: [
        "3. Nome próprio bíblico"         
      ]
    }
  ];

  let currentPuzzle = null;
  let timerInterval = null;
  let startTime = null;

  // Computa a numeração tradicional
  function computeNumbers(puzzleData) {
    const numbers = [];
    let num = 1;
    for (let r = 0; r < puzzleData.length; r++) {
      numbers[r] = [];
      for (let c = 0; c < puzzleData[r].length; c++) {
        if (puzzleData[r][c] === 1) {
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

  // Gera o grid, insere inputs e exibe os números; carrega progresso salvo
  function generateGrid() {
    gridContainer.innerHTML = '';
    const numbers = computeNumbers(currentPuzzle.puzzleData);
    for (let r = 0; r < currentPuzzle.puzzleData.length; r++) {
      for (let c = 0; c < currentPuzzle.puzzleData[r].length; c++) {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.dataset.row = r;
        cellDiv.dataset.col = c;
        if (currentPuzzle.puzzleData[r][c] === 0) {
          cellDiv.classList.add('blocked');
          cellDiv.textContent = '';
        } else {
          if (numbers[r][c] !== "") {
            const numSpan = document.createElement('span');
            numSpan.classList.add('cell-number');
            numSpan.textContent = numbers[r][c];
            cellDiv.appendChild(numSpan);
          }
          const input = document.createElement('input');
          input.setAttribute('maxlength', '1');
          input.dataset.row = r;
          input.dataset.col = c;
          input.addEventListener('input', function() {
            input.value = input.value.toUpperCase();
            saveProgress();
            autoAdvance(r, c);
            checkHorizontalWord(r);
            checkVerticalWords();
            checkCompletion();
          });
          input.addEventListener('keydown', function(e) {
            if (e.key === "Backspace" && input.value === "") {
              autoRetreat(r, c);
              e.preventDefault();
            } else {
              handleArrowKeys(e, r, c);
            }
          });
          cellDiv.appendChild(input);
        }
        gridContainer.appendChild(cellDiv);
      }
    }
    loadProgress();
  }

  // Auto-avança para a próxima célula da mesma palavra (horizontal)
  function autoAdvance(row, col) {
    if (col + 1 < currentPuzzle.puzzleData[row].length && currentPuzzle.puzzleData[row][col + 1] === 1) {
      const nextInput = document.querySelector(`.cell input[data-row="${row}"][data-col="${col + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  }

  // Auto-retreat: se pressionar Backspace em célula vazia, volta para a célula anterior da mesma palavra
  function autoRetreat(row, col) {
    if (col - 1 >= 0 && currentPuzzle.puzzleData[row][col - 1] === 1) {
      const prevInput = document.querySelector(`.cell input[data-row="${row}"][data-col="${col - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
      }
    }
  }

  function handleArrowKeys(e, row, col) {
    let targetRow = row, targetCol = col;
    if (e.key === "ArrowRight") targetCol++;
    else if (e.key === "ArrowLeft") targetCol--;
    else if (e.key === "ArrowUp") targetRow--;
    else if (e.key === "ArrowDown") targetRow++;
    else return;
    e.preventDefault();
    if (targetRow < 0 || targetRow >= currentPuzzle.puzzleData.length ||
        targetCol < 0 || targetCol >= currentPuzzle.puzzleData[0].length) return;
    const targetInput = document.querySelector(`.cell input[data-row="${targetRow}"][data-col="${targetCol}"]`);
    if (targetInput) targetInput.focus();
  }

  // Verifica palavras horizontais na linha
  function checkHorizontalWord(row) {
    let cells = [];
    for (let c = 0; c < currentPuzzle.puzzleData[row].length; c++) {
      if (currentPuzzle.puzzleData[row][c] === 1) {
        cells.push({row, col: c});
      } else {
        if (cells.length > 0) {
          verifyHorizontalBlock(cells);
          cells = [];
        }
      }
    }
    if (cells.length > 0) verifyHorizontalBlock(cells);
  }

  function verifyHorizontalBlock(cells) {
    let complete = true;
    for (const {row, col} of cells) {
      const input = document.querySelector(`.cell input[data-row="${row}"][data-col="${col}"]`);
      if (!input || input.value === "" || input.value !== currentPuzzle.solutionData[row][col]) {
        complete = false;
        break;
      }
    }
    if (complete && cells.length > 1) {
      cells.forEach(({row, col}) => {
        const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cellDiv) cellDiv.classList.add('completed');
      });
      showMessage("Palavra horizontal completa!");
      setTimeout(clearMessage, 2000);
    }
  }

  // Verifica palavras verticais para cada coluna
  function checkVerticalWords() {
    const cols = currentPuzzle.puzzleData[0].length;
    for (let c = 0; c < cols; c++) {
      let cells = [];
      for (let r = 0; r < currentPuzzle.puzzleData.length; r++) {
        if (currentPuzzle.puzzleData[r][c] === 1) {
          cells.push({row: r, col: c});
        } else {
          if (cells.length > 0) {
            verifyVerticalBlock(cells);
            cells = [];
          }
        }
      }
      if (cells.length > 0) verifyVerticalBlock(cells);
    }
  }

  function verifyVerticalBlock(cells) {
    let complete = true;
    for (const {row, col} of cells) {
      const input = document.querySelector(`.cell input[data-row="${row}"][data-col="${col}"]`);
      if (!input || input.value === "" || input.value !== currentPuzzle.solutionData[row][col]) {
        complete = false;
        break;
      }
    }
    if (complete && cells.length > 1) {
      cells.forEach(({row, col}) => {
        const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cellDiv) cellDiv.classList.add('completed');
      });
      showMessage("Palavra vertical completa!");
      setTimeout(clearMessage, 2000);
    }
  }

  function checkCompletion() {
    const inputs = document.querySelectorAll('.cell input');
    let allCorrect = true;
    inputs.forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      if (input.value !== currentPuzzle.solutionData[r][c]) {
        allCorrect = false;
      }
    });
    if (allCorrect && inputs.length > 0) {
      showMessage("Parabéns, puzzle completo!");
      clearInterval(timerInterval);
    }
  }

  function showMessage(msg) {
    messageDiv.textContent = msg;
  }

  function clearMessage() {
    messageDiv.textContent = "";
  }

  function displayClues() {
    horizontalList.innerHTML = '';
    verticalList.innerHTML = '';
    currentPuzzle.horizontalClues.forEach(clue => {
      const li = document.createElement('li');
      li.textContent = clue;
      horizontalList.appendChild(li);
    });
    currentPuzzle.verticalClues.forEach(clue => {
      const li = document.createElement('li');
      li.textContent = clue;
      verticalList.appendChild(li);
    });
  }

  function startTimer() {
    startTime = new Date();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((new Date() - startTime) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  function saveProgress() {
    const inputs = document.querySelectorAll('.cell input');
    const progress = {};
    inputs.forEach(input => {
      const key = `r${input.dataset.row}c${input.dataset.col}`;
      progress[key] = input.value;
    });
    localStorage.setItem(`puzzle-${currentPuzzle.id}-progress`, JSON.stringify(progress));
  }

  function loadProgress() {
    const saved = localStorage.getItem(`puzzle-${currentPuzzle.id}-progress`);
    if (saved) {
      const progress = JSON.parse(saved);
      for (let key in progress) {
        const matches = key.match(/r(\d+)c(\d+)/);
        if (matches) {
          const row = matches[1];
          const col = matches[2];
          const input = document.querySelector(`.cell input[data-row="${row}"][data-col="${col}"]`);
          if (input) input.value = progress[key];
        }
      }
    }
  }

  function startGame() {
    const selectedIndex = parseInt(puzzleSelect.value);
    currentPuzzle = puzzles[selectedIndex];
    generateGrid();
    displayClues();
    startTimer();
    clearMessage();
  }

  startGameBtn.addEventListener('click', startGame);
  checkAnswersBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      if (input.value !== currentPuzzle.solutionData[r][c]) {
        input.style.backgroundColor = '#ff4444';
      } else {
        input.style.backgroundColor = '#44ff44';
      }
    });
    checkCompletion();
  });
  clearBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(input => {
      input.value = '';
      input.style.backgroundColor = '';
    });
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('completed'));
    saveProgress();
    clearMessage();
  });

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
    if (event.target === modal) modal.style.display = 'none';
  });

  // (Opcional) Iniciar automaticamente:
  // startGame();
});








  