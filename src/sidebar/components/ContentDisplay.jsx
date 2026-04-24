import React from 'react';

export default function ContentDisplay({ content, loading }) {
  return (
    <div className="content-display">
      <label className="content-label">提取内容：</label>
      {loading && <div className="loading-indicator">正在提取文献内容，请稍候...</div>}
      <textarea
        className="content-textarea"
        value={content}
        readOnly
        placeholder="点击上方按钮提取文献内容..."
        rows={20}
      />
      {content && (
        <div className="content-stats">
          字数：{content.length} | 行数：{content.split('\n').length}
        </div>
      )}
    </div>
  );
}
