/* מחלקה ראשית למשחק איקס-עיגול
          מנהלת את לוגיקת המשחק, מצב המשחק והאינטראקציה עם השחקנים
         */
class TicTacToeGame {
  constructor() {
    this.images = {
      X: "Images/cheatosX.png",
      O: "Images/cheatosO.png",
    };
    // צליל ניצחון
    this.winSound = new Audio("sound/victorySound.wav");

    this.state = {
      board: Array(9).fill(""),
      currentPlayer: "X",
      gameActive: true,
      isComputerMode: false,
      score: { X: 0, O: 0 },
    };

    this.winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    this.initializeBoard();
    this.initializeEventListeners();
  }

  initializeBoard() {
    const boardContainer = document.getElementById("board");
    boardContainer.innerHTML = "";

    for (let i = 0; i < 9; i++) {
      if (i % 3 === 0) {
        const row = document.createElement("div");
        row.className = "row g-2";
        boardContainer.appendChild(row);
      }

      const cell = document.createElement("div");
      cell.className = "col-4";
      cell.innerHTML = `
                <div class="cell" data-index="${i}">
                  <img src="" alt="חטיף" />
                </div>
              `;
      boardContainer.lastChild.appendChild(cell);
    }
  }

  initializeEventListeners() {
    document
      .querySelectorAll(".cell")
      .forEach((cell) =>
        cell.addEventListener("click", (e) => this.handleClick(e))
      );

    document.querySelectorAll('input[name="gameMode"]').forEach((radio) =>
      radio.addEventListener("change", (e) => {
        this.state.isComputerMode = e.target.value === "vs_computer";
        this.resetGame();
      })
    );
  }

  updateStatus(message) {
    const status = document.getElementById("status");
    status.textContent = message;
    return status;
  }

  updateScore() {
    document.getElementById("score-x").textContent = this.state.score.X;
    document.getElementById("score-o").textContent = this.state.score.O;
  }
  //   איפוס הניקוד למשחק חדש
  resetScore() {
    this.state.score = { X: 0, O: 0 };
    this.updateScore();
  }

  checkWinner() {
    return this.winningCombos.some(
      ([a, b, c]) =>
        this.state.board[a] &&
        this.state.board[a] === this.state.board[b] &&
        this.state.board[a] === this.state.board[c]
    );
  }

  isDraw() {
    return this.state.board.every((cell) => cell);
  }

  findBestMove() {
    const moveIndex =
      this.findWinningMove("O") ||
      // חסום ניצחון של היריב
      this.findWinningMove("X") ||
      // קח את המרכז אם פנוי
      (!this.state.board[4] ? 4 : null) ||
      // קח פינה פנויה
      this.findEmptyCorner() ||
      // קח כל תא פנוי
      this.state.board.findIndex((cell) => !cell);

    return moveIndex;
  }

  findWinningMove(player) {
    for (let i = 0; i < 9; i++) {
      if (!this.state.board[i]) {
        this.state.board[i] = player;
        const isWinning = this.checkWinner();
        this.state.board[i] = "";
        if (isWinning) return i;
      }
    }
    return null;
  }

  findEmptyCorner() {
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter((i) => !this.state.board[i]);
    return emptyCorners.length
      ? emptyCorners[Math.floor(Math.random() * emptyCorners.length)]
      : null;
  }

  createConfetti(winner) {
    this.winSound.play().catch((e) => console.log("שגיאת צליל:", e));

    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";

      const img = document.createElement("img");
      img.src = this.images[winner];
      confetti.appendChild(img);

      document.querySelector(".game-board").appendChild(confetti);

      confetti.animate(
        [
          {
            transform: "translate(-50%, -50%) scale(1) rotate(0deg)",
            opacity: 1,
          },
          {
            transform: `translate(${(Math.random() - 0.5) * 400}px, 
                             ${(Math.random() - 0.5) * 400}px) 
                             scale(0) 
                             rotate(${Math.random() * 720}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 2000,
          easing: "cubic-bezier(.17,.67,.83,.67)",
        }
      ).onfinish = () => confetti.remove();
    }
  }

  makeMove(index, player) {
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (!cell) return false;

    const img = cell.querySelector("img");
    img.src = this.images[player];
    cell.classList.add("marked");
    this.state.board[index] = player;

    if (this.checkWinner()) {
      this.state.score[player]++;
      this.updateScore();
      const status = this.updateStatus(
        this.state.isComputerMode
          ? `${player === "X" ? "ניצחת!" : "המחשב ניצח!"} 🎉`
          : `השחקן ${player} ניצח! 🎉`
      );
      status.classList.add("winner");
      this.state.gameActive = false;
      this.createConfetti(player);
      return true;
    }

    if (this.isDraw()) {
      this.updateStatus("תיקו! 😅");
      this.state.gameActive = false;
      return true;
    }

    return false;
  }

  async makeComputerMove() {
    if (!this.state.gameActive || !this.state.isComputerMode) return;

    this.updateStatus("תור המחשב...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const moveIndex = this.findBestMove();
    if (!this.makeMove(moveIndex, "O")) {
      this.state.currentPlayer = "X";
      this.updateStatus("תורך לשחק!");
    }
  }

  handleClick(e) {
    const cell = e.target.closest(".cell");
    if (
      !cell ||
      !this.state.gameActive ||
      this.state.board[cell.dataset.index] ||
      (this.state.isComputerMode && this.state.currentPlayer !== "X")
    )
      return;

    if (!this.makeMove(cell.dataset.index, this.state.currentPlayer)) {
      this.state.currentPlayer = this.state.currentPlayer === "X" ? "O" : "X";

      if (this.state.isComputerMode && this.state.currentPlayer === "O") {
        this.makeComputerMove();
      } else {
        this.updateStatus(`תור השחקן: ${this.state.currentPlayer}`);
      }
    }
  }

  resetGame() {
    this.state.board = Array(9).fill("");
    this.state.currentPlayer = "X";
    this.state.gameActive = true;

    document.querySelectorAll(".cell").forEach((cell) => {
      const img = cell.querySelector("img");
      img.src = "";
      cell.classList.remove("marked");
    });

    const status = document.getElementById("status");
    status.textContent = this.state.isComputerMode
      ? "תורך לשחק!"
      : "תור השחקן: X";
    status.classList.remove("winner");

    document.querySelectorAll(".confetti").forEach((el) => el.remove());
  }
}

const game = new TicTacToeGame();
