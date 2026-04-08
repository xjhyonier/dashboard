/**
 * EnterpriseStatePath — 企业状态路径图（共享组件）
 *
 * 使用方：
 *   - 专家工作台效果看板（ExpertQueue.tsx）
 *   - 站长工作台看板（StationChiefDashboard.tsx）
 *
 * Props:
 *   onGotoQueue?: () => void  — 点击节点后跳转到任务队列（可选，站长视角不传）
 */

import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  useNodesState,
  useEdgesState,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ─── 类型定义 ───────────────────────────────────────────────

export interface StateNodeData {
  count: string
  label: string
  color: 'neutral' | 'green' | 'amber' | 'red' | 'dashed'
  clickable?: boolean
  subLabel?: string
  warning?: boolean
}

type StateNodeType = Node<StateNodeData, 'state'>

// ─── 节点坐标构建 ────────────────────────────────────────────

// 全部数据（站长视角）
const ALL_DATA: Record<string, string> = {
  all: '500', opened: '500', collected: '420', authorized: '380',
  risk_match: '218', risk_mismatch: '162', qualified: '218',
  not_opened: '0', not_collected: '80', not_authorized: '40',
  unqualified: '162', has_todo: '117', enterprise_read: '89',
  rectifying: '52', expert_verify: '19', todo_unread: '28',
  rectifying_ok: '19', rectifying_overdue: '18', no_todo: '45',
}

// 专家1数据（张建国）
const EXPERT_1_DATA: Record<string, string> = {
  all: '168', opened: '168', collected: '152', authorized: '145',
  risk_match: '89', risk_mismatch: '56', qualified: '89',
  not_opened: '0', not_collected: '16', not_authorized: '7',
  unqualified: '56', has_todo: '42', enterprise_read: '35',
  rectifying: '22', expert_verify: '8', todo_unread: '7',
  rectifying_ok: '8', rectifying_overdue: '5', no_todo: '14',
}

// 专家2数据（李红梅）
const EXPERT_2_DATA: Record<string, string> = {
  all: '176', opened: '176', collected: '158', authorized: '152',
  risk_match: '92', risk_mismatch: '60', qualified: '92',
  not_opened: '0', not_collected: '18', not_authorized: '6',
  unqualified: '60', has_todo: '45', enterprise_read: '38',
  rectifying: '20', expert_verify: '7', todo_unread: '7',
  rectifying_ok: '7', rectifying_overdue: '6', no_todo: '15',
}

// 专家3数据（王志强）
const EXPERT_3_DATA: Record<string, string> = {
  all: '156', opened: '156', collected: '110', authorized: '83',
  risk_match: '37', risk_mismatch: '46', qualified: '37',
  not_opened: '0', not_collected: '46', not_authorized: '27',
  unqualified: '46', has_todo: '30', enterprise_read: '16',
  rectifying: '10', expert_verify: '4', todo_unread: '14',
  rectifying_ok: '4', rectifying_overdue: '7', no_todo: '16',
}

// 按风险等级筛选的数据集（基于全部数据的比例）
const RISK_MAJOR_DATA: Record<string, string> = {
  all: '12', opened: '12', collected: '12', authorized: '11',
  risk_match: '2', risk_mismatch: '9', qualified: '2',
  not_opened: '0', not_collected: '0', not_authorized: '1',
  unqualified: '9', has_todo: '8', enterprise_read: '6',
  rectifying: '4', expert_verify: '1', todo_unread: '2',
  rectifying_ok: '1', rectifying_overdue: '2', no_todo: '1',
}

const RISK_HIGH_DATA: Record<string, string> = {
  all: '45', opened: '45', collected: '43', authorized: '41',
  risk_match: '12', risk_mismatch: '29', qualified: '12',
  not_opened: '0', not_collected: '2', not_authorized: '2',
  unqualified: '29', has_todo: '25', enterprise_read: '20',
  rectifying: '12', expert_verify: '4', todo_unread: '5',
  rectifying_ok: '4', rectifying_overdue: '3', no_todo: '4',
}

const RISK_MEDIUM_DATA: Record<string, string> = {
  all: '128', opened: '128', collected: '122', authorized: '116',
  risk_match: '68', risk_mismatch: '48', qualified: '68',
  not_opened: '0', not_collected: '6', not_authorized: '6',
  unqualified: '48', has_todo: '38', enterprise_read: '32',
  rectifying: '18', expert_verify: '8', todo_unread: '6',
  rectifying_ok: '8', rectifying_overdue: '4', no_todo: '10',
}

const RISK_LOW_DATA: Record<string, string> = {
  all: '195', opened: '195', collected: '188', authorized: '182',
  risk_match: '136', risk_mismatch: '46', qualified: '136',
  not_opened: '0', not_collected: '7', not_authorized: '6',
  unqualified: '46', has_todo: '28', enterprise_read: '25',
  rectifying: '12', expert_verify: '6', todo_unread: '3',
  rectifying_ok: '6', rectifying_overdue: '1', no_todo: '18',
}

// 专家+风险等级组合数据映射
const EXPERT_RISK_DATA: Record<string, Record<string, Record<string, string>>> = {
  'expert-1': {
    major: { all: '4', opened: '4', collected: '4', authorized: '4', risk_match: '1', risk_mismatch: '3', qualified: '1', unqualified: '3', has_todo: '3', enterprise_read: '2', rectifying: '1', expert_verify: '0', todo_unread: '1', rectifying_ok: '0', rectifying_overdue: '1', no_todo: '0', not_opened: '0', not_collected: '0', not_authorized: '0' },
    high: { all: '15', opened: '15', collected: '14', authorized: '14', risk_match: '4', risk_mismatch: '10', qualified: '4', unqualified: '10', has_todo: '8', enterprise_read: '6', rectifying: '3', expert_verify: '1', todo_unread: '2', rectifying_ok: '1', rectifying_overdue: '1', no_todo: '2', not_opened: '0', not_collected: '1', not_authorized: '0' },
    medium: { all: '42', opened: '42', collected: '40', authorized: '38', risk_match: '22', risk_mismatch: '16', qualified: '22', unqualified: '16', has_todo: '12', enterprise_read: '10', rectifying: '5', expert_verify: '2', todo_unread: '2', rectifying_ok: '2', rectifying_overdue: '1', no_todo: '4', not_opened: '0', not_collected: '2', not_authorized: '2' },
    low: { all: '107', opened: '107', collected: '94', authorized: '89', risk_match: '62', risk_mismatch: '27', qualified: '62', unqualified: '27', has_todo: '19', enterprise_read: '17', rectifying: '13', expert_verify: '5', todo_unread: '2', rectifying_ok: '5', rectifying_overdue: '2', no_todo: '8', not_opened: '0', not_collected: '13', not_authorized: '5' },
  },
  'expert-2': {
    major: { all: '5', opened: '5', collected: '5', authorized: '4', risk_match: '1', risk_mismatch: '3', qualified: '1', unqualified: '3', has_todo: '3', enterprise_read: '2', rectifying: '1', expert_verify: '0', todo_unread: '1', rectifying_ok: '0', rectifying_overdue: '1', no_todo: '0', not_opened: '0', not_collected: '0', not_authorized: '1' },
    high: { all: '18', opened: '18', collected: '17', authorized: '16', risk_match: '5', risk_mismatch: '11', qualified: '5', unqualified: '11', has_todo: '9', enterprise_read: '7', rectifying: '4', expert_verify: '1', todo_unread: '2', rectifying_ok: '1', rectifying_overdue: '2', no_todo: '2', not_opened: '0', not_collected: '1', not_authorized: '1' },
    medium: { all: '48', opened: '48', collected: '46', authorized: '44', risk_match: '26', risk_mismatch: '18', qualified: '26', unqualified: '18', has_todo: '14', enterprise_read: '11', rectifying: '6', expert_verify: '3', todo_unread: '3', rectifying_ok: '3', rectifying_overdue: '1', no_todo: '4', not_opened: '0', not_collected: '2', not_authorized: '2' },
    low: { all: '105', opened: '105', collected: '90', authorized: '88', risk_match: '60', risk_mismatch: '28', qualified: '60', unqualified: '28', has_todo: '19', enterprise_read: '18', rectifying: '9', expert_verify: '3', todo_unread: '1', rectifying_ok: '3', rectifying_overdue: '2', no_todo: '9', not_opened: '0', not_collected: '15', not_authorized: '2' },
  },
  'expert-3': {
    major: { all: '3', opened: '3', collected: '3', authorized: '3', risk_match: '0', risk_mismatch: '3', qualified: '0', unqualified: '3', has_todo: '2', enterprise_read: '2', rectifying: '1', expert_verify: '0', todo_unread: '0', rectifying_ok: '0', rectifying_overdue: '1', no_todo: '1', not_opened: '0', not_collected: '0', not_authorized: '0' },
    high: { all: '12', opened: '12', collected: '12', authorized: '11', risk_match: '3', risk_mismatch: '8', qualified: '3', unqualified: '8', has_todo: '8', enterprise_read: '7', rectifying: '5', expert_verify: '2', todo_unread: '1', rectifying_ok: '2', rectifying_overdue: '1', no_todo: '0', not_opened: '0', not_collected: '0', not_authorized: '1' },
    medium: { all: '38', opened: '38', collected: '36', authorized: '34', risk_match: '20', risk_mismatch: '14', qualified: '20', unqualified: '14', has_todo: '12', enterprise_read: '11', rectifying: '7', expert_verify: '3', todo_unread: '1', rectifying_ok: '3', rectifying_overdue: '1', no_todo: '2', not_opened: '0', not_collected: '2', not_authorized: '2' },
    low: { all: '103', opened: '103', collected: '59', authorized: '35', risk_match: '14', risk_mismatch: '21', qualified: '14', unqualified: '21', has_todo: '8', enterprise_read: '6', rectifying: '2', expert_verify: '1', todo_unread: '2', rectifying_ok: '1', rectifying_overdue: '1', no_todo: '7', not_opened: '0', not_collected: '44', not_authorized: '24' },
  },
}

function getDataByExpert(expertId?: string): Record<string, string> {
  if (expertId === 'expert-1') return EXPERT_1_DATA
  if (expertId === 'expert-2') return EXPERT_2_DATA
  if (expertId === 'expert-3') return EXPERT_3_DATA
  return ALL_DATA
}

function getDataByRiskLevel(riskLevel?: string): Record<string, string> | null {
  if (riskLevel === 'major') return RISK_MAJOR_DATA
  if (riskLevel === 'high') return RISK_HIGH_DATA
  if (riskLevel === 'medium') return RISK_MEDIUM_DATA
  if (riskLevel === 'low') return RISK_LOW_DATA
  return null
}

function getCombinedData(expertId?: string, riskLevel?: string): Record<string, string> {
  // 如果同时有专家筛选和风险等级筛选，使用组合数据
  if (expertId && riskLevel && riskLevel !== 'all') {
    const expertData = EXPERT_RISK_DATA[expertId]?.[riskLevel]
    if (expertData) return expertData
  }
  
  // 只有风险等级筛选
  if (riskLevel && riskLevel !== 'all') {
    return getDataByRiskLevel(riskLevel) || ALL_DATA
  }
  
  // 只有专家筛选（或都没有）
  return getDataByExpert(expertId)
}

function buildNodes(expertId?: string, riskLevel?: string): StateNodeType[] {
  // 获取组合筛选后的数据
  const data = getCombinedData(expertId, riskLevel)
  const NODE_W = 96
  const HGAP = 40
  const VGAP = 80

  const nodeBase: Partial<StateNodeType> = {
    type: 'state',
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }

  const x0 = 0
  const x1 = x0 + NODE_W + HGAP
  const x2 = x1 + NODE_W + HGAP
  const x3 = x2 + NODE_W + HGAP
  const x3a = x3 + NODE_W + HGAP
  const x3b = x3 + NODE_W + HGAP
  const x7 = x3b + NODE_W + HGAP
  const x8 = x7 + NODE_W + HGAP
  const x9 = x8 + NODE_W + HGAP
  const x10 = x9 + NODE_W + HGAP
  const x11 = x10 + NODE_W + HGAP
  const x12 = x11 + NODE_W + HGAP

  const branch_y = VGAP
  const sub_branch_y = VGAP * 2

  return [
    // ── 主流程（y=0）
    { id: 'all',            position: { x: x0,  y: 0 },         ...nodeBase, data: { count: data.all,            label: '全部企业',      color: 'neutral' } },
    { id: 'opened',         position: { x: x1,  y: 0 },         ...nodeBase, data: { count: data.opened,         label: '已开通',         color: 'neutral' } },
    { id: 'collected',      position: { x: x2,  y: 0 },         ...nodeBase, data: { count: data.collected,      label: '已采集',         color: 'neutral' } },
    { id: 'authorized',     position: { x: x3,  y: 0 },         ...nodeBase, data: { count: data.authorized,     label: '数据已授权',     color: 'neutral' } },
    { id: 'risk_match',     position: { x: x3a, y: 0 },         ...nodeBase, data: { count: data.risk_match,     label: '风险标签一致',   color: 'green'   } },
    { id: 'risk_mismatch',  position: { x: x3b, y: branch_y },  ...nodeBase, data: { count: data.risk_mismatch,  label: '风险标签不一致', color: 'red'     } },
    { id: 'qualified',      position: { x: x12, y: 0 },         ...nodeBase, data: { count: data.qualified,      label: '合格',           color: 'green'   } },

    // ── 断路分支（y=branch_y）：未开通/未采集/未授权
    { id: 'not_opened',     position: { x: x1,  y: branch_y },  ...nodeBase, data: { count: data.not_opened,     label: '未开通', color: 'dashed' } },
    { id: 'not_collected',  position: { x: x2,  y: branch_y },  ...nodeBase, data: { count: data.not_collected,  label: '未采集', color: 'dashed' } },
    { id: 'not_authorized', position: { x: x3,  y: branch_y },  ...nodeBase, data: { count: data.not_authorized, label: '未授权', color: 'dashed' } },

    // ── 不合格跟进流程（y=branch_y）
    { id: 'unqualified',      position: { x: x7,  y: branch_y }, ...nodeBase, data: { count: data.unqualified,   label: '不合格',   color: 'amber' } },
    { id: 'has_todo',         position: { x: x8,  y: branch_y }, ...nodeBase, data: { count: data.has_todo,      label: '有待办',   color: 'amber' } },
    { id: 'enterprise_read',  position: { x: x9,  y: branch_y }, ...nodeBase, data: { count: data.enterprise_read, label: '企业已读', color: 'amber' } },
    { id: 'rectifying',       position: { x: x10, y: branch_y }, ...nodeBase, data: { count: data.rectifying,    label: '整改中',   color: 'amber' } },
    { id: 'expert_verify',    position: { x: x11, y: branch_y }, ...nodeBase, data: { count: data.expert_verify, label: '专家验收', color: 'amber' } },

    // ── 待办未读（y=sub_branch_y）
    { id: 'todo_unread',        position: { x: x9,  y: sub_branch_y },      ...nodeBase, data: { count: data.todo_unread, label: '待办未读',  color: 'amber', warning: true } },

    // ── 整改分叉（y=sub_branch_y）
    { id: 'rectifying_ok',      position: { x: x10, y: sub_branch_y },      ...nodeBase, data: { count: data.rectifying_ok, label: '整改未逾期', color: 'green' } },
    { id: 'rectifying_overdue', position: { x: x10, y: sub_branch_y + 80 }, ...nodeBase, data: { count: data.rectifying_overdue, label: '整改逾期',   color: 'red',   warning: true } },

    // ── 无待办断路（y=sub_branch_y）
    { id: 'no_todo', position: { x: x8, y: sub_branch_y }, ...nodeBase, data: { count: data.no_todo, label: '无待办', color: 'dashed' } },
  ]
}

// ─── 边连接构建 ──────────────────────────────────────────────

function buildEdges(): Edge[] {
  return [
    // 主流程横向实线
    { id: 'e-all-opened',           source: 'all',       target: 'opened',      style: { stroke: '#d4d4d8', strokeWidth: 1.5 } },
    { id: 'e-opened-collected',     source: 'opened',    target: 'collected',   style: { stroke: '#d4d4d8', strokeWidth: 1.5 } },
    { id: 'e-collected-authorized', source: 'collected', target: 'authorized',  style: { stroke: '#d4d4d8', strokeWidth: 1.5 } },

    // 数据已授权 → 风险标签一致/不一致
    { id: 'e-auth-risk_match',    source: 'authorized', target: 'risk_match',    sourcePosition: 'right', targetPosition: 'left', style: { stroke: '#6ee7b7', strokeWidth: 2 } },
    { id: 'e-auth-risk_mismatch', source: 'authorized', target: 'risk_mismatch', sourcePosition: 'right', targetPosition: 'left', style: { stroke: '#fca5a5', strokeWidth: 2 } },

    // 风险标签一致 → 合格
    { id: 'e-risk_match-qualified', source: 'risk_match', target: 'qualified', sourcePosition: 'right', targetPosition: 'left', style: { stroke: '#6ee7b7', strokeWidth: 2.5 } },

    // 风险标签不一致/合格 → 不合格
    { id: 'e-risk_mismatch-unqualified', source: 'risk_match', target: 'unqualified', sourcePosition: 'bottom', targetPosition: 'top', style: { stroke: '#fbbf24', strokeWidth: 2 } },

    // 不合格 → 有待办 / 无待办
    { id: 'e-unq-has_todo', source: 'unqualified', target: 'has_todo', style: { stroke: '#fbbf24', strokeWidth: 1.5 } },
    { id: 'e-unq-no_todo',  source: 'unqualified', target: 'no_todo', sourcePosition: 'bottom', targetPosition: 'top', style: { stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 3' } },

    // 有待办 → 待办未读（分支）
    { id: 'e-has_todo-todo_unread',     source: 'has_todo', target: 'todo_unread',     style: { stroke: '#fbbf24', strokeWidth: 1.5 } },
    // 有待办 → 企业已读（主流程）
    { id: 'e-has_todo-enterprise_read', source: 'has_todo', target: 'enterprise_read', style: { stroke: '#fbbf24', strokeWidth: 1.5 } },

    // 企业已读 → 整改三态
    { id: 'e-enterprise_read-rectifying',         source: 'enterprise_read', target: 'rectifying',         style: { stroke: '#d4d4d8', strokeWidth: 1.5 } },
    { id: 'e-enterprise_read-rectifying_ok',      source: 'enterprise_read', target: 'rectifying_ok',      sourcePosition: 'bottom', targetPosition: 'top', style: { stroke: '#6ee7b7', strokeWidth: 1.5 } },
    { id: 'e-enterprise_read-rectifying_overdue', source: 'enterprise_read', target: 'rectifying_overdue', sourcePosition: 'bottom', targetPosition: 'top', style: { stroke: '#fca5a5', strokeWidth: 1.5 } },

    // 整改中 → 专家验收 → 合格
    { id: 'e-rectifying-expert_verify', source: 'rectifying',   target: 'expert_verify', style: { stroke: '#d4d4d8', strokeWidth: 1.5 } },
    { id: 'e-expert_verify-qualified',  source: 'expert_verify', target: 'qualified',     sourcePosition: 'top', targetPosition: 'bottom', style: { stroke: '#6ee7b7', strokeWidth: 2.5 } },

    // 断路虚线（未开通/未采集/未授权）
    { id: 'e-all-not_opened',          source: 'all',       target: 'not_opened',     sourcePosition: 'top', targetPosition: 'bottom', style: { stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 3' } },
    { id: 'e-opened-not_collected',    source: 'opened',    target: 'not_collected',  sourcePosition: 'top', targetPosition: 'bottom', style: { stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 3' } },
    { id: 'e-collected-not_authorized',source: 'collected', target: 'not_authorized', sourcePosition: 'top', targetPosition: 'bottom', style: { stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 3' } },
  ]
}

// ─── 节点渲染组件 ────────────────────────────────────────────

function StateNodeComponent({ data }: { data: StateNodeData }) {
  const colorMap = {
    neutral: {
      bg: 'bg-zinc-50',
      border: data.label === '全部企业' ? 'border-zinc-500' : 'border-zinc-400',
      text: 'text-zinc-800',
      countSize: data.label === '全部企业' ? 'text-[15px]' : 'text-[13px]',
      bold: data.label === '全部企业' ? 'font-bold' : 'font-semibold',
    },
    green:   { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-900', countSize: 'text-[13px]', bold: 'font-bold' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-500',   text: 'text-amber-900',   countSize: 'text-[13px]', bold: 'font-bold' },
    red:     { bg: 'bg-red-50',     border: 'border-red-500',     text: 'text-red-900',     countSize: 'text-[13px]', bold: 'font-bold' },
    dashed:  { bg: 'bg-zinc-50',    border: 'border-dashed border-zinc-500', text: 'text-zinc-600', countSize: 'text-[13px]', bold: 'font-semibold' },
  }

  const c = colorMap[data.color]

  return (
    <div className={`rounded-lg border-2 ${c.border} ${c.bg} relative
      ${data.clickable ? 'cursor-pointer hover:shadow-md hover:scale-105 transition-all' : ''}
      ${data.warning ? 'ring-2 ring-red-300 ring-offset-1' : ''}`}>
      <Handle type="target" position={Position.Left}  style={{ width: 8, height: 8, background: '#d4d4d8', border: '1px solid #a1a1aa' }} />
      <Handle type="source" position={Position.Right} style={{ width: 8, height: 8, background: '#d4d4d8', border: '1px solid #a1a1aa' }} />

      <div className="px-3 py-2">
        <div className={`${c.countSize} ${c.bold} ${c.text} text-center leading-tight`}>{data.count}</div>
        <div className={`text-[11px] ${c.bold} ${c.text} text-center leading-tight mt-0.5`}>{data.label}</div>
        {data.subLabel && (
          <div className={`text-[10px] ${c.text} text-center opacity-50 leading-tight`}>{data.subLabel}</div>
        )}
      </div>

      {data.warning && (
        <div className="absolute -top-2 -right-2 px-1 py-0.5 rounded text-[9px] font-semibold bg-red-500 text-white">⚠</div>
      )}
    </div>
  )
}

const nodeTypes = { state: StateNodeComponent }

// ─── 主组件 ──────────────────────────────────────────────────

const CLICKABLE_IDS = [
  'all', 'opened', 'collected', 'authorized',
  'risk_match', 'risk_mismatch', 'qualified',
  'unqualified', 'has_todo', 'todo_unread',
  'enterprise_read', 'rectifying', 'rectifying_ok', 'rectifying_overdue',
  'expert_verify', 'not_opened', 'not_collected', 'not_authorized', 'no_todo',
]

export interface EnterpriseStatePathProps {
  /** 点击节点后的回调（可跳转到任务队列），不传则仅显示浮层 */
  onGotoQueue?: () => void
  /** 组件外层高度，默认 480 */
  height?: number
  /** 专家ID筛选，'all' 或 undefined 表示全部 */
  expertId?: string
  /** 风险等级筛选：'major' | 'high' | 'medium' | 'low'，不传表示全部 */
  riskLevel?: string
}

export function EnterpriseStatePath({ onGotoQueue: _onGotoQueue, height = 480, expertId, riskLevel }: EnterpriseStatePathProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(expertId, riskLevel))
  const [edges, , onEdgesChange] = useEdgesState(buildEdges())

  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; count: string } | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  // 监听 expertId 和 riskLevel 变化，重新构建节点数据
  useEffect(() => {
    const newNodes = buildNodes(expertId, riskLevel)
    setNodes(newNodes)
  }, [expertId, riskLevel, setNodes])

  const handleNodeClick = useCallback((_: unknown, node: StateNodeType) => {
    if (node.data.count && node.data.count !== '0') {
      setSelectedNode({ id: node.id, label: node.data.label, count: node.data.count })
      const rect = document.querySelector('.react-flow')?.getBoundingClientRect()
      if (rect) {
        setPopupPosition({ x: rect.width / 2, y: rect.height / 2 - 100 })
      }
    }
  }, [])

  return (
    <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-zinc-700">企业状态路径</span>
        <span className="text-[11px] text-zinc-400 ml-1">实时 · 全量</span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />合格/闭环</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />不合格/待办</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />整改逾期</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-zinc-300 inline-block" />未X（断路）</span>
          <span className="text-zinc-300">· 可拖拽节点调整布局</span>
        </div>
      </div>

      {/* React Flow 画布 */}
      <div className="relative [&_.react-flow__pane]:!cursor-default" style={{ height }}>
        <ReactFlow
          nodes={nodes.map(n => CLICKABLE_IDS.includes(n.id) ? { ...n, data: { ...n.data, clickable: true } } : n)}
          edges={edges}
          onNodeClick={handleNodeClick}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          panOnDrag={false}
          nodesDraggable={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          className="bg-zinc-50/50"
        >
          <Background gap={20} color="#e4e4e7" />
          <Controls position="bottom-right" style={{ width: 28, height: 28 }} showInteractive={false} />
          <MiniMap
            position="top-right"
            nodeColor={(n) => {
              const d = n.data as StateNodeData
              if (d.color === 'green')  return '#6ee7b7'
              if (d.color === 'amber')  return '#fcd34d'
              if (d.color === 'red')    return '#fca5a5'
              if (d.color === 'dashed') return '#d4d4d8'
              return '#e4e4e7'
            }}
            maskColor="rgba(255,255,255,0.8)"
            style={{ width: 120, height: 80 }}
          />
        </ReactFlow>

        {/* 企业列表浮层 */}
        {selectedNode && (
          <div
            className="absolute bg-white rounded-xl shadow-2xl border border-zinc-200/80 overflow-hidden z-50"
            style={{ left: popupPosition.x, top: popupPosition.y, transform: 'translate(-50%, 0)', minWidth: 320, maxWidth: 400 }}
          >
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-800">{selectedNode.label}</div>
                  <div className="text-[11px] text-zinc-400">共 {selectedNode.count} 家</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-6 h-6 rounded hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <div className="p-2 space-y-1">
                {[
                  { name: '浙江天成科技有限公司', desc: '行业：一般工贸 · 风险等级：较大风险', dot: 'bg-amber-400' },
                  { name: '杭州恒通纺织有限公司', desc: '行业：生产企业 · 风险等级：一般风险', dot: 'bg-amber-400' },
                  { name: '宁波华欣建材有限公司', desc: '行业：一般工贸 · 风险等级：低风险',   dot: 'bg-emerald-400' },
                ].map((e, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-700">{e.name}</div>
                      <div className="text-[11px] text-zinc-400">{e.desc}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${e.dot}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
              <button className="w-full text-center text-[12px] font-medium text-emerald-600 hover:text-emerald-700">
                查看全部企业 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
