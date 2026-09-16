import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'

export function useTargets() {
  const { user } = useAuth()
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTargets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setTargets(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchTargets() }, [fetchTargets])

  const addTarget = async (data) => {
    try {
      const now = new Date()
      let period_start, period_end
      if (data.period_type === 'daily') {
        period_start = format(startOfDay(now), 'yyyy-MM-dd')
        period_end = format(endOfDay(now), 'yyyy-MM-dd')
      } else if (data.period_type === 'weekly') {
        period_start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        period_end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      } else {
        period_start = format(startOfMonth(now), 'yyyy-MM-dd')
        period_end = format(endOfMonth(now), 'yyyy-MM-dd')
      }
      const { data: row, error } = await supabase
        .from('targets')
        .insert([{ ...data, user_id: user.id, period_start, period_end }])
        .select()
        .single()
      if (error) throw error
      setTargets(prev => [row, ...prev])
      return { data: row, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const updateTarget = async (id, updates) => {
    try {
      const { data: row, error } = await supabase
        .from('targets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      setTargets(prev => prev.map(t => t.id === id ? row : t))
      return { data: row, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const deleteTarget = async (id) => {
    try {
      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      setTargets(prev => prev.filter(t => t.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  const addProgress = async (targetId, valueAdded, note = '') => {
    try {
      const target = targets.find(t => t.id === targetId)
      if (!target) throw new Error('Target tidak ditemukan')

      const newValue = Number(target.current_value) + Number(valueAdded)
      const isAchieved = newValue >= Number(target.target_value)

      // Log the progress
      await supabase.from('target_logs').insert([{
        target_id: targetId,
        user_id: user.id,
        value_added: valueAdded,
        note,
      }])

      // Update target progress
      return updateTarget(targetId, {
        current_value: newValue,
        is_achieved: isAchieved,
      })
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  return { targets, loading, addTarget, updateTarget, deleteTarget, addProgress, refetch: fetchTargets }
}
