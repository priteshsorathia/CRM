const { createTransporter } = require('../utils/emailService');
const prisma = require('../lib/prisma');

// Helper: Send Email
const sendEmail = async (to, subject, html, attachments = []) => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'CRM Support'}" <${process.env.EMAIL_FROM}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments
        });
        return true;
    } catch (error) {
        console.error("SMTP Error:", error);
        throw error;
    }
};

// 2. Ticket Submission
const submitTicket = async (req, res) => {
    try {
        const { email, subject, category, subcategory, priority, description, source } = req.body;
        const ticketId = 'TKT-' + Date.now().toString().slice(-6);
        
        // Handle files (from multer)
        const files = req.files || [];
        const attachments = files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        // Admin Notification
        const adminHtml = `
            <h2>🆕 New Support Ticket: ${ticketId}</h2>
            <p><strong>From:</strong> ${email}</p>
            <p><strong>Category:</strong> ${category} ${subcategory ? `(${subcategory})` : ''}</p>
            <p><strong>Priority:</strong> <span style="color:${priority === 'critical' ? 'red' : 'black'}">${priority.toUpperCase()}</span></p>
            <p><strong>Source:</strong> ${source || 'Website'}</p>
            <hr/>
            <h3>Subject: ${subject}</h3>
            <p>${description}</p>
        `;

        // Save to Database
        await prisma.supportTicket.create({
            data: { ticketId, email, subject, category, subcategory: subcategory || '', priority, description, source: source || 'Website' }
        });

        // Send Admin Email
        try {
            await sendEmail(process.env.EMAIL_USER, `[${ticketId}] ${subject}`, adminHtml, attachments);
        } catch (emailError) {
            console.error("SMTP admin notification failed:", emailError);
        }

        // Send User Confirmation Email
        try {
            const userHtml = `
                <h3>Ticket Received: ${ticketId}</h3>
                <p>Hello,</p>
                <p>We received your support request regarding "<strong>${subject}</strong>".</p>
                <p>Our team will review it and get back to you shortly.</p>
                <br>
                <p>Regards,<br>CRM Support Team</p>
            `;
            await sendEmail(email, `Ticket Received: ${ticketId}`, userHtml);
        } catch (emailError) {
            console.error("SMTP user confirmation failed:", emailError);
        }

        res.json({ success: true, ticketId, message: 'Ticket created' });

    } catch (error) {
        console.error("Support Ticket Error:", error);
        res.status(500).json({ success: false, error: 'Failed to submit ticket' });
    }
};

// 3. Callback Request
const requestCallback = async (req, res) => {
    try {
        const { name, email, phone, preferred_date, preferred_time, issue_description, source } = req.body;

        const adminHtml = `
            <h2>📞 Callback Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Date:</strong> ${preferred_date}</p>
            <p><strong>Time:</strong> ${preferred_time}</p>
            <p><strong>Source:</strong> ${source || 'Website'}</p>
            <hr/>
            <h3>Issue:</h3>
            <p>${issue_description}</p>
        `;

        // Save to Database
        await prisma.supportCallback.create({
            data: { name, email, phone, preferred_date: preferred_date || '', preferred_time: preferred_time || '', issue_description: issue_description || '', source: source || 'Website' }
        });

        // Send Admin Email
        try {
            await sendEmail(process.env.EMAIL_USER, `Callback Request: ${name}`, adminHtml);
        } catch (emailError) {
            console.error("SMTP admin callback notification failed:", emailError);
        }

        // Send User Confirmation Email
        try {
            const userHtml = `
                <h3>Callback Request Received</h3>
                <p>Hello ${name},</p>
                <p>We received your request for a callback on <strong>${preferred_date}</strong> at <strong>${preferred_time}</strong>.</p>
                <p>Our support team will call you at your preferred time on <strong>${phone}</strong>.</p>
                <br>
                <p>Regards,<br>CRM Support Team</p>
            `;
            await sendEmail(email, `Callback Request Received`, userHtml);
        } catch (emailError) {
            console.error("SMTP user callback confirmation failed:", emailError);
        }

        res.json({ success: true, message: 'Callback requested' });

    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).json({ success: false, error: 'Failed to request callback' });
    }
};

// 4. Admin View: Get All Callbacks
const getCallbacks = async (req, res) => {
    try {
        const callbacks = await prisma.supportCallback.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: callbacks });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch callbacks' });
    }
};

// 5. Admin View: Update Status
const updateCallbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await prisma.supportCallback.update({
            where: { id: Number(id) },
            data: { status }
        });
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
};


// 6. Admin View: Get All Tickets
const getTickets = async (req, res) => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
    }
};

// 7. Admin View: Update Ticket Status
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await prisma.supportTicket.update({
            where: { id: Number(id) },
            data: { status }
        });
        res.json({ success: true, message: 'Ticket status updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update ticket status' });
    }
};

module.exports = { submitTicket, requestCallback, getCallbacks, updateCallbackStatus, getTickets, updateTicketStatus };