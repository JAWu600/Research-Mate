// src/background/index.js
import { MSG_TYPES } from '../utils/messageTypes';
// 1. 引入 pdf.js
import * as pdfjsLib from 'pdfjs-dist';

// 2. 配置 PDF.js Worker (使用 CDN 避免路径问题)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// 点击扩展图标时，打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

/**
 * 辅助函数：在 Background 中下载并解析 PDF
 */
async function fetchAndParsePdf(url) {
  try {
    console.log('[Background] Fetching PDF from:', url);
    
    // 1. 发起请求
    // 添加 headers 模拟浏览器请求，避免被服务器拒绝
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf, */*',
        // 有些服务器检查 User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // 允许重定向 (默认是 follow，但显式声明更清晰)
      redirect: 'follow' 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    // 2. 获取 ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
        throw new Error('下载的 PDF 文件为空');
    }

    console.log(`[Background] PDF downloaded. Size: ${arrayBuffer.byteLength} bytes`);

    // 3. 使用 PDF.js 解析
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    console.log(`[Background] PDF parsed. Pages: ${pdfDocument.numPages}`);

    let fullText = '';
    const maxPages = Math.min(pdfDocument.numPages, 50);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // 优化文本拼接，保留基本空格
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
      
      page.cleanup();
    }

    return fullText;

  } catch (error) {
    console.error('[Background] PDF Parsing Error:', error);
    // 如果是网络错误，提供更详细的提示
    if (error.message.includes('Failed to fetch')) {
        throw new Error('网络请求失败：可能是跨域限制或网络不通。请检查网络连接或尝试刷新页面。');
    }
    throw new Error(`PDF 解析失败: ${error.message}`);
  }
}

// 消息中转：Sidebar <-> Content Script / Background Logic
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, data } = message;

  switch (type) {
    // 情况 A: Sidebar 请求提取文献 -> 转发给 Content Script
    case MSG_TYPES.EXTRACT_PAPER: {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: MSG_TYPES.EXTRACT_PAPER }, (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({
                type: MSG_TYPES.EXTRACT_ERROR,
                data: { error: '无法连接到当前页面，请刷新后重试' },
              });
            } else {
              sendResponse(response);
            }
          });
        }
      });
      return true; // 保持通道开启以等待异步响应
    }

    // 情况 B: Content Script 请求 Background 解析 PDF (解决 CORS 问题)
    case MSG_TYPES.EXTRACT_PDF_FROM_URL: {
      const { url } = data;
      if (!url) {
        sendResponse({
          type: MSG_TYPES.EXTRACT_ERROR,
          data: { error: '未提供 PDF URL' }
        });
        return false;
      }

      // 执行异步解析
      fetchAndParsePdf(url)
        .then((text) => {
          sendResponse({
            type: MSG_TYPES.EXTRACT_RESULT,
            data: { content: text }
          });
        })
        .catch((error) => {
          sendResponse({
            type: MSG_TYPES.EXTRACT_ERROR,
            data: { error: error.message }
          });
        });

      return true; // 关键：表示我们将异步发送响应
    }

    default:
      break;
  }
  
  return false;
});