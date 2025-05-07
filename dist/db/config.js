import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web3_db';
mongoose.connect(MONGODB_URI)
    .then(() => {
    console.log('MongoDB 连接成功');
})
    .catch((error) => {
    console.error('MongoDB 连接失败:', error);
});
export default mongoose;
