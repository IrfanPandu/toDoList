import { CheckSquare, LayoutDashboard, RepeatIcon, Target, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'todos', label: 'Tugas', icon: CheckSquare },
  { id: 'habits', label: 'Rutinitas', icon: RepeatIcon },
  { id: 'targets', label: 'Target & Reward', icon: Target },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { signOut, displayName } = useAuth()
  const userName = displayName
  const initials = userName.slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <CheckSquare size={24} />
        <span>TodoApp</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <span className="user-name">{userName}</span>
            <span className="user-role">Member</span>
          </div>
        </div>
        <button className="btn-icon logout-btn" onClick={signOut} title="Keluar">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
