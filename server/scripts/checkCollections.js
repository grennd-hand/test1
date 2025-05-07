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

async function checkCollections() {
  try {
    console.log('尝试连接到数据库...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('连接成功，正在检查集合信息...\n');
    
    // 获取所有集合名称
    const collections = await mongoose.connection.db.collections();
    
    if (collections.length === 0) {
      console.log('数据库中没有集合！');
      return;
    }
    
    console.log(`数据库中共有 ${collections.length} 个集合：`);
    
    // 检查每个集合的文档数量
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      const count = await collection.countDocuments();
      console.log(`- ${collectionName}: ${count} 条记录`);
      
      // 如果集合有数据，显示一个示例文档
      if (count > 0) {
        const sampleDoc = await collection.findOne({});
        console.log(`  示例文档: ${JSON.stringify(sampleDoc, null, 2).substring(0, 150)}...`);
      }
    }
    
  } catch (error) {
    console.error('检查集合时出错:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n数据库连接已关闭');
    process.exit(0);
  }
}

// 执行检查操作
checkCollections();
