// מחלקת בסיס למשחק זיכרון
class MemoryGame {
  constructor(options = {}) {
    this.gameBoard = document.getElementById(options.boardId || "gameBoard");
    this.score = 0;
    this.attempts = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.cards = [];
    this.isProcessing = false;
    this.gameStarted = false;
  }

  initGame() {
    throw new Error('Must be implemented by subclass');
  }

  createCard(data, index) {
    throw new Error('Must be implemented by subclass');
  }

  checkMatch() {
    const [first, second] = this.flippedCards;
    const isMatch = this.isCardMatch(first, second);

    if (isMatch) {
      this.handleMatch(first, second);
    } else {
      this.handleMismatch(first, second);
    }

    this.flippedCards = [];
    this.isProcessing = false;
  }

  isCardMatch(card1, card2) {
    throw new Error('Must be implemented by subclass');
  }

  handleMatch(card1, card2) {
    card1.card.classList.add("matched");
    card2.card.classList.add("matched");
    this.matchedPairs++;
    this.score += 10;
  }

  handleMismatch(card1, card2) {
    setTimeout(() => {
      card1.card.classList.remove("flipped");
      card2.card.classList.remove("flipped");
    }, 500);
    this.score = Math.max(0, this.score - 1);
  }
}

// מחלקה לניהול שעון חול
class HourglassTimer {
  constructor() {
    this.timerElement = document.getElementById("timer");
    this.topSand = document.querySelector(".hourglass .top");
    this.bottomSand = document.querySelector(".hourglass .bottom");
    this.totalTime = 0;
    this.remainingTime = 0;
    this.timerInterval = null;
    this.startTime = null;
    this.onTimeUp = null;
    this.isStopped = false;
  }

  start(totalSeconds, onTimeUpCallback) {
    this.isStopped = false;
    this.totalTime = totalSeconds;
    this.remainingTime = totalSeconds;
    this.onTimeUp = onTimeUpCallback;
    this.startTime = Date.now();
    
    this.updateDisplay(); // עדכון ראשוני מיידי

    this.timerInterval = setInterval(() => {
      if (this.isStopped) return;
      
      const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      this.remainingTime = Math.max(0, this.totalTime - elapsedSeconds);
      
      this.updateDisplay();
      
      if (this.remainingTime <= 0) {
        this.stop();
        if (this.onTimeUp) {
          this.onTimeUp();
        }
      }
    }, 100); // עדכון בתדירות גבוהה יותר לחלקות
  }

  stop() {
    this.isStopped = true;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.updateDisplay(); // עדכון אחרון לוודא שהתצוגה מעודכנת
  }

  updateDisplay() {
    if (!this.timerElement || !this.topSand || !this.bottomSand) return;

    // עדכון תצוגת הזמן הדיגיטלית
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    this.timerElement.textContent = 
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // עדכון שעון החול
    const progress = Math.min(1, Math.max(0, (this.totalTime - this.remainingTime) / this.totalTime));
    
    requestAnimationFrame(() => {
      this.topSand.style.height = `${(1 - progress) * 100}px`;
      this.bottomSand.style.height = `${progress * 100}px`;
    });
  }

  reset() {
    this.stop();
    this.remainingTime = this.totalTime;
    this.updateDisplay();
  }

  getTimeSpent() {
    return this.totalTime - this.remainingTime;
  }
}

// מחלקה לניהול אפקטים קוליים
class SoundManager {
  constructor() {
    this.sounds = {};
  }

  addSound(key, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      this.sounds[key] = {
        element,
        loaded: false
      };
      
      element.load();
      element.addEventListener("canplaythrough", () => {
        this.sounds[key].loaded = true;
      });
    }
  }

  async playSound(key) {
    const sound = this.sounds[key];
    if (sound?.loaded) {
      try {
        sound.element.currentTime = 0;
        await sound.element.play();
      } catch (error) {
        console.error(`Error playing sound ${key}:`, error);
      }
    }
  }
}

// מחלקת משחק זיכרון פוקימונים שיורשת ממשחק הזיכרון הבסיסי
class PokemonMemoryGame extends MemoryGame {
  constructor() {
    super({
      boardId: "gameBoard"
    });
    
    // אתחול אלמנטים
    this.cardCountSelect = document.getElementById("cardCount");
    this.timeLimitSelect = document.getElementById("timeLimit");
    this.startGameButton = document.getElementById("startGame");
    this.scoreElement = document.getElementById("score");
    this.attemptsElement = document.getElementById("attempts");
    this.alertElement = document.getElementById("alert");

    // אתחול מנהל הסאונד
    this.soundManager = new SoundManager();
    this.soundManager.addSound("victory", "victorySound");
    this.soundManager.addSound("match", "matchSound");
    this.soundManager.addSound("timeUp", "timeUpSound");

    // אתחול טיימר
    this.timer = new HourglassTimer();

    this.startGameButton.addEventListener("click", this.initGame.bind(this));
  }

  async initGame() {
    const cardCount = parseInt(this.cardCountSelect.value);
    if (!cardCount) {
      this.showAlert("נא לבחור כמות כרטיסים");
      return;
    }

    const pokemons = await this.fetchPokemonData(cardCount / 2);
    if (pokemons.length === 0) {
      this.showAlert("שגיאה בטעינת הפוקימונים. נסה שוב.");
      return;
    }

    this.gameStarted = true;
    this.matchedPairs = 0;
    this.score = 0;
    this.attempts = 0;
    this.cards = []; // ריקון מערך הקלפים
    this.updateScore();

    const pokemonPairs = [...pokemons, ...pokemons];
    const shuffledPokemon = pokemonPairs.sort(() => Math.random() - 0.5);

    this.gameBoard.innerHTML = "";
    const columns = Math.ceil(Math.sqrt(cardCount));
    this.gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    shuffledPokemon.forEach((pokemon, index) => {
      const card = this.createCard(pokemon, index);
      this.gameBoard.appendChild(card);
      this.cards.push(card);
    });

    // התחלת טיימר עם callback לסיום המשחק
    const timeLimit = parseInt(this.timeLimitSelect.value);
    this.timer.start(timeLimit, () => this.endGame(false));
  }

  async fetchPokemonData(count) {
    this.gameBoard.innerHTML = '<div class="loading">טוען פוקימונים...</div>';
    const pokemons = [];
    const randomStart = Math.floor(Math.random() * (150 - count)) + 1;

    try {
      for (let i = 0; i < count; i++) {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${randomStart + i}`
        );
        const data = await response.json();
        pokemons.push({
          id: data.id,
          name: data.name,
          image: data.sprites.front_default,
        });
      }
      return pokemons;
    } catch (error) {
      console.error("Error fetching Pokemon:", error);
      return [];
    }
  }

  createCard(pokemon, index) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="cardInner">
        <div class="cardFront">
          <img src="${pokemon.image}" alt="${pokemon.name}" class="pokemonImg">
        </div>
        <div class="cardBack"></div>
      </div>
    `;
    card.addEventListener("click", () => this.flipCard(card, index, pokemon));
    return card;
  }

  flipCard(card, index, pokemon) {
    if (
      !this.gameStarted ||
      this.isProcessing ||
      this.flippedCards.length >= 2 ||
      card.classList.contains("flipped") ||
      card.classList.contains("matched")
    ) {
      return;
    }

    card.classList.add("flipped");
    this.flippedCards.push({ index, card, pokemon });

    if (this.flippedCards.length === 2) {
      this.isProcessing = true;
      this.attempts++;
      this.updateScore();
      setTimeout(() => this.checkMatch(), 500);
    }
  }

  isCardMatch(card1, card2) {
    return card1.pokemon.id === card2.pokemon.id;
  }

  handleMatch(card1, card2) {
    super.handleMatch(card1, card2);
    this.soundManager.playSound("match");
    
    if (this.matchedPairs === this.cards.length / 2) {
      this.endGame(true);
    }
  }

  updateScore() {
    this.scoreElement.textContent = this.score;
    this.attemptsElement.textContent = this.attempts;
  }

  endGame(isVictory) {
    this.timer.stop();
    this.gameStarted = false;

    if (isVictory) {
      const timeSpent = this.timer.getTimeSpent();
      this.showVictoryMessage(timeSpent);
      this.soundManager.playSound("victory");
      this.cards.forEach(card => card.classList.add("flyAway"));
    } else {
      this.showTimeUpMessage();
      this.soundManager.playSound("timeUp");
    }
  }

  showVictoryMessage(timeSpent) {
    this.showAlert(
      `כל הכבוד! ניצחת במשחק!\nניקוד: ${this.score}\nזמן: ${this.formatTime(timeSpent)}\nניסיונות: ${this.attempts}`
    );
  }

  showTimeUpMessage() {
    this.showAlert("נגמר הזמן! נסה שוב");
  }

  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  showAlert(message) {
    this.alertElement.textContent = message;
    this.alertElement.style.display = "block";
    setTimeout(() => {
      this.alertElement.style.display = "none";
    }, 5000);
  }
}

// יצירת המשחק
const game = new PokemonMemoryGame();