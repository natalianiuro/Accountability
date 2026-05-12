const API_URL = 'https://api.anthropic.com/v1/messages'

export async function extractReceiptData(base64Data, mimeType, apiKey) {
  const isPdf = mimeType === 'application/pdf'
  const fileBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }
    : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          fileBlock,
          {
            type: 'text',
            text: `Analiza esta boleta o factura y extrae los datos. Responde SOLO con JSON válido, sin texto adicional:
{
  "date": "YYYY-MM-DD",
  "amount": <número total sin símbolos>,
  "currency": "<CLP|USD|EUR|otro código ISO>",
  "vendor": "<nombre del proveedor>",
  "description": "<descripción breve de la compra>",
  "category": "<una de: alimentacion|transporte|oficina|tecnologia|marketing|servicios|entretenimiento|otros>"
}
Si no puedes determinar un campo, usa null.`
          }
        ]
      }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error API: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content[0].text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear la respuesta de Claude')
  return JSON.parse(jsonMatch[0])
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isImageFile(file) {
  return file.type.startsWith('image/')
}

export function isSupportedForAI(file) {
  return file.type.startsWith('image/') || file.type === 'application/pdf'
}
