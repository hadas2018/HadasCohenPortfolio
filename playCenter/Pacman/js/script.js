      // משחק קבועים
      const GAME_CONFIG = {
        CELL_SIZE: 20,       
        POWER_DURATION: 10000, 
        PLAYER_SPEED: 0.15,  
        GHOST_NORMAL_SPEED: 0.075,  
        GHOST_VULNERABLE_SPEED: 0.05,  
        DIRECTION_CHANGE_PROBABILITY: 0.03, 
      };

      // הודעות קבועות
      const MESSAGES = {
        start: {
           title: '<div class="game-title">PAC MAN</div>',
          subtitle: "השתמש במקשי החצים כדי לנוע",
          instructions: "אסוף נקודות והתחמק מהרוחות!",
          powerInstructions: "אכול כדורי כח כדי לצוד את הרוחות",
          buttonText: "התחל משחק",
        },
        victory: {
          title: "כל הכבוד!",
          subtitle: "ניצחת את המשחק!",
          scorePrefix: "הניקוד הסופי שלך: ",
          buttonText: "שחק שוב",
        },
        gameOver: {
          title: "המשחק נגמר!",
          subtitle: "נתפסת על ידי רוח 👻",
          scorePrefix: "הניקוד הסופי שלך: ",
          buttonText: "שחק שוב",
        },
      };

      // הגדרת שמע
      const createAudioElement = (id) => {
        const audio = document.createElement("audio");
        audio.id = id;
        audio.preload = "auto";
        return audio;
      };

      const sounds = {
        victory: createAudioElement("victorySound"),
        gameOver: createAudioElement("gameOverSound"),
        powerUp: createAudioElement("powerUpSound"),
        eatGhost: createAudioElement("eatGhostSound"),
        dot: createAudioElement("dotSound"),
      };

      // פונקציה להשמעת צליל בטוחה
      const playSound = (sound) => {
        try {
          if (sound.src) {
            const soundClone = sound.cloneNode();
            soundClone.volume = 0.3;
            soundClone.play().catch((error) => {
              console.log("Failed to play sound:", error);
            });
          }
        } catch (error) {
          console.log("Error playing sound:", error);
        }
      };

      // פונקציה לטעינת הצלילים
      const initSounds = () => {
        sounds.victory.src = "sounds/victorySound.wav";
        sounds.gameOver.src = "sounds/gameOverSound.wav";
        sounds.powerUp.src = "sounds/powerUpSound.wav";
        sounds.eatGhost.src = "sounds/voicform.wav";
        sounds.dot.src = "sounds/matchSound.mp3";

        Object.values(sounds).forEach((sound) => {
          sound.load();
        });
      };

      // כנבס
      const canvas = document.getElementById("gameCanvas");
      const ctx = canvas.getContext("2d");
      const scoreElement = document.getElementById("score");
      const powerTimer = document.getElementById("power-timer");

      const GRID = {
        WIDTH: canvas.width / GAME_CONFIG.CELL_SIZE,
        HEIGHT: canvas.height / GAME_CONFIG.CELL_SIZE,
      };

      // Game State
      let gameState = {
        score: 0,
        isGameOver: false,
        isPowerActive: false,
        powerTimeLeft: 0,
        powerTimeout: null,
        gameLoopId: null,
        pacman: {
          x: 1.5,
          y: 1.5,
          direction: 0,
          mouth: 0,
        },
        ghosts: [
          { x: 18, y: 18, color: "red", direction: 0, isVulnerable: false },
          { x: 1, y: 18, color: "pink", direction: 0, isVulnerable: false },
          { x: 18, y: 1, color: "cyan", direction: 0, isVulnerable: false },
        ],
        dots: [],
        powerPellets: [],
        keysPressed: {
          ArrowUp: false,
          ArrowDown: false,
          ArrowLeft: false,
          ArrowRight: false,
        },
      };

      // מבוך
      const MAZE = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ];

      // יצירת הודעה
      const createMessageOverlay = (type) => {
        const overlay = document.createElement("div");
        overlay.className = `message ${type}-message`; // שינוי המחלקה להתאים ל-CSS
        overlay.id = `${type}Message`;

        const content = `
        <h2>${MESSAGES[type].title}</h2>
        <p>${MESSAGES[type].subtitle}</p>
        ${
          type !== "start"
            ? `<p>${MESSAGES[type].scorePrefix}<span id="final${
                type === "victory" ? "" : "GameOver"
              }Score">0</span></p>`
            : `<p>${MESSAGES[type].instructions}</p><p>${MESSAGES[type].powerInstructions}</p>`
        }
        <button class="btn-play-again">${MESSAGES[type].buttonText}</button>
    `;

        overlay.innerHTML = content;
        document.body.appendChild(overlay);

        // Add click event to button
        const button = overlay.querySelector(".btn-play-again");
        button.addEventListener("click", startNewGame);

        return overlay;
      };

      const showVictoryMessage = () => {
        let victoryMessage = document.getElementById("victoryMessage");
        if (!victoryMessage) {
          victoryMessage = createMessageOverlay("victory");
        }

        const finalScore = victoryMessage.querySelector("#finalScore");
        finalScore.textContent = gameState.score;
        victoryMessage.style.display = "block";
        playSound(sounds.victory);
      };

      const showGameOverMessage = () => {
        let gameOverMessage = document.getElementById("gameOverMessage");
        if (!gameOverMessage) {
          gameOverMessage = createMessageOverlay("gameOver");
        }

        const finalGameOverScore = gameOverMessage.querySelector(
          "#finalGameOverScore"
        );
        finalGameOverScore.textContent = gameState.score;
        gameOverMessage.style.display = "block";
        playSound(sounds.gameOver);
      };

      const showStartMessage = () => {
        let startMessage = document.getElementById("startMessage");
        if (!startMessage) {
          startMessage = createMessageOverlay("start");
        }
        startMessage.style.display = "block";
      };

      // Game Functions
      const initializeGame = () => {
        gameState.dots = [];
        gameState.powerPellets = [];

        MAZE.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell === 0) {
              gameState.dots.push({ x: x + 0.5, y: y + 0.5 });
            }
          });
        });

        gameState.powerPellets = [
          { x: 1.5, y: 1.5 },
          { x: GRID.WIDTH - 2.5, y: 1.5 },
          { x: 1.5, y: GRID.HEIGHT - 2.5 },
          { x: GRID.WIDTH - 2.5, y: GRID.HEIGHT - 2.5 },
        ];
      };

      const resetGame = () => {
        gameState = {
          ...gameState,
          score: 0,
          isGameOver: false,
          isPowerActive: false,
          powerTimeLeft: 0,
          pacman: { x: 1.5, y: 1.5, direction: 0, mouth: 0 },
          ghosts: [
            { x: 18, y: 18, color: "red", direction: 0, isVulnerable: false },
            { x: 1, y: 18, color: "pink", direction: 0, isVulnerable: false },
            { x: 18, y: 1, color: "cyan", direction: 0, isVulnerable: false },
          ],
        };

        scoreElement.textContent = gameState.score;
        powerTimer.style.visibility = "hidden";
        clearTimeout(gameState.powerTimeout);
        initializeGame();
      };

      const startNewGame = () => {
        const gameOverMessage = document.getElementById("gameOverMessage");
        const victoryMessage = document.getElementById("victoryMessage");
        const startMessage = document.getElementById("startMessage");

        if (gameOverMessage) gameOverMessage.style.display = "none";
        if (victoryMessage) victoryMessage.style.display = "none";
        if (startMessage) startMessage.style.display = "none";

        resetGame();
        gameLoop();
      };

      // תנועה והתנגשות
      const activatePowerMode = () => {
        gameState.isPowerActive = true;
        gameState.powerTimeLeft = GAME_CONFIG.POWER_DURATION;
        powerTimer.style.visibility = "visible";
        gameState.ghosts.forEach((ghost) => (ghost.isVulnerable = true));
        playSound(sounds.powerUp);

        clearTimeout(gameState.powerTimeout);
        gameState.powerTimeout = setTimeout(() => {
          gameState.isPowerActive = false;
          powerTimer.style.visibility = "hidden";
          gameState.ghosts.forEach((ghost) => (ghost.isVulnerable = false));
        }, GAME_CONFIG.POWER_DURATION);
      };

      const canMove = (x, y) => MAZE[Math.floor(y)][Math.floor(x)] === 0;

      const updatePacmanPosition = () => {
        const { pacman, keysPressed } = gameState;
        let newX = pacman.x;
        let newY = pacman.y;

        const movements = {
          ArrowRight: { x: GAME_CONFIG.PLAYER_SPEED, y: 0, direction: 0 },
          ArrowLeft: { x: -GAME_CONFIG.PLAYER_SPEED, y: 0, direction: Math.PI },
          ArrowUp: {
            x: 0,
            y: -GAME_CONFIG.PLAYER_SPEED,
            direction: -Math.PI / 2,
          },
          ArrowDown: {
            x: 0,
            y: GAME_CONFIG.PLAYER_SPEED,
            direction: Math.PI / 2,
          },
        };

        Object.entries(movements).forEach(([key, { x, y, direction }]) => {
          if (keysPressed[key]) {
            newX += x;
            newY += y;
            pacman.direction = direction;
          }
        });

        if (canMove(newX, pacman.y)) pacman.x = newX;
        if (canMove(pacman.x, newY)) pacman.y = newY;
      };

      const moveGhosts = () => {
        gameState.ghosts.forEach((ghost) => {
          if (Math.random() < GAME_CONFIG.DIRECTION_CHANGE_PROBABILITY) {
            ghost.direction = Math.floor(Math.random() * 4);
          }

          const speed = ghost.isVulnerable
            ? GAME_CONFIG.GHOST_VULNERABLE_SPEED
            : GAME_CONFIG.GHOST_NORMAL_SPEED;

          // הגדרת כיווני התנועה האפשריים
          const moves = [
            { x: speed, y: 0 }, // Right
            { x: 0, y: speed }, // Down
            { x: -speed, y: 0 }, // Left
            { x: 0, y: -speed }, // Up
          ];

          // חישוב המיקום החדש לפי הכיוון הנוכחי
          const movement = moves[ghost.direction];
          const newX = ghost.x + movement.x;
          const newY = ghost.y + movement.y;

          // בדיקה ועדכון המיקום
          if (canMove(newX, ghost.y)) ghost.x = newX;
          if (canMove(ghost.x, newY)) ghost.y = newY;
        });
      };

      const checkCollisions = () => {
        if (gameState.isGameOver) return;
        const { pacman } = gameState;

        // Check dot collisions
        gameState.dots = gameState.dots.filter((dot) => {
          const collision =
            Math.abs(dot.x - pacman.x) < 0.5 &&
            Math.abs(dot.y - pacman.y) < 0.5;
          if (collision) {
            gameState.score += 10;
            scoreElement.textContent = gameState.score;
            playSound(sounds.dot);
          }
          return !collision;
        });

        // Check power pellet collisions
        gameState.powerPellets = gameState.powerPellets.filter((pellet) => {
          const collision =
            Math.abs(pellet.x - pacman.x) < 0.5 &&
            Math.abs(pellet.y - pacman.y) < 0.5;
          if (collision) {
            gameState.score += 50;
            scoreElement.textContent = gameState.score;
            activatePowerMode();
          }
          return !collision;
        });

        // Check ghost collisions
        gameState.ghosts.forEach((ghost) => {
          if (
            Math.abs(ghost.x - pacman.x) < 1 &&
            Math.abs(ghost.y - pacman.y) < 1
          ) {
            if (ghost.isVulnerable) {
              gameState.score += 200;
              scoreElement.textContent = gameState.score;
              ghost.x = GRID.WIDTH / 2;
              ghost.y = GRID.HEIGHT / 2;
              ghost.isVulnerable = false;
              playSound(sounds.eatGhost);
            } else {
              gameState.isGameOver = true;
              cancelAnimationFrame(gameState.gameLoopId);
              playSound(sounds.gameOver);
              showGameOverMessage();
            }
          }
        });

        // Check win condition
        if (
          gameState.dots.length === 0 &&
          gameState.powerPellets.length === 0
        ) {
          gameState.isGameOver = true;
          cancelAnimationFrame(gameState.gameLoopId);
          playSound(sounds.victory);
          showVictoryMessage();
        }
      };

      // Drawing Functions
      const drawPacman = () => {
        const { x, y, direction, mouth } = gameState.pacman;
        const mouthAngle = Math.abs(Math.sin(mouth)) * 0.5;

        ctx.beginPath();
        ctx.fillStyle = "yellow";
        ctx.arc(
          x * GAME_CONFIG.CELL_SIZE,
          y * GAME_CONFIG.CELL_SIZE,
          GAME_CONFIG.CELL_SIZE / 2,
          mouthAngle + direction,
          2 * Math.PI - mouthAngle + direction
        );
        ctx.lineTo(x * GAME_CONFIG.CELL_SIZE, y * GAME_CONFIG.CELL_SIZE);
        ctx.fill();
      };

      const drawGhosts = () => {
        gameState.ghosts.forEach(({ x, y, isVulnerable, color }) => {
          ctx.beginPath();
          const ghostX = x * GAME_CONFIG.CELL_SIZE;
          const ghostY = y * GAME_CONFIG.CELL_SIZE;

          ctx.fillStyle = isVulnerable ? "#0000FF" : color;
          ctx.arc(ghostX, ghostY, GAME_CONFIG.CELL_SIZE / 2, 0, Math.PI);
          ctx.lineTo(
            ghostX + GAME_CONFIG.CELL_SIZE / 2,
            ghostY + GAME_CONFIG.CELL_SIZE / 2
          );
          ctx.lineTo(
            ghostX - GAME_CONFIG.CELL_SIZE / 2,
            ghostY + GAME_CONFIG.CELL_SIZE / 2
          );
          ctx.fill();
        });
      };

      const drawDots = () => {
        ctx.fillStyle = "white";
        gameState.dots.forEach(({ x, y }) => {
          ctx.beginPath();
          ctx.arc(
            x * GAME_CONFIG.CELL_SIZE,
            y * GAME_CONFIG.CELL_SIZE,
            3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });

        ctx.fillStyle = "#FFB6C1";
        gameState.powerPellets.forEach(({ x, y }) => {
          ctx.beginPath();
          ctx.arc(
            x * GAME_CONFIG.CELL_SIZE,
            y * GAME_CONFIG.CELL_SIZE,
            8,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      };

      const drawMaze = () => {
        ctx.fillStyle = "#0000AA";
        MAZE.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell === 1) {
              ctx.fillRect(
                x * GAME_CONFIG.CELL_SIZE,
                y * GAME_CONFIG.CELL_SIZE,
                GAME_CONFIG.CELL_SIZE,
                GAME_CONFIG.CELL_SIZE
              );
            }
          });
        });
      };

      // Game Loop
      const gameLoop = () => {
        if (gameState.isGameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameState.isPowerActive) {
          gameState.powerTimeLeft -= 16;
          powerTimer.textContent = `מצב כח פעיל! ${Math.ceil(
            gameState.powerTimeLeft / 1000
          )} שניות`;
        }

        updatePacmanPosition();
        moveGhosts();
        checkCollisions();

        drawMaze();
        drawDots();
        drawPacman();
        drawGhosts();

        gameState.pacman.mouth += 0.15;
        gameState.gameLoopId = requestAnimationFrame(gameLoop);
      };

      // Resize Function
      const resizeGame = () => {
        const container = document.getElementById("game-container");
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const maxWidth = Math.min(windowWidth * 0.9, 600);
        const aspectRatio = canvas.height / canvas.width;
        const maxHeight = maxWidth * aspectRatio;

        canvas.style.width = `${maxWidth}px`;
        canvas.style.height = `${maxHeight}px`;

        container.style.width = `${maxWidth}px`;
        container.style.height = `${maxHeight}px`;
      };

      // Event Listeners
      document.addEventListener(
        "keydown",
        function initAudioOnFirstInteraction() {
          initSounds();
          document.removeEventListener("keydown", initAudioOnFirstInteraction);
        }
      );

      document.addEventListener("keydown", (e) => {
        if (e.key in gameState.keysPressed) {
          gameState.keysPressed[e.key] = true;
        }

        if (e.key === "Enter") {
          const gameOverVisible =
            document.getElementById("gameOverMessage")?.style.display ===
            "block";
          const victoryVisible =
            document.getElementById("victoryMessage")?.style.display ===
            "block";

          if (gameOverVisible || victoryVisible) {
            startNewGame();
          }
        }
      });

      document.addEventListener("keyup", (e) => {
        if (e.key in gameState.keysPressed) {
          gameState.keysPressed[e.key] = false;
        }
      });

      // Initialize Game
      window.addEventListener("load", () => {
        initializeGame();
        showStartMessage();
        resizeGame();
      });

      // Add resize listener
      window.addEventListener("resize", resizeGame);
   