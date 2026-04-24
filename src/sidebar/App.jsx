import React, { useState } from 'react';
import ExtractButton from './components/ExtractButton';
import ContentDisplay from './components/ContentDisplay';
import { useExtensionMessage } from './hooks/useExtensionMessage';

export default function App() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 监听来自 Background 的消息
  useExtensionMessage((message) => {
    if (message.type === 'EXTRACT_RESULT') {
      setContent(message.data.content);
      setLoading(false);
      setError('');
    } else if (message.type === 'EXTRACT_ERROR') {
      setError(message.data.error);
      setLoading(false);
    }
  });

  const handleExtract = () => {
    setLoading(true);
    setError('');
    setContent('');

    // 发送提取请求到 Background
    chrome.runtime.sendMessage({ type: 'EXTRACT_PAPER' }, (response) => {
      if (chrome.runtime.lastError) {
        setError('通信失败：' + chrome.runtime.lastError.message);
        setLoading(false);
        return;
      }
      if (response?.type === 'EXTRACT_RESULT') {
        setContent(response.data.content);
        setLoading(false);
      } else if (response?.type === 'EXTRACT_ERROR') {
        setError(response.data.error);
        setLoading(false);
      }
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📄 文献阅读助手</h1>
        <p className="subtitle">提取网页文献内容，辅助论文阅读</p>
      </header>

      <main className="app-main">
        <ExtractButton onClick={handleExtract} loading={loading} />
        {error && <div className="error-message">❌ {error}</div>}
        <ContentDisplay content={content} loading={loading} />
      </main>
    </div>
  );
}
