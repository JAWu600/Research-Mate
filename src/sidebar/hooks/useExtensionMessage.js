import { useEffect } from 'react';

/**
 * 自定义 Hook：监听来自 Chrome 扩展的消息
 * @param {Function} handler - 消息处理回调
 */
export function useExtensionMessage(handler) {
  useEffect(() => {
    const listener = (message, sender, sendResponse) => {
      handler(message);
      // 不需要异步响应，返回 false
      return false;
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [handler]);
}
