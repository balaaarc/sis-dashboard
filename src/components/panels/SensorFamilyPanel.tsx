import { useState, useMemo, useEffect, useRef } from 'react'
import { useSensorStore } from '../../store/sensorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getSensorFamilyColor, formatRelativeTime, formatQualityScore } from '../../utils/formatters'
import SensorCard from '../widgets/SensorCard'
import WaveformChart from '../widgets/WaveformChart'

// ── Acoustic Spectrogram widget ──
function AcousticSpectrogram({ sensorId }: { sensorId: string }) {
  const BINS = 32, HISTORY = 40
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<number[][]>(
    Array.from({ length: HISTORY }, () => Array.from({ length: BINS }, () => 0))
  )

  useEffect(() => {
    const iv = setInterval(() => {
      const row = Array.from({ length: BINS }, (_, i) => {
        const base = i < 8 ? 0.05 : i < 16 ? 0.15 : i < 24 ? 0.1 : 0.05
        return Math.max(0, Math.min(1, base + Math.random() * 0.3 + (Math.random() < 0.03 ? 0.7 : 0)))
      })
      dataRef.current = [...dataRef.current.slice(1), row]
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const W = canvas.width, H = canvas.height
      const cellW = W / HISTORY, cellH = H / BINS
      for (let t = 0; t < HISTORY; t++) {
        for (let b = 0; b < BINS; b++) {
          const v = dataRef.current[t][b]
          const r = Math.round(v * 200)
          const g = Math.round(v > 0.5 ? (v - 0.5) * 2 * 180 : 0)
          const bl = Math.round(v < 0.3 ? v * 255 : 0)
          ctx.fillStyle = `rgb(${r},${g},${bl})`
          ctx.fillRect(t * cellW, (BINS - 1 - b) * cellH, cellW, cellH)
        }
      }
    }, 200)
    return () => clearInterval(iv)
  }, [sensorId])

  return (
    <div style={{ padding: '0 12px 8px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
        <span>MFCC Spectrogram — {sensorId}</span><span>0–8 kHz</span>
      </div>
      <canvas ref={canvasRef} width={240} height={80} style={{ width: '100%', height: 80, borderRadius: 4, display: 'block' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
        <span>Past</span><span>Now</span>
      </div>
    </div>
  )
}
import type { SensorFamily, SensorModality } from '../../types/sensors'

const FAMILY_MODALITIES: Record<SensorFamily, SensorModality[]> = {
  Seismic: ['SEISMIC', 'VIBRATION', 'FIBRE_OPTIC'],
  Acoustic: ['ACOUSTIC'],
  Optical: ['EOTS', 'THERMAL', 'PTZ', 'CCTV', 'THERMAL_NV', 'NIR_VISIBLE', 'LIDAR'],
  Radar: ['MICROWAVE', 'MMWAVE', 'GMTI_RADAR', 'GPR', 'EMI'],
  Magnetic: ['MAD', 'MAGNETOMETER'],
  Chemical: ['CHEMICAL', 'PIR_IR'],
}

const ALL_FAMILIES: SensorFamily[] = ['Seismic', 'Acoustic', 'Optical', 'Radar', 'Magnetic', 'Chemical']

const SKIP_WAVEFORM_KEYS = new Set(['frame_width', 'frame_height'])

function getSensorFamily(modality: SensorModality): SensorFamily | null {
  for (const [family, modalities] of Object.entries(FAMILY_MODALITIES)) {
    if ((modalities as string[]).includes(modality)) return family as SensorFamily
  }
  return null
}

export default function SensorFamilyPanel() {
  const [activeFamily, setActiveFamily] = useState<SensorFamily>('Seismic')
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)
  const sensors = useSensorStore((s) => s.sensors)
  const sensorHistory = useSensorStore((s) => s.sensorHistory)
  const selectedId = useSensorStore((s) => s.selectedSensorId)

  const familySensors = useMemo(() => {
    return Array.from(sensors.values()).filter(
      (s) => getSensorFamily(s.modality) === activeFamily
    )
  }, [sensors, activeFamily])

  // Build waveform data from selected or first sensor history
  const waveformSensorId = selectedId ?? familySensors[0]?.sensor_id
  const waveformHistory = waveformSensorId ? (sensorHistory.get(waveformSensorId) ?? []) : []
  const waveformData = useMemo(() => {
    return waveformHistory.map((p) => {
      const raw = p.raw_value
      // Optical sensors: chart detection count for meaningful variation
      if (Array.isArray(raw.detections)) {
        return (raw.detections as unknown[]).length
      }
      const vals = Object.entries(raw)
        .filter(([k, v]) => !SKIP_WAVEFORM_KEYS.has(k) && typeof v === 'number')
        .map(([, v]) => v as number)
      return vals[0] ?? p.quality_score
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveformHistory])

  const familyColor = getSensorFamilyColor(activeFamily)

  // Family stats
  const onlineCount = familySensors.filter((s) => s.sensor_status === 'ONLINE').length
  const avgQuality =
    familySensors.length > 0
      ? familySensors.reduce((sum, s) => sum + s.quality_score, 0) / familySensors.length
      : 0

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div
        style={{
          padding: '4px 12px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexShrink: 0,
          gap: 12,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: familyColor,
            display: 'inline-block',
            boxShadow: `0 0 5px ${familyColor}`,
          }}
        />
        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-secondary)' }}>
          <span>
            Online:{' '}
            <strong style={{ color: 'var(--sensor-acoustic)' }}>{onlineCount}</strong>/
            {familySensors.length}
          </span>
          <span>
            Avg Q:{' '}
            <strong style={{ color: familyColor }}>{formatQualityScore(avgQuality)}</strong>
          </span>
        </div>
      </div>

      {/* Family tab strip */}
      <div className="tab-list" style={{ flexShrink: 0 }}>
        {ALL_FAMILIES.map((family) => {
          const color = getSensorFamilyColor(family)
          const count = Array.from(sensors.values()).filter(
            (s) => getSensorFamily(s.modality) === family
          ).length
          return (
            <button
              key={family}
              onClick={() => setActiveFamily(family)}
              className={`tab-btn${activeFamily === family ? ' active' : ''}`}
              style={{
                borderBottomColor: activeFamily === family ? color : 'transparent',
                color: activeFamily === family ? color : undefined,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                  marginRight: 4,
                }}
              />
              {family}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
                    background: activeFamily === family ? `${color}22` : 'var(--bg-tertiary)',
                    padding: '0 4px',
                    borderRadius: 8,
                    color: activeFamily === family ? color : 'var(--text-secondary)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Scrollable body: waveform/spectrogram + sensor cards */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Acoustic Spectrogram (Acoustic family only, when widget enabled) */}
        {activeFamily === 'Acoustic' && isVisible('acousticSpectrogram') && waveformSensorId && (
          <AcousticSpectrogram sensorId={waveformSensorId} />
        )}

        {/* Waveform (non-Acoustic families, or Acoustic without spectrogram) */}
        {(activeFamily !== 'Acoustic' || !isVisible('acousticSpectrogram')) && waveformData.length > 1 && (
          <div style={{ padding: '8px 12px' }}>
            <WaveformChart
              data={waveformData}
              color={familyColor}
              height={60}
              label={waveformSensorId ?? activeFamily}
            />
          </div>
        )}

        {/* Sensor card grid */}
        <div
          style={{
            padding: 8,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 6,
            alignContent: 'start',
          }}
        >
          {familySensors.length === 0 ? (
            <div
              className="no-data"
              style={{ gridColumn: '1 / -1', height: 100 }}
            >
              <span className="no-data-icon" style={{ fontSize: 20 }}>📡</span>
              <span>No {activeFamily} sensors</span>
            </div>
          ) : (
            familySensors.map((s) => (
              <SensorCard key={s.sensor_id} sensorId={s.sensor_id} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
