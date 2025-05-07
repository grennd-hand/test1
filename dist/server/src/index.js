"use strict";
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');
// 加载环境变量
dotenv.config();
const app = express();
const PORT = process.env.PORT || 9000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fochat';
// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);
// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// 处理JSON解析错误
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: '无效的JSON格式' });
    }
    next(err);
});
// 设置路由
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
// 根路由
app.get('/', (req, res) => {
    res.json({
        message: 'Fochat 吐槽论坛 API 服务器',
        status: 'online',
        endpoints: {
            comments: '/api/comments',
            upload: '/api/upload'
        }
    });
});
// 连接数据库并启动服务器
const startServer = async () => {
    try {
        // 连接数据库
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB 连接成功!');
        // 监听数据库连接事件
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB 连接错误:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB 连接断开，尝试重新连接...');
        });
        // 优雅关闭连接
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB 连接已关闭');
            process.exit(0);
        });
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('数据库连接失败:', error);
        // 尝试重新连接，最多尝试3次
        let retries = 3;
        while (retries > 0) {
            try {
                console.log(`尝试重新连接数据库，剩余尝试次数: ${retries}`);
                await mongoose.connect(MONGODB_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
                console.log('MongoDB 重新连接成功!');
                break;
            }
            catch (err) {
                retries--;
                if (retries === 0) {
                    console.error('数据库连接失败，服务器无法启动');
                    process.exit(1);
                }
                // 等待2秒后重试
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
};
// 导入错误处理中间件
const errorHandler = require('../middleware/errorHandler');
// 全局错误处理
app.use(errorHandler);
// 404处理
app.use((req, res) => {
    res.status(404).json({ message: '请求的资源不存在' });
});
startServer();
