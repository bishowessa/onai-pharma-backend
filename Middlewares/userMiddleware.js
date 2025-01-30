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

        const decoded = jwt.verify(token, process.env.JWTKEY); // verify the token
        req.user = decoded; // Attach the decoded user info to the request object
        next();
    } catch (err) {
        res.status(401).json({
            status: responseMsgs.FAIL,
            data: err.message || "An error occurred",
        });
    }
};

module.exports = userMiddleware;
