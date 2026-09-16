import { useEffect, useCallback, useRef, useMemo } from 'react'
import { isToday, isTomorrow, parseISO, isAfter, startOfDay } from 'date-fns'

const NOTIFIED_KEY = 'todoapp_notified_ids'

function getNotifiedToday() {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (data.date !== new Date().toDateString()) return {}
    return data.ids || {}
  } catch { return {} }
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

// Due date tanpa waktu (YYYY-MM-DD) dianggap jatuh tempo di akhir hari itu,
// bukan tengah malam — untuk menghindari false overdue
function parseDueDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = parseISO(dateStr)
    // Kalau tidak punya time component (T...), anggap end of day
    if (!dateStr.includes('T')) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
    }
    return d
  } catch { return null }
}

export function useNotifications(todos) {
  const permissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied'
    if (Notification.permission !== 'default') return Notification.permission
    const result = await Notification.requestPermission()
    permissionRef.current = result
    return result
  }, [])

  const permission = typeof Notification !== 'undefined'
    ? Notification.permission : 'denied'

  const sendNotification = useCallback((title, body, tag) => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    try { new Notification(title, { body, tag, icon: '/favicon.svg' }) }
    catch { /* noop */ }
  }, [])

  const checkDeadlines = useCallback(() => {
    if (!todos?.length) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return

    todos.filter(t => !t.is_completed && t.due_date).forEach(todo => {
      try {
        const date = parseDueDate(todo.due_date)
        if (!date) return
        const now = new Date()

        if (isToday(date) && !wasNotified(`today-${todo.id}`)) {
          sendNotification('⏰ Deadline Hari Ini!', `"${todo.title}" harus diselesaikan hari ini.`, `todo-${todo.id}`)
          markNotified(`today-${todo.id}`)
        } else if (isTomorrow(date) && !wasNotified(`tomorrow-${todo.id}`)) {
          sendNotification('📅 Deadline Besok', `"${todo.title}" akan jatuh tempo besok.`, `todo-${todo.id}`)
          markNotified(`tomorrow-${todo.id}`)
        } else if (isAfter(now, date) && !isToday(date) && !wasNotified(`overdue-${todo.id}`)) {
          sendNotification('🚨 Tugas Terlambat!', `"${todo.title}" sudah melewati deadline.`, `todo-${todo.id}`)
          markNotified(`overdue-${todo.id}`)
        }
      } catch { /* noop */ }
    })
  }, [todos, sendNotification])

  useEffect(() => { checkDeadlines() }, [checkDeadlines])

  useEffect(() => {
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkDeadlines])

  // In-app alerts — gunakan parseDueDate yang sama agar konsisten
  const upcomingToday = useMemo(() =>
    (todos ?? []).filter(t => {
      if (t.is_completed || !t.due_date) return false
      try { return isToday(parseDueDate(t.due_date)) } catch { return false }
    }), [todos])

  const upcomingTomorrow = useMemo(() =>
    (todos ?? []).filter(t => {
      if (t.is_completed || !t.due_date) return false
      try { return isTomorrow(parseDueDate(t.due_date)) } catch { return false }
    }), [todos])

  const overdue = useMemo(() =>
    (todos ?? []).filter(t => {
      if (t.is_completed || !t.due_date) return false
      try {
        const d = parseDueDate(t.due_date)
        return isAfter(new Date(), d) && !isToday(d)
      } catch { return false }
    }), [todos])

  return { permission, requestPermission, checkDeadlines, upcomingToday, upcomingTomorrow, overdue }
}
