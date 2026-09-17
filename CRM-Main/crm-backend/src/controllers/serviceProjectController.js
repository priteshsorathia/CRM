const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

const DEFAULT_PROJECT_PREFIX = 'PRJ-';
const DEFAULT_PROJECT_COUNTER = 1;

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

// New Dynamic Permission Check
const checkModulePermission = async (req, module, action) => {
    if (isManagerLikeRole(req.user.role)) return true;
    
    const shopId = req.user.shopId;
    const role = req.user.role;
    
    const perm = await prisma.rolePermission.findFirst({
        where: {
            shopId: parseInt(shopId),
            role: role,
            module: module
        }
    });

    if (!perm) return false;

    if (action === 'CREATE') return !!perm.canCreate;
    if (action === 'READ') return !!perm.canRead;
    if (action === 'UPDATE') return !!perm.canUpdate;
    if (action === 'DELETE') return !!perm.canDelete;
    
    return false;
};

// Generate unique project ID like PRJ-1001 (uses shop settings counter)
const generateProjectId = async (shopId) => {
    return prisma.$transaction(async (tx) => {
        await tx.shopSettings.upsert({
            where: { shopId },
            update: {},
            create: {
                shopId,
                stock_deduction: true,
                invoice_prefix: 'INV-',
                invoice_counter: 1,
                invoice_notes: '',
                default_tax: 0.0,
                order_prefix: 'ORD-',
                order_counter: 1,
                enable_buyback_exchange: false,
                price_column_label: "Price per unit",
                project_prefix: DEFAULT_PROJECT_PREFIX,
                project_counter: DEFAULT_PROJECT_COUNTER,
                client_prefix: 'CLT-',
                client_counter: 1
            }
        });

        const updated = await tx.shopSettings.update({
            where: { shopId },
            data: { project_counter: { increment: 1 } },
            select: { project_prefix: true, project_counter: true }
        });

        const counterUsed = (updated.project_counter || (DEFAULT_PROJECT_COUNTER + 1)) - 1;
        const prefix = updated.project_prefix || DEFAULT_PROJECT_PREFIX;
        return `${prefix}${String(counterUsed).padStart(2, '0')}`;
    });
};

const normalizeIdArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map((v) => parseInt(v))
        .filter((n) => Number.isFinite(n));
};

// Generate unique task ID like TSK-001
const generateTaskId = async (shopId) => {
    const lastTask = await prisma.serviceTask.findFirst({
        where: { shopId },
        orderBy: { id: 'desc' }
    });

    if (lastTask && lastTask.taskId.startsWith('TSK-')) {
        const lastNum = parseInt(lastTask.taskId.split('-')[1]);
        if (!isNaN(lastNum)) {
            return `TSK-${String(lastNum + 1).padStart(3, '0')}`;
        }
    }
    return 'TSK-001';
};

exports.getProjects = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const isAdmin = isManagerLikeRole(req.user.role);
        const hasProjectRead = await checkModulePermission(req, 'PROJECT', 'READ');
        const hasTaskRead = await checkModulePermission(req, 'TASK', 'READ');

        const where = { shopId };
        
        // If not manager and NO explicit read permission for projects/tasks, restrict to team members
        if (!isAdmin && !hasProjectRead && !hasTaskRead) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.json({ success: true, projects: [] });
            where.teamMembers = { array_contains: employeeId };
        }

        const projects = await prisma.serviceProject.findMany({
            where,
            include: {
                tasks: true,
                timesheets: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProjectManagers = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: 'Shop not found for current user' });

        const users = await prisma.user.findMany({
            where: {
                shopId,
                isBlocked: false
            },
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                username: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const managers = users.filter((u) => isManagerLikeRole(u.role));
        res.json({ success: true, managers });
    } catch (error) {
        console.error("Error fetching project managers:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const shopId = req.user.shopId;

        // Restriction: Only Admins/Managers can create projects
        const hasPerm = await checkModulePermission(req, 'PROJECT', 'CREATE');
        if (!hasPerm) {
            return res.status(403).json({ success: false, message: "Forbidden: Only admins can create projects" });
        }

        const { name, client, manager, team, teamMembers, start, end, budget, status, description, milestones, documentation } = req.body;
        
        const memberIds = normalizeIdArray(teamMembers || []);
        const teamCount = memberIds.length > 0 ? memberIds.length : (parseInt(team) || 0);

        const projectId = await generateProjectId(shopId);

        const project = await prisma.serviceProject.create({
            data: {
                projectId,
                name,
                client,
                manager,
                team: teamCount,
                teamMembers: memberIds,
                milestones: milestones || [],
                description: description || '',
                start: new Date(start),
                end: new Date(end),
                budget: parseFloat(budget) || 0,
                status: status || 'Active',
                documentation: documentation || '',
                shopId
            }
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_PROJECT_CREATE',
            `Created project "${project.name}" (${project.projectId})`,
            'Services',
            'Success'
        );
        res.json({ success: true, project });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id } = req.params;
        const { name, client, manager, team, teamMembers, start, end, budget, status, description, milestones, documentation } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (client) updateData.client = client;
        if (manager) updateData.manager = manager;
        if (description !== undefined) updateData.description = description;
        if (milestones !== undefined) updateData.milestones = Array.isArray(milestones) ? milestones : [];
        if (teamMembers && Array.isArray(teamMembers)) {
            const memberIds = normalizeIdArray(teamMembers);
            updateData.teamMembers = memberIds;
            updateData.team = memberIds.length || 1;
        } else if (team) {
            updateData.team = parseInt(team);
        }
        if (start) updateData.start = new Date(start);
        if (end) updateData.end = new Date(end);
        if (budget !== undefined) updateData.budget = parseFloat(budget);
        if (status) updateData.status = status;
        if (documentation !== undefined) updateData.documentation = documentation;

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = { id: parseInt(id), shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
            where.teamMembers = { array_contains: employeeId };
        }

        const project = await prisma.serviceProject.updateMany({
            where,
            data: updateData
        });

        if (project.count === 0) return res.status(404).json({ success: false, message: "Project not found" });

        const updated = await prisma.serviceProject.findFirst({ where: { id: parseInt(id), shopId } });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_PROJECT_UPDATE',
            `Updated project "${updated.name}" (${updated.projectId})`,
            'Services',
            'Success'
        );
        res.json({ success: true, project: updated });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProjectMembers = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id } = req.params;

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = { id: parseInt(id), shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            where.teamMembers = { array_contains: employeeId };
        }

        const project = await prisma.serviceProject.findFirst({
            where,
            select: { id: true, teamMembers: true }
        });

        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const memberIds = normalizeIdArray(project.teamMembers);
        if (memberIds.length === 0) return res.json({ success: true, members: [] });

        const employees = await prisma.employee.findMany({
            where: { shopId: parseInt(shopId), id: { in: memberIds } },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, members: employees });
    } catch (error) {
        console.error('Error fetching project members:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addProjectMember = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id } = req.params;
        const { employeeId } = req.body || {};
        const empId = parseInt(employeeId);
        if (!Number.isFinite(empId)) return res.status(400).json({ success: false, message: 'employeeId is required' });

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = { id: parseInt(id), shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            where.teamMembers = { array_contains: employeeId };
        }

        const project = await prisma.serviceProject.findFirst({
            where,
            select: { id: true, teamMembers: true }
        });

        const employee = await prisma.employee.findFirst({
            where: { id: empId, shopId: parseInt(shopId) }
        });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        const memberIds = normalizeIdArray(project.teamMembers);
        if (!memberIds.includes(empId)) memberIds.push(empId);

        const updated = await prisma.serviceProject.update({
            where: { id: parseInt(id) },
            data: {
                teamMembers: memberIds,
                team: memberIds.length || 1
            }
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_PROJECT_MEMBER_ADD',
            `Added member (Employee #${empId}) to project "${updated.name}" (${updated.projectId})`,
            'Services',
            'Success'
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding project member:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeProjectMember = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id, employeeId } = req.params;
        const empId = parseInt(employeeId);
        if (!Number.isFinite(empId)) return res.status(400).json({ success: false, message: 'Invalid employeeId' });

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = { id: parseInt(id), shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            where.teamMembers = { array_contains: employeeId };
        }

        const project = await prisma.serviceProject.findFirst({
            where,
            select: { id: true, teamMembers: true }
        });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const memberIds = normalizeIdArray(project.teamMembers).filter((x) => x !== empId);

        const updated = await prisma.serviceProject.update({
            where: { id: parseInt(id) },
            data: {
                teamMembers: memberIds,
                team: memberIds.length || 1
            }
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_PROJECT_MEMBER_REMOVE',
            `Removed member (Employee #${empId}) from project "${updated.name}" (${updated.projectId})`,
            'Services',
            'Success'
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing project member:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id } = req.params;

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = { id: parseInt(id), shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
            where.teamMembers = { array_contains: employeeId };
        }

        const existing = await prisma.serviceProject.findFirst({
            where,
            select: { id: true, name: true, projectId: true }
        });

        if (!existing) return res.status(404).json({ success: false, message: "Project not found or access denied" });

        await prisma.serviceProject.deleteMany({
            where
        });

        if (existing) {
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'SERVICE_PROJECT_DELETE',
                `Deleted project "${existing.name}" (${existing.projectId})`,
                'Services',
                'Success'
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const isAdmin = isManagerLikeRole(req.user.role);
        const hasTaskRead = await checkModulePermission(req, 'TASK', 'READ');

        const where = { shopId };
        if (!isAdmin && !hasTaskRead) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.json({ success: true, tasks: [] });
            where.serviceProject = {
                teamMembers: { array_contains: employeeId }
            };
        }

        const tasks = await prisma.serviceTask.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { projectId } = req.params;
        const { title, description, assignee, priority, deadline, column } = req.body;

        const hasCreatePerm = await checkModulePermission(req, 'TASK', 'CREATE');
        const projectWhere = { id: parseInt(projectId), shopId };
        if (!hasCreatePerm) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
            projectWhere.teamMembers = { array_contains: employeeId };
        }

        const project = await prisma.serviceProject.findFirst({
            where: projectWhere
        });
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        const taskId = await generateTaskId(shopId);

        const task = await prisma.serviceTask.create({
            data: {
                taskId,
                title,
                description,
                assignee,
                priority: priority || 'Medium',
                deadline: new Date(deadline),
                project: project.name,
                column: column || 'Pending',
                projectId: parseInt(projectId),
                shopId
            }
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_TASK_CREATE',
            `Created task "${task.title}" (${task.taskId}) in project "${project.name}"`,
            'Services',
            'Success'
        );
        res.json({ success: true, task });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { taskId } = req.params;
        const { column, title, description, assignee, priority, deadline } = req.body;

        const updateData = {};
        if (column) updateData.column = column;
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (assignee) updateData.assignee = assignee;
        if (priority) updateData.priority = priority;
        if (deadline) updateData.deadline = new Date(deadline);

        const isAdmin = isManagerLikeRole(req.user.role);
        const userName = req.user.name;
        const employeeId = req.user.employeeId;

        // Find the task first to check assignee
        const existingTask = await prisma.serviceTask.findFirst({
            where: { id: parseInt(taskId), shopId }
        });

        if (!existingTask) return res.status(404).json({ success: false, message: "Task not found" });

        const hasUpdatePerm = await checkModulePermission(req, 'TASK', 'UPDATE');
        const isAssignee = userName === existingTask.assignee;

        if (!hasUpdatePerm && !isAssignee) {
            if (!employeeId) return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
            
            const project = await prisma.serviceProject.findFirst({
                where: { 
                    id: existingTask.projectId, 
                    shopId,
                    teamMembers: { array_contains: employeeId }
                }
            });
            if (!project) return res.status(403).json({ success: false, message: "Forbidden: You are not part of this project team" });
        }

        const task = await prisma.serviceTask.update({
            where: { id: parseInt(taskId) },
            data: updateData
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_TASK_UPDATE',
            `Updated task "${task.title}" (${task.taskId})`,
            'Services',
            'Success'
        );
        res.json({ success: true, task });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { taskId } = req.params;

        const hasDeletePerm = await checkModulePermission(req, 'TASK', 'DELETE');
        const where = { id: parseInt(taskId), shopId };
        if (!hasDeletePerm) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
            where.serviceProject = {
                teamMembers: { array_contains: employeeId }
            };
        }

        const existing = await prisma.serviceTask.findFirst({
            where,
            select: { id: true, title: true, taskId: true }
        });

        if (!existing) return res.status(404).json({ success: false, message: "Task not found or access denied" });

        await prisma.serviceTask.deleteMany({
            where
        });

        if (existing) {
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'SERVICE_TASK_DELETE',
                `Deleted task "${existing.title}" (${existing.taskId})`,
                'Services',
                'Success'
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTimesheets = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const isAdmin = isManagerLikeRole(req.user.role);

        const where = { shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.json({ success: true, timesheets: [] });
            where.serviceProject = {
                teamMembers: { array_contains: employeeId }
            };
        }

        const timesheets = await prisma.serviceTimesheet.findMany({
            where,
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, timesheets });
    } catch (error) {
        console.error("Error fetching timesheets:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTimesheet = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { projectId } = req.params;
        const { date, task, hours, billable, status } = req.body;

        const isAdmin = isManagerLikeRole(req.user.role);
        const projectWhere = { id: parseInt(projectId), shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
            projectWhere.teamMembers = { array_contains: employeeId };
        }

        const project = await prisma.serviceProject.findFirst({
            where: projectWhere
        });
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        const timesheet = await prisma.serviceTimesheet.create({
            data: {
                date: new Date(date),
                project: project.name,
                task,
                hours: parseFloat(hours),
                billable: billable !== undefined ? billable : true,
                status: status || 'Pending',
                projectId: parseInt(projectId),
                shopId
            }
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_TIMESHEET_CREATE',
            `Created timesheet for project "${project.name}" (${parseFloat(hours)} hours)`,
            'Services',
            'Success'
        );
        res.json({ success: true, timesheet });
    } catch (error) {
        console.error("Error creating timesheet:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
