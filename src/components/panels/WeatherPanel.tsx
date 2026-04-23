import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

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

export function WeatherPanel() {
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
      <div className="flex-1 flex items-center justify-center text-text-secondary text-[12px]">
        Weather widget disabled in Settings
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="py-1 px-[10px] border-b border-border-color bg-bg-secondary flex items-center gap-[10px] shrink-0 text-[10px]">
        <span className="text-text-secondary">
          {COND_ICON[wx.condition]} <strong className="text-text-primary">{wx.condition}</strong>
        </span>
        <span className="text-text-secondary">
          👁 {wx.visibility_km} km
        </span>
        {lowVisHours > 0 && (
          <span className="text-alert-medium font-bold">⚠ {lowVisHours}h low vis forecast</span>
        )}
        <span className="ml-auto text-text-secondary">
          MOSDAC / IMD
        </span>
      </div>

      {/* View toggle */}
      <div className="flex border-b border-border-color shrink-0">
        {(['current', 'forecast'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={[
              'flex-1 py-1.5 px-1.5 border-none bg-transparent cursor-pointer text-[10px]',
              view === v
                ? 'border-b-2 border-accent-blue text-accent-blue font-bold'
                : 'border-b-2 border-transparent text-text-secondary font-normal',
            ].join(' ')}
          >
            {v === 'current' ? '🌡 Current' : '📅 24h Forecast'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">

        {view === 'current' && (
          <div className="p-[10px]">
            {/* Main reading */}
            <div className="flex items-center gap-3 bg-bg-secondary border border-border-color rounded-lg px-[14px] py-3 mb-[10px]">
              <div className="text-[36px]">{COND_ICON[wx.condition]}</div>
              <div>
                <div className="text-[28px] font-bold font-mono text-text-primary leading-none">
                  {wx.temp_c}°C
                </div>
                <div className="text-[11px] text-text-secondary">{wx.condition}</div>
                <div className="text-[10px] text-text-secondary">Dew point: {wx.dewpoint_c}°C</div>
              </div>
              <div className="ml-auto flex flex-col items-center gap-[2px]">
                <WindCompass dir={wx.wind_dir} speed={wx.wind_kmh} />
                <span className="text-[10px] text-text-secondary">{wx.wind_dir} {wx.wind_kmh} km/h</span>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-[10px]">
              {[
                { icon: '💧', label: 'Humidity',    value: `${wx.humidity_pct}%`,    color: wx.humidity_pct > 90 ? 'var(--alert-medium)' : 'var(--text-primary)' },
                { icon: '👁',  label: 'Visibility',  value: `${wx.visibility_km} km`,  color: wx.visibility_km < 2 ? 'var(--alert-critical)' : wx.visibility_km < 5 ? 'var(--alert-medium)' : 'var(--text-primary)' },
                { icon: '🌡',  label: 'Pressure',    value: `${wx.pressure_hpa} hPa`, color: 'var(--text-primary)' },
                { icon: '💨',  label: 'Wind',        value: `${wx.wind_kmh} km/h`,   color: wx.wind_kmh > 40 ? 'var(--alert-medium)' : 'var(--text-primary)' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-bg-secondary border border-border-color rounded-[6px] px-[10px] py-2 flex items-center gap-2"
                >
                  <span className="text-[16px]">{m.icon}</span>
                  <div>
                    <div className="text-[10px] text-text-secondary">{m.label}</div>
                    <div className="text-[13px] font-bold font-mono" style={{ color: m.color }}>
                      {m.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sensor recommendation */}
            <div
              className="rounded-[6px] px-[10px] py-2 flex items-start gap-2 text-[10px]"
              style={{ background: recBg, border: `1px solid ${recBorder}` }}
            >
              <span className="text-[16px] shrink-0">{rec.icon}</span>
              <div>
                <div className="font-bold mb-[2px]" style={{ color: recColor }}>Sensor Recommendation</div>
                <div className="text-text-secondary">{rec.text}</div>
              </div>
            </div>
          </div>
        )}

        {view === 'forecast' && (
          <div className="p-[10px]">
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              24-hour hourly forecast
            </div>
            <div className="flex flex-col gap-[3px]">
              {forecast.map((f) => {
                const visCritical = f.visibility_km < 2
                return (
                  <div
                    key={f.hour}
                    className="flex items-center gap-2 py-[5px] px-2 rounded text-[10px]"
                    style={{
                      background: visCritical ? 'rgba(249,115,22,0.06)' : 'var(--bg-secondary)',
                      border: `1px solid ${visCritical ? 'rgba(249,115,22,0.2)' : 'var(--border-color)'}`,
                    }}
                  >
                    <span className="w-11 text-text-secondary shrink-0 font-mono text-[9px]">{f.hour}</span>
                    <span className="w-4 shrink-0">{COND_ICON[f.condition]}</span>
                    <span className="w-10 font-mono font-bold text-text-primary shrink-0">{f.temp_c}°C</span>
                    <span className="flex-1 text-text-secondary text-[9px]">{f.condition}</span>
                    <span
                      className="font-mono text-[10px] shrink-0"
                      style={{ color: visCritical ? 'var(--alert-medium)' : 'var(--text-secondary)' }}
                    >
                      👁{f.visibility_km}km
                    </span>
                    <span
                      className="font-mono text-[10px] shrink-0"
                      style={{ color: f.rain_pct > 40 ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
                    >
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
