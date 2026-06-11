import React, { useState } from 'react';
import './App.css';
import ExtractButton from './components/ExtractButton';
import UploadPdfButton from './components/UploadPdfButton';
import ContentDisplay from './components/ContentDisplay';
import TopNavBar from './components/TopNavBar';
import WelcomeScreen from './components/WelcomeScreen';
import MultiPlatformConfigPanel from './components/MultiPlatformConfigPanel';
import AIChatPanel from './components/AIChatPanel';
import { extractTextFromPDF } from '../utils/pdfParser'; 
import { useExtensionMessage } from './hooks/useExtensionMessage';

export default function App() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentFunction, setCurrentFunction] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('siliconflow');
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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

  const handleNavAction = (item) => {
    console.log('[App] Nav action:', item.action, 'platform:', item.platform);
    switch (item.action) {
      case 'handleAiLiterature':
        setCurrentFunction('ai-literature');
        break;
        
      case 'handleOpenUrl':
        if (item.url) {
          window.open(item.url, '_blank');
        }
        break;
        
      case 'handleThemeToggle':
        const newTheme = !isDarkTheme;
        setIsDarkTheme(newTheme);
        document.body.classList.toggle('dark-theme', newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        break;
        
      case 'handleAIConfig':
        if (item.platform) {
          setSelectedPlatform(item.platform);
        }
        setCurrentFunction('ai-config');
        break;
        
      default:
        console.warn('未找到对应的处理逻辑:', item.action);
    }
  };

  const handleExtract = () => {
    console.log('[App] 开始提取网页内容');
    setLoading(true);
    setError('');
    setContent('');

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
      }else {
        setError('未收到有效响应，请重试');
        setLoading(false);
      }
    });
  };

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setContent('');

    try {
      console.log('开始解析 PDF...', file.name);
      const text = await extractTextFromPDF(file);
      setContent(text);
      console.log('PDF 解析完成');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      event.target.value = null; 
    }
  };

  return (
    <div className="app-container">
      <TopNavBar onAction={handleNavAction} />

      {!currentFunction ? (
        <WelcomeScreen />
      ) : currentFunction === 'ai-config' ? (
        <MultiPlatformConfigPanel selectedPlatform={selectedPlatform} />
      ) : (
        <>
          <header className="app-header">
            <h2>AI文献解读</h2>
            <p className="subtitle">打开文献网页，或上传文献PDF文件</p>
          </header>

          <div className="controls">
            <ExtractButton onClick={handleExtract} loading={loading} />
            <UploadPdfButton 
              loading={loading} 
              onFileChange={handlePDFUpload} 
            />
          </div>
            
          {error && <div className="error-message">❌ {error}</div>}
          
          <ContentDisplay content={content} loading={loading} />
          
          {content && <AIChatPanel content={content} />}
        </>
      )}
    </div>
  );
}