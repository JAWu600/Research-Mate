import React from 'react';

export default function ContentDisplay({ content, loading }) {
  return (
    <div className="content-display">
      {loading && <div className="loading-indicator">正在提取文献内容，请稍候...</div>}
      {content && (
        <div className="content-stats">
          字数：{content.length}（注：字数10w以上的长文献回答速度较慢）
        </div>
      )}
    </div>
  );
}
