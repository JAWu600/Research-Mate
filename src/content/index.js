// src/content/index.js
import { MSG_TYPES } from '../utils/messageTypes';
import { extractPaperContent } from './extractors/genericExtractor';

// 监听来自 Background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  // 只处理提取请求
  if (message.type === MSG_TYPES.EXTRACT_PAPER) {
    
    const url = window.location.href;
    
    // 2. 判断当前页面是否为 PDF 环境
    // 注意：这里只是简单的启发式判断，更准确的判断由 findPdfUrl 是否返回结果决定
    const isPdfEnvironment = url.toLowerCase().endsWith('.pdf') || url.includes('/pdf/');

    if (isPdfEnvironment) {
      // --- 处理 PDF 提取 (异步委托给 Background) ---
      handlePdfExtraction(sendResponse);
    } else {
      // --- 处理普通 HTML 提取 (同步本地执行) ---
      handleHtmlExtraction(sendResponse);
    }
    
    // 3. 关键：无论哪种情况，只要涉及异步操作（如 sendMessage 给 background），都要返回 true
    // 为了安全起见，这里统一返回 true，因为 handlePdfExtraction 肯定是异步的
    return true;
  }
  
  return false;
});

/**
 * 处理 HTML 提取
 */
function handleHtmlExtraction(sendResponse) {
  try {
    const content = extractPaperContent();
    sendResponse({
      type: MSG_TYPES.EXTRACT_RESULT,
      data: { content },
    });
  } catch (error) {
    sendResponse({
      type: MSG_TYPES.EXTRACT_ERROR,
      data: { error: error.message },
    });
  }
}