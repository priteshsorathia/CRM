// ─── Project Stats ───
export const projectStats = {
    total: 45, active: 18, completed: 21, onHold: 4, overdue: 2,
};

// ─── Projects ───
export const initialProjects = [
    { id: 'PRJ-1001', name: 'ERP System Migration', client: 'Acme Corp', manager: 'Alice Wong', team: 6, start: '2024-01-10', end: '2024-06-30', budget: 850000, status: 'Active' },
    { id: 'PRJ-1002', name: 'E-Commerce Platform', client: 'BrightStar Inc', manager: 'John Matthews', team: 4, start: '2023-11-01', end: '2024-03-31', budget: 420000, status: 'Completed' },
    { id: 'PRJ-1003', name: 'Network Infrastructure', client: 'GlobalEdge Ltd', manager: 'Sarah Jenkins', team: 3, start: '2024-02-01', end: '2024-05-15', budget: 310000, status: 'On Hold' },
    { id: 'PRJ-1004', name: 'Mobile App Development', client: 'TechNova Solutions', manager: 'Ravi Kumar', team: 5, start: '2023-09-01', end: '2024-02-28', budget: 560000, status: 'Overdue' },
    { id: 'PRJ-1005', name: 'Cloud Security Audit', client: 'CloudBase Pvt Ltd', manager: 'Emily Chen', team: 2, start: '2024-03-01', end: '2024-04-30', budget: 150000, status: 'Active' },
    { id: 'PRJ-1006', name: 'CRM Implementation', client: 'Delta Dynamics', manager: 'Alice Wong', team: 4, start: '2024-02-15', end: '2024-07-31', budget: 620000, status: 'Active' },
];

// ─── Team Members ───
export const teamMembers = ['John Matthews', 'Sarah Jenkins', 'Emily Chen', 'Ravi Kumar', 'Priya Sharma', 'Michael Ross', 'Ananya Patel', 'Alice Wong'];

// ─── Tasks ───
export const initialTasks = [
    { id: 'TSK-001', title: 'Design system architecture', assignee: 'John Matthews', priority: 'High', deadline: '2024-03-20', project: 'ERP System Migration', column: 'In Progress', comments: 3, attachments: 2 },
    { id: 'TSK-002', title: 'Database schema planning', assignee: 'Alice Wong', priority: 'High', deadline: '2024-03-18', project: 'ERP System Migration', column: 'Pending', comments: 1, attachments: 0 },
    { id: 'TSK-003', title: 'UI wireframes review', assignee: 'Sarah Jenkins', priority: 'Medium', deadline: '2024-03-22', project: 'E-Commerce Platform', column: 'Completed', comments: 5, attachments: 3 },
    { id: 'TSK-004', title: 'API integration testing', assignee: 'Michael Ross', priority: 'Medium', deadline: '2024-03-25', project: 'Mobile App Development', column: 'In Progress', comments: 2, attachments: 1 },
    { id: 'TSK-005', title: 'Security vulnerability scan', assignee: 'Emily Chen', priority: 'Critical', deadline: '2024-03-15', project: 'Cloud Security Audit', column: 'Pending', comments: 0, attachments: 0 },
    { id: 'TSK-006', title: 'Network topology documentation', assignee: 'Ravi Kumar', priority: 'Low', deadline: '2024-04-10', project: 'Network Infrastructure', column: 'On Hold', comments: 1, attachments: 4 },
    { id: 'TSK-007', title: 'User acceptance testing', assignee: 'Ananya Patel', priority: 'High', deadline: '2024-03-28', project: 'CRM Implementation', column: 'Pending', comments: 2, attachments: 0 },
    { id: 'TSK-008', title: 'Deployment pipeline setup', assignee: 'John Matthews', priority: 'Medium', deadline: '2024-04-01', project: 'ERP System Migration', column: 'Completed', comments: 4, attachments: 2 },
];

// ─── Timesheets ───
export const timesheetData = [
    { id: 1, date: '2024-03-11', project: 'ERP System Migration', task: 'Architecture planning', hours: 8, billable: true, status: 'Approved' },
    { id: 2, date: '2024-03-11', project: 'Cloud Security Audit', task: 'Vulnerability assessment', hours: 4, billable: true, status: 'Approved' },
    { id: 3, date: '2024-03-12', project: 'CRM Implementation', task: 'Requirement gathering', hours: 6, billable: true, status: 'Pending' },
    { id: 4, date: '2024-03-12', project: 'Mobile App Development', task: 'API integration', hours: 7.5, billable: false, status: 'Pending' },
    { id: 5, date: '2024-03-13', project: 'E-Commerce Platform', task: 'Bug fixes and testing', hours: 5, billable: true, status: 'Rejected' },
    { id: 6, date: '2024-03-14', project: 'ERP System Migration', task: 'DB schema design', hours: 8, billable: true, status: 'Approved' },
    { id: 7, date: '2024-03-15', project: 'Network Infrastructure', task: 'Network audit report', hours: 3, billable: false, status: 'Pending' },
];
