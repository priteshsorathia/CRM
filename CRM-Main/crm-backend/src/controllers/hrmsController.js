const prisma = require('../lib/prisma');
const { hashPassword } = require('../utils/passwordUtils');
const { createLog } = require('./logController');

const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const isManagerLikeRole = (role) => {
  const r = normalizeRole(role);
  return (
    r === 'manager' ||
    r === 'admin' ||
    r === 'administrator' ||
    r === 'owner' ||
    r === 'shop_owner' ||
    r === 'restaurant_owner' ||
    r.endsWith('_owner')
  );
};

const resolveMyEmployeeId = async (req) => {
  const shopId = req.user.shopId;
  // 1. Direct link in User table
  if (req.user.employeeId) return req.user.employeeId;

  // 2. Try finding by linked user relation in prisma (though this usually requires the above)
  try {
    const linkedEmployee = await prisma.employee.findFirst({
      where: {
        shopId: parseInt(shopId),
        user: { id: req.user.id }
      },
      select: { id: true }
    });
    if (linkedEmployee) return linkedEmployee.id;
  } catch (e) {
    // ignore
  }

  // 3. Fallback: search by username or email within the same shop
  // This is crucial for managers/staff who were created manually or whose links are broken.
  const fallbackEmployee = await prisma.employee.findFirst({
    where: {
      shopId: parseInt(shopId),
      isDeleted: false,
      OR: [
        req.user.username ? { username: req.user.username } : undefined,
        req.user.email ? { email: req.user.email } : undefined
      ].filter(Boolean)
    },
    select: { id: true }
  });

  if (fallbackEmployee) {
    // Best effort: Link them now for future performance
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { employeeId: fallbackEmployee.id }
      });
    } catch (err) {
      console.error('Failed to link employee to user on the fly:', err.message);
    }
    return fallbackEmployee.id;
  }

  return null;
};

// Helper: upsert punch record by employeeId + date without relying on composite 'where' key
const upsertPunchRecord = async ({ employeeId, shopId, date, check_in, check_out }) => {
  try {
    const data = {};
    if (check_in !== undefined) data.check_in = check_in;
    if (check_out !== undefined) data.check_out = check_out;

    if (prisma.punch && typeof prisma.punch.updateMany === 'function') {
      const result = await prisma.punch.updateMany({ where: { employeeId, date }, data });
      if (result.count === 0) {
        await prisma.punch.create({ data: Object.assign({ employeeId, shopId: parseInt(shopId), date }, data) });
      }
    } else {
      // raw SQL ON CONFLICT fallback
      const checkInVal = check_in ? check_in.toISOString() : null;
      const checkOutVal = check_out ? check_out.toISOString() : null;
      await prisma.$queryRaw`
        INSERT INTO "punches" ("date","check_in","check_out","employeeId","shopId","createdAt","updatedAt")
        VALUES (${date.toISOString()}, ${checkInVal}, ${checkOutVal}, ${employeeId}, ${parseInt(shopId)}, now(), now())
        ON CONFLICT ("employeeId","date") DO UPDATE SET
          "check_in" = COALESCE(EXCLUDED."check_in", "punches"."check_in"),
          "check_out" = COALESCE(EXCLUDED."check_out", "punches"."check_out"),
          "updatedAt" = now();`;
    }
  } catch (e) {
    console.error('upsertPunchRecord error:', e.message || e);
    throw e;
  }
};

const generateEmpId = async (shopId) => {
  const parsedShopId = parseInt(shopId);

  // Get all emp_ids for this shop to find the maximum number
  const employees = await prisma.employee.findMany({
    where: { shopId: parsedShopId },
    select: { emp_id: true }
  });

  let maxNumber = 0;

  // Extract all numbers from emp_ids and find the maximum
  employees.forEach(emp => {
    if (emp.emp_id) {
      const match = emp.emp_id.match(/EMP-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });

  // Next number is maxNumber + 1 (or 1 if no employees exist)
  const nextNumber = maxNumber + 1;

  // Generate emp_id with 3-digit padding (EMP-001, EMP-002, etc.)
  const paddedCount = nextNumber.toString().padStart(3, '0');
  return `EMP-${paddedCount}`;
};

// ==========================================
// 1. STAFF MANAGEMENT
// ==========================================

// Get Next Employee ID for the shop
const getNextEmpId = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const nextEmpId = await generateEmpId(shopId);
    res.json({ success: true, nextEmpId });
  } catch (error) {
    console.error('Error generating next employee ID:', error);
    res.status(500).json({ success: false, error: 'Failed to generate next employee ID' });
  }
};

const getEmployees = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = normalizeRole(req.user.role || '');
    const userType = normalizeRole(req.user.userType || req.user.shop?.userType || '');

    const where = { shopId: parseInt(shopId), isDeleted: false };

    // Strict filtering: Only admins/managers see all staff. Everyone else only sees themselves.
    if (!isManagerLikeRole(role)) {
      const myEmployeeId = await resolveMyEmployeeId(req);
      if (!myEmployeeId) {
        return res.status(403).json({ success: false, error: 'Access denied: Employee profile not linked' });
      }
      where.id = myEmployeeId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await prisma.employee.findMany({
      where,
      include: {
        leaveRequests: {
          where: {
            status: 'approved',
            from_date: { lte: today },
            to_date: { gte: today }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Determine real-time status
    const data = employees.map(emp => {
      const isOnLeave = emp.leaveRequests && emp.leaveRequests.length > 0;
      const probationDays = parseInt(emp.probationDays || 0);
      const joinDate = new Date(emp.join_date);
      const isProbation = probationDays > 0 &&
        new Date(joinDate.getTime() + (probationDays * 24 * 60 * 60 * 1000)) > today;

      let effectiveStatus = emp.status;
      if (isOnLeave) effectiveStatus = 'on_leave';
      else if (isProbation && effectiveStatus === 'active') effectiveStatus = 'probation';

      return {
        ...emp,
        status: effectiveStatus,
        isOnLeave
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;
    const role = normalizeRole(req.user.role);

    if (!isManagerLikeRole(role)) {
      const myEmployeeId = await resolveMyEmployeeId(req);
      if (!myEmployeeId) {
        return res.status(403).json({ success: false, error: 'Access denied: Employee profile not linked' });
      }

      if (!isNaN(parseInt(id)) && parseInt(id) !== myEmployeeId) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only view your own details' });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let employee;
    // Try finding by Database ID (Int) first
    if (!isNaN(parseInt(id))) {
      employee = await prisma.employee.findFirst({
        where: { id: parseInt(id), shopId: parseInt(shopId), isDeleted: false },
        include: {
          leaveRequests: {
            where: {
              status: 'approved',
              from_date: { lte: today },
              to_date: { gte: today }
            }
          }
        }
      });
    }
    // If not found, try finding by String ID (EMP-XXX)
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { emp_id: id, shopId: parseInt(shopId), isDeleted: false },
        include: {
          leaveRequests: {
            where: {
              status: 'approved',
              from_date: { lte: today },
              to_date: { gte: today }
            }
          }
        }
      });
    }

    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    if (!isManagerLikeRole(role)) {
      const myEmployeeId = await resolveMyEmployeeId(req);
      if (employee.id !== myEmployeeId) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only view your own details' });
      }
    }

    // Determine real-time status
    const isOnLeave = employee.leaveRequests && employee.leaveRequests.length > 0;
    const probationDays = parseInt(employee.probationDays || 0);
    const joinDate = new Date(employee.join_date);
    const isProbation = probationDays > 0 &&
      new Date(joinDate.getTime() + (probationDays * 24 * 60 * 60 * 1000)) > today;

    let effectiveStatus = employee.status;
    if (isOnLeave) effectiveStatus = 'on_leave';
    else if (isProbation && effectiveStatus === 'active') effectiveStatus = 'probation';

    const data = {
      ...employee,
      status: effectiveStatus,
      isOnLeave
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const checkUserAvailability = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ success: false, error: 'Username or email is required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          username ? { username } : undefined
        ].filter(Boolean)
      }
    });

    if (existingUser) {
      if (email && existingUser.email === email) {
        return res.status(400).json({ success: false, error: 'Email already exists Please type a different Email' });
      }
      if (username && existingUser.username === username) {
        return res.status(400).json({ success: false, error: 'Username already exists Please type a different Username' });
      }
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    res.json({ success: true, message: 'Available' });
  } catch (error) {
    console.error('Error checking user availability:', error);
    res.status(500).json({ success: false, error: 'Failed to check availability' });
  }
};

const createEmployee = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: Only admins can perform this action' });
    }

    const shopId = req.user.shopId;
    const {
      full_name, email, phone, role, salary, join_date, username, password, userType,
      dob, gender, bloodGroup, address, department, reportingManager, employmentType,
      workLocation, probationDays
    } = req.body;

    const sanitizeString = (str) => {
      if (typeof str !== 'string') return '';
      return str.replace(/<[^>]*>/g, '').trim();
    };

    // 1. Sanitize text fields to prevent XSS
    const cleanName = sanitizeString(full_name);
    const cleanEmail = sanitizeString(email);
    const cleanUsername = sanitizeString(username);
    const cleanPhone = sanitizeString(phone);
    const cleanRole = sanitizeString(role);

    // 2. Validate Full Name
    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Full Name is required' });
    }
    if (cleanName.length < 2 || cleanName.length > 50) {
      return res.status(400).json({ success: false, error: 'Full Name must be between 2 and 50 characters' });
    }
    if (!/^[a-zA-Z\s.-]+$/.test(cleanName)) {
      return res.status(400).json({ success: false, error: 'Full Name can only contain letters, spaces, dots, and hyphens' });
    }

    // 3. Validate Email
    if (cleanEmail) {
      if (cleanEmail.length > 100) {
        return res.status(400).json({ success: false, error: 'Email must be at most 100 characters' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
      }
    }

    // 4. Validate Username
    if (!cleanUsername) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ success: false, error: 'Username must be between 3 and 30 characters' });
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Username can only contain alphanumeric characters, dots, hyphens, and underscores' });
    }

    // 5. Validate Password
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    if (password.length < 8 || password.length > 50) {
      return res.status(400).json({ success: false, error: 'Password must be between 8 and 50 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one number' });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one special character' });
    }

    // 6. Validate Phone Number
    if (!cleanPhone) {
      return res.status(400).json({ success: false, error: 'Phone Number is required' });
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ success: false, error: 'Phone Number must be between 10 and 15 characters' });
    }
    if (!/^\+?[\d-\s]+$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Phone Number can only contain numbers, spaces, hyphens, and a leading "+"' });
    }

    // 7. Validate Role
    if (!cleanRole) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    // 8. Validate Salary
    if (salary !== undefined && salary !== null && salary !== '') {
      const salaryNum = parseFloat(salary);
      if (isNaN(salaryNum) || salaryNum < 0) {
        return res.status(400).json({ success: false, error: 'Salary must be a positive number' });
      }
      if (salaryNum > 10000000) {
        return res.status(400).json({ success: false, error: 'Salary cannot exceed 10,000,000' });
      }
    }

    // 9. Validate Join Date
    if (!join_date) {
      return res.status(400).json({ success: false, error: 'Joining Date is required' });
    }
    const parsedJoinDate = new Date(join_date);
    if (isNaN(parsedJoinDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid Joining Date format' });
    }

    const userTypeValue = String(userType || '').trim().toLowerCase();
    const creatorUserType = String(req.userType || req.user?.userType || req.user?.shop?.userType || '').trim().toLowerCase();

    const resolvedUserType =
      userTypeValue === 'restaurants' || userTypeValue === 'retailers' || userTypeValue === 'services'
        ? userTypeValue
        : creatorUserType === 'restaurants' || creatorUserType === 'retailers' || creatorUserType === 'services'
          ? creatorUserType
          : undefined;

    const resolvedRole =
      resolvedUserType === 'restaurants' ? normalizeRole(cleanRole || 'staff') : (cleanRole || 'staff');

    // Ensure username/email are unique in users (per whole system)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          cleanEmail ? { email: cleanEmail } : undefined,
          { username: cleanUsername }
        ].filter(Boolean)
      }
    });

    if (existingUser) {
      if (cleanEmail && existingUser.email === cleanEmail) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
      if (cleanUsername && existingUser.username === cleanUsername) {
        return res.status(400).json({ success: false, error: 'Username already exists' });
      }
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const emp_id = await generateEmpId(shopId);
    const hashedPassword = await hashPassword(password);

    // Create Employee FIRST, then User (store employee primary ID in User)
    const result = await prisma.$transaction(async (tx) => {
      const newEmployee = await tx.employee.create({
        data: {
          emp_id,
          full_name: cleanName,
          email: cleanEmail || null,
          phone: cleanPhone,
          role: resolvedRole,
          username: cleanUsername,
          password: hashedPassword,
          salary: parseFloat(salary || 0),
          join_date: parsedJoinDate,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          bloodGroup: bloodGroup || null,
          address: address ? sanitizeString(address) : null,
          department: department ? sanitizeString(department) : null,
          reportingManager: reportingManager ? sanitizeString(reportingManager) : null,
          employmentType: employmentType ? sanitizeString(employmentType) : null,
          workLocation: workLocation ? sanitizeString(workLocation) : null,
          probationDays: probationDays ? parseInt(probationDays) : null,
          status: 'active',
          shopId: parseInt(shopId)
        }
      });

      const user = await tx.user.create({
        data: {
          name: cleanName,
          email: cleanEmail || `${cleanUsername}@example.com`, // fallback if email not provided
          username: cleanUsername,
          password: hashedPassword,
          role: resolvedRole,
          userType: resolvedUserType,
          shopId: parseInt(shopId),
          employeeId: newEmployee.id
        }
      });

      return { user, newEmployee };
    });

    // ✅ ACTIVITY LOG: Employee created
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'EMPLOYEE CREATE',
        `Created employee ${result.newEmployee.full_name} (${result.newEmployee.emp_id}) and login user ${result.user.username}`,
        'HRMS',
        'Success'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: result.newEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, error: 'Failed to create employee' });
  }
};

// Update Employee Details (Name, Phone, Salary, etc.)
const updateEmployee = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: Only admins can update employees' });
    }

    const { id } = req.params; // Can be DB ID (1) or String ID (EMP-001)
    const shopId = req.user.shopId;
    const {
      full_name, email, phone, role, salary, join_date, status,
      dob, gender, bloodGroup, address, department, reportingManager,
      employmentType, workLocation, probationDays
    } = req.body;

    const sanitizeString = (str) => {
      if (typeof str !== 'string') return '';
      return str.replace(/<[^>]*>/g, '').trim();
    };

    // 1. Sanitize text fields to prevent XSS
    const cleanName = sanitizeString(full_name);
    const cleanEmail = sanitizeString(email);
    const cleanPhone = sanitizeString(phone);
    const cleanRole = sanitizeString(role);
    const cleanStatus = sanitizeString(status);

    // 2. Validate Full Name
    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Full Name is required' });
    }
    if (cleanName.length < 2 || cleanName.length > 50) {
      return res.status(400).json({ success: false, error: 'Full Name must be between 2 and 50 characters' });
    }
    if (!/^[a-zA-Z\s.-]+$/.test(cleanName)) {
      return res.status(400).json({ success: false, error: 'Full Name can only contain letters, spaces, dots, and hyphens' });
    }

    // 3. Validate Email
    if (cleanEmail) {
      if (cleanEmail.length > 100) {
        return res.status(400).json({ success: false, error: 'Email must be at most 100 characters' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
      }
    }

    // 4. Validate Phone Number
    if (!cleanPhone) {
      return res.status(400).json({ success: false, error: 'Phone Number is required' });
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ success: false, error: 'Phone Number must be between 10 and 15 characters' });
    }
    if (!/^\+?[\d-\s]+$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Phone Number can only contain numbers, spaces, hyphens, and a leading "+"' });
    }

    // 5. Validate Role
    if (!cleanRole) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    // 6. Validate Salary
    if (salary !== undefined && salary !== null && salary !== '') {
      const salaryNum = parseFloat(salary);
      if (isNaN(salaryNum) || salaryNum < 0) {
        return res.status(400).json({ success: false, error: 'Salary must be a positive number' });
      }
      if (salaryNum > 10000000) {
        return res.status(400).json({ success: false, error: 'Salary cannot exceed 10,000,000' });
      }
    }

    // 7. Validate Status
    if (cleanStatus && cleanStatus !== 'active' && cleanStatus !== 'inactive') {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    // 8. Validate Join Date
    let parsedJoinDate;
    if (join_date) {
      parsedJoinDate = new Date(join_date);
      if (isNaN(parsedJoinDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid Joining Date format' });
      }
    }

    // Determine search criteria (ID vs EMP_ID)
    const whereClause = !isNaN(parseInt(id))
      ? { id: parseInt(id), shopId: parseInt(shopId) }
      : { emp_id: id, shopId: parseInt(shopId) };

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({ where: whereClause });
    if (!existingEmployee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const loggedInRole = String(req.user?.role || '').trim().toLowerCase();
    const isRestrictedRole = ['manager', 'restaurant_manager', 'staff', 'cook'].includes(loggedInRole);

    let finalEmail = cleanEmail;
    if (isRestrictedRole) {
      finalEmail = existingEmployee.email;
    }

    // Update Employee and linked User in transaction
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: existingEmployee.id },
        data: {
          full_name: cleanName,
          email: finalEmail || null,
          phone: cleanPhone,
          role: cleanRole,
          salary: parseFloat(salary || 0),
          join_date: parsedJoinDate || existingEmployee.join_date,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          bloodGroup: bloodGroup || null,
          address: address ? sanitizeString(address) : null,
          department: department ? sanitizeString(department) : null,
          reportingManager: reportingManager ? sanitizeString(reportingManager) : null,
          employmentType: employmentType ? sanitizeString(employmentType) : null,
          workLocation: workLocation ? sanitizeString(workLocation) : null,
          probationDays: probationDays ? parseInt(probationDays) : null,
          status: cleanStatus || existingEmployee.status
        }
      });

      // Find if there is a linked User record
      const linkedUser = await tx.user.findFirst({
        where: {
          OR: [
            { employeeId: existingEmployee.id },
            existingEmployee.username ? { username: existingEmployee.username } : undefined
          ].filter(Boolean)
        }
      });

      if (linkedUser) {
        await tx.user.update({
          where: { id: linkedUser.id },
          data: {
            name: cleanName,
            email: finalEmail || linkedUser.email,
            role: cleanRole,
            phone: cleanPhone
          }
        });
      }
    });

    // ✅ ACTIVITY LOG: Employee updated
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_EMPLOYEE_UPDATE',
        `Updated employee ${id}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Employee updated successfully' });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, error: 'Failed to update employee' });
  }
};

const updateStatus = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const shopId = req.user.shopId;

    const whereClause = !isNaN(parseInt(id))
      ? { id: parseInt(id), shopId: parseInt(shopId) }
      : { emp_id: id, shopId: parseInt(shopId) };

    const updated = await prisma.employee.updateMany({
      where: whereClause,
      data: { status }
    });

    if (updated.count === 0) return res.status(404).json({ success: false, error: 'Employee not found' });

    // ✅ ACTIVITY LOG: Employee status change
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_EMPLOYEE_STATUS_UPDATE',
        `Updated employee ${id} status to ${status}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { id } = req.params;
    const shopId = req.user.shopId;

    const whereClause = !isNaN(parseInt(id))
      ? { id: parseInt(id), shopId: parseInt(shopId) }
      : { emp_id: id, shopId: parseInt(shopId) };

    const employee = await prisma.employee.findFirst({ where: whereClause });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    await prisma.$transaction(async (tx) => {
      // Find the user record associated with this employee.
      const linkedUser = await tx.user.findFirst({
        where: {
          OR: [
            { employeeId: employee.id },
            employee.username ? { username: employee.username } : undefined
          ].filter(Boolean)
        }
      });

      if (linkedUser) {
        await tx.user.delete({ where: { id: linkedUser.id } });
      }

      await tx.employee.delete({ where: { id: employee.id } });
    });

    // ✅ ACTIVITY LOG: Employee deleted
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_EMPLOYEE_DELETE',
        `Deleted employee ${id}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('deleteEmployee error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  }
};

const changePassword = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    const shopId = req.user.shopId;

    let employee;
    if (!isNaN(parseInt(id))) {
      employee = await prisma.employee.findFirst({
        where: { id: parseInt(id), shopId: parseInt(shopId) }
      });
    } else {
      employee = await prisma.employee.findFirst({
        where: { emp_id: id, shopId: parseInt(shopId) }
      });
    }

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: employee.id },
          employee.username ? { username: employee.username } : undefined
        ].filter(Boolean)
      }
    });
    if (!user) return res.status(404).json({ success: false, error: 'No login account (User) found for this employee' });

    // Validate the new password against strong password policy
    if (!newPassword || newPassword.length < 8 || newPassword.length > 50) {
      return res.status(400).json({ success: false, error: 'Password must be between 8 and 50 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one number' });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one special character' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Sync in Employee table as well
    await prisma.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword }
    });

    // ✅ ACTIVITY LOG: Employee password change
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_EMPLOYEE_PASSWORD_CHANGE',
        `Changed password for employee login user ${user.username}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};

// ==========================================
// 2. LEAVE MANAGEMENT
// ==========================================

const parseISODateOnly = (value) => {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const calcInclusiveDays = (fromDate, toDate) => {
  const ms = toDate.getTime() - fromDate.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return days;
};

const getLeaveRequests = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = normalizeRole(req.user.role);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { shopId: parseInt(shopId) };
    if (!isManagerLikeRole(role)) {
      const myEmployeeId = await resolveMyEmployeeId(req);
      if (!myEmployeeId) {
        return res.status(403).json({ success: false, error: 'Access denied: Employee profile not linked' });
      }
      where.employeeId = myEmployeeId;
    }

    if (req.query.status) {
      where.status = String(req.query.status).trim().toLowerCase();
    }

    if (req.query.search) {
      const q = String(req.query.search).trim();
      const searchFilter = {
        OR: [
          { reason: { contains: q, mode: 'insensitive' } },
          { type: { contains: q, mode: 'insensitive' } },
          { employee: { full_name: { contains: q, mode: 'insensitive' } } },
          { employee: { emp_id: { contains: q, mode: 'insensitive' } } }
        ]
      };

      if (where.employeeId) {
        // For restricted roles, ensure we only search within their own records
        where.AND = [
          { employeeId: where.employeeId },
          searchFilter
        ];
        delete where.employeeId;
      } else {
        where.OR = searchFilter.OR;
      }
    }


    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, emp_id: true, full_name: true, role: true } },
          reviewedBy: { select: { id: true, name: true, role: true } }
        }
      }),
      prisma.leaveRequest.count({ where })
    ]);

    const data = items.map((lr) => ({
      id: lr.id,
      type: lr.type,
      from_date: lr.from_date,
      to_date: lr.to_date,
      days: lr.days,
      reason: lr.reason,
      status: lr.status,
      decisionNote: lr.decisionNote,
      reviewedAt: lr.reviewedAt,
      createdAt: lr.createdAt,
      employee: lr.employee ? {
        id: lr.employee.id,
        emp_id: lr.employee.emp_id,
        full_name: lr.employee.full_name,
        role: lr.employee.role
      } : null,
      reviewedBy: lr.reviewedBy ? {
        id: lr.reviewedBy.id,
        name: lr.reviewedBy.name,
        role: lr.reviewedBy.role
      } : null
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error('getLeaveRequests error:', e);
    return res.status(500).json({ success: false, error: 'Failed to fetch leave requests' });
  }
};

const createLeaveRequest = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = normalizeRole(req.user.role);

    const type = String(req.body?.type || '').trim();
    const fromDate = parseISODateOnly(req.body?.from_date || req.body?.from);
    const toDate = parseISODateOnly(req.body?.to_date || req.body?.to);
    const reason = req.body?.reason ? String(req.body.reason) : null;

    if (!type || !fromDate || !toDate) {
      return res.status(400).json({ success: false, error: 'Please fill in the leave type, start date, and end date.' });
    }

    if (fromDate.getTime() > toDate.getTime()) {
      return res.status(400).json({ success: false, error: 'Start date cannot be after the end date. Please select a valid date range.' });
    }

    const days = calcInclusiveDays(fromDate, toDate);
    if (days <= 0 || days > 60) {
      return res.status(400).json({ success: false, error: 'Leave duration is invalid. You can apply for a maximum of 60 days at a time.' });
    }

    let employeeId = null;

    // Restricted users can only create for themselves
    if (!isManagerLikeRole(role)) {
      employeeId = await resolveMyEmployeeId(req);
      if (!employeeId) {
        return res.status(403).json({ success: false, error: 'Access denied: Employee profile not linked' });
      }
    } else {
      // Admin can optionally create on behalf of an employee
      const bodyEmp = req.body?.employeeId || req.body?.employee_id || req.body?.emp_id;
      if (bodyEmp) {
        const emp = await prisma.employee.findFirst({
          where: {
            shopId: parseInt(shopId),
            OR: [{ id: parseInt(bodyEmp) || 0 }, { emp_id: String(bodyEmp) }]
          },
          select: { id: true }
        });
        if (!emp) return res.status(404).json({ success: false, error: 'Employee not found' });
        employeeId = emp.id;
      } else {
        employeeId = await resolveMyEmployeeId(req);
      }
    }

    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Employee is not linked to this user' });
    }

    const created = await prisma.leaveRequest.create({
      data: {
        type,
        from_date: fromDate,
        to_date: toDate,
        days,
        reason,
        status: 'pending',
        employeeId,
        shopId: parseInt(shopId)
      },
      include: { employee: { select: { emp_id: true, full_name: true } } }
    });

    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_LEAVE_REQUEST_CREATE',
        `Created leave request #${created.id} for ${created.employee?.full_name || employeeId}`,
        'HRMS',
        'Success'
      );
    }

    return res.json({ success: true, data: created });
  } catch (e) {
    console.error('createLeaveRequest error:', e);
    return res.status(500).json({ success: false, error: 'Failed to create leave request' });
  }
};

const updateLeaveRequest = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const id = parseInt(req.params.id);
    const role = normalizeRole(req.user.role);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: 'Invalid request id' });
    }

    const existing = await prisma.leaveRequest.findFirst({
      where: { id, shopId: parseInt(shopId) }
    });

    if (!existing) return res.status(404).json({ success: false, error: 'Leave request not found' });

    // Restricted users can only update their own PENDING requests
    if (!isManagerLikeRole(role)) {
      const myEmployeeId = await resolveMyEmployeeId(req);
      if (existing.employeeId !== myEmployeeId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Only pending requests can be edited' });
      }
    }

    const { type, from_date, to_date, reason, status, decisionNote } = req.body;

    const updateData = {};
    if (type) updateData.type = type;
    if (reason !== undefined) updateData.reason = reason;

    if (from_date || to_date) {
      const fd = parseISODateOnly(from_date || existing.from_date);
      const td = parseISODateOnly(to_date || existing.to_date);
      if (fd && td) {
        if (fd.getTime() > td.getTime()) {
          return res.status(400).json({ success: false, error: 'Start date cannot be after the end date. Please select a valid date range.' });
        }
        updateData.from_date = fd;
        updateData.to_date = td;
        updateData.days = calcInclusiveDays(fd, td);
      }
    }

    // Admins can also update status and notes
    if (isManagerLikeRole(role)) {
      if (status) updateData.status = status;
      if (decisionNote !== undefined) updateData.decisionNote = decisionNote;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: updateData
    });

    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_LEAVE_REQUEST_UPDATE',
        `Updated leave request #${id}`,
        'HRMS',
        'Success'
      );
    }

    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('updateLeaveRequest error:', e);
    return res.status(500).json({ success: false, error: 'Failed to update leave request' });
  }
};

const updateLeaveRequestStatus = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: Only admins can approve/reject leaves' });
    }

    const shopId = req.user.shopId;
    const id = parseInt(req.params.id);
    const statusRaw = String(req.body?.status || '').trim().toLowerCase();
    const decisionNote = req.body?.decisionNote != null ? String(req.body.decisionNote) : null;

    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: 'Invalid request id' });
    }

    if (!['approved', 'rejected'].includes(statusRaw)) {
      return res.status(400).json({ success: false, error: 'status must be approved or rejected' });
    }

    const existing = await prisma.leaveRequest.findFirst({
      where: { id, shopId: parseInt(shopId) },
      include: { employee: { select: { id: true, emp_id: true, full_name: true } } }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Leave request not found' });

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: statusRaw,
        decisionNote,
        reviewedAt: new Date(),
        reviewedById: req.user.id
      }
    });

    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_LEAVE_REQUEST_DECISION',
        `${statusRaw.toUpperCase()} leave request #${id} for ${existing.employee?.full_name || existing.employeeId}`,
        'HRMS',
        'Success'
      );
    }

    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('updateLeaveRequestStatus error:', e);
    return res.status(500).json({ success: false, error: 'Failed to update leave request' });
  }
};

// ==========================================
// 2. ATTENDANCE MANAGEMENT
// ==========================================

const getDailyAttendance = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { date } = req.query; // YYYY-MM-DD
    const role = normalizeRole(req.user.role);

    if (!date) return res.status(400).json({ success: false, error: 'Date is required' });

    const parseYmd = (s) => {
      const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10);
      const d = parseInt(m[3], 10);
      if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
      return { y, mo, d };
    };

    const ymd = parseYmd(date);
    if (!ymd) return res.status(400).json({ success: false, error: 'Invalid date (expected YYYY-MM-DD)' });

    // Use UTC day boundaries for storage/query. Input `date` is treated as a calendar date.
    const startDate = new Date(Date.UTC(ymd.y, ymd.mo - 1, ymd.d, 0, 0, 0));
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const empWhere = { shopId: parseInt(shopId), status: 'active' };
    const queryEmpId = req.query.emp_id || req.query.employeeId;

    if (queryEmpId) {
      empWhere.OR = [
        { id: parseInt(queryEmpId) || 0 },
        { emp_id: String(queryEmpId) }
      ];
    } else if (!isManagerLikeRole(role)) {
      const myEmployeeId = await resolveMyEmployeeId(req);
      if (!myEmployeeId) {
        return res.status(403).json({ success: false, error: 'Access denied: Employee profile not linked' });
      }
      empWhere.id = myEmployeeId;
    }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      select: {
        id: true,
        emp_id: true,
        full_name: true,
        role: true,
        user: { select: { id: true, name: true, role: true } }
      }
    });

    const attendanceRecords = await prisma.attendance.findMany({
      // Use a range for the target date to avoid timezone equality issues
      where: {
        shopId: parseInt(shopId),
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: startDate, lt: endDate }
      }
    });

    const recordsByEmployee = new Map(attendanceRecords.map((r) => [r.employeeId, r]));

    const formatTime = (isoDate) => {
      if (!isoDate) return null;
      return new Date(isoDate).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const calcWorkingHours = (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return null;
      const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      if (!Number.isFinite(ms) || ms < 0) return null;
      const minutes = Math.round(ms / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${String(mins).padStart(2, '0')}m`;
    };

    const mergedData = employees.map(emp => {
      const record = recordsByEmployee.get(emp.id) || null;

      return {
        emp_id: emp.emp_id,
        db_id: emp.id,
        full_name: emp.full_name,
        user_name: emp.user?.name || emp.full_name,
        role: emp.user?.role || emp.role || '',
        check_in: record ? formatTime(record.check_in) : null,
        check_out: record ? formatTime(record.check_out) : null,
        working_hours: record ? calcWorkingHours(record.check_in, record.check_out) : null,
        status: record ? record.status : 'absent',
        note: record ? record.note : ''
      };
    });

    res.json({ success: true, data: mergedData });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};

const getAttendanceRange = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = normalizeRole(req.user.role);
    const { from, to, emp_id } = req.query; // YYYY-MM-DD

    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to are required' });
    }

    const parseYmd = (s) => {
      const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10);
      const d = parseInt(m[3], 10);
      if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
      return { y, mo, d };
    };

    const fromYmd = parseYmd(from);
    const toYmd = parseYmd(to);
    if (!fromYmd || !toYmd) {
      return res.status(400).json({ success: false, error: 'Invalid date range (expected YYYY-MM-DD)' });
    }

    // Use UTC day boundaries for storage/query. Input `from/to` are treated as calendar dates.
    const start = new Date(Date.UTC(fromYmd.y, fromYmd.mo - 1, fromYmd.d, 0, 0, 0));
    const end = new Date(Date.UTC(toYmd.y, toYmd.mo - 1, toYmd.d, 0, 0, 0));

    if (start.getTime() > end.getTime()) {
      return res.status(400).json({ success: false, error: 'Start date cannot be after the end date. Please select a valid date range.' });
    }

    const days = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (days > 60) {
      return res.status(400).json({ success: false, error: 'Date range is too large (max 60 days)' });
    }

    const empWhere = { shopId: parseInt(shopId), status: 'active' };

    // Explicitly requested employee or restricted view
    let targetEmpId = null;
    if (emp_id === 'self') {
      targetEmpId = await resolveMyEmployeeId(req);
    } else if (emp_id) {
      // If admin, they can request any employee. If not, only themselves.
      if (isManagerLikeRole(role)) {
        const emp = await prisma.employee.findFirst({
          where: { shopId: parseInt(shopId), OR: [{ id: parseInt(emp_id) || 0 }, { emp_id: String(emp_id) }] },
          select: { id: true }
        });
        if (emp) targetEmpId = emp.id;
      } else {
        const myId = await resolveMyEmployeeId(req);
        if (String(emp_id) === String(myId)) targetEmpId = myId;
      }
    } else if (!isManagerLikeRole(role)) {
      // Default to self for staff
      targetEmpId = await resolveMyEmployeeId(req);
    }

    if (targetEmpId) {
      empWhere.id = targetEmpId;
    }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      select: { id: true, emp_id: true, full_name: true, role: true, user: { select: { role: true } } }
    });

    // In restricted mode this will be 1 employee.
    if (!employees || employees.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const endExclusive = new Date(end);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    const records = await prisma.attendance.findMany({
      where: {
        shopId: parseInt(shopId),
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: start, lt: endExclusive }
      }
    });

    const formatTime = (isoDate) => {
      if (!isoDate) return null;
      return new Date(isoDate).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const calcWorkingHours = (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return null;
      const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      if (!Number.isFinite(ms) || ms < 0) return null;
      const minutes = Math.round(ms / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${String(mins).padStart(2, '0')}m`;
    };

    const formatDateKey = (dateObj) => {
      try {
        // Use the business timezone for date-only keys to avoid UTC shift (e.g. IST -> previous day).
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(dateObj);
      } catch {
        // Fallback: try to keep YYYY-MM-DD stable
        const d = new Date(dateObj);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    };

    // Restricted roles: return day-by-day history for the single employee (existing behavior).
    if (!isManagerLikeRole(role)) {
      const emp = employees[0];
      const byDayKey = new Map();
      for (const r of records) {
        if (r.employeeId !== emp.id) continue;
        const day = new Date(r.date);
        const key = formatDateKey(day);
        byDayKey.set(key, r);
      }

      const out = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        const key = formatDateKey(d);
        const r = byDayKey.get(key);

        out.push({
          date: key,
          emp_id: emp.emp_id,
          db_id: emp.id,
          full_name: emp.full_name,
          role: emp.user?.role || emp.role || '',
          check_in: r ? formatTime(r.check_in) : null,
          check_out: r ? formatTime(r.check_out) : null,
          working_hours: r ? calcWorkingHours(r.check_in, r.check_out) : null,
          status: r ? r.status : 'absent',
          note: r ? r.note : ''
        });
      }

      out.reverse();
      return res.json({ success: true, data: out });
    }

    // Admin/owner: return employee-by-day grid for the whole shop (max 60 days).
    const recordByKey = new Map();
    for (const r of records) {
      const day = new Date(r.date);
      const key = `${r.employeeId}:${formatDateKey(day)}`;
      recordByKey.set(key, r);
    }

    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const dateKey = formatDateKey(d);

      for (const emp of employees) {
        const r = recordByKey.get(`${emp.id}:${dateKey}`);
        out.push({
          date: dateKey,
          emp_id: emp.emp_id,
          db_id: emp.id,
          full_name: emp.full_name,
          role: emp.user?.role || emp.role || '',
          check_in: r ? formatTime(r.check_in) : null,
          check_out: r ? formatTime(r.check_out) : null,
          working_hours: r ? calcWorkingHours(r.check_in, r.check_out) : null,
          status: r ? r.status : 'absent',
          note: r ? r.note : ''
        });
      }
    }

    // Latest first (by date descending), then by name.
    out.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return String(a.full_name || '').localeCompare(String(b.full_name || ''));
    });

    return res.json({ success: true, data: out });
  } catch (error) {
    console.error('Attendance range fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};

const markCheckIn = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = normalizeRole(req.user.role);
    let { emp_id, date } = req.body || {};

    if (!isManagerLikeRole(role)) {
      emp_id = null;
    }

    if (!emp_id) {
      emp_id = await resolveMyEmployeeId(req);
    }

    if (!emp_id) {
      return res.status(400).json({ success: false, error: 'Employee profile not linked' });
    }

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required for check-in.' });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        shopId: parseInt(shopId),
        OR: [{ emp_id: emp_id.toString() }, { id: parseInt(emp_id) || 0 }]
      }
    });

    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    const ymdMatch = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!ymdMatch) return res.status(400).json({ success: false, error: 'Invalid date format' });

    const recordDate = new Date(Date.UTC(
      parseInt(ymdMatch[1], 10),
      parseInt(ymdMatch[2], 10) - 1,
      parseInt(ymdMatch[3], 10),
      0, 0, 0
    ));

    const today = new Date();

    await prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId: employee.id, date: recordDate }
      },
      update: { check_in: today, status: 'present' },
      create: {
        employeeId: employee.id,
        shopId: parseInt(shopId),
        date: recordDate,
        check_in: today,
        status: 'present'
      }
    });

    // Also upsert punch record so employee/owner views stay in sync
    try {
      await upsertPunchRecord({ employeeId: employee.id, shopId: parseInt(shopId), date: recordDate, check_in: today });
    } catch (e) {
      console.error('Punch upsert failed on check-in:', e.message || e);
    }

    // ✅ ACTIVITY LOG: Attendance check-in
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_ATTENDANCE_CHECKIN',
        `Checked in employee ${emp_id} for date ${date}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Checked in successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check in' });
  }
};

const markCheckOut = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = normalizeRole(req.user.role);
    let { emp_id, date } = req.body || {};

    if (!isManagerLikeRole(role)) {
      emp_id = null;
    }

    if (!emp_id) {
      emp_id = await resolveMyEmployeeId(req);
    }

    if (!emp_id) {
      return res.status(400).json({ success: false, error: 'Employee profile not linked' });
    }

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required for check-out.' });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        shopId: parseInt(shopId),
        OR: [{ emp_id: emp_id.toString() }, { id: parseInt(emp_id) || 0 }]
      }
    });

    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    const ymdMatch = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!ymdMatch) return res.status(400).json({ success: false, error: 'Invalid date format' });

    const recordDate = new Date(Date.UTC(
      parseInt(ymdMatch[1], 10),
      parseInt(ymdMatch[2], 10) - 1,
      parseInt(ymdMatch[3], 10),
      0, 0, 0
    ));

    const today = new Date();

    await prisma.attendance.updateMany({
      where: { employeeId: employee.id, date: recordDate },
      data: { check_out: today }
    });

    // Also update punch record for this date
    try {
      await upsertPunchRecord({ employeeId: employee.id, shopId: parseInt(shopId), date: recordDate, check_out: today });
    } catch (e) {
      console.error('Punch upsert failed on check-out:', e.message || e);
    }

    // ✅ ACTIVITY LOG: Attendance check-out
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_ATTENDANCE_CHECKOUT',
        `Checked out employee ${emp_id} for date ${date}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Checked out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check out' });
  }
};

const getSingleAttendance = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { emp_id, date } = req.query;

    const parseYmd = (s) => {
      const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10);
      const d = parseInt(m[3], 10);
      if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
      return { y, mo, d };
    };

    const ymd = parseYmd(date);
    if (!ymd) return res.status(400).json({ success: false, error: 'Invalid date (expected YYYY-MM-DD)' });

    const employee = await prisma.employee.findFirst({
      where: {
        shopId: parseInt(shopId),
        OR: [{ emp_id: emp_id.toString() }, { id: parseInt(emp_id) || 0 }]
      }
    });

    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Only admins can edit attendance records' });
    }

    // Ensure owner belongs to same shop as employee
    if (req.user.shopId !== employee.shopId) {
      return res.status(403).json({ success: false, error: 'Not authorized for this employee' });
    }

    // Always treat the requested date as a UTC day boundary for stable DB lookups across server timezones.
    const targetDate = new Date(Date.UTC(ymd.y, ymd.mo - 1, ymd.d, 0, 0, 0));
    const nextDate = new Date(targetDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const record = await prisma.attendance.findFirst({
      where: { employeeId: employee.id, date: { gte: targetDate, lt: nextDate } }
    });

    const formatTime = (isoDate) => {
      if (!isoDate) return '';
      return new Date(isoDate).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const responseData = {
      emp_id: employee.emp_id,
      full_name: employee.full_name,
      status: record ? record.status : 'absent',
      check_in: record ? formatTime(record.check_in) : '',
      check_out: record ? formatTime(record.check_out) : '',
      note: record ? record.note : ''
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch record' });
  }
};

const updateAttendanceRecord = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: Only admins can update attendance records' });
    }

    const { emp_id, date, status, check_in, check_out, note } = req.body;

    const parseYmd = (s) => {
      const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10);
      const d = parseInt(m[3], 10);
      if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
      return { y, mo, d };
    };

    const ymd = parseYmd(date);
    if (!ymd) return res.status(400).json({ success: false, error: 'Invalid date (expected YYYY-MM-DD)' });

    const employee = await prisma.employee.findFirst({
      where: {
        shopId: parseInt(shopId),
        OR: [{ emp_id: emp_id.toString() }, { id: parseInt(emp_id) || 0 }]
      }
    });

    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    // Store attendance row `date` at UTC midnight for the requested day to avoid timezone shifts.
    const recordDate = new Date(Date.UTC(ymd.y, ymd.mo - 1, ymd.d, 0, 0, 0));

    const combineDateTime = (dateObj, timeStr) => {
      if (!timeStr) return null;
      const parts = String(timeStr).trim().split(':');
      const hours = parseInt(parts[0] || '0', 10);
      const minutes = parseInt(parts[1] || '0', 10);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

      // Interpret input times as Asia/Kolkata clock time and convert to UTC instant.
      const IST_OFFSET_MIN = 330; // +05:30
      const utcMs = Date.UTC(ymd.y, ymd.mo - 1, ymd.d, hours, minutes, 0) - IST_OFFSET_MIN * 60 * 1000;
      return new Date(utcMs);
    };

    await prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId: employee.id, date: recordDate }
      },
      update: {
        status,
        check_in: check_in ? combineDateTime(recordDate, check_in) : null,
        check_out: check_out ? combineDateTime(recordDate, check_out) : null,
        note
      },
      create: {
        employeeId: employee.id,
        shopId: parseInt(shopId),
        date: recordDate,
        status,
        check_in: check_in ? combineDateTime(recordDate, check_in) : null,
        check_out: check_out ? combineDateTime(recordDate, check_out) : null,
        note
      }
    });

    // Also update punch record to keep them in sync
    try {
      const punchUpdate = {};
      if (check_in) punchUpdate.check_in = combineDateTime(recordDate, check_in);
      if (check_out) punchUpdate.check_out = combineDateTime(recordDate, check_out);
      await upsertPunchRecord({ employeeId: employee.id, shopId: parseInt(shopId), date: recordDate, check_in: punchUpdate.check_in, check_out: punchUpdate.check_out });
    } catch (e) {
      console.error('Punch upsert failed on attendance update:', e.message || e);
    }

    // ✅ ACTIVITY LOG: Attendance record manual update
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_ATTENDANCE_UPDATE',
        `Updated attendance record for employee ${emp_id} on ${date}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update attendance' });
  }
};

// employee punch-in/out api

const punchInOut = async (req, res) => {
  try {
    const requesterShopId = req.user ? req.user.shopId : null;
    let { emp_id, type, date } = req.body; // type: 'in' or 'out'

    if (!type) return res.status(400).json({ success: false, error: 'type is required' });

    let employee = null;
    if (emp_id && emp_id !== 'self') {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [{ emp_id: emp_id.toString() }, { id: parseInt(emp_id) || 0 }]
        }
      });
    } else {
      // Fallback to current user's employee profile
      const myEmpId = await resolveMyEmployeeId(req);
      if (myEmpId) {
        employee = await prisma.employee.findUnique({ where: { id: myEmpId } });
      }
    }

    if (!employee) {
      console.warn(`[Punch] No employee profile found for punch attempt by user ${req.user?.id}`);
      return res.status(404).json({ success: false, error: 'Employee profile not linked or not found. Please ensure your staff profile is correctly set up.' });
    }

    const now = new Date();
    let recordDate;
    if (date) {
      const ymd = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (ymd) {
        recordDate = new Date(Date.UTC(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]), 0, 0, 0));
      } else {
        recordDate = new Date(date);
        recordDate.setUTCHours(0, 0, 0, 0);
      }
    } else {
      recordDate = new Date();
      recordDate.setUTCHours(0, 0, 0, 0);
    }

    // Use the employee's shopId for stored records so shop owner can see them.
    const shopIdForRecord = employee.shopId || parseInt(requesterShopId || 0);

    // Upsert punch record (single row per employee per date)
    const punchData = {};
    if (type === 'in') punchData.check_in = now;
    else punchData.check_out = now;

    try {
      await upsertPunchRecord({ employeeId: employee.id, shopId: parseInt(shopIdForRecord), date: recordDate, check_in: punchData.check_in, check_out: punchData.check_out });
    } catch (err) {
      console.error('Punch upsert failed in punchInOut:', err.message || err);
      throw err;
    }

    // Upsert attendance: set check_in/check_out appropriately
    try {
      if (type === 'in') {
        const resIn = await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: employee.id, date: recordDate } },
          update: { check_in: now, status: 'present' },
          create: { employeeId: employee.id, shopId: parseInt(shopIdForRecord), date: recordDate, check_in: now, status: 'present' }
        });
        console.log(`[PUNCH_SUCCESS] In record: ${resIn.id} for employee: ${employee.id}`);
      } else {
        const resOut = await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: employee.id, date: recordDate } },
          update: { check_out: now },
          create: { employeeId: employee.id, shopId: parseInt(shopIdForRecord), date: recordDate, check_out: now, status: 'present' }
        });
        console.log(`[PUNCH_SUCCESS] Out record: ${resOut.id} for employee: ${employee.id}`);
      }
    } catch (upsertError) {
      console.error('[PUNCH_ERROR] Upsert failed:', upsertError);
      return res.status(500).json({ success: false, error: 'Database update failed' });
    }

    // Activity log
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId || shopIdForRecord,
        `HR_PUNCH_${type === 'out' ? 'OUT' : 'IN'}`,
        `Employee ${emp_id} punched ${type} at ${now.toISOString()}`,
        'HRMS',
        'Success'
      );
    }

    const formatTime = (isoDate) => {
      if (!isoDate) return null;
      return new Date(isoDate).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    res.json({
      success: true,
      message: `Punched ${type} successfully`,
      check_in: formatTime(type === 'in' ? now : undefined), // Simplified: frontend only needs the one that changed or both
      check_out: formatTime(type === 'out' ? now : undefined),
      time: formatTime(now)
    });
  } catch (error) {
    console.error('Punch error:', error);
    res.status(500).json({ success: false, error: 'Failed to record punch' });
  }
};

// ==========================================
// 3. PAYROLL MANAGEMENT
// ==========================================

const calculatePayroll = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Only admins or owners can calculate payroll' });
    }

    const shopId = req.user.shopId;
    const { emp_id, month } = req.body; // "YYYY-MM"

    if (!emp_id || !month) return res.status(400).json({ success: false, error: 'Employee and Month required' });

    const employee = await prisma.employee.findFirst({
      where: {
        shopId: parseInt(shopId),
        OR: [{ emp_id: emp_id.toString() }, { id: parseInt(emp_id) || 0 }]
      }
    });

    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    const [year, monthStr] = month.split('-');
    const startDate = new Date(year, parseInt(monthStr) - 1, 1);
    const endDate = new Date(year, parseInt(monthStr), 0);
    const totalDaysInMonth = endDate.getDate();

    // Count Attendance (half_day counts as 0.5 for salary)
    const [fullDays, halfDays] = await Promise.all([
      prisma.attendance.count({
        where: {
          employeeId: employee.id,
          date: { gte: startDate, lte: endDate },
          status: { in: ['present', 'late'] }
        }
      }),
      prisma.attendance.count({
        where: {
          employeeId: employee.id,
          date: { gte: startDate, lte: endDate },
          status: 'half_day'
        }
      })
    ]);
    const presentDays = fullDays + halfDays; // stored as whole days in payroll
    const paidDays = fullDays + (halfDays * 0.5);

    // Calc Salary
    const basicSalary = employee.salary;
    const perDaySalary = basicSalary / totalDaysInMonth;
    const earnedBasic = Math.round(perDaySalary * paidDays);

    // Check if payroll already exists to preserve custom allowances/deductions
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        employeeId_month: { employeeId: employee.id, month: startDate }
      }
    });

    const allowances = existingPayroll ? parseFloat(existingPayroll.allowances || 0) : 0;
    const deductions = existingPayroll ? parseFloat(existingPayroll.deductions || 0) : 0;
    const netSalary = earnedBasic + allowances - deductions;

    const payroll = await prisma.payroll.upsert({
      where: {
        employeeId_month: { employeeId: employee.id, month: startDate }
      },
      update: {
        working_days: totalDaysInMonth,
        present_days: presentDays,
        basic_salary: basicSalary,
        allowances: allowances,
        deductions: deductions,
        net_salary: netSalary,
      },
      create: {
        employeeId: employee.id,
        shopId: parseInt(shopId),
        month: startDate,
        working_days: totalDaysInMonth,
        present_days: presentDays,
        basic_salary: basicSalary,
        allowances: allowances,
        deductions: deductions,
        net_salary: netSalary,
        status: 'pending'
      }
    });

    // ✅ ACTIVITY LOG: Payroll calculated
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_PAYROLL_CALCULATE',
        `Calculated payroll for employee ${emp_id} for month ${month}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Payroll calculated', data: payroll });
  } catch (error) {
    console.error('Payroll calculation error', error);
    res.status(500).json({ success: false, error: 'Failed to calculate payroll' });
  }
};

const getPayrollById = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const shopId = req.user.shopId;
    const { id } = req.params;

    const payroll = await prisma.payroll.findFirst({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      include: { employee: true, shop: true }
    });

    if (!payroll) return res.status(404).json({ success: false, error: 'Payroll not found' });

    const startDate = new Date(payroll.month);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    const [fullDays, halfDays] = await Promise.all([
      prisma.attendance.count({
        where: {
          employeeId: payroll.employeeId,
          date: { gte: startDate, lt: endDate },
          status: { in: ['present', 'late'] }
        }
      }),
      prisma.attendance.count({
        where: {
          employeeId: payroll.employeeId,
          date: { gte: startDate, lt: endDate },
          status: 'half_day'
        }
      })
    ]);
    const paidDays = fullDays + (halfDays * 0.5);

    const responseData = {
      payroll_id: payroll.id,
      emp_id: payroll.employee.emp_id,
      full_name: payroll.employee.full_name,
      role: payroll.employee.role,
      month: payroll.month,
      working_days: payroll.working_days,
      present_days: payroll.present_days,
      paid_days: paidDays,
      basic_salary: payroll.basic_salary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      net_salary: payroll.net_salary,
      status: payroll.status,
      notes: payroll.notes,
      payment_date: payroll.payment_date,
      payment_method: payroll.payment_method,
      shop_details: {
        name: payroll.shop.name,
        address: payroll.shop.address,
        phone: payroll.shop.phone,
        email: payroll.shop.email,
        gst: payroll.shop.gstNumber
      }
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payroll' });
  }
};

const updatePayroll = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const shopId = req.user.shopId;
    const { id } = req.params;
    const { allowances, deductions, status, notes, net_salary } = req.body;

    const existing = await prisma.payroll.findFirst({
      where: { id: parseInt(id), shopId: parseInt(shopId) }
    });

    if (existing && existing.status === 'paid' && status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Status is locked and cannot be changed after being set to Paid' });
    }

    await prisma.payroll.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: {
        allowances: parseFloat(allowances || 0),
        deductions: parseFloat(deductions || 0),
        net_salary: parseFloat(net_salary || 0),
        status: status,
        notes: notes,
        payment_date: status === 'paid' ? new Date() : null
      }
    });

    // ✅ ACTIVITY LOG: Payroll updated
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_PAYROLL_UPDATE',
        `Updated payroll ID ${id} with status ${status}`,
        'HRMS',
        'Success'
      );
    }

    res.json({ success: true, message: 'Payroll updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update payroll' });
  }
};

const getPayrolls = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const shopId = req.user.shopId;
    const { month } = req.query;

    if (!month) return res.status(400).json({ success: false, error: 'Month is required' });

    const [year, monthStr] = month.split('-');
    const startDate = new Date(year, parseInt(monthStr) - 1, 1);
    const endDate = new Date(year, parseInt(monthStr), 1);

    const payrolls = await prisma.payroll.findMany({
      where: { shopId: parseInt(shopId), month: startDate },
      include: { employee: true },
      orderBy: { id: 'desc' }
    });

    const attendanceRows = await prisma.attendance.findMany({
      where: { shopId: parseInt(shopId), date: { gte: startDate, lt: endDate } },
      select: { employeeId: true, status: true }
    });

    const paidDaysByEmployee = attendanceRows.reduce((acc, row) => {
      const current = acc[row.employeeId] || { full: 0, half: 0 };
      if (row.status === 'half_day') current.half += 1;
      else if (row.status === 'present' || row.status === 'late') current.full += 1;
      acc[row.employeeId] = current;
      return acc;
    }, {});

    const formatted = payrolls.map(p => ({
      id: p.id,
      payroll_id: p.id,
      emp_id: p.employee.emp_id,
      full_name: p.employee.full_name,
      basic_salary: p.basic_salary,
      net_salary: p.net_salary,
      present_days: p.present_days,
      paid_days: (paidDaysByEmployee[p.employeeId]?.full || 0) + ((paidDaysByEmployee[p.employeeId]?.half || 0) * 0.5),
      working_days: p.working_days,
      status: p.status,
      payment_date: p.payment_date,
      month: p.month
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list payrolls' });
  }
};

const exportPayrollReport = async (req, res) => {
  try {
    if (!isManagerLikeRole(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const shopId = req.user.shopId;
    const { month } = req.query;

    if (!month) return res.status(400).json({ success: false, error: 'Month is required' });

    const [year, monthStr] = month.split('-');
    const startDate = new Date(year, parseInt(monthStr) - 1, 1);

    const payrolls = await prisma.payroll.findMany({
      where: { shopId: parseInt(shopId), month: startDate },
      include: { employee: true }
    });

    if (payrolls.length === 0) return res.status(404).send('No data');

    const header = 'Employee ID,Name,Role,Basic Salary,Allowances,Deductions,Net Salary,Status,Payment Date\n';
    const rows = payrolls.map(p => {
      const date = p.payment_date ? p.payment_date.toISOString().split('T')[0] : '';
      return `${p.employee.emp_id},${p.employee.full_name},${p.employee.role},${p.basic_salary},${p.allowances},${p.deductions},${p.net_salary},${p.status},${date}`;
    }).join('\n');

    const csvContent = header + rows;

    // ✅ ACTIVITY LOG: Payroll report export
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'HR_PAYROLL_EXPORT',
        `Exported payroll report for month ${month}`,
        'HRMS',
        'Success'
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payroll_report_${month}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
};

const getAttendanceDayWise = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { date, emp_id } = req.query; // YYYY-MM-DD

    if (!date) return res.status(400).json({ success: false, error: 'Date is required' });

    const parseYmd = (s) => {
      const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      return { y: parseInt(m[1]), mo: parseInt(m[2]), d: parseInt(m[3]) };
    };

    const ymd = parseYmd(date);
    if (!ymd) return res.status(400).json({ success: false, error: 'Invalid date (expected YYYY-MM-DD)' });

    let targetEmployeeId = null;
    const role = normalizeRole(req.user.role);

    // If a specific emp_id is provided AND the requester is a manager/admin, they can view others.
    if (emp_id && isManagerLikeRole(role)) {
      const emp = await prisma.employee.findFirst({
        where: {
          shopId: parseInt(shopId),
          OR: [
            { id: parseInt(emp_id) || 0 },
            { emp_id: String(emp_id) }
          ]
        },
        select: { id: true }
      });
      if (emp) targetEmployeeId = emp.id;
    }

    // Default to self if no specific emp_id or if not authorized to see others
    if (!targetEmployeeId) {
      targetEmployeeId = await resolveMyEmployeeId(req);
    }

    if (!targetEmployeeId) {
      console.warn(`[Attendance] Employee not found for user ${req.user.id} in shop ${shopId}`);
      return res.status(404).json({ success: false, error: 'Employee profile not linked or not found' });
    }

    // Standardize to UTC Midnight for @db.Date comparison
    const targetDate = new Date(Date.UTC(ymd.y, ymd.mo - 1, ymd.d, 0, 0, 0));

    console.log(`[Attendance] Fetching for employee: ${targetEmployeeId}, date: ${targetDate.toISOString()}`);

    const record = await prisma.attendance.findFirst({
      where: {
        shopId: parseInt(shopId),
        employeeId: targetEmployeeId,
        date: targetDate
      }
    });

    const formatTime = (isoDate) => {
      if (!isoDate) return null;
      return new Date(isoDate).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    res.json({
      success: true,
      date: date,
      attendance: record ? {
        check_in: formatTime(record.check_in),
        check_out: formatTime(record.check_out),
        status: record.status,
        note: record.note
      } : {
        check_in: null,
        check_out: null,
        status: 'absent',
        note: ''
      }
    });
  } catch (error) {
    console.error('getAttendanceDayWise error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};

module.exports = {
  getEmployees, getEmployeeById, createEmployee, getNextEmpId, checkUserAvailability, updateEmployee, updateStatus, deleteEmployee, changePassword,
  getLeaveRequests, createLeaveRequest, updateLeaveRequest, updateLeaveRequestStatus,
  getDailyAttendance, getAttendanceRange, markCheckIn, markCheckOut, getSingleAttendance, updateAttendanceRecord, punchInOut, getAttendanceDayWise,
  calculatePayroll, getPayrollById, updatePayroll, getPayrolls, exportPayrollReport
};
