import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, getDay } from 'date-fns'

// Check if a recurring todo is active today based on its recur_type and recur_days
export function isTodoActiveToday(todo) {
  if (!todo.is_recurring) return true
  const todayDayIndex = getDay(new Date()) // 0=Sun, 1=Mon, ..., 6=Sat

  switch (todo.recur_type) {
    case 'daily':
      return true
    case 'weekly':
      // Active only on the day of week it was created (stored as recur_days[0])
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

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTodos = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Auto-reset recurring counts if last_reset_date != today
      const today = format(new Date(), 'yyyy-MM-dd')
      const toReset = (data || []).filter(t =>
        t.is_recurring && t.last_reset_date !== today && t.recur_count > 0
      )
      if (toReset.length > 0) {
        await Promise.all(toReset.map(t =>
          supabase.from('todos').update({
            recur_count: 0,
            is_completed: false,
            last_reset_date: today,
          }).eq('id', t.id).eq('user_id', user.id)
        ))
        // Re-fetch after reset
        const { data: fresh } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
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

  const addTodo = async (todoData) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const payload = {
        ...todoData,
        user_id: user.id,
        recur_count: 0,
        last_reset_date: today,
      }
      const { data, error } = await supabase
        .from('todos')
        .insert([payload])
        .select()
        .single()
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
        .from('todos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
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
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      setTodos(prev => prev.filter(t => t.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  const toggleComplete = async (id, completed) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    if (todo.is_recurring) {
      // Block toggle if today is not an active day for custom recurring
      if (!isTodoActiveToday(todo)) {
        return { data: null, error: 'Rutinitas ini tidak aktif hari ini.' }
      }

      const today = format(new Date(), 'yyyy-MM-dd')
      const newCount = completed ? todo.recur_count + 1 : Math.max(0, todo.recur_count - 1)
      const isComplete = todo.recur_times ? newCount >= todo.recur_times : completed
      return updateTodo(id, {
        recur_count: newCount,
        is_completed: isComplete,
        last_reset_date: today,
        completed_at: isComplete ? new Date().toISOString() : null,
      })
    }

    return updateTodo(id, {
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
  }

  return { todos, loading, error, addTodo, updateTodo, deleteTodo, toggleComplete, refetch: fetchTodos }
}
