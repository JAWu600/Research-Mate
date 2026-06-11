/**
 * AI模型API网站封装
 * 
 * 支持硅基流动（SiliconFlow）和 Groq
 */

// ==========================================
// 硅基流动（SiliconFlow）API
// ==========================================

const SILICONFLOW_API_BASE = 'https://api.siliconflow.cn/v1/chat/completions';

/**
 * 调用硅基流动 API
 * @param {string} modelId - 模型 ID
 * @param {string} fullPrompt - 完整的提示词
 * @param {string} systemPrompt - 系统提示词（可选）
 * @param {string} apiKey - API Key
 * @param {object} options - 可选参数
 * @returns {Promise<string>} AI 生成的文本
 */
export async function callSiliconFlow(modelId, fullPrompt, systemPrompt, apiKey, options = {}) {
  const {
    maxTokens = 2048,
    temperature = 0.7,
    topP = 0.95,
    retryCount = 3
  } = options;

  const messages = [];
  
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: fullPrompt });

  const payload = {
    model: modelId,
    messages: messages,
    max_tokens: maxTokens,
    temperature: temperature,
    top_p: topP,
    stream: false
  };

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[SiliconFlow] 尝试第 ${attempt} 次调用...`);
      
      const response = await fetch(SILICONFLOW_API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('API Key 无效或已过期');
        } else if (response.status === 429) {
          throw new Error('请求频率超限，请稍后重试');
        } else if (response.status === 500) {
          throw new Error('服务器内部错误，请稍后重试');
        }
        
        throw new Error(
          `API 请求失败 (${response.status}): ${errorData.error?.message || errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('API 返回格式异常');
      }

    } catch (error) {
      console.error(`[SiliconFlow] 第 ${attempt} 次尝试失败:`, error);
      
      if (attempt === retryCount) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * 验证硅基流动 API Key 是否有效
 */
export async function validateSiliconFlowKey(apiKey) {
  try {
    const response = await fetch(SILICONFLOW_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[SiliconFlow] API Key 验证失败:', error);
    return false;
  }
}

// ==========================================
// Groq API
// ==========================================

const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * 调用 Groq API
 * @param {string} modelId - 模型 ID
 * @param {string} fullPrompt - 完整的提示词
 * @param {string} systemPrompt - 系统提示词（可选）
 * @param {string} apiKey - API Key
 * @param {object} options - 可选参数
 * @returns {Promise<string>} AI 生成的文本
 */
export async function callGroq(modelId, fullPrompt, systemPrompt, apiKey, options = {}) {
  const {
    maxTokens = 2048,
    temperature = 0.7,
    retryCount = 3
  } = options;

  const messages = [];
  
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: fullPrompt });

  const payload = {
    model: modelId,
    messages: messages,
    max_tokens: maxTokens,
    temperature: temperature,
    stream: false
  };

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Groq] 尝试第 ${attempt} 次调用...`);
      
      const response = await fetch(GROQ_API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('API Key 无效或已过期');
        } else if (response.status === 429) {
          throw new Error('请求频率超限，请稍后重试');
        }
        
        throw new Error(
          `API 请求失败 (${response.status}): ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('API 返回格式异常');
      }

    } catch (error) {
      console.error(`[Groq] 第 ${attempt} 次尝试失败:`, error);
      
      if (attempt === retryCount) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * 验证 Groq API Key 是否有效
 */
export async function validateGroqKey(apiKey) {
  try {
    const response = await fetch(GROQ_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[Groq] API Key 验证失败:', error);
    return false;
  }
}

// ==========================================
// 统一的 API 调用入口（便于扩展）
// ==========================================

/**
 * 根据平台调用对应的 API
 * @param {string} platform - 平台名称 ('siliconflow' | 'groq')
 * @param {string} modelId - 模型 ID
 * @param {string} fullPrompt - 完整提示词
 * @param {string} systemPrompt - 系统提示词
 * @param {string} apiKey - API Key
 * @param {object} options - 可选参数
 * @returns {Promise<string>} AI 生成的文本
 */
export async function callAI(platform, modelId, fullPrompt, systemPrompt, apiKey, options = {}) {
  switch (platform.toLowerCase()) {
    case 'siliconflow':
      return await callSiliconFlow(modelId, fullPrompt, systemPrompt, apiKey, options);
    case 'groq':
      return await callGroq(modelId, fullPrompt, systemPrompt, apiKey, options);
    default:
      throw new Error(`不支持的 AI 平台: ${platform}`);
  }
}

/**
 * 根据平台验证 API Key
 * @param {string} platform - 平台名称
 * @param {string} apiKey - API Key
 * @returns {Promise<boolean>} 是否有效
 */
export async function validateApiKey(platform, apiKey) {
  switch (platform.toLowerCase()) {
    case 'siliconflow':
      return await validateSiliconFlowKey(apiKey);
    case 'groq':
      return await validateGroqKey(apiKey);
    default:
      throw new Error(`不支持的 AI 平台: ${platform}`);
  }
}