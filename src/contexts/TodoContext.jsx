/**
 * Global TodoContext — single source of truth untuk semua todos.
 * Menggantikan pemanggilan useTodos() di banyak komponen yang menyebabkan
 * fetch duplikat dan race condition saat auto-reset.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { format, getDay } from 'date-fns'

// ── Helper: apakah habit aktif hari ini? ──────────────────────────────────────
export function isTodoActiveToday(todo) {
  if (!todo.is_recurring) return true
  const todayDayIndex = getDay(new Date()) // 0=Sun … 6=Sat

  switch (todo.recur_type) {
    case 'daily':
      return true
    case 'weekly':
      // Harus ada recur_days, kalau kosong default ke hari pembuatan (tidak bisa diketahui, fallback aktif)
      if (todo.recur_days?.length > 0) return todo.recur_days.includes(todayDayIndex)
      return true
    case 'monthly':
      return true
    case 'custom':
      if (!todo.recur_days?.length) return true
      return todo.recur_days.includes(todayDayIndex)
    default:
      return true
  }
}

const TodoContext = createContext(null)

export function TodoProvider({ children }) {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTodos = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const today = format(new Date(), 'yyyy-MM-dd')

      // Reset recurring habits yang last_reset_date != today
      // (termasuk yang sudah completed — bukan hanya yang count > 0)
      const toReset = (data || []).filter(t =>
        t.is_recurring && t.last_reset_date !== today
      )

      if (toReset.length > 0) {
        // Satu query batch dengan IN clause, bukan N request paralel
        const ids = toReset.map(t => t.id)
        await supabase
          .from('todos')
          .update({ recur_count: 0, is_completed: false, last_reset_date: today })
          .in('id', ids)
          .eq('user_id', user.id)

        // Re-fetch setelah reset
        const { data: fresh, error: err2 } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (err2) throw err2
        setTodos(fresh || [])
      } else {
        setTodos(data || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const addTodo = async (todoData) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const payload = {
        ...todoData,
        user_id: user.id,
        // Hanya set recur fields untuk recurring todos
        recur_count: todoData.is_recurring ? 0 : undefined,
        last_reset_date: todoData.is_recurring ? today : undefined,
      }
      const { data, error } = await supabase
        .from('todos').insert([payload]).select().single()
      if (error) throw error
      setTodos(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const updateTodo = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('todos').update(updates)
        .eq('id', id).eq('user_id', user.id)
        .select().single()
      if (error) throw error
      setTodos(prev => prev.map(t => t.id === id ? data : t))
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos').delete()
        .eq('id', id).eq('user_id', user.id)
      if (error) throw error
      setTodos(prev => prev.filter(t => t.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  const toggleComplete = async (id, increment) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return { error: 'Tugas tidak ditemukan' }

    if (todo.is_recurring) {
      // Blokir jika hari ini bukan hari aktif
      if (!isTodoActiveToday(todo)) {
        return { error: 'Rutinitas ini tidak aktif hari ini.' }
      }
      const today = format(new Date(), 'yyyy-MM-dd')
      const newCount = increment
        ? (todo.recur_count ?? 0) + 1
        : Math.max(0, (todo.recur_count ?? 0) - 1)
      const isComplete = todo.recur_times ? newCount >= todo.recur_times : increment
      return updateTodo(id, {
        recur_count: newCount,
        is_completed: isComplete,
        last_reset_date: today,
        completed_at: isComplete ? new Date().toISOString() : null,
      })
    }

    return updateTodo(id, {
      is_completed: increment,
      completed_at: increment ? new Date().toISOString() : null,
    })
  }

  return (
    <TodoContext.Provider value={{
      todos, loading, error,
      addTodo, updateTodo, deleteTodo, toggleComplete,
      refetch: fetchTodos,
    }}>
      {children}
    </TodoContext.Provider>
  )
}

export function useTodos() {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodos must be used inside TodoProvider')
  return ctx
}
