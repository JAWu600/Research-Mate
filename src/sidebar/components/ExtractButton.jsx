import React from 'react';

export default function ExtractButton({ onClick, loading }) {
  return (
    <button
      className="extract-button"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          提取中...
        </>
      ) : (
        '🔍 提取网页内容'
      )}
    </button>
  );
}
