import { useEffect, useCallback, useRef } from 'react'
import { isToday, isTomorrow, parseISO, isAfter } from 'date-fns'

const STORAGE_KEY = 'todoapp_notif_permission'
const NOTIFIED_KEY = 'todoapp_notified_ids'

// Get already-notified todo IDs for today to avoid duplicate notifications
function getNotifiedToday() {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    // Clear if stored date is not today
    if (data.date !== new Date().toDateString()) return {}
    return data.ids || {}
  } catch {
    return {}
  }
}

function markNotified(id) {
  try {
    const existing = getNotifiedToday()
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify({
      date: new Date().toDateString(),
      ids: { ...existing, [id]: true },
    }))
  } catch { /* noop */ }
}

function wasNotified(id) {
  return !!getNotifiedToday()[id]
}

export function useNotifications(todos) {
  const permissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    const result = await Notification.requestPermission()
    permissionRef.current = result
    localStorage.setItem(STORAGE_KEY, result)
    return result
  }, [])

  const permission = typeof Notification !== 'undefined'
    ? Notification.permission
    : 'denied'

  // Send a browser notification
  const sendNotification = useCallback((title, body, tag) => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    try {
      new Notification(title, {
        body,
        tag,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
      })
    } catch { /* noop */ }
  }, [])

  // Check todos and fire notifications for deadline today/tomorrow
  const checkDeadlines = useCallback(() => {
    if (!todos?.length) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return

    const pending = todos.filter(t => !t.is_completed && t.due_date)

    pending.forEach(todo => {
      try {
        const date = parseISO(todo.due_date)
        const notifTag = `todo-${todo.id}`

        if (isToday(date) && !wasNotified(`today-${todo.id}`)) {
          sendNotification(
            '⏰ Deadline Hari Ini!',
            `"${todo.title}" harus diselesaikan hari ini.`,
            notifTag
          )
          markNotified(`today-${todo.id}`)
        } else if (isTomorrow(date) && !wasNotified(`tomorrow-${todo.id}`)) {
          sendNotification(
            '📅 Deadline Besok',
            `"${todo.title}" akan jatuh tempo besok.`,
            notifTag
          )
          markNotified(`tomorrow-${todo.id}`)
        } else if (isAfter(new Date(), date) && !isToday(date) && !wasNotified(`overdue-${todo.id}`)) {
          sendNotification(
            '🚨 Tugas Terlambat!',
            `"${todo.title}" sudah melewati deadline.`,
            notifTag
          )
          markNotified(`overdue-${todo.id}`)
        }
      } catch { /* noop */ }
    })
  }, [todos, sendNotification])

  // Run check when todos change
  useEffect(() => {
    checkDeadlines()
  }, [checkDeadlines])

  // Also run on a 30-minute interval while app is open
  useEffect(() => {
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkDeadlines])

  // Upcoming todos for in-app display
  const upcomingToday = todos?.filter(t => {
    if (t.is_completed || !t.due_date) return false
    try { return isToday(parseISO(t.due_date)) } catch { return false }
  }) ?? []

  const upcomingTomorrow = todos?.filter(t => {
    if (t.is_completed || !t.due_date) return false
    try { return isTomorrow(parseISO(t.due_date)) } catch { return false }
  }) ?? []

  const overdue = todos?.filter(t => {
    if (t.is_completed || !t.due_date) return false
    try {
      const d = parseISO(t.due_date)
      return isAfter(new Date(), d) && !isToday(d)
    } catch { return false }
  }) ?? []

  return {
    permission,
    requestPermission,
    checkDeadlines,
    upcomingToday,
    upcomingTomorrow,
    overdue,
  }
}
