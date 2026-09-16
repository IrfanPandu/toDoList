import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  format, isAfter, parseISO,
} from 'date-fns'

function getPeriodRange(periodType) {
  const now = new Date()
  if (periodType === 'daily') {
    return {
      period_start: format(startOfDay(now), 'yyyy-MM-dd'),
      period_end:   format(endOfDay(now),   'yyyy-MM-dd'),
    }
  }
  if (periodType === 'weekly') {
    return {
      period_start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      period_end:   format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }
  }
  // monthly
  return {
    period_start: format(startOfMonth(now), 'yyyy-MM-dd'),
    period_end:   format(endOfMonth(now),   'yyyy-MM-dd'),
  }
}

export function useTargets() {
  const { user } = useAuth()
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTargets = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error

      // Auto-reset targets whose period has ended and are not yet reset
      const today = format(new Date(), 'yyyy-MM-dd')
      const toReset = (data || []).filter(t => {
        if (!t.period_end) return false
        try {
          // period_end sudah lewat → reset untuk periode baru
          return isAfter(new Date(), parseISO(t.period_end)) && t.current_value > 0
        } catch { return false }
      })

      if (toReset.length > 0) {
        await Promise.all(toReset.map(t => {
          const { period_start, period_end } = getPeriodRange(t.period_type)
          return supabase.from('targets').update({
            current_value: 0,
            is_achieved: false,
            period_start,
            period_end,
          }).eq('id', t.id).eq('user_id', user.id)
        }))
        // Re-fetch setelah reset
        const { data: fresh } = await supabase
          .from('targets').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setTargets(fresh || [])
      } else {
        setTargets(data || [])
      }
    } catch (err) {
      console.error('fetchTargets error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchTargets() }, [fetchTargets])

  const addTarget = async (data) => {
    try {
      const { period_start, period_end } = getPeriodRange(data.period_type)
      const { data: row, error } = await supabase
        .from('targets')
        .insert([{ ...data, user_id: user.id, period_start, period_end, current_value: 0, is_achieved: false }])
        .select().single()
      if (error) throw error
      setTargets(prev => [row, ...prev])
      return { data: row, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const updateTarget = async (id, updates) => {
    try {
      // Jika period_type berubah, perbarui period_start/period_end juga
      const extra = updates.period_type ? getPeriodRange(updates.period_type) : {}
      const { data: row, error } = await supabase
        .from('targets')
        .update({ ...updates, ...extra })
        .eq('id', id).eq('user_id', user.id)
        .select().single()
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
        .from('targets').delete()
        .eq('id', id).eq('user_id', user.id)
      if (error) throw error
      setTargets(prev => prev.filter(t => t.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  const addProgress = async (targetId, valueAdded, note = '') => {
    // Tolak nilai negatif atau nol
    const val = Number(valueAdded)
    if (!val || val <= 0) return { data: null, error: 'Nilai progress harus lebih dari 0' }

    try {
      const target = targets.find(t => t.id === targetId)
      if (!target) throw new Error('Target tidak ditemukan')

      const newValue = Number(target.current_value) + val
      const isAchieved = newValue >= Number(target.target_value)

      // Log dulu — kalau gagal, jangan update target
      const { error: logErr } = await supabase.from('target_logs').insert([{
        target_id: targetId,
        user_id: user.id,
        value_added: val,
        note,
      }])
      if (logErr) throw logErr

      return updateTarget(targetId, { current_value: newValue, is_achieved: isAchieved })
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  return { targets, loading, addTarget, updateTarget, deleteTarget, addProgress, refetch: fetchTargets }
}
