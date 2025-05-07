import { Router } from 'express';
const router = Router();
// ʾ��·��
router.get('/', (req, res) => {
    res.json({ msg: '����·������' });
});
export default router;
