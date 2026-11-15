# Design QA / 版本时间线

## 2026-11-15 — Phase 0：环境

- Windows 11 build 26200，x64；Node v24.21.0；Git 2.55；WebView2 157。
- 缺 pnpm、Rust、Windows SDK。
- 用 rustup 安装 Rust 1.100 stable（MSVC）；通过 VS Installer 补装 Windows 11 SDK 10.0.26100。
- Corepack 的 `pnpm` 因 Node 在 `D:\` 根目录无法写 shim，改用 `corepack pnpm`。

## 2026-11-15 — Phase 1：脚手架

- `create-tauri-app` 生成 Tauri 2 + React + TypeScript + Vite + pnpm。
- 初始 `pnpm build` 通过；Cargo 依赖开始拉取。

## 2026-11-15 — Phase 2：桌宠窗口

- 两个窗口：`pet`（380×420 基准、透明、无边框、置顶、不可聚焦、默认隐藏）与 `settings`（460×700、普通窗口、默认隐藏）。
- 启动顺序：读设置 → 应用尺寸/位置 → 显示，避免左上角闪一下。
- 位置保存物理像素，启动时校验是否仍在显示器工作区。
- 左键 pointerdown 立即反馈并调用原生 `startDragging()`；右键使用原生菜单。

## 2026-11-15 — Phase 3/4：角色与动画

- 第一版是绿色线框机器人，和真实「奶蛙」不符。
- 查中文互联网资料后确认：奶蛙是 AI 生成的黄色大脑袋、绿色大眼睛、大嘴、奶油肚皮、棕色小手脚，常带魔性大笑的迷因，源自奶龙二创。
- 先试过 32×20 的黄色手绘 ASCII，又试过原创 SVG 高清奶蛙；前者太粗，后者被用户判定仍不像，且不符合 ASCII 方向。SVG 实验已移除。
- 用户要求保留 ASCII 并“逐像素还原”。最终从本地正面参考图生成 64×40 彩色 ASCII 网格：黄身体 `#`、绿眼 `O`、瞳孔 `@`、奶油肚皮 `+`、棕色手脚 `|`、大嘴 `_`。
- 五种状态：Idle/Walk/Click 使用标志性大笑脸；Happy 加闪光；Sleep 切换成闭眼小嘴 + z。每态 2 帧。
- 窗口改为 380×420；ASCII 固定 14px 字号再按 `--pet-scale` 缩放，避免 WebView2 最小字号把网格撑爆。
- 动画关闭时强制 idle，但保留点击表情反馈。

## 2026-11-15 — Phase 5/6：托盘与设置

- 托盘：显示桌宠、隐藏桌宠、显示设置、退出。
- 右键菜单：隐藏桌宠、显示设置、退出 CyberNaiwa。
- 设置：始终置顶、70%–150% 大小、动画开关、恢复默认。
- 官方 `tauri-plugin-store` 写本地 `settings.json`；设置窗口改动通过 Tauri event 实时同步桌宠窗口。

## 2026-11-15 — Phase 7：构建与发行

- 使用自绘 SVG 品牌图标生成 Windows/macOS 图标。
- GitHub Actions 矩阵：Windows NSIS + macOS DMG；未配置签名时产物为未签名。
- Windows NSIS 本地构建成功：`CyberNaiwa_0.1.0_x64-setup.exe`（约 1.47 MiB）。
- release exe 在生产 CSP 下启动正常；真实鼠标拖拽、右键原生菜单、透明背景、设置跨重启持久化均已验证。
- identifier 从 `com.cybernaiwa.app` 改为 `com.cybernaiwa.desktop`，避免 macOS `.app` 后缀冲突。
- 设计参考：[奶蛙百科](https://neta.art/app/milk-frog-wiki)。当前大笑帧来自宽版参考，后续可继续打磨梨形高个和更修长的手脚。
- README/LICENSE/DEVELOPMENT 补齐。

## 待人工确认

- 托盘菜单的物理点击仍需在桌面通知区实际点一遍；窗口 show/hide/设置/退出逻辑已实现。
- macOS 运行时行为无法在本机验证；CI 只能证明构建通过。
- 透明边缘点击穿透未实现，作为 v1 已知限制。
- 当前默认大笑帧是宽版参考的像素映射；按奶蛙百科的“梨形高个、更修长手脚”可继续做 v1.1 美术优化。
