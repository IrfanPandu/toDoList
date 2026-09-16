import { Search, SlidersHorizontal } from 'lucide-react'

const CATEGORIES = ['Semua', 'Pekerjaan', 'Pribadi', 'Belajar', 'Kesehatan', 'Belanja', 'Lainnya']
const PRIORITIES = [
  { value: 'all', label: 'Semua Prioritas' },
  { value: 'high', label: 'Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Rendah' },
]
const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Selesai' },
]
const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Terbaru' },
  { value: 'created_asc', label: 'Terlama' },
  { value: 'due_asc', label: 'Deadline Terdekat' },
  { value: 'priority_desc', label: 'Prioritas Tertinggi' },
]

export default function TodoFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="filters-container">
      <div className="search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Cari tugas..."
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          aria-label="Cari tugas"
        />
      </div>

      <div className="filter-row">
        <div className="filter-tabs">
          {STATUS_FILTERS.map(s => (
            <button
              key={s.value}
              className={`filter-tab ${filters.status === s.value ? 'active' : ''}`}
              onClick={() => update('status', s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="filter-selects">
          <select
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
            aria-label="Filter kategori"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c === 'Semua' ? 'all' : c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => update('priority', e.target.value)}
            aria-label="Filter prioritas"
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <div className="sort-select">
            <SlidersHorizontal size={14} />
            <select
              value={filters.sort}
              onChange={(e) => update('sort', e.target.value)}
              aria-label="Urutkan"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
