import React, { useState, useEffect } from 'react';
import { callSiliconFlow } from '../utils/AIModelApi';
import { DEFAULT_SYSTEM_PROMPT, getModelById } from '../config/modelConfig';
import { buildOptimizedPrompt, estimateTokenCount } from '../utils/textProcessor';

export default function AIChatPanel({ content }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    try {
      chrome.storage.local.get(
        ['siliconflowApiKey', 'selectedModel', 'maxTokens'],
        (result) => {
          if (result.siliconflowApiKey && result.selectedModel) {
            const modelInfo = getModelById(result.selectedModel);
            
            if (!modelInfo) {
              console.error('[AIChat] 未找到模型配置:', result.selectedModel);
              return;
            }

            setConfig({
              apiKey: result.siliconflowApiKey,
              modelId: modelInfo.modelId,
              contextLength: modelInfo.contextLength,
              maxTokens: result.maxTokens || 2048
            });
            
            console.log('[AIChat] 配置加载成功:', {
              modelId: modelInfo.modelId,
              modelName: modelInfo.name,
              contextLength: modelInfo.contextLength
            });
          }
        }
      );
    } catch (error) {
      console.warn('[AIChat] 无法读取存储配置:', error.message);
    }
  }, []);

  const handleSend = async () => {
    if (!userInput.trim()) return;
    
    if (!config) {
      alert('请先在顶部菜单 "AI模型配置" → "⚙️ 配置面板" 中配置 API Key 和模型');
      return;
    }

    if (!content) {
      alert('请先提取或上传文献内容');
      return;
    }

    setIsLoading(true);
    
    const userMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    try {
      // 使用优化的 Prompt 构建方法
      const { prompt, isTruncated, estimatedTokens } = buildOptimizedPrompt(
        DEFAULT_SYSTEM_PROMPT,
        content,
        userInput,
        config.contextLength
      );

      console.log('[AIChat] Prompt 统计:', {
        原始文献字数: content.length,
        原始文献token: estimateTokenCount(content),
        处理后token: estimatedTokens,
        是否截断: isTruncated,
        模型上下文: config.contextLength
      });

      const aiResponse = await callSiliconFlow(
        config.modelId,
        prompt,
        '', // system prompt 已经包含在 buildOptimizedPrompt 中
        config.apiKey,
        { maxTokens: config.maxTokens }
      );

      const aiMessage = { 
        role: 'assistant', 
        content: aiResponse,
        metadata: {
          isTruncated,
          estimatedTokens
        }
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('AI 调用失败:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'error', 
          content: `❌ 错误：${error.message}\n\n请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. 账户余额是否充足` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  if (!config) {
    return (
      <div className="ai-chat-placeholder">
        <p>⚠️ 请先在顶部菜单 "AI模型配置" → "⚙️ 配置面板" 中配置 API Key 和模型</p>
      </div>
    );
  }

  return (
    <div className="ai-chat-panel">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>💡 针对文献内容提问，例如：</p>
            <ul>
              <li>这篇论文的主要贡献是什么？</li>
              <li>请解释研究方法部分的技术细节</li>
              <li>这篇论文的创新点在哪里？</li>
              <li>总结论文的实验结果</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {msg.role === 'user' ? '👤 您' : '🤖 AI'}
                </span>
                {msg.metadata?.isTruncated && (
                  <span className="truncated-badge">文献已优化</span>
                )}
              </div>
              <div className="message-content">{msg.content}</div>
              {msg.metadata && (
                <div className="message-meta">
                  <small>处理 Token: {msg.metadata.estimatedTokens?.toLocaleString()}</small>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-role">🤖 AI</span>
            </div>
            <div className="message-content">
              <span className="typing-indicator">思考中...</span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="针对文献内容提问...（按 Enter 发送，Shift+Enter 换行）"
          className="chat-input"
          rows={3}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="input-actions">
          <button
            onClick={handleClear}
            disabled={isLoading || messages.length === 0}
            className="clear-btn"
          >
            🗑️ 清空
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !userInput.trim()}
            className="send-btn"
          >
            {isLoading ? '发送中...' : '📤 发送'}
          </button>
        </div>
      </div>
    </div>
  );
}