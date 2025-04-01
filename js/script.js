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

  // Array de puzzles – você pode adicionar mais puzzles aqui
  const puzzles = [
    {
      id: 0,
      name: "Puzzle Diário",
      puzzleData: [
        [1, 1, 1, 0, 1],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 0]
      ],
      solutionData: [
        ["G", "A", "T", "O", ""],       // 1-across: GATO
        ["", "", "A", "", ""],
        ["C", "A", "M", "A", "S"],       // 6-across: CAMAS
        ["", "", "A", "", ""],
        ["L", "I", "R", "A", ""]         // 11-across: LIRA
      ],
      // Clues com numeração baseada na numeração que será computada
      horizontalClues: [
        "1. GATO – Animal que mia",
        "6. CAMAS – Móveis para dormir",
        "11. LIRA – Instrumento musical antigo"
      ],
      verticalClues: [
        "3. TAMAR – Nome próprio bíblico" // Exemplo: letras formando TAMAR
      ]
    }
    // Futuramente, adicione mais puzzles aqui
  ];

  let currentPuzzle = null;
  let timerInterval = null;
  let startTime = null;

  // Computa a numeração das células (como em palavras cruzadas tradicionais)
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

  // Gera a grade do puzzle com inputs e exibe os números
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
          // Exibe o número, se existir
          if (numbers[r][c] !== "") {
            const numSpan = document.createElement('span');
            numSpan.classList.add('cell-number');
            numSpan.textContent = numbers[r][c];
            cellDiv.appendChild(numSpan);
          }
          // Cria o input para a letra
          const input = document.createElement('input');
          input.setAttribute('maxlength', '1');
          input.dataset.row = r;
          input.dataset.col = c;
          // Ao digitar, transforma a letra em maiúscula, salva o progresso e move para a próxima célula
          input.addEventListener('input', function() {
            input.value = input.value.toUpperCase();
            saveProgress();
            moveToNextCell(r, c);
          });
          // Navegação com setas
          input.addEventListener('keydown', function(e) {
            handleArrowKeys(e, r, c);
          });
          cellDiv.appendChild(input);
        }
        gridContainer.appendChild(cellDiv);
      }
    }
    loadProgress(); // Tenta carregar o progresso salvo (se houver)
  }

  // Exibe as dicas (clues) nas áreas laterais
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

  // Move o foco para a próxima célula jogável (varrendo linha a linha)
  function moveToNextCell(row, col) {
    let nextCol = col + 1;
    let nextRow = row;
    if (nextCol >= currentPuzzle.puzzleData[0].length) {
      nextCol = 0;
      nextRow = row + 1;
      if (nextRow >= currentPuzzle.puzzleData.length) return;
    }
    const nextInput = document.querySelector(`.cell input[data-row="${nextRow}"][data-col="${nextCol}"]`);
    if (nextInput) {
      nextInput.focus();
    } else {
      moveToNextCell(nextRow, nextCol);
    }
  }

  // Navegação com setas
  function handleArrowKeys(e, row, col) {
    let targetRow = row;
    let targetCol = col;
    if (e.key === "ArrowRight") targetCol++;
    else if (e.key === "ArrowLeft") targetCol--;
    else if (e.key === "ArrowUp") targetRow--;
    else if (e.key === "ArrowDown") targetRow++;
    else return;
    e.preventDefault();
    if (targetRow < 0 || targetRow >= currentPuzzle.puzzleData.length || targetCol < 0 || targetCol >= currentPuzzle.puzzleData[0].length) return;
    const targetInput = document.querySelector(`.cell input[data-row="${targetRow}"][data-col="${targetCol}"]`);
    if (targetInput) targetInput.focus();
  }

  // Verifica as respostas comparando com a solução
  function checkAnswers() {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      if (currentPuzzle.solutionData[r] && currentPuzzle.solutionData[r][c] && input.value !== currentPuzzle.solutionData[r][c]) {
        input.style.backgroundColor = '#ffcccc';
      } else {
        input.style.backgroundColor = '#ccffcc';
      }
    });
  }

  // Limpa todos os inputs e remove cores de fundo
  function clearGrid() {
    const inputs = document.querySelectorAll('.cell input');
    inputs.forEach(input => {
      input.value = '';
      input.style.backgroundColor = '';
    });
    saveProgress();
  }

  // Timer: inicia e atualiza a exibição
  function startTimer() {
    startTime = new Date();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
      const elapsed = Math.floor((new Date() - startTime) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  // Salva o progresso atual no localStorage (chave baseada no id do puzzle)
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
        const input = document.querySelector(`.cell input[data-row="${key.match(/r(\d+)/)[1]}"][data-col="${key.match(/c(\d+)/)[1]}"]`);
        if (input) {
          input.value = progress[key];
        }
      }
    }
  }

  // Inicia o jogo: seleciona o puzzle, gera a grade, exibe as dicas e inicia o timer
  function startGame() {
    const selectedIndex = parseInt(puzzleSelect.value);
    currentPuzzle = puzzles[selectedIndex];
    generateGrid();
    displayClues();
    startTimer();
  }

  // Eventos dos botões e modal
  startGameBtn.addEventListener('click', startGame);
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
    if (event.target === modal) modal.style.display = 'none';
  });

  // Se houver progresso salvo ao carregar a página, o jogo pode ser retomado (opcional)
  // startGame(); // Você pode chamar isso automaticamente ou deixar que o usuário clique "Iniciar Jogo"
});





  