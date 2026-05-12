const EXPENSES_KEY = 'accountability_expenses'
const SETTINGS_KEY = 'accountability_settings'

export function loadExpenses() {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveExpenses(expenses) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function defaultSettings() {
  return {
    claudeApiKey: '',
    geminiApiKey: '',
    aiProvider: 'gemini',
    currency: 'CLP',
    company: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
  }
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
