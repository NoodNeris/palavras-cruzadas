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

  // Puzzle de teste com tema "Frutas"
  // Grid 7x10. As linhas onde há palavras horizontais:
  //  - Row 1: BANANA, 6 letras, iniciando na coluna 2.
  //  - Row 3: UVA, 3 letras, iniciando na coluna 3.
  //  - Row 6: MELANCIA, 8 letras, iniciando na coluna 2.
  // A vertical será formada na coluna 5 por todas as linhas, resultando em "LARANJA":
  //  Row0: L, Row1: A (de BANANA, posição 5-2=3), Row2: R, Row3: A (de UVA, posição 5-3=2), Row4: N, Row5: J, Row6: A (de MELANCIA, posição 5-2=3).
  const puzzles = [
    {
      id: 0,
      name: "Puzzle Diário - Frutas",
      // Matriz puzzleData (7 linhas x 10 colunas):
      // 1 = célula ativa; 0 = bloqueada.
      puzzleData: [
        // Row 0: apenas coluna 5 ativa (vertical)
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        // Row 1: BANANA de col 2 a 7
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
        // Row 2: apenas coluna 5 ativa (vertical)
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        // Row 3: UVA de col 3 a 5
        [0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        // Row 4: apenas coluna 5 ativa (vertical)
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        // Row 5: apenas coluna 5 ativa (vertical)
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        // Row 6: MELANCIA de col 2 a 9
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 0]
      ],
      // Matriz de números para as pistas, definida manualmente:
      // Horizontais: Row1 = 1, Row3 = 6, Row6 = 11; Vertical: Row0, col5 =  ? (definimos para pista vertical, usamos número 3 na célula de Row? Mas vamos definir a vertical com número 3 na Row? Vamos definir: vertical pista será exibida com número 3, mesmo que o grid tenha outra numeração)
      // Aqui usaremos:
      clueNumbers: [
        [0,0,0,0,0,1,0,0,0,0],
        [0,0,1,0,0,0,0,0,0,0], // Na Row1, o número 1 aparece na coluna 2.
        [0,0,0,0,0,2,0,0,0,0],
        [0,0,0,1,0,0,0,0,0,0], // Na Row3, o número 6 na coluna 3.
        [0,0,0,0,0,3,0,0,0,0],
        [0,0,0,0,0,4,0,0,0,0],
        [0,0,1,0,0,0,0,0,0,0]  // Na Row6, o número 11 na coluna 2.
      ],
      // Definindo a solução (nas células ativas). As células não ativas ficam em branco.
      solutionData: [
        // Row 0 (vertical): apenas col 5 = "L"
        ["", "", "", "", "", "L", "", "", "", ""],
        // Row 1 (BANANA, col2-7): "B","A","N","A","N","A"
        ["", "", "B", "A", "N", "A", "N", "A", "", ""],
        // Row 2 (vertical): apenas col 5 = "R"
        ["", "", "", "", "", "R", "", "", "", ""],
        // Row 3 (UVA, col3-5): "U","V","A"
        ["", "", "", "U", "V", "A", "", "", "", ""],
        // Row 4 (vertical): apenas col 5 = "N"
        ["", "", "", "", "", "N", "", "", "", ""],
        // Row 5 (vertical): apenas col 5 = "J"
        ["", "", "", "", "", "J", "", "", "", ""],
        // Row 6 (MELANCIA, col2-9): "M","E","L","A","N","C","I","A"
        ["", "", "M", "E", "L", "A", "N", "C", "I", "A"]
      ],
      // Pistas para as palavras (usando as numerações que vamos exibir manualmente):
      horizontalClues: [
        "Fruta amarela, rica em potássio e favorita dos macacos.",  // BANANA (pista 1)
        "Pequena, usada para fazer vinhos e sucos, pode ser verde ou roxa.", // UVA (pista 6)
        "Fruta grande, verde por fora, vermelha por dentro e cheia de sementes pretinhas." // MELANCIA (pista 11)
      ],
      verticalClues: [
        "Fruta cítrica, muito usada em sucos e rica em vitamina C." // LARANJA (pista 3)
      ]
    }
  ];

  let currentPuzzle = null;
  let timerInterval = null;
  let startTime = null;

  // Retorna a matriz de números (se definida manualmente, usa-a; senão, calcula)
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

  // Gera o grid, insere inputs e números; carrega o progresso salvo
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
          input.dataset.row = r;
          input.dataset.col = c;
          input.addEventListener('input', function() {
            input.value = input.value.toUpperCase();
            saveProgress();
            if (r === 0 || r === 2 || r === 4 || r === 5) {
              // Linhas com célula vertical isolada
              autoAdvanceVertical(r, c);
            } else {
              autoAdvance(row, c);
            }
            checkHorizontalWord(r);
            checkVerticalWords();
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

  // Auto-avanço horizontal: dentro do mesmo bloco; se completo, pula para próximo bloco ou linha
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
      // Procura o próximo bloco na mesma linha
      for (let c = endCol + 1; c < currentPuzzle.puzzleData[row].length; c++) {
        if (currentPuzzle.puzzleData[row][c] === 1) {
          const nextInp = document.querySelector(`.cell input[data-row="${row}"][data-col="${c}"]`);
          if (nextInp) {
            nextInp.focus();
            return;
          }
        }
      }
      // Se não houver, passa para o primeiro campo ativo da linha seguinte
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

  // Auto-avanço vertical: para células isoladas (linhas 0,2,4,5), move para a célula ativa na mesma coluna na linha seguinte
  function autoAdvanceVertical(row, col) {
    if (row + 1 < currentPuzzle.puzzleData.length && currentPuzzle.puzzleData[row + 1][col] === 1) {
      const nextInp = document.querySelector(`.cell input[data-row="${row + 1}"][data-col="${col}"]`);
      if (nextInp) nextInp.focus();
    }
  }

  // Auto-retreat contínuo: se Backspace em célula vazia, move para a célula anterior do mesmo bloco e limpa
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

  // Verifica o bloco horizontal na linha 'row'
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
    if (complete && cells.length > 1) {
      cells.forEach(({ row, col }) => {
        const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cellDiv) cellDiv.classList.add('completed');
      });
      showMessage("Palavra horizontal completa!");
      setTimeout(clearMessage, 2000);
    }
  }

  // Verifica os blocos verticais em cada coluna
  function checkVerticalWords() {
    const cols = currentPuzzle.puzzleData[0].length;
    for (let c = 0; c < cols; c++) {
      let cells = [];
      for (let r = 0; r < currentPuzzle.puzzleData.length; r++) {
        if (currentPuzzle.puzzleData[r][c] === 1) {
          cells.push({ row: r, col: c });
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
    for (const { row, col } of cells) {
      const inp = document.querySelector(`.cell input[data-row="${row}"][data-col="${col}"]`);
      if (!inp || inp.value === "" || inp.value !== currentPuzzle.solutionData[row][col]) {
        complete = false;
        break;
      }
    }
    if (complete && cells.length > 1) {
      cells.forEach(({ row, col }) => {
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
    inputs.forEach(inp => {
      const r = parseInt(inp.dataset.row);
      const c = parseInt(inp.dataset.col);
      if (inp.value !== currentPuzzle.solutionData[r][c]) {
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

  // Exibe as pistas com numeração clara
  function displayClues() {
    horizontalList.innerHTML = `
      <li>1: ${currentPuzzle.horizontalClues[0]}</li>
      <li>6: ${currentPuzzle.horizontalClues[1]}</li>
      <li>11: ${currentPuzzle.horizontalClues[2]}</li>
    `;
    verticalList.innerHTML = `<li>3: ${currentPuzzle.verticalClues[0]}</li>`;
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

  function startGame() {
    const selectedIndex = parseInt(puzzleSelect.value);
    currentPuzzle = puzzles[selectedIndex];
    generateGrid();
    displayClues();
    document.getElementById('grid-container').style.display = "grid";
    document.getElementById('clues-container').style.display = "block";
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

  // (Opcional) Para iniciar automaticamente, descomente a linha abaixo:
  // startGame();
});















  