import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { DimensionScore } from '../pages/mock/station-chief'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface RadarDataPoint {
  dimension: string
  current: number
  previous: number
  fullMark: number
}

export interface GovernanceRadarChartProps {
  dimensions: DimensionScore[]
  height?: number
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function toRadarData(dimensions: DimensionScore[]): RadarDataPoint[] {
  return dimensions.map((dim) => ({
    dimension: dim.name,
    current: dim.score,
    previous: dim.prevScore,
    fullMark: 100,
  }))
}

// ─────────────────────────────────────────────
// Custom tooltip
// ─────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white rounded-lg border border-zinc-200 shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-zinc-800 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-zinc-600">{entry.name}:</span>
          <span className="font-semibold text-zinc-800">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function GovernanceRadarChart({
  dimensions,
  height = 320,
}: GovernanceRadarChartProps) {
  const data = toRadarData(dimensions)

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#71717a', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            tickCount={5}
          />

          <Radar
            name="上月"
            dataKey="previous"
            stroke="#a5b4fc"
            fill="#a5b4fc"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          <Radar
            name="当月"
            dataKey="current"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={2}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#71717a' }}
            iconType="circle"
            iconSize={8}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
