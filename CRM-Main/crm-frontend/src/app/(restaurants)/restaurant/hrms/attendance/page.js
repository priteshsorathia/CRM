import AttendanceClient from './components/AttendanceClient';

export default function AttendancePage({ searchParams }) {
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = searchParams.date || today;
  const fromDate = searchParams.from || null;
  const toDate = searchParams.to || null;

  return (
    <AttendanceClient selectedDate={selectedDate} fromDate={fromDate} toDate={toDate} />
  );
}
