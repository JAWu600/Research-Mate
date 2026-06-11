import React, { useState, useEffect } from 'react';
import { 
  PLATFORM_CONFIG,
  getModelsByPlatform
} from '../config/modelConfig';
import { validateApiKey } from '../utils/AIModelApi';

export default function MultiPlatformConfigPanel({ selectedPlatform }) {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const currentPlatformConfig = PLATFORM_CONFIG[selectedPlatform];
  const availableModels = getModelsByPlatform(selectedPlatform);

  useEffect(() => {
    // 从 Chrome Storage 加载配置
    chrome.storage.local.get(
      ['siliconflowApiKey', 'groqApiKey', 'selectedModel', 'maxTokens', 'aiPlatform'],
      (result) => {
        // 根据平台加载对应的 API Key
        const apiKeyField = selectedPlatform === 'groq' ? 'groqApiKey' : 'siliconflowApiKey';
        if (result[apiKeyField]) setApiKey(result[apiKeyField]);
        
        // 如果保存的模型属于当前平台，则加载
        if (result.selectedModel) {
          const modelInfo = availableModels.find(m => m.id === result.selectedModel);
          if (modelInfo) {
            setSelectedModel(result.selectedModel);
          } else if (availableModels.length > 0) {
            // 否则选择该平台的第一个模型
            setSelectedModel(availableModels[0].id);
          }
        } else if (availableModels.length > 0) {
          setSelectedModel(availableModels[0].id);
        }
        
        if (result.maxTokens) setMaxTokens(result.maxTokens);
      }
    );
  }, [selectedPlatform, availableModels]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert(`请输入 ${currentPlatformConfig.name} API Key`);
      return;
    }

    if (!selectedModel) {
      alert('请选择一个模型');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const isValid = await validateApiKey(selectedPlatform, apiKey.trim());
      
      if (!isValid) {
        setValidationResult({ 
          success: false, 
          message: `❌ ${currentPlatformConfig.name} API Key 无效，请检查后重试` 
        });
        setIsValidating(false);
        return;
      }

      const apiKeyField = selectedPlatform === 'groq' ? 'groqApiKey' : 'siliconflowApiKey';
      
      chrome.storage.local.set(
        {
          aiPlatform: selectedPlatform,
          [apiKeyField]: apiKey.trim(),
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

  const selectedModelInfo = availableModels.find(m => m.id === selectedModel);

  return (
    <div className="ai-config-panel">
      <h3 className="config-title">⚙️ {currentPlatformConfig.displayName} 配置</h3>

      <p className="platform-description">
        {currentPlatformConfig.description}
      </p>

      {/* API Key 输入 */}
      <div className="config-section">
        <label className="config-label">{currentPlatformConfig.name} API Key</label>
        <div className="input-group">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`输入您的 ${currentPlatformConfig.name} API Key`}
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
          href={currentPlatformConfig.apiKeyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="help-link"
        >
          🔗 获取 API Key
        </a>
      </div>

      {/* 模型选择 */}
      <div className="config-section">
        <label className="config-label">选择 AI 模型（预设为免费模型，或有一定免费额度）</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="config-select"
        >
          <option value="">-- 请选择模型 --</option>
          {availableModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        
        {selectedModelInfo && (
          <div className="model-info-card">
            <p className="model-context">
              上下文长度: {selectedModelInfo.contextLength.toLocaleString()} tokens
            </p>
          </div>
        )}

        <a
          href={currentPlatformConfig.modelsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="browse-link"
        >
          📚 浏览更多模型 →
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