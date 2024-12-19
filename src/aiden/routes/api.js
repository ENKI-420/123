import express from 'express';
const router = express.Router();

router.get('/health', (req, res) => {
res.status(200).json({ message: 'healthy' });
});

router.get('/chatgpt', (req, res) => {
try {
    return res.redirect('https://chatgpt.com/g/g-673b2d9ab8e081918641aa2586e99c67-aiden');
} catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ error: 'Failed to process redirect' });
}
});

export default router;

