import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/layout/Header/Header'
import DocumentUpload from './components/documents/DocumentUpload/DocumentUpload'
import Home from './pages/Home/Home'
import Results from './components/documents/ResultDisplay/ResultDisplay'

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App