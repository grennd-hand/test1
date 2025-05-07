import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchComments, createComment, likeComment, addReply, likeReply } from './api.js';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
// 本地存储的键名
const STORAGE_KEY = 'fochat_comments';
// 本地 token 存储键
const LOCAL_TOKEN_KEY = 'fochat_local_token';
// 获取或生成本地 token
function getLocalToken() {
    let token = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (!token) {
        token = uuidv4();
        localStorage.setItem(LOCAL_TOKEN_KEY, token);
    }
    return token;
}
// 默认评论数据
const defaultComments = [];
function App() {
    const [loading, setLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeReplyId, setActiveReplyId] = useState(null);
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
        }
        catch (error) {
            console.error('加载评论数据失败:', error);
            // 设置为空数组
            setComments([]);
        }
        finally {
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
    const saveCommentsToStorage = (updatedComments) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComments));
        }
        catch (error) {
            console.error('保存评论数据失败:', error);
        }
    };
    // 发布评论
    const handleSubmit = async () => {
        if (!newComment.trim())
            return;
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
        }
        catch (error) {
            console.error('发布评论失败:', error);
            alert('发布评论失败，请重试！');
        }
    };
    // 点赞评论
    const handleLike = async (id) => {
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
        }
        catch (error) {
            console.error('点赞失败:', error);
        }
    };
    // 点赞回复
    const handleLikeReply = async (commentId, replyId) => {
        try {
            const result = await likeReply(commentId, replyId);
            const updatedComments = comments.map(comment => {
                if (comment._id === commentId) {
                    const updatedReplies = comment.replies?.map((reply) => {
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
        }
        catch (error) {
            console.error('点赞回复失败:', error);
        }
    };
    // 开始回复
    const handleStartReply = (commentId) => {
        setActiveReplyId(commentId);
        setReplyContent('');
    };
    // 取消回复
    const handleCancelReply = () => {
        setActiveReplyId(null);
        setReplyContent('');
    };
    // 提交回复
    const handleSubmitReply = async (commentId) => {
        if (!replyContent.trim())
            return;
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
        }
        catch (error) {
            console.error('提交回复失败:', error);
            alert('提交回复失败，请重试！');
        }
    };
    // 切换标签
    const toggleTag = (tag) => {
        setSelectedTags((prev) => {
            if (prev.includes(tag)) {
                return prev.filter((t) => t !== tag);
            }
            else {
                return [...prev, tag];
            }
        });
    };
    // 获取延迟动画类
    const getDelayClass = (index) => {
        const delays = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500"];
        return delays[index % delays.length];
    };
    // 格式化日期
    const formatDate = (date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 1)
            return '刚刚';
        if (diffMins < 60)
            return `${diffMins}分钟前`;
        const diffHours = Math.round(diffMins / 60);
        if (diffHours < 24)
            return `${diffHours}小时前`;
        const diffDays = Math.round(diffHours / 24);
        if (diffDays < 30)
            return `${diffDays}天前`;
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    };
    // 删除评论
    const handleDelete = async (commentId) => {
        if (!window.confirm('确定要删除这条评论吗？'))
            return;
        try {
            const res = await fetch(`/api/comments/${commentId}?localToken=${getLocalToken()}`, {
                method: 'DELETE'
            });
            if (!res.ok)
                throw new Error('删除失败');
            await loadCommentsFromServer();
        }
        catch (err) {
            alert('删除失败');
        }
    };
    // 加载中屏幕
    if (loading) {
        return (_jsx("div", { className: `loading-container bg-black ${fadeOut ? 'fadeOut' : ''}`, children: _jsxs("div", { className: "loading-content", children: [_jsxs("div", { className: "loading-logo", children: [_jsx("span", { className: "cyber-text", children: "Fochat\u5410\u69FD\u8BBA\u575B" }), _jsx("div", { className: "text-xs text-cyan-500 font-orbitron mt-2 text-center animate-blink", children: "v1.0.4_beta //\u8D5B\u535A\u7A7A\u95F4\u5410\u69FD\u7CFB\u7EDF" })] }), _jsx("div", { className: "mb-4 text-left w-full", children: _jsx("div", { className: "text-xs text-cyan-400 font-orbitron mb-1", children: "\u7CFB\u7EDF\u521D\u59CB\u5316 | SYSTEM INIT" }) }), _jsxs("div", { className: "cyber-progress-container", children: [_jsx("div", { className: "cyber-progress-bar" }), _jsx("div", { className: "cyber-progress-scanline" }), _jsx("div", { className: "cyber-progress-percentage", id: "progress-percentage" })] }), _jsxs("p", { className: "loading-text", children: ["\u795E\u7ECF\u5143\u7F51\u7EDC\u63A5\u5165\u4E2D ", _jsx("span", { className: "animate-pulse", children: "|" })] }), _jsxs("div", { className: "mt-4 text-xs text-left w-full font-mono text-cyan-500/70 space-y-1 border border-cyan-900/30 p-2 bg-black/50", children: [_jsxs("div", { className: "animate-fadeIn delay-100", children: ["> ", "\u8FDE\u63A5\u6838\u5FC3\u670D\u52A1\u5668..."] }), _jsxs("div", { className: "animate-fadeIn delay-300", children: ["> ", "\u52A0\u8F7D\u7528\u6237\u8BA4\u8BC1\u6A21\u5757..."] }), _jsxs("div", { className: "animate-fadeIn delay-500", children: ["> ", "\u521D\u59CB\u5316\u795E\u7ECF\u754C\u9762..."] }), _jsxs("div", { className: "animate-fadeIn delay-700", children: ["> ", "\u5EFA\u7ACB\u91CF\u5B50\u901A\u4FE1\u94FE\u8DEF..."] }), _jsxs("div", { className: "animate-fadeIn delay-900 text-pink-400/70", children: ["> ", "\u51C6\u5907\u5B8C\u6BD5\uFF0C\u6B22\u8FCE\u8BBF\u95EE\u8D5B\u535A\u7A7A\u95F4"] })] })] }) }));
    }
    // 主页面
    return (_jsxs("div", { className: "min-h-screen bg-gray-900 text-white", children: [_jsx(ToastContainer, { position: "top-right", autoClose: 3000, hideProgressBar: false, newestOnTop: true, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "dark" }), _jsxs("div", { className: "cyber-bg min-h-screen bg-black bg-opacity-90 text-cyan-300 animate-fadeIn", children: [_jsx("header", { className: "border-b border-cyan-700/30 py-4 bg-gradient-to-r from-black to-blue-900/20", children: _jsx("div", { className: "container mx-auto px-4 flex flex-col items-center max-w-4xl", children: _jsxs("div", { className: "flex flex-col items-center mb-2 relative w-full", children: [_jsx("div", { className: "absolute left-0 top-1/2 -translate-y-1/2 z-10", children: _jsx("span", { className: "text-cyan-400 font-bold", children: "\u533F\u540D" }) }), _jsxs("div", { className: "text-4xl md:text-5xl lg:text-6xl font-bold font-orbitron relative text-center px-12 sm:px-0", children: [_jsx("span", { className: "text-cyan-300 animate-glow whitespace-nowrap title-glow", children: "Fochat" }), _jsx("span", { className: "text-pink-400 whitespace-nowrap title-pink-glow", children: "\u5410\u69FD\u8BBA\u575B" }), _jsx("span", { className: "absolute -inset-x-3 -inset-y-2 bg-gradient-to-r from-cyan-500/5 to-pink-500/5 blur -z-10" })] }), _jsx("div", { className: "text-sm md:text-base text-cyan-300 mt-2 text-center px-4", children: "\u7545\u6240\u6B32\u8A00\u7684\u52A0\u5BC6\u4E16\u754C\uFF0C\u533A\u5757\u94FE\u7231\u597D\u8005\u7684\u7406\u60F3\u5BB6\u56ED" })] }) }) }), _jsxs("main", { className: "container mx-auto px-4 py-6 md:py-8 max-w-4xl", children: [_jsxs("div", { className: "cyber-card p-4 md:p-6 mb-6 md:mb-8", children: [_jsxs("h2", { className: "text-lg md:text-xl font-bold text-cyan-300 mb-4 font-orbitron", children: ["\u8111\u8FDE\u63A5\u6A21\u5F0F", _jsx("span", { className: "text-pink-400 animate-pulse", children: "_" })] }), _jsx("div", { className: "mb-4", children: _jsx("textarea", { className: "cyber-input w-full p-3 rounded text-base", rows: 4, placeholder: "\u9700\u8981\u8111\u673A\u63A5\u53E3\u9A8C\u8BC1...", value: newComment, onChange: (e) => setNewComment(e.target.value) }) }), _jsx("input", { className: "cyber-input w-full p-2 mb-3 rounded", placeholder: "\u8F93\u5165\u4F60\u7684\u540D\u5B57\uFF08\u53EF\u9009\uFF09", value: newAuthor, onChange: e => setNewAuthor(e.target.value) }), _jsxs("div", { className: "mb-4 overflow-x-auto", children: [_jsx("div", { className: "text-sm text-cyan-300 mb-2 font-orbitron", children: "\u795E\u7ECF\u89E6\u70B9\uFF1A" }), _jsx("div", { className: "flex flex-wrap gap-2 min-w-max pb-2", children: availableTags.map((tag, idx) => (_jsxs("button", { onClick: () => toggleTag(tag), className: `px-2 py-1 text-xs rounded border ${selectedTags.includes(tag)
                                                        ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-400/30'
                                                        : 'border-cyan-800/30 text-cyan-400 hover:border-cyan-600'} transition-all duration-300`, children: ["#", tag] }, `tag-${tag}-${idx}`))) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "relative", children: [_jsx("button", { className: "text-cyan-400 hover:text-cyan-300", onClick: () => setShowEmojiPicker(!showEmojiPicker), children: _jsx("span", { className: "text-xl", children: "\uD83D\uDE0A" }) }), showEmojiPicker && (_jsx("div", { className: "absolute bottom-10 left-0 bg-black/90 border border-cyan-800 p-2 rounded shadow-lg shadow-cyan-900/30 z-50 flex flex-wrap gap-2 w-64", children: emojis.map(emoji => (_jsx("button", { className: "text-2xl hover:bg-cyan-900/40 w-10 h-10 rounded flex items-center justify-center", onClick: () => {
                                                                setNewComment(prev => prev + emoji);
                                                                setShowEmojiPicker(false);
                                                            }, children: emoji }, emoji))) }))] }), _jsx("button", { className: `cyber-button ${!newComment.trim()
                                                    ? 'cyber-button-disabled'
                                                    : ''}`, onClick: handleSubmit, children: _jsx("span", { className: "font-orbitron tracking-wider", children: "\u53D1\u5C04" }) })] })] }), _jsx("div", { className: "flex flex-col space-y-4 md:space-y-6", children: isLoadingComments ? (_jsxs("div", { className: "text-center py-8 md:py-10", children: [_jsx("div", { className: "w-10 h-10 md:w-12 md:h-12 border-4 border-cyan-700 border-t-cyan-300 rounded-full animate-spin mx-auto" }), _jsx("p", { className: "mt-2 text-cyan-400 text-sm md:text-base", children: "\u94FE\u63A5\u91CF\u5B50\u901A\u9053\u4E2D..." })] })) : comments.length > 0 ? (comments.map((comment, index) => (_jsxs("div", { className: `cyber-comment p-3 md:p-5 mb-2 md:mb-4 ${getDelayClass(index)}`, children: [_jsxs("div", { className: "flex flex-wrap justify-between mb-3 gap-2", children: [_jsx("div", { className: "font-bold text-cyan-300 cursor-pointer hover:text-cyan-200 hover:animate-glitch", children: comment.author }), _jsx("div", { className: "text-cyan-400 text-sm", children: comment.time })] }), _jsx("div", { className: "mb-3 text-cyan-50 break-words", children: comment.content }), comment.tags && comment.tags.length > 0 && (_jsx("div", { className: "mb-3 flex flex-wrap gap-1", children: comment.tags.map((tag, idx) => (_jsxs("span", { className: "px-1.5 py-0.5 text-xs bg-cyan-900/20 border border-cyan-700/30 rounded text-cyan-300", children: ["#", tag] }, `tag-${tag}-${idx}`))) })), _jsxs("div", { className: "flex flex-wrap gap-4 mb-4", children: [_jsxs("button", { className: "flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors", onClick: () => handleLike(comment._id), title: "点赞", children: [_jsx("span", { children: "\uD83D\uDC4D" }), _jsx("span", { children: comment.likes })] }), _jsxs("button", { className: "flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors", onClick: () => handleStartReply(comment._id), title: "回复", children: [_jsx("span", { children: "\uD83D\uDCAC" }), _jsx("span", { children: "\u56DE\u590D" })] })] }), activeReplyId === comment._id && (_jsxs("div", { className: "mb-4 p-3 border border-cyan-800/30 rounded bg-blue-900/10", children: [_jsx("textarea", { className: "cyber-input w-full p-3 mb-3 rounded", rows: 3, placeholder: "\u5199\u4E0B\u4F60\u7684\u8D5B\u535A\u56DE\u590D...", value: replyContent, onChange: (e) => setReplyContent(e.target.value) }), _jsxs("div", { className: "flex justify-end mt-3 space-x-2", children: [_jsx("button", { className: "px-3 py-1 bg-red-900/50 border border-red-700/50 text-red-300 text-sm rounded hover:bg-red-800/50 transition-colors", onClick: handleCancelReply, children: "\u53D6\u6D88" }), _jsx("button", { className: `px-3 py-1 bg-cyan-900/50 border border-cyan-700/50 text-cyan-300 text-sm rounded hover:bg-cyan-800/50 transition-colors ${!replyContent.trim()
                                                                ? 'opacity-50 cursor-not-allowed'
                                                                : ''}`, onClick: () => handleSubmitReply(comment._id), disabled: !replyContent.trim(), children: "\u53D1\u9001" })] })] })), comment.replies && comment.replies.length > 0 && (_jsx("div", { className: "mt-2 md:mt-4 space-y-2 md:space-y-3", children: comment.replies.map((reply) => (_jsxs("div", { className: "cyber-reply p-2 md:p-3", children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("div", { className: "font-bold text-pink-300 cursor-pointer hover:text-pink-200 hover:animate-glitch", children: reply.author }), _jsx("div", { className: "text-pink-400 text-xs", children: reply.time })] }), _jsx("div", { className: "mb-2 text-pink-50", children: reply.content }), _jsxs("button", { className: "flex items-center space-x-1 text-pink-400 hover:text-pink-300 transition-colors text-sm", onClick: () => handleLikeReply(comment._id, reply._id), children: [_jsx("span", { children: "\uD83D\uDC4D" }), _jsx("span", { children: reply.likes })] })] }, reply._id))) })), getLocalToken() === comment.localToken && (_jsx("button", { className: "ml-2 px-2 py-1 text-xs bg-red-900/60 border border-red-700/50 text-red-300 rounded hover:bg-red-800/70 transition-colors", onClick: () => handleDelete(comment._id), children: "\u5220\u9664" }))] }, comment._id)))) : (_jsxs("div", { className: "text-center py-10 text-cyan-400 border border-cyan-900/30 rounded-lg p-8 bg-black/20", children: [_jsx("div", { className: "text-2xl mb-2 font-orbitron animate-glow", children: "\u865A\u65E0\u7A7A\u95F4" }), _jsx("p", { children: "\u91CF\u5B50\u7F51\u7EDC\u6682\u65E0\u6570\u636E\uFF0C\u6210\u4E3A\u7B2C\u4E00\u4E2A\u8FDE\u63A5\u8005\u5427" })] })) })] }), _jsx("footer", { className: "mt-16 text-center border-t border-cyan-900/30 py-6 bg-black/50", children: _jsxs("div", { className: "container mx-auto max-w-4xl", children: [_jsxs("p", { className: "text-cyan-400 mb-1", children: ["\u00A9 ", new Date().getFullYear(), _jsxs("span", { className: "font-orbitron mx-2", children: [_jsx("span", { className: "footer-logo-cyan", children: "Fochat" }), _jsx("span", { className: "footer-logo-pink", children: "\u5410\u69FD\u8BBA\u575B" })] }), "- \u8D5B\u535A\u7A7A\u95F4\u7684\u795E\u7ECF\u5143\u96C6\u5408\u4F53"] }), _jsx("p", { className: "text-xs text-cyan-500", children: "\u6570\u5B57\u8352\u539F\u4E2D\u7684\u5410\u69FD\u7EFF\u6D32" })] }) })] })] }));
}
export default App;
