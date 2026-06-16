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
    console.log("Mubaraka Data mil gya he: ", weatherData);

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
  }
}
