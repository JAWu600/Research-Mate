import React, { useState } from 'react';
import { getAvailablePlatforms } from '../config/modelConfig';

const MENU_CONFIG = [
  {
    id: 'functions',
    label: '功能',
    items: [
      { id: 'ai-literature', label: 'AI文献解读', action: 'handleAiLiterature' }
    ]
  },
  {
    id: 'settings',
    label: '设置',
    items: [
      { id: 'theme-toggle', label: '明/暗主题切换', action: 'handleThemeToggle' }
    ]
  }
];

export default function TopNavBar({ onAction }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // 动态获取所有可用平台
  const platforms = getAvailablePlatforms();

  const toggleDropdown = (menuId) => {
    setActiveDropdown(prev => prev === menuId ? null : menuId);
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
  };

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

      {/* AI模型配置 - 动态生成平台列表 */}
      <div 
        className="nav-item"
        onClick={() => toggleDropdown('ai-models')}
      >
        <span className="nav-label">AI模型配置</span>
        
        <div 
          className={`dropdown-menu ${activeDropdown === 'ai-models' ? 'active' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {platforms.map(platform => (
            <div
              key={platform.id}
              className="dropdown-item"
              onClick={() => handleItemClick({
                id: platform.id,
                label: platform.displayName,
                action: 'handleAIConfig',
                platform: platform.id
              })}
            >
              {platform.displayName}
              {platform.requiresProxy && <span className="proxy-indicator"> 🔒</span>}
            </div>
          ))}
        </div>
      </div>

      {activeDropdown && (
        <div 
          className="dropdown-overlay" 
          onClick={closeAllDropdowns}
        />
      )}
    </nav>
  );
}