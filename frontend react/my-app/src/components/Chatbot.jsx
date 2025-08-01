import { useState, useEffect, useRef } from 'react'
import { ChatHistory } from './ChatHistory.jsx'
import { StorageInfo } from './StorageInfo.jsx'
import { StorageManager } from '../utils/storageManager.js'

export function Chatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showStorageInfo, setShowStorageInfo] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const messagesEndRef = useRef(null)

  // Initialize session on mount
  useEffect(() => {
    if (!currentSessionId) {
      // Start with a fresh new chat session by default
      const newSessionId = Date.now().toString()
      setCurrentSessionId(newSessionId)
      setMessages([])
    }
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      const savedMessages = localStorage.getItem(`chatHistory_${currentSessionId}`)
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      } else {
        setMessages([])
      }
    }
  }, [currentSessionId])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      // Save messages to localStorage
      localStorage.setItem(`chatHistory_${currentSessionId}`, JSON.stringify(messages))
      
      // Save as last active session
      localStorage.setItem('lastActiveSession', currentSessionId)
      
      // Update chat sessions list
      const savedSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]')
      const existingSessionIndex = savedSessions.findIndex(session => session.id === currentSessionId)
      
      const sessionData = {
        id: currentSessionId,
        title: messages[0]?.message?.substring(0, 30) + (messages[0]?.message?.length > 30 ? '...' : ''),
        messages: messages,
        timestamp: new Date().toISOString()
      }
      
      if (existingSessionIndex >= 0) {
        savedSessions[existingSessionIndex] = sessionData
      } else {
        savedSessions.unshift(sessionData) // Add to beginning
      }
      
      // Use StorageManager to limit sessions
      StorageManager.cleanupOldSessions()
      localStorage.setItem('chatSessions', JSON.stringify(savedSessions))
    }
  }, [messages, currentSessionId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      message: input.trim(),
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        const botMessage = {
          role: 'bot',
          message: data.response,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        const errorMessage = {
          role: 'bot',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage = {
        role: 'bot',
        message: 'Network error. Please check your connection.',
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }



  const selectChatSession = (sessionId) => {
    setCurrentSessionId(sessionId)
    // Save as last active session
    localStorage.setItem('lastActiveSession', sessionId)
    setShowChatHistory(false)
  }

  const newChat = () => {
    const newSessionId = Date.now().toString()
    setCurrentSessionId(newSessionId)
    setMessages([])
    // Save as last active session
    localStorage.setItem('lastActiveSession', newSessionId)
  }

  const openChatHistory = () => {
    setShowChatHistory(true)
  }

  const openStorageInfo = () => {
    setShowStorageInfo(true)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatBotMessage = (message) => {
    // Split message into lines
    const lines = message.split('\n')
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim()
      
      // Check for headings (lines that end with colon and are followed by content)
      if (trimmedLine.endsWith(':') && trimmedLine.length > 3) {
        return (
          <div key={index} style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#2d1b4e',
            marginBottom: '8px',
            marginTop: index > 0 ? '12px' : '0',
            borderBottom: '2px solid #f3e5f5',
            paddingBottom: '4px'
          }}>
            {trimmedLine}
          </div>
        )
      }
      
      // Check for bullet points (lines starting with -, *, or •)
      if (trimmedLine.match(/^[-*•]\s+/)) {
        return (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '6px',
            paddingLeft: '8px'
          }}>
            <span style={{
              color: '#e91e63',
              fontSize: '16px',
              marginRight: '8px',
              fontWeight: 'bold'
            }}>•</span>
            <span style={{ flex: 1 }}>{trimmedLine.replace(/^[-*•]\s+/, '')}</span>
          </div>
        )
      }
      
      // Check for numbered lists (lines starting with numbers)
      if (trimmedLine.match(/^\d+\.\s+/)) {
        return (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '6px',
            paddingLeft: '8px'
          }}>
            <span style={{
              color: '#2d1b4e',
              fontSize: '14px',
              marginRight: '8px',
              fontWeight: 'bold',
              minWidth: '20px'
            }}>{trimmedLine.match(/^\d+/)[0]}.</span>
            <span style={{ flex: 1 }}>{trimmedLine.replace(/^\d+\.\s+/, '')}</span>
          </div>
        )
      }
      
      // Check for emphasis (text wrapped in ** or __)
      if (trimmedLine.includes('**') || trimmedLine.includes('__')) {
        const formattedLine = trimmedLine
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.*?)__/g, '<strong>$1</strong>')
        
        return (
          <div key={index} style={{
            marginBottom: '8px',
            lineHeight: '1.6'
          }} dangerouslySetInnerHTML={{ __html: formattedLine }} />
        )
      }
      
      // Regular paragraph
      if (trimmedLine) {
        return (
          <div key={index} style={{
            marginBottom: '8px',
            lineHeight: '1.6'
          }}>
            {trimmedLine}
          </div>
        )
      }
      
      // Empty line
      return <div key={index} style={{ height: '8px' }} />
    })
  }

  return (
    <div style={{
      marginLeft: '300px',
      marginTop: '80px',
      height: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fce4ec',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h2 style={{ margin: 0, color: '#2d1b4e' }}>Chat</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={newChat}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e91e63',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c2185b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#e91e63'}
          >
            New Chat
          </button>
          <button
            onClick={openChatHistory}
            style={{
              padding: '8px 16px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7b1fa2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#9c27b0'}
          >
            Chat History
          </button>
          <button
            onClick={openStorageInfo}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ad1457',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#880e4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ad1457'}
          >
            Storage
          </button>

        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderRadius: '18px',
              backgroundColor: msg.role === 'user' ? '#2d1b4e' : '#ffffff',
              color: msg.role === 'user' ? 'white' : '#333',
              wordWrap: 'break-word',
              maxWidth: '100%',
              boxShadow: msg.role === 'bot' ? '0 4px 12px rgba(45, 27, 78, 0.15)' : 'none',
              border: msg.role === 'bot' ? '1px solid #f3e5f5' : 'none',
              lineHeight: '1.6'
            }}>
              {msg.role === 'bot' ? (
                <div style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px'
                }}>
                  {formatBotMessage(msg.message)}
                </div>
              ) : (
                msg.message
              )}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '4px',
              padding: '0 4px'
            }}>
              {msg.timestamp}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: '70%'
          }}>
            <div style={{
              padding: '16px 20px',
              borderRadius: '18px',
              backgroundColor: '#ffffff',
              color: '#666',
              fontStyle: 'italic',
              boxShadow: '0 4px 12px rgba(45, 27, 78, 0.15)',
              border: '1px solid #f3e5f5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e91e63',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '20px',
        backgroundColor: 'white',
        borderTop: '1px solid #e0e0e0'
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '14px',
            minHeight: '44px',
            maxHeight: '120px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: input.trim() && !isLoading ? '#2d1b4e' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Send
        </button>
      </div>
      
      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Chat History Modal */}
      {showChatHistory && (
        <ChatHistory
          onSelectChat={selectChatSession}
          onClose={() => setShowChatHistory(false)}
        />
      )}

      {/* Storage Info Modal */}
      {showStorageInfo && (
        <StorageInfo
          onClose={() => setShowStorageInfo(false)}
        />
      )}
    </div>
  )
} 