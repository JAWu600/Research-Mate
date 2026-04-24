/**
 * 通用文献网页内容提取器
 * 
 * 策略：
 * 1. 优先使用 Mozilla Readability 算法进行智能提取（抗噪性强，结构识别好）。
 * 2. 如果 Readability 失败，降级使用基于 DOM 标签的启发式提取。
 */

// 注意：确保已安装 @mozilla/readability
// npm install @mozilla/readability
import { Readability } from '@mozilla/readability';

/**
 * 主入口函数：提取论文内容
 * @returns {string} 清理后的纯文本内容
 */
export function extractPaperContent() {
  try {
    // 1. 尝试使用 Readability 提取
    const readabilityResult = extractWithReadability();
    if (readabilityResult && readabilityResult.textContent && readabilityResult.textContent.length > 100) {
      console.log('[Extractor] Successfully extracted using Readability');
      return formatText(readabilityResult.textContent);
    }
  } catch (error) {
    console.warn('[Extractor] Readability extraction failed, falling back to generic extractor.', error);
  }

  // 2. 兜底：使用传统的启发式提取
  console.log('[Extractor] Using generic heuristic extractor');
  return extractWithHeuristics();
}

/**
 * 使用 Mozilla Readability 进行提取
 */
function extractWithReadability() {
  // Readability 需要完整的 document 对象，但不能直接操作当前页面的 document（会破坏页面）
  // 因此我们需要克隆一份 document
  const documentClone = document.cloneNode(true);
  
  // 有些网站需要特定的 baseURI 才能正确解析相对路径的图片等，虽然我们要的是文本，但保持完整性较好
  const uri = window.location.href;

  const reader = new Readability(documentClone, {
    debug: false, // 生产环境关闭调试
    keepClasses: false, // 不需要保留类名，减少体积
  });

  const article = reader.parse();

  return article;
}

/**
 * 传统的启发式提取（兜底方案）
 */
function extractWithHeuristics() {
  // 1. 尝试提取 <article> 标签内容
  const article = document.querySelector('article');
  if (article && isHighQualityContent(article)) {
    return cleanText(article);
  }

  // 2. 尝试提取 <main> 标签内容
  const main = document.querySelector('main');
  if (main && isHighQualityContent(main)) {
    return cleanText(main);
  }

  // 3. 尝试提取常见的论文容器类名
  const paperContainer =
    document.querySelector('.paper-content') ||
    document.querySelector('.article-content') ||
    document.querySelector('.abstract') ||
    document.querySelector('#abstract') ||
    document.querySelector('.entry-content'); // 增加常见博客/文章类名

  if (paperContainer && isHighQualityContent(paperContainer)) {
    return cleanText(paperContainer);
  }

  // 4. 兜底：提取整个 body 文本
  return cleanText(document.body);
}

/**
 * 简单的质量检查，避免抓到一个空的或全是导航的容器
 */
function isHighQualityContent(element) {
  const text = element.innerText || '';
  // 如果文本长度过短，或者包含大量广告关键词，认为质量低
  if (text.length < 50) return false;
  if (text.includes('Advertisement') && text.length < 200) return false;
  return true;
}

/**
 * 清理 DOM 元素中的文本内容
 * - 移除 script、style、nav 等无关标签
 * - 提取纯文本并格式化
 */
function cleanText(element) {
  if (!element) return '';

  // 克隆节点避免修改原始 DOM
  const clone = element.cloneNode(true);

  // 移除不需要的标签 (增加了 aside, form, button 等)
  const removeTags = [
    'script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe', 
    'aside', 'form', 'button', 'input', 'select', 'option', 'svg', 'img'
  ];
  
  removeTags.forEach((tag) => {
    const elements = clone.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  // 移除空属性或隐藏元素 (可选优化)
  const hiddenElements = clone.querySelectorAll('[hidden], [style*="display:none"], [style*="visibility:hidden"]');
  hiddenElements.forEach(el => el.remove());

  // 提取文本内容
  const text = clone.innerText || clone.textContent;
  
  return formatText(text);
}

/**
 * 格式化文本：清理多余空白、空行
 */
function formatText(text) {
  if (!text) return '';

  return text
    .replace(/\r\n/g, '\n')       // 统一换行符
    .replace(/\n{3,}/g, '\n\n')   // 多个空行合并为两个换行（段落间隔）
    .replace(/[ \t]+/g, ' ')      // 多个空格/制表符合并为一个空格
    .trim();                      // 去除首尾空白
}