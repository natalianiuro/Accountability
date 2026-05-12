import { useState, useCallback, useEffect } from 'react'
import { loadExpenses, saveExpenses, generateId, loadSettings } from '../utils/storage'
import { sbLoad, sbAdd, sbUpdate, sbDelete } from '../utils/supabase'

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings] = useState(loadSettings)

  const sbUrl = settings.supabaseUrl
  const sbKey = settings.supabaseAnonKey
  const useSupabase = !!(sbUrl && sbKey)

  useEffect(() => {
    if (useSupabase) {
      sbLoad(sbUrl, sbKey)
        .then(data => setExpenses(data))
        .catch(() => setExpenses(loadExpenses()))
        .finally(() => setLoading(false))
    } else {
      setExpenses(loadExpenses())
      setLoading(false)
    }
  }, [])

  const addExpense = useCallback(async (data) => {
    const expense = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    setExpenses(prev => {
      const next = [expense, ...prev]
      if (!useSupabase) saveExpenses(next)
      return next
    })
    if (useSupabase) await sbAdd(sbUrl, sbKey, expense)
    return expense
  }, [useSupabase, sbUrl, sbKey])

  const updateExpense = useCallback(async (id, data) => {
    setExpenses(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...data } : e)
      if (!useSupabase) saveExpenses(next)
      return next
    })
    if (useSupabase) await sbUpdate(sbUrl, sbKey, id, data)
  }, [useSupabase, sbUrl, sbKey])

  const deleteExpense = useCallback(async (id) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id)
      if (!useSupabase) saveExpenses(next)
      return next
    })
    if (useSupabase) await sbDelete(sbUrl, sbKey, id)
  }, [useSupabase, sbUrl, sbKey])

  return { expenses, loading, addExpense, updateExpense, deleteExpense }
}
