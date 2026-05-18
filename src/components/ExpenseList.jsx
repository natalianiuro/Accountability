import { useState, useMemo } from 'react'
import { Trash2, Pencil, Check, X, Search } from 'lucide-react'
import { CATEGORIES, getCategoryLabel, CATEGORY_MAP } from '../utils/categories'
import { loadSettings } from '../utils/storage'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n, currency) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function CategoryBadge({ id }) {
  const cat = CATEGORY_MAP[id]
  if (!cat) return null
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.text}`}>
      {cat.label}
    </span>
  )
}

function EditRow({ expense, onSave, onCancel }) {
  const [form, setForm] = useState({ ...expense })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const currency = loadSettings().currency || 'CLP'

  return (
    <tr className="bg-sky-50">
      <td className="px-4 py-2">
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
      </td>
      <td className="px-4 py-2">
        <input value={form.vendor || ''} onChange={e => set('vendor', e.target.value)}
          placeholder="Proveedor"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
      </td>
      <td className="px-4 py-2">
        <input value={form.description || ''} onChange={e => set('description', e.target.value)}
          placeholder="Descripción"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
      </td>
      <td className="px-4 py-2">
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm w-full">
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <input type="number" value={form.amount} onChange={e => set('amount', parseFloat(e.target.value))}
          className="border border-slate-300 rounded px-2 py-1 text-sm w-28 text-right" />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="text-emerald-600 hover:text-emerald-700"><Check size={16} /></button>
          <button onClick={onCancel} className="text-red-500 hover:text-red-600"><X size={16} /></button>
        </div>
      </td>
    </tr>
  )
}

export default function ExpenseList({ expenses: { expenses, updateExpense, deleteExpense } }) {
  const settings = loadSettings()
  const defaultCurrency = settings.currency || 'CLP'

  const years = useMemo(() => {
    const s = new Set(expenses.map(e => new Date(e.date).getFullYear()))
    return [...s].sort((a, b) => b - a)
  }, [expenses])

  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterCurrency, setFilterCurrency] = useState('')
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const availableCurrencies = useMemo(() => {
    const s = new Set(expenses.map(e => e.currency).filter(Boolean))
    return [...s].sort()
  }, [expenses])

  const filtered = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.date)
        if (filterYear && d.getFullYear() !== filterYear) return false
        if (filterMonth !== '' && d.getMonth() !== parseInt(filterMonth)) return false
        if (filterCat && e.category !== filterCat) return false
        if (filterCurrency && e.currency !== filterCurrency) return false
        if (search) {
          const q = search.toLowerCase()
          if (!(e.vendor || '').toLowerCase().includes(q) &&
              !(e.description || '').toLowerCase().includes(q)) return false
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, filterYear, filterMonth, filterCat, filterCurrency, search])

  const totalsByCurrency = useMemo(() => {
    const map = {}
    for (const e of filtered) {
      const c = e.currency || defaultCurrency
      map[c] = (map[c] || 0) + e.amount
    }
    return map
  }, [filtered, defaultCurrency])

  const currencyTotalsText = Object.entries(totalsByCurrency)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([c, total]) => fmt(total, c))
    .join('  ·  ')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gastos</h1>
        <p className="text-slate-500 text-sm mt-1">
          {filtered.length} registros{currencyTotalsText ? ` · ${currencyTotalsText}` : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 w-44" />
        </div>
        <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
          <option value="">Todos los años</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
          <option value="">Todos los meses</option>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {availableCurrencies.length > 1 && (
          <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            <option value="">Todas las monedas</option>
            {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-slate-400 text-sm">No se encontraron gastos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Fecha','Proveedor','Descripción','Categoría','Monto','Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(e => editId === e.id ? (

                  <EditRow key={e.id} expense={e}
                    onSave={data => { updateExpense(e.id, { ...data, amount: parseFloat(data.amount) }); setEditId(null) }}
                    onCancel={() => setEditId(null)} />
                ) : (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{e.vendor || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="px-4 py-3"><CategoryBadge id={e.category} /></td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-right whitespace-nowrap">
                      {fmt(e.amount, e.currency || defaultCurrency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditId(e.id)} className="text-slate-400 hover:text-sky-600">
                          <Pencil size={15} />
                        </button>
                        {confirmDelete === e.id ? (
                          <>
                            <button onClick={() => { deleteExpense(e.id); setConfirmDelete(null) }}
                              className="text-red-600 text-xs font-medium">Eliminar</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-slate-400 text-xs">Cancelar</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(e.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {Object.keys(totalsByCurrency).length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  {Object.entries(totalsByCurrency)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([c, total]) => (
                      <tr key={c}>
                        <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Total {c}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800 whitespace-nowrap">
                          {fmt(total, c)}
                        </td>
                        <td />
                      </tr>
                    ))}
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
