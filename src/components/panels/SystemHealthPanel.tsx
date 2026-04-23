import { useSystemStore } from '@/store/systemStore'

function GaugeBar({
  label,
  value,
  unit = '%',
  warnAt = 80,
  critAt = 95,
}: {
  label: string
  value: number
  unit?: string
  warnAt?: number
  critAt?: number
}) {
  const color =
    value >= critAt
      ? 'var(--alert-critical)'
      : value >= warnAt
      ? 'var(--alert-medium)'
      : 'var(--sensor-acoustic)'

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-[3px]">
        <span className="text-[10px] text-text-secondary uppercase tracking-[0.05em]">
          {label}
        </span>
        <span className="text-[11px] font-bold font-mono" style={{ color }}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${Math.min(value, 100)}%`,
            background: color,
            boxShadow: value >= warnAt ? `0 0 6px ${color}` : 'none',
          }}
        />
      </div>
    </div>
  )
}

function CommLink({
  name,
  active,
  quality,
}: {
  name: string
  active: boolean
  quality: number
}) {
  const color = active
    ? quality > 0.7
      ? 'var(--sensor-acoustic)'
      : 'var(--alert-medium)'
    : 'var(--alert-critical)'

  return (
    <div className="flex items-center justify-between py-1 border-b border-bg-tertiary">
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            background: color,
            boxShadow: active ? `0 0 4px ${color}` : 'none',
          }}
        />
        <span className="text-[10px] text-text-secondary">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-12 h-1 bg-bg-tertiary rounded-sm overflow-hidden">
          <div
            className="h-full rounded-sm"
            style={{ width: `${quality * 100}%`, background: color }}
          />
        </div>
        <span className="text-[10px] font-bold min-w-[30px] text-right" style={{ color }}>
          {(quality * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

export function SystemHealthPanel() {
  const health = useSystemStore((s) => s.health)
  const connectionStatus = useSystemStore((s) => s.connectionStatus)

  if (!health) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="no-data flex-1">
          <span className="no-data-icon">🖥</span>
          <span>Awaiting telemetry...</span>
        </div>
      </div>
    )
  }

  const { hardware, comms, aiml } = health

  const uptimeDays = Math.floor(hardware.uptime_hours / 24)
  const uptimeHrs = Math.floor(hardware.uptime_hours % 24)

  const tempColor =
    hardware.temperature_c > 85
      ? 'var(--alert-critical)'
      : hardware.temperature_c > 75
      ? 'var(--alert-medium)'
      : 'var(--sensor-acoustic)'

  const fpsFontColor =
    aiml.inference_fps < 10
      ? 'var(--alert-critical)'
      : aiml.inference_fps < 20
      ? 'var(--alert-medium)'
      : 'var(--sensor-acoustic)'

  const gpuMemColor =
    aiml.gpu_memory_percent > 90
      ? 'var(--alert-critical)'
      : aiml.gpu_memory_percent > 75
      ? 'var(--alert-medium)'
      : 'var(--text-primary)'

  const c2Color =
    connectionStatus === 'connected'
      ? 'var(--sensor-acoustic)'
      : connectionStatus === 'reconnecting'
      ? 'var(--alert-medium)'
      : 'var(--alert-critical)'

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="py-1 px-3 border-b border-border-color bg-bg-secondary flex items-center justify-end shrink-0">
        <span className="text-[10px] text-text-secondary font-mono">
          Node: {health.node_id}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {/* Uptime + temp */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-bg-primary border border-border-color rounded-[6px] px-[10px] py-2">
            <div className="stat-label">Uptime</div>
            <div className="stat-value text-[16px]">
              {uptimeDays}d {uptimeHrs}h
            </div>
          </div>
          <div className="bg-bg-primary border border-border-color rounded-[6px] px-[10px] py-2">
            <div className="stat-label">Temp</div>
            <div className="stat-value text-[16px]" style={{ color: tempColor }}>
              {hardware.temperature_c.toFixed(1)}°C
            </div>
          </div>
        </div>

        {/* Hardware section */}
        <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
          Hardware
        </div>
        <GaugeBar label="CPU" value={hardware.cpu_percent} />
        <GaugeBar label="GPU" value={hardware.gpu_percent} />
        <GaugeBar label="RAM" value={hardware.ram_percent} />
        <GaugeBar label="NVMe" value={hardware.nvme_percent} />

        {/* AI/ML section */}
        <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mt-3 mb-2">
          AI / ML Engine
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-bg-primary border border-border-color rounded-[6px] px-[10px] py-2">
            <div className="stat-label">Inference FPS</div>
            <div className="stat-value text-[18px]" style={{ color: fpsFontColor }}>
              {aiml.inference_fps.toFixed(1)}
            </div>
          </div>
          <div className="bg-bg-primary border border-border-color rounded-[6px] px-[10px] py-2">
            <div className="stat-label">GPU Mem</div>
            <div className="stat-value text-[18px]" style={{ color: gpuMemColor }}>
              {aiml.gpu_memory_percent.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Model versions */}
        {Object.keys(aiml.model_versions).length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-text-secondary mb-1">
              Model Versions
            </div>
            {Object.entries(aiml.model_versions).map(([model, ver]) => (
              <div
                key={model}
                className="flex justify-between text-[10px] font-mono py-[2px] text-text-secondary"
              >
                <span className="text-accent-teal">{model}</span>
                <span>v{ver}</span>
              </div>
            ))}
          </div>
        )}

        {/* Comms section */}
        {Object.keys(comms).length > 0 && (
          <>
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              Comms Links
            </div>
            {Object.entries(comms).map(([name, link]) => (
              <CommLink
                key={name}
                name={name}
                active={link.active}
                quality={link.signal_quality}
              />
            ))}
          </>
        )}

        {/* WS connection status */}
        <div className="mt-3 py-1.5 px-[10px] rounded-[6px] bg-bg-primary border border-border-color flex items-center justify-between">
          <span className="text-[10px] text-text-secondary">C2 Link</span>
          <span className="text-[10px] font-bold" style={{ color: c2Color }}>
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}
