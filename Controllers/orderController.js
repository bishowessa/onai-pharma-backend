const mongoose = require('mongoose');
const User = require('../models/userModel');   
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const responseMsgs = require('../Utilities/responseMsgs');

const nodemailer = require('nodemailer');


// Create an order
const createOrder = async (req, res) => {
    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                message: 'Products array cannot be empty.',
            });
        }

        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                message: 'User is required.',
            });
        }

        let totalPrice = 0;
        const orderItems = [];
        let orderDetailsText = '';

        for (const item of products) {
            if (!item.product || !item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                return res.status(400).json({
                    status: responseMsgs.FAIL,
                    message: `Invalid product or quantity for item: ${JSON.stringify(item)}`,
                });
            }

            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({
                    status: responseMsgs.FAIL,
                    message: `Product not found: ${item.product}`,
                });
            }

            const price = product.price * item.quantity;
            totalPrice += price;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price,
            });

            // Add product details to the email text
            orderDetailsText += `${item.quantity} x ${product.name}, `;
        }

        orderDetailsText = orderDetailsText.slice(0, -2); // Remove trailing comma and space

        const newOrder = new Order({
            user: userId,
            products: orderItems,
            totalPrice,
        });

        await newOrder.save();

        // Send email notifications
        const user = await User.findById(userId);

        // Configure the nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'bishowessa@gmail.com',
                pass: 'cqus ttnr yfrh dqhu', // Use an app password if 2FA is enabled
            },
        });

        // Send email to the user
        await transporter.sendMail({
            from: 'bishowessa@gmail.com',
            to: user.email,
            subject: 'Order Confirmation',
            text: `Thank you for placing your order.
                   You can track your order in the "My Orders" section.
                   Here are the details of your order: ${orderDetailsText}.
                   Your order total is ${totalPrice} EGP.`,
        });

        // Send email to yourself (bishowessa@gmail.com) for notification
        await transporter.sendMail({
            from: 'bishowessa@gmail.com',
            to: 'maged.m.wessa@gmail.com',
            subject: 'New Order Placed',
            text: `A new order has been placed by ${user.name} (${user.email}).
                   Order details: ${orderDetailsText}.
                   The address is ${user.address}.
                   Total order amount: ${totalPrice} EGP`,
        });

        res.status(201).json({
            status: responseMsgs.SUCCESS,
            message: 'Order placed successfully',
            data: newOrder,
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            message: err.message || 'An error occurred while placing the order.',
        });
    }
};


// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email phone address')
            .populate('products.product', 'name price image');

        const totalCost = orders.reduce((sum, order) => sum + order.totalPrice, 0);

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            data: orders,
            totalCost,
        });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({
            status: responseMsgs.FAIL,
            message: 'Error retrieving orders',
        });
    }
};



// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                message: 'User not found.',
            });
        }

        const orders = await Order.find({ user: userId })
            .populate('products.product', 'name price image')
            .populate('user', 'name email phone address');

        const totalCost = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        res.status(200).json({
            status: responseMsgs.SUCCESS,
            data: orders,
            totalCost,
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            message: err.message || 'An error occurred while fetching orders.',
        });
    }
};



const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id).populate('products.product'); // Ensure products are populated

        if (!order) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                message: 'Order not found',
            });
        }

        // Handle stock adjustment only if the status is changing
        if (order.status !== status) {
            // Decrease stock when marking as "Completed"
            if (status === 'Completed') {
                for (const item of order.products) {
                    const product = await Product.findById(item.product._id);
                    if (product.stock >= item.quantity) {
                        product.stock -= item.quantity;
                        await product.save();
                    } else {
                        return res.status(400).json({
                            status: responseMsgs.FAIL,
                            message: `Insufficient stock for product: ${product.name}`,
                        });
                    }
                }
            }

            // Restore stock when reverting to "Pending"
            if (order.status === 'Completed' && status === 'Pending') {
                for (const item of order.products) {
                    const product = await Product.findById(item.product._id);
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        // Update order status
        order.status = status;
        await order.save();

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'Order status updated',
            data: order,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            status: responseMsgs.FAIL,
            message: 'Error updating order status',
        });
    }
};




// Delete an order (Admin only)
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                message: 'Order not found',
            });
        }

        await order.deleteOne();
        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'Order deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            message: 'Error deleting order',
        });
    }
};

const editUserOrder = async (req, res) => {
    const { id } = req.params;
    const { products } = req.body; // New products to update the order

    try {
        // Find the order by ID
        const order = await Order.findById(id);

        // If the order is not found
        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'Order not found',
            });
        }

        // Check if the logged-in user is the owner of the order
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to edit this order',
            });
        }

        // Ensure that each product has a valid quantity
        for (const item of products) {
            if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Each product must have a valid quantity',
                });
            }
        }

        // Debugging: Check products and order products
        
        

        // Update the products and quantities without touching the price
        order.products = order.products.map((orderProduct) => {
            // Debugging: log each orderProduct and updated product
            
            

            const updatedProduct = products.find((item) => {
                // Convert both product ids to strings for comparison
                
                return item.product.toString() === orderProduct.product.toString();
            });

            if (updatedProduct) {
                // Keep the price as is and update the quantity
                orderProduct.quantity = updatedProduct.quantity;
            } else {
                
            }

            return orderProduct;
        });

        // Recalculate totalPrice based on new products and quantities, but use the existing prices
        let totalPrice = 0;
        for (const item of order.products) {
            totalPrice += item.quantity * item.price; // Use the existing price, no modification needed
        }

        // Ensure totalPrice is a valid number
        if (isNaN(totalPrice) || totalPrice <= 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid total price calculated',
            });
        }

        order.totalPrice = totalPrice;

        // Save the updated order
        await order.save();

        res.status(200).json({
            status: 'success',
            data: order,
        });
    } catch (error) {
        console.error('Error updating the order:', error); // Log the detailed error for debugging
        res.status(500).json({
            status: 'fail',
            message: 'Error updating the order. Please check the server logs for details.',
        });
    }
};





const deleteUserOrder = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the order by ID
        const order = await Order.findById(id);

        // If the order is not found
        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'Order not found',
            });
        }

        // Check if the logged-in user is the owner of the order
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to delete this order',
            });
        }

        // Delete the order
        await Order.deleteOne({ _id: id });

        res.status(200).json({
            status: 'success',
            message: 'Order deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting the order:', error);
        res.status(500).json({
            status: 'fail',
            message: 'Error deleting the order. Please check the server logs for details.',
        });
    }
};





module.exports = { createOrder, getAllOrders, getUserOrders, updateOrderStatus, deleteOrder, editUserOrder, deleteUserOrder };
