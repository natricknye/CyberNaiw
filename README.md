# 赛博奶蛙

> 让奶娃住进每个奶家人的电脑。

[![build](https://github.com/natricknye/CyberNaiw/actions/workflows/build.yml/badge.svg)](https://github.com/natricknye/CyberNaiw/actions/workflows/build.yml)

**简体中文** | [English](README.en.md)

赛博奶蛙是一只住在你桌面上的奶蛙。它不是一张贴图，而是一块 **最高 128×80 的彩色 ASCII 像素网格**：量子模式用 128×80，原色模式用 112×70。成年是长腿瘦高版，幼体是短圆大头、短手脚；暖黄色身体、浅奶油色大肚皮、浅绿眼环和居中黑瞳，还有一条极短的水平嘴线——点一下就会笑。所有东西都在本地运行，不联网、不注册、不收集数据。

- 透明、无边框、始终置顶的桌宠窗口
- 左键拖动、点击互动、右键原生菜单
- 点击播放对应奶蛙语音，设置里可以静音
- Idle / Walk / Happy / Click / Wave 五种状态
- 成年奶蛙 / 幼体奶蛙，量子模式蓝黑 / 原色模式暖黄两套配色
- 应用界面中文；英文说明保留在 `README.en.md`
- 系统托盘显示/隐藏、打开设置、退出
- 设置本地 JSON 持久化，重启后恢复
- 不联网、不注册、无数据库、无遥测
- Windows 与 macOS；GitHub Actions 自动构建

## 下载

| 平台 | 安装包 | 说明 |
| --- | --- | --- |
| Windows 10/11 x64 | [CyberNaiwa_0.2.2_x64-setup.exe](https://github.com/natricknye/CyberNaiw/releases/download/v0.2.2/CyberNaiwa_0.2.2_x64-setup.exe) | NSIS，当前用户安装，不要求管理员 |
| macOS 11+ Apple Silicon | [CyberNaiwa_0.2.2_aarch64.dmg](https://github.com/natricknye/CyberNaiw/releases/download/v0.2.2/CyberNaiwa_0.2.2_aarch64.dmg) | 未签名/未公证；首次打开需右键 → 打开 |

[所有版本](https://github.com/natricknye/CyberNaiw/releases) · [构建日志](https://github.com/natricknye/CyberNaiw/actions)

安装器也使用幼体原色 ASCII 主题，欢迎页和完成页都是量子蓝黑配色：

<img src="docs/installer.png" alt="赛博奶蛙安装器" width="420" />

> 当前 macOS 包是 **arm64**，Intel Mac 版本待补。Windows/macOS 均未签名：Windows SmartScreen 可能提示，macOS 首次打开请右键选择“打开”。

## 预览

| 量子模式 · 128×80 | 原色模式 · 112×70 |
| --- | --- |
| ![赛博奶蛙 量子模式预览](docs/preview.png) | ![赛博奶蛙 原色模式预览](docs/preview-original.png) |

角色不是图片贴图，而是彩色 ASCII 字符网格：量子模式 128×80、原色模式 112×70。`#` 黄身体、`O` 绿眼、`@` 瞳孔、`+` 奶油肚皮、`|` 橄榄褐手脚、`_` 嘴腔、`=` 牙齿、`*`/`!` 动作高亮；闭嘴帧保留官方源图里的极短嘴线，不额外画鼻/下巴硬线。每个字符背后铺同色实体底，角色内部不会透出桌面，角色外仍然是透明窗口；再叠加 CRT 扫描线，设置里可以缩放。

| 模式 | 选项 |
| --- | --- |
| 成长阶段 | 成年（修长梨形）/ 幼体（短圆大头、短手脚） |
| 配色 | 量子模式（蓝黑 + 青色终端，128×80）/ 原色模式（暖黄 + 奶油 + 橄榄褐，112×70） |
| 动作 | 站立、迈步、开心、点击互动（成年大笑 / 幼体叉腰）、挥手 |

幼体单独预览：

<img src="docs/preview-baby.png" alt="幼体奶蛙" width="360" />

> 默认是「量子模式」。想看原色形态：打开设置 → 「配色」→ 点「原色模式」。上面右图就是原色模式效果。

## 设置页

<img src="docs/settings.png" alt="赛博奶蛙设置页" width="420" />

透明置顶、桌宠大小、成年/幼体、原色模式/量子模式、动画开关和声音开关都在同一个面板里；「关于」按需打开，不占主面板空间。控制台使用量子模式的蓝黑终端配色。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面框架 | Tauri 2 |
| 前端 | React 19 + TypeScript + Vite |
| 样式/角色 | CSS + 128×80/112×70 ASCII 帧 + SVG 图标 |
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

文件里有两个键：`settings`（置顶、缩放、动画、声音、成年/幼体、原色模式/量子模式）和 `windowPosition`（物理像素坐标）。没有云端同步。

## 角色素材

默认角色 `cyber-naiwa` 的原色模式成年帧在 `src/assets/pets/cyber-naiwa/naiwa-frames.json`，幼体帧在 `naiwa-baby-frames.json`（112×70）；量子模式成年/幼体帧在 `naiwa-cyber-frames.json`、`naiwa-cyber-baby-frames.json`（128×80）。每套 5 个状态、每态 2 帧，字符 tone、帧间隔和渲染逻辑在 `frames.ts`。帧由官方设计资料库中的成年 / 幼体 / 大笑 / 挥手参考图逐像素映射生成，仓库不包含参考图片本身。应用图标取自幼体原色 ASCII 待机帧，不再单独绘制。

想换成 PNG/WEBP/GIF 皮肤时，按 `src/assets/pets/README.md` 的说明注册 `ImagePetSkin` 即可，渲染器同时支持 ASCII 和图片序列。请不要提交没有 redistribution 权限的素材。

## 设计参考

角色设定参考奶蛙官方设计资料库与 [奶蛙百科](https://neta.art/app/milk-frog-wiki)：成年是长腿瘦高版，幼体是短圆大头、短手脚；浅奶油色大肚皮、浅绿眼环和居中黑瞳、极短水平嘴线。点击互动是核心，挥手是额外动作。另参考了 [Nailong-Studio/NaiWa-Wallpaper](https://github.com/Nailong-Studio/NaiWa-Wallpaper) 的公开素材目录，只取角色动作参考，不使用与艺术作品结合的整图。

## 台词与声音来源

点击台词和音频一一对应，全部来自中文互联网的奶蛙衍生语，不是本项目自编的台词：

| 台词 | 文件 | 时长 |
| --- | --- | --- |
| 安迪 | `naiwa-andi.wav` | 1.85s |
| 嘎嘎提拉瞎 | `naiwa-gaga.wav` | 1.17s |
| 干巴得 | `naiwa-ganbade.wav` | 1.11s |
| 哈哈哈哈哈 | `naiwa-laugh-long.wav` | 4.11s |
| 哦啦 | `naiwa-ola.wav` | 0.96s |
| 噶韭菜 | `naiwa-gajiucai.wav` | 0.89s |

六段语音取自 [VIPmrgj/Dragon-frog](https://github.com/VIPmrgj/Dragon-frog) 的 `音效/` 目录。该仓库没有声明 LICENSE；本项目按粉丝二创、非商业方式使用，并在 `src/assets/audio/README.md` 标注原始文件名与来源。奶蛙形象和语音的权利归各自原作者/二创作者，若权利人要求会立即移除。

点击规则：

- **成年单击**：只播「哈哈哈哈哈」大笑，不播安迪等台词。
- **成年双击**：取消待播的大笑，随机播一条安迪 / 嘎嘎提拉瞎 / 干巴得 / 哦啦 / 噶韭菜。
- **幼体**：没有大笑语音；单击或双击都只播安迪类台词，双击只触发一次。
- 静音时不播音频，改成显示同一句字幕。

台词考据与旧版 1.8 秒 MIT 笑声来源：

- 《捧腹大笑思想与奶龙学概论》第六章「奶蛙的衍生语」：<https://xn--psszg58c9c2281ajit.lol/files/history.pdf>
- naiwa.meme 奶蛙表情包档案：<https://naiwa.meme/stickers>
- Milk Frog Keyboard 的 13 个奶蛙音效列表：<https://mwm.ai/it/apps/milk-frog-music-meme-beats/6762385358>
- [Nailong-Studio/NaiWa-Wallpaper](https://github.com/Nailong-Studio/NaiWa-Wallpaper) 的 `audio/奶蛙-桌宠笑声.wav`（MIT，1.8 秒，仓库内保留为 `naiwa-laugh.wav` 备用）

“卡球赛”目前更可能是“卡脚先”或《喀秋莎》的空耳；没有找到可确认授权的独立“卡球赛”原声，因此没有把它单独打包。

## 平台说明与已知限制

- **Windows**：本机已实际启动和构建验证。透明窗口、无边框、拖动、托盘、设置持久化均按 Windows 路径实现。
- **macOS**：透明窗口依赖 `macOSPrivateApi`，这会限制 Mac App Store 上架；本机无法验证 macOS 运行时，CI 只负责构建 DMG。代码签名与公证尚未配置，正式分发前需要 Apple Developer 证书和 `notarytool`。
- 只有点到角色的非透明像素才会触发点击效果；透明边缘只用于拖动窗口，不会触发语音/字幕。窗口整体仍会接收鼠标，暂时不能点击穿透到下层，这是 v1 的已知限制。
- 关闭设置窗口只是隐藏，退出应用请使用托盘或右键菜单。
- 点击桌宠会同时触发反馈并开始原生拖动；拖动中会显露出“被抓住”的点击表情。
- 动画关闭后保留点击表情反馈，但不自动走动，也不逐帧播放。

## 开源与免责声明

MIT License，见 [LICENSE](LICENSE)。

CyberNaiwa 是粉丝向、非商业的开源项目，灵感来自中文互联网迷因「奶蛙」。奶蛙形象源自 AI 生成与网友二创；本项目与奶龙官方及其权利方无关联。仓库内的 ASCII 角色帧由本项目基于公开参考图转换和绘制，不包含第三方图片素材；六段点击语音来自上述公开素材仓库，权利归各自原作者/二创作者，若权利人要求会移除。

## 构建状态

GitHub Actions 工作流在 `.github/workflows/build.yml`，在 Windows 和 macOS Runner 上分别构建 NSIS 安装包和 DMG。v0.2.2（量子模式 128×80 / 原色模式 112×70、五态、六段点击语音、幼体 ASCII 图标、蓝黑终端控制台）发布到 [Releases](https://github.com/natricknye/CyberNaiw/releases/tag/v0.2.2)。签名/公证 secrets 未配置，因此产物为未签名版本。
