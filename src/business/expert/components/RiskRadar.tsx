import { useState } from 'react'
import type { BoardScore } from '../types'
import { getRiskScoreColor } from '../utils/helpers'

interface RiskRadarProps {
  boardScores: BoardScore[]
  onBoardClick?: (board: string) => void
  activeBoard?: string
}

export function RiskRadar({ boardScores, onBoardClick, activeBoard }: RiskRadarProps) {
  const [viewMode, setViewMode] = useState<'radar' | 'matrix'>('radar')

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#16a34a'
    if (score >= 60) return '#d97706'
    if (score >= 40) return '#f97316'
    return '#dc2626'
  }

  // 雷达图参数计算
  const center = 120
  const radius = 90
  const angles = boardScores.map((_, i) => (2 * Math.PI * i) / boardScores.length - Math.PI / 2)

  // 生成雷达多边形路径
  const radarPath = boardScores.map((score, i) => {
    const r = (score.score / 100) * radius
    const x = center + r * Math.cos(angles[i])
    const y = center + r * Math.sin(angles[i])
    return `${x},${y}`
  }).join(' ')

  // 生成网格多边形
  const gridLevels = [25, 50, 75, 100]

  return (
    <div className="card">
      {/* 标题 + 视图切换 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">七大板块健康度</h3>
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('radar')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all
              ${viewMode === 'radar'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
              }`}
          >
            雷达图
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all
              ${viewMode === 'matrix'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
              }`}
          >
            矩阵视图
          </button>
        </div>
      </div>

      {/* 雷达图模式 */}
      {viewMode === 'radar' && (
        <div className="flex justify-center">
          <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible">
            {/* 网格 */}
            {gridLevels.map((level) => {
              const r = (level / 100) * radius
              const points = angles.map((angle) => {
                const x = center + r * Math.cos(angle)
                const y = center + r * Math.sin(angle)
                return `${x},${y}`
              }).join(' ')
              return (
                <polygon
                  key={level}
                  points={points}
                  fill="none"
                  stroke="rgba(15,23,42,0.06)"
                  strokeWidth="1"
                />
              )
            })}

            {/* 轴线 */}
            {angles.map((angle, i) => (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="rgba(15,23,42,0.06)"
                strokeWidth="1"
              />
            ))}

            {/* 数据多边形 */}
            <polygon
              points={radarPath}
              fill="rgba(79, 70, 229, 0.15)"
              stroke="#4f46e5"
              strokeWidth="2"
            />

            {/* 数据点 + 标签 */}
            {boardScores.map((score, i) => {
              const x = center + radius * Math.cos(angles[i])
              const y = center + radius * Math.sin(angles[i])
              const labelRadius = radius + 20
              const lx = center + labelRadius * Math.cos(angles[i])
              const ly = center + labelRadius * Math.sin(angles[i])
              const isActive = activeBoard === score.board

              return (
                <g key={score.board}>
                  {/* 数据点 */}
                  <circle
                    cx={x * (score.score / 100) + center * (1 - score.score / 100)}
                    cy={y * (score.score / 100) + center * (1 - score.score / 100)}
                    r={isActive ? 5 : 3}
                    fill={getScoreColor(score.score)}
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onBoardClick?.(score.board)}
                  />
                  {/* 标签 */}
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-xs ${isActive ? 'fill-primary font-semibold' : 'fill-text-secondary'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onBoardClick?.(score.board)}
                  >
                    {score.board}
                  </text>
                  {/* 分值 */}
                  <text
                    x={lx}
                    y={ly + 14}
                    textAnchor="middle"
                    className="text-xs"
                    fill={getScoreColor(score.score)}
                  >
                    {score.score}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* 矩阵视图模式 */}
      {viewMode === 'matrix' && (
        <div className="space-y-2">
          {boardScores.map((score) => {
            const isActive = activeBoard === score.board
            return (
              <div
                key={score.board}
                onClick={() => onBoardClick?.(score.board)}
                className={`
                  flex items-center justify-between p-3 rounded-lg cursor-pointer
                  transition-colors border
                  ${isActive
                    ? 'bg-primary/5 border-primary/20'
                    : 'hover:bg-slate-50 border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getScoreColor(score.score) }}
                  />
                  <span className={`text-sm ${isActive ? 'font-semibold text-primary' : 'font-medium text-text'}`}>
                    {score.board}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${getRiskScoreColor(score.score)}`}>
                    {score.score}分
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {score.anomalyCount} 项异常
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
