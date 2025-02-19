const UserModel = require('../models/userModel');
const userValidations = require('../Validations/userValidation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const responseMsgs = require('../Utilities/responseMsgs');


const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Temporary in-memory store for reset tokens (use DB in production)
const resetTokens = new Map(); 

// Send reset link
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                data: 'User not found',
            });
        }

        // Generate a reset token
        const token = crypto.randomBytes(32).toString('hex');
        const resetLink = `http://localhost:4200/reset-password?token=${token}`;

        // Store the token with expiration (1 hour)
        resetTokens.set(token, { email, expires: Date.now() + 3600000 });

        // Set up email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'bishowessa@gmail.com', // Replace with your email
                pass: 'cqus ttnr yfrh dqhu',  // Replace with your email password
            },
        });

        // Send email
        await transporter.sendMail({
            from: 'bishowessa@gmail.com',
            to: email,
            subject: 'Password Reset Request',
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 500px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" style="background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Reset Password</a>
                <p>If you didn't request this, you can ignore this email.</p>
            </div>
        `,
    });

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'Reset link sent to your email',
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

// Handle password reset
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const resetData = resetTokens.get(token);

        if (!resetData || resetData.expires < Date.now()) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                data: 'Invalid or expired token',
            });
        }

        // Update user's password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserModel.findOneAndUpdate({ email: resetData.email }, { password: hashedPassword });

        // Remove token after successful reset
        resetTokens.delete(token);

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'Password reset successfully',
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};



    

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
    logoutUser,
    forgotPassword,
    resetPassword,
};
