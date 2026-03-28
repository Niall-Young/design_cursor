# Design cursor

一个最小可用的浏览器扩展原型，用来解决“先选中网页元素，再把它们作为上下文粘贴进 AI 对话”的工作流痛点。

## 能做什么

- 点击浏览器扩展图标，进入元素选取模式
- 点击网页上的一个或多个元素，把它们加入选择列表
- 一键复制为结构化文本，直接粘贴到 Codex、Cursor、ChatGPT 等对话框
- 复制内容包含：
  - 页面标题和 URL
  - 元素选择器
  - 文本内容
  - 尺寸和位置
  - 一部分关键样式
  - HTML 片段

## 安装

1. 打开 Chrome 或 Edge
2. 进入 `chrome://extensions/`
3. 打开“开发者模式”
4. 选择“加载已解压的扩展程序”
5. 选择这个目录：

```text
/Users/niallyoung/Desktop/design_cursor
```

## 使用

1. 打开你要修改的网站页面
2. 点击扩展图标，或按快捷键

```text
Mac: Command+Shift+Y
Windows: Ctrl+Shift+Y
```

3. 鼠标移到页面元素上会出现蓝色高亮
4. 点击元素即可加入选择，已选元素会变成橙色边框
5. 点右下角浮层里的 `Copy`
6. 把复制结果粘贴到对话框里，然后补一句类似：

```text
请基于我刚刚粘贴的 selected web elements，只修改第 2 个元素，让它的按钮更圆、背景改成品牌绿色，文案改成“立即开始”。
```

## 现在这个版本的边界

这是一个偏 DOM 级别的 MVP，还没有做这些增强项：

- 自动关联本地源码文件
- React/Vue 组件名识别
- 同步截图
- 生成更强的视觉描述
- 与本地 dev server / IDE 深度联动

## 推荐下一步

如果你想把它做成真正好用的“Cursor for web UI”体验，下一阶段建议加这几件事：

1. `元素截图 + DOM + computed styles` 一起复制
2. 在本地开发环境里额外注入 `source map / framework hooks`
3. 识别 React Fiber / Vue component instance，复制组件名和 props
4. 提供 `Copy as prompt`，直接生成适合 AI 修改的指令模板
5. 支持框选多元素，而不只是逐个点选
