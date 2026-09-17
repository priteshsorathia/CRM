import AttendanceClient from "./components/AttendanceClient";

export default function ServicesHrmsAttendancePage({ searchParams }) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const from = String(searchParams?.from || today);
  const to = String(searchParams?.to || today);
  const q = String(searchParams?.q || "");

  return <AttendanceClient initialFrom={from} initialTo={to} initialSearch={q} />;
}
