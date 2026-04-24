
## 文件目录结构

```Paper-Reading-Assistant/
├── public/
│   └── manifest.json              # Edge 扩展清单文件
├── src/
│   ├── sidebar/                   # 侧边栏 React 应用
│   │   ├── index.html             # 侧边栏入口 HTML
│   │   ├── main.jsx               # React 入口
│   │   ├── App.jsx                # 主组件
│   │   ├── App.css                # 样式
│   │   ├── components/
│   │   │   ├── ExtractButton.jsx  # 提取按钮组件
│   │   │   └── ContentDisplay.jsx # 内容显示文本框组件
│   │   └── hooks/
│   │       └── useExtensionMessage.js  # 扩展消息通信 Hook
│   ├── background/
│   │   └── index.js               # Background Service Worker
│   ├── content/
│   │   ├── index.js               # Content Script 入口
│   │   └── extractors/
│   │       ├── genericExtractor.js # 通用网页提取器
│   │       └── pdfExtractor.js  # PDF形式网页提取器
│   └── utils/
│       └── messageTypes.js        # 消息类型常量定义
├── vite.config.js                 # Vite 配置（多入口打包）
├── package.json
└── README.md
```