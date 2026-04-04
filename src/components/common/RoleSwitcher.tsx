import { Role } from '../../types/business'

interface RoleSwitcherProps {
  roles: Role[]
  currentRole: string
  onRoleChange: (roleId: string) => void
}

export function RoleSwitcher({ roles, currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      background: '#f8fafc',
      padding: '8px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => onRoleChange(role.id)}
          style={{
            padding: '8px 16px',
            background: role.id === currentRole ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: role.id === currentRole ? '#4f46e5' : '#64748b',
            boxShadow: role.id === currentRole ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
            transition: 'all 0.2s'
          }}
          title={role.description}
        >
          {role.name}
        </button>
      ))}
    </div>
  )
}
