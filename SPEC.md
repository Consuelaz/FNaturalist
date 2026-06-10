# 徒步博物识别 · 自然笔记 Web App

## 1. Concept & Vision

一款面向徒步爱好者的物种识别与科普记录网站。在徒步过程中拍摄昆虫、植物，即时识别并生成专业科普内容，同时支持个人记录、打卡分享。界面中英双语，新增**亲子英语启蒙计划**模块，将识别结果转化为一周可执行学习任务。

设计风格：参考 quarryman.cn 的简洁博物感，更加现代、有呼吸感，大量留白，自然元素点缀。

## 2. Design Language

### 色彩系统
- **主色**: 鼠尾草绿 `#7D9B76` / 苔藓绿 `#5E7A5C`
- **辅色**: 砂岩褐 `#A67C52`、雾灰 `#F3F4ED`
- **背景**: 奶油白 `#FDFBF7`
- **强调**: 琥珀黄 `#D4A373`
- **文字**: 深绿 `#2D3A2E` / 浅灰 `#6B7280`

### 字体
- 中文标题: 霞鹜文楷 / 思源宋体
- 英文标题: Playfair Display
- 正文: Inter

### 组件风格
- 圆角: `rounded-2xl` 或 `rounded-3xl`
- 阴影: 极浅阴影 + 微弱边框
- 间距: 大量留白
- 动画: 柔和过渡

## 3. Layout & Structure

### 页面结构
1. **首页** - 上传与识别入口
2. **识别结果页** - 物种详情
3. **打卡本** - 历史记录
4. **关于页** - 使用指南

### 识别结果页区块
- A. 物种身份卡
- B. 双语切换按钮
- C. 物种图集（5张）
- D. 科普视频专区
- E. 生长周期画廊
- F. 趣味人文板块
- G. 一周英语启蒙计划

## 4. Features & Interactions

### 核心功能
- 图片上传/拖拽/粘贴
- 移动端拍照优化
- 识别动画状态
- 双语切换
- 识别记录保存
- 分享卡片生成
- 打卡成就系统

### 交互细节
- 上传: 点击/拖拽/粘贴 → 预览 → 自动识别
- 识别中: 叶子旋转动画
- 双语切换: 右上角按钮，点击同步切换
- 启蒙计划: 可折叠卡片，默认收起

## 5. Component Inventory

### UI 组件
- `UploadZone` - 上传区域
- `SpeciesCard` - 物种身份卡
- `ImageCarousel` - 图片轮播
- `VideoSection` - 视频专区
- `LifeCycleGallery` - 生长周期
- `HumanitiesSection` - 人文板块
- `LearningPlan` - 英语启蒙计划
- `RecordCard` - 打卡记录卡
- `LanguageToggle` - 语言切换

## 6. Technical Approach

### 技术栈
- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态**: React Context + IndexedDB (Dexie.js)
- **i18n**: next-intl
- **图标**: lucide-react
- **思维导图**: markmap

### API Routes
- `/api/identify` - 火山引擎识别代理
- `/api/images` - iNaturalist/GBIF 图片代理
- `/api/videos` - YouTube 视频代理

### 数据源
- 火山引擎 - 物种识别
- iNaturalist - 物种图片、生命周期
- GBIF - 媒体库
- YouTube - 科普视频
- Wikipedia - 分类信息

## 7. Development Phases

1. ✅ 项目初始化
2. 首页 UI 与上传逻辑
3. API Routes 搭建
4. 物种详情页
5. 英语启蒙计划
6. 打卡本功能
7. 双语切换
8. 分享功能
9. 部署配置
