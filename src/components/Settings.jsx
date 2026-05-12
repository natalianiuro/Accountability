import { useState } from 'react'
import { CheckCircle, Eye, EyeOff, Key, Building, DollarSign, Cpu, Database, AlertCircle, Upload } from 'lucide-react'
import { loadSettings, saveSettings, loadExpenses } from '../utils/storage'
import { sbTestConnection, sbMigrateAll } from '../utils/supabase'

const CURRENCIES = ['CLP','USD','EUR','ARS','PEN','MXN','COP','UYU']

const SQL_SETUP = `create table expenses (
  id text primary key,
  date text not null,
  amount numeric not null,
  currency text not null default 'CLP',
  vendor text,
  description text,
  category text not null,
  receipt_name text,
  extracted_by_ai boolean default false,
  created_at timestamptz default now()
);

alter table expenses enable row level security;
create policy "public_access" on expenses
  for all using (true) with check (true);`

export default function Settings() {
  const [form, setForm] = useState(loadSettings())
  const [saved, setSaved] = useState(false)
  const [showClaude, setShowClaude] = useState(false)
  const [showGemini, setShowGemini] = useState(false)
  const [showSbKey, setShowSbKey] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const [sbStatus, setSbStatus] = useState(null) // null | 'ok' | 'error'
  const [sbError, setSbError] = useState('')
  const [migrating, setMigrating] = useState(false)
  const [migrateMsg, setMigrateMsg] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave(e) {
    e.preventDefault()
    saveSettings(form)
    setSaved(true)
    setSbStatus(null)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleTestConnection() {
    setSbStatus(null)
    setSbError('')
    try {
      await sbTestConnection(form.supabaseUrl, form.supabaseAnonKey)
      setSbStatus('ok')
    } catch (err) {
      setSbStatus('error')
      setSbError(err.message)
    }
  }

  async function handleMigrate() {
    setMigrating(true)
    setMigrateMsg('')
    const local = loadExpenses()
    if (local.length === 0) {
      setMigrateMsg('No hay datos locales para migrar.')
      setMigrating(false)
      return
    }
    try {
      await sbMigrateAll(form.supabaseUrl, form.supabaseAnonKey, local)
      setMigrateMsg(`${local.length} gasto(s) migrado(s) exitosamente. Recarga la página para ver los datos desde Supabase.`)
    } catch (err) {
      setMigrateMsg(`Error al migrar: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  const sbConfigured = !!(form.supabaseUrl && form.supabaseAnonKey)
  const localCount = loadExpenses().length

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Preferencias generales de la aplicación.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 text-sm">
          <CheckCircle size={16} /> Configuración guardada. Recarga la página para aplicar cambios de Supabase.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">

        {/* Company */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
            <Building size={15} /> Nombre de la empresa
          </label>
          <input value={form.company} onChange={e => set('company', e.target.value)}
            placeholder="Mi Empresa S.A."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>

        {/* Currency */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
            <DollarSign size={15} /> Moneda predeterminada
          </label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* AI Provider */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Cpu size={15} /> Proveedor de IA para extracción
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'gemini', label: 'Google Gemini', sub: 'Gratis · Recomendado', color: 'border-emerald-400 bg-emerald-50' },
              { id: 'claude', label: 'Anthropic Claude', sub: 'De pago · Mayor precisión', color: 'border-violet-400 bg-violet-50' },
            ].map(p => (
              <button key={p.id} type="button" onClick={() => set('aiProvider', p.id)}
                className={`text-left border-2 rounded-lg px-4 py-3 transition-colors ${form.aiProvider === p.id ? p.color : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className="font-medium text-sm text-slate-800">{p.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Gemini API key */}
        <div className={form.aiProvider !== 'gemini' ? 'opacity-40 pointer-events-none' : ''}>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
            <Key size={15} /> API Key de Google Gemini
          </label>
          <div className="relative">
            <input
              type={showGemini ? 'text' : 'password'}
              value={form.geminiApiKey}
              onChange={e => set('geminiApiKey', e.target.value)}
              placeholder="AIza..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button type="button" onClick={() => setShowGemini(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Obtén tu key gratis en <span className="text-sky-600 font-medium">aistudio.google.com</span> → Get API Key. No requiere tarjeta.
          </p>
        </div>

        {/* Claude API key */}
        <div className={form.aiProvider !== 'claude' ? 'opacity-40 pointer-events-none' : ''}>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
            <Key size={15} /> API Key de Claude (Anthropic)
          </label>
          <div className="relative">
            <input
              type={showClaude ? 'text' : 'password'}
              value={form.claudeApiKey}
              onChange={e => set('claudeApiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button type="button" onClick={() => setShowClaude(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showClaude ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Obtén tu key en <span className="text-sky-600 font-medium">console.anthropic.com</span>. Requiere créditos de pago.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            Guardar configuración
          </button>
        </div>
      </form>

      {/* Supabase section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <Database size={16} /> Datos compartidos con el equipo
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Conecta Supabase para que todo el equipo vea y agregue gastos en tiempo real.
          </p>
        </div>

        {/* SQL instructions */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-600">Paso 1 — Crear la tabla en Supabase</p>
          <p className="text-xs text-slate-500">Ve a <span className="text-sky-600 font-medium">supabase.com</span> → tu proyecto → SQL Editor y ejecuta:</p>
          <button
            type="button"
            onClick={() => setShowSql(v => !v)}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium underline"
          >
            {showSql ? 'Ocultar SQL' : 'Ver SQL de configuración'}
          </button>
          {showSql && (
            <pre className="bg-slate-900 text-emerald-300 text-xs rounded-lg p-3 overflow-x-auto leading-relaxed">
              {SQL_SETUP}
            </pre>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600">Paso 2 — Ingresa tus credenciales de Supabase</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Project URL</label>
            <input
              type="text"
              value={form.supabaseUrl}
              onChange={e => set('supabaseUrl', e.target.value.trim())}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Anon/Public Key</label>
            <div className="relative">
              <input
                type={showSbKey ? 'text' : 'password'}
                value={form.supabaseAnonKey}
                onChange={e => set('supabaseAnonKey', e.target.value.trim())}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button type="button" onClick={() => setShowSbKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showSbKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">En Supabase: Settings → API → Project API keys</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { saveSettings(form); handleTestConnection() }}
              disabled={!form.supabaseUrl || !form.supabaseAnonKey}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Database size={13} /> Probar conexión
            </button>

            {sbStatus === 'ok' && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium px-2">
                <CheckCircle size={13} /> Conectado correctamente
              </span>
            )}
            {sbStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-600 text-xs font-medium px-2">
                <AlertCircle size={13} /> {sbError}
              </span>
            )}
          </div>
        </div>

        {/* Migrate local data */}
        {sbConfigured && localCount > 0 && (
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600">Migrar datos existentes</p>
            <p className="text-xs text-slate-500">
              Tienes <strong>{localCount}</strong> gasto(s) guardados localmente. Puedes subirlos a Supabase para que el equipo los vea.
            </p>
            <button
              type="button"
              onClick={handleMigrate}
              disabled={migrating}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Upload size={13} /> {migrating ? 'Migrando...' : `Subir ${localCount} gasto(s) a Supabase`}
            </button>
            {migrateMsg && (
              <p className="text-xs text-slate-600">{migrateMsg}</p>
            )}
          </div>
        )}

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-800 space-y-1">
          <p className="font-semibold">Cómo compartir con el equipo</p>
          <p>Una vez configurado, comparte la URL de la app y las credenciales de Supabase con tu equipo. Todos verán los mismos gastos en tiempo real.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">Privacidad y almacenamiento</p>
        <p>Sin Supabase: los datos se guardan solo en tu navegador. Con Supabase: los datos viven en tu proyecto de Supabase (bajo tu control). Las API keys de IA nunca salen de tu dispositivo.</p>
      </div>
    </div>
  )
}
