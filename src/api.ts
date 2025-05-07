/**
 * API 服务
 * 用于连接后端服务器进行数据交互
 */

const API_URL = 'http://localhost:9000/api';

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    return await response.json();
  } catch (error) {
    console.error('API错误:', error);
    throw error;
  }
};

// 获取所有评论
export const fetchComments = async () => {
  try {
    console.log('开始获取评论数据');

    // 发送请求
    console.log('发送请求到:', `${API_URL}/comments`);
    const response = await fetch(`${API_URL}/comments`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`获取评论失败: ${response.status} ${response.statusText}`);
    }

    // 获取响应内容
    const responseText = await response.text();
    console.log('原始响应内容长度:', responseText.length);

    // 尝试解析为JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('解析后的评论数据:', data);
      console.log(`成功获取 ${data.length} 条评论`);
    } catch (e) {
      console.error('响应不是有效的JSON:', e);
      throw new Error(`获取评论失败: 服务器返回了无效的响应 (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error('获取评论API错误:', error);
    throw error;
  }
};

// 创建新评论
export const createComment = async (commentData: any) => {
  try {
    console.log('发送评论数据:', commentData); // 调试日志

    // 发送请求
    console.log('发送请求到:', `${API_URL}/comments`);
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    console.log('响应状态:', response.status, response.statusText);

    // 获取响应内容
    const responseText = await response.text();
    console.log('原始响应内容:', responseText);

    // 尝试解析为JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('解析后的响应数据:', data);
    } catch (e) {
      console.error('响应不是有效的JSON:', e);
      throw new Error(`发布评论失败: 服务器返回了无效的响应 (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data.message || `发布评论失败 (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error('API错误:', error);
    throw error;
  }
};

// 点赞评论
export const likeComment = async (commentId: any) => {
  try {
    const response = await fetch(`${API_URL}/comments/like/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('点赞失败');
    }

    return await response.json();
  } catch (error) {
    console.error('API错误:', error);
    throw error;
  }
};

// 添加回复
export const addReply = async (commentId: any, replyData: any) => {
  try {
    console.log('发送回复数据:', replyData); // 调试日志

    const response = await fetch(`${API_URL}/comments/${commentId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replyData),
    });

    if (!response.ok) {
      throw new Error('回复失败');
    }

    return await response.json();
  } catch (error) {
    console.error('API错误:', error);
    throw error;
  }
};

// 点赞回复
export const likeReply = async (commentId: any, replyId: any) => {
  try {
    const response = await fetch(`${API_URL}/comments/${commentId}/reply/${replyId}/like`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('点赞回复失败');
    }

    return await response.json();
  } catch (error) {
    console.error('API错误:', error);
    throw error;
  }
};

// 上传单个文件
export const uploadFile = async (file: any) => {
  try {
    const formData = new FormData();
    formData.append('media', file);

    const response = await fetch(`${API_URL}/upload/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('文件上传失败');
    }

    return await response.json();
  } catch (error) {
    console.error('API错误:', error);
    throw error;
  }
};

// 上传多个文件
export const uploadFiles = async (files: any) => {
  try {
    const formData = new FormData();

    // 添加多个文件到同一个键名下
    for (let i = 0; i < files.length; i++) {
      formData.append('media', files[i]);
    }

    const response = await fetch(`${API_URL}/upload/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('文件上传失败');
    }

    const result = await response.json();
    console.log('文件上传结果:', result); // 调试日志
    return result;
  } catch (error) {
    console.error('API错误:', error);
    throw error;
  }
};

// 上传头像
export const uploadAvatar = async (file: any) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    console.log('准备上传头像:', {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name
    });

    const uploadUrl = `${API_URL}/upload/avatar`;
    console.log('发送头像上传请求到:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: formData
    });

    console.log('上传响应状态:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('上传失败响应:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `上传失败 (${response.status})`);
    }

    const data = await response.json();
    console.log('上传成功响应:', data);
    return data;
  } catch (error) {
    console.error('上传头像失败:', error);
    throw error;
  }
};

// 更新用户信息
export const updateUserProfile = async (userId: any, updates: any) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('更新失败');
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
};