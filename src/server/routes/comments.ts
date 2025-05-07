import { Router } from 'express'
const router = Router()
// 示例路由
router.get('/', (req, res) => {
  res.json({ msg: '评论路由正常' })
})
export default router
