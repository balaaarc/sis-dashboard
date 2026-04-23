import { useState, useMemo, useEffect, useRef } from 'react'
import { useSensorStore } from '@/store/sensorStore'
import { useSettingsStore } from '@/store/settingsStore'
import { getSensorFamilyColor, formatQualityScore } from '@/utils/formatters'
import { SensorCard } from '@/components/widgets/SensorCard'
import { WaveformChart } from '@/components/widgets/WaveformChart'

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
    <div className="px-3 pb-2">
      <div className="text-[10px] text-text-secondary mb-1 flex justify-between">
        <span>MFCC Spectrogram — {sensorId}</span><span>0–8 kHz</span>
      </div>
      <canvas ref={canvasRef} width={240} height={80} className="w-full h-[80px] rounded block" />
      <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
        <span>Past</span><span>Now</span>
      </div>
    </div>
  )
}

import type { SensorFamily, SensorModality } from '@/types/sensors'

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

export function SensorFamilyPanel() {
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

  const waveformSensorId = selectedId ?? familySensors[0]?.sensor_id
  const waveformHistory = waveformSensorId ? (sensorHistory.get(waveformSensorId) ?? []) : []
  const waveformData = useMemo(() => {
    return waveformHistory.map((p) => {
      const raw = p.raw_value
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
  const onlineCount = familySensors.filter((s) => s.sensor_status === 'ONLINE').length
  const avgQuality =
    familySensors.length > 0
      ? familySensors.reduce((sum, s) => sum + s.quality_score, 0) / familySensors.length
      : 0

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <span className="sr-only">Sensor Families</span>
      {/* Stats bar */}
      <div className="py-1 px-3 border-b border-border-color bg-bg-secondary flex items-center justify-end shrink-0 gap-3">
        <span
          className="w-[7px] h-[7px] rounded-full inline-block"
          style={{ background: familyColor, boxShadow: `0 0 5px ${familyColor}` }}
        />
        <div className="flex gap-2 text-[10px] text-text-secondary">
          <span>
            Online:{' '}
            <strong className="text-sensor-acoustic">{onlineCount}</strong>/{familySensors.length}
          </span>
          <span>
            Avg Q:{' '}
            <strong style={{ color: familyColor }}>{formatQualityScore(avgQuality)}</strong>
          </span>
        </div>
      </div>

      {/* Family tab strip */}
      <div className="tab-list shrink-0">
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
                className="w-1.5 h-1.5 rounded-full inline-block mr-1"
                style={{ background: color }}
              />
              {family}
              {count > 0 && (
                <span
                  className="ml-1 text-[10px] px-1 rounded-lg"
                  style={{
                    background: activeFamily === family ? `${color}22` : 'var(--bg-tertiary)',
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

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeFamily === 'Acoustic' && isVisible('acousticSpectrogram') && waveformSensorId && (
          <AcousticSpectrogram sensorId={waveformSensorId} />
        )}

        {(activeFamily !== 'Acoustic' || !isVisible('acousticSpectrogram')) && waveformData.length > 1 && (
          <div className="py-2 px-3">
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
          className="p-2 grid gap-1.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', alignContent: 'start' }}
        >
          {familySensors.length === 0 ? (
            <div className="no-data col-span-full h-[100px]">
              <span className="no-data-icon text-[20px]">📡</span>
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
