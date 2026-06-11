/**
 * PDF URL 查找器 (Content Script 专用)
 * 
 * 职责：
 * 仅在当前网页的 DOM 中查找 PDF 文件的 URL。
 * 具体的下载和解析工作已委托给 Background Script 以解决 CORS 问题。
 */

/**
 * 在当前 DOM 中查找 PDF 文件的 URL
 * 支持 <embed>, <object>, <iframe> 以及直接的 PDF 查看器页面
 * @returns {string|null} PDF 的绝对路径 URL，如果未找到则返回 null
 */
export function findPdfUrl() {
  // 1. 检查当前页面是否直接是 PDF (例如 arxiv.org/pdf/xxx.pdf)
  if (window.location.href.toLowerCase().includes('.pdf') || window.location.href.includes('/pdf/') || window.location.href.includes('/pdf.')) {
    return window.location.href;
  }

  // 2. 查找 <embed> 标签
  const embed = document.querySelector('embed[type="application/pdf"]');
  if (embed && embed.src) {
    return resolveUrl(embed.src);
  }

  // 3. 查找 <object> 标签
  const object = document.querySelector('object[type="application/pdf"]');
  if (object && object.data) {
    return resolveUrl(object.data);
  }

  // 4. 查找 <iframe> 标签 (常见于 arXiv, Nature 等)
  // 注意：跨域 iframe 无法直接读取内部内容，但我们可以获取其 src 属性
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    const src = iframe.src;
    // 检查 src 是否指向 PDF 文件
    if (src && (src.toLowerCase().endsWith('.pdf') || src.includes('/pdf/') || src.includes('/pdf.'))) {
      return resolveUrl(src);
    }
  }

  // 5. 查找链接中包含 .pdf 的 <a> 标签 (作为兜底)
  // 优先选择第一个看起来像正文下载的链接
  const links = document.querySelectorAll('a[href$=".pdf"]');
  if (links.length > 0) {
    return resolveUrl(links[0].href);
  }

  return null;
}

/**
 * 将相对路径转换为绝对路径
 * @param {string} url - 可能是相对路径或绝对路径
 * @returns {string} 绝对路径 URL
 */
function resolveUrl(url) {
  try {
    return new URL(url, window.location.origin).href;
  } catch (e) {
    // 如果 URL 格式错误，返回原始字符串
    return url;
  }
}