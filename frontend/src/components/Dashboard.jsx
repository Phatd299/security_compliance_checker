import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
  const { logout, getUsername, getRole } = useAuth()
  const navigate = useNavigate()
  const userRole = getRole()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <div className="welcome-header">
            <h2>Welcome, {getUsername() || 'User'}!</h2>
            <span className={`role-badge role-${userRole.toLowerCase()}`}>
              {userRole}
            </span>
          </div>
          <p>You have successfully logged in to the Security Compliance Checker.</p>
          <p className="role-description">
            Current role: <strong>{userRole}</strong>
            {userRole === 'Admin' 
              ? ' - You have administrative privileges' 
              : ' - You have standard user access'}
          </p>
        </div>
        
        <div className="info-section">
          <h3>Application Features</h3>
          <ul>
            <li>View and manage security evidences</li>
            <li>Track compliance findings</li>
            <li>Monitor security compliance status</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

