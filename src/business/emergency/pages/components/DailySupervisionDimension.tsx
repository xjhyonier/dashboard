import { useState } from 'react'

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

export function DailySupervisionDimension() {
  const [viewMode, setViewMode] = useState<'level' | 'flow'>('level')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0 24px' }}>

      {/* 概览 */}
      <section>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>概览</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatPair title="单位开通情况" rate="94.14%" done={1092} doneLabel="已开通" undone={68} undoneLabel="未开通" />
          <StatPair title="数据采集情况" rate="92.50%" done={1073} doneLabel="已采集" undone={87} undoneLabel="未采集" />
          <div style={{ background: '#FAFBFC', borderRadius: 8, padding: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>AI风险等级一致性</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>AI风险等级一致</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>461 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>AI风险等级不一致</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>565 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>AI未识别风险等级</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>134 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
            </div>
          </div>
          <div style={{ background: '#FAFBFC', borderRadius: 8, padding: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>风险等级标注情况</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>已标注</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>929 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>未标注</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>231 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(户)</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 企业、场所五维分析 */}
      <section>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>企业、场所五维分析</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <FiveDimItem title="安全制度建立情况" rate="31.02%" done={361} doneLabel="已建立" undone={799} undoneLabel="未建立" />
          <FiveDimItem title="风险点识别情况" rate="82.93%" done={962} doneLabel="已识别" undone={198} undoneLabel="未识别" />
          <FiveDimItem title="检查计划制定情况" rate="81.47%" done={945} doneLabel="已制定" undone={215} undoneLabel="未制定" />
          <FiveDimItem title="自查自纠情况" rate="80.69%" done={936} doneLabel="已自查" undone={224} undoneLabel="未自查" />
          <FiveDimItem title="隐患整改闭环情况" rate="81.42%" done={941} doneLabel="已到位" undone={219} undoneLabel="未到位" />
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
          <TreeNode label="责任主体总量" count={1160} rate="100.0%">
            <TreeNode label="已开通企业" count={1092} rate="94.1%" color="#10B981">
              <TreeNode label="专家已推送待办" count={1016} rate="87.6%" color="#10B981">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>完成整改</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>352 (30.3%)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 16 }}>
                    <RiskTag level="重大风险" count={177} rate="15.3%" />
                    <RiskTag level="一般风险" count={8} rate="0.7%" />
                    <RiskTag level="较大风险" count={149} rate="12.8%" />
                    <RiskTag level="低风险" count={18} rate="1.6%" />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>部分完成</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>85 (7.3%)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 16 }}>
                    <RiskTag level="重大风险" count={50} rate="4.3%" />
                    <RiskTag level="一般风险" count={2} rate="0.2%" />
                    <RiskTag level="较大风险" count={30} rate="2.6%" />
                    <RiskTag level="低风险" count={3} rate="0.3%" />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>未完成</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>579 (49.9%)</span>
                  </div>
                  <div style={{ paddingLeft: 16 }}>
                    <TreeNode label="已读" count={307} rate="26.5%" color="#10B981">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        <RiskTag level="重大风险" count={45} rate="3.9%" />
                        <RiskTag level="一般风险" count={140} rate="12.1%" />
                        <RiskTag level="较大风险" count={97} rate="8.4%" />
                        <RiskTag level="低风险" count={25} rate="2.2%" />
                      </div>
                    </TreeNode>
                    <TreeNode label="未读" count={272} rate="23.4%" color="#9CA3AF">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        <RiskTag level="重大风险" count={87} rate="7.5%" />
                        <RiskTag level="一般风险" count={69} rate="5.9%" />
                        <RiskTag level="较大风险" count={59} rate="5.1%" />
                        <RiskTag level="低风险" count={56} rate="4.8%" />
                      </div>
                    </TreeNode>
                  </div>
                </div>
                <TreeNode label="专家未推送待办" count={76} rate="6.6%" color="#9CA3AF">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <RiskTag level="重大风险" count={3} rate="0.3%" />
                    <RiskTag level="一般风险" count={5} rate="0.4%" />
                    <RiskTag level="较大风险" count={3} rate="0.3%" />
                    <RiskTag level="低风险" count={64} rate="5.5%" />
                  </div>
                </TreeNode>
              </TreeNode>
            </TreeNode>
            <TreeNode label="未开通企业" count={68} rate="5.9%" color="#9CA3AF">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                <RiskTag level="重大风险" count={2} rate="0.2%" />
                <RiskTag level="一般风险" count={6} rate="0.7%" />
                <RiskTag level="较大风险" count={1} rate="0.1%" />
                <RiskTag level="低风险" count={48} rate="4.1%" />
              </div>
            </TreeNode>
          </TreeNode>
        </div>
      </section>

    </div>
  )
}
