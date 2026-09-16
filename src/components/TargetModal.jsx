import { useState, useEffect } from 'react'
import { X, Target, DollarSign } from 'lucide-react'

const PERIOD_TYPES = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
]

const UNITS = ['tugas', 'jam', 'halaman', 'km', 'sesi', 'unit', 'lainnya']

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6',
]

export default function TargetModal({ target, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    period_type: 'daily',
    target_value: '',
    unit: 'tugas',
    reward_amount: '',
    reward_currency: 'IDR',
    color: '#6366f1',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (target) {
      setForm({
        title: target.title || '',
        description: target.description || '',
        period_type: target.period_type || 'daily',
        target_value: target.target_value ?? '',
        unit: target.unit || 'tugas',
        reward_amount: target.reward_amount ?? '',
        reward_currency: target.reward_currency || 'IDR',
        color: target.color || '#6366f1',
      })
    }
  }, [target])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Judul tidak boleh kosong'); return }
    if (!form.target_value || Number(form.target_value) <= 0) { setError('Target harus lebih dari 0'); return }
    setSaving(true)
    setError('')
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      period_type: form.period_type,
      target_value: Number(form.target_value),
      unit: form.unit,
      reward_amount: form.reward_amount ? Number(form.reward_amount) : null,
      reward_currency: form.reward_currency,
      color: form.color,
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
    setForm(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{target ? 'Edit Target' : 'Target Baru'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Judul Target <span className="required">*</span></label>
            <input
              type="text"
              placeholder="Contoh: Selesaikan 5 tugas pekerjaan"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              autoFocus
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Deskripsi</label>
            <textarea
              placeholder="Detail target (opsional)..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Periode</label>
              <select value={form.period_type} onChange={(e) => handleChange('period_type', e.target.value)}>
                {PERIOD_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Warna</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-dot ${form.color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => handleChange('color', c)}
                    aria-label={`Pilih warna ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Target size={14} /> Target <span className="required">*</span></label>
              <input
                type="number"
                min={1}
                placeholder="Contoh: 5"
                value={form.target_value}
                onChange={(e) => handleChange('target_value', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Satuan</label>
              <select value={form.unit} onChange={(e) => handleChange('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="reward-section">
            <p className="reward-title"><DollarSign size={14} /> Reward / Gaji (opsional)</p>
            <p className="reward-hint">Isi jika kamu ingin melacak penghasilan atau reward saat target tercapai.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Nominal</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Contoh: 500000"
                  value={form.reward_amount}
                  onChange={(e) => handleChange('reward_amount', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Mata Uang</label>
                <select value={form.reward_currency} onChange={(e) => handleChange('reward_currency', e.target.value)}>
                  <option value="IDR">IDR (Rupiah)</option>
                  <option value="USD">USD (Dollar)</option>
                  <option value="poin">Poin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : target ? 'Simpan' : 'Buat Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
