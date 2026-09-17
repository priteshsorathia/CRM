// ─── Employee List ───
export const employeesData = [
    { id: 'EMP-001', name: 'John Matthews', department: 'Engineering', designation: 'Senior Developer', manager: 'Alice Wong', phone: '+91 98765 43210', salary: 85000, type: 'Full-Time', status: 'Active' },
    { id: 'EMP-002', name: 'Sarah Jenkins', department: 'Design', designation: 'UI/UX Lead', manager: 'Bob Chen', phone: '+91 97654 32109', salary: 72000, type: 'Full-Time', status: 'Active' },
    { id: 'EMP-003', name: 'Michael Ross', department: 'Engineering', designation: 'Backend Developer', manager: 'Alice Wong', phone: '+91 96543 21098', salary: 78000, type: 'Contract', status: 'Probation' },
    { id: 'EMP-004', name: 'Emily Chen', department: 'Marketing', designation: 'Marketing Manager', manager: 'CEO', phone: '+91 95432 10987', salary: 90000, type: 'Full-Time', status: 'Active' },
    { id: 'EMP-005', name: 'Ravi Kumar', department: 'HR', designation: 'HR Executive', manager: 'Emily Chen', phone: '+91 94321 09876', salary: 55000, type: 'Full-Time', status: 'On Leave' },
    { id: 'EMP-006', name: 'Priya Sharma', department: 'Finance', designation: 'Accountant', manager: 'CFO', phone: '+91 93210 98765', salary: 65000, type: 'Full-Time', status: 'Active' },
    { id: 'EMP-007', name: 'James Wilson', department: 'Sales', designation: 'Sales Executive', manager: 'Emily Chen', phone: '+91 92109 87654', salary: 60000, type: 'Part-Time', status: 'Resigned' },
    { id: 'EMP-008', name: 'Ananya Patel', department: 'Engineering', designation: 'Junior Developer', manager: 'Alice Wong', phone: '+91 91098 76543', salary: 48000, type: 'Full-Time', status: 'Active' },
];

export const employeeStats = {
    total: 64,
    active: 52,
    onLeave: 5,
    probation: 4,
    resigned: 3,
    newJoiners: 7,
};

export const departments = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Sales'];

// ─── Attendance ───
export const attendanceData = [
    { id: 1, employee: 'John Matthews', checkIn: '09:02 AM', checkOut: '06:15 PM', hours: '9h 13m', status: 'Present', late: false, overtime: '1h 15m' },
    { id: 2, employee: 'Sarah Jenkins', checkIn: '09:45 AM', checkOut: '06:00 PM', hours: '8h 15m', status: 'Present', late: true, overtime: '—' },
    { id: 3, employee: 'Michael Ross', checkIn: '—', checkOut: '—', hours: '—', status: 'Absent', late: false, overtime: '—' },
    { id: 4, employee: 'Emily Chen', checkIn: '08:55 AM', checkOut: '01:00 PM', hours: '4h 05m', status: 'Half Day', late: false, overtime: '—' },
    { id: 5, employee: 'Ravi Kumar', checkIn: '—', checkOut: '—', hours: '—', status: 'Leave', late: false, overtime: '—' },
    { id: 6, employee: 'Priya Sharma', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m', status: 'Present', late: false, overtime: '—' },
];

// ─── Leave Requests ───
export const leaveRequests = [
    { id: 1, employee: 'Sarah Jenkins', type: 'Casual Leave', from: '2024-03-10', to: '2024-03-11', days: 2, reason: 'Personal work', status: 'Pending' },
    { id: 2, employee: 'Ravi Kumar', type: 'Sick Leave', from: '2024-03-05', to: '2024-03-07', days: 3, reason: 'Fever', status: 'Approved' },
    { id: 3, employee: 'James Wilson', type: 'Annual Leave', from: '2024-03-15', to: '2024-03-19', days: 5, reason: 'Vacation', status: 'Rejected' },
];

export const leaveBalance = [
    { type: 'Casual Leave', total: 12, used: 4, remaining: 8 },
    { type: 'Sick Leave', total: 10, used: 3, remaining: 7 },
    { type: 'Annual Leave', total: 21, used: 10, remaining: 11 },
    { type: 'Maternity Leave', total: 90, used: 0, remaining: 90 },
];

export const holidays = [
    { date: '2024-01-26', name: 'Republic Day', type: 'National' },
    { date: '2024-03-25', name: 'Holi', type: 'Festival' },
    { date: '2024-04-14', name: 'Ambedkar Jayanti', type: 'National' },
    { date: '2024-08-15', name: 'Independence Day', type: 'National' },
    { date: '2024-10-02', name: 'Gandhi Jayanti', type: 'National' },
    { date: '2024-11-01', name: 'Diwali', type: 'Festival' },
    { date: '2024-12-25', name: 'Christmas', type: 'National' },
];
