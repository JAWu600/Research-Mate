/**
 * 文本预处理工具
 * 用于清理、优化提取的文献内容
 */

/**
 * 清理文本中的噪声
 * @param {string} text - 原始文本
 * @returns {string} 清理后的文本
 */
export function cleanText(text) {
    if (!text) return '';
  
    let cleaned = text;
  
    // 1. 移除过多的连续空白字符（保留单个换行）
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
    // 2. 移除 HTML 标签残留
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  
    // 3. 移除常见的网页噪声模式
    cleaned = cleaned.replace(/Copyright\s+\d{4}.*/gi, '');
    cleaned = cleaned.replace(/All rights reserved.*/gi, '');
    cleaned = cleaned.replace(/References\s*$/gi, '');
  
    // 4. 移除过短的行（可能是页眉页脚）
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      // 保留长度大于 10 字符的行，或者包含标点符号的行
      return trimmed.length > 10 || /[.!?。！？]/.test(trimmed);
    });
    cleaned = filteredLines.join('\n');
  
    // 5. 合并连续的短行
    cleaned = cleaned.replace(/\n([^\n]{1,50})\n([^\n]{1,50})\n/g, '\n$1 $2\n');
  
    // 6. 移除过多的连续相同字符（如 "999999" 或 "but but but"）
    cleaned = cleaned.replace(/(\S)\1{20,}/g, '$1');
    cleaned = cleaned.replace(/\b(\w+)\s+\1\s+\1(?:\s+\1){2,}\b/g, '$1');
  
    return cleaned.trim();
  }