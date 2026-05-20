const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const PROMPT = `Analiza esta boleta o factura y extrae los datos. Responde SOLO con JSON válido, sin texto adicional ni bloques de código:
{
  "date": "YYYY-MM-DD",
  "amount": <número total sin símbolos>,
  "currency": "<CLP|USD|EUR|otro código ISO>",
  "vendor": "<nombre del proveedor>",
  "description": "<descripción breve>",
  "category": "<una de: alimentacion|transporte|oficina|tecnologia|marketing|servicios|entretenimiento|otros>",
  "transactionType": "<compras|ventas — compras si es un gasto/pago, ventas si es un ingreso/venta propia>"
}
Si no puedes determinar un campo, usa null.`

export async function extractWithGemini(base64Data, mimeType, apiKey) {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: PROMPT }
        ]
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 512 }
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error Gemini API: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('Respuesta vacía de Gemini')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear la respuesta de Gemini')
  return JSON.parse(jsonMatch[0])
}
