"use strict";
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    avatar: {
        type: String,
        default: '/default-avatar.png'
    },
    posts: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    bio: {
        type: String,
        default: '',
        maxlength: 200
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// 密码加密中间件
userSchema.pre('save', async function (next) {
    // 只有当密码被修改时才重新加密
    if (!this.isModified('password'))
        return next();
    try {
        // 生成盐
        const salt = await bcrypt.genSalt(10);
        // 加密密码
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// 验证密码的方法
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model('User', userSchema);
module.exports = User;
