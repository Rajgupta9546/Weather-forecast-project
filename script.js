const API_KEY =  '08e9ae99e36f464299d237231fa3e081';  
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const recentDropdown = document.getElementById("recentDropdown");
const errorBox = document.getElementById("errorBox");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const weatherIcon = document.getElementById("weatherIcon");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const alertBox = document.getElementById("alertBox");

const toggleUnit = document.getElementById("toggleUnit");

let isCelsius = true;

searchBtn.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city === "") {
        showError("Please enter a city name");
        return;
    }
    fetchWeather(city);
    saveRecent(city);
});

locationBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetchWeatherByCoords(lat, lon);
    }, () => {
        showError("Location access denied");
    });
});

recentDropdown.addEventListener("change", () => {
    const city = recentDropdown.value;
    if (city) fetchWeather(city);
});

toggleUnit.addEventListener("click", () => {
    isCelsius = !isCelsius;
    updateTemperature();
});

function fetchWeather(city) {
    clearUI();
    fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    )
        .then(res => {
            if (!res.ok) throw new Error("City not found");
            return res.json();
        })
        .then(data => {
            displayCurrentWeather(data);
            fetchForecast(data.coord.lat, data.coord.lon);
        })
        .catch(() => showError("Invalid city name"));
}

function fetchWeatherByCoords(lat, lon) {
    fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    )
        .then(res => res.json())
        .then(data => {
            displayCurrentWeather(data);
            fetchForecast(lat, lon);
        });
}

function displayCurrentWeather(data) {
    cityName.textContent = data.name;
    temperature.dataset.celsius = data.main.temp;
    updateTemperature();

    condition.textContent = data.weather[0].description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

    humidity.textContent = data.main.humidity;
    wind.textContent = data.wind.speed;

    applyWeatherBackground(data.weather[0].main);
    checkAlert(data.main.temp);
}

function updateTemperature() {
    let tempC = parseFloat(temperature.dataset.celsius);
    if (isCelsius) {
        temperature.textContent = tempC.toFixed(1) + "°C";
        toggleUnit.textContent = "Switch to °F";
    } else {
        let tempF = tempC * 1.8 + 32;
        temperature.textContent = tempF.toFixed(1) + "°F";
        toggleUnit.textContent = "Switch to °C";
    }
}

function fetchForecast(lat, lon) {
    fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    )
        .then(res => res.json())
        .then(data => displayForecast(data.list));
}

function displayForecast(list) {
    const container = document.getElementById("forecastContainer");
    container.innerHTML = "";

    const filtered = list.filter(item => item.dt_txt.includes("12:00:00"));

    filtered.forEach(day => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h3>${day.dt_txt.split(" ")[0]}</h3>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
            <p>Temp: ${day.main.temp}°C</p>
            <p>Wind: ${day.wind.speed} km/h</p>
            <p>Humidity: ${day.main.humidity}%</p>
        `;

        container.appendChild(card);
    });
}

function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    setTimeout(() => errorBox.classList.add("hidden"), 3000);
}

function checkAlert(temp) {
    if (temp > 40) {
        alertBox.textContent = "🔥 Extreme Temperature Alert!";
        alertBox.classList.remove("hidden");
    } else {
        alertBox.classList.add("hidden");
    }
}

function applyWeatherBackground(condition) {
    if (condition.includes("Rain")) {
        document.body.style.background = "linear-gradient(#4a90e2, #1c3f74)";
    } else {
        document.body.style.background = "linear-gradient(#82c0ff, #d7eaff)";
    }
}

function saveRecent(city) {
    let recent = JSON.parse(localStorage.getItem("recentCities") || "[]");
    if (!recent.includes(city)) {
        recent.push(city);
        localStorage.setItem("recentCities", JSON.stringify(recent));
        loadRecent();
    }
}

function loadRecent() {
    let recent = JSON.parse(localStorage.getItem("recentCities") || "[]");
    if (recent.length === 0) {
        recentDropdown.classList.add("hidden");
        return;
    }

    recentDropdown.innerHTML = "<option>Select recent city</option>";
    recent.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        recentDropdown.appendChild(opt);
    });

    recentDropdown.classList.remove("hidden");
}

function clearUI() {
    errorBox.classList.add("hidden");
    alertBox.classList.add("hidden");
}

loadRecent();
