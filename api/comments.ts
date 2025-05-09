import type { VercelRequest, VercelResponse } from '@vercel/node'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

// 防止多次连接
let conn: typeof mongoose | null = null
async function connectDB() {
  if (conn) return conn
  conn = await mongoose.connect(MONGODB_URI)
  return conn
}

// 定义 Comment schema
const CommentSchema = new mongoose.Schema({
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
})
const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const comments = await Comment.find().sort({ createdAt: -1 })
      res.json(comments)
    } else if (req.method === 'POST') {
      const { content, author } = req.body
      if (!content) {
        res.status(400).json({ msg: '内容不能为空' })
        return
      }
      const comment = await Comment.create({ content, author })
      res.status(201).json(comment)
    } else {
      res.status(405).end()
    }
  } catch (error: any) {
    // 全局异常捕获，返回标准 JSON
    res.status(500).json({ message: '服务器内部错误', error: error.message || String(error) })
  }
} 