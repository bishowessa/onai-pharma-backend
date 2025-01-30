const { body } = require('express-validator');

const productValidations = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string'),

    body('description')
        .notEmpty().withMessage('Description is required')
        .isString().withMessage('Description must be a string'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),

    body('stock')
        .notEmpty().withMessage('Stock is required')
        .isInt({ gt: 0 }).withMessage('Stock must be a positive integer'),

    // Remove this if you want to allow file uploads without checking URL format
    body('image')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('Image is required');
            }
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                throw new Error('Invalid image type. Only JPEG, PNG, and JPG are allowed.');
            }
            return true;
        })
];

module.exports = productValidations;
