import React, { useState, useEffect } from 'react'
import './App.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  fetchComments,
  createComment,
  likeComment,
  addReply,
  likeReply
} from './api.js'
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

type Media = {
  url: string;
  type: 'image' | 'video';
  filename: string;
}

type Comment = {
  _id: string;
  content: string;
  author: string;
  time: string;
  likes: number;
  media?: Media[];
  replies?: Reply[];
  tags?: string[];
  localToken: string;
}

type Reply = {
  _id: string;
  content: string;
  author: string;
  time: string;
  likes: number;
  media?: Media[];
}

// 本地存储的键名
const STORAGE_KEY = 'fochat_comments';

// 本地 token 存储键
const LOCAL_TOKEN_KEY = 'fochat_local_token';

// 获取或生成本地 token
function getLocalToken() {
  let token = localStorage.getItem(LOCAL_TOKEN_KEY);
  if (!token) {
    token = uuidv4();
    localStorage.setItem(LOCAL_TOKEN_KEY, token as string);
  }
  return token as string;
}

// 默认评论数据
const defaultComments: Comment[] = [];

function App() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');

  const availableTags = ["比特币", "以太坊", "NFT", "DeFi", "GameFi", "链游", "元宇宙", "交易所"];
  const emojis = ["😂", "😭", "🤔", "👍", "👎", "🚀", "💰", "💎", "🌙"];

  // 从后端加载评论数据
  const loadCommentsFromServer = async () => {
    setIsLoadingComments(true);
    try {
      console.log('开始从服务器加载评论数据...');
      const commentsData = await fetchComments();
      console.log(`从服务器获取到 ${commentsData.length} 条评论`);
      setComments(commentsData);

      // 保存到本地存储作为备份
      saveCommentsToStorage(commentsData);
    } catch (error) {
      console.error('加载评论数据失败:', error);
      // 设置为空数组
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 初始加载评论
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
    console.log('已清除本地存储的评论数据');

    // 进度条动画时长（2秒）
    const minLoadingTime = 2000;
    const loadingPromise = new Promise(resolve => setTimeout(resolve, minLoadingTime));
    const dataPromise = loadCommentsFromServer();

    Promise.all([loadingPromise, dataPromise]).then(() => {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 800);
    });
  }, []);

  // 将评论数据保存到本地存储作为备份
  const saveCommentsToStorage = (updatedComments: Comment[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComments));
    } catch (error) {
      console.error('保存评论数据失败:', error);
    }
  };

  // 发布评论
  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      // 准备评论数据
      const commentData = {
        content: newComment,
        tags: selectedTags,
        author: newAuthor || undefined,
        localToken: getLocalToken(),
      };

      console.log('准备发送的评论数据:', commentData);

      // 发送到服务器
      await createComment(commentData);
      // 直接刷新评论区
      await loadCommentsFromServer();

      // 清空表单
      setNewComment('');
      setSelectedTags([]);
      setNewAuthor('');
    } catch (error) {
      console.error('发布评论失败:', error);
      alert('发布评论失败，请重试！');
    }
  };

  // 点赞评论
  const handleLike = async (id: string) => {
    try {
      const result = await likeComment(id);

      const updatedComments = comments.map(comment => {
        if (comment._id === id) {
          return { ...comment, likes: result.likes };
        }
        return comment;
      });

      setComments(updatedComments);
      saveCommentsToStorage(updatedComments);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 点赞回复
  const handleLikeReply = async (commentId: string, replyId: string) => {
    try {
      const result = await likeReply(commentId, replyId);

      const updatedComments = comments.map(comment => {
        if (comment._id === commentId) {
          const updatedReplies = comment.replies?.map((reply: any) => {
            if (reply._id === replyId) {
              return { ...reply, likes: result.likes };
            }
            return reply;
          });
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });

      setComments(updatedComments);
      saveCommentsToStorage(updatedComments);
    } catch (error) {
      console.error('点赞回复失败:', error);
    }
  };

  // 开始回复
  const handleStartReply = (commentId: string) => {
    setActiveReplyId(commentId);
    setReplyContent('');
  };

  // 取消回复
  const handleCancelReply = () => {
    setActiveReplyId(null);
    setReplyContent('');
  };

  // 提交回复
  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) return;

    try {
      // 准备回复数据
      const replyData = {
        content: replyContent,
      };

      console.log('准备发送的回复数据:', replyData);

      // 发送到服务器
      const newReplyObj = await addReply(commentId, replyData);
      console.log('从服务器返回的回复数据:', newReplyObj);

      // 更新状态
      const updatedComments = comments.map(comment => {
        if (comment._id === commentId) {
          const updatedReplies = comment.replies ? [...comment.replies, newReplyObj] : [newReplyObj];
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });

      setComments(updatedComments);
      saveCommentsToStorage(updatedComments);

      // 清空表单和关闭回复区域
      setReplyContent('');
      setActiveReplyId(null);
    } catch (error) {
      console.error('提交回复失败:', error);
      alert('提交回复失败，请重试！');
    }
  };

  // 切换标签
  const toggleTag = (tag: any) => {
    setSelectedTags((prev: any[]) => {
      if (prev.includes(tag)) {
        return prev.filter((t: any) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // 获取延迟动画类
  const getDelayClass = (index: number) => {
    const delays = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500"];
    return delays[index % delays.length];
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;

    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}天前`;

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 删除评论
  const handleDelete = async (commentId: string) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}?localToken=${getLocalToken()}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('删除失败');
      await loadCommentsFromServer();
    } catch (err) {
      alert('删除失败');
    }
  };

  // 加载中屏幕
  if (loading) {
    return (
      <div className={`loading-container bg-black ${fadeOut ? 'fadeOut' : ''}`}>
        <div className="loading-content">
          <div className="loading-logo">
            <span className="cyber-text">Fochat吐槽论坛</span>
            <div className="text-xs text-cyan-500 font-orbitron mt-2 text-center animate-blink">
              v1.0.4_beta //赛博空间吐槽系统
            </div>
          </div>

          <div className="mb-4 text-left w-full">
            <div className="text-xs text-cyan-400 font-orbitron mb-1">系统初始化 | SYSTEM INIT</div>
          </div>

          {/* 赛博朋克进度条 */}
          <div className="cyber-progress-container">
            <div className="cyber-progress-bar"></div>
            <div className="cyber-progress-scanline"></div>
            <div className="cyber-progress-percentage" id="progress-percentage"></div>
          </div>

          <p className="loading-text">神经元网络接入中 <span className="animate-pulse">|</span></p>

          <div className="mt-4 text-xs text-left w-full font-mono text-cyan-500/70 space-y-1 border border-cyan-900/30 p-2 bg-black/50">
            <div className="animate-fadeIn delay-100">{"> "}连接核心服务器...</div>
            <div className="animate-fadeIn delay-300">{"> "}加载用户认证模块...</div>
            <div className="animate-fadeIn delay-500">{"> "}初始化神经界面...</div>
            <div className="animate-fadeIn delay-700">{"> "}建立量子通信链路...</div>
            <div className="animate-fadeIn delay-900 text-pink-400/70">{"> "}准备完毕，欢迎访问赛博空间</div>
          </div>
        </div>
      </div>
    );
  }

  // 主页面
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="cyber-bg min-h-screen bg-black bg-opacity-90 text-cyan-300 animate-fadeIn">
        <header className="border-b border-cyan-700/30 py-4 bg-gradient-to-r from-black to-blue-900/20">
          <div className="container mx-auto px-4 flex flex-col items-center max-w-4xl">
            <div className="flex flex-col items-center mb-2 relative w-full">
              {/* 用户认证区域 - 移到左边 */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                <span className="text-cyan-400 font-bold">匿名</span>
              </div>

              <div className="text-4xl md:text-5xl lg:text-6xl font-bold font-orbitron relative text-center px-12 sm:px-0">
                <span className="text-cyan-300 animate-glow whitespace-nowrap title-glow">Fochat</span>
                <span className="text-pink-400 whitespace-nowrap title-pink-glow">吐槽论坛</span>
                <span className="absolute -inset-x-3 -inset-y-2 bg-gradient-to-r from-cyan-500/5 to-pink-500/5 blur -z-10"></span>
              </div>
              <div className="text-sm md:text-base text-cyan-300 mt-2 text-center px-4">畅所欲言的加密世界，区块链爱好者的理想家园</div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
          {/* 发布评论区域 */}
          <div className="cyber-card p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-bold text-cyan-300 mb-4 font-orbitron">脑连接模式<span className="text-pink-400 animate-pulse">_</span></h2>

            {/* 新增名字输入框，移到最上面 */}
            <input
              className="cyber-input w-full p-2 mb-3 rounded"
              placeholder="输入你的名字（可选）"
              value={newAuthor}
              onChange={e => setNewAuthor(e.target.value)}
            />

            <div className="mb-4">
              <textarea
                className="cyber-input w-full p-3 rounded text-base"
                rows={4}
                placeholder="需要脑机接口验证..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
            </div>

            {/* 标签选择 */}
            <div className="mb-4 overflow-x-auto">
              <div className="text-sm text-cyan-300 mb-2 font-orbitron">神经触点：</div>
              <div className="flex flex-wrap gap-2 min-w-max pb-2">
                {availableTags.map((tag: string, idx: number) => (
                  <button
                    key={`tag-${tag}-${idx}`}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 text-xs rounded border ${
                      selectedTags.includes(tag)
                        ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-400/30'
                        : 'border-cyan-800/30 text-cyan-400 hover:border-cyan-600'
                    } transition-all duration-300`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 表情和发布按钮 */}
            <div className="flex justify-between items-center">
              <div className="relative">
                <button
                  className="text-cyan-400 hover:text-cyan-300"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <span className="text-xl">😊</span>
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-10 left-0 bg-black/90 border border-cyan-800 p-2 rounded shadow-lg shadow-cyan-900/30 z-50 flex flex-wrap gap-2 w-64">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        className="text-2xl hover:bg-cyan-900/40 w-10 h-10 rounded flex items-center justify-center"
                        onClick={() => {
                          setNewComment(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className={`cyber-button ${
                  !newComment.trim()
                    ? 'cyber-button-disabled'
                    : ''
                }`}
                onClick={handleSubmit}
              >
                <span className="font-orbitron tracking-wider">发射</span>
              </button>
            </div>
          </div>

          {/* 评论列表 */}
          <div className="flex flex-col space-y-4 md:space-y-6">
            {isLoadingComments ? (
              <div className="text-center py-8 md:py-10">
                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-cyan-700 border-t-cyan-300 rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-cyan-400 text-sm md:text-base">链接量子通道中...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment, index) => (
                <div
                  key={comment._id}
                  className={`cyber-comment p-3 md:p-5 mb-2 md:mb-4 ${getDelayClass(index)}`}
                >
                  <div className="flex flex-wrap justify-between mb-3 gap-2">
                    <div
                      className="font-bold text-cyan-300 cursor-pointer hover:text-cyan-200 hover:animate-glitch"
                    >
                      {comment.author}
                    </div>
                    <div className="text-cyan-400 text-sm">{comment.time}</div>
                  </div>

                  <div className="mb-3 text-cyan-50 break-words">{comment.content}</div>

                  {/* 评论标签 */}
                  {comment.tags && comment.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {comment.tags.map((tag: string, idx: number) => (
                        <span
                          key={`tag-${tag}-${idx}`}
                          className="px-1.5 py-0.5 text-xs bg-cyan-900/20 border border-cyan-700/30 rounded text-cyan-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 mb-4">
                    <button
                      className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      onClick={() => handleLike(comment._id)}
                      title={"点赞"}
                    >
                      <span>👍</span>
                      <span>{comment.likes}</span>
                    </button>

                    <button
                      className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      onClick={() => handleStartReply(comment._id)}
                      title={"回复"}
                    >
                      <span>💬</span>
                      <span>回复</span>
                    </button>
                  </div>

                  {/* 回复表单 */}
                  {activeReplyId === comment._id && (
                    <div className="mb-4 p-3 border border-cyan-800/30 rounded bg-blue-900/10">
                      <textarea
                        className="cyber-input w-full p-3 mb-3 rounded"
                        rows={3}
                        placeholder="写下你的赛博回复..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      ></textarea>

                      <div className="flex justify-end mt-3 space-x-2">
                        <button
                          className="px-3 py-1 bg-red-900/50 border border-red-700/50 text-red-300 text-sm rounded hover:bg-red-800/50 transition-colors"
                          onClick={handleCancelReply}
                        >
                          取消
                        </button>
                        <button
                          className={`px-3 py-1 bg-cyan-900/50 border border-cyan-700/50 text-cyan-300 text-sm rounded hover:bg-cyan-800/50 transition-colors ${
                            !replyContent.trim()
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          onClick={() => handleSubmitReply(comment._id)}
                          disabled={!replyContent.trim()}
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 回复列表 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 md:mt-4 space-y-2 md:space-y-3">
                      {comment.replies.map((reply: any) => (
                        <div key={reply._id} className="cyber-reply p-2 md:p-3">
                          <div className="flex justify-between mb-2">
                            <div
                              className="font-bold text-pink-300 cursor-pointer hover:text-pink-200 hover:animate-glitch"
                            >
                              {reply.author}
                            </div>
                            <div className="text-pink-400 text-xs">{reply.time}</div>
                          </div>

                          <div className="mb-2 text-pink-50">{reply.content}</div>

                          <button
                            className="flex items-center space-x-1 text-pink-400 hover:text-pink-300 transition-colors text-sm"
                            onClick={() => handleLikeReply(comment._id, reply._id)}
                          >
                            <span>👍</span>
                            <span>{reply.likes}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {getLocalToken() === comment.localToken && (
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-red-900/60 border border-red-700/50 text-red-300 rounded hover:bg-red-800/70 transition-colors"
                      onClick={() => handleDelete(comment._id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-cyan-400 border border-cyan-900/30 rounded-lg p-8 bg-black/20">
                <div className="text-2xl mb-2 font-orbitron animate-glow">虚无空间</div>
                <p>量子网络暂无数据，成为第一个连接者吧</p>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-16 text-center border-t border-cyan-900/30 py-6 bg-black/50">
          <div className="container mx-auto max-w-4xl">
            <p className="text-cyan-400 mb-1">© {new Date().getFullYear()}
              <span className="font-orbitron mx-2">
                <span className="footer-logo-cyan">Fochat</span>
                <span className="footer-logo-pink">吐槽论坛</span>
              </span>
              - 赛博空间的神经元集合体
            </p>
            <p className="text-xs text-cyan-500">数字荒原中的吐槽绿洲</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App