import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const router = express.Router();

// 设置存储引擎
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // 使用相对路径，避免Windows路径问题
    // 注意：由于我们在server目录下运行，所以路径应该是相对于server目录的
    const uploadDir = './uploads';

    console.log('上传目录路径:', uploadDir);
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 文件大小限制 (100MB)
const limits = {
  fileSize: 100 * 1024 * 1024 // 100MB
};

// 设置上传中间件
const upload = multer({
  storage,
  fileFilter,
  limits
});

// 上传单个文件
router.post('/file', upload.single('media'), (req, res) => {
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
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ message: '文件上传失败' });
  }
});

// 上传多个文件
router.post('/files', upload.array('media', 5), (req, res) => {
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
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ message: '文件上传失败' });
  }
});

// 上传头像 - 移除auth中间件进行测试
router.post('/avatar', (req, res, next) => {
  console.log('收到头像上传请求');
  console.log('请求头:', req.headers);
  console.log('请求体:', req.body);
  next();
}, upload.single('avatar'), async (req, res) => {
  try {
    console.log('Multer处理后的请求:', {
      file: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : '无文件',
      body: req.body
    });

    if (!req.file) {
      console.error('没有接收到文件');
      return res.status(400).json({ message: '没有上传文件' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    console.log('生成的头像URL:', avatarUrl);

    res.json({
      message: '头像上传成功',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ message: '头像上传失败', error: error.message });
  }
});

export default router;