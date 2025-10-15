require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const productRoutes = require('./Routes/productRoutes');
const userRoutes = require('./Routes/userRoutes');
const cookieParser = require('cookie-parser');
const orderRoutes = require('./Routes/orderRoutes');
const path = require('path');

const app = express();
app.use(helmet());
// --- CHANGE 1: UPDATED CORS CONFIGURATION FOR DEPLOYMENT ---
const allowedOrigins = [
  'https://onaipharma.me',
  'https://www.onaipharma.me',
  'http://localhost:4200'
];

const corsOptions = {
  // If you are using cookies/credentials, you must specify an origin.
  // A wildcard '*' is not allowed when credentials are true.
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
// -----------------------------------------------------------

// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// --- CHANGE 2: ADDED A FALLBACK PORT FOR LOCAL DEVELOPMENT ---
const PORT = process.env.PORT || 3000;
// -----------------------------------------------------------

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use('/uploads', express.static('uploads')); // Serve static images
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error for debugging
  res.status(500).send('Something broke!');
});