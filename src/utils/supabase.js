function authHeaders(key) {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  }
}

function toRow(expense) {
  return {
    id: expense.id,
    date: expense.date,
    amount: expense.amount,
    currency: expense.currency,
    vendor: expense.vendor || null,
    description: expense.description || null,
    category: expense.category,
    receipt_name: expense.receiptName || null,
    extracted_by_ai: expense.extractedByAI || false,
    created_at: expense.createdAt,
  }
}

function fromRow(row) {
  return {
    id: row.id,
    date: row.date,
    amount: row.amount,
    currency: row.currency,
    vendor: row.vendor,
    description: row.description,
    category: row.category,
    receiptName: row.receipt_name,
    extractedByAI: row.extracted_by_ai,
    createdAt: row.created_at,
  }
}

export async function sbLoad(url, key) {
  const res = await fetch(`${url}/rest/v1/expenses?select=*&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Supabase error ${res.status}`)
  return (await res.json()).map(fromRow)
}

export async function sbAdd(url, key, expense) {
  const res = await fetch(`${url}/rest/v1/expenses`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(toRow(expense)),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `Supabase error ${res.status}`)
  }
}

export async function sbUpdate(url, key, id, data) {
  const body = {}
  if (data.date !== undefined) body.date = data.date
  if (data.amount !== undefined) body.amount = data.amount
  if (data.currency !== undefined) body.currency = data.currency
  if (data.vendor !== undefined) body.vendor = data.vendor
  if (data.description !== undefined) body.description = data.description
  if (data.category !== undefined) body.category = data.category

  const res = await fetch(`${url}/rest/v1/expenses?id=eq.${id}`, {
    method: 'PATCH',
    headers: authHeaders(key),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase error ${res.status}`)
}

export async function sbDelete(url, key, id) {
  const res = await fetch(`${url}/rest/v1/expenses?id=eq.${id}`, {
    method: 'DELETE',
    headers: authHeaders(key),
  })
  if (!res.ok) throw new Error(`Supabase error ${res.status}`)
}

export async function sbTestConnection(url, key) {
  const res = await fetch(`${url}/rest/v1/expenses?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export async function sbMigrateAll(url, key, expenses) {
  for (const expense of expenses) {
    await sbAdd(url, key, expense)
  }
}
