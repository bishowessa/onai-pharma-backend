const jwt = require('jsonwebtoken');
const responseMsgs = require('../Utilities/responseMsgs');

const userMiddleware = (req, res, next) => {
    try {
        let token = req.cookies?.jwt; // Access the jwt cookie

        if (!token) {
            return res.status(401).json({
                status: responseMsgs.FAIL,
                data: "You are not logged in",
            });
        }

        const decoded = jwt.verify(token, process.env.JWTKEY); // Verify the token
        req.user = decoded; // Attach user data to request object

        // Check remaining time before expiration
        const remainingTime = decoded.exp * 1000 - Date.now();

        if (remainingTime < 30 * 60 * 1000) { // If less than 30 minutes left, refresh token
            const newToken = jwt.sign(
                { id: decoded.id, role: decoded.role },
                process.env.JWTKEY,
                { expiresIn: '1h' }
            );

            res.cookie('jwt', newToken, {
                httpOnly: false,
                secure: false,
                sameSite: 'Lax',
                path: '/',
                maxAge: 60 * 60 * 1000, // 1 hour
                domain: 'localhost',
            });
        }

        next();
    } catch (err) {
        res.status(401).json({
            status: responseMsgs.FAIL,
            data: err.message || "Invalid or expired token",
        });
    }
};

module.exports = userMiddleware;
