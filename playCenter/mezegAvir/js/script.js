      // קונפיגורציה בסיסית
      const CONFIG = {
        API_KEY: "c5c166cbacbe2237d9aed7fc3ca92817",
        BASE_URL: "https://api.openweathermap.org/data/2.5",
        TIMEZONE: "Asia/Jerusalem",
        FORECAST_DAYS: 5,
        HISTORY_DAYS: 365,
        ICON_BASE_URL: "https://openweathermap.org/img/wn",
      };

      // מחלקת ניהול תאריכים
      class DateManager {
        #today;
        #datePicker;

        constructor() {
          this.#today = new Date(
            new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE })
          );
          this.#datePicker = document.querySelector("#datePicker");
          this.#initDatePicker();
        }

        #initDatePicker() {
          const maxDate = new Date(this.#today);
          maxDate.setDate(this.#today.getDate() + CONFIG.FORECAST_DAYS);

          const minDate = new Date(this.#today);
          minDate.setDate(this.#today.getDate() - CONFIG.HISTORY_DAYS);

          this.#datePicker.value = this.#today.toLocaleDateString("en-CA");
          this.#datePicker.max = maxDate.toISOString().split("T")[0];
          this.#datePicker.min = minDate.toISOString().split("T")[0];

          this.#datePicker.addEventListener("change", () => {
            this.updateSelectedDate();
            WeatherManager.refreshWeather();
          });
        }

        formatDate = (date) =>
          date.toLocaleDateString("he-IL", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
            timeZone: CONFIG.TIMEZONE,
          });

        formatTime = (timestamp) =>
          new Date(timestamp * 1000).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: CONFIG.TIMEZONE,
          });

        updateSelectedDate = () => {
          document.querySelector(
            "#selected-date"
          ).textContent = `מזג אוויר עבור: ${this.formatDate(
            new Date(this.#datePicker.value)
          )}`;
        };

        displayCurrentDate = () => {
          document.querySelector("#current-date").textContent = this.formatDate(
            this.#today
          );
        };

        getSelectedDate = () => new Date(this.#datePicker.value);

        isSameDay = (date1, date2) =>
          date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate();
      }

      // מחלקת API למזג אוויר
      class WeatherAPI {
        static async fetchWeather(city, date) {
          const israelToday = new Date(
            new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE })
          );
          israelToday.setHours(0, 0, 0, 0);
          date.setHours(0, 0, 0, 0);

          const params = new URLSearchParams({
            q: city,
            appid: CONFIG.API_KEY,
            units: "metric",
            lang: "he",
          });

          let endpoint = "/weather";

          if (date > israelToday) {
            endpoint = "/forecast";
          } else if (date < israelToday) {
            params.append("dt", Math.floor(date.getTime() / 1000));
          }

          const response = await fetch(
            `${CONFIG.BASE_URL}${endpoint}?${params}`
          );
          if (!response.ok) throw new Error("City not found");

          return response.json();
        }
      }

      // מחלקת UI למזג אוויר
      class WeatherUI {
        static #templates = {
          loading: () => `
      <div class="spinner-border text-primary">
        <span>טוען...</span>
      </div>
    `,

          error: (message) => `
      <div class="alert alert-danger">
        ${this.#getErrorMessage(message)}
      </div>
    `,

          weatherStat: (title, value, icon, className = "col-6") => `
      <div class="${className}">
        <div class="card bg-light weather-stat-card">
          <div class="card-body">
            <span class="material-icons-round weather-stat-icon">${icon}</span>
            <h6>${title}</h6>
            <p class="mb-0">${value}</p>
          </div>
        </div>
      </div>
    `,
        };

        static #getErrorMessage(message) {
          const messages = {
            "City not found": "העיר לא נמצאה",
            "No forecast available": "אין תחזית זמינה לתאריך הנבחר",
            default: "שגיאה בטעינת נתוני מזג האוויר",
          };
          return messages[message] || messages.default;
        }

        static showLoading() {
          document.querySelector("#weather-info").innerHTML =
            this.#templates.loading();
        }

        static showError(message) {
          document.querySelector("#weather-info").innerHTML =
            this.#templates.error(message);
        }

        static showWeather(data, isForecast = false) {
          const weatherData = this.#extractWeatherData(data, isForecast);
          document.querySelector("#weather-info").innerHTML =
            this.#generateWeatherHTML(weatherData);
        }

        static #extractWeatherData(data, isForecast) {
          if (isForecast) {
            const targetDate = document.querySelector("#datePicker").value;
            const forecast = data.list.find((item) =>
              item.dt_txt.startsWith(targetDate)
            );
            if (!forecast) throw new Error("No forecast available");

            return {
              name: data.city.name,
              sunrise: data.city.sunrise,
              sunset: data.city.sunset,
              ...this.#extractWeatherDetails(forecast),
            };
          }

          return {
            name: data.name,
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset,
            ...this.#extractWeatherDetails(data),
          };
        }

        static #extractWeatherDetails(data) {
          return {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
          };
        }

        static #generateWeatherHTML(data) {
          const dateManager = WeatherManager.dateManager;

          return `
      <h3 class="mb-3">${data.name}</h3>
      <div class="weather-icon-container mb-3">
        <img 
          src="${CONFIG.ICON_BASE_URL}/${data.icon}@4x.png" 
          alt="${data.description}"
          class="main-weather-icon"
        />
      </div>
      <h2 class="mb-3">${data.temp}°C</h2>
      <p class="h5 mb-3">${data.description}</p>
      
      <div class="sun-times mb-4">
        <div class="sun-time">
          <span class="material-icons-round">wb_sunny</span>
          <h6>זריחה</h6>
          <p class="mb-0">${dateManager.formatTime(data.sunrise)}</p>
        </div>
        <div class="sun-time">
          <span class="material-icons-round">wb_twilight</span>
          <h6>שקיעה</h6>
          <p class="mb-0">${dateManager.formatTime(data.sunset)}</p>
        </div>
      </div>
      
      <div class="row mt-4">
        ${this.#templates.weatherStat(
          "מרגיש כמו",
          `${data.feelsLike}°C`,
          "device_thermostat"
        )}
        ${this.#templates.weatherStat(
          " רמת הלחות",
          `${data.humidity}%`,
          "water_drop"
        )}
        ${this.#templates.weatherStat(
          "מהירות רוח",
          `${data.windSpeed} מטר/שניה`,
          "air",
          "col-12 mt-3"
        )}
      </div>
    `;
        }
      }

      // מחלקת מנהל מזג האוויר הראשית
      class WeatherManager {
        static dateManager = new DateManager();

        static async init() {
          this.dateManager.displayCurrentDate();
          this.dateManager.updateSelectedDate();

          document
            .querySelector("#weatherForm")
            .addEventListener("submit", async (e) => {
              e.preventDefault();
              await this.refreshWeather();
            });

          document
            .querySelector("#clearInput")
            .addEventListener("click", () => {
              document.querySelector("#weatherForm").reset();
              document.querySelector("#datePicker").value =
                new Date().toLocaleDateString("en-CA");
              document.querySelector("#weather-info").innerHTML =
                '<div class="alert alert-info">אנא הזן שם עיר לקבלת מזג האוויר</div>';
              document.querySelector("#cityInput").focus();
            });
        }

        static async refreshWeather() {
          const city = document.querySelector("#cityInput").value.trim();
          if (!city) return;

          WeatherUI.showLoading();

          try {
            const selectedDate = this.dateManager.getSelectedDate();
            const data = await WeatherAPI.fetchWeather(city, selectedDate);

            const israelToday = new Date(
              new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE })
            );
            israelToday.setHours(0, 0, 0, 0);

            WeatherUI.showWeather(data, selectedDate > israelToday);
          } catch (error) {
            WeatherUI.showError(error.message);
          }
        }
      }

      // אתחול האפליקציה
      document.addEventListener("DOMContentLoaded", () =>
        WeatherManager.init()
      );
  
