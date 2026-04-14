import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// ── Mock canvas API (jsdom doesn't implement it) ───────────────────────────
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createConicGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  canvas: { width: 400, height: 400 },
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

// ── Mock ResizeObserver (not in jsdom) ─────────────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// ── Mock AudioContext ──────────────────────────────────────────────────────
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
  })),
  destination: {},
  currentTime: 0,
  state: 'running',
  close: vi.fn(),
})) as unknown as typeof AudioContext

// ── Mock WebSocket ─────────────────────────────────────────────────────────
class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  readyState = MockWebSocket.OPEN
  onopen: ((e: Event) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  send = vi.fn()
  close = vi.fn(() => { this.readyState = MockWebSocket.CLOSED })
  constructor(public url: string) {
    setTimeout(() => { this.onopen?.(new Event('open')) }, 0)
  }
}
global.WebSocket = MockWebSocket as unknown as typeof WebSocket

// ── Mock localStorage ──────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// ── Mock import.meta.env ───────────────────────────────────────────────────
vi.stubEnv('VITE_WS_URL', 'ws://localhost:4000')
vi.stubEnv('VITE_SSE_REST_URL', 'http://localhost:4001')
vi.stubEnv('VITE_DATA_SOURCE', 'simulation')

// ── Mock react-leaflet (map requires real DOM/tile loading) ────────────────
vi.mock('react-leaflet', () => {
  const PassThrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  const LayersControlMock = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
  LayersControlMock.BaseLayer = PassThrough
  LayersControlMock.Overlay = PassThrough

  return {
    MapContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="map-container">{children}</div>
    ),
    TileLayer: () => null,
    LayersControl: LayersControlMock,
    CircleMarker: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="circle-marker">{children}</div>
    ),
    Marker: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="marker">{children}</div>
    ),
    Polygon: () => null,
    Popup: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="popup">{children}</div>
    ),
    useMap: vi.fn(() => ({ fitBounds: vi.fn(), setView: vi.fn() })),
  }
})

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    Icon: { Default: { mergeOptions: vi.fn() } },
  },
  divIcon: vi.fn(() => ({})),
  Icon: { Default: { mergeOptions: vi.fn() } },
}))
