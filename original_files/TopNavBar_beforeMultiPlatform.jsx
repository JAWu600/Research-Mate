import React, { useState } from 'react';

const MENU_CONFIG = [
  {
    id: 'functions',
    label: '功能',
    items: [
      { id: 'ai-literature', label: 'AI文献解读', action: 'handleAiLiterature' }
    ]
  },
  {
    id: 'ai-models',
    label: 'AI模型配置',
    items: [
      { 
        id: 'siliconflow', 
        label: '硅基流动官网', 
        url: 'https://siliconflow.cn/',
        action: 'handleOpenUrl' 
      },
      {
        id: 'ai-config',
        label: '⚙️ 配置面板',
        action: 'handleAIConfig'
      }
    ]
  },
  {
    id: 'settings',
    label: '设置',
    items: [
      { id: 'theme-toggle', label: '明/暗切换', action: 'handleThemeToggle' }
    ]
  }
];

export default function TopNavBar({ onAction }) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  /**
   * 切换下拉框展开/收起状态
   */
  const toggleDropdown = (menuId) => {
    setActiveDropdown(prev => prev === menuId ? null : menuId);
  };

  /**
   * 关闭所有下拉框
   */
  const closeAllDropdowns = () => {
    setActiveDropdown(null);
  };

  /**
   * 处理菜单项点击
   */
  const handleItemClick = (item) => {
    closeAllDropdowns();
    
    if (onAction) {
      onAction(item);
    }
  };

  return (
    <nav className="top-nav">
      {MENU_CONFIG.map(menu => (
        <div 
          key={menu.id} 
          className="nav-item"
          onClick={() => toggleDropdown(menu.id)}
        >
          <span className="nav-label">{menu.label}</span>
          
          {/* 下拉框 */}
          <div 
            className={`dropdown-menu ${activeDropdown === menu.id ? 'active' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {menu.items.map(item => (
              <div
                key={item.id}
                className="dropdown-item"
                onClick={() => handleItemClick(item)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 点击空白处关闭下拉框 */}
      {activeDropdown && (
        <div 
          className="dropdown-overlay" 
          onClick={closeAllDropdowns}
        />
      )}
    </nav>
  );
}