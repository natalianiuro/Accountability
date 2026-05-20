export const CATEGORIES = [
  { id: 'alimentacion', label: 'Alimentación', color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700' },
  { id: 'transporte',   label: 'Transporte',   color: '#3b82f6', bg: 'bg-blue-100',   text: 'text-blue-700' },
  { id: 'oficina',      label: 'Oficina',       color: '#8b5cf6', bg: 'bg-violet-100', text: 'text-violet-700' },
  { id: 'tecnologia',   label: 'Tecnología',    color: '#06b6d4', bg: 'bg-cyan-100',   text: 'text-cyan-700' },
  { id: 'marketing',    label: 'Marketing',     color: '#ec4899', bg: 'bg-pink-100',   text: 'text-pink-700' },
  { id: 'servicios',    label: 'Servicios',     color: '#10b981', bg: 'bg-emerald-100',text: 'text-emerald-700' },
  { id: 'entretenimiento', label: 'Entretenimiento', color: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-700' },
  { id: 'otros',        label: 'Otros',         color: '#6b7280', bg: 'bg-gray-100',   text: 'text-gray-700' },
]

export const TRANSACTION_TYPES = [
  { id: 'compras', label: 'Compras', color: 'bg-rose-100', text: 'text-rose-700', accent: '#f43f5e' },
  { id: 'ventas',  label: 'Ventas',  color: 'bg-emerald-100', text: 'text-emerald-700', accent: '#10b981' },
]

export const TRANSACTION_TYPE_MAP = Object.fromEntries(TRANSACTION_TYPES.map(t => [t.id, t]))

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

export function getCategoryColor(id) {
  return CATEGORY_MAP[id]?.color ?? '#6b7280'
}

export function getCategoryLabel(id) {
  return CATEGORY_MAP[id]?.label ?? id
}

export function getTypeLabel(id) {
  return TRANSACTION_TYPE_MAP[id]?.label ?? id
}
