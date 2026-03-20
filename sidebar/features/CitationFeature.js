/**
 * 引用功能 - 使用Crossref API内容协商方案
 * 按需获取引用格式，优化性能和用户体验
 */
export class CitationFeature {
  constructor() {
    this.name = chrome.i18n.getMessage('featureCitation');
    this.doi = null;
    this.metadata = null;
    this.citations = {}; // 缓存已获取的引用格式
  }

  /**
   * 渲染功能UI
   */
  render(container) {
    // 检查是否已有自己的面板存在于容器中（避免重复渲染）
    const existingPanel = container.querySelector('.pra-feature-panel[data-feature="citation"]');
    if (existingPanel) {
      existingPanel.style.display = '';
      existingPanel.classList.add('active');
      return;
    }

    // 创建面板元素并追加到容器（而不是替换整个容器）
    const panel = document.createElement('div');
    panel.className = 'pra-feature-panel active';
    panel.setAttribute('data-feature', 'citation');
    panel.innerHTML = `
      <div class="pra-section-title">${chrome.i18n.getMessage('citationLabel')}</div>

      <div class="pra-info-text" style="margin-bottom: 12px; color: #666; font-size: 13px;">
        ${chrome.i18n.getMessage('autoIdentifyPaper')}
      </div>

      <button id="pra-citation-fetch-btn" class="pra-btn pra-btn-primary" style="width: 100%;">
        ${chrome.i18n.getMessage('fetchPaper')}
      </button>

      <div id="pra-citation-paper-info" style="display: none; margin-top: 16px;">
        <div class="pra-form-group">
          <label class="pra-label">${chrome.i18n.getMessage('paperTitle')}</label>
          <input
            type="text"
            id="pra-citation-title"
            class="pra-input"
            readonly
          >
        </div>

        <div class="pra-form-group">
          <label class="pra-label">DOI</label>
          <input
            type="text"
            id="pra-citation-doi"
            class="pra-input"
            readonly
          >
        </div>

        <div class="pra-form-group">
          <label class="pra-label">${chrome.i18n.getMessage('citationStyle')}</label>
          <select id="pra-citation-style" class="pra-select">
            <option value="apa">${chrome.i18n.getMessage('apaFormat')}</option>
            <option value="mla">${chrome.i18n.getMessage('mlaFormat')}</option>
            <option value="chicago">${chrome.i18n.getMessage('chicagoFormat')}</option>
            <option value="harvard">${chrome.i18n.getMessage('harvardFormat')}</option>
            <option value="ieee">${chrome.i18n.getMessage('ieeeFormat')}</option>
            <option value="vancouver">${chrome.i18n.getMessage('vancouverFormat')}</option>
            <option value="bibtex">${chrome.i18n.getMessage('bibtexFormat')}</option>
          </select>
        </div>

        <div id="pra-citation-result-container" style="display: none;">
          <div class="pra-form-group">
            <label class="pra-label">${chrome.i18n.getMessage('citationResult')}</label>
            <div id="pra-citation-result" class="pra-result-box">
            </div>
          </div>

          <button
            id="pra-citation-copy-btn"
            class="pra-btn pra-btn-secondary"
            style="width: 100%; margin-top: 12px;"
          >
            ${chrome.i18n.getMessage('copyCitation')}
          </button>

          <div style="margin-top: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #666; text-align: center;">
            📚 <a href="https://www.crossref.org" target="_blank" style="color: #1976d2; text-decoration: none;">Crossref</a>
          </div>
        </div>
      </div>

      <div id="pra-citation-error" style="display: none; margin-top: 16px;">
        <div class="pra-error-box"></div>
      </div>
    `;
    container.appendChild(panel);

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const fetchBtn = document.getElementById('pra-citation-fetch-btn');
    const styleSelect = document.getElementById('pra-citation-style');
    const copyBtn = document.getElementById('pra-citation-copy-btn');

    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => this.handleFetchPaperInfo());
    }

    if (styleSelect) {
      styleSelect.addEventListener('change', () => this.handleStyleChange());
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.handleCopy());
    }
  }

  /**
   * 自动识别并获取文献信息
   * 优化：只获取当前选中格式的引用，其他格式按需获取
   */
  async handleFetchPaperInfo() {
    const fetchBtn = document.getElementById('pra-citation-fetch-btn');
    const paperInfoDiv = document.getElementById('pra-citation-paper-info');
    const errorDiv = document.getElementById('pra-citation-error');
    const resultContainer = document.getElementById('pra-citation-result-container');

    // 重置UI
    paperInfoDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    resultContainer.style.display = 'none';

    // 清空缓存的引用
    this.citations = {};

    // 显示加载状态
    fetchBtn.disabled = true;
    fetchBtn.textContent = chrome.i18n.getMessage('identifying');

    try {
      // 第1步：从页面提取DOI
      const doi = this.extractDOI();

      if (!doi) {
        throw new Error(chrome.i18n.getMessage('cannotExtractDOI'));
      }

      this.doi = doi;
      console.log('提取到的DOI:', doi);

      // 第2步：使用DOI从Crossref获取元数据（用于UI显示）
      const metadataResponse = await chrome.runtime.sendMessage({
        action: 'getCitationMetadata',
        doi: doi
      });

      if (metadataResponse.error) {
        throw new Error(metadataResponse.error);
      }

      this.metadata = metadataResponse.data;

      // 显示文献信息
      document.getElementById('pra-citation-title').value = this.metadata.title || chrome.i18n.getMessage('unknownTitle');
      document.getElementById('pra-citation-doi').value = this.doi;
      paperInfoDiv.style.display = 'block';

      // 第3步：只获取当前下拉框选中的那一个格式（按需加载）
      const currentStyle = document.getElementById('pra-citation-style').value;
      await this.fetchSingleCitation(doi, currentStyle);

      // 显示结果
      this.displayCitation(currentStyle);

    } catch (error) {
      console.error('获取文献信息失败:', error);
      errorDiv.style.display = 'block';
      errorDiv.querySelector('.pra-error-box').textContent = error.message;
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = chrome.i18n.getMessage('reIdentifyPaper');
    }
  }

  /**
   * 从页面提取DOI
   * 支持多种常见的DOI元数据标签和格式
   */
  extractDOI() {
    // 1. 检查常见的meta标签
    const metaSelectors = [
      'meta[name="citation_doi"]',
      'meta[name="doi"]',
      'meta[name="DC.identifier"]',
      'meta[property="og:url"]',
      'meta[name="prism.doi"]'
    ];

    for (const selector of metaSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.getAttribute('href');
        if (content && this.isValidDOI(content)) {
          return this.cleanDOI(content);
        }
      }
    }

    // 2. 检查页面内容中的DOI（正则表达式匹配）
    const doiPatterns = [
      /10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+/gi,
      /doi\s*[:=]\s*(10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+)/gi,
      /https?:\/\/dx\.doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+)/gi,
      /https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+)/gi
    ];

    const bodyText = document.body.innerText || document.body.textContent;

    for (const pattern of doiPatterns) {
      const matches = bodyText.match(pattern);
      if (matches) {
        const cleanedDOI = this.cleanDOI(matches[0]);
        if (this.isValidDOI(cleanedDOI)) {
          return cleanedDOI;
        }
      }
    }

    // 3. 检查URL中的DOI
    const urlMatch = window.location.href.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+/i);
    if (urlMatch) {
      return urlMatch[0];
    }

    // 4. 检查HighWire Press格式
    const highwireDOI = document.querySelector('meta[name="citation_doi"]');
    if (highwireDOI) {
      return highwireDOI.getAttribute('content');
    }

    // 5. 检查Dublin Core格式
    const dcDOI = document.querySelector('meta[name="DC.identifier"]');
    if (dcDOI) {
      const content = dcDOI.getAttribute('content');
      if (content && content.includes('10.')) {
        const doiMatch = content.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
        if (doiMatch) {
          return doiMatch[0];
        }
      }
    }

    return null;
  }

  /**
   * 验证DOI格式是否有效
   */
  isValidDOI(doi) {
    if (!doi) return false;
    const doiPattern = /^10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+$/i;
    return doiPattern.test(doi);
  }

  /**
   * 清理DOI字符串
   */
  cleanDOI(doi) {
    if (!doi) return '';
    doi = doi.trim();
    
    // 移除常见前缀
    doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    doi = doi.replace(/^doi:\s*/i, '');
    doi = doi.replace(/^DOI:\s*/i, '');
    
    return doi;
  }

  /**
   * 按需获取单个引用格式
   * 如果已经获取过则直接返回缓存
   */
  async fetchSingleCitation(doi, style) {
    // 如果已经获取过，直接返回缓存
    if (this.citations[style]) {
      return this.citations[style];
    }

    const resultBox = document.getElementById('pra-citation-result');
    resultBox.textContent = chrome.i18n.getMessage('generatingCitation');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getCitation',
        doi: doi,
        style: style
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // 缓存引用（已trim处理）
      this.citations[style] = response.data;
      return this.citations[style];

    } catch (error) {
      console.error(`获取${style}格式引用失败:`, error);
      this.citations[style] = `${chrome.i18n.getMessage('citationFormatFailed')}: ${error.message}`;
      return this.citations[style];
    }
  }

  /**
   * 显示特定格式的引用
   */
  displayCitation(style) {
    const resultContainer = document.getElementById('pra-citation-result-container');
    const resultBox = document.getElementById('pra-citation-result');

    const citation = this.citations[style];

    if (citation) {
      resultBox.textContent = citation;
    } else {
      resultBox.textContent = chrome.i18n.getMessage('citationFormatUnavailable');
    }

    resultContainer.style.display = 'block';
  }

  /**
   * 格式切换处理（按需加载）
   */
  async handleStyleChange() {
    const style = document.getElementById('pra-citation-style').value;

    // 如果切换到了一个还没抓取的样式，现场抓取
    if (!this.citations[style] && this.doi) {
      await this.fetchSingleCitation(this.doi, style);
    }

    this.displayCitation(style);
  }

  /**
   * 复制引用
   */
  async handleCopy() {
    const resultBox = document.getElementById('pra-citation-result');
    const text = resultBox.textContent;

    if (!text || text.includes(chrome.i18n.getMessage('generatingCitation')) || text.includes(chrome.i18n.getMessage('citationFormatFailed'))) {
      alert(chrome.i18n.getMessage('pleaseGetValidCitation'));
      return;
    }

    try {
      // 尝试使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级方案：使用传统的复制方法
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      const copyBtn = document.getElementById('pra-citation-copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = chrome.i18n.getMessage('copied');
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      alert(chrome.i18n.getMessage('copyFailed'));
    }
  }

  /**
   * 销毁功能
   */
  destroy() {
    // 清理资源
    this.citations = {};
  }
}
