import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            DocVerify
          </Link>
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              Home
            </Link>
            <Link to="/upload" className="text-gray-600 hover:text-blue-600">
              Upload
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header