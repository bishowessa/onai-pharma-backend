require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./Routes/productRoutes');
const userRoutes = require('./Routes/userRoutes');
const cookieParser = require('cookie-parser');
const orderRoutes = require('./Routes/orderRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200',
    withcredentials: true,
    credentials: true
}))

app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
