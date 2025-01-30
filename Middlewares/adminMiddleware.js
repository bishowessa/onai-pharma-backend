const responseMsgs = require('../Utilities/responseMsgs');

const adminMiddleware = (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                status: responseMsgs.FAIL,
                data: 'Access denied. Admins only.',
            });
        }
        next();
    } catch (err) {
        res.status(403).json({
            status: responseMsgs.FAIL,
            data: err.message || 'Error verifying admin role',
        });
    }
};

module.exports = adminMiddleware;
