import { Router } from 'express'
const router = Router()
router.post('/', (req, res) => {
  res.json({ msg: '上传路由正常' })
})
export default router
