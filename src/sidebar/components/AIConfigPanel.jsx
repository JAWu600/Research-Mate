import React, { useState, useEffect } from 'react';
import { RECOMMENDED_MODELS, DEFAULT_CONFIG } from '../config/modelConfig';
import { validateSiliconFlowKey } from '../utils/AIModelApi';

export default function AIConfigPanel() {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CONFIG.modelId);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_CONFIG.maxTokens);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    try {
        // 从 Chrome Storage 加载配置
        chrome.storage.local.get(
        ['siliconflowApiKey', 'selectedModel', 'maxTokens'],
        (result) => {
            if (result.siliconflowApiKey) setApiKey(result.siliconflowApiKey);
            if (result.selectedModel) setSelectedModel(result.selectedModel);
            if (result.maxTokens) setMaxTokens(result.maxTokens);
        }
        );
    } catch (error) {
        console.warn('[AIConfig] 无法读取存储配置:', error.message);
      }
    }, []);

  /**
   * 保存配置
   */
  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert('请输入硅基流动 API Key');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // 验证 API Key
      const isValid = await validateSiliconFlowKey(apiKey.trim());
      
      if (!isValid) {
        setValidationResult({ 
          success: false, 
          message: '❌ API Key 无效，请检查后重试' 
        });
        setIsValidating(false);
        return;
      }

      // 保存配置
      chrome.storage.local.set(
        {
          siliconflowApiKey: apiKey.trim(),
          selectedModel: selectedModel,
          maxTokens: parseInt(maxTokens)
        },
        () => {
          setValidationResult({ 
            success: true, 
            message: '✅ 配置已保存成功' 
          });
          setIsValidating(false);
          
          setTimeout(() => setValidationResult(null), 3000);
        }
      );
    } catch (error) {
      setValidationResult({ 
        success: false, 
        message: `❌ 验证失败: ${error.message}` 
      });
      setIsValidating(false);
    }
  };

  const selectedModelInfo = RECOMMENDED_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="ai-config-panel">
      <h3 className="config-title">⚙️ 硅基流动 AI 配置</h3>

      {/* API Key 输入 */}
      <div className="config-section">
        <label className="config-label">硅基流动 API Key</label>
        <div className="input-group">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入您的 SiliconFlow API Key"
            className="config-input"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="toggle-btn"
            title={showApiKey ? '隐藏' : '显示'}
          >
            {showApiKey ? '🙈' : '👁️'}
          </button>
        </div>
        <a
          href="https://cloud.siliconflow.cn/account/ak"
          target="_blank"
          rel="noopener noreferrer"
          className="help-link"
        >
          🔗 获取 API Key（注册即送免费额度）
        </a>
      </div>

      {/* 模型选择 */}
      <div className="config-section">
        <label className="config-label">选择 AI 模型</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="config-select"
        >
          {RECOMMENDED_MODELS.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        
        {selectedModelInfo && (
          <div className="model-info-card">
            <p className="model-description">{selectedModelInfo.description}</p>
            <div className="model-tags">
              {selectedModelInfo.tags.map(tag => (
                <span key={tag} className="model-tag">{tag}</span>
              ))}
            </div>
            <p className="model-context">
              上下文长度: {selectedModelInfo.contextLength.toLocaleString()} tokens
            </p>
          </div>
        )}

        <a
          href="https://siliconflow.cn/models"
          target="_blank"
          rel="noopener noreferrer"
          className="browse-link"
        >
          📚 浏览硅基流动更多模型 →
        </a>
      </div>

      {/* 最大生成长度 */}
      <div className="config-section">
        <label className="config-label">
          最大回答长度: {maxTokens} tokens
        </label>
        <input
          type="range"
          min="512"
          max="4096"
          step="512"
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
          className="config-slider"
        />
        <div className="slider-labels">
          <span>简短</span>
          <span>适中</span>
          <span>详细</span>
        </div>
      </div>

      {/* 保存按钮和状态 */}
      <div className="config-actions">
        <button
          onClick={handleSave}
          disabled={isValidating}
          className="save-config-btn"
        >
          {isValidating ? '⏳ 验证中...' : '💾 保存配置'}
        </button>
        
        {validationResult && (
          <div className={`validation-message ${validationResult.success ? 'success' : 'error'}`}>
            {validationResult.message}
          </div>
        )}
      </div>

      <p className="privacy-note">
        🔒 API Key 仅保存在本地浏览器中，不会上传到任何服务器
      </p>
    </div>
  );
}