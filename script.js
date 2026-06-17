displayFavourites();
displaySunriseSunset();
async function fetchAPI(BASE_URL, customeErrorMessage = "Data load nhi horha") {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error(customeErrorMessage);
    }
    const data = await response.json();
    // console.log(data);
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
  const url = `${window.CONFIG.BASE_URL}/forecast.json?key=${window.CONFIG.API_KEY}&q=${city}&days=5&aqi=no&alerts=no`;

  const weatherData = await fetchAPI(url, `"City Not Found"`);

  if (weatherData) {
    showToast(
      "Data Updated",
      `${weatherData.location.name} Weather is loading.`,
      "🌤️",
      "success",
    );

    console.log("Data mil gya he: ", weatherData);

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
        hour12: "true",
      });

    const icon = weatherData.current.condition.icon;
    document.getElementById("weather-icon").innerHTML =
      `<img src=https:${icon}>`;

    document.getElementById("cardTemp").innerText =
      Math.round(weatherData.current.temp_c) + "°C";

    document.getElementById("cardCondition").innerText =
      weatherData.current.condition.text;

    document.getElementById("cardWind").innerText =
      weatherData.current.wind_kph + " km/h";

    document.getElementById("cardHumidity").innerText =
      weatherData.current.humidity + " %";

    const weeklyForecast = document.getElementById("forecastStrip");
    weeklyForecast.innerHTML = "";

    weatherData.forecast.forecastday.forEach((eachDay) => {
      console.log(eachDay);

      const cardHTML = `
      <div
              class="theme-card shrink-0 flex flex-col items-center gap-2 bg-dark-card border border-dark-border rounded-2xl px-5 py-4 min-w-[90px]"
            >
            <img src="https:${eachDay.day.condition.icon}" alt="weather icon" class="w-8 h-8">
              <p class="theme-muted text-dark-muted text-xs font-medium">${eachDay.date}</p>
              <p class="theme-text text-white font-bold text-sm">MAX: ${eachDay.day.maxtemp_c}</p>
              <p class="theme-text text-white font-bold text-sm">MIN: ${eachDay.day.mintemp_c}</p>
            </div>
      `;

      weeklyForecast.innerHTML += cardHTML;
    });
    createHourlyChart(weatherData);
  }
}

let hourlyChart;

function createHourlyChart(weatherData) {
  const ctx = document.getElementById("hourlyChart");

  const temps = weatherData.forecast.forecastday[0].hour.map(
    (item) => item.temp_c,
  );

  console.log(temps);

  const hours = weatherData.forecast.forecastday[0].hour.map(
    (item) => item.time.split(" ")[1],
  );

  console.log(hours);

  if (hourlyChart) {
    hourlyChart.destroy();
  }

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
        legend: {
          display: false,
        },
      },
    },
  });
}
function locationSuccess(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  console.log(lat, lon);

  fetchWeatherData(`${lat}, ${lon}`);
}

function locationError(error) {
  showToast(
    "Access Denied",
    "Location permission nahi mili. Please check settings.",
    "❌",
    "error",
  );
  console.log("Access Denied");
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
heartBtn.addEventListener("click", () => {
  addToFavourites();
});

function addToFavourites() {
  const cityName = document.getElementById("cardCity").innerText;

  let currentFavourites = localStorage.getItem("favouriteCities");
  let favouriteArray = currentFavourites ? JSON.parse(currentFavourites) : [];

  if (favouriteArray.includes(cityName)) {
    showToast(
      "Already Added",
      `${cityName} Already included in favourites.`,
      "⚠️",
      "warning",
    );
    console.log("Already included in favourites");
    return;
  }

  favouriteArray.push(cityName);

  localStorage.setItem("favouriteCities", JSON.stringify(favouriteArray));

  showToast("Kamyabi!", `${cityName} added to favourites`, "✅", "success");
  console.log("LocalStorage me ab yeh save ho chuka hai:", favouriteArray);

  displayFavourites();
  displaySunriseSunset();
}

async function displayFavourites() {
  const favCities = document.getElementById("favCity");
  favCities.innerHTML = "";

  let currentFavourites = localStorage.getItem("favouriteCities");
  let favouriteArray = currentFavourites ? JSON.parse(currentFavourites) : [];

  for (const city of favouriteArray) {
    const url = `${window.CONFIG.BASE_URL}/forecast.json?key=${window.CONFIG.API_KEY}&q=${city}`;
    const data = await fetchAPI(
      url,
      `Favourite cities ${city} are not loading`,
    );
    // try {
    //   const response = await fetch(
    //     `${window.CONFIG.BASE_URL}/forecast.json?key=${window.CONFIG.API_KEY}&q=${city}`,
    //   );
    //   const data = await response.json();

    const cardHTML = `
      <div onclick="fetchWeatherData('${city}')" class="mx-4 mb-3 rounded-2xl p-4 tokyo-card text-white flex items-center justify-between cursor-pointer">
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
          <div class="text-right">
            <p class="text-xs mb-1">${city}</p>
            <p class="font-display font-bold text-3xl">${data.current.temp_c}°</p>
          </div>
        </div>
      `;

    favCities.innerHTML += cardHTML;
    // } catch (error) {
    //   console.log("Fav city load karne me masla aya:", error);
    // }
  }
}

function showToast(title, description, icon, type) {
  const typeClasses = {
    success: "bg-green-600 border-green-700 text-white",
    error: "bg-red-600 border-red-700 text-white",
    info: "bg-blue-600 border-blue-700 text-white",
    warning: "bg-amber-500 border-amber-600 text-white",
  };

  let toastDiv = document.createElement("div");

  toastDiv.className = `p-4 rounded-xl border shadow-lg flex items-start gap-3 transition-all duration-300 transform translate-y-2 ${typeClasses[type]}`;

  toastDiv.innerHTML = `
    <div class="text-xl">${icon}</div>
    <div class="flex flex-col gap-0.5">
      <h4 class="font-bold text-sm">${title}</h4>
      <p class="text-xs opacity-90">${description}</p>
    </div>
  `;

  const container = document.getElementById("toast-container");
  container.appendChild(toastDiv);

  setTimeout(() => {
    toastDiv.remove();
  }, 3000);
}

async function displaySunriseSunset() {
  const listContainer = document.getElementById("sunriseSunsetList");
  listContainer.innerHTML = ""; // Purana saaf kiya

  let currentFavourites = localStorage.getItem("favouriteCities");
  let favouriteArray = currentFavourites ? JSON.parse(currentFavourites) : [];

  // Agar koi favourite city nahi hai to user ko message dikhao
  if (favouriteArray.length === 0) {
    listContainer.innerHTML = `<p class="text-xs text-dark-muted text-center py-4">No favourite cities added yet.</p>`;
    return;
  }

  // Hum index tracking ke liye simple for loop ya forEach use kar sakte hain
  for (let i = 0; i < favouriteArray.length; i++) {
    const city = favouriteArray[i];

    // API Call humare purane fetchAPI wrapper ke zariye
    const url = `${window.CONFIG.BASE_URL}/forecast.json?key=${window.CONFIG.API_KEY}&q=${city}&days=1`;
    const data = await fetchAPI(url, `${city} astro data load nahi hua`);

    if (data) {
      const sunrise = data.forecast.forecastday[0].astro.sunrise;
      const sunset = data.forecast.forecastday[0].astro.sunset;

      // condition: Agar pehli do cities hain (index 0 aur 1) to EXPANDED layout
      if (i < 2) {
        const expandedHTML = `
          <div class="theme-card2 bg-dark-card2 border border-dark-border rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition-colors" onclick="fetchWeatherData('${city}')">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-1.5 text-white text-sm font-medium">
                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                </svg>
                ${city}
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-xl">☀️</span>
                <div>
                  <p class="text-dark-muted text-xs">Sunrise</p>
                  <p class="text-white font-semibold text-sm">${sunrise}</p>
                </div>
              </div>
              <div class="flex-1 h-px bg-dark-border"></div>
              <div class="flex items-center gap-2">
                <span class="text-xl">🌙</span>
                <div>
                  <p class="text-dark-muted text-xs">Sunset</p>
                  <p class="text-white font-semibold text-sm">${sunset}</p>
                </div>
              </div>
            </div>
          </div>
        `;
        listContainer.innerHTML += expandedHTML;
      }
      // Else: Baqi saari cities ke liye COMPACT layout (Rows)
      else {
        const compactHTML = `
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
        listContainer.innerHTML += compactHTML;
      }
    }
  }
}
