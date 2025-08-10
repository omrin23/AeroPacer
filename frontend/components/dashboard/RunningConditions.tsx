'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';

type WeatherData = {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationMm: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
};

const weatherCodeToEmoji = (code: number | null, isDay: boolean | null): string => {
  if (code === null) return '🌤️';
  // Based on Open-Meteo weather codes
  if (code === 0) return isDay ? '☀️' : '🌙'; // Clear
  if ([1, 2, 3].includes(code)) return isDay ? '🌤️' : '☁️'; // Mainly clear to overcast
  if ([45, 48].includes(code)) return '🌫️'; // Fog
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️'; // Drizzle
  if ([61, 63, 65, 66, 67].includes(code)) return '🌧️'; // Rain
  if ([71, 73, 75, 77].includes(code)) return '❄️'; // Snow
  if ([80, 81, 82].includes(code)) return '🌧️'; // Rain showers
  if ([85, 86].includes(code)) return '❄️'; // Snow showers
  if ([95, 96, 99].includes(code)) return '⛈️'; // Thunderstorm
  return '🌤️';
};

const computeRunningAdvice = (w: WeatherData): { headline: string; detail: string } => {
  const t = w.temperatureC ?? 20;
  const h = w.humidityPercent ?? 40;
  const wind = w.windSpeedKmh ?? 5;
  const rain = w.precipitationMm ?? 0;

  if (rain > 1) return { headline: 'Rainy — plan accordingly', detail: 'Consider waterproof gear and watch your footing.' };
  if (t >= 30) return { headline: 'Hot conditions', detail: 'Hydrate well and consider a shorter or shaded route.' };
  if (t <= 0) return { headline: 'Very cold', detail: 'Layer up and warm up thoroughly before harder efforts.' };
  if (wind >= 30) return { headline: 'Windy', detail: 'Expect tougher efforts against the wind; choose sheltered paths.' };
  if (t >= 22 && h >= 70) return { headline: 'Warm & humid', detail: 'Pace conservatively; humidity can increase perceived effort.' };
  if (t >= 10 && t <= 20 && wind <= 20 && h <= 70) return { headline: 'Great for running!', detail: 'Mild temps and comfortable wind — ideal workout conditions.' };
  return { headline: 'Decent conditions', detail: 'Conditions are generally okay — adjust effort as needed.' };
};

const formatNumber = (value: number | null, suffix: string) => (value === null || Number.isNaN(value) ? '—' : `${Math.round(value)}${suffix}`);

const RunningConditions: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get browser geolocation (localhost is a secure context)
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Location not available');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setError('Location permission denied');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Fetch current weather from Open-Meteo
  useEffect(() => {
    const fetchWeather = async () => {
      if (!coords) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          latitude: String(coords.lat),
          longitude: String(coords.lon),
          current: [
            'temperature_2m',
            'apparent_temperature',
            'relative_humidity_2m',
            'precipitation',
            'wind_speed_10m',
            'wind_direction_10m',
            'is_day',
            'weather_code',
          ].join(','),
          timezone: 'auto',
        });

        const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather');
        const data = await res.json();
        const c = data?.current ?? {};
        const parsed: WeatherData = {
          temperatureC: typeof c.temperature_2m === 'number' ? c.temperature_2m : null,
          apparentTemperatureC: typeof c.apparent_temperature === 'number' ? c.apparent_temperature : null,
          humidityPercent: typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : null,
          windSpeedKmh: typeof c.wind_speed_10m === 'number' ? c.wind_speed_10m : null,
          precipitationMm: typeof c.precipitation === 'number' ? c.precipitation : 0,
          weatherCode: typeof c.weather_code === 'number' ? c.weather_code : null,
          isDay: typeof c.is_day === 'number' ? c.is_day === 1 : null,
        };
        setWeather(parsed);
        setError(null);
      } catch (e) {
        setError('Could not load weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [coords]);

  const advice = useMemo(() => computeRunningAdvice(weather ?? {
    temperatureC: null,
    apparentTemperatureC: null,
    humidityPercent: null,
    windSpeedKmh: null,
    precipitationMm: null,
    weatherCode: null,
    isDay: null,
  }), [weather]);

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-semibold text-foreground">Running Conditions</h3>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="text-center py-6 text-subtle">Fetching local weather…</div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-subtle mb-2">{error}</p>
            <p className="text-xs text-muted">Enable location to see local running conditions.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">
                {weatherCodeToEmoji(weather?.weatherCode ?? null, weather?.isDay ?? null)}
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  {formatNumber(weather?.temperatureC ?? null, '°C')}
                </p>
                <p className="text-sm text-subtle">{advice.headline}</p>
                <p className="text-xs text-muted mt-1">{advice.detail}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/5 border border-border rounded-lg px-3 py-2 text-center">
                <div className="text-xs text-muted">Feels</div>
                <div className="font-medium">{formatNumber(weather?.apparentTemperatureC ?? null, '°C')}</div>
              </div>
              <div className="bg-white/5 border border-border rounded-lg px-3 py-2 text-center">
                <div className="text-xs text-muted">Humidity</div>
                <div className="font-medium">{formatNumber(weather?.humidityPercent ?? null, '%')}</div>
              </div>
              <div className="bg-white/5 border border-border rounded-lg px-3 py-2 text-center">
                <div className="text-xs text-muted">Wind</div>
                <div className="font-medium">{formatNumber(weather?.windSpeedKmh ?? null, ' km/h')}</div>
              </div>
              <div className="bg-white/5 border border-border rounded-lg px-3 py-2 text-center">
                <div className="text-xs text-muted">Rain</div>
                <div className="font-medium">{formatNumber(weather?.precipitationMm ?? null, ' mm')}</div>
              </div>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default RunningConditions;



