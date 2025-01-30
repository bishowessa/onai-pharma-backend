const { body } = require('express-validator');
const UserModel = require('../models/userModel');

const userValidations = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email is not valid')
        .custom(async (value) => {
            const checkUser = await UserModel.findOne({ email: value });
            if (checkUser) {
                throw new Error('Email already exists');
            }
        }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('address').notEmpty().withMessage('Address is required'),
];

module.exports = userValidations;
