import { Router } from 'express';
const router = Router();
router.post('/', (req, res) => {
    res.json({ msg: '�ϴ�·������' });
});
export default router;
