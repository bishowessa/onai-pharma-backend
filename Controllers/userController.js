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
        
        // Set the cookie here first
        res.cookie('jwt', token, {
            httpOnly: true,          // Prevent frontend JS access
            secure: false,           // Set to true in production (for HTTPS)
            sameSite: 'Lax',         // Allows frontend to send cookies
            path: '/',               // Ensure accessibility across all pages
            maxAge: 60 * 60 * 1000,  // Expiration time (1 hour)
            domain: 'localhost',     // Make sure to match your domain here
        });
        // this.cookieService.set('jwt', response.token, { path: '/', expires: '1h', sameSite: 'Lax' });


        // Now send the response with the token as JSON
        res.json({
            status: responseMsgs.SUCCESS,
            message: 'Login successful',
            token,  // You can return the token in the response body if necessary
        });

    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {

        if (!req.user) {
            return res.status(401).json({ status: 'fail', data: 'No user found in request' });
        }

        const user = await UserModel.findById(req.user.id).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ status: 'fail', data: 'User not found' });
        }

        res.status(200).json({ status: 'success', data: user });
    } catch (err) {
        res.status(500).json({ status: 'fail', data: err.message });
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



// Update logged-in user profile
const updateCurrentUser = async (req, res) => {
    try {
        const updatedData = req.body;

        // Prevent role updates by normal users
        if (updatedData.role) {
            return res.status(403).json({
                status: responseMsgs.FAIL,
                data: 'Unauthorized to update role',
            });
        }

        // Hash password if updated
        if (updatedData.password) {
            updatedData.password = await bcrypt.hash(updatedData.password, 10);
        }

        const user = await UserModel.findByIdAndUpdate(req.user.id, updatedData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                data: 'User not found',
            });
        }

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'Profile updated successfully',
            data: user,
        });
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

// Logout user
const logoutUser = (req, res) => {
    res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.status(200).json({
        status: responseMsgs.SUCCESS,
        message: 'Logged out successfully',
    });
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
    getUser,
    getCurrentUser,
    updateCurrentUser,
    logoutUser
};
