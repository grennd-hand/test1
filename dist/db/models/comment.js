import mongoose from 'mongoose';
const mediaSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: '匿名',
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    likes: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['visible', 'hidden', 'deleted'],
        default: 'visible'
    },
    edited: {
        type: Boolean,
        default: false
    },
    media: [mediaSchema]
}, {
    timestamps: true
});
// 添加虚拟字段
commentSchema.virtual('likeCount').get(function () {
    return this.likes;
});
// 添加回复计数
commentSchema.virtual('replyCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parent',
    count: true
});
// 查询中间件
commentSchema.pre(/^find/, function (next) {
    this.populate({ path: 'author', select: 'username avatar' });
    next();
});
export const Comment = mongoose.model('Comment', commentSchema);
