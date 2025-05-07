import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

// 导入路由
import commentRoutes from '../routes/commentRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';
import errorHandler from '../middleware/errorHandler.js';

// 获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fochat';

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads');
try {
  fs.ensureDirSync(uploadsDir);
  console.log('上传目录已创建/确认:', uploadsDir);

  // 检查目录权限
  fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
  console.log('上传目录权限正常');
} catch (error) {
  console.error('上传目录创建或权限检查失败:', error);
}

// 中间件
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan('dev'));

// 设置静态文件服务
// 注意：由于我们在server目录下运行，所以路径应该是相对于server目录的
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log('静态文件服务路径:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

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

// 全局错误处理
app.use(errorHandler);

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 连接数据库并启动服务器
const startServer = async () => {
  // 无论数据库连接是否成功，都启动服务器
  const server = app.listen(PORT, () => {
  });

  try {
    // 连接数据库
    console.log('尝试连接MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5秒超时
    });
    console.log('MongoDB 连接成功!');

    // 监听数据库连接事件
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB 连接断开，尝试重新连接...');
      setTimeout(() => {
        mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }).catch(err => console.error('重新连接失败:', err));
      }, 3000);
    });

    // 优雅关闭连接
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB 连接已关闭');
      server.close(() => {
        console.log('HTTP服务器已关闭');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('数据库连接失败:', error);
    console.log('服务器将以有限功能模式运行（无数据库）');

    // 设置一个定时任务，每30秒尝试重新连接一次数据库
    const reconnectInterval = setInterval(async () => {
      try {
        console.log('尝试重新连接数据库...');
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        console.log('MongoDB 重新连接成功!');
        clearInterval(reconnectInterval);
      } catch (err) {
        console.error('重新连接失败:', err);
      }
    }, 30000);
  }
};

startServer();