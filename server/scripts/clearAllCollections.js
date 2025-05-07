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

async function clearAllCollections() {
  try {
    console.log('尝试连接到数据库...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('连接成功，准备清空所有集合...');
    
    // 获取所有集合名称
    const collections = await mongoose.connection.db.collections();
    
    // 记录清空结果
    const results = {};
    
    // 依次清空每个集合
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      
      // 跳过系统集合
      if (collectionName.startsWith('system.')) {
        console.log(`跳过系统集合: ${collectionName}`);
        continue;
      }
      
      console.log(`正在清空集合: ${collectionName}`);
      const result = await collection.deleteMany({});
      results[collectionName] = result.deletedCount;
      console.log(`- 已删除 ${result.deletedCount} 条记录`);
    }
    
    console.log('\n清空操作完成！清空结果汇总:');
    for (const [collection, count] of Object.entries(results)) {
      console.log(`- ${collection}: 删除了 ${count} 条记录`);
    }
    
  } catch (error) {
    console.error('清空数据时出错:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
}

// 执行清空操作
clearAllCollections();
