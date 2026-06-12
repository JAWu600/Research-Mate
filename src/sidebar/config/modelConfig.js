/**
 * AI 模型配置
 * 支持硅基流动（SiliconFlow）和 Groq
 * 每个平台独立配置模型列表
 */

// ==========================================
// 硅基流动（SiliconFlow）模型配置
// ==========================================

export const SILICONFLOW_MODELS = [
  {
    id: 'sf-deepseek-r1-qwen3-8b',
    name: 'DeepSeek R1 Qwen3 8B',
    modelId: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
    contextLength: 128000,
    tpm: 50000
  },
  {
    id: 'sf-glm-z1-9b',
    name: 'GLM Z1 9B',
    modelId: 'THUDM/GLM-Z1-9B-0414',
    contextLength: 128000,
    tpm: 50000  
  },
  {
    id: 'sf-qwen3-5-4b',
    name: 'Qwen3 5.4B',
    modelId: 'Qwen/Qwen3.5-4B',
    contextLength: 256000,
    tpm: 50000
  },
  {
    id: 'sf-qwen3-8b',
    name: 'Qwen 3 8B',
    modelId: 'Qwen/Qwen3-8B',
    contextLength: 128000,
    tpm: 50000
  },
  {
    id: 'sf-qwen2-7b',
    name: 'Qwen 2.5 7B Instruct',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    contextLength: 32000,
    tpm: 50000
  },
];

// ==========================================
// Groq 模型配置
// ==========================================

export const GROQ_MODELS = [
  {
    id: 'groq-llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B 16E Instruct',
    modelId: 'meta-llama/llama-4-scout-17b-16e-instruct',
    contextLength: 131072,
    tpm: 30000
  },
  {
    id: 'groq-compound',
    name: 'Compound',
    modelId: 'groq/compound',
    contextLength: 131072,
    tpm: 70000
  },
  {
    id: 'groq-compound-mini',
    name: 'Compound Mini',
    modelId: 'groq/compound-mini',
    contextLength: 131072,
    tpm: 70000
  }
];

// ==========================================
// 平台配置信息
// ==========================================

export const PLATFORM_CONFIG = {
  siliconflow: {
    name: '硅基流动',
    displayName: '硅基流动SiliconFlow',
    website: 'https://siliconflow.cn/',
    apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    modelsUrl: 'https://siliconflow.cn/models',
    requiresProxy: false,
    description: '无需翻墙，包含多款免费模型。能够适用于长文献（字数10w以上）。'
  },
  groq: {
    name: 'Groq',
    displayName: 'Groq',
    website: 'https://groq.com/',
    apiKeyUrl: 'https://console.groq.com/keys',
    modelsUrl: 'https://console.groq.com/docs/models',
    requiresProxy: true,
    description: '需要梯子，模型有免费额度。因限速限量严格，适合较短文献（字数6w以下）。'
  }
};

// ==========================================
// 工具函数
// ==========================================

/**
 * 根据平台获取模型列表
 * @param {string} platform - 平台名称 ('siliconflow' | 'groq')
 * @returns {Array} 模型列表
 */
export function getModelsByPlatform(platform) {
  switch (platform.toLowerCase()) {
    case 'siliconflow':
      return SILICONFLOW_MODELS;
    case 'groq':
      return GROQ_MODELS;
    default:
      return [];
  }
}

/**
 * 根据模型 ID 查找模型信息（跨平台搜索）
 * @param {string} Id - 模型 ID
 * @returns {object|null} 模型配置对象
 */
export function getModelById(Id) {
  const allModels = [...SILICONFLOW_MODELS, ...GROQ_MODELS];
  return allModels.find(m => m.id === Id) || null;
}

/**
 * 获取所有可用平台列表
 */
export function getAvailablePlatforms() {
  return Object.keys(PLATFORM_CONFIG).map(key => ({
    id: key,
    ...PLATFORM_CONFIG[key]
  }));
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  platform: 'siliconflow',
  modelId: 'Qwen/Qwen2.5-7B-Instruct',
  maxTokens: 2048,
  temperature: 0.7
};

/**
 * 默认的科研论文阅读助手系统提示词
 */
export const DEFAULT_SYSTEM_PROMPT = `你是一位专业的科研论文阅读助手，擅长帮助用户理解和分析学术论文。

你的职责：
1. 准确理解用户关于论文的问题
2. 基于提供的论文内容进行回答
3. 如果论文中没有相关信息，请明确说明
4. 使用清晰、专业的语言回答
5. 适当引用论文中的具体内容来支持你的回答

请注意：
- 只基于提供的论文内容回答问题，不要编造信息
- 如果问题超出论文范围，请礼貌地告知用户
- 回答要简洁明了，重点突出
- 对于技术术语，可以适当解释`;