import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BusinessSelector, RoleSwitcher } from './components/common'
import { quickBIConfig, emergencyConfig } from './types/role'
import { CEODashboard } from './business/quickbi/pages/CEODashboard'
import { ProductDashboard } from './business/quickbi/pages/ProductDashboard'
import { SalesDashboard } from './business/quickbi/pages/SalesDashboard'
import { GovernmentLeaderDashboard } from './business/emergency/pages/GovernmentLeaderDashboard'
import { StationChiefDashboard } from './business/emergency/pages/StationChiefDashboard'
import { EnterpriseBossDashboard } from './business/emergency/pages/EnterpriseBossDashboard'
import { ExpertApp } from './business/expert/ExpertApp'

const DEFAULT_PATH_BY_BUSINESS = {
  quickbi: '/quickbi/ceo',
  emergency: '/emergency/expert/queue',
} as const

const ROLE_PATHS: Record<string, Record<string, string>> = {
  quickbi: {
    ceo: '/quickbi/ceo',
    product: '/quickbi/product',
    sales: '/quickbi/sales',
    operation: '/quickbi/operation',
  },
  emergency: {
    'government-leader': '/emergency/government-leader',
    'station-chief': '/emergency/station-chief',
    'expert-workbench': '/emergency/expert/queue',
    'enterprise-boss': '/emergency/enterprise-boss',
    'monthly-report': '/emergency/monthly-report',
  },
}

function getRouteSelection(pathname: string) {
  if (pathname.startsWith('/quickbi/')) {
    const role = pathname.split('/')[2] || 'ceo'
    return { currentBusiness: 'quickbi', currentRole: role }
  }

  if (pathname.startsWith('/emergency/expert')) {
    return { currentBusiness: 'emergency', currentRole: 'expert-workbench' }
  }

  if (pathname.startsWith('/emergency/')) {
    const role = pathname.split('/')[2] || 'expert-workbench'
    return { currentBusiness: 'emergency', currentRole: role }
  }

  return { currentBusiness: 'emergency', currentRole: 'expert-workbench' }
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: '96px 24px', textAlign: 'center', color: '#64748b' }}>
      <div style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{title}</div>
      <div>该页面暂未实现，但已具备独立 URL 地址。</div>
    </div>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentBusiness, currentRole } = getRouteSelection(location.pathname)

  const businesses = [quickBIConfig, emergencyConfig]
  const currentBusinessConfig = businesses.find(b => b.id === currentBusiness)
  // 隐藏不需要展示的角色（例如：暂时移除“应消站站长”）
  const roles = (currentBusinessConfig?.roles || []).filter(r => {
  // 保留站长入口：只隐藏临时需要移除的角色项可通过 feature flag 控制，默认不隐藏 station-chief
  if (currentBusiness === 'emergency' && r.id === 'station-chief') {
    return true
  }
  return true
})

  const handleBusinessChange = (businessId: string) => {
    navigate(DEFAULT_PATH_BY_BUSINESS[businessId as keyof typeof DEFAULT_PATH_BY_BUSINESS] ?? '/emergency/expert/queue')
  }

  const handleRoleChange = (roleId: string) => {
    const target = ROLE_PATHS[currentBusiness]?.[roleId] ?? DEFAULT_PATH_BY_BUSINESS[currentBusiness as keyof typeof DEFAULT_PATH_BY_BUSINESS]
    navigate(target)
  }

  return (
    <div>
      {/* 顶部导航栏 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        zIndex: 999
      }}>
        <BusinessSelector
          businesses={businesses}
          currentBusiness={currentBusiness}
          onBusinessChange={handleBusinessChange}
        />
        <RoleSwitcher
          roles={roles}
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
        />
      </div>

      {/* 内容区域 */}
      <div style={{ marginTop: '60px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/emergency/expert/queue" replace />} />

          <Route path="/quickbi/ceo" element={<CEODashboard />} />
          <Route path="/quickbi/product" element={<ProductDashboard />} />
          <Route path="/quickbi/sales" element={<SalesDashboard />} />
          <Route path="/quickbi/operation" element={<PlaceholderPage title="运营经理" />} />

          <Route path="/emergency/government-leader" element={<GovernmentLeaderDashboard />} />
          <Route path="/emergency/station-chief" element={<StationChiefDashboard />} />
          <Route path="/emergency/expert/*" element={<ExpertApp />} />
          <Route path="/emergency/enterprise-boss" element={<EnterpriseBossDashboard />} />
          <Route path="/emergency/monthly-report" element={<PlaceholderPage title="月度报告" />} />

          <Route path="*" element={<Navigate to="/emergency/expert/queue" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
