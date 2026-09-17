// src/context/AuthContext.js
'use client';
import { createContext, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Mock user data - modify with your actual user structure
  const currentUser = {
    id: 'EMP001',
    emp_id: 'EMP001',
    full_name: 'Admin User',
    email: 'admin@crm.com',
    username: 'admin',
    phone: '+1234567890',
    role: 'Administrator',
    salary: 75000,
    join_date: '2023-01-01',
    status: 'active',
    user_role: 'admin',
    last_login: new Date().toISOString()
  };

  return (
    <AuthContext.Provider value={{ user: currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


// -------------------------------------------
// import { createContext, useContext, useState } from 'react';

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null); // { email: 'admin@...', role: 'admin' }

//   const login = (userData) => {
//     setUser({
//       email: userData.email,
//       role: userData.role || 'staff' // Default role
//     });
//     localStorage.setItem('authToken', userData.token);
//   };

//   const value = { user, login, logout: () => setUser(null) };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export const useAuth = () => useContext(AuthContext);