export default function StatusBadge({ status }) {
  if (!status) return null;
  const statusText = status
    .replace(/_/g, ' ')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  
  const getStatusClasses = () => {
    switch(status.toLowerCase()) {
      case 'present':
        return 'bg-green-600 text-white';
      case 'absent':
        return 'bg-red-600 text-white';
      case 'late':
        return 'bg-yellow-500 text-white';
      case 'half_day':
      case 'half day':
        return 'bg-blue-600 text-white';
      case 'leave':
        return 'bg-purple-600 text-white';
      case 'weekend':
        return 'bg-gray-800 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses()}`}>
      {statusText}
    </span>
  );
}
