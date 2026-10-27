import { useNavigate } from 'react-router-dom';
import { Shield, FileCheck, Clock, School } from 'lucide-react';
import '../../pages/Home/index.css'

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Compare Academic Documents Against Genuine References
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Use local OCR to compare uploaded documents with reference documents you provide.
            Text similarity is a comparison aid, not proof of official authenticity.
          </p>
          <button 
            onClick={() => navigate('/upload')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Verification
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="w-12 h-12 text-blue-600" />}
              title="OCR Reference Matching"
              description="Compare extracted document text with a genuine reference you configure"
            />
            <FeatureCard 
              icon={<Clock className="w-12 h-12 text-blue-600" />}
              title="Clear Comparison Results"
              description="See whether the extracted text matches a configured reference or needs review"
            />
            <FeatureCard 
              icon={<FileCheck className="w-12 h-12 text-blue-600" />}
              title="Multi-Document Support"
              description="Verify Class 10th, 12th marksheets and JEE results in one go"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <StepCard 
              number="1"
              title="Upload Documents"
              description="Upload your academic documents through our secure platform"
            />
            <StepCard 
              number="2"
              title="OCR Analysis"
              description="Text is extracted locally from the uploaded document"
            />
            <StepCard 
              number="3"
              title="Reference Comparison"
              description="Extracted text is compared with references you provide"
            />
            <StepCard 
              number="4"
              title="Results"
              description="Get detailed verification results instantly"
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Trusted by Leading Institutions</h2>
          <div className="grid md:grid-cols-4 gap-8 items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-center">
                <School className="w-16 h-16 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Streamline Your Verification Process?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join hundreds of institutions using our platform for secure document verification
          </p>
          <button 
            onClick={() => navigate('/upload')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
}

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="relative p-6">
    <div className="text-4xl font-bold text-blue-600 mb-4">{number}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);