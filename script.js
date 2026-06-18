displayFavourites();
displaySunriseSunset();
updateDateTime();
setInterval(updateDateTime, 1000);

navigator.geolocation.getCurrentPosition(locationSuccess, () => {
  fetchWeatherData("Karachi");
});

async function fetchAPI(BASE_URL, customErrorMessage = "Data load nhi horha") {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error(customErrorMessage);
    const data = await response.json();
    return data;
  } catch (error) {
    showToast("Error!", error.message, "❌", "error");
    console.error(`Error Details: ${error}`);
    return null;
  }
}

let debounceTimer;
const searchWeather = document.getElementById("searchInput");

searchWeather.addEventListener("input", (event) => {
  const cityName = event.target.value.trim();
  if (cityName.length === 0) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchWeatherData(cityName);
  }, 1000);
});

async function fetchWeatherData(city) {
  document.getElementById("weatherSkeleton")?.classList.remove("hidden");
  document.getElementById("weatherContent")?.classList.add("hidden");
  document.getElementById("chartSkeleton")?.classList.remove("hidden");
  searchWeather.disabled = true;
  searchWeather.placeholder = "Loading...";

  showToast("Searching...", `Looking up weather for ${city}`, "🔍", "info");

  const url = `${window.CONFIG.BASE_URL}/forecast.json?key=${window.CONFIG.API_KEY}&q=${city}&days=7&aqi=no&alerts=no`;
  const weatherData = await fetchAPI(url, "City Not Found");

  searchWeather.disabled = false;
  searchWeather.placeholder = "Search...";

  if (!weatherData) return;

  document.getElementById("cardCity").innerText = weatherData.location.name;

  const localFormattedTime = new Date(weatherData.location.localtime);
  document.getElementById("cardDate").innerText =
    localFormattedTime.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const icon = weatherData.current.condition.icon;
  document.getElementById("weather-icon").innerHTML =
    `<img src="https:${icon}">`;
  document.getElementById("cardTemp").innerText =
    Math.round(weatherData.current.temp_c) + "°C";
  document.getElementById("cardCondition").innerText =
    weatherData.current.condition.text;
  document.getElementById("cardWind").innerText =
    weatherData.current.wind_kph + " km/h";
  document.getElementById("cardHumidity").innerText =
    weatherData.current.humidity + " %";

  document.getElementById("weatherSkeleton")?.classList.add("hidden");
  document.getElementById("weatherContent")?.classList.remove("hidden");
  document.getElementById("chartSkeleton")?.classList.add("hidden");

  const weeklyForecast = document.getElementById("forecastStrip");
  weeklyForecast.innerHTML = "";

  weatherData.forecast.forecastday.forEach((eachDay) => {
    const dayDate = new Date(eachDay.date);
    const weekdayName = dayDate.toLocaleDateString("en-US", {
      weekday: "short",
    });
    const dayNumber = dayDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

    weeklyForecast.innerHTML += `
      <div class="theme-card shrink-0 flex flex-col items-center justify-between bg-gradient-to-b from-[#252650] to-[#1e1f42] border border-slate-200/20 dark:border-dark-border rounded-2xl p-4 min-w-[110px] sm:min-w-[120px] transition-all duration-300 hover:scale-105 hover:shadow-glow group cursor-pointer">
        <div class="text-center">
          <p class="text-white font-bold text-sm tracking-wide">${weekdayName}</p>
          <p class="text-dark-muted text-[10px] font-medium mt-0.5">${dayNumber}</p>
        </div>
        <div class="my-3 p-1.5 bg-white/5 rounded-xl border border-white/10 group-hover:bg-indigo-600/20 transition-colors duration-300">
          <img src="https:${eachDay.day.condition.icon}" alt="${eachDay.day.condition.text}" class="w-10 h-10 object-contain" title="${eachDay.day.condition.text}">
        </div>
        <div class="w-full flex flex-col gap-0.5 text-center pt-2 border-t border-white/5">
          <div class="flex justify-between items-center px-1 text-[11px]">
            <span class="text-red-400 font-medium">Hi</span>
            <span class="text-white font-bold">${Math.round(eachDay.day.maxtemp_c)}°</span>
          </div>
          <div class="flex justify-between items-center px-1 text-[11px]">
            <span class="text-blue-400 font-medium">Lo</span>
            <span class="text-dark-muted font-semibold">${Math.round(eachDay.day.mintemp_c)}°</span>
          </div>
        </div>
      </div>
    `;
  });

  createHourlyChart(weatherData);
  showToast(
    "Data Updated",
    `${weatherData.location.name} weather loaded!`,
    "🌤️",
    "success",
  );
}

let hourlyChart;

function createHourlyChart(weatherData) {
  const ctx = document.getElementById("hourlyChart");
  const temps = weatherData.forecast.forecastday[0].hour.map(
    (item) => item.temp_c,
  );
  const hours = weatherData.forecast.forecastday[0].hour.map(
    (item) => item.time.split(" ")[1],
  );

  if (hourlyChart) hourlyChart.destroy();

  hourlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [
        {
          label: "Temperature °C",
          data: temps,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function locationSuccess(position) {
  const { latitude: lat, longitude: lon } = position.coords;
  fetchWeatherData(`${lat}, ${lon}`);
}

function locationError() {
  showToast(
    "Access Denied",
    "Location permission nahi mili. Please check settings.",
    "❌",
    "error",
  );
}

const locationBtn = document.getElementById("geo-btn");
locationBtn.addEventListener("click", () => {
  showToast(
    "Fetching Location",
    "Aap ki location maloom ki ja rahi hai...",
    "🛰️",
    "info",
  );
  navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
});

const heartBtn = document.getElementById("heartBtn");
heartBtn.addEventListener("click", () => addToFavourites());

function addToFavourites() {
  const cityName = document.getElementById("cardCity").innerText;
  let favouriteArray = JSON.parse(
    localStorage.getItem("favouriteCities") || "[]",
  );

  if (favouriteArray.includes(cityName)) {
    showToast(
      "Already Added",
      `${cityName} already in favourites.`,
      "⚠️",
      "warning",
    );
    return;
  }

  favouriteArray.push(cityName);
  localStorage.setItem("favouriteCities", JSON.stringify(favouriteArray));
  showToast("Success!", `${cityName} added to favourites`, "✅", "success");

  displayFavourites();
  displaySunriseSunset();
}

function removeFavourite(cityName) {
  let favouriteArray = JSON.parse(
    localStorage.getItem("favouriteCities") || "[]",
  );
  favouriteArray = favouriteArray.filter((city) => city !== cityName);
  localStorage.setItem("favouriteCities", JSON.stringify(favouriteArray));
  showToast("Removed", `${cityName} removed from favourites`, "🗑️", "warning");

  displayFavourites();
  displaySunriseSunset();
}

async function displayFavourites() {
  const favCities = document.getElementById("favCity");
  favCities.innerHTML = "";

  const favouriteArray = JSON.parse(
    localStorage.getItem("favouriteCities") || "[]",
  );

  for (const city of favouriteArray) {
    const url = `${window.CONFIG.BASE_URL}/forecast.json?key=${window.CONFIG.API_KEY}&q=${city}`;
    const data = await fetchAPI(url, `Favourite city ${city} load nahi hua`);
    if (!data) continue;

    favCities.innerHTML += `
      <div onclick="fetchWeatherData('${city}')" class="mx-4 mb-3 rounded-2xl p-4 tokyo-card theme-text text-white flex items-center justify-between cursor-pointer">
        <div class="flex flex-col gap-2 text-sm">
          <div class="flex items-center gap-3">
            <span>💨 Wind</span>
            <div class="w-px h-4 bg-white/30"></div>
            <span class="font-semibold">${data.current.wind_kph} km/h</span>
          </div>
          <div class="flex items-center gap-3">
            <span>💧 Hum</span>
            <div class="w-px h-4 bg-white/30"></div>
            <span class="font-semibold">${data.current.humidity} %</span>
          </div>
        </div>
        <div class="text-right flex flex-col items-end gap-1">
          <button
            onclick="event.stopPropagation(); removeFavourite('${city}')"
            class="text-red-400 hover:scale-125 transition-transform text-lg"
            title="Remove from favourites"
          ><i class="fa-solid fa-heart"></i></button>
          <p class="text-xs">${city}</p>
          <p class="font-display font-bold text-3xl">${data.current.temp_c}°</p>
        </div>
      </div>
    `;
  }
}

async function displaySunriseSunset() {
  const listContainer = document.getElementById("sunriseSunsetList");
  listContainer.innerHTML = "";

  const favouriteArray = JSON.parse(
    localStorage.getItem("favouriteCities") || "[]",
  );

  if (favouriteArray.length === 0) {
    listContainer.innerHTML = `<p class="text-xs text-dark-muted text-center py-4">No favourite cities added yet.</p>`;
    return;
  }

  for (let i = 0; i < favouriteArray.length; i++) {
    const city = favouriteArray[i];
    const url = `${window.CONFIG.BASE_URL}/forecast.json?key=${window.CONFIG.API_KEY}&q=${city}&days=1`;
    const data = await fetchAPI(url, `${city} astro data load nahi hua`);
    if (!data) continue;

    const sunrise = data.forecast.forecastday[0].astro.sunrise;
    const sunset = data.forecast.forecastday[0].astro.sunset;

    if (i < 2) {
      listContainer.innerHTML += `
        <div class="theme-card2 bg-dark-card2 border border-dark-border rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition-colors" onclick="fetchWeatherData('${city}')">
          <div class="flex items-center gap-1.5 theme-text text-white text-sm font-medium mb-3">
            <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            </svg>
            ${city}
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">☀️</span>
              <div>
                <p class="text-dark-muted text-xs">Sunrise</p>
                <p class="theme-text text-white font-semibold text-sm">${sunrise}</p>
              </div>
            </div>
            <div class="flex-1 h-px bg-dark-border"></div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🌙</span>
              <div>
                <p class="text-dark-muted text-xs">Sunset</p>
                <p class="theme-text text-white font-semibold text-sm">${sunset}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      listContainer.innerHTML += `
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between px-1 py-1 cursor-pointer hover:bg-white/5 rounded transition-colors" onclick="fetchWeatherData('${city}')">
            <div class="flex items-center gap-1.5 text-dark-muted text-xs font-medium">
              <svg class="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              </svg>
              ${city}
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="flex items-center gap-1 text-dark-muted"><span class="text-base">☀️</span> ${sunrise}</span>
              <span class="flex items-center gap-1 text-dark-muted"><span class="text-base">🌙</span> ${sunset}</span>
            </div>
          </div>
          <div class="h-px bg-dark-border mx-1"></div>
        </div>
      `;
    }
  }
}

function updateDateTime() {
  const now = new Date();
  document.getElementById("currentTime").innerText = now.toLocaleTimeString();
  document.getElementById("currentDate").innerText = now.toDateString();

  const hour = now.getHours();
  let greetingText, greetingEmoji;

  if (hour >= 5 && hour < 12) {
    greetingText = "Good Morning!";
    greetingEmoji = "☀️";
  } else if (hour >= 12 && hour < 17) {
    greetingText = "Good Afternoon!";
    greetingEmoji = "🌤️";
  } else if (hour >= 17 && hour < 21) {
    greetingText = "Good Evening!";
    greetingEmoji = "🌆";
  } else {
    greetingText = "Good Night!";
    greetingEmoji = "🌙";
  }

  document.getElementById("greeting").innerHTML =
    `${greetingEmoji} ${greetingText}`;
}

function showToast(title, description, icon, type) {
  const typeClasses = {
    success: "bg-green-600 border-green-700 text-white",
    error: "bg-red-600 border-red-700 text-white",
    info: "bg-blue-600 border-blue-700 text-white",
    warning: "bg-amber-500 border-amber-600 text-white",
  };

  const toastDiv = document.createElement("div");
  toastDiv.className = `p-4 rounded-xl border shadow-lg flex items-start gap-3 transition-all duration-300 ${typeClasses[type]}`;
  toastDiv.innerHTML = `
    <div class="text-xl">${icon}</div>
    <div class="flex flex-col gap-0.5">
      <h4 class="font-bold text-sm">${title}</h4>
      <p class="text-xs opacity-90">${description}</p>
    </div>
  `;

  document.getElementById("toast-container").appendChild(toastDiv);
  setTimeout(() => toastDiv.remove(), 3000);
}

const lightBtn = document.getElementById("lightBtn");
const darkBtn = document.getElementById("darkBtn");
const appBody = document.getElementById("appBody");
const mainWeatherCard = document.getElementById("mainWeatherCard");

function updateThemeButtons(isDark) {
  if (isDark) {
    darkBtn.classList.add("bg-indigo-600", "text-white");
    darkBtn.classList.remove("text-dark-muted");
    lightBtn.classList.remove("bg-white", "text-amber-500", "shadow-sm");
    lightBtn.classList.add("text-yellow-400");
  } else {
    lightBtn.classList.add("bg-white", "text-amber-500", "shadow-sm");
    lightBtn.classList.remove("text-yellow-400");
    darkBtn.classList.remove("bg-indigo-600", "text-white");
    darkBtn.classList.add("text-dark-muted");
  }
}

lightBtn.addEventListener("click", () => {
  document.documentElement.classList.remove("dark");
  appBody.classList.remove("dark", "bg-dark-bg");
  appBody.classList.add("bg-slate-50", "text-slate-900");
  mainWeatherCard.classList.remove("main-card-dark");
  mainWeatherCard.classList.add("main-card-light");
  updateThemeButtons(false);
  showToast("Theme Changed", "Light mode activated", "☀️", "info");
});

darkBtn.addEventListener("click", () => {
  document.documentElement.classList.add("dark");
  appBody.classList.add("dark", "bg-dark-bg");
  appBody.classList.remove("bg-slate-50", "text-slate-900");
  mainWeatherCard.classList.remove("main-card-light");
  mainWeatherCard.classList.add("main-card-dark");
  updateThemeButtons(true);
  showToast("Theme Changed", "Dark mode activated", "🌙", "info");
});
