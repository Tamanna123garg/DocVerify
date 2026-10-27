import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle2, FileText, GraduationCap, ScrollText, FileCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteReferenceDocument,
  getReferenceDocuments,
  uploadDocument,
  uploadReferenceDocument,
} from '@/services/api/documentApi';
import '../DocumentUpload/Document.css'

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [references, setReferences] = useState({});
  const [referenceFiles, setReferenceFiles] = useState({});
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [referenceAction, setReferenceAction] = useState(null);
  const [referenceError, setReferenceError] = useState('');
  const [referenceNotice, setReferenceNotice] = useState('');

  const documentTypes = [
    {
      id: 'marksheet10',
      name: '10th Marksheet',
      description: 'Class 10 Final Examination Result',
      acceptedFormats: 'PDF/JPG/PNG',
      icon: <GraduationCap className="w-6 h-6 text-blue-500" />
    },
    {
      id: 'marksheet12',
      name: '12th Marksheet',
      description: 'Class 12 Final Examination Result',
      acceptedFormats: 'PDF/JPG/PNG',
      icon: <GraduationCap className="w-6 h-6 text-green-500" />
    },
    {
      id: 'jeeResult',
      name: 'JEE Result',
      description: 'Joint Entrance Examination Score Card',
      acceptedFormats: 'PDF only',
      icon: <ScrollText className="w-6 h-6 text-purple-500" />
    },
    {
      id: 'tc',
      name: 'Transfer Certificate',
      description: 'School Transfer Certificate',
      acceptedFormats: 'PDF/JPG/PNG',
      icon: <FileText className="w-6 h-6 text-orange-500" />
    },
    {
      id: 'domicile',
      name: 'Domicile Certificate',
      description: 'State Domicile/Residence Proof',
      acceptedFormats: 'PDF/JPG/PNG',
      icon: <FileCheck className="w-6 h-6 text-red-500" />
    }
  ];

  const refreshReferences = async () => {
    const configuredReferences = await getReferenceDocuments();
    setReferences(configuredReferences);
  };

  useEffect(() => {
    let isCurrentRequest = true;

    getReferenceDocuments()
      .then((configuredReferences) => {
        if (isCurrentRequest) setReferences(configuredReferences);
      })
      .catch((referenceLoadError) => {
        if (isCurrentRequest) setReferenceError(referenceLoadError.message);
      })
      .finally(() => {
        if (isCurrentRequest) setReferenceLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelection(droppedFile);
  };

  const handleFileSelection = (selectedFile) => {
    if (selectedFile) {
      const isPdf = selectedFile.type === 'application/pdf';
      const isImage = selectedFile.type.startsWith('image/');
      const isSupportedType = isPdf || (documentType !== 'jeeResult' && isImage);

      if (isSupportedType) {
        setFile(selectedFile);
        setStatus('success');
        setError('');
      } else {
        setFile(null);
        setStatus('error');
      }
    }
  };

  const handleFileInput = (e) => {
    handleFileSelection(e.target.files[0]);
  };

  const handleDocumentTypeChange = (value) => {
    setDocumentType(value);
    setFile(null);
    setStatus(null);
    setError('');
  };

  const handleVerify = async () => {
    if (!file || !documentType || isVerifying) return;

    setIsVerifying(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      const result = await uploadDocument(formData);
      navigate(`/results/${result.id}`);
    } catch (verificationError) {
      setError(verificationError.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReferenceFileChange = (type, selectedFile) => {
    setReferenceError('');
    setReferenceNotice('');

    if (!selectedFile) return;

    const isPdf = selectedFile.type === 'application/pdf'
      || selectedFile.name.toLowerCase().endsWith('.pdf');
    const isImage = selectedFile.type.startsWith('image/')
      || /\.(jpe?g|png)$/i.test(selectedFile.name);
    const isSupported = isPdf || (type !== 'jeeResult' && isImage);

    if (!isSupported) {
      setReferenceFiles((current) => ({ ...current, [type]: null }));
      setReferenceError(
        type === 'jeeResult'
          ? 'JEE Result references must be PDF files.'
          : 'Choose a PDF, JPG, JPEG, or PNG reference document.'
      );
      return;
    }

    setReferenceFiles((current) => ({ ...current, [type]: selectedFile }));
  };

  const handleReferenceUpload = async (type) => {
    const referenceFile = referenceFiles[type];
    if (!referenceFile || referenceAction) return;

    setReferenceAction({ type, action: 'upload' });
    setReferenceError('');
    setReferenceNotice('');

    const formData = new FormData();
    formData.append('file', referenceFile);
    formData.append('documentType', type);

    try {
      await uploadReferenceDocument(formData);
      await refreshReferences();
      setReferenceFiles((current) => ({ ...current, [type]: null }));
      setReferenceNotice('Reference document saved locally.');
    } catch (uploadError) {
      setReferenceError(uploadError.message);
    } finally {
      setReferenceAction(null);
    }
  };

  const handleReferenceDelete = async (type, filename) => {
    if (referenceAction) return;

    setReferenceAction({ type, action: filename });
    setReferenceError('');
    setReferenceNotice('');

    try {
      await deleteReferenceDocument(type, filename);
      await refreshReferences();
      setReferenceNotice('Reference document removed.');
    } catch (deleteError) {
      setReferenceError(deleteError.message);
    } finally {
      setReferenceAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Educational Document Reference Comparison
          </h1>
          <p className="text-xl text-gray-600">
            Compare a document with a genuine reference configured for its type
          </p>
        </div>

        <section className="mb-12 rounded-lg border border-blue-100 bg-white p-6" aria-labelledby="references-heading">
          <h2 id="references-heading" className="text-2xl font-bold text-gray-900 mb-2">
            Reference documents by type
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Add genuine reference documents to each category. Documents are saved on this computer
            and each upload is compared only with references in its selected category.
          </p>

          {referenceError && (
            <Alert className="mb-4 bg-red-50 border-red-200" role="alert">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 ml-2">
                {referenceError}
              </AlertDescription>
            </Alert>
          )}
          {referenceNotice && (
            <Alert className="mb-4 bg-green-50 border-green-200" role="status">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 ml-2">
                {referenceNotice}
              </AlertDescription>
            </Alert>
          )}

          {referenceLoading ? (
            <p className="text-sm text-gray-500">Loading reference documents...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {documentTypes.map((doc) => {
                const configuredReferences = references[doc.id] || [];
                const selectedReference = referenceFiles[doc.id];

                return (
                  <div key={doc.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                      {doc.icon}
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {configuredReferences.length} reference
                      {configuredReferences.length === 1 ? '' : 's'} configured
                    </p>

                    {configuredReferences.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {configuredReferences.map((reference) => (
                          <li
                            key={reference.filename}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="break-all text-gray-700">{reference.displayName}</span>
                            <button
                              type="button"
                              className="shrink-0 text-red-600 hover:text-red-700 disabled:opacity-50"
                              onClick={() => handleReferenceDelete(doc.id, reference.filename)}
                              disabled={referenceAction !== null}
                              aria-label={`Remove ${reference.displayName} from ${doc.name} references`}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <label className="mt-4 block text-sm font-medium text-gray-700">
                      Add reference ({doc.acceptedFormats})
                      <input
                        className="mt-1 block w-full text-sm text-gray-600"
                        type="file"
                        accept={doc.id === 'jeeResult' ? '.pdf,application/pdf' : 'image/*,.pdf,application/pdf'}
                        onChange={(event) => handleReferenceFileChange(doc.id, event.target.files[0])}
                        disabled={referenceAction !== null}
                      />
                    </label>
                    {selectedReference && (
                      <p className="mt-2 truncate text-xs text-gray-500">
                        Selected: {selectedReference.name}
                      </p>
                    )}
                    <button
                      type="button"
                      className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => handleReferenceUpload(doc.id)}
                      disabled={!selectedReference || referenceAction !== null}
                    >
                      {referenceAction?.type === doc.id && referenceAction.action === 'upload'
                        ? 'Saving reference...'
                        : 'Upload reference'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Document Type Selection */}
        <div className="mb-8">
          <Select onValueChange={handleDocumentTypeChange} value={documentType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Document Type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  <div className="flex items-center space-x-2">
                    {doc.icon}
                    <span>{doc.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Type Info */}
        {documentType && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {documentTypes.find(d => d.id === documentType)?.icon}
              <h3 className="text-lg font-medium text-blue-900">
                {documentTypes.find(d => d.id === documentType)?.name}
              </h3>
            </div>
            <p className="mt-2 text-sm text-blue-700">
              {documentTypes.find(d => d.id === documentType)?.description}
            </p>
            <p className="mt-1 text-sm text-blue-600">
              Accepted formats: {documentTypes.find(d => d.id === documentType)?.acceptedFormats}
            </p>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white'
          } transition-all duration-200 ease-in-out`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-6">
            <div className="flex justify-center">
              <Upload
                className={`w-16 h-16 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`}
              />
            </div>
            <div className="text-lg">
              <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <span>Upload a file</span>
                <input
                  type="file"
                  className="sr-only"
                  accept={documentType === 'jeeResult' ? '.pdf,application/pdf' : 'image/*,.pdf,application/pdf'}
                  onChange={handleFileInput}
                  disabled={!documentType}
                />
              </label>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-sm text-gray-500">
              {documentType ? 
                `Upload your ${documentTypes.find(d => d.id === documentType)?.name}` :
                'Please select a document type first'}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {status === 'success' && file && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 ml-2">
              File selected: {file.name}
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert className="mt-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 ml-2">
              {documentType === 'jeeResult'
                ? 'JEE Result accepts PDF files only.'
                : 'Please upload a PDF or image file.'}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mt-4 bg-red-50 border-red-200" role="alert">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        {file && documentType && (
          <div className="mt-6">
            <button
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              <FileText className="w-5 h-5 mr-2" />
              {isVerifying
                ? 'Checking against reference documents...'
                : `Verify ${documentTypes.find(d => d.id === documentType)?.name}`}
            </button>
          </div>
        )}

        {/* Document Requirements */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Document Requirements</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {documentTypes.map((doc) => (
              <div key={doc.id} className="relative rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center space-x-2 mb-4">
                  {doc.icon}
                  <h3 className="text-lg font-medium text-gray-900">{doc.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2">{doc.description}</p>
                <p className="text-xs text-gray-400">Accepted: {doc.acceptedFormats}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Features</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reference Text Comparison</h3>
              <p className="text-gray-500">OCR text is compared with genuine references you configure</p>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <AlertCircle className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Local Processing</h3>
              <p className="text-gray-500">The local API processes uploaded bytes in memory and does not save them</p>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <ScrollText className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Format Support</h3>
              <p className="text-gray-500">Support for PDF and image formats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;