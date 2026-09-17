const prisma = require('../lib/prisma');

const hasHtmlTags = (str) => {
    if (!str) return false;
    return /[<>]/.test(str);
};

const getStarted = async (req, res) => {
    try {
        const {
            fullname,
            email,
            phone,
            business_type,
            other_business_type,
            business_name,
            business_location,
            message,
            source,
        } = req.body;

        const errors = [];

        // 1. Fullname validation
        if (!fullname || typeof fullname !== 'string') {
            errors.push("Full name is required.");
        } else {
            const val = fullname.trim();
            if (val.length < 2 || val.length > 50) {
                errors.push("Full name must be between 2 and 50 characters.");
            }
            if (!/^[a-zA-Z\s]+$/.test(val)) {
                errors.push("Full name can only contain letters and spaces.");
            }
        }

        // 2. Email validation
        if (!email || typeof email !== 'string') {
            errors.push("Email address is required.");
        } else {
            const val = email.trim();
            if (val.length > 100) {
                errors.push("Email must be less than 100 characters.");
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                errors.push("Please enter a valid email address.");
            }
        }

        // 3. Phone validation
        if (!phone || typeof phone !== 'string') {
            errors.push("Phone number is required.");
        } else {
            const val = phone.trim();
            if (!/^[6-9]\d{9}$/.test(val)) {
                errors.push("Please enter a valid 10-digit Indian mobile number starting with 6-9.");
            }
            const uniqueDigits = new Set(val);
            if (uniqueDigits.size <= 1) {
                errors.push("Repetitive phone numbers like 9999999999 are not allowed.");
            }
        }

        // 4. Business Type validation
        let finalBusinessType = business_type;
        if (!business_type || typeof business_type !== 'string' || business_type.trim() === "") {
            errors.push("Business type is required.");
        } else if (business_type === "other") {
            if (!other_business_type || typeof other_business_type !== 'string' || other_business_type.trim() === "") {
                errors.push("Please specify your business type.");
            } else {
                const val = other_business_type.trim();
                if (val.length > 50) {
                    errors.push("Specified business type must be less than 50 characters.");
                }
                if (!/^[a-zA-Z0-9\s,.-]+$/.test(val)) {
                    errors.push("Specified business type contains invalid characters.");
                }
                finalBusinessType = val;
            }
        }

        // 5. Business Name validation (optional)
        if (business_name && typeof business_name === 'string') {
            const val = business_name.trim();
            if (val !== "") {
                if (val.length < 2 || val.length > 100) {
                    errors.push("Business name must be between 2 and 100 characters.");
                }
                if (!/^[a-zA-Z0-9\s&,.-]+$/.test(val)) {
                    errors.push("Business name contains invalid characters.");
                }
            }
        }

        // 6. Business Location validation (optional)
        if (business_location && typeof business_location === 'string') {
            const val = business_location.trim();
            if (val !== "") {
                if (val.length < 2 || val.length > 100) {
                    errors.push("Business location must be between 2 and 100 characters.");
                }
                if (!/^[a-zA-Z0-9\s,.-]+$/.test(val)) {
                    errors.push("Business location contains invalid characters.");
                }
            }
        }

        // 7. Message validation
        if (!message || typeof message !== 'string') {
            errors.push("Message/Business needs description is required.");
        } else {
            const val = message.trim();
            if (val.length < 10 || val.length > 500) {
                errors.push("Message must be between 10 and 500 characters.");
            }
            if (hasHtmlTags(val)) {
                errors.push("HTML or script tags are not allowed in message.");
            }
        }

        // 8. Unique Checks
        if (errors.length === 0) {
            const cleanEmail = email.trim();
            const cleanPhone = phone.trim();

            const [existingRequest, existingUser] = await Promise.all([
                prisma.getStartedRequest.findFirst({
                    where: {
                        OR: [
                            { email: { equals: cleanEmail, mode: 'insensitive' } },
                            { phone: cleanPhone }
                        ]
                    }
                }),
                prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: { equals: cleanEmail, mode: 'insensitive' } },
                            { username: cleanPhone },
                            { phone: cleanPhone }
                        ]
                    }
                })
            ]);

            if (existingRequest) {
                if (existingRequest.email.toLowerCase() === cleanEmail.toLowerCase()) {
                    errors.push("An application with this email has already been submitted.");
                } else {
                    errors.push("An application with this phone number has already been submitted.");
                }
            } else if (existingUser) {
                errors.push("A user with this email or phone number is already registered.");
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                status: "error",
                message: errors.join(" "),
            });
        }

        // Insert using Prisma
        await prisma.getStartedRequest.create({
            data: {
                fullname: fullname.trim(),
                email: email.trim(),
                phone: phone.trim(),
                business_type: finalBusinessType,
                business_name: business_name?.trim() || null,
                business_location: business_location?.trim() || null,
                message: message.trim(),
                source: source || 'Website',
            },
        });

        return res.json({
            status: "success",
            message: "Thank you! Our team will contact you within 24 hours.",
        });
    } catch (error) {
        console.error("🔥 Prisma Error in submit:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to submit data.",
        });
    }
};

const listGetStartedRequests = async (req, res) => {
    try {
        const pageRaw = parseInt(String(req.query.page || "1"), 10);
        const limitRaw = parseInt(String(req.query.limit || "50"), 10);
        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;
        const skip = (page - 1) * limit;

        const q = String(req.query.q || "").trim();
        const where = q
            ? {
                OR: [
                    { fullname: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { phone: { contains: q, mode: "insensitive" } },
                    { business_type: { contains: q, mode: "insensitive" } },
                    { business_name: { contains: q, mode: "insensitive" } },
                ],
            }
            : undefined;

        const [data, total] = await prisma.$transaction([
            prisma.getStartedRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
            }),
            prisma.getStartedRequest.count({ where }),
        ]);

        return res.json({
            status: "success",
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("🔥 Prisma Error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch data.",
        });
    }
};

const getGetStartedRequestById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid id.",
            });
        }

        const data = await prisma.getStartedRequest.findUnique({ where: { id } });
        if (!data) {
            return res.status(404).json({
                status: "error",
                message: "Request not found.",
            });
        }

        return res.json({ status: "success", data });
    } catch (error) {
        console.error("🔥 Prisma Error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch data.",
        });
    }
};

const deleteGetStartedRequest = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid id.",
            });
        }

        const existing = await prisma.getStartedRequest.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                status: "error",
                message: "Request not found.",
            });
        }

        await prisma.getStartedRequest.delete({ where: { id } });

        return res.json({
            status: "success",
            message: "Lead deleted successfully.",
        });
    } catch (error) {
        console.error("ðŸ”¥ Prisma Error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to delete lead.",
        });
    }
};

module.exports = { getStarted, listGetStartedRequests, getGetStartedRequestById, deleteGetStartedRequest };
