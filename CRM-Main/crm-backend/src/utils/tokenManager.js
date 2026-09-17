// Token management utility
class TokenManager {
  constructor() {
    this.tokenKey = 'authToken';
    this.backupTokenKey = 'token';
  }

  // Get token from storage
  getToken() {
    if (typeof window === 'undefined') return null;
    
    // Try primary key first
    let token = localStorage.getItem(this.tokenKey);
    
    // If not found, try backup key
    if (!token) {
      token = localStorage.getItem(this.backupTokenKey);
      // If found in backup, copy to primary
      if (token) {
        this.setToken(token);
      }
    }
    
    return token;
  }

  // Set token in storage
  setToken(token) {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.tokenKey, token);
    // Also set in backup for compatibility
    localStorage.setItem(this.backupTokenKey, token);
    
    console.log('🔐 Token stored in both authToken and token keys');
  }

  // Remove token from storage
  removeToken() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.backupTokenKey);
  }

  // Check if token exists
  hasToken() {
    return !!this.getToken();
  }

  // Get token for API calls
  getAuthHeaders() {
    const token = this.getToken();
    if (!token) return {};
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Test token validity
  async testToken() {
    const token = this.getToken();
    if (!token) {
      return { valid: false, error: 'No token found' };
    }

    try {
      const response = await fetch('/api/test-protected', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, data };
      } else {
        return { valid: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// Create singleton instance
const tokenManager = new TokenManager();
export default tokenManager;