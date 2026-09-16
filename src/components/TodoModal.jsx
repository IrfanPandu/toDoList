import { useState, useEffect } from 'react'
import { X, Calendar, Tag, Flag, Repeat } from 'lucide-react'
import { isAfter, startOfDay, parseISO } from 'date-fns'

const PRIORITIES = [
  { value: 'low',    label: 'Rendah', color: '#22c55e' },
  { value: 'medium', label: 'Sedang', color: '#f59e0b' },
  { value: 'high',   label: 'Tinggi', color: '#ef4444' },
]

const CATEGORIES = ['Pekerjaan', 'Pribadi', 'Belajar', 'Kesehatan', 'Belanja', 'Lainnya']

const RECUR_TYPES = [
  { value: 'daily',   label: 'Setiap Hari' },
  { value: 'weekly',  label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'custom',  label: 'Kustom (pilih hari)' },
]

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const DEFAULT_FORM = {
  title: '',
  description: '',
  priority: 'medium',
  category: 'Lainnya',
  due_date: '',
  is_recurring: false,
  recur_type: 'daily',
  recur_times: '',
  recur_days: [],
}

export default function TodoModal({ todo, onClose, onSave, defaultRecurring = false }) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, is_recurring: defaultRecurring })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dueDateWarning, setDueDateWarning] = useState('')

  useEffect(() => {
    if (todo) {
      setForm({
        title:        todo.title || '',
        description:  todo.description || '',
        priority:     todo.priority || 'medium',
        category:     todo.category || 'Lainnya',
        due_date:     todo.due_date ? todo.due_date.split('T')[0] : '',
        is_recurring: todo.is_recurring || false,
        recur_type:   todo.recur_type || 'daily',
        recur_times:  todo.recur_times ?? '',
        recur_days:   todo.recur_days || [],
      })
    }
  }, [todo])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Judul tidak boleh kosong'); return }

    // Validasi: custom recurring harus pilih minimal 1 hari
    if (form.is_recurring && form.recur_type === 'custom' && form.recur_days.length === 0) {
      setError('Pilih minimal 1 hari aktif untuk rutinitas kustom')
      return
    }

    setSaving(true)
    setError('')
    const payload = {
      title:        form.title.trim(),
      description:  form.description.trim(),
      priority:     form.priority,
      category:     form.category,
      due_date:     form.due_date || null,
      is_recurring: form.is_recurring,
      recur_type:   form.is_recurring ? form.recur_type : null,
      recur_times:  form.is_recurring && form.recur_times ? Number(form.recur_times) : null,
      // recur_days hanya untuk custom
      recur_days:   form.is_recurring && form.recur_type === 'custom' ? form.recur_days : null,
    }
    const result = await onSave(payload)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
    } else {
      onClose()
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Reset recur_days saat ganti dari custom ke tipe lain
      if (field === 'recur_type' && value !== 'custom') {
        next.recur_days = []
      }
      return next
    })
    if (error) setError('')

    // Validasi due_date di masa lalu
    if (field === 'due_date' && value) {
      try {
        const chosen = parseISO(value)
        const today  = startOfDay(new Date())
        if (isAfter(today, chosen)) {
          setDueDateWarning('Tanggal ini sudah lewat, tugas akan langsung berstatus terlambat.')
        } else {
          setDueDateWarning('')
        }
      } catch { setDueDateWarning('') }
    }
    if (field === 'due_date' && !value) setDueDateWarning('')
  }

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      recur_days: prev.recur_days.includes(day)
        ? prev.recur_days.filter(d => d !== day)
        : [...prev.recur_days, day].sort(),
    }))
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{todo ? 'Edit Tugas' : 'Tugas Baru'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Judul <span className="required">*</span></label>
            <input
              id="title" type="text"
              placeholder="Apa yang perlu dilakukan?"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              autoFocus maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              placeholder="Tambahkan detail (opsional)..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3} maxLength={1000}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Flag size={14} /> Prioritas</label>
              <div className="priority-group">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value} type="button"
                    className={`priority-btn ${form.priority === p.value ? 'active' : ''}`}
                    style={{ '--priority-color': p.color }}
                    onClick={() => handleChange('priority', p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category"><Tag size={14} /> Kategori</label>
              <select id="category" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="due_date"><Calendar size={14} /> Deadline</label>
              <input
                id="due_date" type="date"
                value={form.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
              {dueDateWarning && (
                <span className="field-warning">⚠ {dueDateWarning}</span>
              )}
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="form-group">
            <label className="toggle-label">
              <span><Repeat size={14} /> Rutinitas Berulang</span>
              <div
                className={`toggle-switch ${form.is_recurring ? 'on' : ''}`}
                onClick={() => handleChange('is_recurring', !form.is_recurring)}
                role="switch" aria-checked={form.is_recurring} tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleChange('is_recurring', !form.is_recurring)}
              >
                <div className="toggle-thumb" />
              </div>
            </label>
          </div>

          {form.is_recurring && (
            <div className="recurring-options">
              <div className="form-row">
                <div className="form-group">
                  <label>Pola Pengulangan</label>
                  <select value={form.recur_type} onChange={(e) => handleChange('recur_type', e.target.value)}>
                    {RECUR_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Berapa Kali per Hari <span className="label-hint">(kosong = tak terbatas)</span></label>
                  <input
                    type="number" min={1} max={99}
                    placeholder="Contoh: 3"
                    value={form.recur_times}
                    onChange={(e) => handleChange('recur_times', e.target.value)}
                  />
                </div>
              </div>

              {form.recur_type === 'custom' && (
                <div className="form-group">
                  <label>Hari Aktif <span className="required">*</span></label>
                  <div className="days-picker">
                    {DAYS.map((day, i) => (
                      <button
                        key={i} type="button"
                        className={`day-btn ${form.recur_days.includes(i) ? 'active' : ''}`}
                        onClick={() => toggleDay(i)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {form.recur_days.length === 0 && (
                    <span className="field-warning">Pilih minimal 1 hari</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : todo ? 'Simpan Perubahan' : 'Tambah Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
