import * as pdfjsLib from 'pdfjs-dist';
const WORKER_PATH = chrome.runtime.getURL('libs/pdf.worker.min.mjs');

pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_PATH;
// 【关键步骤】设置 Worker 源为 CDN
// 注意：这里的版本号建议与你 package.json 中安装的 pdfjs-dist 版本保持一致
// 如果版本不匹配，可能会报错。你可以去 https://cdnjs.com/libraries/pdf.js 查看最新版本
// const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.js';

// pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

/**
 * 从本地 File 对象中提取文本
 * @param {File} file - 用户选择的 PDF 文件
 * @returns {Promise<string>} - 提取出的纯文本
 */
export const extractTextFromPDF = async (file) => {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('请选择有效的 PDF 文件');
  }

  try {
    // 1. 将文件读取为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 2. 加载 PDF 文档
    // disableFontFace: 防止在某些环境下字体渲染问题导致报错
    // useSystemFonts: 尝试使用系统字体
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      disableFontFace: true, 
      useSystemFonts: true 
    });
    
    const pdfDocument = await loadingTask.promise;

    let fullText = '';
    const totalPages = pdfDocument.numPages;

    // 3. 逐页提取文本
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // 将该页的所有文本项拼接，增加换行符以保持基本格式
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
      
      // 清理页面资源，防止内存泄漏
      page.cleanup();
    }

    return fullText;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF 解析失败: ${error.message}`);
  }
};