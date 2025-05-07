// 清除本地存储中的评论数据
localStorage.removeItem('fochat_comments');

// 清除其他可能的缓存数据
localStorage.removeItem('comments');
localStorage.removeItem('cachedComments');

console.log('本地存储的评论数据已清除！');
