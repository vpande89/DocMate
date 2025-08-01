import { useState, useEffect } from 'react'
import { StorageManager } from '../utils/storageManager.js'

export function StorageInfo({ onClose }) {
  const [storageInfo, setStorageInfo] = useState(null)

  useEffect(() => {
    setStorageInfo(StorageManager.getStorageInfo())
  }, [])

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      StorageManager.clearAllChatData()
      setStorageInfo(StorageManager.getStorageInfo())
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!storageInfo) return null

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
        maxWidth: '500px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#002E6E' }}>Storage Information</h2>
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

        {/* Storage Usage */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Storage Usage</h3>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#666' }}>Used:</span>
              <span style={{ fontWeight: 'bold' }}>{formatBytes(storageInfo.currentUsage)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#666' }}>Available:</span>
              <span style={{ fontWeight: 'bold' }}>{formatBytes(storageInfo.maxSize)}</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
              marginTop: '8px'
            }}>
              <div style={{
                width: `${Math.min(storageInfo.usagePercentage, 100)}%`,
                height: '100%',
                backgroundColor: storageInfo.usagePercentage > 80 ? '#ff4757' : 
                               storageInfo.usagePercentage > 60 ? '#ffa502' : '#00B9F1',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#666',
              marginTop: '4px'
            }}>
              {storageInfo.usagePercentage.toFixed(1)}% used
            </div>
          </div>
        </div>

        {/* Chat Sessions */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Chat Sessions</h3>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#666' }}>Active sessions:</span>
              <span style={{ fontWeight: 'bold' }}>
                {storageInfo.sessionCount} / {storageInfo.maxSessions}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={clearAllData}
            style={{
              padding: '10px 16px',
              backgroundColor: '#ff4757',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#ff3742'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ff4757'}
          >
            Clear All Data
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
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