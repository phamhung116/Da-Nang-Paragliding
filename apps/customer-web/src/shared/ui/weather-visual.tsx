export type WeatherKind = "clear" | "partly-cloudy" | "cloudy" | "rain" | "storm" | "fog" | "wind";

type WeatherLike = {
  weather_condition?: string;
  flight_condition?: string;
  temperature_c?: number;
  wind_kph?: number;
};

export type WeatherBadgeTone = "default" | "success" | "danger";

const normalize = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const getWeatherKind = (weather: WeatherLike): WeatherKind => {
  const condition = normalize(weather.weather_condition);

  if (condition.includes("giong") || condition.includes("storm") || condition.includes("thunder")) {
    return "storm";
  }

  if (
    condition.includes("mua") ||
    condition.includes("rain") ||
    condition.includes("shower") ||
    condition.includes("drizzle")
  ) {
    return "rain";
  }

  if (
    condition.includes("suong") ||
    condition.includes("fog") ||
    condition.includes("mist") ||
    condition.includes("haze")
  ) {
    return "fog";
  }

  if (Number(weather.wind_kph ?? 0) >= 20 || condition.includes("gio") || condition.includes("wind")) {
    return "wind";
  }

  if (condition.includes("may") || condition.includes("cloud") || condition.includes("overcast")) {
    return condition.includes("it") || condition.includes("partly") ? "partly-cloudy" : "cloudy";
  }

  return "clear";
};

export const getFlightBadgeTone = (condition?: string): WeatherBadgeTone => {
  const normalized = normalize(condition);

  if (normalized === "ly tuong") {
    return "success";
  }

  if (normalized === "khong ly tuong") {
    return "danger";
  }

  return "default";
};

export const formatTemperature = (value: number, withUnit = false) =>
  `${Math.round(value)}\u00b0${withUnit ? "C" : ""}`;

type WeatherSymbolProps = {
  kind: WeatherKind;
  size?: "sm" | "md";
};

export const WeatherSymbol = ({ kind, size = "md" }: WeatherSymbolProps) => (
  <span className={`weather-symbol weather-symbol--${kind} weather-symbol--${size}`} aria-hidden="true">
    <i />
    <i />
    <i />
  </span>
);
