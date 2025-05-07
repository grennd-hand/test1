"use strict";
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Comment = require('../models/Comment');
// 获取所有评论
router.get('/', async (req, res) => {
    try {
        const comments = await Comment.find()
            .sort({ createdAt: -1 });
        res.json(comments);
    }
    catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({ message: '获取评论失败' });
    }
});
// 创建评论
router.post('/', async (req, res) => {
    try {
        const { content, tags, media } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: '评论内容不能为空' });
        }
        // 处理媒体数据
        const processedMedia = Array.isArray(media) ? media.map(item => ({
            url: item.url || item,
            type: item.type || 'image',
            filename: item.filename || 'untitled'
        })) : [];
        const comment = new Comment({
            content: content.trim(),
            author: '匿名',
            tags: Array.isArray(tags) ? tags : [],
            media: processedMedia
        });
        await comment.save();
        res.status(201).json(comment);
    }
    catch (error) {
        console.error('创建评论失败:', error);
        res.status(500).json({ message: '创建评论失败，请稍后重试' });
    }
});
// 点赞评论
router.put('/like/:id', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }
        const likeIndex = comment.likes.indexOf(req.user._id);
        if (likeIndex === -1) {
            comment.likes.push(req.user._id);
        }
        else {
            comment.likes.splice(likeIndex, 1);
        }
        await comment.save();
        res.json({ likes: comment.likes.length });
    }
    catch (error) {
        console.error('点赞失败:', error);
        res.status(500).json({ message: '点赞失败' });
    }
});
// 添加回复
router.post('/:id/reply', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }
        const { content, media } = req.body;
        const reply = {
            content,
            author: '匿名',
            media,
            likes: []
        };
        comment.replies.push(reply);
        await comment.save();
        res.status(201).json(comment.replies[comment.replies.length - 1]);
    }
    catch (error) {
        console.error('回复失败:', error);
        res.status(500).json({ message: '回复失败' });
    }
});
// 点赞回复
router.put('/:commentId/reply/:replyId/like', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }
        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ message: '回复不存在' });
        }
        const likeIndex = reply.likes.indexOf(req.user._id);
        if (likeIndex === -1) {
            reply.likes.push(req.user._id);
        }
        else {
            reply.likes.splice(likeIndex, 1);
        }
        await comment.save();
        res.json({ likes: reply.likes.length });
    }
    catch (error) {
        console.error('点赞回复失败:', error);
        res.status(500).json({ message: '点赞回复失败' });
    }
});
module.exports = router;
