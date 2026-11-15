# CyberNaiwa 开发说明

## 概览

CyberNaiwa 是一个 Tauri 2 + React + TypeScript 桌面宠物。应用有两个 webview 窗口：

- `pet`：透明、无边框、置顶、不可聚焦、默认隐藏，启动后由前端应用设置与位置再显示。
- `settings`：普通系统窗口，默认隐藏，通过托盘或奶蛙右键菜单打开；关闭时只隐藏。

Rust 只负责系统级部分：托盘图标/菜单、窗口显示隐藏、退出。业务状态、动画、设置 UI 都在前端。

## 目录

```text
CyberNaiwa/
├── src/
│   ├── assets/
│   │   ├── branding/icon.svg        # 品牌图标源文件（tauri icon 生成各平台图标）
│   │   └── pets/
│   │       ├── README.md            # 图片皮肤扩展说明
│   │       ├── index.ts             # 皮肤注册表（ASCII / image 两种）
│   │       └── cyber-naiwa/
│   │           ├── naiwa-frames.json # 64×40 彩色 ASCII 帧
│   │           └── frames.ts         # tone、帧间隔、JSON 导入
│   ├── components/
│   │   ├── Pet.tsx                  # 桌宠启动、设置同步、位置持久化
│   │   ├── PetAnimation.tsx         # ASCII 分色渲染 / 图片序列渲染
│   │   ├── PetMenu.tsx              # 原生右键菜单
│   │   ├── Settings.tsx             # 设置窗口
│   │   └── SpeechBubble.tsx
│   ├── hooks/
│   │   ├── usePetState.ts           # 五态状态机 + 自动行为
│   │   ├── usePetInteraction.ts     # 点击 + 原生拖动 + 右键
│   │   └── useSettings.ts           # 读取/防抖保存/跨窗口通知
│   ├── services/
│   │   ├── settings.ts              # store JSON、校验、事件
│   │   └── window.ts                # 尺寸/位置/置顶/显示/拖动
│   ├── styles/{base,pet,settings}.css
│   ├── types/pet.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/lib.rs                   # 托盘、显示/隐藏、设置窗口、quit_app
│   ├── capabilities/{pet,settings}.json
│   ├── tauri.conf.json
│   └── icons/
├── .github/workflows/build.yml
├── README.md
├── LICENSE
├── design-qa.md
└── DEVELOPMENT.md
```

## 窗口模型

1. `pet` 在 `tauri.conf.json` 里 `visible: false`，避免启动时先闪在屏幕左上角。
2. `Pet.tsx` 读取设置和位置，调用 `applyPetWindowOnStartup`：
   - `setSize(380 × 420 × scale)`
   - `setAlwaysOnTop`
   - 有保存位置且与某个显示器工作区有足够交集则恢复，否则放到当前显示器右下角
   - 最后 `show()`
3. 位置通过 `onMoved` 监听，500ms 防抖后存 `windowPosition`。
4. 设置窗口改动通过 Tauri event `cybernaiwa-settings-changed` 广播；`Pet.tsx` 接收后实时应用尺寸/置顶，但不回跳位置。
5. 设置窗口 `onCloseRequested` 阻止默认关闭并 `hide()`；托盘/右键菜单负责真正退出。

### 平台差异

- Windows 的桌宠窗口配置 `focusable: false`，点击不抢焦点；`startDragging()` 由 pointerdown 调用，交给系统处理 DPI 和多显示器。
- macOS 的透明窗口需要 `app.macOSPrivateApi: true`，因此启用 Tauri 的 `macos-private-api` feature；这会限制 Mac App Store 上架。
- `acceptFirstMouse: true` 仅对 macOS 生效，确保未聚焦时第一次点击也能到达 webview。
- `skipTaskbar: true` 在 Windows 隐藏任务栏项；macOS 行为以实际系统为准。

## 角色状态机

`PetAnimationState = "idle" | "walk" | "sleep" | "happy" | "click"`。

- `usePetState` 持有唯一状态，避免动画互相冲突。
- 点击：`click` 380ms → `happy` 1100ms → `idle`。
- 动画开启且 idle 时，7–14 秒随机进入 `walk`（3.2s）或 `sleep`（9s）。
- 动画关闭时强制回到 idle，并取消进行中的状态定时器；点击仍保留表情反馈。
- `PetAnimation` 只在当前状态内轮播帧，切状态立即重置到第 0 帧。
- Idle / Walk / Click 使用标志性的奶蛙大笑脸；Happy 加闪光；Sleep 换成闭眼小嘴帧。
- 帧间隔：idle 1200ms、walk 260ms、sleep 1300ms、happy 320ms、click 180ms。

### ASCII 渲染

- 所有帧来自 `naiwa-frames.json`：64 列 × 40 行，用 `.` 表示透明格。帧由本地参考图逐像素映射到字符 tone，仓库不包含参考图片本身。
- 逐字符 tone：黄身体 `#`、亮黄 `&`、橙色阴影 `%`、奶油肚皮 `+`、绿眼 `O/~/^`、瞳孔 `@/-`、大嘴 `_`、棕色四肢 `|`、高亮 `*/!`、睡眠 `z/Z`、透明 `.`。
- `PetAnimation` 把连续同 tone 的字符合并成 span，再交给 CSS 着色，避免每字符一个节点。
- 字号固定 14px，外层 `.pet-ascii-frame` 用 `transform: scale(calc(0.64 * var(--pet-scale)))` 缩放。不能只把 font-size 设到 5px：WebView2/Chromium 有最小字号，会把 64 列网格撑出窗口。
- 扫描线通过 mask 收束在角色附近，避免在透明窗口上出现一整块暗色条纹。

## 设置持久化

- 使用官方 `tauri-plugin-store`，文件 `settings.json`，`autoSave: false`，显式 `save()`。
- 键 `settings`：`{ alwaysOnTop, scale, animationsEnabled }`。
- 键 `windowPosition`：`{ x, y }`（物理像素）。
- 读取时做类型校验和范围夹取：`scale` 限制在 0.7–1.5，非法值回退默认。
- 设置窗口保存防抖 180ms；跨窗口通知立即发出，保证滑杆跟手。
- 浏览器预览模式用 `localStorage` 作为回退，不涉及 Tauri store。

## 权限（capabilities）

`pet` 和 `settings` 各自最小授权：

- `core:default` + 明确的 `core:window:allow-*`：start-dragging、show、hide、set-size、set-position、set-always-on-top、outer-size、outer-position、available-monitors、monitor-from-point、set-focus、unminimize。
- `store:default`。
- 未使用 opener 插件，已移除；没有文件系统、shell、HTTP 等额外权限。

新增 Tauri 命令/插件时，先确认是否真的需要，再补对应 permission，不要用通配权限。

## 本地命令

```bash
pnpm install
pnpm dev                 # 浏览器预览
pnpm build               # tsc + vite build
pnpm tauri dev           # 真实桌宠
pnpm tauri build --bundles nsis
```

Rust 检查：

```powershell
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
cargo check --manifest-path src-tauri/Cargo.toml
```

## 构建与发布

- `bundle.targets: "all"`；本地/CI 可以用 `--bundles nsis` 或 `--bundles dmg` 覆盖。
- Windows NSIS 安装模式为 `currentUser`，不要求管理员权限。
- GitHub Actions：`.github/workflows/build.yml`，Windows 与 macOS 分开 Runner；上传安装包 artifact。
- macOS 签名/公证尚未配置。需要时增加 secrets：
  - `APPLE_CERTIFICATE`、`APPLE_CERTIFICATE_PASSWORD`
  - `APPLE_SIGNING_IDENTITY`
  - `APPLE_ID`、`APPLE_PASSWORD`、`APPLE_TEAM_ID`
  并在 workflow 里映射给 Tauri；没有证书时不要声称已签名。
- Windows 代码签名同样未配置。

## 测试与验证记录

- `pnpm build`：通过（TypeScript + Vite）。
- `cargo check --manifest-path src-tauri/Cargo.toml`：通过。
- 前端页面用 Edge headless + 固定 iframe 做了 380×420 角色预览、460×700 设置页预览；预览截图在 `docs/preview.png`。
- 真实 `tauri dev`：CDP 验证点击把 HUD 从 SLEEP 切到 CLICK→HAPPY→IDLE，气泡出现；设置窗口成功打开；大小改到 120% 时桌宠窗口从 380×420 变到 456×504，再恢复 100%。
- 真实鼠标拖拽 release 窗口：从 (15,284) 移到 (158,500)，尺寸保持 475×525 物理像素。
- 右键原生菜单：通过屏幕截图确认「隐藏桌宠 / 显示设置 / 退出 CyberNaiwa」；透明区域能看到后面的窗口内容。
- 设置持久化：设为 115% 后重启，设置页仍为 115%，桌宠窗口为 438×484；随后恢复 100%，窗口回到 380×420。
- `pnpm tauri build --bundles nsis`：通过，生成 `src-tauri/target/release/bundle/nsis/CyberNaiwa_0.1.0_x64-setup.exe`（约 1.47 MiB）。
- release exe 在生产 CSP 下启动成功，桌宠窗口可见（生产构建不依赖 Vite dev server）。
- 托盘菜单由 Rust 在启动时创建；托盘的物理点击未纳入自动化测试，需要人工点一次确认。
- macOS 本机无法验证，只能依赖 CI 构建。
- macOS 本机无法验证，只能依赖 CI 构建。

## 坑与注意事项

- 如果 Node 装在磁盘根目录（例如 `D:\node.exe`），`corepack enable pnpm` 会尝试往根目录写 shim 而失败；用 `corepack pnpm`，或用 `corepack enable --install-directory <可写目录> pnpm` 指定 shim 目录。
- Tauri 的 `beforeDevCommand`/`beforeBuildCommand` 写的是 `pnpm dev`/`pnpm build`，所以运行 Tauri 命令时 PATH 里必须有 pnpm（或用 shim）。
- 只启用 `tray-icon` 不够；配置了 `macOSPrivateApi` 就必须给 `tauri` crate 加 `macos-private-api` feature，否则 build script 直接报 allowlist mismatch。
- `currentMonitor` 是模块函数，不是 `Window` 实例方法；跨窗口定位用 `monitorFromPoint` 以窗口中心查询。
- 透明窗口 + 非 focusable 的组合在 Windows 上要实际点一下确认；macOS 首次点击依赖 acceptFirstMouse。
- CSP：生产 `csp` 收紧，`devCsp: null` 以便 Vite/React Refresh 正常工作；改 Vite 插件或加内联脚本时要重新检查生产 CSP。
- 设置窗口用 sticky footer，窗口高度 700；窗口变矮时内容可滚动，按钮不会消失。
- 高密度 ASCII 不能用极小 font-size（WebView2/Chromium 会 clamp），必须用固定 14px + transform 缩放；`--pet-scale` 同时由设置滑杆驱动。
- 在 125% Windows 缩放下截取 Tauri 窗口，PowerShell 必须先 `SetProcessDpiAwarenessContext(-4)`，否则 `GetWindowRect` 只给虚拟化尺寸，截图会被裁掉。
- 不要提交 `_qa/`（参考图/中间预览）、`node_modules`、`dist`、`src-tauri/target`。

## 变更记录

- 2026-11-15 init Tauri 2 + React + TypeScript scaffold, add pnpm lock and icon pipeline.
- 2026-11-15 add five-state ASCII pet, window dragging, native context menu and tray.
- 2026-11-15 add JSON settings store, cross-window sync and position persistence.
- 2026-11-15 redesign pet as yellow 奶蛙-inspired ASCII with green eyes and big mouth.
- 2026-11-15 replace 32-column line art with 64×40 pixel-mapped ASCII (JSON frames, tone spans, 380×420 window); discard the experimental SVG skin.
- 2026-11-15 add Windows/macOS GitHub Actions build workflow and project docs.
- 2026-11-15 verify release CSP, real drag, native context menu, settings restart persistence; build Windows NSIS installer; change identifier to com.cybernaiwa.desktop.
