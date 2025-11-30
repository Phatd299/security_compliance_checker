// API endpoint - Update this with your actual API Gateway endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-gateway-url.execute-api.region.amazonaws.com/Prod'

export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Login failed')
    }

    const data = await response.json()
    return {
      accessToken: data.accessToken,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    }
  } catch (error) {
    if (error.message) {
      throw error
    }
    throw new Error('Network error. Please check your connection and API endpoint.')
  }
}

