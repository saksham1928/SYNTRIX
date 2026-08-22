import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000';
const TOKEN_KEY = 'stryx_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true while we resolve the session

  // Fetch the currently-logged-in user from the backend
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setIsAuthenticated(true);
      } else {
        // Token is invalid / expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // Network error; keep token but mark unauthenticated for now
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On app mount, rehydrate auth state from token
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  /**
   * Call after a successful login to sync AuthContext immediately.
   * Accepts the user object returned by the login response.
   */
  const loginSuccess = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  /**
   * logout — clears the token and resets state.
   * The caller is responsible for navigating to /login.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}

export default AuthContext;
