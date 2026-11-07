# Design Cursor 商店物料

本套标志使用蓝色圆角底、白色鼠标指针，以及贝塞尔曲线和控制点。16px 版本简化为指针，方便在浏览器工具栏辨认。

## 上传文件

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `store-icon-128.png` | 128×128 | Store icon |
| `screenshot-01-1280x800.png` | 1280×800 | 调整模式 |
| `screenshot-02-1280x800.png` | 1280×800 | 输入要求 |
| `screenshot-03-1280x800.png` | 1280×800 | 排版模式 |
| `small-promo-440x280.png` | 440×280 | Small promo tile |
| `marquee-promo-1400x560.png` | 1400×560 | Marquee promo tile |

以上上传图片均为 RGB PNG，24 位，无透明通道。`design-cursor-store-assets.zip` 包含这六张上传文件。

`preview.png` 为整套预览，`logo-1024.png` 为大尺寸品牌图；这两个文件无需上传至对应商店字段。可选的推广视频字段需要 YouTube 视频链接，本套静态图片不包含视频。

## 可编辑源文件

- `source/logo.svg`：可缩放的矢量 Logo。
- `source/*.svg`：各尺寸物料的排版源文件；功能截图以内嵌 PNG 保存，可离线打开。
- `source/capture-*.png`：当前扩展真实界面的原始捕获。
- `source/workspace.html`：本地示例网页；其中项目内容为制作截图使用的示例内容。

扩展使用的 16、48、128px 图标位于仓库根目录。本次已替换；在扩展管理页重新加载后生效。

## 重新生成

扩展运行本身不需要任何依赖或构建。物料制作脚本另外需要 Node.js、`playwright`、`sharp` 和本机 Chrome。在这些工具已可用的环境中，从仓库根目录运行：

```sh
node assets/store/source/generate.cjs
```

默认 Chrome 路径为 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`，可以通过 `CHROME_EXECUTABLE_PATH` 指定其他路径。脚本只访问本机临时 HTTP 服务，捕获示例页面中运行的当前扩展界面，并覆盖本套生成图片和根目录图标。生成后，从本目录重新打包上传文件：

```sh
zip -j design-cursor-store-assets.zip store-icon-128.png screenshot-0*-1280x800.png small-promo-440x280.png marquee-promo-1400x560.png
```
