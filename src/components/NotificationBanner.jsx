import { useState, useEffect } from 'react'
import { Bell, BellOff, X, AlertTriangle, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useTodos } from '../hooks/useTodos'

const DISMISSED_KEY = 'todoapp_notif_banner_dismissed'

function getDismissedToday() {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    return data.date === new Date().toDateString() && data.dismissed
  } catch { return false }
}

function setDismissedToday() {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({
      date: new Date().toDateString(),
      dismissed: true,
    }))
  } catch { /* noop */ }
}

export default function NotificationBanner() {
  const { todos } = useTodos()
  const { permission, requestPermission, upcomingToday, upcomingTomorrow, overdue } = useNotifications(todos)

  // Persist dismissed state per hari
  const [dismissed, setDismissed] = useState(() => getDismissedToday())
  const [expanded, setExpanded] = useState(null)
  const [requesting, setRequesting] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    setDismissedToday()
  }

  const handleRequestPermission = async () => {
    setRequesting(true)
    await requestPermission()
    setRequesting(false)
  }

  const totalAlerts = upcomingToday.length + upcomingTomorrow.length + overdue.length

  if (dismissed && totalAlerts === 0) return null
  if (totalAlerts === 0 && permission === 'granted') return null

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
            <button className="btn-icon" onClick={handleDismiss} aria-label="Tutup">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Permission denied info */}
      {permission === 'denied' && !dismissed && (
        <div className="notif-permission-bar denied">
          <BellOff size={15} />
          <span>Notifikasi browser diblokir. Aktifkan di pengaturan browser untuk mendapat pengingat.</span>
          <button className="btn-icon" onClick={handleDismiss} aria-label="Tutup">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Alert cards */}
      {totalAlerts > 0 && (
        <div className="notif-alerts">
          {overdue.length > 0 && (
            <div className="notif-alert overdue">
              <div className="notif-alert-header" onClick={() => setExpanded(e => e === 'overdue' ? null : 'overdue')}>
                <AlertTriangle size={15} />
                <span className="notif-alert-title">{overdue.length} tugas sudah melewati deadline</span>
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

          {upcomingToday.length > 0 && (
            <div className="notif-alert today">
              <div className="notif-alert-header" onClick={() => setExpanded(e => e === 'today' ? null : 'today')}>
                <Clock size={15} />
                <span className="notif-alert-title">{upcomingToday.length} tugas deadline hari ini</span>
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

          {upcomingTomorrow.length > 0 && (
            <div className="notif-alert tomorrow">
              <div className="notif-alert-header" onClick={() => setExpanded(e => e === 'tomorrow' ? null : 'tomorrow')}>
                <Calendar size={15} />
                <span className="notif-alert-title">{upcomingTomorrow.length} tugas deadline besok</span>
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
