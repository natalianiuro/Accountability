import { useState } from 'react'
import {
  LayoutDashboard, Upload, List, BarChart2, Settings, Menu, X, Receipt
} from 'lucide-react'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'upload',     label: 'Subir Boleta',  icon: Upload },
  { id: 'expenses',   label: 'Gastos',        icon: List },
  { id: 'report',     label: 'Reportes',      icon: BarChart2 },
  { id: 'settings',   label: 'Configuración', icon: Settings },
]

export default function Layout({ children, currentPage, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 text-white
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500">
            <Receipt size={20} />
          </div>
          <div>
            <p className="font-semibold leading-none">Accountability</p>
            <p className="text-xs text-slate-400 mt-0.5">Gestión de Gastos</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); setSidebarOpen(false) }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${currentPage === id
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
          Datos almacenados localmente
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-4 bg-white border-b border-slate-200 px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-800">Accountability</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
