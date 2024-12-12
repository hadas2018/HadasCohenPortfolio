// מנהלת את כל הלוגיקה הקשורה למשתמשים (הוספה, מחיקה, אימות וכו')
class UserManager {
  constructor() {
    this.users = this.loadUsers();
  }

  loadUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
  }

  saveUsers() {
    localStorage.setItem("users", JSON.stringify(this.users));
    updateUsersTable();
  }

  validateEmail(email) {
    if (!email) {
      throw new Error("כתובת מייל היא שדה חובה");
    }
    return !this.users.some(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async addUser(user) {
    if (!this.validateEmail(user.email)) {
      throw new Error("כתובת המייל כבר קיימת במערכת");
    }

    if (!this.validateIdNumber(user.idNumber)) {
      throw new Error("תעודת זהות לא תקינה");
    }
    if (!this.validatePhone(user.phone)) {
      throw new Error("מספר טלפון לא תקין");
    }
    if (this.users.some((u) => u.idNumber === user.idNumber)) {
      throw new Error("משתמש עם תעודת זהות זו כבר קיים במערכת");
    }

    user.password = await this.hashPassword(user.password);
    user.createdAt = new Date().toISOString();
    this.users.push(user);
    this.saveUsers();
    return user;
  }

  deleteUser(idNumber) {
    this.users = this.users.filter((user) => user.idNumber !== idNumber);
    this.saveUsers();
  }

  async validateUser(idNumber, password) {
    const user = this.users.find((u) => u.idNumber === idNumber);
    if (!user) {
      throw new Error("משתמש לא נמצא");
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("סיסמא שגויה");
    }

    return user;
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async verifyPassword(password, hashedPassword) {
    const newHash = await this.hashPassword(password);
    return newHash === hashedPassword;
  }

  validateIdNumber(idNumber) {
    if (!/^\d{9}$/.test(idNumber)) return false;

    let sum = 0;
    for (let i = 0; i < 8; i++) {
      let digit = Number(idNumber[i]);
      if (i % 2 === 0) digit *= 1;
      else digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === Number(idNumber[8]);
  }

  validatePhone(phone) {
    return /^05\d{8}$/.test(phone);
  }

  checkPasswordStrength(password) {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength += checks.length ? 20 : 0;
    strength += checks.lowercase ? 20 : 0;
    strength += checks.uppercase ? 20 : 0;
    strength += checks.numbers ? 20 : 0;
    strength += checks.special ? 20 : 0;

    return { score: strength, checks };
  }
}

// מטפל בתהליך ההרשמה והממשק 
class RegistrationManager {
  constructor(userManager) {
    this.userManager = userManager;
    this.form = document.getElementById("registerForm");
    this.spinner = document.getElementById("registerSpinner");
    this.passwordInput = document.getElementById("regPassword");
    this.strengthBar = document.getElementById("strengthBar");
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleRegistration();
    });

    this.passwordInput.addEventListener("input", () => {
      this.updatePasswordStrength();
    });
  }

  updatePasswordStrength() {
    const password = this.passwordInput.value;
    const { score, checks } = this.userManager.checkPasswordStrength(password);

    this.strengthBar.style.width = `${score}%`;


    if (password.length === 0) {
      this.strengthBar.style.width = "0%";
      this.strengthBar.style.backgroundColor = "var(--danger-color)";
      document.getElementById("passwordStrengthText").textContent =
        'הסיסמא חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה, מספר וסימן מיוחד';
      return;
    }

    if (score < 40) {
      this.strengthBar.style.backgroundColor = "var(--danger-color)";
    } else if (score < 80) {
      this.strengthBar.style.backgroundColor = "var(--warning-color)";
    } else {
      this.strengthBar.style.backgroundColor = "var(--success-color)";
    }

    let strengthText = [];

    if (!checks.length) strengthText.push("חייבת להכיל לפחות 8 תווים");
    if (!checks.uppercase) strengthText.push("חייבת להכיל אות גדולה");
    if (!checks.lowercase) strengthText.push("חייבת להכיל אות קטנה");
    if (!checks.numbers) strengthText.push("חייבת להכיל מספר");

    if (!checks.special) strengthText.push("חייבת להכיל סימן מיוחד");

    document.getElementById("passwordStrengthText").textContent =
      strengthText.length > 0
        ? strengthText.join(", ")
        : "חוזק סיסמא: " +
          (score < 40 ? "חלשה" : score < 80 ? "בינונית" : "חזקה");
  }

  async handleRegistration() {
    const newUser = {
      fullName: document.getElementById("fullName").value,
      idNumber: document.getElementById("regIdNumber").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      password: document.getElementById("regPassword").value,
    };

    const confirmPassword = document.getElementById("confirmPassword").value;

    try {
      this.showLoading();

      if (newUser.password !== confirmPassword) {
        throw new Error("הסיסמאות אינן תואמות");
      }

   
      const { score, checks } = this.userManager.checkPasswordStrength(newUser.password);
      if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.numbers || !checks.special) {
          throw new Error("הסיסמא אינה עומדת בדרישות המינימליות");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Network simulation
      await this.userManager.addUser(newUser);

      this.showSuccess("ההרשמה בוצעה בהצלחה! כעת תוכל להתחבר למערכת");
      this.form.reset();
      setTimeout(() => formManager.showLoginForm(), 2000);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    this.spinner.style.display = "inline-block";
    this.form.querySelector('button[type="submit"]').disabled = true;
  }

  hideLoading() {
    this.spinner.style.display = "none";
    this.form.querySelector('button[type="submit"]').disabled = false;
  }

  showError(message) {
    const errorAlert = document.getElementById("registrationError");
    errorAlert.textContent = message;
    errorAlert.style.display = "block";
    setTimeout(() => {
      errorAlert.style.display = "none";
    }, 5000);
  }

  showSuccess(message) {
    const successAlert = document.getElementById("registrationSuccess");
    successAlert.textContent = message;
    successAlert.style.display = "block";
  }
}

// מטפל בתהליך ההתחברות והממשק 
class LoginManager {
  constructor(userManager) {
    this.userManager = userManager;
    this.form = document.getElementById("loginFormElement");
    this.spinner = document.getElementById("loginSpinner");
    this.smsBtn = document.getElementById("smsBtn");
    this.passwordBtn = document.getElementById("passwordBtn");
    this.passwordField = document.getElementById("passwordField");
    this.setupEventListeners();
    this.loginMethod = "password";
  }

  setupEventListeners() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    this.smsBtn.addEventListener("click", () =>
      this.toggleLoginType("password")
    );
    this.passwordBtn.addEventListener("click", () =>
      this.toggleLoginType("sms")
    );

    const rememberedUser = localStorage.getItem("rememberedUser");
    if (rememberedUser) {
      const { idNumber } = JSON.parse(rememberedUser);
      document.getElementById("loginIdNumber").value = idNumber;
      document.getElementById("rememberMe").checked = true;
    }
  }

  toggleLoginType(type) {
    this.loginMethod = type;
    const passwordInput = this.passwordField.querySelector("input");
    passwordInput.value = "";

    if (type === "password") {
      this.smsBtn.classList.add("active");
      this.passwordBtn.classList.remove("active");
      passwordInput.placeholder = "סיסמא";
      passwordInput.type = "password";
    } else {
      this.passwordBtn.classList.add("active");
      this.smsBtn.classList.remove("active");
      passwordInput.placeholder = "טלפון נייד";
      passwordInput.type = "tel";
    }
  }

  async handleLogin() {
    const idNumber = document.getElementById("loginIdNumber").value;
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    try {
      this.showLoading();

      if (this.loginMethod === "password") {
        const user = await this.userManager.validateUser(idNumber, password);

        if (rememberMe) {
          localStorage.setItem("rememberedUser", JSON.stringify({ idNumber }));
        } else {
          localStorage.removeItem("rememberedUser");
        }

        this.showSuccess(`ברוך/ה הבא ${user.fullName}! מעביר אותך למערכת...`);

        // Store logged-in user information
        sessionStorage.setItem("loggedInUser", JSON.stringify(user));

        setTimeout(() => {
          this.showSuccess("התחברת בהצלחה! מועבר לדף הבית...");
          showLoggedInState(user);
        }, 2000);
      } else {
        await this.handleSmsLogin(idNumber, password);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  async handleSmsLogin(idNumber, phone) {
    if (!this.userManager.validatePhone(phone)) {
      throw new Error("מספר טלפון לא תקין");
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
    this.showSuccess("קוד אימות נשלח לטלפון שלך");
  }

  showLoading() {
    this.spinner.style.display = "inline-block";
    this.form.querySelector('button[type="submit"]').disabled = true;
  }

  hideLoading() {
    this.spinner.style.display = "none";
    this.form.querySelector('button[type="submit"]').disabled = false;
  }

  showError(message) {
    const errorAlert = document.getElementById("loginError");
    errorAlert.textContent = message;
    errorAlert.style.display = "block";
    setTimeout(() => {
      errorAlert.style.display = "none";
    }, 5000);
  }

  showSuccess(message) {
    const successAlert = document.getElementById("loginSuccess");
    successAlert.textContent = message;
    successAlert.style.display = "block";
  }
}

// מנהל את המעבר בין הטפסים השונים במערכת
class FormManager {
  constructor() {
    this.registrationForm = document.getElementById("registrationForm");
    this.loginForm = document.getElementById("loginForm");
    this.adminSection = document.getElementById("adminSection");
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById("showLoginLink").addEventListener("click", (e) => {
      e.preventDefault();
      this.showLoginForm();
    });

    document
      .getElementById("showRegisterLink")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.showRegistrationForm();
      });

    document.getElementById("forgotPassword").addEventListener("click", (e) => {
      e.preventDefault();
      this.showPasswordResetModal();
    });
  }

  showLoginForm() {
    this.registrationForm.style.display = "none";
    this.loginForm.style.display = "block";
    this.adminSection.style.display = "none";
    this.clearAlerts();
    document.getElementById("loginIdNumber").value = "";
    document.getElementById("loginPassword").value = "";
  }

  showRegistrationForm() {
    this.registrationForm.style.display = "block";
    this.loginForm.style.display = "none";
    this.adminSection.style.display = "none";
    this.clearAlerts();
    document.getElementById("loginIdNumber").value = "";
    document.getElementById("loginPassword").value = "";
  }

  showPasswordResetModal() {
    document.getElementById("passwordResetModal").style.display = "block";
  }

  clearAlerts() {
    document.querySelectorAll(".alert").forEach((alert) => {
      alert.style.display = "none";
    });
  }
}

// Helper Functions
function showTerms(event) {
  event.preventDefault();
  document.getElementById("termsModal").style.display = "block";
}

function closeTerms() {
  document.getElementById("termsModal").style.display = "none";
}

function closePasswordReset() {
  document.getElementById("passwordResetModal").style.display = "none";
}

function updateUsersTable() {
  const tableBody = document.getElementById("usersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = userManager.users
    .map(
      (user) => `
            <tr>
                <td>${user.fullName}</td>
                <td>${user.idNumber}</td>
                <td>${user.phone}</td>
                <td>${user.email}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="userManager.deleteUser('${user.idNumber}')">
                        מחק
                    </button>
                </td>
            </tr>
        `
    )
    .join("");
}

// Initialize System
const userManager = new UserManager();
const formManager = new FormManager();
const registrationManager = new RegistrationManager(userManager);
const loginManager = new LoginManager(userManager);


function showLoggedInState(user) {
  document.getElementById("registrationForm").style.display = "none";
  document.getElementById("loginForm").style.display = "none";

  if (user.isAdmin) {
    document.getElementById("adminSection").style.display = "block";
    updateUsersTable();
  }

  const loggedInSection = document.createElement("div");
  loggedInSection.className = "form-container";
  loggedInSection.id = "loggedInSection";

  loggedInSection.innerHTML = `
        <div class="logo">
            <div class="title">הר-אל</div>
            <div class="subtitle">שכר, נוכחות ומשאבי אנוש</div>
            <div class="orange-circle"></div>
        </div>
        
        <h4 class="text-center mb-4">ברוך הבא, ${user.fullName}</h4>
        
        <div class="user-info mb-4">
            <p><strong>תעודת זהות:</strong> ${user.idNumber}</p>
            <p><strong>טלפון:</strong> ${user.phone}</p>
            <p><strong>אימייל:</strong> ${user.email}</p>
        </div>
        
        <button onclick="handleLogout()" class="btn btn-danger submit-btn">
            התנתק
        </button>
    `;

  document.querySelector(".container").appendChild(loggedInSection);
}

async function handleLogout() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate server call
    sessionStorage.removeItem("loggedInUser");

    const loggedInSection = document.getElementById("loggedInSection");
    if (loggedInSection) {
      loggedInSection.remove();
    }

    document.getElementById("adminSection").style.display = "none";

    formManager.showLoginForm();
  } catch (error) {
    console.error("שגיאה בהתנתקות:", error);
  }
}

// Password Reset Form Handler
document
  .getElementById("passwordResetForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const idNumber = document.getElementById("resetIdNumber").value;
    const email = document.getElementById("resetEmail").value;

    try {
      const user = userManager.users.find(
        (u) => u.idNumber === idNumber && u.email === email
      );
      if (!user) {
        throw new Error("לא נמצא משתמש עם פרטים אלו");
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("הוראות לאיפוס הסיסמא נשלחו לכתובת המייל שלך");
      closePasswordReset();
    } catch (error) {
      alert(error.message);
    }
  });

// ID Number Validation
document.getElementById("regIdNumber").addEventListener("input", function (e) {
  const idNumber = e.target.value;
  if (idNumber.length === 9) {
    if (!userManager.validateIdNumber(idNumber)) {
      this.setCustomValidity("תעודת זהות לא תקינה");
    } else {
      this.setCustomValidity("");
    }
  }
});

// Phone Number Validation
document.getElementById("phone").addEventListener("input", function (e) {
  const phone = e.target.value;
  if (phone.length >= 10) {
    if (!userManager.validatePhone(phone)) {
      this.setCustomValidity("מספר טלפון לא תקין");
    } else {
      this.setCustomValidity("");
    }
  }
});

// Window Event Handlers
window.addEventListener("load", () => {
  updateUsersTable();
  checkLoggedInUser();
});

window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

// Check Logged In User
function checkLoggedInUser() {
  const loggedInUser = sessionStorage.getItem("loggedInUser");
  if (loggedInUser) {
    const user = JSON.parse(loggedInUser);
    showLoggedInState(user);
  }
}

// Create Initial Admin User
(async function createInitialAdmin() {
  if (userManager.users.length === 0) {
    const adminUser = {
      fullName: "מנהל מערכת",
      idNumber: "037159753",
      phone: "0501234567",
      email: "admin@example.com",
      password: "Admin123!",
      isAdmin: true,
    };

    try {
      await userManager.addUser(adminUser);
      console.log("נוצר משתמש מנהל ראשוני");
    } catch (error) {
      console.error("שגיאה ביצירת מנהל:", error);
    }
  }
})();
