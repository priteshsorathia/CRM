'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ 
  fallbackUrl = '/dashboard',
  className = '',
  onClick,
  disabled = false,
  forceFallback = false
}) {
  const router = useRouter()
  
  const handleBack = (e) => {
    e.preventDefault()
    if (onClick) {
      onClick(e)
    } else if (!forceFallback && window.history?.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <button
      onClick={handleBack}
      disabled={disabled}
      type="button" // Explicitly set type to button
      className={`
        inline-flex items-center justify-center sm:justify-start gap-2
        px-6 py-2 
        bg-gray-200 text-gray-800 
        rounded-md hover:bg-gray-300 
        transition-colors 
        sm:w-auto sm:px-5 sm:text-base text-sm
        ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </button>
  )
}
// Usage Examples:
// Basic Usage:

// jsx
// <BackButton />
// With Custom Fallback:

// jsx
// <BackButton fallbackUrl="/dashboard" />
// With Additional Styling:

// jsx
// <BackButton className="text-lg px-5 py-2.5" />