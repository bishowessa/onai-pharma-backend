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
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
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



const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const tokenData = resetTokens.get(token);

        if (!tokenData || tokenData.expires < Date.now()) {
            return res.status(400).json({
                status: 'fail',
                data: 'Invalid or expired token',
            });
        }

        const user = await UserModel.findOne({ email: tokenData.email });
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                data: 'User not found',
            });
        }

        // **Hash the new password before saving**
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        resetTokens.delete(token); // Delete the token after successful reset

        res.status(200).json({
            status: 'success',
            message: 'Password reset successfully',
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            data: err.message,
        });
    }
};


const getTokenEmail = (req, res) => {
    const { token } = req.body;
    const tokenData = resetTokens.get(token);
  
    if (!tokenData || tokenData.expires < Date.now()) {
      return res.status(400).json({
        status: 'fail',
        data: 'Invalid or expired token',
      });
    }
  
    res.status(200).json({
      status: 'success',
      email: tokenData.email,
    });
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
        
        // Set the cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: true, // IMPORTANT: The cookie will only be sent over HTTPS
            sameSite: 'None', // Adjust based on your client-server setup   
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        // Send response with token and user details
        res.json({
            status: responseMsgs.SUCCESS,
            message: 'Login successful',
            token,
            user: {
                id: loginUser._id,
                name: loginUser.name,
                email: loginUser.email,
                role: loginUser.role,
            }
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


const getSingleUser= async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id);
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
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

const checkEmail = async (req, res) => {
    const email = req.params.email;
    try {
      const user = await UserModel.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ exists: false });
      }
  
      return res.status(200).json({ exists: true, user });
    } catch (error) {
      console.error('Error checking email existence:', error);
      res.status(500).json({ error: 'Failed to check email.' });
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
        // if (updatedData.role) {
        //     return res.status(403).json({
        //         status: responseMsgs.FAIL,
        //         data: 'Unauthorized to update role',
        //     });
        // }

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

const promoteToAdmin = async (req, res) => {
    console.log('promoteToAdmin');
    try {
        const userId = req.params.id;
        const user = await UserModel.findById(userId);

        if (!user) {
          return res.status(404).json({ status: 'fail', message: 'User not found' });
        }
    
        user.role = 'admin';
        await user.save();
    
        res.status(200).json({ status: 'success', message: 'User promoted to admin' });
      } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
      }
    }


    
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
    getTokenEmail,
    promoteToAdmin,
    getSingleUser,
    checkEmail
};
