/**
 * 全局错误处理中间件
 * 统一处理应用中的错误并返回适当的响应
 */

const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // 处理Multer错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超出限制' });
    }
    return res.status(400).json({ message: `上传错误: ${err.message}` });
  }

  // 处理MongoDB错误
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) { // 重复键错误
      return res.status(400).json({ message: '数据已存在，请勿重复提交' });
    }
    return res.status(500).json({ message: '数据库操作失败' });
  }

  // 处理验证错误
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // 默认错误响应
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || '服务器内部错误',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;