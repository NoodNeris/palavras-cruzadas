document.addEventListener("DOMContentLoaded", function() {
  const gridContainer = document.getElementById('grid-container');
  const horizontalList = document.getElementById('horizontal-list');
  const messageDiv = document.getElementById('message');
  const timerDisplay = document.getElementById('timer');
  const puzzleSelect = document.getElementById('puzzleSelect');
  const keyboardContainer = document.getElementById('keyboard-container');
  const startGameBtn = document.getElementById('startGameBtn');
  const checkAnswersBtn = document.getElementById('checkAnswersBtn');
  const clearBtn = document.getElementById('clearBtn');
  const instructionsBtn = document.getElementById('instructionsBtn');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('closeModal');
  
  let currentPuzzle = null;
  let timerInterval = null;
  let startTime = null;
  let currentInput = null;
  
  document.addEventListener("focusin", function(e) {
    if (e.target.tagName === "INPUT") {
      currentInput = e.target;
    }
  });
  
  anime({
    targets: '#title',
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: 1000,
    easing: 'easeOutExpo'
  });
  
  // Puzzle de teste – Tema "Frutas"
  // Grid de 4 linhas x 10 colunas:
  // Row 0: BANANA ativa de col 2 a 7.
  // Row 1: UVA ativa de col 3 a 5.
  // Row 2: ACEROLA ativa de col 2 a 8.
  // Row 3: PITANGA ativa de col 2 a 8.
  const puzzles = [
    {
      id: 0,
      name: "Puzzle Diário - Frutas",
      puzzleData: [
        [0,0,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,0]
      ],
      // Números definidos manualmente: 1 na Row 0 col2; 2 na Row 1 col3; 3 na Row 2 col2; 4 na Row 3 col2.
      clueNumbers: [
        [0,0,1,0,0,0,0,0,0,0],
        [0,0,0,2,0,0,0,0,0,0],
        [0,0,3,0,0,0,0,0,0,0],
        [0,0,4,0,0,0,0,0,0,0]
      ],
      // Solução:
      // Row 0: BANANA -> B, A, N, A, N, A
      // Row 1: UVA -> U, V, A
      // Row 2: ACEROLA -> A, C, E, R, O, L, A
      // Row 3: PITANGA -> P, I, T, A, N, G, A
      solutionData: [
        ["", "", "B", "A", "N", "A", "N", "A", "", ""],
        ["", "", "", "U", "V", "A", "", "", "", ""],
        ["", "", "A", "C", "E", "R", "O", "L", "A", ""],
        ["", "", "P", "I", "T", "A", "N", "G", "A", ""]
      ],
      horizontalClues: [
        "1: Fruta amarela, rica em potássio e favorita dos macacos.",
        "2: Pequena, usada para fazer vinhos e sucos, pode ser verde ou roxa.",
        "3: Fruta vermelha, comumente usada em sucos e vitaminas, com polpa adocicada.",
        "4: Fruta doce e pequena que cresce em cachos, lembrando pequenas maçãs."
      ]
    }
  ];
  
  function getNumbers(puzzleData) {
    if (currentPuzzle.clueNumbers) return currentPuzzle.clueNumbers;
    return computeNumbers(puzzleData);
  }
  
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
  
  function generateGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.display = "grid";
    const numbers = getNumbers(currentPuzzle.puzzleData);
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
          if (numbers[r][c] !== "" && numbers[r][c] !== 0) {
            const numSpan = document.createElement('span');
            numSpan.classList.add('cell-number');
            numSpan.textContent = numbers[r][c];
            cellDiv.appendChild(numSpan);
          }
          const input = document.createElement('input');
          input.setAttribute('maxlength', '1');
          // Removido o atributo readonly para permitir teclado físico
          // input.setAttribute('readonly', true);
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
            if (e.key === "Backspace" && input.value === "") {
              e.preventDefault();
              autoRetreat(r, c);
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
  
  function autoAdvance(row, col) {
    let startCol = col;
    while (startCol > 0 && currentPuzzle.puzzleData[row][startCol - 1] === 1) {
      startCol--;
    }
    let endCol = col;
    while (endCol < currentPuzzle.puzzleData[row].length - 1 && currentPuzzle.puzzleData[row][endCol + 1] === 1) {
      endCol++;
    }
    let blockComplete = true;
    for (let c = startCol; c <= endCol; c++) {
      const inp = document.querySelector(`.cell input[data-row="${row}"][data-col="${c}"]`);
      if (!inp || inp.value === "") {
        blockComplete = false;
        break;
      }
    }
    if (blockComplete) {
      for (let c = endCol + 1; c < currentPuzzle.puzzleData[row].length; c++) {
        if (currentPuzzle.puzzleData[row][c] === 1) {
          const nextInp = document.querySelector(`.cell input[data-row="${row}"][data-col="${c}"]`);
          if (nextInp) {
            nextInp.focus();
            return;
          }
        }
      }
      if (row + 1 < currentPuzzle.puzzleData.length) {
        for (let c = 0; c < currentPuzzle.puzzleData[row + 1].length; c++) {
          if (currentPuzzle.puzzleData[row + 1][c] === 1) {
            const nextInp = document.querySelector(`.cell input[data-row="${row + 1}"][data-col="${c}"]`);
            if (nextInp) {
              nextInp.focus();
              return;
            }
          }
        }
      }
    } else {
      if (col + 1 <= endCol) {
        const nextInp = document.querySelector(`.cell input[data-row="${row}"][data-col="${col + 1}"]`);
        if (nextInp) nextInp.focus();
      }
    }
  }
  
  function autoRetreat(row, col) {
    if (col - 1 >= 0 && currentPuzzle.puzzleData[row][col - 1] === 1) {
      const prevInp = document.querySelector(`.cell input[data-row="${row}"][data-col="${col - 1}"]`);
      if (prevInp) {
        prevInp.focus();
        prevInp.value = '';
        saveProgress();
        setTimeout(() => {
          if (prevInp.value === "") {
            autoRetreat(row, col - 1);
          }
        }, 100);
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
    const targetInp = document.querySelector(`.cell input[data-row="${targetRow}"][data-col="${targetCol}"]`);
    if (targetInp) targetInp.focus();
  }
  
  function checkHorizontalWord(row) {
    let cells = [];
    for (let c = 0; c < currentPuzzle.puzzleData[row].length; c++) {
      if (currentPuzzle.puzzleData[row][c] === 1) {
        cells.push({ row, col: c });
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
    for (const { row, col } of cells) {
      const inp = document.querySelector(`.cell input[data-row="${row}"][data-col="${col}"]`);
      if (!inp || inp.value === "" || inp.value !== currentPuzzle.solutionData[row][col]) {
        complete = false;
        break;
      }
    }
    if (complete && cells.length > 0) {
      cells.forEach(({ row, col }) => {
        const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cellDiv) cellDiv.classList.add('completed');
      });
      const elapsed = Math.floor((new Date() - startTime) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      showMessage("Parabéns, puzzle completo! Seu tempo: " + minutes + ":" + seconds);
      clearInterval(timerInterval);
      setTimeout(clearMessage, 5000);
    }
  }
  
  function checkCompletion() {
    const inputs = document.querySelectorAll('.cell input');
    let allCorrect = true;
    inputs.forEach(inp => {
      const r = parseInt(inp.dataset.row);
      const c = parseInt(inp.dataset.col);
      if (inp.value !== currentPuzzle.solutionData[r][c]) {
        allCorrect = false;
      }
    });
    if (allCorrect && inputs.length > 0) {
      const elapsed = Math.floor((new Date() - startTime) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      showMessage("Parabéns, puzzle completo! Seu tempo: " + minutes + ":" + seconds);
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
    horizontalList.innerHTML = `
      <li>1: Fruta amarela, rica em potássio e favorita dos macacos.</li>
      <li>2: Pequena, usada para fazer vinhos e sucos, pode ser verde ou roxa.</li>
      <li>3: Fruta vermelha, comumente usada em sucos e vitaminas, com polpa adocicada.</li>
      <li>4: Fruta doce e pequena que cresce em cachos, lembrando pequenas maçãs.</li>
    `;
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
    inputs.forEach(inp => {
      const key = `r${inp.dataset.row}c${inp.dataset.col}`;
      progress[key] = inp.value;
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
          const inp = document.querySelector(`.cell input[data-row="${row}"][data-col="${col}"]`);
          if (inp) inp.value = progress[key];
        }
      }
    }
  }
  
  function createKeyboard() {
    const keys = [
      "A","B","C","D","E","F","G","H","I","J",
      "K","L","M","N","O","P","Q","R","S","T",
      "U","V","W","X","Y","Z",
      "Backspace","Enter"
    ];
    keyboardContainer.innerHTML = "";
    keys.forEach(key => {
      const btn = document.createElement('div');
      btn.classList.add('key');
      btn.textContent = key;
      btn.addEventListener('click', function() {
        if (!currentInput) return;
        if (key === "Backspace") {
          if (currentInput.value === "") {
            const r = parseInt(currentInput.dataset.row);
            const c = parseInt(currentInput.dataset.col);
            autoRetreat(r, c);
          } else {
            currentInput.value = "";
          }
          saveProgress();
          currentInput.focus();
          checkHorizontalWord(parseInt(currentInput.dataset.row));
          checkCompletion();
        } else if (key === "Enter") {
          const r = parseInt(currentInput.dataset.row);
          const c = parseInt(currentInput.dataset.col);
          autoAdvance(r, c);
          checkHorizontalWord(r);
          checkCompletion();
        } else {
          currentInput.value = key;
          saveProgress();
          const r = parseInt(currentInput.dataset.row);
          const c = parseInt(currentInput.dataset.col);
          autoAdvance(r, c);
          checkHorizontalWord(r);
          checkCompletion();
        }
      });
      keyboardContainer.appendChild(btn);
    });
    keyboardContainer.style.display = "block";
  }
  
  function startGame() {
    const selectedIndex = parseInt(puzzleSelect.value);
    currentPuzzle = puzzles[selectedIndex];
    generateGrid();
    displayClues();
    gridContainer.style.display = "grid";
    document.getElementById('clues-container').style.display = "block";
    createKeyboard();
    startTimer();
    clearMessage();
  }
  
  startGameBtn.addEventListener('click', startGame);
  
  checkAnswersBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(inp => {
      const r = parseInt(inp.dataset.row);
      const c = parseInt(inp.dataset.col);
      if (inp.value !== currentPuzzle.solutionData[r][c]) {
        inp.style.backgroundColor = '#ff4444';
      } else {
        inp.style.backgroundColor = '#44ff44';
      }
    });
    checkCompletion();
  });
  
  clearBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(inp => {
      inp.value = '';
      inp.style.backgroundColor = '';
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
  
  // Para iniciar automaticamente, descomente a linha abaixo:
  // startGame();
});


























  