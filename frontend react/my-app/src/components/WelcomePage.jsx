export function WelcomePage({ setCurrentPage }) {
  const handleUploadClick = () => {
    setCurrentPage('upload')
  }

  return (
    <div style={{ 
      marginTop: '80px', 
      marginLeft: '250px', 
      padding: '20px',
      height: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        textAlign: 'center',
        maxWidth: '800px'
      }}>
        <i className="bi bi-robot" style={{
          fontSize: '6rem',
          color: '#00B9F1',
          marginBottom: '30px',
          display: 'block',
          textShadow: '0 4px 12px rgba(0, 185, 241, 0.3)'
        }}></i>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#002E6E',
          marginBottom: '20px',
          opacity: '0.9'
        }}>
          Welcome to DocMate — Your Personal AI Assistant
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#e91e63',
          lineHeight: '1.6',
          maxWidth: '800px',
          fontWeight: '500',
          opacity: '0.9',
          marginBottom: '30px'
        }}>
          Upload any document, and let our intelligent<br />
          chat-based assistant help you navigate, understand,<br />
          and extract insights instantly.
        </p>
        <button 
          onClick={handleUploadClick}
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
            boxShadow: '0 2px 4px rgba(233, 30, 99, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#c2185b'
            e.target.style.boxShadow = '0 4px 8px rgba(194, 24, 91, 0.3)'
            e.target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#e91e63'
            e.target.style.boxShadow = '0 2px 4px rgba(233, 30, 99, 0.2)'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          Upload your files to get started
        </button>
      </div>
    </div>
  )
} 