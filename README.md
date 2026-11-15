# CyberNaiwa

> 让奶蛙住进每个人的电脑。

CyberNaiwa 是一个以中文互联网迷因「奶蛙」为主题的跨平台桌面宠物。它用 **64×40 的彩色 ASCII 像素网格**逐像素还原奶蛙：黄色大身体、绿色大眼睛、标志性的大笑嘴、奶油色肚皮和棕色小手小脚，再罩一层 CRT 扫描线与霓虹光。

- 透明、无边框、始终置顶的桌宠窗口
- 左键拖动、点击互动、右键原生菜单
- Idle / Walk / Sleep / Happy / Click 五种状态
- 系统托盘显示/隐藏、打开设置、退出
- 设置本地 JSON 持久化，重启后恢复
- 不联网、不注册、无数据库、无遥测
- Windows 与 macOS；GitHub Actions 自动构建

## 预览

![CyberNaiwa 奶蛙 ASCII 预览](docs/preview.png)

角色不是图片贴图，而是 64×40 的彩色 ASCII 字符网格：`#` 黄身体、`O` 绿眼、`@` 瞳孔、`+` 奶油肚皮、`|` 棕色手脚、`_` 大嘴。字符按区域着色，再叠加 CRT 扫描线；窗口尺寸和字号都可以在设置里缩放。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面框架 | Tauri 2 |
| 前端 | React 19 + TypeScript + Vite |
| 样式/角色 | CSS + 64×40 ASCII 帧 + SVG 图标 |
| 原生层 | Rust（托盘、窗口生命周期、退出） |
| 设置 | `tauri-plugin-store` 本地 JSON |
| 包管理 | pnpm（Corepack 可用） |
| CI | GitHub Actions（Windows + macOS） |

## 环境要求

- Node.js 22 LTS 或更新版本
- pnpm 10+（仓库用 `packageManager` 固定版本）
- Rust stable（`rustup`）
- Windows：Visual Studio 2022 C++ 工具链 + Windows 10/11 SDK + WebView2 Runtime
- macOS：Xcode Command Line Tools（`xcode-select --install`）

本机没有 pnpm 时可以用 Corepack：

```bash
corepack enable
corepack pnpm install
```

## 开发

```bash
pnpm install
pnpm tauri dev
```

只启动前端预览（浏览器里不会调用 Tauri API）：

```bash
pnpm dev
# 桌宠页面：http://localhost:1420/?window=pet
# 设置页面：http://localhost:1420/?window=settings
```

## 构建

```bash
# 当前平台，Tauri 配置里的全部 bundle 目标
pnpm tauri build

# 只出 Windows NSIS 安装包
pnpm tauri build --bundles nsis

# 只出 macOS DMG
pnpm tauri build --bundles dmg
```

产物位置：

- Windows：`src-tauri/target/release/bundle/nsis/*.exe`
- macOS：`src-tauri/target/release/bundle/dmg/*.dmg`

## 设置存储

设置通过官方 `tauri-plugin-store` 写入应用数据目录的 `settings.json`：

- Windows：`%APPDATA%\com.cybernaiwa.desktop\settings.json`
- macOS：`~/Library/Application Support/com.cybernaiwa.desktop/settings.json`

文件里有两个键：`settings`（置顶、缩放、动画）和 `windowPosition`（物理像素坐标）。没有云端同步。

## 角色素材

默认角色 `cyber-naiwa` 的 64×40 ASCII 帧在 `src/assets/pets/cyber-naiwa/naiwa-frames.json`，字符 tone、帧间隔和渲染逻辑在 `frames.ts`。角色按本地参考图逐像素映射生成，仓库不包含任何第三方图片文件。

想换成 PNG/WEBP/GIF 皮肤时，按 `src/assets/pets/README.md` 的说明注册 `ImagePetSkin` 即可，渲染器同时支持 ASCII 和图片序列。请不要提交没有 redistribution 权限的素材。

## 设计参考

角色设定参考 [奶蛙百科](https://neta.art/app/milk-frog-wiki)：黄色梨形身体、大片奶油色肚皮、泛绿眼白和小黑瞳、深橄榄褐色长手脚，核心互动是“点一下就狂笑”。CyberNaiwa 的 ASCII 帧是本项目按这些特征做的像素化演绎。

## 平台说明与已知限制

- **Windows**：本机已实际启动和构建验证。透明窗口、无边框、拖动、托盘、设置持久化均按 Windows 路径实现。
- **macOS**：透明窗口依赖 `macOSPrivateApi`，这会限制 Mac App Store 上架；本机无法验证 macOS 运行时，CI 只负责构建 DMG。代码签名与公证尚未配置，正式分发前需要 Apple Developer 证书和 `notarytool`。
- 桌宠窗口对鼠标是整块接收的，透明边缘暂时不能点击穿透；这是 v1 的已知限制。
- 关闭设置窗口只是隐藏，退出应用请使用托盘或右键菜单。
- 点击桌宠会同时触发反馈并开始原生拖动；拖动中会显露出“被抓住”的点击表情。
- 动画关闭后保留点击表情反馈，但不自动走动/睡觉，也不逐帧播放。

## 开源与免责声明

MIT License，见 [LICENSE](LICENSE)。

CyberNaiwa 是粉丝向、非商业的开源项目，灵感来自中文互联网迷因「奶蛙」。奶蛙形象源自 AI 生成与网友二创；本项目与奶龙官方及其权利方无关联。仓库内的 ASCII 角色帧均为本项目原创绘制，不包含第三方图片素材。

## 构建状态

GitHub Actions 工作流在 `.github/workflows/build.yml`，在 Windows 和 macOS Runner 上分别构建 NSIS 安装包和 DMG。签名/公证 secrets 未配置时产物为未签名版本。
