import EditAttendanceClient from './components/EditAttendanceClient';

export default function EditAttendancePage({ searchParams }) {
  const emp_id = searchParams.emp_id || null;
  const date = searchParams.date || null;

  // Validate parameters
  if (!emp_id || !date) {
    console.error('Missing required parameters:', { emp_id, date });
    // You might want to redirect or show an error
  }

  return (
    <EditAttendanceClient 
      emp_id={emp_id} 
      date={date} 
    />
  );
}
