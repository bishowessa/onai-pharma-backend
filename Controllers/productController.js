const ProductModel = require('../models/productModel');
const responseMsgs = require('../Utilities/responseMsgs');

// Base URL is no longer needed here for image uploads
// const baseUrl = process.env.BACKEND_URL;

const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        let image;

        if (req.file) {
            // 1. Get the secure URL directly from Cloudinary's response
            image = req.file.path; 
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
            image // 2. Save the Cloudinary URL to the database
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

const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        const updateData = { name, description, price, stock };

        // 3. Check for a new file upload from Cloudinary
        if (req.file) {
            updateData.image = req.file.path;
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
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


// --- NO CHANGES NEEDED FOR THE FUNCTIONS BELOW ---

const getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find();
        res.status(200).json({ status: responseMsgs.SUCCESS, data: products });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
    }
};

const getProductsByStock = async (req, res) => {
    try {
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
    const { additionalStock } = req.body; 

    try {
        if (isNaN(additionalStock) || additionalStock <= 0) {
            return res.status(400).json({ message: 'Invalid stock quantity' });
        }
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        product.stock += Number(additionalStock);
        await product.save();
        res.status(200).json({ message: 'Stock updated successfully', data: product });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

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