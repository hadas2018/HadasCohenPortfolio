
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




