# 自然笔记 - 徒步博物识别 Web App

一款面向徒步爱好者的物种识别与科普记录网站，支持亲子英语启蒙计划。

## ✨ 特色功能

- 📷 **即时物种识别** - 拍摄或上传照片，AI 快速识别
- 📚 **专业科普内容** - 分类信息、图集、科普视频
- 🌍 **中英双语** - 一键切换，深入学习自然词汇
- 📖 **趣味人文** - 诗词典故、博物学冷知识
- 👨‍👩‍👧 **亲子英语启蒙** - 5天学习计划，亲子共学
- 📔 **自然打卡本** - 记录每次发现

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## ⚙️ 环境变量配置

创建 `.env.local` 文件：

```env
# 火山引擎识别 API（可选）
VOLCENGINE_API_KEY=your_volcengine_api_key

# PlantNet API（可选，免费 500次/月）
PLANTNET_API_KEY=your_plantnet_api_key

# YouTube Data API（可选，用于视频搜索）
YOUTUBE_API_KEY=your_youtube_api_key
```

### API 申请地址

- 火山引擎: https://console.volcengine.com/visual/
- PlantNet: https://my.plantnet.org/
- YouTube: https://console.cloud.google.com/

## 📁 项目结构

```
naturalist-next/
├── src/
│   ├── app/              # Next.js App Router 页面
│   │   ├── api/          # API Routes
│   │   ├── journal/      # 打卡本页面
│   │   ├── species/      # 物种详情页面
│   │   └── about/        # 关于页面
│   ├── components/       # React 组件
│   ├── types/            # TypeScript 类型定义
│   └── lib/              # 工具函数
├── public/
│   └── locales/          # 物种故事 JSON
├── tailwind.config.ts    # Tailwind 配置
└── package.json
```

## 🎨 设计规范

### 色彩系统

| 颜色 | 色值 | 用途 |
|------|------|------|
| 鼠尾草绿 | `#7D9B76` | 主色 |
| 苔藓绿 | `#5E7A5C` | 深色变体 |
| 砂岩褐 | `#A67C52` | 辅助色 |
| 奶油白 | `#FDFBF7` | 背景色 |
| 琥珀黄 | `#D4A373` | 强调色 |

### 字体

- 中文标题: 霞鹜文楷 / 思源宋体
- 英文标题: Playfair Display
- 正文: Inter

## 📖 核心技术

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态**: React Context + localStorage
- **图标**: lucide-react

## 📄 License

MIT License
