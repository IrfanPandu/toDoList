import { useState } from 'react'
import { Pencil, Trash2, Calendar, Tag, Flag, CheckCircle2, Circle, Repeat, Plus, Minus } from 'lucide-react'
import { format, isAfter, parseISO, isToday } from 'date-fns'
import { id } from 'date-fns/locale'

const PRIORITY_CONFIG = {
  low:    { label: 'Rendah', color: '#22c55e', bg: '#f0fdf4' },
  medium: { label: 'Sedang', color: '#f59e0b', bg: '#fffbeb' },
  high:   { label: 'Tinggi', color: '#ef4444', bg: '#fef2f2' },
}

const RECUR_LABELS = {
  daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', custom: 'Kustom',
}

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Hari ini'
    return format(date, 'd MMM yyyy', { locale: id })
  } catch { return null }
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  try {
    const date = parseISO(dateStr)
    // Kalau tanpa waktu, overdue hanya setelah akhir hari itu
    const effectiveDate = dateStr.includes('T') ? date
      : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    return isAfter(new Date(), effectiveDate) && !isToday(date)
  } catch { return false }
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [toggleError, setToggleError] = useState('')

  const priority = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium
  const overdue = !todo.is_completed && isOverdue(todo.due_date)
  const formattedDate = formatDate(todo.due_date)
  const recurLabel = todo.is_recurring ? RECUR_LABELS[todo.recur_type] || 'Berulang' : null
  const recurProgress = todo.is_recurring && todo.recur_times
    ? `${todo.recur_count ?? 0}/${todo.recur_times}`
    : todo.is_recurring ? `${todo.recur_count ?? 0}x` : null

  const handleDelete = async () => {
    if (!window.confirm('Hapus tugas ini?')) return
    setDeleting(true)
    await onDelete(todo.id)
  }

  const handleToggle = async (increment) => {
    setToggleError('')
    const result = await onToggle(todo.id, increment)
    if (result?.error) {
      setToggleError(result.error)
      setTimeout(() => setToggleError(''), 3000)
    }
  }

  return (
    <div className={`todo-item ${todo.is_completed ? 'completed' : ''} ${overdue ? 'overdue' : ''} ${todo.is_recurring ? 'recurring' : ''}`}>
      <button
        className="todo-check"
        onClick={() => handleToggle(!todo.is_completed)}
        aria-label={todo.is_completed ? 'Tandai belum selesai' : 'Tandai selesai'}
      >
        {todo.is_completed
          ? <CheckCircle2 size={22} className="check-icon done" />
          : <Circle size={22} className="check-icon" />
        }
      </button>

      <div className="todo-content">
        <div className="todo-title-row">
          <span className="todo-title">{todo.title}</span>
          {todo.is_recurring && (
            <span className="recur-indicator" title={`Rutinitas ${recurLabel}`}>
              <Repeat size={12} /> {recurLabel}
            </span>
          )}
        </div>
        {todo.description && <span className="todo-desc">{todo.description}</span>}
        {toggleError && <span className="toggle-error">⚠ {toggleError}</span>}
        <div className="todo-meta">
          {todo.category && (
            <span className="meta-badge category-badge"><Tag size={11} />{todo.category}</span>
          )}
          <span className="meta-badge priority-badge" style={{ color: priority.color, background: priority.bg }}>
            <Flag size={11} />{priority.label}
          </span>
          {formattedDate && (
            <span className={`meta-badge ${overdue ? 'overdue-badge' : 'date-badge'}`}>
              <Calendar size={11} />{formattedDate}{overdue && ' · Terlambat'}
            </span>
          )}
          {todo.is_recurring && recurProgress && (
            <span className="meta-badge recur-count-badge">
              <Repeat size={11} />{recurProgress} hari ini
            </span>
          )}
        </div>
      </div>

      {/* Recurring quick counter */}
      {todo.is_recurring && !todo.is_completed && (
        <div className="recur-controls">
          <button
            className="btn-icon recur-dec"
            onClick={() => handleToggle(false)}
            aria-label="Kurangi" title="Kurangi 1"
            disabled={deleting || (todo.recur_count ?? 0) <= 0}
          >
            <Minus size={14} />
          </button>
          <span className="recur-count-display">
            {todo.recur_count ?? 0}{todo.recur_times ? `/${todo.recur_times}` : ''}
          </span>
          <button
            className="btn-icon recur-inc"
            onClick={() => handleToggle(true)}
            aria-label="Tambah" title="Selesai +1"
            disabled={deleting}
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      <div className="todo-actions">
        <button className="btn-icon edit-btn" onClick={() => onEdit(todo)} aria-label="Edit" disabled={deleting}>
          <Pencil size={16} />
        </button>
        <button className="btn-icon delete-btn" onClick={handleDelete} aria-label="Hapus" disabled={deleting}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
