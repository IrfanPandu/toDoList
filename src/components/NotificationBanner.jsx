import { useState } from 'react'
import { Bell, BellOff, X, AlertTriangle, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useTodos } from '../hooks/useTodos'

export default function NotificationBanner() {
  const { todos } = useTodos()
  const { permission, requestPermission, upcomingToday, upcomingTomorrow, overdue } = useNotifications(todos)
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const totalAlerts = upcomingToday.length + upcomingTomorrow.length + overdue.length

  const handleRequestPermission = async () => {
    setRequesting(true)
    await requestPermission()
    setRequesting(false)
  }

  // Don't show anything if no alerts and permission already granted
  if (totalAlerts === 0 && permission === 'granted') return null
  if (dismissed && totalAlerts === 0) return null

  return (
    <div className="notif-banner-wrap">
      {/* Permission request bar */}
      {permission === 'default' && !dismissed && (
        <div className="notif-permission-bar">
          <div className="notif-permission-left">
            <Bell size={16} />
            <span>Aktifkan notifikasi browser untuk mendapat pengingat deadline otomatis</span>
          </div>
          <div className="notif-permission-actions">
            <button
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={handleRequestPermission}
              disabled={requesting}
            >
              {requesting ? 'Meminta...' : 'Aktifkan'}
            </button>
            <button
              className="btn-icon"
              onClick={() => setDismissed(true)}
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Permission denied info */}
      {permission === 'denied' && !dismissed && (
        <div className="notif-permission-bar denied">
          <BellOff size={15} />
          <span>Notifikasi browser diblokir. Aktifkan melalui pengaturan browser kamu untuk mendapat pengingat deadline.</span>
          <button className="btn-icon" onClick={() => setDismissed(true)} aria-label="Tutup">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Alert cards */}
      {totalAlerts > 0 && (
        <div className="notif-alerts">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="notif-alert overdue">
              <div className="notif-alert-header" onClick={() => setExpanded(e => e === 'overdue' ? null : 'overdue')}>
                <AlertTriangle size={15} />
                <span className="notif-alert-title">
                  {overdue.length} tugas sudah melewati deadline
                </span>
                {expanded === 'overdue' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {expanded === 'overdue' && (
                <ul className="notif-alert-list">
                  {overdue.map(t => (
                    <li key={t.id}>
                      <span className="notif-dot" />
                      <span>{t.title}</span>
                      <span className="notif-date">{t.due_date?.split('T')[0]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Due today */}
          {upcomingToday.length > 0 && (
            <div className="notif-alert today">
              <div className="notif-alert-header" onClick={() => setExpanded(e => e === 'today' ? null : 'today')}>
                <Clock size={15} />
                <span className="notif-alert-title">
                  {upcomingToday.length} tugas deadline hari ini
                </span>
                {expanded === 'today' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {expanded === 'today' && (
                <ul className="notif-alert-list">
                  {upcomingToday.map(t => (
                    <li key={t.id}>
                      <span className="notif-dot" />
                      <span>{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Due tomorrow */}
          {upcomingTomorrow.length > 0 && (
            <div className="notif-alert tomorrow">
              <div className="notif-alert-header" onClick={() => setExpanded(e => e === 'tomorrow' ? null : 'tomorrow')}>
                <Calendar size={15} />
                <span className="notif-alert-title">
                  {upcomingTomorrow.length} tugas deadline besok
                </span>
                {expanded === 'tomorrow' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {expanded === 'tomorrow' && (
                <ul className="notif-alert-list">
                  {upcomingTomorrow.map(t => (
                    <li key={t.id}>
                      <span className="notif-dot" />
                      <span>{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
