// ─── Asset Stats ───
export const assetStats = {
    total: 245, available: 84, assigned: 142, maintenance: 12, retired: 7, expiring: 5,
};

// ─── Asset List ───
export const initialAssets = [
    { id: 'AST-1001', name: 'MacBook Pro M3 Max', category: 'Laptop', serialNumber: 'C02XG0001', status: 'Assigned', assignedTo: 'John Matthews', purchaseDate: '2023-11-15', cost: 320000, vendor: 'Apple', warrantyExpiry: '2025-11-15', condition: 'New' },
    { id: 'AST-1002', name: 'Dell XPS 15', category: 'Laptop', serialNumber: 'DLX159870', status: 'Available', assignedTo: null, purchaseDate: '2023-08-10', cost: 180000, vendor: 'Dell', warrantyExpiry: '2024-08-10', condition: 'Used' },
    { id: 'AST-1003', name: 'ThinkPad T14', category: 'Laptop', serialNumber: 'LNV884420', status: 'Maintenance', assignedTo: null, purchaseDate: '2022-05-20', cost: 140000, vendor: 'Lenovo', warrantyExpiry: '2025-05-20', condition: 'Damaged' },
    { id: 'AST-1004', name: 'AWS Reserved EC2', category: 'Server', serialNumber: 'AWS-EC2-X4', status: 'Assigned', assignedTo: 'DevOps Team', purchaseDate: '2024-01-10', cost: 450000, vendor: 'Amazon', warrantyExpiry: '2025-01-10', condition: 'New' },
    { id: 'AST-1005', name: 'Adobe Creative Cloud', category: 'License', serialNumber: 'ADBE-2024', status: 'Expiring', assignedTo: 'Design Studio', purchaseDate: '2023-04-01', cost: 60000, vendor: 'Adobe', warrantyExpiry: '2024-04-01', condition: 'New' },
    { id: 'AST-1006', name: 'iPhone 15 Pro', category: 'Mobile', serialNumber: 'IP15PX991', status: 'Available', assignedTo: null, purchaseDate: '2023-10-05', cost: 120000, vendor: 'Apple', warrantyExpiry: '2024-10-05', condition: 'New' },
    { id: 'AST-1007', name: 'Office 365 Business', category: 'License', serialNumber: 'MS365-B050', status: 'Assigned', assignedTo: 'All Staff', purchaseDate: '2023-01-01', cost: 35000, vendor: 'Microsoft', warrantyExpiry: '2024-01-01', condition: 'New' },
];

// ─── Warranty Alerts ───
export const warrantyAlertData = [
    { id: 1, assetName: 'Adobe Creative Cloud', assetId: 'AST-1005', type: 'Software License', expiryDate: '2024-04-01', daysLeft: 14 },
    { id: 2, assetName: 'Cisco Router ASR-900', assetId: 'AST-2030', type: 'Hardware AMC', expiryDate: '2024-04-15', daysLeft: 28 },
    { id: 3, assetName: 'Office 365 Business', assetId: 'AST-1007', type: 'Software License', expiryDate: '2024-05-10', daysLeft: 53 },
    { id: 4, assetName: 'Dell XPS 15 Warranty', assetId: 'AST-1002', type: 'Hardware Warranty', expiryDate: '2024-08-10', daysLeft: 145 },
];

// ─── Asset Logs ───
export const assetLogsData = [
    { id: 1, activity: 'Asset Returned', asset: 'Dell XPS 15', user: 'Sarah Jenkins', date: '2024-03-15', notes: 'Good condition' },
    { id: 2, activity: 'Asset Assigned', asset: 'MacBook Pro M3 Max', user: 'John Matthews', date: '2024-03-14', notes: 'Primary work device' },
    { id: 3, activity: 'Sent for Maintenance', asset: 'ThinkPad T14', user: 'IT Admin', date: '2024-03-12', notes: 'Screen repair' },
    { id: 4, activity: 'New Asset Added', asset: 'AWS Reserved EC2', user: 'IT Admin', date: '2024-01-10', notes: 'Annual subscription' },
    { id: 5, activity: 'New Asset Added', asset: 'iPhone 15 Pro', user: 'IT Admin', date: '2023-10-05', notes: 'Added to inventory' },
];

// ─── Asset History ───
export const assetHistory = {
    'AST-1002': [
        { date: '2023-08-15', action: 'Assigned', person: 'Emily Chen', notes: 'Primary laptop' },
        { date: '2024-01-10', action: 'Returned', person: 'Emily Chen', notes: 'Upgraded to Mac' },
        { date: '2024-02-01', action: 'Assigned', person: 'Sarah Jenkins', notes: 'Temp allocation' },
        { date: '2024-03-15', action: 'Returned', person: 'Sarah Jenkins', notes: 'Left company' },
    ]
};

// ─── Depreciation Chart ───
export const depreciationData = [
    { year: '2020', value: 1200000, depreciation: 0 },
    { year: '2021', value: 960000, depreciation: 240000 },
    { year: '2022', value: 768000, depreciation: 192000 },
    { year: '2023', value: 614400, depreciation: 153600 },
    { year: '2024', value: 491520, depreciation: 122880 },
];
