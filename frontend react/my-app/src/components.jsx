export function Topbar() {
  return (
    <div style={{ 
      backgroundColor: '#333', 
      padding: '15px 20px', 
      display: 'flex', 
      alignItems: 'center',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000
    }}>
      <span style={{ fontSize: '24px', marginRight: '10px' }}>🤖</span>
      <span style={{ 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: '20px' 
      }}>
        Project Bot
      </span>
    </div>
  )
}

export function SidePanel() {
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: '50px',
      width: '300px',
      height: 'calc(100vh - 50px)',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '20px'
    }}>
      <h3>Upload File</h3>
      <label style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'transform 0.2s ease',
        ':hover': {
          transform: 'scale(1.1)'
        }
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.1)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)'
      }}
      >
        Choose your docx file
        <input 
          type="file" 
          accept=".docx"
          style={{ display: 'none' }}
        />
      </label>
    </div>
  )
} 