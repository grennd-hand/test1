"use strict";
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
// 设置存储引擎
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('不支持的文件类型'), false);
    }
};
// 文件大小限制 (5MB)
const limits = {
    fileSize: 5 * 1024 * 1024
};
// 设置上传中间件
const upload = multer({
    storage,
    fileFilter,
    limits
});
// 导入认证中间件
const auth = require('../middleware/auth');
// 上传单个文件
router.post('/file', auth, upload.single('media'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '没有上传文件' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        res.json({
            message: '上传成功',
            file: {
                filename: req.file.filename,
                url: fileUrl,
                type: fileType
            }
        });
    }
    catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ message: '文件上传失败' });
    }
});
// 上传多个文件
router.post('/files', auth, upload.array('media', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: '没有上传文件' });
        }
        const files = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/${file.filename}`,
            type: file.mimetype.startsWith('image/') ? 'image' : 'video'
        }));
        res.json({
            message: '上传成功',
            files: files
        });
    }
    catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ message: '文件上传失败' });
    }
});
// 上传头像
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '没有上传文件' });
        }
        const avatarUrl = `/uploads/${req.file.filename}`;
        // 更新用户头像
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
module.exports = router;
