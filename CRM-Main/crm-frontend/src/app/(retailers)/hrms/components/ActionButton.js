export default function ActionButton({ onClick, className, title, children, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-9 h-9 rounded hover:opacity-80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}