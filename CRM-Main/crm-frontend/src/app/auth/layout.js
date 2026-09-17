// app/auth/layout.js (or .tsx)

import './auth.css'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {children}
    </div>
  )
}
