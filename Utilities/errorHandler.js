const responseMsgs = require('./responseMsgs');

const errorHandler = (res, err) => {
    if (err.message) {
        res.status(400).json({
            status: responseMsgs.FAIL,
            data: err.message.split(','),
        });
    } else if (err.errors) {
        res.status(400).json({
            status: responseMsgs.FAIL,
            data: err.errors.map((e) => e.message),
        });
    } else {
        res.status(400).json({
            status: responseMsgs.FAIL,
            data: [err.message],
        });
    }
};

module.exports = errorHandler;
