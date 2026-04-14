import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface WeatherReading {
  temp_c: number
  humidity_pct: number
  wind_kmh: number
  wind_dir: string
  visibility_km: number
  pressure_hpa: number
  condition: 'Clear' | 'Partly Cloudy' | 'Overcast' | 'Fog' | 'Rain' | 'Drizzle'
  dewpoint_c: number
}

interface HourForecast {
  hour: string
  temp_c: number
  condition: 'Clear' | 'Partly Cloudy' | 'Overcast' | 'Fog' | 'Rain' | 'Drizzle'
  wind_kmh: number
  visibility_km: number
  rain_pct: number
}

const CONDITIONS = ['Clear', 'Partly Cloudy', 'Overcast', 'Fog', 'Rain', 'Drizzle'] as const
const WIND_DIRS  = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const COND_ICON: Record<string, string> = {
  Clear:          '☀',
  'Partly Cloudy':'⛅',
  Overcast:       '☁',
  Fog:            '🌫',
  Rain:           '🌧',
  Drizzle:        '🌦',
}

function useLiveWeather(): WeatherReading {
  const [wx, setWx] = useState<WeatherReading>({
    temp_c: 28.4,
    humidity_pct: 74,
    wind_kmh: 14,
    wind_dir: 'SW',
    visibility_km: 8.2,
    pressure_hpa: 1008,
    condition: 'Partly Cloudy',
    dewpoint_c: 22.1,
  })

  useEffect(() => {
    const iv = setInterval(() => {
      setWx((prev) => ({
        temp_c: parseFloat((prev.temp_c + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        humidity_pct: Math.round(Math.max(20, Math.min(100, prev.humidity_pct + (Math.random() * 2 - 1)))),
        wind_kmh: Math.max(0, Math.round(prev.wind_kmh + (Math.random() * 4 - 2))),
        wind_dir: Math.random() < 0.05 ? WIND_DIRS[Math.floor(Math.random() * WIND_DIRS.length)] : prev.wind_dir,
        visibility_km: parseFloat((Math.max(0.1, prev.visibility_km + (Math.random() * 0.4 - 0.2))).toFixed(1)),
        pressure_hpa: Math.round(prev.pressure_hpa + (Math.random() * 0.4 - 0.2)),
        condition: Math.random() < 0.03 ? CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)] : prev.condition,
        dewpoint_c: parseFloat((prev.dewpoint_c + (Math.random() * 0.2 - 0.1)).toFixed(1)),
      }))
    }, 5000)
    return () => clearInterval(iv)
  }, [])

  return wx
}

function useForecast(): HourForecast[] {
  const [forecast] = useState<HourForecast[]>(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const h = new Date(now.getTime() + (i + 1) * 3600000)
      const cond = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]
      return {
        hour: h.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp_c: parseFloat((26 + Math.sin(i / 3) * 4 + (Math.random() * 2 - 1)).toFixed(1)),
        condition: cond,
        wind_kmh: Math.round(8 + Math.random() * 20),
        visibility_km: cond === 'Fog' ? parseFloat((0.2 + Math.random() * 1.5).toFixed(1)) : parseFloat((5 + Math.random() * 10).toFixed(1)),
        rain_pct: cond === 'Rain' ? Math.round(60 + Math.random() * 39) : cond === 'Drizzle' ? Math.round(30 + Math.random() * 30) : Math.round(Math.random() * 15),
      }
    })
  })
  return forecast
}

function getSensorRecommendation(wx: WeatherReading): { icon: string; text: string; level: 'info' | 'warn' | 'alert' } {
  if (wx.visibility_km < 0.5 || wx.condition === 'Fog')
    return { icon: '🌡', text: 'Low visibility — switch EOTS/optical to THERMAL mode', level: 'warn' }
  if (wx.wind_kmh > 40)
    return { icon: '💨', text: 'High winds — acoustic sensors may have elevated noise floor', level: 'warn' }
  if (wx.condition === 'Rain')
    return { icon: '🌧', text: 'Rain — seismic baseline elevated; increase detection threshold', level: 'warn' }
  if (wx.visibility_km > 10)
    return { icon: '☀', text: 'Excellent visibility — all optical sensors operating optimally', level: 'info' }
  return { icon: '✅', text: 'Conditions nominal — no sensor mode changes required', level: 'info' }
}

function WindCompass({ dir, speed }: { dir: string; speed: number }) {
  const dirIndex = WIND_DIRS.indexOf(dir)
  const angle = dirIndex * 45
  const r = 22, cx = 28, cy = 28
  const rad = ((angle - 90) * Math.PI) / 180
  const x = cx + r * Math.cos(rad)
  const y = cy + r * Math.sin(rad)

  return (
    <svg width={56} height={56}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      {['N', 'E', 'S', 'W'].map((d, i) => {
        const a = (i * 90 - 90) * Math.PI / 180
        return (
          <text key={d} x={cx + (r + 8) * Math.cos(a)} y={cy + (r + 8) * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>{d}</text>
        )
      })}
      <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--accent-blue)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={2.5} fill="var(--accent-blue)" />
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fill="transparent" fontSize={8}>{speed}</text>
    </svg>
  )
}

export default function WeatherPanel() {
  const wx = useLiveWeather()
  const forecast = useForecast()
  const [view, setView] = useState<'current' | 'forecast'>('current')
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)
  const showWeather = isVisible('visibilityWeatherForecast')

  const rec = getSensorRecommendation(wx)
  const recBg = rec.level === 'alert' ? 'rgba(239,68,68,0.1)' : rec.level === 'warn' ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.08)'
  const recBorder = rec.level === 'alert' ? 'rgba(239,68,68,0.3)' : rec.level === 'warn' ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.2)'
  const recColor = rec.level === 'alert' ? 'var(--alert-critical)' : rec.level === 'warn' ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'

  const lowVisHours = forecast.filter((f) => f.visibility_km < 2).length

  if (!showWeather) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
        Weather widget disabled in Settings
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div
        style={{
          padding: '4px 10px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          fontSize: 10,
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          {COND_ICON[wx.condition]} <strong style={{ color: 'var(--text-primary)' }}>{wx.condition}</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          👁 {wx.visibility_km} km
        </span>
        {lowVisHours > 0 && (
          <span style={{ color: 'var(--alert-medium)', fontWeight: 700 }}>⚠ {lowVisHours}h low vis forecast</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)' }}>
          MOSDAC / IMD
        </span>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        {(['current', 'forecast'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              borderBottom: view === v ? '2px solid var(--accent-blue)' : '2px solid transparent',
              background: 'transparent',
              color: view === v ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: view === v ? 700 : 400,
            }}
          >
            {v === 'current' ? '🌡 Current' : '📅 24h Forecast'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {view === 'current' && (
          <div style={{ padding: 10 }}>
            {/* Main reading */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 36 }}>{COND_ICON[wx.condition]}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {wx.temp_c}°C
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{wx.condition}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Dew point: {wx.dewpoint_c}°C</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <WindCompass dir={wx.wind_dir} speed={wx.wind_kmh} />
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{wx.wind_dir} {wx.wind_kmh} km/h</span>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              {[
                { icon: '💧', label: 'Humidity',    value: `${wx.humidity_pct}%`,    color: wx.humidity_pct > 90 ? 'var(--alert-medium)' : 'var(--text-primary)' },
                { icon: '👁',  label: 'Visibility',  value: `${wx.visibility_km} km`,  color: wx.visibility_km < 2 ? 'var(--alert-critical)' : wx.visibility_km < 5 ? 'var(--alert-medium)' : 'var(--text-primary)' },
                { icon: '🌡',  label: 'Pressure',    value: `${wx.pressure_hpa} hPa`, color: 'var(--text-primary)' },
                { icon: '💨',  label: 'Wind',        value: `${wx.wind_kmh} km/h`,   color: wx.wind_kmh > 40 ? 'var(--alert-medium)' : 'var(--text-primary)' },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: m.color }}>
                      {m.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sensor recommendation */}
            <div
              style={{
                background: recBg,
                border: `1px solid ${recBorder}`,
                borderRadius: 6,
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 10,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{rec.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: recColor, marginBottom: 2 }}>Sensor Recommendation</div>
                <div style={{ color: 'var(--text-secondary)' }}>{rec.text}</div>
              </div>
            </div>
          </div>
        )}

        {view === 'forecast' && (
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              24-hour hourly forecast
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {forecast.map((f) => {
                const visCritical = f.visibility_km < 2
                return (
                  <div
                    key={f.hour}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 8px',
                      background: visCritical ? 'rgba(249,115,22,0.06)' : 'var(--bg-secondary)',
                      border: `1px solid ${visCritical ? 'rgba(249,115,22,0.2)' : 'var(--border-color)'}`,
                      borderRadius: 4,
                      fontSize: 10,
                    }}
                  >
                    <span style={{ width: 44, color: 'var(--text-secondary)', flexShrink: 0, fontFamily: 'monospace', fontSize: 9 }}>{f.hour}</span>
                    <span style={{ width: 16, flexShrink: 0 }}>{COND_ICON[f.condition]}</span>
                    <span style={{ width: 40, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{f.temp_c}°C</span>
                    <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 9 }}>{f.condition}</span>
                    <span style={{ color: visCritical ? 'var(--alert-medium)' : 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>
                      👁{f.visibility_km}km
                    </span>
                    <span style={{ color: f.rain_pct > 40 ? 'var(--accent-blue)' : 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>
                      💧{f.rain_pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
