import { useState, useEffect } from 'react'

export function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  // Load uploaded files on component mount
  useEffect(() => {
    fetchUploadedFiles()
  }, [])

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/files')
      if (response.ok) {
        const files = await response.json()
        setUploadedFiles(files)
      } else {
        console.error('Failed to fetch files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const uploadFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadMessage('Error: Only .docx and .pdf files are allowed')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUploadMessage(`Success: ${result.filename} uploaded successfully!`)
        setUploadProgress(100)
        // Refresh the file list
        await fetchUploadedFiles()
      } else {
        const error = await response.json()
        setUploadMessage(`Error: ${error.detail}`)
      }
    } catch (error) {
      setUploadMessage('Error: Failed to upload file. Please try again.')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0)
        setUploadMessage('')
      }, 3000)
    }
  }

  const handleFileSelect = (file) => {
    if (file) {
      uploadFile(file)
    }
  }

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.docx,.pdf'
    input.style.display = 'none'
    
    input.onchange = (e) => {
      const file = e.target.files[0]
      handleFileSelect(file)
    }
    
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{ 
      marginTop: '80px', 
      marginLeft: '250px', 
      padding: '20px',
      height: 'calc(100vh - 80px)',
      backgroundColor: '#fce4ec',
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ 
          color: '#2d1b4e', 
          marginBottom: '20px',
          fontSize: '2rem',
          textAlign: 'center'
        }}>
          Upload Documents
        </h2>
        <p style={{ 
          color: '#e91e63', 
          marginBottom: '40px',
          fontSize: '1.1rem',
          opacity: '0.9',
          textAlign: 'center'
        }}>
          Upload your PRD or BRD files to get started with DocMate
        </p>
        
        {/* Upload Area */}
        <div style={{
          border: `2px dashed ${dragActive ? '#2d1b4e' : '#e91e63'}`,
          borderRadius: '10px',
          padding: '40px',
          backgroundColor: dragActive ? '#f3e5f5' : '#fce4ec',
          marginBottom: '30px',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        >
          <i className="bi bi-file-arrow-down" style={{
            fontSize: '3rem',
            color: '#e91e63',
            marginBottom: '20px',
            display: 'block'
          }}></i>
          <h3 style={{ 
            color: '#2d1b4e', 
            marginBottom: '15px'
          }}>
            Choose your .docx/.pdf file
          </h3>
          <p style={{ 
            color: '#666', 
            marginBottom: '25px'
          }}>
            Drag and drop your file here or click the button below
          </p>
          
          {/* Progress Bar */}
          {isUploading && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                width: '100%',
                backgroundColor: '#e0e0e0',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '20px',
                  backgroundColor: '#e91e63',
                  transition: 'width 0.3s ease',
                  borderRadius: '10px'
                }}></div>
              </div>
              <p style={{ color: '#2d1b4e', fontSize: '14px' }}>
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
          
          {/* Upload Message */}
          {uploadMessage && (
            <div style={{
              padding: '10px 15px',
              borderRadius: '5px',
              marginBottom: '20px',
              backgroundColor: uploadMessage.includes('Error') ? '#ffebee' : '#e8f5e8',
              color: uploadMessage.includes('Error') ? '#c62828' : '#2e7d32',
              border: `1px solid ${uploadMessage.includes('Error') ? '#ffcdd2' : '#c8e6c9'}`
            }}>
              {uploadMessage}
            </div>
          )}
          
          <button 
            onClick={handleFileUpload}
            disabled={isUploading}
            style={{
              backgroundColor: isUploading ? '#9e9e9e' : '#e91e63',
              color: 'white',
              padding: '12px 30px',
              borderRadius: '25px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(233, 30, 99, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.target.style.backgroundColor = '#2d1b4e'
                e.target.style.boxShadow = '0 4px 8px rgba(45, 27, 78, 0.3)'
                e.target.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isUploading) {
                e.target.style.backgroundColor = '#e91e63'
                e.target.style.boxShadow = '0 2px 4px rgba(233, 30, 99, 0.2)'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload .docx/pdf files'}
          </button>
        </div>

        {/* Files Uploaded Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(45, 27, 78, 0.1)'
        }}>
          <h3 style={{
            color: '#2d1b4e',
            marginBottom: '20px',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="bi bi-files" style={{ color: '#e91e63' }}></i>
            Files Uploaded ({uploadedFiles.length})
          </h3>
          
          {uploadedFiles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <i className="bi bi-inbox" style={{
                fontSize: '3rem',
                color: '#ccc',
                marginBottom: '15px',
                display: 'block'
              }}></i>
              <p>No files uploaded yet</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                Upload your first document to get started
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {uploadedFiles.map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <i className={`bi ${file.filename.toLowerCase().endsWith('.pdf') ? 'bi-filetype-pdf' : 'bi-filetype-docx'}`} style={{
                    fontSize: '1.5rem',
                    color: '#e91e63',
                    marginRight: '15px'
                  }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '500',
                      color: '#2d1b4e',
                      marginBottom: '5px'
                    }}>
                      {file.filename}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      display: 'flex',
                      gap: '20px'
                    }}>
                      <span>Size: {formatFileSize(file.size)}</span>
                      <span>Uploaded: {formatDate(file.uploaded_at)}</span>
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#e8f5e8',
                    color: '#2e7d32',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Ready
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 