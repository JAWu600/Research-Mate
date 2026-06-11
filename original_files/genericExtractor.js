/**
 * 通用文献网页内容提取器
 * 优先尝试提取 <article> 标签，其次提取 <main>，最后兜底提取 <body>
 */
export function extractPaperContent() {
    // 1. 尝试提取 <article> 标签内容
    const article = document.querySelector('article');
    if (article) {
      return cleanText(article);
    }
  
    // 2. 尝试提取 <main> 标签内容
    const main = document.querySelector('main');
    if (main) {
      return cleanText(main);
    }
  
    // 3. 尝试提取常见的论文容器类名
    const paperContainer =
      document.querySelector('.paper-content') ||
      document.querySelector('.article-content') ||
      document.querySelector('.abstract') ||
      document.querySelector('#abstract');
  
    if (paperContainer) {
      return cleanText(paperContainer);
    }
  
    // 4. 兜底：提取整个 body 文本
    return cleanText(document.body);
  }
  
  /**
   * 清理 DOM 元素中的文本内容
   * - 移除 script、style、nav 等无关标签
   * - 提取纯文本并格式化
   */
  function cleanText(element) {
    // 克隆节点避免修改原始 DOM
    const clone = element.cloneNode(true);
  
    // 移除不需要的标签
    const removeTags = ['script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe'];
    removeTags.forEach((tag) => {
      clone.querySelectorAll(tag).forEach((el) => el.remove());
    });
  
    // 提取文本内容并清理多余空白
    const text = clone.innerText || clone.textContent;
    return text
      .replace(/\n{3,}/g, '\n\n') // 多个空行合并为一个
      .trim();
  }
  