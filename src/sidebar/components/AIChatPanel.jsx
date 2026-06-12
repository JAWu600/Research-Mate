import React, { useState, useEffect, useRef } from 'react';
import { callAI } from '../utils/AIModelApi';
import { DEFAULT_SYSTEM_PROMPT, getModelById } from '../config/modelConfig';

export default function AIChatPanel({ content }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [collapsedMessages, setCollapsedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    try {
      chrome.storage.local.get(
        ['aiPlatform', 'siliconflowApiKey', 'groqApiKey', 'selectedModel', 'maxTokens'],
        (result) => {
          const platform = result.aiPlatform || 'siliconflow';
          const apiKeyField = platform === 'groq' ? 'groqApiKey' : 'siliconflowApiKey';
          const apiKey = result[apiKeyField];
          
          if (apiKey && result.selectedModel) {
            const modelInfo = getModelById(result.selectedModel);
            
            if (!modelInfo) {
              console.error('[AIChat] 未找到模型配置:', result.selectedModel);
              return;
            }

            setConfig({
              platform: platform,
              apiKey: apiKey,
              modelId: modelInfo.modelId,
              contextLength: modelInfo.contextLength,
              maxTokens: result.maxTokens || 2048
            });
            
            console.log('[AIChat] 配置加载成功:', {
              platform: platform,
              modelId: modelInfo.modelId,
              modelName: modelInfo.name
            });
          }
        }
      );
    } catch (error) {
      console.warn('[AIChat] 无法读取存储配置:', error.message);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && config) {
      chrome.storage.local.set({ chatMessages: messages });
      console.log('[AIChat] 已保存对话记录到存储，消息数:', messages.length);
    }
  }, [messages, config]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleRestoreHistory = () => {
    chrome.storage.local.get(['chatMessages'], (result) => {
      if (result.chatMessages && Array.isArray(result.chatMessages) && result.chatMessages.length > 0) {
        setMessages(result.chatMessages);
        setShowHistory(true);
        setCollapsedMessages(new Set());
        console.log('[AIChat] 已恢复对话记录，消息数:', result.chatMessages.length);
      } else {
        console.log('[AIChat] 没有可恢复的对话记录');
      }
    });
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;
    
    if (!config) {
      alert('请先在顶部菜单 "AI模型配置" 中配置 API Key 和模型');
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
      const fullPrompt = `以下是论文内容：

${content}

请基于以上内容回答我的问题：${userInput}`;

      console.log('[AIChat] 调用 API，平台:', config.platform, '模型:', config.modelId);

      const aiResponse = await callAI(
        config.platform,
        config.modelId,
        fullPrompt,
        DEFAULT_SYSTEM_PROMPT,
        config.apiKey,
        { maxTokens: config.maxTokens }
      );

      const aiMessage = { 
        role: 'assistant', 
        content: aiResponse
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
    setCollapsedMessages(new Set());
    console.log('[AIChat] 已清空显示区域，但保留存储中的历史记录');
  };

  const toggleCollapse = (index) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (!config) {
    return (
      <div className="ai-chat-placeholder">
        <p>⚠️ 请先在顶部菜单 "AI模型配置" 中配置 API Key 和模型</p>
      </div>
    );
  }

  const hasStoredHistory = messages.length === 0;

  return (
    <div className="ai-chat-panel">
      {showHistory && (
        <div className="chat-messages" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>💡 针对文献内容提问，例如：</p>
              <ul>
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
                    {msg.role === 'user' ? '' : '🤖 AI'}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => toggleCollapse(index)}
                      className="collapse-btn"
                      title={collapsedMessages.has(index) ? '展开' : '折叠'}
                    >
                      {collapsedMessages.has(index) ? '▼' : '▲'}
                    </button>
                  )}
                  {msg.role === 'user' && (
                    <span className="message-role user-label">👤 您</span>
                  )}
                </div>
                {(!collapsedMessages.has(index) || msg.role !== 'assistant') && (
                  <div className="message-content">{msg.content}</div>
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
          <div ref={messagesEndRef} />
        </div>
      )}

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
          {hasStoredHistory ? (
            <button
              onClick={handleRestoreHistory}
              className="history-btn"
            >
              💬 恢复对话记录
            </button>
          ) : (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="history-btn"
            >
              {showHistory ? '💬 隐藏对话' : '💬 显示对话'} ({messages.length})
            </button>
          )}
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