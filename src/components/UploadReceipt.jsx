import { useState, useRef, useEffect } from 'react'
import { Upload, Sparkles, AlertCircle, CheckCircle, FileText, Image } from 'lucide-react'
import { CATEGORIES, TRANSACTION_TYPES } from '../utils/categories'
import { loadSettings } from '../utils/storage'
import { extractReceiptData, fileToBase64, isImageFile, isSupportedForAI } from '../utils/claude'
import { extractWithGemini } from '../utils/gemini'

const today = () => new Date().toISOString().split('T')[0]

const emptyForm = () => ({
  date: today(),
  amount: '',
  currency: loadSettings().currency || 'CLP',
  vendor: '',
  description: '',
  category: 'otros',
  transactionType: 'compras',
})

export default function UploadReceipt({ expenses }) {
  const { addExpense } = expenses
  const [form, setForm] = useState(emptyForm())
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const [settings, setSettings] = useState(loadSettings)
  useEffect(() => {
    const refresh = () => setSettings(loadSettings())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleFile(f) {
    if (!f) return
    setFile(f)
    setExtractError('')
    setSuccess(false)
    if (isImageFile(f)) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  async function handleExtract() {
    if (!file || !isSupportedForAI(file)) {
      setExtractError('La extracción automática requiere una imagen (JPG, PNG, WebP) o PDF.')
      return
    }
    const provider = settings.aiProvider || 'gemini'
    const apiKey = provider === 'gemini' ? settings.geminiApiKey : settings.claudeApiKey
    if (!apiKey) {
      setExtractError(`Configura tu API key de ${provider === 'gemini' ? 'Gemini' : 'Claude'} en Configuración.`)
      return
    }
    setExtracting(true)
    setExtractError('')
    try {
      const base64 = await fileToBase64(file)
      const data = provider === 'gemini'
        ? await extractWithGemini(base64, file.type, apiKey)
        : await extractReceiptData(base64, file.type, apiKey)
      setForm(prev => ({
        ...prev,
        date: data.date || prev.date,
        amount: data.amount ?? prev.amount,
        currency: data.currency || prev.currency,
        vendor: data.vendor || prev.vendor,
        description: data.description || prev.description,
        category: data.category || prev.category,
        transactionType: data.transactionType || prev.transactionType,
      }))
    } catch (err) {
      setExtractError(`Error al extraer: ${err.message}`)
    } finally {
      setExtracting(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.date || !form.category) return
    addExpense({
      ...form,
      amount: parseFloat(form.amount),
      receiptName: file?.name || null,
      extractedByAI: false,
    })
    setForm(emptyForm())
    setFile(null)
    setPreview(null)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Subir Boleta</h1>
        <p className="text-slate-500 text-sm mt-1">Sube una imagen o PDF y completa los datos del gasto.</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 text-sm">
          <CheckCircle size={16} /> Gasto registrado exitosamente.
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-white hover:border-sky-300 hover:bg-slate-50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="preview" className="mx-auto max-h-48 rounded-lg object-contain" />
        ) : file ? (
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <FileText size={40} className="text-slate-400" />
            <span className="font-medium">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Upload size={36} />
            <div>
              <p className="font-medium text-slate-600">Arrastra una boleta aquí</p>
              <p className="text-sm">JPG, PNG, PDF, screenshot — haz clic para seleccionar</p>
            </div>
          </div>
        )}
      </div>

      {/* AI extract button */}
      {file && isSupportedForAI(file) && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles size={15} />
            {extracting ? 'Extrayendo datos...' : `Extraer con IA (${settings.aiProvider === 'claude' ? 'Claude' : 'Gemini'})`}
          </button>
          {!(settings.aiProvider === 'gemini' ? settings.geminiApiKey : settings.claudeApiKey) && (
            <p className="text-xs text-slate-400">Requiere API key en Configuración</p>
          )}
        </div>
      )}

      {extractError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {extractError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-slate-700">Datos del gasto</h2>

        {/* Transaction type */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Tipo *</label>
          <div className="grid grid-cols-2 gap-2">
            {TRANSACTION_TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => set('transactionType', t.id)}
                className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors
                  ${form.transactionType === t.id
                    ? t.id === 'compras' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Fecha *</label>
            <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Categoría *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Monto *</label>
            <input type="number" required min="0" step="any" value={form.amount} onChange={e => set('amount', e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Moneda</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
              {['CLP','USD','EUR','ARS','PEN','MXN','COP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Proveedor</label>
          <input type="text" value={form.vendor} onChange={e => set('vendor', e.target.value)}
            placeholder="Nombre del local o empresa"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
          <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Ej: Almuerzo equipo, materiales oficina..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>

        <button type="submit"
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          Guardar gasto
        </button>
      </form>
    </div>
  )
}
