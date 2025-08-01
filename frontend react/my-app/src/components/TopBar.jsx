export function TopBar() {
  return (
    <div style={{ 
      backgroundColor: '#2d1b4e', 
      padding: '15px 20px', 
      display: 'flex', 
      alignItems: 'center',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(45, 27, 78, 0.3)'
    }}>
      <i className="bi bi-robot" style={{ 
        fontSize: '24px', 
        marginRight: '10px',
        color: '#e91e63'
      }}></i>
      <span style={{ 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: '20px' 
      }}>
        DocMate
      </span>
    </div>
  )
} 