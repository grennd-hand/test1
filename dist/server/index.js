import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import commentRoutes from './routes/comments.js';
import uploadRoutes from './routes/upload.js';
import { errorHandler } from './middleware/errorHandler.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web3_db')
    .then(() => console.log('数据库连接成功'))
    .catch(err => console.error('数据库连接失败:', err));
// 路由
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
// 错误处理
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
