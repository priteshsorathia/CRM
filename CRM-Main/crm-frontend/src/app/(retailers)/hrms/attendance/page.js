// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { useSidebar } from '@/app/context/SidebarContext';
// import { toast } from 'sonner';
// import { CalendarCheck, ArrowLeft } from 'lucide-react';
// import DateSelector from './components/DateSelector';
// import AttendanceTable from './components/AttendanceTable';

// // Mock data generator - returns different data based on date
// const generateMockAttendance = (date) => {
//   const isToday = date === new Date().toISOString().split('T')[0];
//   const isWeekend = [0, 6].includes(new Date(date).getDay());
  
//   return [
//     {
//       emp_id: 101,
//       full_name: 'John Doe',
//       check_in: isToday ? '09:00:00' : (isWeekend ? null : '08:45:00'),
//       check_out: isToday ? null : (isWeekend ? null : '17:30:00'),
//       status: isWeekend ? 'absent' : 'present',
//       note: isToday ? 'Currently working' : (isWeekend ? 'Weekend' : 'Full day')
//     },
//     {
//       emp_id: 102,
//       full_name: 'Jane Smith',
//       check_in: isToday ? '10:15:00' : (isWeekend ? null : '09:30:00'),
//       check_out: isToday ? null : (isWeekend ? null : '18:00:00'),
//       status: isWeekend ? 'absent' : 'present',
//       note: isToday ? 'Late arrival' : (isWeekend ? 'Weekend' : 'Overtime')
//     },
//     {
//       emp_id: 103,
//       full_name: 'Mike Johnson',
//       check_in: isToday ? null : (isWeekend ? null : null),
//       check_out: null,
//       status: isWeekend ? 'absent' : (isToday ? 'pending' : 'absent'),
//       note: isToday ? 'Not checked in yet' : (isWeekend ? 'Weekend' : 'Absent')
//     }
//   ];
// };

// export default function AttendancePage() {
//   const { collapsed, mobileOpen } = useSidebar();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [loading, setLoading] = useState(true);
//   const [attendance, setAttendance] = useState([]);

//   // Get selected date or default to today
//   const today = new Date().toISOString().split('T')[0];
//   const selectedDate = searchParams.get('date') || today;
//   const isToday = selectedDate === today;
//   const displayDate = new Date(selectedDate).toLocaleDateString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });

//   // Fetch attendance data when date changes
//   useEffect(() => {
//     setLoading(true);
//     const fetchData = async () => {
//       try {
//         // Simulate API call with 500ms delay
//         await new Promise(resolve => setTimeout(resolve, 500));
//         const data = generateMockAttendance(selectedDate);
//         setAttendance(data);
//       } catch (error) {
//         toast.error('Failed to load attendance data');
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchData();
//   }, [selectedDate]);

//   const handleDateChange = (newDate) => {
//     router.push(`/hrms/attendance?date=${newDate}`);
//   };

//   const handleCheckIn = async (empId) => {
//     setLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 500));
//       setAttendance(prev => prev.map(record => 
//         record.emp_id === empId 
//           ? { ...record, check_in: new Date().toLocaleTimeString('en-US', { hour12: false }), status: 'present' }
//           : record
//       ));
//       toast.success('Checked in successfully');
//     } catch (error) {
//       toast.error('Failed to check in');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCheckOut = async (empId) => {
//     setLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 500));
//       setAttendance(prev => prev.map(record => 
//         record.emp_id === empId 
//           ? { ...record, check_out: new Date().toLocaleTimeString('en-US', { hour12: false }), status: 'present' }
//           : record
//       ));
//       toast.success('Checked out successfully');
//     } catch (error) {
//       toast.error('Failed to check out');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={`p-4 sm:p-6 transition-all duration-300 ${
//       mobileOpen ? "translate-x-[250px]" : "translate-x-0"
//     } ${
//       collapsed ? "md:ml-[70px]" : "md:ml-[250px]"
//     }`}>
//       {/* Header */}
//       <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//               <CalendarCheck className="w-5 h-5 text-blue-600" />
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
//               <p className="text-sm text-gray-500">View and manage employee attendance</p>
//             </div>
//           </div>
          
//           <DateSelector 
//             selectedDate={selectedDate} 
//             isToday={isToday} 
//             onDateChange={handleDateChange}
//             maxDate={today}
//           />
//         </div>
//       </div>

//       {/* Content */}
//       <div className="space-y-4">
//         <div className="bg-white p-4 rounded-lg shadow-sm">
//           <h2 className="text-lg font-semibold text-gray-800">
//             Attendance for {displayDate}
//           </h2>
//           <p className="text-sm text-gray-500 mb-4">
//             {isToday ? "Today's live attendance" : "Past attendance records"}
//           </p>
          
//           <AttendanceTable 
//             attendance={attendance}
//             isToday={isToday}
//             loading={loading}
//             onCheckIn={handleCheckIn}
//             onCheckOut={handleCheckOut}
//             selectedDate={selectedDate}
//           />
//         </div>

//         <div className="flex justify-start">
//           <button 
//             onClick={() => router.push('/hrms')}
//             className="btn btn-secondary flex items-center gap-2"
//           >
//             <ArrowLeft className="h-4 w-4" /> Back to HR Dashboard
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import AttendanceClient from './components/AttendanceClient';

export default function AttendancePage({ searchParams }) {
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = searchParams.date || today;

  return (
    <AttendanceClient selectedDate={selectedDate} />
  );
}
