      class MathGame {
        constructor() {
          this.correctAnswer = null;
          this.currentProblem = null;
          this.totalScore = 0;
          this.isCheckingAnswer = false;
          this.gameHistory = [];
          this.initializeOperations();
          this.bindEvents();
          this.loadGameState();
        }

        initializeOperations() {
          this.operations = {
            "+": (a, b) => a + b,
            "-": (a, b) => a - b,
            "*": (a, b) => a * b,
            "/": (a, b) => (b !== 0 ? a / b : null),
          };
        }

        bindEvents() {
          document
            .getElementById("startGame")
            .addEventListener("click", () => this.startGame());
          document
            .getElementById("checkAnswer")
            .addEventListener("click", () => this.checkAnswer());
          document
            .getElementById("resetGame")
            .addEventListener("click", () => this.resetGame());
          document
            .getElementById("answer")
            .addEventListener("keypress", (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                this.checkAnswer();
              }
            });
        }

        calculateSimple(num1, num2, operation) {
          const result = this.operations[operation](num1, num2);
          return result !== null ? Number(result.toFixed(2)) : null;
        }

        calculateComplex(num1, num2, num3, operation1, operation2) {
          const firstPart = this.calculateSimple(num1, num2, operation1);
          if (firstPart === null) return null;
          return this.calculateSimple(firstPart, num3, operation2);
        }

        async saveGameState() {
          try {
            localStorage.setItem("totalScore", this.totalScore.toString());
            localStorage.setItem(
              "gameHistory",
              JSON.stringify(this.gameHistory)
            );
            document.getElementById("currentScore").textContent =
              this.totalScore;
          } catch (e) {
            console.error("Failed to save game state:", e);
          }
        }

        async loadGameState() {
          try {
            const savedScore = localStorage.getItem("totalScore");
            const savedHistory = localStorage.getItem("gameHistory");

            if (savedScore) {
              this.totalScore = parseInt(savedScore);
              document.getElementById("totalScore").textContent =
                this.totalScore;
              document.getElementById("currentScore").textContent =
                this.totalScore;
            }

            if (savedHistory) {
              this.gameHistory = JSON.parse(savedHistory);
              // בודקים שיש היסטוריה תקינה
              if (this.gameHistory && this.gameHistory.length > 0) {
                this.gameHistory.forEach((result) => {
                  if (result && result.problem) {
                    // בודקים שהנתונים תקינים
                    this.addResultToTable(
                      result.problem,
                      result.correctAnswer,
                      result.userAnswer,
                      result.score,
                      false
                    );
                  }
                });

                document.getElementById("gameArea").style.display = "block";
                document.getElementById("resultsArea").style.display = "block";
                // מתחילים משחק חדש במקום להשאיר את התרגיל הדוגמה
                this.startGame();
              }
            }
          } catch (e) {
            console.error("Failed to load game state:", e);
            // אם יש שגיאה, מתחילים משחק חדש
            this.startGame();
          }
        }

        startGame() {
          if (this.isCheckingAnswer) return;

          const maxNumber = parseInt(
            document.getElementById("maxNumber").value
          );
          const operation = document.getElementById("operation").value;
          const complexity = document.getElementById("complexity").value;

          let num1, num2, num3, operation2;
          do {
            num1 = Math.floor(Math.random() * maxNumber) + 1;
            num2 = Math.floor(Math.random() * maxNumber) + 1;
            num3 = Math.floor(Math.random() * maxNumber) + 1;
            operation2 = ["+", "-", "*", "/"][Math.floor(Math.random() * 4)];

            if (complexity === "simple") {
              this.currentProblem = `${num1} ${operation} ${num2}`;
              this.correctAnswer = this.calculateSimple(num1, num2, operation);
            } else {
              this.currentProblem = `(${num1} ${operation} ${num2}) ${operation2} ${num3}`;
              this.correctAnswer = this.calculateComplex(
                num1,
                num2,
                num3,
                operation,
                operation2
              );
            }
          } while (this.correctAnswer === null);

          document.getElementById("problem").textContent = this.currentProblem;
          document.getElementById("gameArea").style.display = "block";
          document.getElementById("resultsArea").style.display = "block";
          document.getElementById("answer").value = "";
          document.getElementById("result").textContent = "";
          document
            .getElementById("answer")
            .classList.remove("input-error", "input-success");
          document.getElementById("answer").disabled = false;
          document.getElementById("checkAnswer").disabled = false;
          document.getElementById("answer").focus();
        }

        checkAnswer() {
          if (this.isCheckingAnswer) return;
          this.isCheckingAnswer = true;

          document.getElementById("answer").disabled = true;
          document.getElementById("checkAnswer").disabled = true;

          const userAnswer = parseFloat(
            document.getElementById("answer").value
          );
          const resultElement = document.getElementById("result");
          let score = 0;

          if (isNaN(userAnswer)) {
            resultElement.textContent = "אנא הזן מספר תקין.";
            resultElement.className = "mt-3 text-danger";
            document.getElementById("answer").classList.add("input-error");
            this.isCheckingAnswer = false;
            document.getElementById("answer").disabled = false;
            document.getElementById("checkAnswer").disabled = false;
            document.getElementById("answer").focus();
            return;
          }

          if (Math.abs(userAnswer - this.correctAnswer) < 0.01) {
            resultElement.textContent = "כל הכבוד! התשובה נכונה.";
            resultElement.className = "mt-3 text-success";
            score = 1;
            this.totalScore++;
            document.getElementById("answer").classList.add("input-success");
            document.getElementById("currentScore").textContent =
              this.totalScore;
          } else {
            resultElement.textContent = `התשובה אינה נכונה! התשובה היא ${this.correctAnswer}.`;
            resultElement.className = "mt-3 text-danger";
            document.getElementById("answer").classList.add("input-error");
          }

          const result = {
            problem: this.currentProblem,
            correctAnswer: this.correctAnswer,
            userAnswer: userAnswer,
            score: score,
          };

          if (this.currentProblem && this.correctAnswer !== null) {
            this.gameHistory.push(result);
          }
          this.gameHistory.push(result);

          this.addResultToTable(
            this.currentProblem,
            this.correctAnswer,
            userAnswer,
            score,
            true
          );
          this.updateTotalScore();
          this.saveGameState();

          setTimeout(() => {
            this.isCheckingAnswer = false;
            this.startGame();
          }, 2000);
        }

        addResultToTable(
          problem,
          correctAnswer,
          userAnswer,
          score,
          isNew = true
        ) {
          const tableBody = document.getElementById("resultsBody");
          const newRow = tableBody.insertRow(isNew ? 0 : tableBody.rows.length);
          newRow.innerHTML = `
                    <td>${score}</td>
                    <td>${correctAnswer}</td>
                    <td>${userAnswer}</td>
                    <td>${problem}</td>
                `;
        }

        updateTotalScore() {
          document.getElementById("totalScore").textContent = this.totalScore;
          document.getElementById("currentScore").textContent = this.totalScore;
        }

        resetGame() {
          if (this.isCheckingAnswer) return;

          // יצירת המודל אם הוא לא קיים
          if (!this.resetModal) {
            this.resetModal = new bootstrap.Modal(
              document.getElementById("resetConfirmModal")
            );

            // הוספת מאזין לכפתור האישור
            document
              .getElementById("confirmReset")
              .addEventListener("click", () => {
                this.totalScore = 0;
                this.gameHistory = [];
                document.getElementById("resultsBody").innerHTML = "";
                document.getElementById("totalScore").textContent =
                  this.totalScore;
                document.getElementById("currentScore").textContent =
                  this.totalScore;
                document.getElementById("gameArea").style.display = "none";
                document.getElementById("resultsArea").style.display = "none";
                document.getElementById("answer").value = "";
                document.getElementById("result").textContent = "";
                document
                  .getElementById("answer")
                  .classList.remove("input-error", "input-success");
                document.getElementById("answer").disabled = false;
                document.getElementById("checkAnswer").disabled = false;

                try {
                  localStorage.removeItem("totalScore");
                  localStorage.removeItem("gameHistory");
                } catch (e) {
                  console.error("Failed to reset game state:", e);
                }

                // סגירת המודל אחרי המחיקה
                this.resetModal.hide();
              });
          }

          // הצגת המודל
          this.resetModal.show();
        }

        static checkLocalStorageSupport() {
          try {
            localStorage.setItem("test", "test");
            localStorage.removeItem("test");
            return true;
          } catch (e) {
            return false;
          }
        }
      }

      // יצירת מופע של המשחק והפעלתו
      window.onload = () => {
        if (!MathGame.checkLocalStorageSupport()) {
          console.warn(
            "Local Storage is not supported. Progress will not be saved."
          );
        }
        new MathGame();
      };
  