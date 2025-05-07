"use strict";
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
// 配置 multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('不支持的文件类型'), false);
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
// 导入认证中间件
const auth = require('../middleware/auth');
// 上传头像
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '没有上传文件' });
        }
        const avatarUrl = `/uploads/${req.file.filename}`;
        // 更新用户头像
        req.user.avatar = avatarUrl;
        await req.user.save();
        res.json({
            message: '头像上传成功',
            avatarUrl: avatarUrl
        });
    }
    catch (error) {
        console.error('头像上传失败:', error);
        res.status(500).json({ message: '头像上传失败' });
    }
});
// 更新用户信息
router.patch('/:id', auth, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['username', 'nickname', 'password', 'bio'];
        // 过滤不允许更新的字段
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
            obj[key] = updates[key];
            return obj;
        }, {});
        // 如果更新密码，需要加密
        if (filteredUpdates.password) {
            filteredUpdates.password = await bcrypt.hash(filteredUpdates.password, 10);
        }
        // 更新用户信息
        const user = await User.findByIdAndUpdate(req.params.id, filteredUpdates, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }
        res.json({
            message: '更新成功',
            user: {
                id: user._id,
                username: user.username,
                nickname: user.nickname,
                avatar: user.avatar,
                bio: user.bio
            }
        });
    }
    catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({ message: '更新失败' });
    }
});
module.exports = router;
