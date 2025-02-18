const mongoose = require('mongoose');
const User = require('./userModel');  // Make sure it's referencing UserModel correctly
const Product = require('./productModel');  // Make sure it's referencing ProductModel correctly

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user', // This should match the model name ('user' lowercase in userModel.js)
            required: true,
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product', // This should match the model name ('Product' uppercase in productModel.js)
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1, // Ensure quantity is at least 1
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Completed', 'Delivered', 'Cancelled'],
            default: 'Pending',
        },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

