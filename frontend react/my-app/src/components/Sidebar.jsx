import { useState } from 'react'

export function Sidebar({ currentPage, setCurrentPage }) {
  const [hoveredItem, setHoveredItem] = useState(null)
  
  const menuItems = [
    { id: 'home', label: 'Home', icon: 'bi-house' },
    { id: 'upload', label: 'Upload', icon: 'bi-file-arrow-down' },
    { id: 'dashboard', label: 'My Files', icon: 'bi-files' },
    { id: 'chatbot', label: 'Chatbot', icon: 'bi-chat-right-dots' }
  ]

  const getItemStyle = (itemId) => {
    const isActive = currentPage === itemId
    const isHovered = hoveredItem === itemId && !isActive
    
    return {
      padding: '15px 20px',
      cursor: 'pointer',
      backgroundColor: isActive ? '#e91e63' : (isHovered ? '#e91e63' : 'transparent'),
      color: isActive ? 'white' : '#f8bbd9',
      borderBottom: '1px solid rgba(233, 30, 99, 0.2)',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transform: isHovered ? 'translateX(10px)' : 'translateX(0)',
      boxShadow: isHovered ? '0 2px 8px rgba(233, 30, 99, 0.3)' : 'none',
      borderRadius: isHovered ? '5px' : '0',
      margin: isHovered ? '0 10px' : '0'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: '50px',
      width: '300px',
      height: 'calc(100vh - 50px)',
      backgroundColor: '#2d1b4e',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      boxShadow: '2px 0 8px rgba(45, 27, 78, 0.3)'
    }}>
      {/* Navigation Menu */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            style={getItemStyle(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {item.icon.startsWith('bi-') ? (
              <i className={`bi ${item.icon}`} style={{ fontSize: '18px' }}></i>
            ) : (
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
            )}
            <span style={{ 
              fontWeight: currentPage === item.id ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
} 