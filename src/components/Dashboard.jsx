import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useTodos } from '../hooks/useTodos'
import TodoItem from './TodoItem'
import TodoModal from './TodoModal'
import TodoFilters from './TodoFilters'
import Sidebar from './Sidebar'
import DashboardHome from './DashboardHome'
import HabitsPage from './HabitsPage'
import TargetsPage from './TargetsPage'
import { isAfter, parseISO, isToday } from 'date-fns'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function sortTodos(todos, sort) {
  const sorted = [...todos]
  switch (sort) {
    case 'created_asc':
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    case 'due_asc':
      return sorted.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
    case 'priority_desc':
      return sorted.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1))
    default:
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
}

function TodosPage() {
  const { todos, loading, addTodo, updateTodo, deleteTodo, toggleComplete } = useTodos()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
    sort: 'created_desc',
  })

  // Only non-recurring todos on this page
  const regularTodos = useMemo(() => todos.filter(t => !t.is_recurring), [todos])

  const filteredTodos = useMemo(() => {
    let result = [...regularTodos]
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      )
    }
    if (filters.status === 'active') result = result.filter(t => !t.is_completed)
    if (filters.status === 'completed') result = result.filter(t => t.is_completed)
    if (filters.category !== 'all') result = result.filter(t => t.category === filters.category)
    if (filters.priority !== 'all') result = result.filter(t => t.priority === filters.priority)
    return sortTodos(result, filters.sort)
  }, [regularTodos, filters])

  const openAdd = () => { setEditingTodo(null); setModalOpen(true) }
  const openEdit = (todo) => { setEditingTodo(todo); setModalOpen(true) }
  const handleSave = async (formData) => {
    if (editingTodo) return updateTodo(editingTodo.id, formData)
    return addTodo(formData)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tugas</h1>
          <p className="page-subtitle">{regularTodos.filter(t => !t.is_completed).length} tugas belum selesai</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Tugas
        </button>
      </div>

      <TodoFilters filters={filters} onChange={setFilters} />

      <div className="todo-section">
        <div className="section-header">
          <h2>
            {filteredTodos.length} Tugas
            {filters.search && ` untuk "${filters.search}"`}
          </h2>
        </div>

        {loading ? (
          <div className="state-container"><div className="spinner" /><p>Memuat tugas...</p></div>
        ) : filteredTodos.length === 0 ? (
          <div className="state-container">
            <Plus size={48} style={{ color: '#c7d2fe' }} />
            {regularTodos.length === 0 ? (
              <>
                <h3>Belum ada tugas</h3>
                <p>Mulai dengan menambahkan tugas pertama kamu!</p>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah Tugas</button>
              </>
            ) : (
              <>
                <h3>Tidak ada hasil</h3>
                <p>Coba ubah filter atau kata pencarian.</p>
              </>
            )}
          </div>
        ) : (
          <div className="todo-list">
            {filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleComplete}
                onEdit={openEdit}
                onDelete={deleteTodo}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <TodoModal
          todo={editingTodo}
          onClose={() => { setModalOpen(false); setEditingTodo(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default function Dashboard() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case 'todos': return <TodosPage />
      case 'habits': return <HabitsPage />
      case 'targets': return <TargetsPage />
      default: return <DashboardHome onNavigate={setActivePage} />
    }
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={(page) => { setActivePage(page); setSidebarOpen(false) }}
        className={sidebarOpen ? 'open' : ''}
      />

      <div className="main-area">
        {/* Mobile header */}
        <header className="mobile-header">
          <button className="btn-icon" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="mobile-title">TodoApp</span>
        </header>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
