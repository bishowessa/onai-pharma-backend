const ProductModel = require('../models/productModel');
const responseMsgs = require('../Utilities/responseMsgs');

// Create a new product (Admin only)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        let image;

        // If form-data is used (image file), use req.file.filename
        if (req.file) {
            image = req.file.filename;
        }
        // If raw JSON is used (image URL), use req.body.imageUrl
        else if (req.body.imageUrl) {
            image = req.body.imageUrl;
        }

        // If neither file nor imageUrl is provided, return an error
        if (!image) {
            image = 'https://via.placeholder.com/150';  // Default image URL
        }

        // Validation: Make sure required fields are present
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
            image,  // Store the image (either URL or filename)
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
        res.status(200).json({ status: responseMsgs.SUCCESS, data: products });
    } catch (err) {
        res.status(500).json({
            status: responseMsgs.FAIL,
            data: err.message,
        });
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
            image = req.file.filename;
        }
        // If raw JSON is used (image URL), use req.body.imageUrl
        else if (req.body.imageUrl) {
            image = req.body.imageUrl;
        }

        // If neither file nor imageUrl is provided, return an error
        if (!image) {
            image = 'https://via.placeholder.com/150';  // Default image URL
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
};
