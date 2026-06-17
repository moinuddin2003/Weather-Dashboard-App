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
  const savedCity = document.getElementById("cardCity").innerText;

  let currentFavourites = localStorage.getItem("savedCity")
let favouriteArray = currentFavourites ? JSON.parse(currentFavourites) : [];

favouriteArray.push(savedCity)

localStorage.setItem("savedCity" , JSON.stringify(favouriteArray))

console.log("LocalStorage me ab yeh save ho chuka hai:", favouriteArray);

}

const favCities = document.getElementById("favCity");
favCities.innerHTML = "";
