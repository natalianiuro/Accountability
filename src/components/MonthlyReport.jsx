import { useState, useMemo } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { CATEGORIES } from '../utils/categories'
import { loadSettings } from '../utils/storage'
import { exportAnnualCSV, exportDetailCSV } from '../utils/export'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n, currency) {
  if (!n) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default function MonthlyReport({ expenses }) {
  const settings = loadSettings()
  const currency = settings.currency || 'CLP'
  const currentYear = new Date().getFullYear()

  const years = useMemo(() => {
    const s = new Set(expenses.map(e => new Date(e.date).getFullYear()))
    if (!s.has(currentYear)) s.add(currentYear)
    return [...s].sort((a, b) => b - a)
  }, [expenses, currentYear])

  const [year, setYear] = useState(currentYear)

  const { matrix, catTotals, monthTotals, grandTotal } = useMemo(() => {
    const yearExp = expenses.filter(e => new Date(e.date).getFullYear() === year)
    const matrix = {}
    const catTotals = {}
    const monthTotals = Array(12).fill(0)
    let grandTotal = 0

    for (const cat of CATEGORIES) catTotals[cat.id] = 0

    for (let m = 0; m < 12; m++) {
      matrix[m] = {}
      for (const cat of CATEGORIES) matrix[m][cat.id] = 0
    }

    for (const e of yearExp) {
      const m = new Date(e.date).getMonth()
      if (matrix[m][e.category] !== undefined) {
        matrix[m][e.category] += e.amount
        catTotals[e.category] = (catTotals[e.category] || 0) + e.amount
        monthTotals[m] += e.amount
        grandTotal += e.amount
      }
    }

    return { matrix, catTotals, monthTotals, grandTotal }
  }, [expenses, year])

  const activeCats = CATEGORIES.filter(c => catTotals[c.id] > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reporte Anual</h1>
          <p className="text-slate-500 text-sm mt-1">Desglose de gastos por mes y categoría</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => exportAnnualCSV(expenses, year, CATEGORIES)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <FileSpreadsheet size={15} /> Exportar resumen CSV
          </button>
          <button
            onClick={() => exportDetailCSV(expenses, year)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Download size={15} /> Exportar detalle CSV
          </button>
        </div>
      </div>

      {/* Annual summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {activeCats.slice(0, 4).map(cat => (
          <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: cat.color }} />
            <p className="text-xs text-slate-500">{cat.label}</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{fmt(catTotals[cat.id], currency)}</p>
          </div>
        ))}
      </div>

      {/* Matrix table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Gastos {year} — por mes y categoría</h2>
          <span className="text-sm text-slate-500">Total: <strong className="text-slate-800">{fmt(grandTotal, currency)}</strong></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 w-28">Mes</th>
                {activeCats.map(cat => (
                  <th key={cat.id} className="px-4 py-3 text-right font-medium text-slate-600 whitespace-nowrap">
                    <span className="flex items-center justify-end gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">Total mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MONTHS.map((name, m) => (
                <tr key={m} className={`hover:bg-slate-50 transition-colors ${monthTotals[m] === 0 ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-600">{name}</td>
                  {activeCats.map(cat => (
                    <td key={cat.id} className="px-4 py-3 text-right text-slate-600">
                      {matrix[m][cat.id] > 0 ? fmt(matrix[m][cat.id], currency) : '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {monthTotals[m] > 0 ? fmt(monthTotals[m], currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50">
              <tr>
                <td className="px-4 py-3 font-bold text-slate-700">Total anual</td>
                {activeCats.map(cat => (
                  <td key={cat.id} className="px-4 py-3 text-right font-bold text-slate-700">
                    {catTotals[cat.id] > 0 ? fmt(catTotals[cat.id], currency) : '—'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-bold text-sky-700 text-base">
                  {fmt(grandTotal, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Category breakdown */}
      {activeCats.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Distribución por categoría</h2>
          <div className="space-y-3">
            {activeCats.sort((a, b) => catTotals[b.id] - catTotals[a.id]).map(cat => {
              const pct = grandTotal > 0 ? (catTotals[cat.id] / grandTotal * 100) : 0
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-slate-600 shrink-0">{cat.label}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                  <div className="text-sm font-medium text-slate-700 w-16 text-right">{pct.toFixed(1)}%</div>
                  <div className="text-sm font-semibold text-slate-800 w-36 text-right">{fmt(catTotals[cat.id], currency)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
