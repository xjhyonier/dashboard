import { useState } from 'react'
import { BusinessSelector, RoleSwitcher } from './components/common'
import { quickBIConfig, emergencyConfig } from './types/role'
import { CEODashboard } from './business/quickbi/pages/CEODashboard'
import { ProductDashboard } from './business/quickbi/pages/ProductDashboard'
import { SalesDashboard } from './business/quickbi/pages/SalesDashboard'
import { GovernmentLeaderDashboard } from './business/emergency/pages/GovernmentLeaderDashboard'
import { StationChiefDashboard } from './business/emergency/pages/StationChiefDashboard'
import { EnterpriseBossDashboard } from './business/emergency/pages/EnterpriseBossDashboard'
import { ExpertApp } from './business/expert/ExpertApp'

function App() {
  const [currentBusiness, setCurrentBusiness] = useState('emergency')
  const [currentRole, setCurrentRole] = useState('expert-workbench')
  
  const businesses = [quickBIConfig, emergencyConfig]
  const currentBusinessConfig = businesses.find(b => b.id === currentBusiness)
  const roles = currentBusinessConfig?.roles || []

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
          onBusinessChange={setCurrentBusiness}
        />
        <RoleSwitcher
          roles={roles}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />
      </div>

      {/* 内容区域 */}
      <div style={{ marginTop: '60px' }}>
        {/* QuickBI 业务线 */}
        {currentBusiness === 'quickbi' && (
          <>
            {currentRole === 'ceo' && <CEODashboard />}
            {currentRole === 'product' && <ProductDashboard />}
            {currentRole === 'sales' && <SalesDashboard />}
          </>
        )}
        
        {/* 应急业务线 */}
        {currentBusiness === 'emergency' && (
          <>
            {currentRole === 'government-leader' && <GovernmentLeaderDashboard />}
            {currentRole === 'station-chief' && <StationChiefDashboard />}
            {currentRole === 'expert-workbench' && <ExpertApp />}
            {currentRole === 'enterprise-boss' && <EnterpriseBossDashboard />}
          </>
        )}
      </div>
    </div>
  )
}

export default App
