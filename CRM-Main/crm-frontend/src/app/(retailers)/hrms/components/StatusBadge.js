export default function StatusBadge({ status, paymentDate }) {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-1">
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusStyles[status] || statusStyles.pending}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
      {status === 'paid' && paymentDate && (
        <div className="text-xs text-gray-500 whitespace-nowrap">
          Paid: {formatDate(paymentDate)}
        </div>
      )}
    </div>
  );
}