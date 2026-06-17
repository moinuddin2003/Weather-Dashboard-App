displayFavourites();

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
    showToast(error.message, "error");
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

  const weatherData = await fetchAPI(url, "City nhi mili Duabara kro");

  if (weatherData) {
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
  }

  createHourlyChart(weatherData);
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
  console.log("Access Denied");
}

const locationBtn = document.getElementById("geo-btn");
locationBtn.addEventListener("click", () => {
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
    console.log("Already included in favourites");
    return;
  }

  favouriteArray.push(cityName);

  localStorage.setItem("favouriteCities", JSON.stringify(favouriteArray));

  console.log("LocalStorage me ab yeh save ho chuka hai:", favouriteArray);

  displayFavourites();
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


