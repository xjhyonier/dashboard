import { useMemo, useState } from 'react'

// ─── 筛选条件与可选项 ───────────────────────────────────────────────
export interface DailyFilters {
  village: string        // 'all' | 村社名称
  risk: string           // 'all' | 'major' | 'high' | 'medium' | 'low'
  entityType: string     // 'all' | 'production' | 'venue'
  fireType: string       // 'all' | 'fireKey' | 'nineSmall' | 'general'
  expert: string         // 'all' | 专家姓名
  team: string           // 'all' | 工作组名称
  status: string         // 'all' | '在业' | '停产' | '注销'
}

export interface DailyFilterOptions {
  villages: string[]
  workGroups: string[]
  experts: string[]
}

const RISK_MAP: Record<string, string> = {
  major: '重大', high: '较大', medium: '一般', low: '低',
}

// ─── 通用小卡片：两数对比（如 已开通/未开通） ─────────────────────────
const StatPair = ({
  title,
  rate,
  done,
  doneLabel,
  undone,
  undoneLabel,
  color = '#10B981',
}: {
  title: string
  rate: string
  done: number
  doneLabel: string
  undone: number
  undoneLabel: string
  color?: string
}) => {
  return (
    <div style={{ background: '#FAFBFC', borderRadius: 8, padding: 14, border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: rate, height: '100%', background: color, borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{rate}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: '#6B7280' }}>{doneLabel}</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{done.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
        <span style={{ color: '#6B7280' }}>{undoneLabel}</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{undone.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
      </div>
    </div>
  )
}

// ─── 五维分析单项：左侧指标 + 进度 + 数值 ─────────────────────────────
const FiveDimItem = ({
  title,
  rate,
  done,
  doneLabel,
  undone,
  undoneLabel,
}: {
  title: string
  rate: string
  done: number
  doneLabel: string
  undone: number
  undoneLabel: string
}) => {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 14, border: '1px solid #E5E7EB' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 10, background: '#E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: rate, height: '100%', background: '#10B981', borderRadius: 5 }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>{rate}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#6B7280' }}>{doneLabel}</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{done.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: '#6B7280' }}>{undoneLabel}</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{undone.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
      </div>
    </div>
  )
}

// ─── 占比分析：树节点 ─────────────────────────────────────────────────
const TreeNode = ({
  label,
  count,
  rate,
  children,
  color = '#10B981',
  level = 0,
}: {
  label: string
  count: number
  rate?: string
  children?: React.ReactNode
  color?: string
  level?: number
}) => {
  const paddingLeft = level === 0 ? 0 : 18
  return (
    <div style={{ paddingLeft }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, display: 'inline-block',
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#6B7280' }}>{count.toLocaleString()} {rate ? `(${rate})` : ''}</span>
      </div>
      {children && (
        <div style={{ borderLeft: '1px dashed #D1D5DB', paddingLeft: 10, marginLeft: 4 }}>
          {children}
        </div>
      )}
    </div>
  )
}

const RiskTag = ({ level, count, rate }: { level: string; count: number; rate: string }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    '重大风险': { bg: '#FEE2E2', color: '#DC2626' },
    '较大风险': { bg: '#FFEDD5', color: '#EA580C' },
    '一般风险': { bg: '#FEF3C7', color: '#D97706' },
    '低风险': { bg: '#D1FAE5', color: '#059669' },
  }
  const c = colors[level] || { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 11,
      background: c.bg, color: c.color, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {level} {count.toLocaleString()} ({rate})
    </span>
  )
}

// ─── 确定性随机（保证无筛选时数值稳定） ───────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type RiskDisp = '重大' | '较大' | '一般' | '低'
type EntityTypeKey = 'production' | 'venue'
type FireKey = 'fireKey' | 'nineSmall' | 'general'
type StatusKey = '在业' | '停产' | '注销'
type AiRisk = 'consistent' | 'inconsistent' | 'unrecognized'
type Rectify = 'completed' | 'partial' | 'uncompleted'

interface Entity {
  id: number
  village: string
  riskLevel: RiskDisp
  entityType: EntityTypeKey
  fireType: FireKey
  expert: string
  workGroup: string
  status: StatusKey
  activated: boolean
  infoCollected: boolean
  aiRisk: AiRisk
  riskMarked: boolean
  dutyEstablished: boolean
  riskIdentified: boolean
  planMade: boolean
  selfCheck: boolean
  hazardClosed: boolean
  todoPushed: boolean
  rectify: Rectify | null
  read: boolean
}

const DEFAULT_VILLAGES = ['良渚村', '勾庄村', '运河村', '石桥村', '管家塘', '金家渡', '西塘河', '七贤桥']
const DEFAULT_TEAMS = ['第一工作组', '第二工作组', '第三工作组', '第四工作组']
const DEFAULT_EXPERTS = ['张伟专家', '李娜专家', '王强专家', '刘洋专家', '陈静专家']

function generateEntities(opts: DailyFilterOptions): Entity[] {
  const villages = opts.villages.length ? opts.villages : DEFAULT_VILLAGES
  const workGroups = opts.workGroups.length ? opts.workGroups : DEFAULT_TEAMS
  const experts = opts.experts.length ? opts.experts : DEFAULT_EXPERTS
  const rnd = mulberry32(20260717)
  const TOTAL = 1160
  const list: Entity[] = []
  for (let i = 0; i < TOTAL; i++) {
    const r = rnd()
    const riskLevel: RiskDisp = r < 0.332 ? '重大' : r < 0.642 ? '较大' : r < 0.847 ? '一般' : '低'
    const activated = rnd() < 0.94138
    const infoCollected = rnd() < 0.92414
    const aiR = rnd()
    const aiRisk: AiRisk = aiR < 0.3974 ? 'consistent' : aiR < 0.8845 ? 'inconsistent' : 'unrecognized'
    const riskMarked = rnd() < 0.80086
    const dutyEstablished = rnd() < 0.31121
    const riskIdentified = rnd() < 0.82931
    const planMade = rnd() < 0.81466
    const selfCheck = rnd() < 0.80690
    const hazardClosed = rnd() < 0.81121
    const entityType: EntityTypeKey = rnd() < 0.6 ? 'production' : 'venue'
    const fireR = rnd()
    const fireType: FireKey = fireR < 0.2 ? 'fireKey' : fireR < 0.7 ? 'nineSmall' : 'general'
    const statusR = rnd()
    const status: StatusKey = statusR < 0.8 ? '在业' : statusR < 0.92 ? '停产' : '注销'
    const village = villages[Math.floor(rnd() * villages.length)]
    const workGroup = workGroups[Math.floor(rnd() * workGroups.length)]
    const expert = experts[Math.floor(rnd() * experts.length)]
    let todoPushed = false
    let rectify: Rectify | null = null
    let read = false
    if (activated) {
      todoPushed = rnd() < 0.93040
      if (todoPushed) {
        const x = rnd()
        rectify = x < 0.34646 ? 'completed' : x < 0.43012 ? 'partial' : 'uncompleted'
        if (rectify === 'uncompleted') read = rnd() < 0.53022
      }
    }
    list.push({
      id: i, village, riskLevel, entityType, fireType, expert, workGroup, status,
      activated, infoCollected, aiRisk, riskMarked, dutyEstablished, riskIdentified,
      planMade, selfCheck, hazardClosed, todoPushed, rectify, read,
    })
  }
  return list
}

const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(2) + '%' : '0.00%')

const RISK_LEVELS: RiskDisp[] = ['重大', '较大', '一般', '低']

function renderRiskTags(entities: Entity[]) {
  const total = entities.length
  return RISK_LEVELS
    .map(level => {
      const count = entities.filter(e => e.riskLevel === level).length
      return { level, count }
    })
    .filter(x => x.count > 0)
    .map(x => (
      <RiskTag
        key={x.level}
        level={x.level + '风险'}
        count={x.count}
        rate={pct(x.count, total)}
      />
    ))
}

export function DailySupervisionDimension({
  filters,
  options,
}: {
  filters: DailyFilters
  options: DailyFilterOptions
}) {
  const [viewMode, setViewMode] = useState<'level' | 'flow'>('level')

  // 实体全集（仅生成一次，确定性）
  const allEntities = useMemo(() => generateEntities(options), [options])

  // 按筛选条件过滤
  const entities = useMemo(() => {
    return allEntities.filter(e => {
      if (filters.village !== 'all' && e.village !== filters.village) return false
      if (filters.risk !== 'all' && e.riskLevel !== RISK_MAP[filters.risk]) return false
      if (filters.entityType !== 'all' && e.entityType !== filters.entityType) return false
      if (filters.fireType !== 'all' && e.fireType !== filters.fireType) return false
      if (filters.expert !== 'all' && e.expert !== filters.expert) return false
      if (filters.team !== 'all' && e.workGroup !== filters.team) return false
      if (filters.status !== 'all' && e.status !== filters.status) return false
      return true
    })
  }, [allEntities, filters])

  const total = entities.length

  // 概览统计
  const activated = entities.filter(e => e.activated)
  const infoCollected = entities.filter(e => e.infoCollected)
  const aiConsistent = entities.filter(e => e.aiRisk === 'consistent')
  const aiInconsistent = entities.filter(e => e.aiRisk === 'inconsistent')
  const aiUnrecognized = entities.filter(e => e.aiRisk === 'unrecognized')
  const riskMarked = entities.filter(e => e.riskMarked)

  // 五维分析
  const dutyEstablished = entities.filter(e => e.dutyEstablished)
  const riskIdentified = entities.filter(e => e.riskIdentified)
  const planMade = entities.filter(e => e.planMade)
  const selfCheck = entities.filter(e => e.selfCheck)
  const hazardClosed = entities.filter(e => e.hazardClosed)

  // 占比分析树
  const unactivated = entities.filter(e => !e.activated)
  const pushed = entities.filter(e => e.todoPushed)
  const notPushed = entities.filter(e => e.activated && !e.todoPushed)
  const completed = pushed.filter(e => e.rectify === 'completed')
  const partial = pushed.filter(e => e.rectify === 'partial')
  const uncompleted = pushed.filter(e => e.rectify === 'uncompleted')
  const readList = uncompleted.filter(e => e.read)
  const unreadList = uncompleted.filter(e => !e.read)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0 24px' }}>

      {/* 概览 */}
      <section>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>概览</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatPair title="单位开通情况" rate={pct(activated.length, total)} done={activated.length} doneLabel="已开通" undone={total - activated.length} undoneLabel="未开通" />
          <StatPair title="数据采集情况" rate={pct(infoCollected.length, total)} done={infoCollected.length} doneLabel="已采集" undone={total - infoCollected.length} undoneLabel="未采集" />
          <div style={{ background: '#FAFBFC', borderRadius: 8, padding: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>AI风险等级一致性</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>AI风险等级一致</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>{aiConsistent.length.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>AI风险等级不一致</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>{aiInconsistent.length.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>AI未识别风险等级</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>{aiUnrecognized.length.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
            </div>
          </div>
          <div style={{ background: '#FAFBFC', borderRadius: 8, padding: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>风险等级标注情况</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>已标注</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>{riskMarked.length.toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>未标注</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>{(total - riskMarked.length).toLocaleString()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 企业、场所五维分析 */}
      <section>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>企业、场所五维分析</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <FiveDimItem title="安全制度建立情况" rate={pct(dutyEstablished.length, total)} done={dutyEstablished.length} doneLabel="已建立" undone={total - dutyEstablished.length} undoneLabel="未建立" />
          <FiveDimItem title="风险点识别情况" rate={pct(riskIdentified.length, total)} done={riskIdentified.length} doneLabel="已识别" undone={total - riskIdentified.length} undoneLabel="未识别" />
          <FiveDimItem title="检查计划制定情况" rate={pct(planMade.length, total)} done={planMade.length} doneLabel="已制定" undone={total - planMade.length} undoneLabel="未制定" />
          <FiveDimItem title="自查自纠情况" rate={pct(selfCheck.length, total)} done={selfCheck.length} doneLabel="已自查" undone={total - selfCheck.length} undoneLabel="未自查" />
          <FiveDimItem title="隐患整改闭环情况" rate={pct(hazardClosed.length, total)} done={hazardClosed.length} doneLabel="已到位" undone={total - hazardClosed.length} undoneLabel="未到位" />
        </div>
      </section>

      {/* 占比分析 */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>占比分析</div>
          <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', padding: 2, borderRadius: 6 }}>
            <button
              onClick={() => setViewMode('level')}
              style={{
                padding: '4px 12px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer',
                background: viewMode === 'level' ? '#3B82F6' : 'transparent',
                color: viewMode === 'level' ? 'white' : '#6B7280',
              }}
            >
              按层级显示
            </button>
            <button
              onClick={() => setViewMode('flow')}
              style={{
                padding: '4px 12px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer',
                background: viewMode === 'flow' ? '#3B82F6' : 'transparent',
                color: viewMode === 'flow' ? 'white' : '#6B7280',
              }}
            >
              按流向显示
            </button>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
          <TreeNode label="责任主体总量" count={total} rate="100.0%">
            <TreeNode label="已开通企业" count={activated.length} rate={pct(activated.length, total)} color="#10B981">
              <TreeNode label="专家已推送待办" count={pushed.length} rate={pct(pushed.length, activated.length)} color="#10B981">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>完成整改</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{completed.length} ({pct(completed.length, total)})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 16 }}>
                    {renderRiskTags(completed)}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>部分完成</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{partial.length} ({pct(partial.length, total)})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 16 }}>
                    {renderRiskTags(partial)}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>未完成</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{uncompleted.length} ({pct(uncompleted.length, total)})</span>
                  </div>
                  <div style={{ paddingLeft: 16 }}>
                    <TreeNode label="已读" count={readList.length} rate={pct(readList.length, total)} color="#10B981">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {renderRiskTags(readList)}
                      </div>
                    </TreeNode>
                    <TreeNode label="未读" count={unreadList.length} rate={pct(unreadList.length, total)} color="#9CA3AF">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {renderRiskTags(unreadList)}
                      </div>
                    </TreeNode>
                  </div>
                </div>
                <TreeNode label="专家未推送待办" count={notPushed.length} rate={pct(notPushed.length, activated.length)} color="#9CA3AF">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {renderRiskTags(notPushed)}
                  </div>
                </TreeNode>
              </TreeNode>
            </TreeNode>
            <TreeNode label="未开通企业" count={unactivated.length} rate={pct(unactivated.length, total)} color="#9CA3AF">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {renderRiskTags(unactivated)}
              </div>
            </TreeNode>
          </TreeNode>
        </div>
      </section>

    </div>
  )
}
