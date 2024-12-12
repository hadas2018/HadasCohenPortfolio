
class ShoppingCart {
  constructor() {
    this.products =
      JSON.parse(localStorage.getItem("cartProducts")) || [];
    this.form = document.getElementById("product-form");
    this.nameInput = document.getElementById("product-name");
    this.priceInput = document.getElementById("product-price");
    this.quantityInput = document.getElementById("product-quantity");
    this.addButton = document.getElementById("add-button");
    this.list = document.getElementById("product-list");
    this.totalPriceElement = document.getElementById("totalPrice");
    this.clearBtn = document.getElementById("clear-list");
    this.shareBtn = document.getElementById("share-whatsapp");

    this.initializeEventListeners();
    this.render();
    this.initializeToastr();
  }

  initializeToastr = () => {
    toastr.options = {
      closeButton: true,
      positionClass: "toast-top-right",
      rtl: true,
      closeHtml:
        '<button class="toast-close-button" style="left: 5px; right: auto;">×</button>',
    };
  };

  initializeEventListeners = () => {
    // בדיקת תקינות הטופס בכל שינוי
    this.form.addEventListener("input", () => {
      this.validateForm();
    });

    // הוספת מאזין לעיגול המחיר
    this.priceInput.addEventListener("change", (e) => {
      const price = parseFloat(e.target.value);
      if (!isNaN(price)) {
        e.target.value = (Math.round(price * 20) / 20).toFixed(2);
      }
    });

    // ניהול מעבר בין שדות עם Enter
    this.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (this.nameInput.value.trim()) {
          this.priceInput.focus();
        }
      }
    });

    this.priceInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (parseFloat(this.priceInput.value) > 0) {
          this.quantityInput.focus();
        }
      }
    });

    this.quantityInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (this.validateForm()) {
          this.addProduct();
          this.nameInput.focus();
        }
      }
    });

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (this.validateForm()) {
        this.addProduct();
        this.nameInput.focus();
      }
    });

    this.clearBtn.addEventListener("click", () => this.clearList());
    this.shareBtn.addEventListener("click", () => this.shareOnWhatsApp());
    this.list.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const index = e.target.dataset.index;
        this.removeProduct(index);
      }
    });

    // הוספת מאזין לשינוי כמות
    this.list.addEventListener("change", (e) => {
      if (e.target.classList.contains("quantity-input")) {
        const index = e.target.dataset.index;
        const newQuantity = parseInt(e.target.value);
        if (newQuantity > 0) {
          this.updateQuantity(index, newQuantity);
        } else {
          e.target.value = 1;
          toastr.warning("כמות חייבת להיות גדולה מ-0");
        }
      }
    });
  };

  validateForm = () => {
    const name = this.nameInput.value.trim();
    const price = parseFloat(this.priceInput.value);
    const quantity = parseInt(this.quantityInput.value);

    // בדיקת תקינות המחיר רק אם הוזן ערך
    if (this.priceInput.value !== "" && (price <= 0 || isNaN(price))) {
      toastr.error("יש להזין מחיר תקין");
      this.addButton.disabled = true;
      return false;
    }

    const isValid =
      name &&
      !isNaN(price) &&
      price > 0 &&
      !isNaN(quantity) &&
      quantity > 0;
    this.addButton.disabled = !isValid;
    return isValid;
  };

  addProduct = () => {
    const name = this.nameInput.value.trim();
    const price = parseFloat(this.priceInput.value);
    const quantity = parseInt(this.quantityInput.value);

    if (name && !isNaN(price) && !isNaN(quantity) && quantity > 0) {
      this.products.push({
        name,
        price,
        quantity,
        total: price * quantity,
      });
      this.saveToLocalStorage();
      this.render();
      this.form.reset();
      this.quantityInput.value = "";
      this.nameInput.focus();
    }
  };

  updateQuantity = (index, newQuantity) => {
    this.products[index].quantity = newQuantity;
    this.products[index].total = this.products[index].price * newQuantity;
    this.saveToLocalStorage();
    this.render();
  };

  removeProduct = (index) => {
    this.products.splice(index, 1);
    this.saveToLocalStorage();
    this.render();
    toastr.info("המוצר הוסר מהרשימה");
  };

  clearList = () => {
    if (this.products.length === 0) {
      toastr.warning("הרשימה כבר ריקה");
      return;
    }

    const modal = new bootstrap.Modal(
      document.getElementById("clearConfirmModal")
    );
    modal.show();

    document.getElementById("confirmClear").onclick = () => {
      this.products = [];
      this.saveToLocalStorage();
      this.render();
      modal.hide();
      toastr.success("הרשימה נמחקה בהצלחה");
    };
  };

  calculateTotal = () => {
    return this.products.reduce(
      (total, product) => total + product.total,
      0
    );
  };

  shareOnWhatsApp = () => {
    if (this.products.length === 0) {
      toastr.warning("אין מוצרים לשיתוף");
      return;
    }

    const text = `רשימת קניות:\n\n${this.products
      .map(
        (p) =>
          `*•${p.name}*\n   ${p.quantity} יח' × ₪${p.price.toFixed(
            2
          )} = ₪${p.total.toFixed(2)}`
      )
      .join("\n\n")}\n\n*סה"כ לתשלום: ₪${this.calculateTotal().toFixed(
      2
    )}*`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  saveToLocalStorage = () => {
    localStorage.setItem("cartProducts", JSON.stringify(this.products));
  };

  render = () => {
    this.list.innerHTML = this.products
      .map(
        (product, index) => `
              <tr>
                  <td>${product.name}</td>
                  <td>₪${product.price.toFixed(2)}</td>
                  <td>
                      <input type="number" 
                          class="form-control form-control-sm quantity-input" 
                          data-index="${index}" 
                          value="${product.quantity}" 
                          min="1" 
                          style="width: 80px">
                  </td>
                  <td>₪${product.total.toFixed(2)}</td>
                  <td>
                      <button class="btn btn-danger btn-sm delete-btn" data-index="${index}">
                          הסר
                      </button>
                  </td>
              </tr>
          `
      )
      .join("");

    this.totalPriceElement.textContent = this.calculateTotal().toFixed(2);

    // Update buttons state
    this.clearBtn.disabled = this.products.length === 0;
    this.shareBtn.disabled = this.products.length === 0;
  };
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  new ShoppingCart();
});
