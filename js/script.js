document.addEventListener("DOMContentLoaded", function() {
  // Elementos da página
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

  // Animação do título com anime.js
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
      // Solução do puzzle (as letras corretas)
      solutionData: [
        ["G", "A", "T", "O", ""],
        ["", "", "A", "", ""],
        ["C", "A", "M", "A", "S"],
        ["", "", "A", "", ""],
        ["L", "I", "R", "A", ""]
      ],
      // Dicas – sem as respostas; a numeração (1, 6, 11, etc.) será computada automaticamente
      horizontalClues: [
        "1. Animal que mia",             // para a palavra na linha 0
        "6. Móveis para dormir",           // para a palavra na linha 2
        "11. Instrumento musical antigo"   // para a palavra na linha 4
      ],
      verticalClues: [
        "3. Nome próprio bíblico"         // para a vertical formada na coluna 2
      ]
    }
  ];

  let currentPuzzle = null;
  let timerInterval = null;
  let startTime = null;

  // Computa a numeração tradicional (como em palavras cruzadas)
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

  // Gera o grid com inputs, números e restaura progresso salvo
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
            checkCompletion();
          });
          input.addEventListener('keydown', function(e) {
            handleArrowKeys(e, r, c);
          });
          cellDiv.appendChild(input);
        }
        gridContainer.appendChild(cellDiv);
      }
    }
    loadProgress();
  }

  // Auto-avança para a próxima célula da mesma palavra (horizontal) se houver
  function autoAdvance(row, col) {
    if (col + 1 < currentPuzzle.puzzleData[row].length && currentPuzzle.puzzleData[row][col + 1] === 1) {
      const nextInput = document.querySelector(`.cell input[data-row="${row}"][data-col="${col + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  }

  // Navegação com as teclas de seta
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

  // Verifica se uma palavra horizontal (bloco contíguo na linha) foi completada corretamente
  function checkHorizontalWord(row) {
    let cells = [];
    for (let c = 0; c < currentPuzzle.puzzleData[row].length; c++) {
      if (currentPuzzle.puzzleData[row][c] === 1) {
        cells.push({row, col: c});
      } else {
        if (cells.length > 0) {
          verifyWord(cells);
          cells = [];
        }
      }
    }
    if (cells.length > 0) verifyWord(cells);
  }

  // Verifica um bloco de células (palavra horizontal) e, se completa, marca e exibe mensagem
  function verifyWord(cells) {
    let complete = true;
    cells.forEach(({row, col}) => {
      const input = document.querySelector(`.cell input[data-row="${row}"][data-col="${col}"]`);
      if (!input || input.value === "" || input.value !== currentPuzzle.solutionData[row][col]) {
        complete = false;
      }
    });
    if (complete) {
      cells.forEach(({row, col}) => {
        const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cellDiv) cellDiv.classList.add('completed');
      });
      showMessage("Palavra completa!");
      setTimeout(clearMessage, 2000);
    }
  }

  // Verifica se todo o puzzle foi completado corretamente
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

  // Exibe mensagem de feedback
  function showMessage(msg) {
    messageDiv.textContent = msg;
  }

  function clearMessage() {
    messageDiv.textContent = "";
  }

  // Exibe as dicas (clues) – sem revelar as respostas
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

  // Timer: inicia e atualiza a exibição
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

  // Salva o progresso atual no localStorage
  function saveProgress() {
    const inputs = document.querySelectorAll('.cell input');
    const progress = {};
    inputs.forEach(input => {
      const key = `r${input.dataset.row}c${input.dataset.col}`;
      progress[key] = input.value;
    });
    localStorage.setItem(`puzzle-${currentPuzzle.id}-progress`, JSON.stringify(progress));
  }

  // Carrega o progresso salvo (se houver)
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

  // Inicia o jogo: seleciona o puzzle, gera o grid, exibe as dicas e inicia o timer
  function startGame() {
    const selectedIndex = parseInt(puzzleSelect.value);
    currentPuzzle = puzzles[selectedIndex];
    generateGrid();
    displayClues();
    startTimer();
    clearMessage();
  }

  // Eventos dos botões e do modal
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

  // (Opcional) Você pode iniciar o jogo automaticamente ao carregar a página, descomentando a linha abaixo:
  // startGame();
});







  