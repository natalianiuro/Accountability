import { useState, useCallback } from 'react'
import { loadExpenses, saveExpenses, generateId } from '../utils/storage'

export function useExpenses() {
  const [expenses, setExpenses] = useState(() => loadExpenses())

  const addExpense = useCallback((data) => {
    const expense = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    setExpenses(prev => {
      const next = [expense, ...prev]
      saveExpenses(next)
      return next
    })
    return expense
  }, [])

  const updateExpense = useCallback((id, data) => {
    setExpenses(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...data } : e)
      saveExpenses(next)
      return next
    })
  }, [])

  const deleteExpense = useCallback((id) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id)
      saveExpenses(next)
      return next
    })
  }, [])

  return { expenses, addExpense, updateExpense, deleteExpense }
}
