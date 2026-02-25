import { WeatherInfo } from "@/types";

export default function Weather({ weather }: { weather: WeatherInfo }) {
  return (
    <div>
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-500 via-blue-300 to-cyan-400 p-6 text-white">
        <div>
          <h1 className="text-3xl">{Math.round(weather.main.temp)} ℃</h1>
          <div className="mb-2 mt-4">{weather.weather[0].description}</div>
          <p className="font-bold">{weather.name}</p>
        </div>
        <div>
          <img
            src={`http://openweathermap.org/img/w/${weather.weather[0].icon}.png`}
            alt={weather.weather[0].description}
            className="h-28 w-28"
          />
        </div>
      </div>
      <span className="mt-3 block text-xs">
        提供:
        <a href="https://openweathermap.org/" className="ml-0.5 text-blue-400">
          {" "}
          OpenWeatherMap
        </a>
      </span>
    </div>
  );
}
