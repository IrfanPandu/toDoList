import { useMemo, useState } from 'react'
import { Plus, Repeat, CheckCircle2, Circle, Pencil, Trash2, Plus as PlusIcon, Minus, CalendarOff } from 'lucide-react'
import { useTodos, isTodoActiveToday } from '../hooks/useTodos'
import TodoModal from './TodoModal'
import { getDay } from 'date-fns'

const RECUR_LABELS = {
  daily: 'Setiap Hari',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  custom: 'Kustom',
}

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const DAYS_FULL  = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function HabitCard({ todo, onToggle, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const count = todo.recur_count ?? 0
  const limit = todo.recur_times ?? null
  const pct = limit ? Math.min(100, Math.round((count / limit) * 100)) : null
  const done = todo.is_completed
  const isActiveToday = isTodoActiveToday(todo)
  const todayName = DAYS_FULL[getDay(new Date())]

  // Next active day for custom habits
  const nextActiveDay = useMemo(() => {
    if (todo.recur_type !== 'custom' || !todo.recur_days?.length || isActiveToday) return null
    const today = getDay(new Date())
    const sorted = [...todo.recur_days].sort((a, b) => a - b)
    const next = sorted.find(d => d > today) ?? sorted[0]
    return DAYS_FULL[next]
  }, [todo, isActiveToday])

  const handleDelete = async () => {
    if (!window.confirm(`Hapus rutinitas "${todo.title}"?`)) return
    setDeleting(true)
    await onDelete(todo.id)
  }

  return (
    <div className={`habit-card ${done ? 'done' : ''} ${!isActiveToday ? 'inactive-today' : ''}`}>
      <div className="habit-card-top">
        <button
          className="habit-check"
          onClick={() => isActiveToday && onToggle(todo.id, !done)}
          aria-label={done ? 'Tandai belum selesai' : 'Tandai selesai'}
          disabled={!isActiveToday}
          title={!isActiveToday ? `Tidak aktif hari ini (${todayName})` : undefined}
        >
          {done
            ? <CheckCircle2 size={24} className="check-icon done" />
            : isActiveToday
              ? <Circle size={24} className="check-icon" />
              : <CalendarOff size={24} className="check-icon inactive" />
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

      {/* Not active today banner */}
      {!isActiveToday && (
        <div className="habit-inactive-notice">
          <CalendarOff size={13} />
          <span>
            Tidak aktif hari {todayName}
            {nextActiveDay && ` · Aktif berikutnya: ${nextActiveDay}`}
          </span>
        </div>
      )}

      {/* Progress bar + counter — only show when active */}
      {isActiveToday && (
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
      )}
    </div>
  )
}

export default function HabitsPage() {
  const { todos, loading, addTodo, updateTodo, deleteTodo, toggleComplete } = useTodos()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)

  const habits = useMemo(() => todos.filter(t => t.is_recurring), [todos])

  // Separate: active today vs inactive today
  const activeToday  = habits.filter(t => isTodoActiveToday(t) && !t.is_completed)
  const doneToday    = habits.filter(t => isTodoActiveToday(t) && t.is_completed)
  const inactiveToday = habits.filter(t => !isTodoActiveToday(t))

  const openAdd  = () => { setEditingTodo(null); setModalOpen(true) }
  const openEdit = (t) => { setEditingTodo(t); setModalOpen(true) }

  const handleSave = async (data) => {
    if (editingTodo) return updateTodo(editingTodo.id, data)
    return addTodo(data)
  }

  const activeHabits = habits.filter(t => isTodoActiveToday(t))
  const doneTodayCount = doneToday.length
  const activeTodayTotal = activeHabits.length

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rutinitas</h1>
          <p className="page-subtitle">Aktivitas berulang yang perlu kamu jalani</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Rutinitas
        </button>
      </div>

      {/* Summary bar — only for today's active habits */}
      {activeTodayTotal > 0 && (
        <div className="habit-summary">
          <span className="habit-summary-text">
            {doneTodayCount} dari {activeTodayTotal} rutinitas aktif selesai hari ini
          </span>
          <div className="habit-summary-bar">
            <div
              className="habit-summary-fill"
              style={{ width: `${activeTodayTotal ? Math.round((doneTodayCount / activeTodayTotal) * 100) : 0}%` }}
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
          {/* Active today - pending */}
          {activeToday.length > 0 && (
            <div className="habit-section">
              <h2 className="section-label">Belum Selesai ({activeToday.length})</h2>
              <div className="habit-grid">
                {activeToday.map(t => (
                  <HabitCard key={t.id} todo={t} onToggle={toggleComplete} onEdit={openEdit} onDelete={deleteTodo} />
                ))}
              </div>
            </div>
          )}

          {/* Active today - done */}
          {doneToday.length > 0 && (
            <div className="habit-section">
              <h2 className="section-label">✓ Selesai Hari Ini ({doneToday.length})</h2>
              <div className="habit-grid">
                {doneToday.map(t => (
                  <HabitCard key={t.id} todo={t} onToggle={toggleComplete} onEdit={openEdit} onDelete={deleteTodo} />
                ))}
              </div>
            </div>
          )}

          {/* Not active today */}
          {inactiveToday.length > 0 && (
            <div className="habit-section">
              <h2 className="section-label">Tidak Aktif Hari Ini ({inactiveToday.length})</h2>
              <div className="habit-grid">
                {inactiveToday.map(t => (
                  <HabitCard key={t.id} todo={t} onToggle={toggleComplete} onEdit={openEdit} onDelete={deleteTodo} />
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
