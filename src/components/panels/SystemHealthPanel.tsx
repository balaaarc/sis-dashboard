import { useSystemStore } from '../../store/systemStore'

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
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 0',
        borderBottom: '1px solid var(--bg-tertiary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            boxShadow: active ? `0 0 4px ${color}` : 'none',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 48, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${quality * 100}%`,
              height: '100%',
              background: color,
              borderRadius: 2,
            }}
          />
        </div>
        <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 30, textAlign: 'right' }}>
          {(quality * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

export default function SystemHealthPanel() {
  const health = useSystemStore((s) => s.health)
  const connectionStatus = useSystemStore((s) => s.connectionStatus)

  if (!health) {
    return (
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="no-data" style={{ flex: 1 }}>
          <span className="no-data-icon">🖥</span>
          <span>Awaiting telemetry...</span>
        </div>
      </div>
    )
  }

  const { hardware, comms, aiml } = health

  const uptimeDays = Math.floor(hardware.uptime_hours / 24)
  const uptimeHrs = Math.floor(hardware.uptime_hours % 24)

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
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          Node: {health.node_id}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }}>
        {/* Uptime + temp */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div className="stat-label">Uptime</div>
            <div className="stat-value" style={{ fontSize: 16 }}>
              {uptimeDays}d {uptimeHrs}h
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div className="stat-label">Temp</div>
            <div
              className="stat-value"
              style={{
                fontSize: 16,
                color:
                  hardware.temperature_c > 85
                    ? 'var(--alert-critical)'
                    : hardware.temperature_c > 75
                    ? 'var(--alert-medium)'
                    : 'var(--sensor-acoustic)',
              }}
            >
              {hardware.temperature_c.toFixed(1)}°C
            </div>
          </div>
        </div>

        {/* Hardware section */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Hardware
        </div>
        <GaugeBar label="CPU" value={hardware.cpu_percent} />
        <GaugeBar label="GPU" value={hardware.gpu_percent} />
        <GaugeBar label="RAM" value={hardware.ram_percent} />
        <GaugeBar label="NVMe" value={hardware.nvme_percent} />

        {/* AI/ML section */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          AI / ML Engine
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div className="stat-label">Inference FPS</div>
            <div
              className="stat-value"
              style={{
                fontSize: 18,
                color:
                  aiml.inference_fps < 10
                    ? 'var(--alert-critical)'
                    : aiml.inference_fps < 20
                    ? 'var(--alert-medium)'
                    : 'var(--sensor-acoustic)',
              }}
            >
              {aiml.inference_fps.toFixed(1)}
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div className="stat-label">GPU Mem</div>
            <div
              className="stat-value"
              style={{
                fontSize: 18,
                color:
                  aiml.gpu_memory_percent > 90
                    ? 'var(--alert-critical)'
                    : aiml.gpu_memory_percent > 75
                    ? 'var(--alert-medium)'
                    : 'var(--text-primary)',
              }}
            >
              {aiml.gpu_memory_percent.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Model versions */}
        {Object.keys(aiml.model_versions).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Model Versions
            </div>
            {Object.entries(aiml.model_versions).map(([model, ver]) => (
              <div
                key={model}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '2px 0',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ color: 'var(--accent-teal)' }}>{model}</span>
                <span>v{ver}</span>
              </div>
            ))}
          </div>
        )}

        {/* Comms section */}
        {Object.keys(comms).length > 0 && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
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
        <div
          style={{
            marginTop: 12,
            padding: '6px 10px',
            borderRadius: 6,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>C2 Link</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color:
                connectionStatus === 'connected'
                  ? 'var(--sensor-acoustic)'
                  : connectionStatus === 'reconnecting'
                  ? 'var(--alert-medium)'
                  : 'var(--alert-critical)',
            }}
          >
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}
