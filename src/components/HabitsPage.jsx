import { useMemo, useState } from 'react'
import { Plus, Repeat, CheckCircle2, Circle, Pencil, Trash2, Plus as PlusIcon, Minus } from 'lucide-react'
import { useTodos } from '../hooks/useTodos'
import TodoModal from './TodoModal'

const RECUR_LABELS = {
  daily: 'Setiap Hari',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  custom: 'Kustom',
}

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function HabitCard({ todo, onToggle, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const count = todo.recur_count ?? 0
  const limit = todo.recur_times ?? null
  const pct = limit ? Math.min(100, Math.round((count / limit) * 100)) : null
  const done = todo.is_completed

  const handleDelete = async () => {
    if (!window.confirm(`Hapus rutinitas "${todo.title}"?`)) return
    setDeleting(true)
    await onDelete(todo.id)
  }

  return (
    <div className={`habit-card ${done ? 'done' : ''}`}>
      <div className="habit-card-top">
        <button
          className="habit-check"
          onClick={() => onToggle(todo.id, !done)}
          aria-label={done ? 'Tandai belum selesai' : 'Tandai selesai'}
        >
          {done
            ? <CheckCircle2 size={24} className="check-icon done" />
            : <Circle size={24} className="check-icon" />
          }
        </button>
        <div className="habit-info">
          <span className="habit-title">{todo.title}</span>
          <div className="habit-meta">
            <span className="habit-recur-tag">
              <Repeat size={11} /> {RECUR_LABELS[todo.recur_type] || 'Berulang'}
            </span>
            {todo.category && <span className="habit-cat">{todo.category}</span>}
            {todo.recur_type === 'custom' && todo.recur_days?.length > 0 && (
              <span className="habit-days">
                {todo.recur_days.map(d => DAYS_SHORT[d]).join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="habit-card-actions">
          <button className="btn-icon edit-btn" onClick={() => onEdit(todo)} disabled={deleting}><Pencil size={14} /></button>
          <button className="btn-icon delete-btn" onClick={handleDelete} disabled={deleting}><Trash2 size={14} /></button>
        </div>
      </div>

      {todo.description && <p className="habit-desc">{todo.description}</p>}

      {/* Progress bar + counter */}
      <div className="habit-progress-area">
        {limit ? (
          <>
            <div className="habit-progress-label">
              <span>Progress Hari Ini</span>
              <strong>{count}/{limit} kali</strong>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: done ? '#22c55e' : '#6366f1' }} />
            </div>
          </>
        ) : (
          <div className="habit-progress-label">
            <span>Sudah dilakukan hari ini</span>
            <strong>{count} kali</strong>
          </div>
        )}

        <div className="habit-counter-controls">
          <button
            className="counter-btn dec"
            onClick={() => onToggle(todo.id, false)}
            disabled={count <= 0}
            aria-label="Kurangi"
          >
            <Minus size={14} />
          </button>
          <span className="counter-val">{count}</span>
          <button
            className="counter-btn inc"
            onClick={() => onToggle(todo.id, true)}
            aria-label="Tambah"
          >
            <PlusIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HabitsPage() {
  const { todos, loading, addTodo, updateTodo, deleteTodo, toggleComplete } = useTodos()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)

  const habits = useMemo(() => todos.filter(t => t.is_recurring), [todos])
  const done = habits.filter(t => t.is_completed)
  const active = habits.filter(t => !t.is_completed)

  const openAdd = () => { setEditingTodo(null); setModalOpen(true) }
  const openEdit = (t) => { setEditingTodo(t); setModalOpen(true) }

  const handleSave = async (data) => {
    if (editingTodo) return updateTodo(editingTodo.id, data)
    return addTodo(data)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rutinitas</h1>
          <p className="page-subtitle">Aktivitas berulang yang perlu kamu jalani setiap hari</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Rutinitas
        </button>
      </div>

      {/* Summary bar */}
      {habits.length > 0 && (
        <div className="habit-summary">
          <span className="habit-summary-text">
            {done.length} dari {habits.length} rutinitas selesai hari ini
          </span>
          <div className="habit-summary-bar">
            <div
              className="habit-summary-fill"
              style={{ width: `${habits.length ? Math.round((done.length / habits.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="state-container"><div className="spinner" /><p>Memuat rutinitas...</p></div>
      ) : habits.length === 0 ? (
        <div className="state-container">
          <Repeat size={48} style={{ color: '#c7d2fe' }} />
          <h3>Belum ada rutinitas</h3>
          <p>Tambahkan aktivitas yang ingin kamu lakukan secara rutin.</p>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah Rutinitas</button>
        </div>
      ) : (
        <div className="habits-layout">
          {active.length > 0 && (
            <div className="habit-section">
              <h2 className="section-label">Belum Selesai ({active.length})</h2>
              <div className="habit-grid">
                {active.map(t => (
                  <HabitCard
                    key={t.id}
                    todo={t}
                    onToggle={toggleComplete}
                    onEdit={openEdit}
                    onDelete={deleteTodo}
                  />
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div className="habit-section">
              <h2 className="section-label">✓ Selesai Hari Ini ({done.length})</h2>
              <div className="habit-grid">
                {done.map(t => (
                  <HabitCard
                    key={t.id}
                    todo={t}
                    onToggle={toggleComplete}
                    onEdit={openEdit}
                    onDelete={deleteTodo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <TodoModal
          todo={editingTodo}
          onClose={() => { setModalOpen(false); setEditingTodo(null) }}
          onSave={handleSave}
          defaultRecurring
        />
      )}
    </div>
  )
}
