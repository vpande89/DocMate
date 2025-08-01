import { useState } from 'react'
import './App.css'
import { TopBar } from './components/TopBar.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { WelcomePage } from './components/WelcomePage.jsx'
import { MyFiles } from './components/MyFiles.jsx'
import { Upload } from './components/Upload.jsx'
import { Chatbot } from './components/Chatbot.jsx'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <WelcomePage setCurrentPage={setCurrentPage} />
          case 'dashboard':
      return <MyFiles setCurrentPage={setCurrentPage} />
      case 'upload':
        return <Upload />
      case 'chatbot':
        return <Chatbot />
      default:
        return <WelcomePage setCurrentPage={setCurrentPage} />
    }
  }

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <TopBar />
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
      </div>
  )
}

export default App
