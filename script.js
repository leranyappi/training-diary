"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescr() {
    //prettier-ignore
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December",];
    this.descr = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescr();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescr();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  _workouts = [];
  _map;
  _mapEvent;
  constructor() {
    // Запуск логики приложения
    this._getPosition();

    //получение данных из локального хранилища
    this._getLocalStorage();

    // Обработчик события который вызывает метод __newWorkout.
    form.addEventListener("submit", this._newWorkout.bind(this));

    // Обработчик события который вызывает метод _toogleField.
    inputType.addEventListener("change", this._toggleField);

    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }
  // Метод запроса данных о местоположении от пользовател. В случае успеха, запускается функция _loadMap
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Вы не предоставили доступ к своей геопозиции");
        }
      );
  }

  // Метод загрузки карты на страницу, в случае положительного ответа о предоставлении своих координат
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this._map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);
    //Обработчик события нажатия по карте, который запустит метод _showForm
    this._map.on("click", this._showForm.bind(this));
    this._workouts.forEach((work) => {
      this._renderWorkMarker(work);
    });
  }
  //Метод который отобразит форму при клике по карте
  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  // Метод который переключает типы тренировок
  _toggleField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  // Метод который установит маркер на карту
  _newWorkout(e) {
    e.preventDefault();

    const validInput = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    //данные с формы
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._mapEvent.latlng;
    let workout;
    //пробежка
    if (type === "running") {
      const cadence = +inputCadence.value;
      //валидация данных
      if (
        /*!Number.isFinite(distance)||!Number.isFinite(duration)||!Number.isFinite(cadence)*/
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert("Заполните все поля корректными данными");
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //велосипед
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      //валидация данных
      if (
        /*!Number.isFinite(distance)||!Number.isFinite(duration)||!Number.isFinite(elevation)*/
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert("Заполните все поля корректными данными");
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //добавление в массив
    this._workouts.push(workout);
    //отображение маркера тренеровки
    this._renderWorkMarker(workout);

    this._renderWorkout(workout);
    //очистить поля и спрятать форму
    this._hideForm();

    this._setLocalStorage();
  }

  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";
    form.classList.add("hidden");
  }
  _renderWorkMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "mark-popup",
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}${workout.descr}`
      )
      .openPopup();
  }
  //отображение списка тренировок
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.descr}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">км</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">мин</span>
    </div>`;
    if (workout.type === "running") {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">мин/км</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">шаг</span>
    </div> </li> `;
    }
    if (workout.type === "cycling") {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">км/час</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">м</span>
    </div> </li> `;
    }

    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    const workoutEL = e.target.closest(".workout");
    console.log(workoutEL);
    if (!workoutEL) return;

    const workout = this._workouts.find(
      (work) => work.id === workoutEL.dataset.id
    );
    this._map.setView(workout.coords, 15, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this._workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    console.log(data);
    if (!data) return;
    this._workouts = data;
    this._workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

//запуск приложения
const app = new App();
