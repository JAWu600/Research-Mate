// src/background/index.js
import { MSG_TYPES } from '../utils/messageTypes';

// 点击扩展图标时，打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});


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
        }else {
          // 【新增】找不到活跃标签页时，返回错误响应
          sendResponse({
            type: MSG_TYPES.EXTRACT_ERROR,
            data: { error: '未找到活跃标签页，请先打开文献网页' },
          });
        }
      });
      return true; // 保持通道开启以等待异步响应
    }

    default:
      break;
  }
  
  return false;
});