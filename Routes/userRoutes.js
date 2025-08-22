const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
const userValidations = require('../Validations/userValidation');
const userMiddleware = require('../Middlewares/userMiddleware');
const adminMiddleware = require('../Middlewares/adminMiddleware');

router.route('/')
.get(userMiddleware, adminMiddleware, userController.getAllUsers);

router.route('/getCurrentUser')
    .get(userMiddleware, userController.getCurrentUser);

router.get('/singleUser/:id', userMiddleware, adminMiddleware, userController.getSingleUser);

router.route('/:email')
    .get(userMiddleware, adminMiddleware, userController.getUser);

router.get('/checkEmail/:email', userController.checkEmail);

router.route('/register')
    .post(userValidations, userController.registerUser);

router.route('/login')
    .post(userController.loginUser);

router.route('/updateUser/:email')
    .patch(userMiddleware, adminMiddleware, userController.updateUser);

router.route('/deleteUser/:id')
    .delete(userMiddleware, adminMiddleware, userController.deleteUser);

router.route('/updateCurrentUser')
    .patch(userMiddleware, userController.updateCurrentUser);

router.route('/logout')
    .post(userController.logoutUser);

router.post('/forgotPassword', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/get-token-email', userController.getTokenEmail);

router.patch('/promote/:id', userMiddleware, adminMiddleware, userController.promoteToAdmin);


module.exports = router;
