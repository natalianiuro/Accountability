import { useState } from 'react'
import { CheckCircle, Eye, EyeOff, Key, Building, DollarSign } from 'lucide-react'
import { loadSettings, saveSettings } from '../utils/storage'

const CURRENCIES = ['CLP','USD','EUR','ARS','PEN','MXN','COP','UYU']

export default function Settings() {
  const [form, setForm] = useState(loadSettings())
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave(e) {
    e.preventDefault()
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Preferencias generales de la aplicación.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 text-sm">
          <CheckCircle size={16} /> Configuración guardada.
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

        {/* Claude API key */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
            <Key size={15} /> API Key de Claude (Anthropic)
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={form.claudeApiKey}
              onChange={e => set('claudeApiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Se guarda solo en tu navegador. Necesaria para extracción automática de boletas con IA.
            Obtén tu clave en <span className="text-sky-600">console.anthropic.com</span>.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            Guardar configuración
          </button>
        </div>
      </form>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">Privacidad y almacenamiento</p>
        <p>Todos los datos se guardan localmente en tu navegador (localStorage). No se envía nada a ningún servidor externo, salvo las imágenes de boletas que envíes a la API de Claude para extracción.</p>
      </div>
    </div>
  )
}
