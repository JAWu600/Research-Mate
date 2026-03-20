# 更新日志

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [1.0.2] - 2026-03-20

### 🐛 问题修复

#### AI文献解读对话历史持久化修复
- **问题描述**: 在使用"AI文献解读"功能获得回答并保存历史对话后，切换到其他功能再切换回来，历史对话会消失
- **根本原因**:
  - 原始架构在切换功能时会销毁整个DOM（使用 `container.innerHTML = ''`）
  - 没有实例缓存机制，每次切换都会重新创建功能实例
  - 每个Feature的 `render()` 方法使用 `innerHTML = ...` 替换整个容器内容，导致其他面板被销毁
- **修复方案**:
  - 在 `SidebarManager` 中添加 `featureInstances` 缓存对象，存储各功能实例
  - 修改 `switchFeature()` 方法，使用 `display: none` 隐藏/显示面板，而不是销毁DOM
  - 改进切换逻辑：同时检查缓存实例和DOM中是否存在面板，避免重复渲染
  - 在 `QAFeature` 中添加 `historyData` 数组缓存对话数据
  - 添加 `restoreHistory()` 方法，从缓存数据重建DOM
  - 修改所有Feature的 `render()` 方法，使用 `appendChild(panel)` 替代 `innerHTML = ...`
  - 在 `addToHistory()` 中同时限制数据数组和DOM条目数量为20条
- **修改文件**:
  - `sidebar/SidebarManager.js`: 添加实例缓存和改进切换逻辑
  - `sidebar/features/QAFeature.js`: 添加对话数据缓存和历史恢复机制
  - `sidebar/features/TranslationFeature.js`: 修改 `render()` 方法使用 `appendChild`
  - `sidebar/features/CitationFeature.js`: 修改 `render()` 方法使用 `appendChild`

---

## [1.0.1] - 2026-03-07

### ✨ 新增功能

#### 侧边栏宽度拖动调整
- **功能描述**: 用户可以将鼠标放在侧边栏左侧边沿，鼠标会呈现双箭头光标，通过拖动向左或向右调节侧边栏的显示宽度
- **宽度范围**: 最小 280px，最大 600px，默认 400px
- **宽度记忆**: 侧边栏宽度会自动保存，下次打开时恢复上次的宽度设置
- **字体自适应**: 侧边栏内的字体会根据宽度自动调整大小，提供更好的阅读体验
- **修改文件**:
  - `sidebar/SidebarManager.js`: 添加宽度调整逻辑
  - `content.css`: 添加拖动手柄样式和字体自适应样式

#### API设置窗口深色模式支持
- **功能描述**: API设置弹窗现在会跟随扩展的主题模式（浅色/深色），不再始终显示为浅色模式
- **修改文件**:
  - `sidebar/features/QAFeature.js`: 在创建弹窗时检测当前主题
  - `content.css`: 添加弹窗独立的深色模式样式

### 🔄 修改

#### 扩展名称更新
- 中文名称从"Paper精读全能助手"修改为"**科研助读**"
- 版本号统一更新为 **1.0.1**
- **修改文件**:
  - `_locales/zh_CN/messages.json`: 更新中文名称和版本号
  - `_locales/en/messages.json`: 更新版本号
  - `manifest.json`: 版本号已是 1.0.1（无需修改）

---

## [1.0.0] - 初始版本

### ✨ 功能

#### 🌐 文本翻译
- 多语言翻译支持
- 自动检测源语言
- 多种翻译服务（Google、Bing、LibreTranslate）
- 一键复制到剪贴板

#### 🤖 AI文献解读
- 基于论文内容的智能问答
- 支持 Groq 和 Hugging Face AI 服务商
- 多模型可选
- 对话历史保存

#### 📝 引用生成
- 7种引用格式：APA、MLA、Chicago、Harvard、IEEE、Vancouver、BibTeX
- 一键生成并复制
- 基于 Crossref API
- 自动识别 DOI

#### 🎨 界面体验
- 简洁现代的侧边栏界面
- 浅色/深色主题支持
- 国际化支持（中英文）
- 响应式设计

---

## 图例说明

- ✨ **新增**: 新功能
- 🔄 **修改**: 现有功能的变更
- 🐛 **修复**: 问题修复
- 🗑️ **移除**: 移除的功能
- 🔒 **安全**: 安全性改进
