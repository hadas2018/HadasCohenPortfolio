document.addEventListener("DOMContentLoaded", function () {
  const draggables = document.querySelectorAll(".draggable");
  const dropZone = document.querySelector(".drop-zone");
  const togglePreviewBtn = document.getElementById("togglePreview");
  const toolbar = document.querySelector(".toolbar");
  const canvas = document.querySelector(".canvas");
  let draggedElement = null;
  let isPreviewMode = false;

  const fontFamilies = [
    { value: "Rubik, sans-serif", label: "Rubik" },
    { value: "Heebo, sans-serif", label: "Heebo" },
    { value: "Assistant, sans-serif", label: "Assistant" },
    { value: "Secular One, sans-serif", label: "Secular" },
    { value: "Suez One, serif", label: "Suez" },
    { value: "Varela Round, sans-serif", label: "Varela" },
    { value: "Karantina, cursive", label: "Karantina" },
    { value: "Miriam Libre, sans-serif", label: "Miriam" },
    { value: "Open Sans, sans-serif", label: "Open Sans" },
    { value: "David Libre, serif", label: "David" },
  ];

  function sanitizeInput(input) {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
  }
  
  function validateImageUrl(url) {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return (
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname) ||
        url.startsWith("data:image/") ||
        url.startsWith("blob:")
      );
    } catch {
      return false;
    }
  }

  function handleImageError(imgElement) {
    imgElement.onerror = function () {
      this.src =
        "https://www.kids-world.org.il/wp-content/uploads/Animals_Pictures_023.jpg";
      this.alt = "תמונה חלופית";
      this.classList.add("error-image");
    };
  }

  function createFontFamilyControl(element) {
    const fontFamilyControl = document.createElement("select");
    fontFamilyControl.className = "form-select form-select-sm";

    fontFamilies.forEach((font) => {
      const option = document.createElement("option");
      option.value = font.value;
      option.textContent = font.label;
      option.style.fontFamily = font.value;
      option.className = "font-family-option";
      fontFamilyControl.appendChild(option);
    });

    fontFamilyControl.addEventListener("change", function () {
      element.style.fontFamily = this.value;
    });

    const container = document.createElement("div");
    container.className = "font-control";

    const label = document.createElement("span");
    label.textContent = "גופן: ";
    label.className = "control-label";

    container.appendChild(label);
    container.appendChild(fontFamilyControl);

    return container;
  }

  function createFontSizeControl(element) {
    const fontSizeControl = document.createElement("select");
    fontSizeControl.className = "form-select form-select-sm";

    const sizes = [
      { value: "1rem", label: "קטן" },
      { value: "1.5rem", label: "בינוני" },
      { value: "2rem", label: "גדול" },
      { value: "2.5rem", label: "גדול מאוד" },
    ];

    sizes.forEach((size) => {
      const option = document.createElement("option");
      option.value = size.value;
      option.textContent = size.label;
      fontSizeControl.appendChild(option);
    });

    fontSizeControl.value = element.style.fontSize || "1.5rem";

    fontSizeControl.addEventListener("change", function () {
      element.style.fontSize = this.value;
    });

    const container = document.createElement("div");
    container.className = "font-control";

    const label = document.createElement("span");
    label.textContent = "גודל: ";
    label.className = "control-label";

    container.appendChild(label);
    container.appendChild(fontSizeControl);

    return container;
  }

  function createWidthControl(element) {
    const widthControl = document.createElement("select");
    widthControl.className = "form-select form-select-sm";

    const widths = [
      { value: "150px", label: "150px" },
      { value: "300px", label: "300px" },
      { value: "450px", label: "450px" },
      { value: "100%", label: "100%" },
    ];

    widths.forEach((width) => {
      const option = document.createElement("option");
      option.value = width.value;
      option.textContent = width.label;
      widthControl.appendChild(option);
    });

    widthControl.value = "300px"; // ברירת מחדל

    widthControl.addEventListener("change", function () {
      element.style.maxWidth = this.value;
      element.style.width = this.value;
    });

    const container = document.createElement("div");
    container.className = "width-control";

    const label = document.createElement("span");
    label.textContent = "רוחב: ";
    label.className = "control-label";

    container.appendChild(label);
    container.appendChild(widthControl);

    return container;
  }

  function createPositionControls(wrapper, element) {
    const positionControls = document.createElement("div");
    positionControls.className = "position-controls";

    const positions = [
      { name: "ימין", align: "right" },
      { name: "מרכז", align: "center" },
      { name: "שמאל", align: "left" },
    ];

    positions.forEach((pos) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-secondary";
      btn.textContent = pos.name;

      if (element.style.textAlign === pos.align) {
        btn.classList.add("active");
      }

      btn.onclick = () => {
        positionControls
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        wrapper.dataset.align = pos.align;

        if (
          element.tagName.toLowerCase() === "button" ||
          element.tagName.toLowerCase() === "input" ||
          element.tagName.toLowerCase() === "img"
        ) {
          element.style.display = "block";
          element.style.marginRight = pos.align === "right" ? "0" : "auto";
          element.style.marginLeft = pos.align === "left" ? "0" : "auto";
          if (pos.align === "center") {
            element.style.marginRight = "auto";
            element.style.marginLeft = "auto";
          }
        } else {
          element.style.textAlign = pos.align;
        }
      };
      positionControls.appendChild(btn);
    });

    return positionControls;
  }

  function createColorControl(element) {
    const colorControl = document.createElement("div");
    colorControl.className = "color-control";

    const label = document.createElement("span");
    label.textContent = "צבע טקסט: ";
    label.className = "control-label";

    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.className = "color-picker";
    colorPicker.value = "#000000";

    colorPicker.addEventListener("change", function () {
      if (element.tagName.toLowerCase() === "button") {
        // !important כדי לדרוס את הגדרות Bootstrap
        element.style.setProperty("color", this.value, "important");
        element.classList.remove("text-dark", "text-light", "text-white");
      } else {
        element.style.color = this.value;
      }
    });

    colorControl.appendChild(label);
    colorControl.appendChild(colorPicker);
    return colorControl;
  }

  function wrapElement(element) {
    const wrapper = document.createElement("div");
    wrapper.className = "element-wrapper new";

    const controls = document.createElement("div");
    controls.className = "element-controls";

    if (["h2", "p", "button"].includes(element.tagName.toLowerCase())) {
      const fontFamilyControl = createFontFamilyControl(element);
      const fontSizeControl = createFontSizeControl(element);
      const colorControl = createColorControl(element);
      controls.appendChild(colorControl);
      controls.appendChild(fontFamilyControl);
      controls.appendChild(fontSizeControl);

      // שמירה על המחלקות המקוריות של הכפתור
      if (element.tagName.toLowerCase() === "button") {
        const originalClasses = element.className;
        element.contentEditable = true;
        element.addEventListener("blur", function () {
          this.textContent = sanitizeInput(this.textContent);
          // וידוא שהמחלקות המקוריות נשמרות
          this.className = originalClasses;
        });
      } else {
        element.contentEditable = true;
        element.addEventListener("blur", function () {
          this.textContent = sanitizeInput(this.textContent);
        });
      }
    }

    if (element.tagName.toLowerCase() === "input") {
      // הוספת בקרת גודל לשדה קלט
      const widthControl = createWidthControl(element);
      controls.appendChild(widthControl);
    }
    if (element.tagName.toLowerCase() === "img") {
      // שדה URL
      const urlControl = document.createElement("div");
      urlControl.className = "url-control mb-2";

      const urlLabel = document.createElement("span");
      urlLabel.textContent = "כתובת תמונה: ";
      urlLabel.className = "control-label";

      const urlInput = document.createElement("input");
      urlInput.type = "text";
      urlInput.className = "form-control form-control-sm";
      urlInput.placeholder = "הכנס כתובת URL של תמונה";
      urlInput.value = element.src || "";

      urlInput.addEventListener("change", function () {
        const url = this.value.trim();
        if (validateImageUrl(url)) {
          element.src = url;
        } else {
          alert("נא להזין כתובת תמונה חוקית");
        }
      });

      urlControl.appendChild(urlLabel);
      urlControl.appendChild(urlInput);
      controls.appendChild(urlControl);

      // בקרת גודל תמונה
      const sizeControl = document.createElement("div");
      sizeControl.className = "size-control mb-2";

      const widthControl = createWidthControl(element);
      sizeControl.appendChild(widthControl);
      controls.appendChild(sizeControl);

      // בקרת עיגול פינות
      const radiusControl = document.createElement("div");
      radiusControl.className = "radius-control mb-2";

      const radiusLabel = document.createElement("span");
      radiusLabel.textContent = "עיגול פינות: ";
      radiusLabel.className = "control-label";

      const radiusSelect = document.createElement("select");
      radiusSelect.className = "form-select form-select-sm";

      const radiusOptions = [
        { value: "0", label: "ללא" },
        { value: "8px", label: "מעט" },
        { value: "16px", label: "בינוני" },
        { value: "50%", label: "עיגול מלא" },
      ];

      radiusOptions.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.label;
        radiusSelect.appendChild(opt);
      });

      radiusSelect.addEventListener("change", function () {
        element.style.borderRadius = this.value;
      });

      radiusControl.appendChild(radiusLabel);
      radiusControl.appendChild(radiusSelect);

      controls.appendChild(radiusControl);

      // בקרת מסגרת
      const borderControl = document.createElement("div");
      borderControl.className = "border-control mb-2";

      const borderLabel = document.createElement("span");
      borderLabel.textContent = "מסגרת: ";
      borderLabel.className = "control-label";

      const borderSelect = document.createElement("select");
      borderSelect.className = "form-select form-select-sm";

      const borderOptions = [
        { value: "none", label: "ללא" },
        { value: "1px solid #dee2e6", label: "דקה" },
        { value: "2px solid #dee2e6", label: "בינונית" },
        { value: "4px solid #dee2e6", label: "עבה" },
      ];

      borderOptions.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.label;
        borderSelect.appendChild(opt);
      });

      borderSelect.addEventListener("change", function () {
        element.style.border = this.value;
      });

      borderControl.appendChild(borderLabel);
      borderControl.appendChild(borderSelect);

      controls.appendChild(borderControl);
    }

    const positionControls = createPositionControls(wrapper, element);
    controls.appendChild(positionControls);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "control-btn btn btn-sm btn-danger";
    deleteBtn.innerHTML =
      '<span class="btn-icon">🗑️</span><span class="btn-text">מחיקה</span>';
    deleteBtn.onclick = () => {
      if (confirm("האם למחוק את האלמנט?")) {
        wrapper.remove();
      }
    };

    controls.appendChild(deleteBtn);
    wrapper.appendChild(controls);
    wrapper.appendChild(element);

    // הסרת אנימציית הופעה לאחר שניה
    setTimeout(() => {
      wrapper.classList.remove("new");
    }, 1000);

    return wrapper;
  }

  function createNewElement(type) {
    let element;

    switch (type) {
      case "heading":
        element = document.createElement("h2");
        element.textContent = "לחץ לעריכת כותרת";
        element.className = "mb-3 font-md";
        break;

      case "text":
        element = document.createElement("p");
        element.textContent = "לחץ לעריכת טקסט";
        element.className = "mb-3";
        break;

        case "button":
          element = document.createElement("button");
          element.textContent = "לחץ לעריכת כפתור";
          element.className = "btn btn-primary mb-3";
          element.setAttribute("type", "button");
          element.setAttribute("role", "button");
          break;

      case "input":
        element = document.createElement("input");
        element.type = "text";
        element.placeholder = "שדה קלט";
        element.className = "form-control mb-3";
        element.style.maxWidth = "300px";
        break;

      case "image":
        element = document.createElement("img");
        element.src = "";
        element.alt = "תמונה";
        element.className = "img-fluid mb-3";
        element.style.maxWidth = "300px";
        handleImageError(element);
        break;

      default:
        return null;
    }

    // הגדרת יישור ברירת מחדל לימין
    element.style.textAlign = "right";
    return element;
  }

  // אירועי גרירה
  function handleDragStart(e) {
    draggedElement = this;
    e.dataTransfer.setData("text/plain", this.dataset.type);
    this.classList.add("dragging");

    // הוספת מחלקה לאזור הגרירה להדגשת האזור המותר
    dropZone.classList.add("drag-highlight");
  }

  function handleDragEnd(e) {
    draggedElement = null;
    this.classList.remove("dragging");

    // הסרת ההדגשה מאזור הגרירה
    dropZone.classList.remove("drag-highlight");
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!this.classList.contains("drag-over")) {
      this.classList.add("drag-over");
    }
  }

  function handleDragLeave(e) {
    this.classList.remove("drag-over");
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");
    const elementType = e.dataTransfer.getData("text/plain");
    const element = createNewElement(elementType);
    if (element) {
      const wrappedElement = wrapElement(element);
      this.appendChild(wrappedElement);
    }
  }
  // הוספת מאזינים
  draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", handleDragStart);
    draggable.addEventListener("dragend", handleDragEnd);
  });

  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);

  // מעבר בין מצבי תצוגה
  togglePreviewBtn.addEventListener("click", function () {
    isPreviewMode = !isPreviewMode;
    canvas.classList.toggle("preview-mode");
    toolbar.style.display = isPreviewMode ? "none" : "block";
    canvas.style.marginRight = isPreviewMode ? "0" : "280px";
    dropZone.style.border = isPreviewMode ? "none" : "2px dashed #dee2e6";
    this.textContent = isPreviewMode ? "חזרה לעריכה" : "תצוגה מקדימה";
  });

  // מניעת התנהגות ברירת מחדל של contentEditable בכפתורים
  document.addEventListener("click", function (e) {
    if (
      e.target.tagName.toLowerCase() === "button" &&
      e.target.contentEditable === "true"
    ) {
      e.preventDefault();
    }
  });
  // פונקציה לשמירת התוכן
  function saveContent() {
    const content = dropZone.innerHTML;
    try {
      localStorage.setItem("savedPage", content);
      alert("העמוד נשמר בהצלחה!");
    } catch (e) {
      alert("שגיאה בשמירת העמוד");
      console.error("Error saving:", e);
    }
  }

  // פונקציה לטעינת התוכן
  function loadContent() {
    const savedContent = localStorage.getItem("savedPage");
    if (savedContent) {
      if (
        confirm(
          "האם אתה בטוח שברצונך לטעון את העמוד השמור? פעולה זו תמחק את התוכן הנוכחי."
        )
      ) {
        dropZone.innerHTML = savedContent;

        // הפעלה מחדש של פונקציונליות הגרירה על האלמנטים הטעונים
        initDragAndDropForLoadedElements();

        alert("העמוד נטען בהצלחה!");
      }
    } else {
      alert("לא נמצא עמוד שמור");
    }
  }

  // פונקציה להפעלה מחדש של פונקציונליות הגרירה
  function initDragAndDropForLoadedElements() {
    const loadedElements = dropZone.querySelectorAll(".element-wrapper");
    loadedElements.forEach((wrapper) => {
      // הוספת מאזיני אירועים מחדש אם נדרש
      const controls = wrapper.querySelector(".element-controls");
      if (controls) {
        const buttons = controls.querySelectorAll("button");
        buttons.forEach((button) => {
          if (button.textContent.includes("מחיקה")) {
            button.onclick = () => {
              if (confirm("האם למחוק את האלמנט?")) {
                wrapper.remove();
              }
            };
          }
        });
      }
    });
  }
  // פונקציה לשמירת גרסה חדשה
  function saveContent() {
    // יצירת דיאלוג להזנת שם הגרסה
    const dialog = document.createElement("div");
    dialog.className = "version-dialog";
    dialog.innerHTML = `
        <div class="version-dialog-content">
            <h3>שמירת גרסה חדשה</h3>
            <div class="form-group mb-3">
                <label for="versionName" class="form-label">שם הגרסה:</label>
                <input type="text" id="versionName" class="form-control" 
                       placeholder="הזן שם לגרסה (לא חובה)">
            </div>
            <div class="button-group">
                <button class="btn btn-primary" id="saveVersion">שמור</button>
                <button class="btn btn-secondary" id="cancelSave">ביטול</button>
            </div>
        </div>
    `;

    // עיצוב הדיאלוג
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    dialog.querySelector(".version-dialog-content").style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
    `;

    dialog.querySelector(".button-group").style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
    `;

    // פונקציה לשמירת הגרסה
    function saveVersion(versionName) {
      let versions = JSON.parse(localStorage.getItem("pageVersions") || "[]");

      const newVersion = {
        id: Date.now(),
        name: versionName.trim() || `גרסה ${versions.length + 1}`,
        date: new Date().toLocaleString("he-IL"),
        content: dropZone.innerHTML,
      };

      versions.push(newVersion);

      try {
        localStorage.setItem("pageVersions", JSON.stringify(versions));
        alert(
          `הגרסה "${newVersion.name}" נשמרה בהצלחה!\nתאריך: ${newVersion.date}`
        );
      } catch (e) {
        alert("שגיאה בשמירת הגרסה");
        console.error("Error saving:", e);
      }
    }

    // הוספת מאזינים לכפתורים
    dialog.querySelector("#saveVersion").onclick = () => {
      const versionName = dialog.querySelector("#versionName").value;
      saveVersion(versionName);
      document.body.removeChild(dialog);
    };

    dialog.querySelector("#cancelSave").onclick = () => {
      document.body.removeChild(dialog);
    };

    document.body.appendChild(dialog);
  }

  // פונקציה לטעינת גרסה
  function loadContent() {
    const versions = JSON.parse(localStorage.getItem("pageVersions") || "[]");

    if (versions.length === 0) {
      alert("לא נמצאו גרסאות שמורות");
      return;
    }

    const dialog = document.createElement("div");
    dialog.className = "version-dialog";
    dialog.innerHTML = `
        <div class="version-dialog-content">
            <h3>בחר גרסה לטעינה:</h3>
            <div class="version-list">
                ${versions
                  .map(
                    (version, index) => `
                    <div class="version-item">
                        <button class="btn btn-outline-primary mb-2 w-100 text-end" data-version-id="${version.id}">
                            <strong>${version.name}</strong><br>
                            <small class="text-muted">${version.date}</small>
                        </button>
                        <button class="btn btn-danger btn-sm delete-version" data-version-id="${version.id}">
                            🗑️ מחק
                        </button>
                    </div>
                `
                  )
                  .join("")}
            </div>
            <button class="btn btn-secondary mt-3" id="closeDialog">סגור</button>
        </div>
    `;

    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    dialog.querySelector(".version-dialog-content").style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;

    // מחיקת גרסה
    function deleteVersion(versionId) {
      if (confirm("האם אתה בטוח שברצונך למחוק גרסה זו?")) {
        let versions = JSON.parse(localStorage.getItem("pageVersions") || "[]");
        versions = versions.filter((v) => v.id !== versionId);
        localStorage.setItem("pageVersions", JSON.stringify(versions));
        document.body.removeChild(dialog);
        loadContent(); // טעינה מחדש של חלון הגרסאות
      }
    }

    // הוספת מאזינים לכפתורים
    dialog.querySelectorAll("[data-version-id]").forEach((button) => {
      if (button.classList.contains("delete-version")) {
        button.onclick = () => {
          const versionId = parseInt(button.dataset.versionId);
          deleteVersion(versionId);
        };
      } else {
        button.onclick = () => {
          const versionId = parseInt(button.dataset.versionId);
          const version = versions.find((v) => v.id === versionId);

          if (
            confirm(
              "האם אתה בטוח שברצונך לטעון גרסה זו? פעולה זו תחליף את התוכן הנוכחי."
            )
          ) {
            dropZone.innerHTML = version.content;
            initDragAndDropForLoadedElements();
            document.body.removeChild(dialog);
            alert("הגרסה נטענה בהצלחה!");
          }
        };
      }
    });

    dialog.querySelector("#closeDialog").onclick = () => {
      document.body.removeChild(dialog);
    };

    document.body.appendChild(dialog);
  }

  // CSS להוספה
  const style = document.createElement("style");
  style.textContent = `
    .version-dialog .version-list {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 1rem;
    }
    
    .version-dialog .version-item {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .version-dialog .version-item button:first-child {
        flex-grow: 1;
    }
    
    .version-dialog .delete-version {
        padding: 0.25rem 0.5rem;
    }
`;
  document.head.appendChild(style);

  // הוספת מאזינים לכפתורים בממשק
  document.getElementById("saveButton").addEventListener("click", saveContent);
  document.getElementById("loadButton").addEventListener("click", loadContent);
});
