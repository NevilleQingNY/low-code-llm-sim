# Low-Code LLM Workflow Builder

## 简介

Low-Code LLM Workflow Builder 是一个简单而强大的低代码平台，允许用户通过图形化界面创建和管理 AI 工作流。该项目利用最新的语言模型技术，使用户能够轻松构建复杂的 AI 驱动流程，而无需深入编码。

🔗 [在线演示](https://low-code-llm-sim.vercel.app/)

## 特性

- 📊 直观的拖拽界面，用于创建工作流
- 🤖 支持多种 AI 模型选择
- 💬 自定义提示（Prompt）配置
- 🖼️ 支持图片上传和处理
- 🔗 灵活的节点连接系统
- 🎨 美观的用户界面，基于现代 Web 技术

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI
- Vercel AI SDK
- React Flow

## 快速开始

1. 克隆仓库
   ```
   git clone https://github.com/NevilleQingNY/low-code-llm-sim
   ```

2. 安装依赖
   ```
   cd low-code-llm-sim
   pnpm install
   ```

3. 运行开发服务器
   ```
   pnpm dev
   ```

4. 在浏览器中打开 `http://localhost:3000`

## 使用指南

1. **创建工作流**：
   - 拖拽节点到画布上创建工作流
   - 可选节点类型：输入节点、处理节点、输出节点

2. **配置节点**：
   - 为工作流命名
   - 设置 Prompt
   - 选择 AI 模型

3. **建立连接**：
   - 使用连接线连接各个节点
   - 在输出节点上点击 "Get Connected" 按钮完成工作流设置

4. **运行工作流**：
   - 输入数据或上传图片
   - 启动工作流并查看结果


## 联系我们

如有任何问题或建议，请开启一个 issue 或直接联系项目维护者。
