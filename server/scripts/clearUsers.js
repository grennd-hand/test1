import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fochat';

async function clearUsers() {
  try {
    console.log('尝试连接到数据库...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('连接成功，准备清空用户集合...');
    
    // 直接使用mongoose删除所有用户
    const result = await mongoose.connection.collection('users').deleteMany({});
    
    console.log(`成功删除了 ${result.deletedCount} 个用户记录`);
    console.log('用户数据已清空！');
  } catch (error) {
    console.error('清空用户数据时出错:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
}

// 执行清空操作
clearUsers();
