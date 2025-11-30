import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated() ? <Login /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

