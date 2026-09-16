import { useState } from 'react'
import { Plus, Target, Trash2, Pencil, TrendingUp, DollarSign, CheckCircle } from 'lucide-react'
import { useTargets } from '../hooks/useTargets'
import TargetModal from './TargetModal'

const PERIOD_LABELS = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' }

function formatCurrency(amount, currency) {
  if (!amount) return null
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
  }
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }
  return `${amount} ${currency}`
}

function TargetCard({ target, onEdit, onDelete, onAddProgress }) {
  const [progressInput, setProgressInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const percentage = Math.min(100, Math.round((Number(target.current_value) / Number(target.target_value)) * 100))
  const reward = formatCurrency(target.reward_amount, target.reward_currency)

  const handleAdd = async () => {
    if (!progressInput || Number(progressInput) <= 0) return
    setAdding(true)
    await onAddProgress(target.id, Number(progressInput))
    setProgressInput('')
    setShowInput(false)
    setAdding(false)
  }

  return (
    <div className={`target-card ${target.is_achieved ? 'achieved' : ''}`}>
      <div className="target-card-header">
        <div className="target-dot" style={{ background: target.color }} />
        <div className="target-info">
          <span className="target-title">{target.title}</span>
          <span className="target-period">{PERIOD_LABELS[target.period_type]}</span>
        </div>
        {target.is_achieved && (
          <span className="achieved-badge"><CheckCircle size={14} /> Tercapai</span>
        )}
        <div className="target-card-actions">
          <button className="btn-icon edit-btn" onClick={() => onEdit(target)} title="Edit"><Pencil size={14} /></button>
          <button className="btn-icon delete-btn" onClick={() => onDelete(target.id)} title="Hapus"><Trash2 size={14} /></button>
        </div>
      </div>

      {target.description && (
        <p className="target-desc">{target.description}</p>
      )}

      <div className="target-progress-area">
        <div className="target-progress-label">
          <span className="target-current">
            {Number(target.current_value)} / {Number(target.target_value)} {target.unit}
          </span>
          <span className="target-pct">{percentage}%</span>
        </div>
        <div className="progress-bar-wrap">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%`, background: target.color }}
          />
        </div>
      </div>

      {reward && (
        <div className="reward-row">
          <DollarSign size={13} />
          <span>Reward: <strong>{reward}</strong></span>
          {target.is_achieved && <span className="reward-earned">✓ Earned</span>}
        </div>
      )}

      <div className="target-add-progress">
        {showInput ? (
          <div className="progress-input-row">
            <input
              type="number"
              min={0.1}
              step={0.1}
              placeholder={`Tambah ${target.unit}...`}
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
              {adding ? '...' : 'Tambah'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowInput(false); setProgressInput('') }}>
              Batal
            </button>
          </div>
        ) : (
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowInput(true)}
            disabled={target.is_achieved}
          >
            <TrendingUp size={14} /> Catat Progress
          </button>
        )}
      </div>
    </div>
  )
}

export default function TargetsPage() {
  const { targets, loading, addTarget, updateTarget, deleteTarget, addProgress } = useTargets()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState(null)

  const totalRewardEarned = targets
    .filter(t => t.is_achieved && t.reward_amount)
    .reduce((sum, t) => sum + Number(t.reward_amount), 0)

  const totalIDR = targets
    .filter(t => t.is_achieved && t.reward_amount && t.reward_currency === 'IDR')
    .reduce((sum, t) => sum + Number(t.reward_amount), 0)

  const openAdd = () => { setEditingTarget(null); setModalOpen(true) }
  const openEdit = (t) => { setEditingTarget(t); setModalOpen(true) }

  const handleSave = async (data) => {
    if (editingTarget) return updateTarget(editingTarget.id, data)
    return addTarget(data)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus target ini?')) return
    deleteTarget(id)
  }

  const achieved = targets.filter(t => t.is_achieved)
  const active = targets.filter(t => !t.is_achieved)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Target & Reward</h1>
          <p className="page-subtitle">Tetapkan target dan pantau progresmu</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Buat Target
        </button>
      </div>

      {/* Summary */}
      {targets.length > 0 && (
        <div className="target-summary">
          <div className="summary-card">
            <Target size={18} style={{ color: '#6366f1' }} />
            <div>
              <div className="summary-value">{targets.length}</div>
              <div className="summary-label">Total Target</div>
            </div>
          </div>
          <div className="summary-card">
            <CheckCircle size={18} style={{ color: '#22c55e' }} />
            <div>
              <div className="summary-value">{achieved.length}</div>
              <div className="summary-label">Tercapai</div>
            </div>
          </div>
          {totalIDR > 0 && (
            <div className="summary-card highlight">
              <DollarSign size={18} style={{ color: '#f59e0b' }} />
              <div>
                <div className="summary-value">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIDR)}
                </div>
                <div className="summary-label">Total Reward Earned</div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="state-container"><div className="spinner" /><p>Memuat target...</p></div>
      ) : targets.length === 0 ? (
        <div className="state-container">
          <Target size={48} style={{ color: '#c7d2fe' }} />
          <h3>Belum ada target</h3>
          <p>Buat target pertama kamu untuk mulai melacak progres dan reward.</p>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Buat Target</button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="target-section">
              <h2 className="section-label">Target Aktif</h2>
              <div className="target-grid">
                {active.map(t => (
                  <TargetCard
                    key={t.id}
                    target={t}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onAddProgress={addProgress}
                  />
                ))}
              </div>
            </div>
          )}
          {achieved.length > 0 && (
            <div className="target-section">
              <h2 className="section-label">✓ Tercapai</h2>
              <div className="target-grid">
                {achieved.map(t => (
                  <TargetCard
                    key={t.id}
                    target={t}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onAddProgress={addProgress}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <TargetModal
          target={editingTarget}
          onClose={() => { setModalOpen(false); setEditingTarget(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
