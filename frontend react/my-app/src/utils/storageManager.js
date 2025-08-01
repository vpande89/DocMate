// Storage management utilities for chat history

const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit
const MAX_SESSIONS = 50; // Maximum number of chat sessions

export const StorageManager = {
  // Get current storage usage
  getStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  },

  // Check if we can store more data
  canStoreData(dataSize) {
    const currentUsage = this.getStorageUsage();
    return (currentUsage + dataSize) < MAX_STORAGE_SIZE;
  },

  // Clean up old sessions if storage is getting full
  cleanupOldSessions() {
    try {
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      
      if (sessions.length > MAX_SESSIONS) {
        // Remove oldest sessions
        const sessionsToRemove = sessions.slice(MAX_SESSIONS);
        sessionsToRemove.forEach(session => {
          localStorage.removeItem(`chatHistory_${session.id}`);
        });
        
        // Keep only the most recent sessions
        const limitedSessions = sessions.slice(0, MAX_SESSIONS);
        localStorage.setItem('chatSessions', JSON.stringify(limitedSessions));
        
        console.log(`Cleaned up ${sessionsToRemove.length} old chat sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  },

  // Save chat session with size checking
  saveChatSession(sessionId, messages) {
    try {
      const data = JSON.stringify(messages);
      const dataSize = data.length;
      
      if (!this.canStoreData(dataSize)) {
        this.cleanupOldSessions();
        
        // If still can't store, remove oldest session
        if (!this.canStoreData(dataSize)) {
          const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
          if (sessions.length > 0) {
            const oldestSession = sessions[sessions.length - 1];
            localStorage.removeItem(`chatHistory_${oldestSession.id}`);
            sessions.pop();
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
          }
        }
      }
      
      localStorage.setItem(`chatHistory_${sessionId}`, data);
      return true;
    } catch (error) {
      console.error('Error saving chat session:', error);
      return false;
    }
  },

  // Get storage info
  getStorageInfo() {
    const usage = this.getStorageUsage();
    const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    
    return {
      currentUsage: usage,
      maxSize: MAX_STORAGE_SIZE,
      usagePercentage: (usage / MAX_STORAGE_SIZE) * 100,
      sessionCount: sessions.length,
      maxSessions: MAX_SESSIONS
    };
  },

  // Clear all chat data
  clearAllChatData() {
    try {
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      sessions.forEach(session => {
        localStorage.removeItem(`chatHistory_${session.id}`);
      });
      localStorage.removeItem('chatSessions');
      return true;
    } catch (error) {
      console.error('Error clearing chat data:', error);
      return false;
    }
  }
}; 