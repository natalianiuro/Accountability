import { getCategoryLabel } from './categories'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function exportAnnualCSV(expenses, year, categories, currency = null) {
  let filtered = expenses.filter(e => new Date(e.date).getFullYear() === year)
  if (currency) filtered = filtered.filter(e => e.currency === currency)

  // Only include categories that actually have data
  const activeCats = categories.filter(c => filtered.some(e => e.category === c.id))
  const catIds = activeCats.map(c => c.id)

  const rows = []
  const currencyLabel = currency ? ` (${currency})` : ''
  const header = [`Mes${currencyLabel}`, ...activeCats.map(c => c.label), 'Total']
  rows.push(header)

  let yearTotals = Object.fromEntries(catIds.map(id => [id, 0]))
  let yearGrand = 0

  for (let m = 0; m < 12; m++) {
    const monthExp = filtered.filter(e => new Date(e.date).getMonth() === m)
    if (monthExp.length === 0) continue
    const catTotals = Object.fromEntries(catIds.map(id => [id, 0]))
    let rowTotal = 0
    for (const e of monthExp) {
      if (catTotals[e.category] !== undefined) {
        catTotals[e.category] += e.amount
        yearTotals[e.category] += e.amount
        rowTotal += e.amount
        yearGrand += e.amount
      }
    }
    rows.push([MONTHS[m], ...catIds.map(id => catTotals[id] || ''), rowTotal])
  }

  rows.push(['TOTAL ANUAL', ...catIds.map(id => yearTotals[id] || ''), yearGrand])

  const csv = rows.map(r => r.join(',')).join('\n')
  const suffix = currency ? `_${currency}` : ''
  downloadCSV(csv, `gastos_${year}${suffix}.csv`)
}

export function exportDetailCSV(expenses, year, currency = null) {
  let filtered = expenses
    .filter(e => !year || new Date(e.date).getFullYear() === year)
  if (currency) filtered = filtered.filter(e => e.currency === currency)
  filtered = filtered.sort((a, b) => a.date.localeCompare(b.date))

  const header = ['Fecha','Proveedor','Descripción','Categoría','Monto','Moneda']
  const rows = [header, ...filtered.map(e => [
    e.date,
    `"${(e.vendor || '').replace(/"/g, '""')}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    getCategoryLabel(e.category),
    e.amount,
    e.currency
  ])]

  const csv = rows.map(r => r.join(',')).join('\n')
  const suffix = currency ? `_${currency}` : '_todos'
  downloadCSV(csv, `gastos_detalle_${year || 'todos'}${suffix}.csv`)
}

function downloadCSV(content, filename) {
  const bom = '﻿'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
