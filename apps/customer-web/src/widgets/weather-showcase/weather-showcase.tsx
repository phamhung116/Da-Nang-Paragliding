import { Badge, Card, Panel } from "@paragliding/ui";
import type { AvailabilityDay } from "@paragliding/api-client";

type WeatherShowcaseProps = {
  days: AvailabilityDay[];
};

const getWeatherTone = (condition: string): "default" | "success" | "danger" => {
  if (condition === "Good") {
    return "success";
  }

  if (condition === "No Fly") {
    return "danger";
  }

  return "default";
};

export const WeatherShowcase = ({ days }: WeatherShowcaseProps) => {
  const forecast = days.slice(0, 7);
  const today = forecast[0];

  if (!today) {
    return null;
  }

  return (
    <div className="weather-showcase">
      <Card className="weather-showcase__today">
        <Panel className="stack">
          <div className="weather-showcase__head">
            <div>
              <Badge>Hom nay</Badge>
              <h3>Du bao tai diem bay Son Tra</h3>
              <p className="weather-showcase__summary">Thong tin tong quan de khach quyet dinh ngay dat lich.</p>
            </div>
            <Badge tone={getWeatherTone(today.flight_condition)}>{today.flight_condition}</Badge>
          </div>

          <div className="weather-showcase__hero">
            <div>
              <strong>{today.temperature_c}°C</strong>
              <span>
                {new Date(today.date).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit"
                })}
              </span>
            </div>
            <div className="weather-showcase__hero-pill">
              <small>Dieu kien bay</small>
              <b>{today.flight_condition}</b>
            </div>
          </div>

          <div className="weather-showcase__stats">
            <article>
              <span>Nhiet do</span>
              <strong>{today.temperature_c}°C</strong>
            </article>
            <article>
              <span>Suc gio</span>
              <strong>{today.wind_kph} km/h</strong>
            </article>
            <article>
              <span>UV</span>
              <strong>{today.uv_index}</strong>
            </article>
            <article>
              <span>Dieu kien</span>
              <strong>{today.flight_condition}</strong>
            </article>
          </div>
        </Panel>
      </Card>

      <Card className="weather-showcase__forecast">
        <Panel className="stack-sm">
          <div className="weather-showcase__head weather-showcase__head--compact">
            <div>
              <Badge tone="success">7 ngay toi</Badge>
              <h3>Lich thoi tiet sap toi</h3>
            </div>
          </div>

          <div className="weather-showcase__list">
            {forecast.map((item) => (
              <article key={item.date} className="weather-showcase__item">
                <div className="weather-showcase__day">
                  <strong>
                    {new Date(item.date).toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit"
                    })}
                  </strong>
                  <small>{item.temperature_c}°C</small>
                </div>
                <span>{item.wind_kph} km/h</span>
                <span>UV {item.uv_index}</span>
                <Badge tone={getWeatherTone(item.flight_condition)}>{item.flight_condition}</Badge>
              </article>
            ))}
          </div>
        </Panel>
      </Card>
    </div>
  );
};
