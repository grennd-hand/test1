import type { VercelRequest, VercelResponse } from '@vercel/node'

// 内存评论数据，演示用
let comments: any[] = []

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.json(comments)
  } else if (req.method === 'POST') {
    const comment = req.body
    comments.push(comment)
    res.status(201).json(comment)
  } else {
    res.status(405).end()
  }
} 