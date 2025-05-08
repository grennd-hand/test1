import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    res.json({ msg: '上传路由正常' })
  } else {
    res.status(405).end()
  }
} 