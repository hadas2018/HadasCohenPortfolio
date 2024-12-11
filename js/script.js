
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  hamburger.classList.toggle("active");
});

const links = document.querySelectorAll(".nav-links a");
links.forEach((link) => {
  link.addEventListener("click", function () {
    links.forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
    navLinks.classList.remove("active");
    hamburger.classList.remove("active");
  });
});
function initEmailJS() {
  if (typeof emailjs !== "undefined") {
    const form = document.getElementById("contactForm");
    const submitBtn = document.getElementById("submitBtn");
    const inputs = form.querySelectorAll("input[required]");

    emailjs.init(form.dataset.publicKey);

    // פונקציות ולידציה
    const validations = {
      from_name: (value) => {
        const nameRegex = /^[\u0590-\u05FFa-zA-Z\s]{2,}$/;
        return {
          isValid: nameRegex.test(value),
          message: "אנא הזן שם תקין (לפחות 2 תווים, אותיות בלבד)",
        };
      },
      reply_to: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: emailRegex.test(value),
          message: "אנא הזן כתובת אימייל תקינה",
        };
      },
      phone: (value) => {
        const phoneRegex = /^05\d{8}$/;
        return {
          isValid: phoneRegex.test(value),
          message: "אנא הזן מספר טלפון תקין (10 ספרות, מתחיל ב-05)",
        };
      },
    };

    function showError(input, message) {
      const formControl = input.closest(".form-control");
      let errorDiv = formControl.querySelector(".error-message");
      input.classList.add("error");

      if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        formControl.appendChild(errorDiv);
      }

      errorDiv.textContent = message;
    }

    function removeError(input) {
      const formControl = input.closest(".form-control");
      const errorDiv = formControl.querySelector(".error-message");
      input.classList.remove("error");

      if (errorDiv) {
        errorDiv.remove();
      }
    }

    function validateInput(input) {
      const validation = validations[input.name];
      if (validation && input.value.trim()) {
        const result = validation(input.value.trim());
        if (!result.isValid) {
          showError(input, result.message);
          return false;
        } else {
          removeError(input);
          return true;
        }
      }
      return true;
    }

    function validateForm() {
      let isValid = true;
      inputs.forEach((input) => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });
      return isValid;
    }

    // מאזיני אירועים לשדות
    inputs.forEach((input) => {
      // בדיקה רק בעת יציאה מהשדה
      input.addEventListener("blur", () => {
        if (input.value.trim()) {
          validateInput(input);
        }
      });

      // הסרת שגיאות בעת כניסה לשדה
      input.addEventListener("focus", () => {
        removeError(input);
      });
    });

    // טיפול בשליחת הטופס
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (validateForm()) {
        submitBtn.disabled = true;
        submitBtn.textContent = "שולח...";

        emailjs
          .sendForm(form.dataset.serviceId, form.dataset.templateId, form)
          .then(
            function (response) {
              console.log("SUCCESS!", response.status, response.text);
              alert("הטופס נשלח בהצלחה!");
              form.reset();
              inputs.forEach(removeError);
            },
            function (error) {
              console.log("FAILED...", error);
              alert("אירעה שגיאה בשליחת הטופס: " + error.text);
            }
          )
          .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = "שליחה";
          });
      }
    });
  } else {
    setTimeout(initEmailJS, 1000);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEmailJS);
} else {
  initEmailJS();
}




