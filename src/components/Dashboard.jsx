import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Receipt, Calendar, TrendingDown, TrendingUp, ArrowLeftRight } from 'lucide-react'
import { CATEGORIES, getCategoryLabel } from '../utils/categories'
import { loadSettings } from '../utils/storage'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmt(n, currency) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function CurrencyBlock({ currency, monthExp, yearExp, byMonth }) {
  const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0)
  const yearTotal = yearExp.reduce((s, e) => s + e.amount, 0)

  const byCategory = CATEGORIES.map(cat => ({
    name: cat.label,
    value: yearExp.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
    color: cat.color,
  })).filter(c => c.value > 0)

  const CURRENCY_COLORS = { CLP: 'bg-sky-500', USD: 'bg-emerald-500' }
  const barColor = { CLP: '#0ea5e9', USD: '#10b981' }
  const headerColor = CURRENCY_COLORS[currency] || 'bg-violet-500'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`px-5 py-3 ${headerColor} flex items-center justify-between`}>
        <span className="text-white font-semibold text-sm">{currency}</span>
        <span className="text-white/80 text-xs">{yearExp.length} gastos este año</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">Este mes</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{fmt(monthTotal, currency)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">Este año</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{fmt(yearTotal, currency)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 mb-3">Por mes</p>
          {yearTotal > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={byMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={v => fmt(v, currency)} />
                <Bar dataKey="total" fill={barColor[currency] || '#8b5cf6'} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[160px] text-slate-400 text-xs">Sin gastos</div>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 mb-3">Por categoría</p>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" cx="50%" cy="50%" outerRadius={55} paddingAngle={2}>
                  {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend formatter={v => <span className="text-xs">{v}</span>} />
                <Tooltip formatter={v => fmt(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[160px] text-slate-400 text-xs">Sin datos</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ expenses }) {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  const currencies = useMemo(() => {
    const s = new Set(expenses.map(e => e.currency).filter(Boolean))
    return [...s].sort()
  }, [expenses])

  const dataPerCurrency = useMemo(() => {
    return currencies.map(currency => {
      const yearExp = expenses.filter(e =>
        new Date(e.date).getFullYear() === thisYear && e.currency === currency
      )
      const monthExp = yearExp.filter(e => new Date(e.date).getMonth() === thisMonth)
      const byMonth = MONTHS_SHORT.map((name, i) => ({
        name,
        total: yearExp.filter(e => new Date(e.date).getMonth() === i).reduce((s, e) => s + e.amount, 0)
      }))
      return { currency, yearExp, monthExp, byMonth }
    })
  }, [expenses, currencies, thisYear, thisMonth])

  const recentExpenses = useMemo(() =>
    [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [expenses]
  )

  // Balance compras vs ventas por moneda
  const balanceByCurrency = useMemo(() => {
    const yearExp = expenses.filter(e => new Date(e.date).getFullYear() === thisYear)
    const map = {}
    for (const e of yearExp) {
      const c = e.currency || 'CLP'
      if (!map[c]) map[c] = { compras: 0, ventas: 0 }
      const type = e.transactionType || 'compras'
      map[c][type] += e.amount
    }
    return map
  }, [expenses, thisYear])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{thisYear} — resumen de gastos</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><Receipt size={14} /> {expenses.filter(e => new Date(e.date).getFullYear() === thisYear).length} boletas este año</span>
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {expenses.length} totales</span>
        </div>
      </div>

      {/* Balance compras vs ventas */}
      {Object.keys(balanceByCurrency).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(balanceByCurrency).sort(([a],[b]) => a.localeCompare(b)).map(([c, { compras, ventas }]) => (
            <div key={c} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c} — Balance {thisYear}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown size={13} className="text-rose-500" />
                    <span className="text-xs text-rose-600 font-medium">Compras</span>
                  </div>
                  <p className="text-base font-bold text-rose-700">{fmt(compras, c)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={13} className="text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Ventas</span>
                  </div>
                  <p className="text-base font-bold text-emerald-700">{fmt(ventas, c)}</p>
                </div>
              </div>
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${ventas - compras >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <ArrowLeftRight size={13} /> Neto
                </span>
                <span className={`font-bold text-sm ${ventas - compras >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {ventas - compras >= 0 ? '+' : ''}{fmt(ventas - compras, c)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {currencies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          No hay gastos registrados
        </div>
      ) : (
        <div className="space-y-4">
          {dataPerCurrency.map(d => (
            <CurrencyBlock key={d.currency} {...d} />
          ))}
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${e.currency === 'USD' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                    {e.currency}
                  </span>
                  <span className="font-semibold text-slate-800">{fmt(e.amount, e.currency || 'CLP')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
