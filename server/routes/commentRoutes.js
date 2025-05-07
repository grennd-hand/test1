import express from 'express';
import Comment from '../models/Comment.js';

const router = express.Router();

// 获取所有评论
router.get('/', async (req, res) => {
  try {
    console.log('收到获取评论请求');
    console.log('请求头:', req.headers);

    // 查询所有评论
    const comments = await Comment.find()
      .sort({ createdAt: -1 });

    console.log(`获取评论成功，返回 ${comments.length} 条评论`);

    // 打印评论数据的简要信息
    if (comments.length > 0) {
      console.log('评论数据简要信息:');
      comments.forEach((comment, index) => {
        console.log(`[${index}] ID: ${comment._id}, 作者: 匿名, 内容: ${comment.content.substring(0, 20)}...`);
      });
    } else {
      console.log('数据库中没有评论');
    }

    res.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ message: '获取评论失败', error: error.message });
  }
});

// 创建评论
router.post('/', async (req, res) => {
  try {
    console.log('收到创建评论请求');
    console.log('请求头:', req.headers);
    console.log('请求体:', req.body);

    const { content, tags, media, author, localToken } = req.body;

    if (!content || !content.trim()) {
      console.log('评论内容为空');
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    // 处理媒体数据
    const processedMedia = Array.isArray(media) ? media.map(item => ({
      url: item.url || item,
      type: item.type || 'image',
      filename: item.filename || 'untitled'
    })) : [];

    console.log('处理后的媒体数据:', processedMedia);

    // 没填名字就自动生成
    const displayName = author && author.trim()
      ? author.trim()
      : `匿名赛博人#${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;

    const comment = new Comment({
      content: content.trim(),
      author: displayName,
      tags: Array.isArray(tags) ? tags : [],
      media: processedMedia,
      localToken
    });

    console.log('创建的评论对象:', {
      content: comment.content,
      author: comment.author,
      tags: comment.tags,
      mediaCount: comment.media.length
    });

    await comment.save();
    console.log('评论已保存到数据库');

    res.status(201).json(comment.toObject());
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ message: '创建评论失败，请稍后重试', error: error.message });
  }
});

// 点赞评论
router.put('/like/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    comment.likes = (comment.likes || 0) + 1;
    await comment.save();

    res.json({ likes: comment.likes });
  } catch (error) {
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

    const { content } = req.body;
    // 自动生成匿名名
    const displayName = `匿名赛博人#${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;

    const reply = {
      content,
      author: displayName,
      likes: 0
    };

    comment.replies.push(reply);
    await comment.save();

    res.status(201).json(comment.replies[comment.replies.length - 1]);
  } catch (error) {
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

    reply.likes = (reply.likes || 0) + 1;
    await comment.save();

    res.json({ likes: reply.likes });
  } catch (error) {
    console.error('点赞回复失败:', error);
    res.status(500).json({ message: '点赞回复失败' });
  }
});

// 删除评论
router.delete('/:id', async (req, res) => {
  try {
    const localToken = req.query.localToken;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: '评论不存在' });
    if (!localToken || comment.localToken !== localToken) {
      return res.status(403).json({ message: '无权删除该评论' });
    }
    await comment.deleteOne();
    res.json({ message: '评论已删除' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ message: '删除评论失败' });
  }
});

export default router;