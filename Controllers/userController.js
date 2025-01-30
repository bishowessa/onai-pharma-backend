const UserModel = require('../models/userModel');
const userValidations = require('../Validations/userValidation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const responseMsgs = require('../Utilities/responseMsgs');




// Register a new user
const registerUser = async (req, res) => {
    try {
        let newUser = req.body;
        let validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                data: validationErrors,
            });
        }

        // Hash the password manually before saving
        newUser.password = await bcrypt.hash(newUser.password, 10);

        await UserModel.create(newUser);
        console.log('User created successfully');
        res.status(201).json({
            status: responseMsgs.SUCCESS,
            message: 'User created successfully',
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};


// Login user and issue token
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const loginUser = await UserModel.findOne({ email });
        if (!loginUser) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                data: 'User not found',
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, loginUser.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                status: responseMsgs.FAIL,
                data: 'Wrong password',
            });
        }

        const token = jwt.sign({ id: loginUser._id, role: loginUser.role }, process.env.JWTKEY, { expiresIn: '1h' });
        res.cookie('jwt', token, { httpOnly: true }).json({
            status: responseMsgs.SUCCESS,
            message: 'Login successful',
            token,
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find();
        res.status(200).json({ status: responseMsgs.SUCCESS, data: users });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

// Get user by email (Admin or the user themselves)
const getUser = async (req, res) => {
    try {
        const { email } = req.params;
        const loggedInUser = req.user; // This is set by the userMiddleware

        // If the user is an admin or is trying to get their own data
        if (loggedInUser.role === 'admin' || loggedInUser.email === email) {
            const user = await UserModel.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    status: responseMsgs.FAIL,
                    data: 'User not found',
                });
            }

            res.status(200).json({
                status: responseMsgs.SUCCESS,
                data: user,
            });
        } else {
            return res.status(403).json({
                status: responseMsgs.FAIL,
                data: 'Unauthorized access',
            });
        }
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};



const updateUser = async (req, res) => {
    try {
        const { email } = req.params;
        const updatedData = req.body;

        // Check if the password is being updated
        if (updatedData.password) {
            // If so, hash the password before saving
            const salt = await bcrypt.genSalt(10);
            updatedData.password = await bcrypt.hash(updatedData.password, salt);
        }

        // Update the user in the database
        const user = await UserModel.findOneAndUpdate({ email }, updatedData, { new: true });

        if (!user) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                data: 'User not found',
            });
        }

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'User updated successfully',
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};



// Delete user by ID (Admin only)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                data: 'User not found',
            });
        }
        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'User deleted successfully',
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateUser,
    deleteUser,
    getUser
};
