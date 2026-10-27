import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getVerificationResult } from '../../../services/api/documentApi'

const ResultDisplay = () => {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    let isCurrentRequest = true

    const fetchResult = async () => {
      try {
        const data = await getVerificationResult(id)
        if (isCurrentRequest) setResult(data)
      } catch (error) {
        if (isCurrentRequest) setError(error.message)
      } finally {
        if (isCurrentRequest) setLoading(false)
      }
    }

    setLoading(true)
    setError(null)
    fetchResult()
    return () => {
      isCurrentRequest = false
    }
  }, [id, requestKey])

  if (loading) return <div>Loading results...</div>
  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow" role="alert">
        <h2 className="text-2xl font-bold mb-4">Unable to load the result</h2>
        <p className="text-red-600">{error}</p>
        <div className="mt-6 flex gap-4">
          <button
            className="text-blue-600 hover:text-blue-700"
            onClick={() => setRequestKey((key) => key + 1)}
          >
            Try again
          </button>
          <Link className="text-blue-600 hover:text-blue-700" to="/upload">
            Upload another document
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">Reference Comparison Result</h2>
      <p className="text-gray-600 mb-6">{result?.documentTypeName}</p>

      {result && (
        <div className="space-y-4">
          <div className={`rounded-lg p-4 ${
            result.outcome === 'reference_match'
              ? 'bg-green-50 text-green-800'
              : result.outcome === 'no_match'
                ? 'bg-red-50 text-red-800'
                : 'bg-yellow-50 text-yellow-900'
          }`}>
            <h3 className="font-bold">{result.outcomeLabel}</h3>
            <p className="mt-2">{result.message}</p>
          </div>

          {typeof result.similarity === 'number' && (
            <p className="text-sm text-gray-600">
              Text similarity to the closest reference: {(result.similarity * 100).toFixed(1)}%
            </p>
          )}

          <p className="text-sm text-gray-500">
            A text match is only a comparison with the reference documents supplied to this local app.
            It does not establish official authenticity.
          </p>
          <Link className="inline-block text-blue-600 hover:text-blue-700" to="/upload">
            Upload another document
          </Link>
        </div>
      )}
    </div>
  )
}

export default ResultDisplay