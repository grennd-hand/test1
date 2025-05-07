"use strict";
const mongoose = require('mongoose');
// 媒体附件 Schema
const MediaSchema = new mongoose.Schema({
    url: String,
    type: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    filename: String
});
// 回复评论的 Schema
const ReplySchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    media: [MediaSchema],
    likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// 主评论的 Schema
const CommentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    media: [MediaSchema],
    tags: [{
            type: String,
            trim: true
        }],
    likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
    replies: [ReplySchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// 添加格式化时间的方法
CommentSchema.methods.formatCreatedTime = function () {
    const now = new Date();
    const createdAt = this.createdAt;
    const diffMinutes = Math.floor((now - createdAt) / (1000 * 60));
    if (diffMinutes < 1)
        return '刚刚';
    if (diffMinutes < 60)
        return `${diffMinutes}分钟前`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24)
        return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30)
        return `${diffDays}天前`;
    const month = createdAt.getMonth() + 1;
    const day = createdAt.getDate();
    return `${month}月${day}日`;
};
// 同样为回复添加格式化时间的方法
ReplySchema.methods.formatCreatedTime = CommentSchema.methods.formatCreatedTime;
module.exports = mongoose.model('Comment', CommentSchema);
