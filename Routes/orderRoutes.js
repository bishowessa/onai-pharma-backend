const express = require('express');
const { createOrder, getAllOrders, getUserOrders, updateOrderStatus, deleteOrder, editUserOrder, deleteUserOrder } = require('../Controllers/orderController');
const userMiddleware = require('../Middlewares/userMiddleware');
const adminMiddleware = require('../Middlewares/adminMiddleware');

const router = express.Router();

router.post('/', userMiddleware, createOrder); // Place an order (Logged-in users)
router.get('/', userMiddleware, adminMiddleware, getAllOrders); // Get all orders (Admin only)
router.get('/my-orders', userMiddleware, getUserOrders); // Get logged-in user's orders
router.patch('/:id', userMiddleware, adminMiddleware, updateOrderStatus); // Update order status (Admin only)
router.delete('/:id', userMiddleware, adminMiddleware, deleteOrder); // Delete an order (Admin only)
router.patch('/edit/:id/', userMiddleware, editUserOrder); // Edit order (user can edit only their own order)
router.delete('/user/:id', userMiddleware, deleteUserOrder); // Delete order (user can delete only their own order)


module.exports = router;
