import React from 'react';

/**
 * PDF 上传按钮组件
 * @param {Object} props
 * @param {boolean} props.loading - 是否处于加载状态
 * @param {function} props.onFileChange - 文件选择后的回调函数
 */
export default function UploadPdfButton({ loading, onFileChange }) {
  return (
    <div className="pdf-upload-wrapper" style={{ flex: 1 }}> {/* 确保 wrapper 也参与 flex 布局 */}
      <label 
        htmlFor="pdf-input" 
        className={`btn pdf-btn ${loading ? 'disabled' : ''}`}
        style={{ width: '100%' }} // 让 label 占满 wrapper
      >
        {loading ? '⏳ 解析PDF中...' : '📄 上传 PDF'}
      </label>
      <input 
        type="file" 
        id="pdf-input" 
        accept=".pdf" 
        onChange={onFileChange} 
        disabled={loading}
        style={{ display: 'none' }} 
      />
    </div>
  );
}