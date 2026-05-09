import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, Receipt, DollarSign, Calendar } from 'lucide-react'
import { CATEGORIES, getCategoryLabel } from '../utils/categories'
import { loadSettings } from '../utils/storage'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmt(n, currency) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard({ expenses }) {
  const settings = loadSettings()
  const currency = settings.currency || 'CLP'
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  const { monthTotal, yearTotal, byCategory, byMonth, recentExpenses } = useMemo(() => {
    const monthExp = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth
    })
    const yearExp = expenses.filter(e => new Date(e.date).getFullYear() === thisYear)

    const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0)
    const yearTotal = yearExp.reduce((s, e) => s + e.amount, 0)

    const byCategory = CATEGORIES.map(cat => ({
      name: cat.label,
      value: yearExp.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    })).filter(c => c.value > 0)

    const byMonth = MONTHS_SHORT.map((name, i) => ({
      name,
      total: yearExp.filter(e => new Date(e.date).getMonth() === i).reduce((s, e) => s + e.amount, 0)
    }))

    const recentExpenses = [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)

    return { monthTotal, yearTotal, byCategory, byMonth, recentExpenses }
  }, [expenses, thisYear, thisMonth])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{thisYear} — resumen de gastos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total este mes" value={fmt(monthTotal, currency)} color="bg-sky-500" />
        <StatCard icon={TrendingUp} label="Total este año" value={fmt(yearTotal, currency)} color="bg-violet-500" />
        <StatCard icon={Receipt} label="Boletas este año" value={expenses.filter(e => new Date(e.date).getFullYear() === thisYear).length} color="bg-emerald-500" />
        <StatCard icon={Calendar} label="Boletas totales" value={expenses.length} color="bg-amber-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Gastos por mes ({thisYear})</h2>
          {yearTotal > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => fmt(v, currency)} />
                <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">
              Sin gastos registrados
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Por categoría</h2>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                  {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                <Tooltip formatter={(v) => fmt(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Gastos recientes</h2>
        </div>
        {recentExpenses.length === 0 ? (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">No hay gastos registrados</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{e.vendor || e.description || 'Sin descripción'}</p>
                  <p className="text-xs text-slate-400">{e.date} · {getCategoryLabel(e.category)}</p>
                </div>
                <span className="font-semibold text-slate-800">{fmt(e.amount, e.currency || currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
