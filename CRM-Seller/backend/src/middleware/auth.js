const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to protect private routes
 */
const protect = (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authorization required. Please log in to access this resource.' 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Your session has expired or is invalid. Please log in again.' 
        });
    }
};

module.exports = { protect };
