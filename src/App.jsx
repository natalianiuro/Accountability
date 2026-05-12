import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import UploadReceipt from './components/UploadReceipt'
import ExpenseList from './components/ExpenseList'
import MonthlyReport from './components/MonthlyReport'
import Settings from './components/Settings'
import { useExpenses } from './hooks/useExpenses'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const expenseStore = useExpenses()
  const { expenses, loading } = expenseStore

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Cargando gastos...</p>
      </div>
    )
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard expenses={expenses} />}
      {page === 'upload'    && <UploadReceipt expenses={expenseStore} />}
      {page === 'expenses'  && <ExpenseList expenses={expenseStore} />}
      {page === 'report'    && <MonthlyReport expenses={expenses} />}
      {page === 'settings'  && <Settings />}
    </Layout>
  )
}
