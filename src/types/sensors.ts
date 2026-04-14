// ============================================================
// IINVSYS SIS Dashboard — TypeScript Types
// ============================================================

export type SensorStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';
export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAR';
export type ScenarioType =
  | 'NORMAL'
  | 'ELEVATED'
  | 'INTRUSION'
  | 'TUNNEL_ACTIVITY'
  | 'DRONE'
  | 'VEHICLE_CONVOY';
export type SensorFamily =
  | 'Seismic'
  | 'Acoustic'
  | 'Optical'
  | 'Radar'
  | 'Magnetic'
  | 'Chemical';

export type SensorModality =
  | 'GPR'
  | 'SEISMIC'
  | 'ACOUSTIC'
  | 'MAD'
  | 'FIBRE_OPTIC'
  | 'EOTS'
  | 'THERMAL'
  | 'PTZ'
  | 'VIBRATION'
  | 'CCTV'
  | 'MICROWAVE'
  | 'PIR_IR'
  | 'LIDAR'
  | 'MAGNETOMETER'
  | 'THERMAL_NV'
  | 'NIR_VISIBLE'
  | 'MMWAVE'
  | 'GMTI_RADAR'
  | 'EMI'
  | 'CHEMICAL';

export interface SensorPayload {
  sensor_id: string;
  modality: SensorModality;
  timestamp: string;
  site_id: string;
  bop_id: string;
  quality_score: number;
  raw_value: Record<string, unknown>;
  processed?: Record<string, unknown>;
  sensor_status: SensorStatus;
  firmware_ver?: string;
  lat?: number;
  lon?: number;
}

export interface Track {
  track_id: string;
  lat: number;
  lon: number;
  range_m: number;
  velocity: number;
  heading: number;
  class: 'HUMAN' | 'VEHICLE' | 'ANIMAL' | 'UNKNOWN';
  confidence: number;
  age_frames: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  source_sensors: string[];
  location: string;
  classification: string;
  threat_level: ThreatLevel;
  acknowledged: boolean;
  annotation?: string;
  escalated?: boolean;
  sensor_family?: SensorFamily;
  ai_model?: string;
  description: string;
}

export interface ThreatAssessment {
  assessment_id: string;
  timestamp: string;
  threat_score: number;
  threat_level: ThreatLevel;
  contributing_sensors: string[];
  dominant_modality: string;
  location: { lat: number; lon: number; accuracy_m: number };
  recommended_action: string;
  model_version: string;
}

export interface SystemHealth {
  timestamp: string;
  node_id: string;
  hardware: {
    cpu_percent: number;
    gpu_percent: number;
    ram_percent: number;
    nvme_percent: number;
    temperature_c: number;
    uptime_hours: number;
  };
  comms: Record<string, { active: boolean; signal_quality: number }>;
  aiml: {
    inference_fps: number;
    gpu_memory_percent: number;
    model_versions: Record<string, string>;
  };
}

// ============================================================
// WebSocket message envelope types
// ============================================================

export type WSMessageType =
  | 'SENSOR_DATA'
  | 'AIML_DETECTION'
  | 'AIML_TRACK_UPDATE'
  | 'AIML_ALERT'
  | 'THREAT_ASSESSMENT'
  | 'SYSTEM_HEALTH'
  | 'SCENARIO_CHANGE'
  | 'SUBSCRIBE'
  | 'PTZ_CONTROL';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp?: string;
}

export interface PTZCommand {
  sensor_id: string;
  command: 'PAN_LEFT' | 'PAN_RIGHT' | 'TILT_UP' | 'TILT_DOWN' | 'ZOOM_IN' | 'ZOOM_OUT' | 'STOP';
  speed?: number;
}

// ============================================================
// Derived / UI types
// ============================================================

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface DetectionBBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface VideoFrame {
  sensor_id: string;
  modality: 'EOTS' | 'THERMAL' | 'PTZ' | 'CCTV';
  timestamp: string;
  frame_b64?: string;
  detections?: DetectionBBox[];
}

export interface AlertFilter {
  threatLevel: ThreatLevel | 'ALL';
  sensorFamily: SensorFamily | 'ALL';
  timeRange: '1h' | '6h' | '24h' | 'ALL';
  showAcknowledged: boolean;
}

export type SensorFamilyTab = SensorFamily;

export interface AnomalyPoint {
  timestamp: string;
  score: number;
  sensor_id: string;
  type: string;
}
