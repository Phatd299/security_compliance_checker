import { useState, useEffect } from 'react'

const TOKEN_KEY = 'auth_tokens'
const USERNAME_KEY = 'username'
const ROLE_KEY = 'user_role'

export const useAuth = () => {
  const [tokens, setTokensState] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USERNAME_KEY)
      localStorage.removeItem(ROLE_KEY)
    }
  }, [tokens])

  const setAuthTokens = (newTokens) => {
    setTokensState(newTokens)
    // Extract username and role from idToken (basic implementation)
    // In production, you should decode the JWT properly
    if (newTokens.idToken) {
      try {
        const payload = JSON.parse(atob(newTokens.idToken.split('.')[1]))
        localStorage.setItem(USERNAME_KEY, payload['cognito:username'] || payload.sub || 'User')
        
        // Extract role from token
        // Check common locations: cognito:groups, custom:role, role, or groups
        let role = 'Standard' // Default role
        if (payload['cognito:groups'] && Array.isArray(payload['cognito:groups'])) {
          // If user is in admin group, set role to Admin
          if (payload['cognito:groups'].includes('Admin') || payload['cognito:groups'].includes('admin')) {
            role = 'Admin'
          }
        } else if (payload['custom:role']) {
          role = payload['custom:role']
        } else if (payload.role) {
          role = payload.role
        } else if (payload.groups && Array.isArray(payload.groups)) {
          if (payload.groups.includes('Admin') || payload.groups.includes('admin')) {
            role = 'Admin'
          }
        }
        
        // Normalize role to Standard or Admin
        role = (role === 'Admin' || role === 'admin') ? 'Admin' : 'Standard'
        localStorage.setItem(ROLE_KEY, role)
      } catch (e) {
        console.error('Error decoding token:', e)
        localStorage.setItem(ROLE_KEY, 'Standard') // Default on error
      }
    }
  }

  const logout = () => {
    setTokensState(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(ROLE_KEY)
  }

  const isAuthenticated = () => {
    return tokens !== null && tokens.accessToken !== undefined
  }

  const getAccessToken = () => {
    return tokens?.accessToken
  }

  const getIdToken = () => {
    return tokens?.idToken
  }

  const getUsername = () => {
    return localStorage.getItem(USERNAME_KEY) || 'User'
  }

  const getRole = () => {
    return localStorage.getItem(ROLE_KEY) || 'Standard'
  }

  return {
    tokens,
    setAuthTokens,
    logout,
    isAuthenticated,
    getAccessToken,
    getIdToken,
    getUsername,
    getRole,
  }
}

