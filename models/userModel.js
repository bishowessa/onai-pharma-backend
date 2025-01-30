const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    address: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    registeredAt: { type: Date, default: Date.now() },
});

const UserModel = mongoose.model('user', userSchema);

module.exports = UserModel;
