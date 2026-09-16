import { CheckSquare, LayoutDashboard, RepeatIcon, Target, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTodos } from '../hooks/useTodos'
import { isToday, isTomorrow, isAfter, parseISO } from 'date-fns'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'todos', label: 'Tugas', icon: CheckSquare },
  { id: 'habits', label: 'Rutinitas', icon: RepeatIcon },
  { id: 'targets', label: 'Target & Reward', icon: Target },
]

export default function Sidebar({ activePage, onNavigate, className = '' }) {
  const { signOut, displayName } = useAuth()
  const { todos } = useTodos()
  const userName = displayName
  const initials = userName.slice(0, 2).toUpperCase()

  // Count urgent notifications: overdue + due today
  const urgentCount = todos.filter(t => {
    if (t.is_completed || !t.due_date) return false
    try {
      const d = parseISO(t.due_date)
      return isToday(d) || (isAfter(new Date(), d) && !isToday(d))
    } catch { return false }
  }).length

  const tomorrowCount = todos.filter(t => {
    if (t.is_completed || !t.due_date) return false
    try { return isTomorrow(parseISO(t.due_date)) } catch { return false }
  }).length

  const totalBadge = urgentCount + tomorrowCount

  return (
    <aside className={`sidebar ${className}`}>
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
            {/* Show badge on dashboard nav item */}
            {id === 'dashboard' && totalBadge > 0 && (
              <span className="nav-badge">{totalBadge > 9 ? '9+' : totalBadge}</span>
            )}
            {/* Show badge on todos nav item for urgent */}
            {id === 'todos' && urgentCount > 0 && (
              <span className="nav-badge urgent">{urgentCount > 9 ? '9+' : urgentCount}</span>
            )}
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
