const { body, validationResult } = require('express-validator');

// Validation rules
const validateOrder = [
    body('products')
        .isArray({ min: 1 })
        .withMessage('Products array cannot be empty.'),
    body('products.*.product')
        .isMongoId()
        .withMessage('Each product must have a valid product ID.'),
    body('products.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1.'),
];

// Middleware to check for validation errors
const checkValidationResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'fail',
            errors: errors.array().map(err => err.msg), // Return an array of error messages
        });
    }
    next();
};

module.exports = {
    validateOrder,
    checkValidationResult,
};
