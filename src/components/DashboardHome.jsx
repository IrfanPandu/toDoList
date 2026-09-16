import { useMemo } from 'react'
import { CheckCheck, Clock, Repeat, Target, TrendingUp, AlertCircle } from 'lucide-react'
import { useTodos } from '../hooks/useTodos'
import { useTargets } from '../hooks/useTargets'
import { useAuth } from '../contexts/AuthContext'
import { isAfter, parseISO, isToday } from 'date-fns'

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-icon-wrap" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

export default function DashboardHome({ onNavigate }) {
  const { todos, loading: todosLoading } = useTodos()
  const { targets, loading: targetsLoading } = useTargets()
  const { displayName } = useAuth()

  const stats = useMemo(() => {
    const total = todos.filter(t => !t.is_recurring).length
    const completed = todos.filter(t => !t.is_recurring && t.is_completed).length
    const habits = todos.filter(t => t.is_recurring)
    const habitsDone = habits.filter(t => t.is_completed).length
    const overdue = todos.filter(t => {
      if (!t.due_date || t.is_completed) return false
      try { return isAfter(new Date(), parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) }
      catch { return false }
    }).length
    const targetsDone = targets.filter(t => t.is_achieved).length
    return { total, completed, habits: habits.length, habitsDone, overdue, targets: targets.length, targetsDone }
  }, [todos, targets])

  const recentTodos = useMemo(() =>
    todos.filter(t => !t.is_recurring && !t.is_completed).slice(0, 5),
    [todos]
  )

  const activeHabits = useMemo(() =>
    todos.filter(t => t.is_recurring && !t.is_completed).slice(0, 4),
    [todos]
  )

  const activeTargets = useMemo(() =>
    targets.filter(t => !t.is_achieved).slice(0, 3),
    [targets]
  )

  if (todosLoading || targetsLoading) {
    return <div className="state-container"><div className="spinner" /><p>Memuat...</p></div>
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Halo, {displayName} 👋</h1>
          <p className="page-subtitle">Ringkasan aktivitas kamu hari ini</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={CheckCheck} value={stats.completed + '/' + stats.total} label="Tugas Selesai" color="#6366f1" bg="#eef2ff" />
        <StatCard icon={Repeat} value={stats.habitsDone + '/' + stats.habits} label="Rutinitas Selesai" color="#8b5cf6" bg="#f5f3ff" />
        <StatCard icon={Target} value={stats.targetsDone + '/' + stats.targets} label="Target Tercapai" color="#22c55e" bg="#f0fdf4" />
        <StatCard icon={AlertCircle} value={stats.overdue} label="Terlambat" color="#ef4444" bg="#fef2f2" />
      </div>

      <div className="dashboard-grid">
        {/* Recent Todos */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Tugas Belum Selesai</h2>
            <button className="widget-link" onClick={() => onNavigate('todos')}>Lihat Semua →</button>
          </div>
          {recentTodos.length === 0 ? (
            <p className="widget-empty">Semua tugas sudah selesai 🎉</p>
          ) : (
            <ul className="widget-list">
              {recentTodos.map(t => (
                <li key={t.id} className="widget-list-item">
                  <span className={`widget-priority-dot priority-${t.priority}`} />
                  <span className="widget-item-title">{t.title}</span>
                  {t.due_date && (
                    <span className="widget-item-date">
                      {isToday(parseISO(t.due_date)) ? 'Hari ini' : t.due_date.split('T')[0]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Habits Today */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Rutinitas Hari Ini</h2>
            <button className="widget-link" onClick={() => onNavigate('habits')}>Lihat Semua →</button>
          </div>
          {activeHabits.length === 0 ? (
            <p className="widget-empty">
              {todos.filter(t => t.is_recurring).length === 0
                ? 'Belum ada rutinitas. Tambahkan sekarang!'
                : 'Semua rutinitas selesai hari ini 🔥'}
            </p>
          ) : (
            <ul className="widget-list">
              {activeHabits.map(t => (
                <li key={t.id} className="widget-list-item">
                  <Repeat size={12} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                  <span className="widget-item-title">{t.title}</span>
                  {t.recur_times && (
                    <span className="widget-item-date">
                      {t.recur_count ?? 0}/{t.recur_times}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active Targets */}
        <div className="dashboard-widget wide">
          <div className="widget-header">
            <h2>Target Aktif</h2>
            <button className="widget-link" onClick={() => onNavigate('targets')}>Lihat Semua →</button>
          </div>
          {activeTargets.length === 0 ? (
            <p className="widget-empty">
              {targets.length === 0 ? 'Belum ada target. Buat target sekarang!' : 'Semua target sudah tercapai 🏆'}
            </p>
          ) : (
            <div className="widget-targets">
              {activeTargets.map(t => {
                const pct = Math.min(100, Math.round((Number(t.current_value) / Number(t.target_value)) * 100))
                return (
                  <div key={t.id} className="widget-target-item">
                    <div className="widget-target-header">
                      <span className="widget-target-dot" style={{ background: t.color }} />
                      <span className="widget-item-title">{t.title}</span>
                      <span className="widget-item-date">{pct}%</span>
                    </div>
                    <div className="progress-bar-wrap mini">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: t.color }} />
                    </div>
                    <div className="widget-target-sub">
                      {Number(t.current_value)} / {Number(t.target_value)} {t.unit}
                      {t.reward_amount && (
                        <span className="widget-reward">
                          <TrendingUp size={11} />
                          {t.reward_currency === 'IDR'
                            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.reward_amount)
                            : `${t.reward_amount} ${t.reward_currency}`
                          }
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
