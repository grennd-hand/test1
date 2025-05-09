import type { VercelRequest, VercelResponse } from '@vercel/node'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string
const DB_NAME = process.env.DB_NAME || 'myapp'

let conn: typeof mongoose | null = null
async function connectDB() {
  if (conn) return conn
  conn = await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  return conn
}

const ReplySchema = new mongoose.Schema({
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 }
})

const CommentSchema = new mongoose.Schema({
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  replies: [ReplySchema]
})
const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB()
    const { commentId, replyId } = req.query
    if (req.method === 'PUT') {
      const comment = await Comment.findById(commentId)
      if (!comment) {
        res.status(404).json({ msg: '评论不存在' })
        return
      }
      const reply = comment.replies.id(replyId)
      if (!reply) {
        res.status(404).json({ msg: '回复不存在' })
        return
      }
      reply.likes = (reply.likes || 0) + 1
      await comment.save()
      res.json({ likes: reply.likes })
    } else {
      res.status(405).end()
    }
  } catch (error: any) {
    res.status(500).json({ message: '服务器内部错误', error: error.message || String(error) })
  }
} 