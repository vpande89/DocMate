import { useState, useEffect } from 'react'

export function MyFiles({ setCurrentPage }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    
    const fetchUploadedFiles = async () => {
      try {
        setError(null)
        const response = await fetch('http://localhost:8000/files')
        if (response.ok) {
          const files = await response.json()
          if (isMounted) {
            setUploadedFiles(files)
          }
        } else {
          if (isMounted) {
            setError('Failed to fetch files')
            console.error('Failed to fetch files')
          }
        }
      } catch (error) {
        if (isMounted) {
          setError('Network error. Please check your connection.')
          console.error('Error fetching files:', error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchUploadedFiles()

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array to run only once on mount

  const handleAddFileClick = () => {
    setCurrentPage('upload')
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
      padding: '40px',
      height: 'calc(100vh - 80px)',
      backgroundColor: '#fce4ec',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        border: '3px solid #2d1b4e',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(45, 27, 78, 0.15)'
      }}>
        <div style={{
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <i className="bi bi-files" style={{
            fontSize: '3rem',
            color: '#e91e63',
            marginBottom: '20px',
            display: 'block'
          }}></i>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#2d1b4e',
            margin: '0 0 15px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <i className="bi bi-files-alt" style={{ fontSize: '2.5rem' }}></i>
            My Files
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            margin: '0 0 30px 0',
            lineHeight: '1.6'
          }}>
            Your uploaded documents ({uploadedFiles.length})
          </p>
        </div>

        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #e91e63',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px auto'
            }}></div>
            <p style={{ color: '#666' }}>Loading files...</p>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#ffe6e6',
            border: '2px dashed #ff6b6b',
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <i className="bi bi-exclamation-triangle" style={{
              fontSize: '2.5rem',
              color: '#ff6b6b',
              marginBottom: '20px',
              display: 'block'
            }}></i>
            <p style={{
              fontSize: '1.1rem',
              color: '#d63031',
              margin: '0 0 10px 0',
              fontWeight: '500'
            }}>
              Connection Error
            </p>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              margin: '0 0 20px 0'
            }}>
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#ff6b6b',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d63031'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#ff6b6b'
              }}
            >
              <i className="bi bi-arrow-clockwise"></i>
              Retry
            </button>
          </div>
        ) : uploadedFiles.length === 0 ? (
          <div style={{
            backgroundColor: '#f3e5f5',
            border: '2px dashed #e91e63',
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <i className="bi bi-cloud-upload" style={{
              fontSize: '2.5rem',
              color: '#e91e63',
              marginBottom: '20px',
              display: 'block',
              opacity: '0.7'
            }}></i>
            <p style={{
              fontSize: '1.1rem',
              color: '#2d1b4e',
              margin: '0',
              fontWeight: '500'
            }}>
              No files uploaded yet
            </p>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              margin: '10px 0 20px 0'
            }}>
              Use the upload button to add your first document
            </p>
            <button 
              onClick={handleAddFileClick}
              style={{
                backgroundColor: '#e91e63',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2d1b4e'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 16px rgba(45, 27, 78, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#e91e63'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)'
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Add File
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: '#2d1b4e',
                margin: 0,
                fontSize: '1.3rem'
              }}>
                Uploaded Documents
              </h3>
              <button 
                onClick={handleAddFileClick}
                style={{
                  backgroundColor: '#e91e63',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2d1b4e'
                  e.target.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#e91e63'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                <i className="bi bi-plus-circle"></i>
                Add More
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {uploadedFiles.map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3e5f5'
                  e.target.style.borderColor = '#e91e63'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa'
                  e.target.style.borderColor = '#e9ecef'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
                >
                  <i className="bi bi-filetype-docx" style={{
                    fontSize: '2rem',
                    color: '#e91e63',
                    marginRight: '20px'
                  }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#2d1b4e',
                      marginBottom: '8px',
                      fontSize: '1.1rem'
                    }}>
                      {file.filename}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666',
                      display: 'flex',
                      gap: '25px'
                    }}>
                      <span><i className="bi bi-hdd" style={{ marginRight: '5px' }}></i>Size: {formatFileSize(file.size)}</span>
                      <span><i className="bi bi-calendar" style={{ marginRight: '5px' }}></i>Uploaded: {formatDate(file.uploaded_at)}</span>
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#e8f5e8',
                    color: '#2e7d32',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <i className="bi bi-check-circle"></i>
                    Ready
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 