const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000'

const readResponse = async (response, failureMessage) => {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `${failureMessage} (${response.status})`)
  }

  return data
}

export const uploadDocument = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/documents/verify`, {
    method: 'POST',
    body: formData,
  })

  return readResponse(response, 'Upload failed')
}

export const getVerificationResult = async (id) => {
  const response = await fetch(`${API_BASE_URL}/documents/result/${id}`)

  return readResponse(response, 'Failed to fetch results')
}

export const getReferenceDocuments = async () => {
  const response = await fetch(`${API_BASE_URL}/documents/references`)

  return readResponse(response, 'Failed to load reference documents')
}

export const uploadReferenceDocument = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/documents/references`, {
    method: 'POST',
    body: formData,
  })

  return readResponse(response, 'Reference upload failed')
}

export const deleteReferenceDocument = async (documentType, filename) => {
  const response = await fetch(
    `${API_BASE_URL}/documents/references/${encodeURIComponent(documentType)}/${encodeURIComponent(filename)}`,
    { method: 'DELETE' }
  )

  return readResponse(response, 'Failed to delete reference document')
}