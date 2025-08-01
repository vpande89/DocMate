import { useState, useEffect } from 'react'

export function ChatHistory({ onSelectChat, onClose }) {
  const [chatSessions, setChatSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [currentActiveSession, setCurrentActiveSession] = useState(null)

  // Load chat sessions from localStorage
  useEffect(() => {
    const loadSessions = () => {
      const savedSessions = localStorage.getItem('chatSessions')
      const lastActive = localStorage.getItem('lastActiveSession')
      
      if (savedSessions) {
        try {
          const sessions = JSON.parse(savedSessions)
          setChatSessions(sessions)
          setCurrentActiveSession(lastActive)
    } catch (error) {
          console.error('Error parsing chat sessions:', error)
          setChatSessions([])
        }
      } else {
        setChatSessions([])
      }
    }
    
    loadSessions()
    
    // Refresh sessions when modal opens
    const interval = setInterval(loadSessions, 1000) // Refresh every second while modal is open
    
    return () => clearInterval(interval)
  }, [])

  const deleteChat = (sessionId) => {
    const updatedSessions = chatSessions.filter(session => session.id !== sessionId)
    setChatSessions(updatedSessions)
      
    // Also remove the chat history for this session
    localStorage.removeItem(`chatHistory_${sessionId}`)
    
    // Update the sessions list in localStorage
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions))
      
    // If this was the selected session, clear selection
    if (selectedSession === sessionId) {
      setSelectedSession(null)
    }
  }

  const selectChat = (sessionId) => {
    setSelectedSession(sessionId)
    onSelectChat(sessionId)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPreviewMessage = (messages) => {
    if (!messages || messages.length === 0) return 'No messages'
    
    // Get the last user message or bot message
    const lastMessage = messages[messages.length - 1]
    const preview = lastMessage.message.substring(0, 50)
    return preview.length === 50 ? preview + '...' : preview
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e0e0e0'
          }}>
          <h2 style={{ margin: 0, color: '#002E6E' }}>Chat History</h2>
              <button
            onClick={onClose}
                style={{
              background: 'none',
                  border: 'none',
              fontSize: '24px',
                  cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Chat Sessions List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0'
        }}>
          {chatSessions.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p>No chat history yet</p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Start a conversation to see it here
              </p>
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                  key={session.id}
                style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                    backgroundColor: selectedSession === session.id ? '#f0f8ff' : 
                                   currentActiveSession === session.id ? '#e8f5e8' : 'white',
                    borderLeft: currentActiveSession === session.id ? '4px solid #28a745' : 'none',
                    transition: 'background-color 0.2s'
                }}
                  onClick={() => selectChat(session.id)}
                onMouseEnter={(e) => {
                  if (selectedSession !== session.id) {
                    e.target.style.backgroundColor = '#f8f9fa'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSession !== session.id) {
                    e.target.style.backgroundColor = 'white'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    flex: 1,
                    marginRight: '12px'
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#002E6E',
                      marginBottom: '4px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {session.title || 'Chat Session'}
                      {currentActiveSession === session.id && (
                        <span style={{
                          fontSize: '12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '14px',
                      lineHeight: '1.4'
                  }}>
                      {getPreviewMessage(session.messages)}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {formatTimestamp(session.timestamp)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                        deleteChat(session.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff4757',
                      cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px',
                        borderRadius: '4px'
                    }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fff5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                      🗑️
                  </button>
                </div>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999'
                }}>
                  {session.messages?.length || 0} messages
                </div>
              </div>
            ))
          )}
      </div>

        {/* Footer */}
      <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
          <div style={{
            fontSize: '14px',
            color: '#666'
          }}>
            {chatSessions.length} chat{chatSessions.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#002E6E',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 