const ProductModel = require('../models/productModel');
const responseMsgs = require('../Utilities/responseMsgs');


// Base URL for the server
const baseUrl = process.env.BACKEND_URL;

// Create a new product (Admin only)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        let image;

        if (req.file) {
            image = `${baseUrl}/uploads/${req.file.filename}`; // Save image path with full URL
        } else {
            image = 'https://via.placeholder.com/150'; // Default image
        }

        if (!name || !description || !price || !stock) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                message: 'Name, description, price, and stock are required fields.',
            });
        }

        const newProduct = new ProductModel({
            name,
            description,
            price,
            stock,
            image
        });

        await newProduct.save();

        res.status(201).json({
            status: responseMsgs.SUCCESS,
            message: 'Product added successfully',
            data: newProduct,
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            message: err.message || 'An error occurred while adding the product',
        });
    }
};

// Get all products (Public access)
const getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find();

        // Ensure all product image URLs are fully qualified
        const updatedProducts = products.map(product => {
            return {
                ...product.toObject(), // Convert Mongoose object to plain object
                image: product.image.startsWith('/uploads') 
                    ? `${baseUrl}${product.image}` 
                    : product.image
            };
        });

        res.status(200).json({ status: responseMsgs.SUCCESS, data: updatedProducts });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

const getProductsByStock = async (req, res) => {
    try {
        // Find products with stock > 0 and sort by stock in ascending order
        const products = await ProductModel.find({ stock: { $gt: 0 } }).sort({ stock: 1 });
        res.status(200).json({ status: "success", data: products });
    } catch (err) {
        res.status(500).json({
            status: "fail",
            data: err.message,
        });
    }
};


const addStock = async (req, res) => {
    const { productId } = req.params;
    const { additionalStock } = req.body; // The number of units to add to the stock

    try {
        // Validate that the additionalStock is a valid number
        if (isNaN(additionalStock) || additionalStock <= 0) {
            return res.status(400).json({ message: 'Invalid stock quantity' });
        }

        const product = await ProductModel.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Add the additional stock to the existing stock
        product.stock += additionalStock;

        // Save the updated product
        await product.save();

        res.status(200).json({ message: 'Stock updated successfully', data: product });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};





// Get product by ID (Public access)
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                data: 'Product not found',
            });
        }

        // Ensure the image URL is fully qualified
        product.image = product.image.startsWith('/uploads') 
            ? `${baseUrl}${product.image}` 
            : product.image;

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            data: product,
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        let image;

        // If form-data is used (image file), use req.file.filename
        if (req.file) {
            image = `${baseUrl}/uploads/${req.file.filename}`;
        } else if (req.body.imageUrl) {
            image = req.body.imageUrl;
        }

        if (!image) {
            image = 'https://via.placeholder.com/150'; // Default image URL
        }

        // Validation: Make sure required fields are present
        if (!name || !description || !price || !stock) {
            return res.status(400).json({
                status: responseMsgs.FAIL,
                message: 'Name, description, price, and stock are required fields.',
            });
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            req.params.id,
            { name, description, price, stock, image },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'Product updated successfully',
            data: updatedProduct,
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            message: err.message || 'An error occurred while updating the product',
        });
    }
};

// Delete product by ID (Admin only)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({
                status: responseMsgs.FAIL,
                data: 'Product not found',
            });
        }
        res.status(200).json({
            status: responseMsgs.SUCCESS,
            message: 'Product deleted successfully',
        });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    getProduct,
    getProductsByStock,
    addStock
};
