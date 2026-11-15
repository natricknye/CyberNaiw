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
│   │   ├── audio/                    # 六段点击语音 + 来源/授权说明
│   │   ├── branding/icon.svg        # 品牌图标源文件（tauri icon 生成各平台图标）
│   │   └── pets/
│   │       ├── README.md            # 图片皮肤扩展说明
│   │       ├── index.ts             # 皮肤注册表（ASCII / image 两种）
│   │       └── cyber-naiwa/
│   │           ├── naiwa-frames.json            # 112×70 原色成年帧
│   │           ├── naiwa-baby-frames.json       # 112×70 原色幼体帧
│   │           ├── naiwa-cyber-frames.json      # 128×80 量子模式成年帧
│   │           ├── naiwa-cyber-baby-frames.json # 128×80 量子模式幼体帧
│   │           └── frames.ts              # tone、帧间隔、JSON 导入
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
│   │   ├── sound.ts                 # 六段语音缓存 / 成年与幼体倍速
│   │   └── window.ts                # 尺寸/位置/置顶/显示/拖动
│   ├── i18n/strings.ts               # 中英文 UI 文案
│   ├── styles/{base,pet,settings}.css
│   ├── types/pet.ts                  # 设置、年龄、配色、语言类型
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/lib.rs                   # 托盘、托盘语言、显示/隐藏、设置窗口、quit_app
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

`PetAnimationState = "idle" | "walk" | "happy" | "click" | "wave"`。

- `usePetState` 持有唯一状态，避免动画互相冲突。
- `usePetInteraction`：pointerdown 只记录起点；移动 ≥5px 才调用 `startDragging()`，避免原生拖拽吞掉点击；pointerup 且未拖动才算一次点击。300ms 内的第二次点击算双击。
- 只有 `event.target` 命中 `.pet-ascii [class^="tone-"]:not(.tone-empty)` 才标记 `onCharacter`；透明格或 stage 上按下仍可拖动窗口，但松开不会触发语音/字幕。
- `pointermove` 在 `buttons === 0` 时清空 `pressRef`；window 的 pointerup / pointercancel / blur 也会清理，避免 pointerup 丢失后窗口跟着鼠标漂移。
- 点击：`click` 380ms → `happy` 1100ms → `idle`。
- 动画开启且 idle 时，7–14 秒随机进入 `walk`（3.2s）或 `wave`（2.4s）。
- 动画关闭时强制回到 idle，并取消进行中的状态定时器；点击仍保留表情反馈。
- `PetAnimation` 只在当前状态内轮播帧，切状态立即重置到第 0 帧。
- 成年：Idle / Walk 使用站立正面（第二帧闭眼）；Click / Happy 使用官方仰头大笑；Wave 使用官方挥手。
- 幼体：Idle / Walk 使用幼体正面；Happy / Click 使用幼体素材右一叉腰；Wave 使用幼体素材中间抬手。幼体不使用成年大笑、挥手素材。
- Sleep 与 Sad 状态均已移除（用户反馈睡觉和伤心界面不好看）；不再生成/播放 sleep 或 sad 帧。
- 帧间隔：idle 1200ms、walk 260ms、happy 320ms、click 180ms、wave 500ms。

### 点击语音

- 六句台词和六个 WAV 一一对应：安迪、嘎嘎提拉瞎、干巴得、哈哈哈哈哈、哦啦、噶韭菜。
- 成年单击：`interact("laugh")`，只选「哈哈哈哈哈」，延迟 300ms 播放，给双击留取消窗口。成年双击：取消待播大笑，`interact("meme")` 随机选安迪类台词。幼体：没有大笑语音，单击/双击都只选安迪类，双击只触发一次。
- `usePetState.interact(kind)` 先随机选 `NaiwaReaction`（含 `text` 和 `voice`），`Pet.tsx` 再用同一个 `voice` 调 `playNaiwaVoice()`，避免字幕和声音不一致。
- `sound.ts` 为每个 `voice` 缓存一个 `HTMLAudioElement`；成年 `playbackRate 1`，幼体 `1.35`，两者都设 `preservesPitch false`。
- 声音开启时气泡不渲染文字；静音时才显示同一句台词作为字幕。
- 音频来自 `VIPmrgj/Dragon-frog` 的 `音效/`（无 LICENSE），按粉丝二创非商业使用，来源和移除声明写在 `src/assets/audio/README.md`。旧版 1.8 秒 MIT 笑声保留为 `naiwa-laugh.wav` 备用。

### ASCII 渲染

- 原色模式帧在 `naiwa-frames.json` / `naiwa-baby-frames.json`：112 列 × 70 行；量子模式帧在 `naiwa-cyber-frames.json` / `naiwa-cyber-baby-frames.json`：128 列 × 80 行。用 `.` 表示透明格。帧由官方设计资料库的成年 / 幼体 / 大笑 / 挥手参考图逐像素映射到字符 tone；仓库不包含参考图片本身。
- 幼体挥手源图裁切框从 `X=365/W=270` 改为 `X=310/W=285`：原框正好从 V 字手中间切过，导致手指缺失；新框完整包住中间幼体的抬手，112×70 与 128×80 两套网格都已重新采样。
- `PetAnimation` 根据 `settings.palette` 选择 `cyberFrames` / `cyberBabyFrames`，原色模式走 `frames` / `babyFrames`；两套都是 5 态、每态 2 帧。
- 逐字符 tone：黄身体 `#`、亮黄 `&`、橙色阴影 `%`、奶油肚皮 `+`、绿眼 `O/~/^`、瞳孔 `@`、嘴腔 `_`、牙齿 `=`、嘴线 `-`、棕色四肢 `|`、高亮 `*/!`、透明 `.`。
- 闭嘴帧只保留官方源图里的极短嘴线，不再合成嘴线/下巴硬线：试过按眼睛位置画大范围 `-`/`;`，用户反馈像“鼻子 + 大嘴”，已撤销；现在只用 `mouthline` 把源图已有的 5–9 个嘴像素轻微加深，不延长、不画下巴。
- 幼体直接取 `official-juvenile.png` 05 幼态版左一；保留素材的短圆身体、短手脚和原始腿间缝，不做全局 chibi 压扁、不全局填洞。局部加工只保留：眼睛在源像素上向外扩 1 格、嘴线加深、笑牙按源图嘴腔内部空洞生成。
- `PetAnimation` 把连续同 tone 的字符合并成 span，再交给 CSS 着色，避免每字符一个节点。
- 字号固定 14px，外层 `.pet-ascii-frame` 用 `transform: scale(...)` 缩放：原色模式成年 `0.3657`、原色模式幼体 `0.3`；量子模式成年 `0.32`、量子模式幼体 `0.2625`。两种分辨率在屏幕上占据同样的 336×358 CSS px。不能只把 font-size 设到 5px：WebView2/Chromium 有最小字号，会把 128 列网格撑出窗口。
- 每个 tone span 都有同色实体背景（alpha 0.66–0.96），填掉字符之间的缝隙，角色内部不再透出桌面；`.tone-empty` 保持透明，所以轮廓外仍是透明窗口。
- 扫描线通过 mask 收束在角色附近，避免在透明窗口上出现一整块暗色条纹。
- 生成脚本在 `_qa/`（被 gitignore）：`convert-all.ps1` 负责按官方图裁切采样，`build-official-frames.mjs` 负责闭眼、迈步、星光、牙齿和内部空洞填充。

## 设置持久化

- 使用官方 `tauri-plugin-store`，文件 `settings.json`，`autoSave: false`，显式 `save()`。
- 键 `settings`：`{ alwaysOnTop, scale, animationsEnabled, soundEnabled, language, age, palette }`。
- 键 `windowPosition`：`{ x, y }`（物理像素）。
- 读取时做类型校验和范围夹取：`scale` 限制在 0.7–1.5，`language` 只接受 `zh/en`，`age` 只接受 `adult/baby`，`palette` 只接受 `cyber/original`，非法值回退默认。
- App 界面固定中文（设置页不再提供语言切换）；README 保留 `README.en.md`。托盘语言固定调用 `zh`，设置窗口标题为中文。
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

- `pnpm build`：通过（TypeScript + Vite），112×70 原色帧、128×80 赛博帧与 `teeth` tone 均通过类型检查。
- `cargo check --manifest-path src-tauri/Cargo.toml`：通过（0.2.1）。
- 前端页面用 Edge headless + 固定 iframe 做了 380×420 角色预览、460×700 设置页预览；新预览图在 `docs/preview.png`。
- 真实 `tauri dev` + CDP：
  - 点击把 HUD 从 IDLE 切到 CLICK，ARIA 变为「赛博奶蛙，被点击」，气泡出现。
  - 设置页点 English 后，设置页、宠物 ARIA、气泡、托盘调用全部切英文；点中文恢复。
  - 点 Baby 后宠物窗口类是 `pet-stage--baby`，原色帧缩放到 0.3×`--pet-scale`（赛博 0.2625）；点 Original 后 tone 背景变为暖黄实体色，再切回 Cyber。
  - 点 Restore defaults 后窗口回到 380×420、`--pet-scale: 1`，语言中文、成年、赛博、动画开启。
  - 原生设置窗口标题为「赛博奶蛙 设置」；HTML 标题和 pet 窗口初始标题为「赛博奶蛙」（通过 Tauri internals / CDP 查询）。
  - 设置窗口重载时 `set_tray_language` 无报错；托盘物理点击仍未自动化。
  - 112×70 原色与 128×80 赛博帧在 100% 缩放下都渲染为 336×358 CSS px，窗口 380×420，未溢出；赛博为 80 行 / transform 0.32，原色为 70 行 / transform 0.3657；赛博幼体 0.2625，原色幼体 0.3。
- 真实鼠标拖拽 release 窗口：从 (15,284) 移到 (158,500)，尺寸保持 475×525 物理像素（0.1.0 版本验证）。
- 右键原生菜单：通过屏幕截图确认「隐藏桌宠 / 显示设置 / 退出 CyberNaiwa」；透明区域能看到后面的窗口内容。
- 设置持久化：设为 115% 后重启，设置页仍为 115%，桌宠窗口为 438×484；随后恢复 100%，窗口回到 380×420。
- `pnpm tauri build --bundles nsis`：0.1.0 通过，生成 `CyberNaiwa_0.1.0_x64-setup.exe`（约 1.47 MiB）；0.2.0 通过，生成 `CyberNaiwa_0.2.0_x64-setup.exe`（约 1.48 MiB）；0.2.1 通过，生成 `CyberNaiwa_0.2.1_x64-setup.exe`（约 2.87 MiB，含六段语音）。
- 0.2.1 release exe 在生产 CSP 下启动成功：窗口标题「赛博奶蛙」、设置页 0.2.1、五态可见；六段音频以 hash 资源名加载，成年 1.0×、幼体 1.35× 且 `preservesPitch false`；静音后 0 次播放、六句字幕全部出现；设置页 `700 / 793 / auto`。生产包截图在 `_qa/art/release-0.2.1-pet.png`。
- 托盘菜单由 Rust 在启动时创建；托盘的物理点击未纳入自动化测试，需要人工点一次确认。
- 设置页/图标：`pnpm build` 通过；设置页改为中文-only，实际点击 幼体 → 原色 → 恢复默认 均正确；`settings-cn-final.png` 为完整中文截图，`settings-scrolled-bottom.png` 显示底部说明可见；shell `clientHeight 700 / scrollHeight 778 / overflow-y auto`，可滚到底。
- 声音：六段 WAV 与六句台词一一对应；CDP 采集到 `naiwa-andi / naiwa-gaga / naiwa-ganbade / naiwa-laugh-long / naiwa-ola / naiwa-gajiucai`，成年 1.0×、幼体 1.35× 且 `preservesPitch false`；开启声音时气泡为空，关闭后 0 次播放且六句字幕可见。
- 成年正面改用桌面提供的 `mature-official-front-side-back.webp` 中间正面（长腿/瘦高）；大笑/挥手/低头仍用官方成年动作素材，动作帧与站立帧的体型可能会有差异。
- 2026-11-16 最终 CDP 验证：成年点击 `playbackRate 1`、幼体 `1.35` 且 `preservesPitch false`；六段语音都实际命中，声音开启时气泡为空，静音后 0 次播放且显示六句字幕之一；设置页 `clientHeight 700 / scrollHeight 793 / overflow-y auto`；点击状态序列 `IDLE → CLICK → HAPPY → IDLE`，页面无 SAD/伤心内容；`_qa/art/settings-rename-final.png` 与 `_qa/art/baby-five-final.png` 确认新名称、五态和幼体叉腰肘部完整。
- 2026-11-16 幼体挥手修复：裁切框改为 `X=310/W=285` 后，112×70 帧边界为 x=5–92，128×80 为 x=6–105，V 字手完整；`_qa/art/baby-five-wavefix.png` 与 `baby-five-wavefix-cyber.png` 两套配色均确认。
- 2026-11-16 点击语音规则：CDP 验证成年单击只播 `naiwa-laugh-long`、成年双击只播一条安迪类 WAV、幼体单击/双击都不播大笑且只触发一次；静音成年单击字幕「哈哈哈哈哈」、双击字幕为安迪类、幼体字幕为安迪类；真实系统鼠标双击也只播一条安迪类语音。移动 5px 的拖拽测试不触发点击。
- 2026-11-16 点击命中限制：`elementFromPoint` 在窗口中心返回 `SPAN.tone-shade`，在角落返回 `MAIN.pet-stage`；CDP 在中心点击播一条 meme，在角落点击 0 次播放、无气泡、HUD 保持 IDLE。透明区域仍可拖动窗口。
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
- 2026-11-16 replace 64×40 art with official-reference adult/baby frames, seven states, teeth tone and solid cell backing; cyber uses 128×80, original uses 112×70 (128 original tested but too fine for the default window).
- 2026-11-16 add initial Chinese/English UI, localized tray menu and window title, adult/baby and cyber/original modes; bump to 0.2.0; the app UI is now Chinese-only, with English kept in README.en.md.
- 2026-11-16 align the baby to the official juvenile reference (short round body, big eyes, tiny limbs), keep local eye enlargement/mouth darkening/teeth, and stop using global chibi compression or full hole filling; revert experimental mouth/chin contour lines because they read as a nose and an oversized mouth.
- 2026-11-16 redesign the settings window with a warm-black + Naiwa-yellow palette, all-sharp rectangles, one flat panel, rectangular segmented controls, no avatar/`[N]` mark, CJK-safe sans/mono font stacks, and the title “这就叫奶娃桌宠”; redraw the app icon and regenerate all platform icons.
- 2026-11-16 add the Naiwa classic laugh audio from `Nailong-Studio/NaiWa-Wallpaper`, use researched Naiwa meme sound words for click bubbles, add a sound switch, and make the app UI Chinese-only (English stays in README.en.md).
- 2026-11-16 fix the settings scroll container (`height:100%` + `overflow-y:auto`) so the bottom note is reachable; use the user-provided tall adult front reference for adult idle/walk.
- 2026-11-16 rename the app to 赛博奶蛙, rename the palettes to 原色模式/量子模式, remove the sleep state entirely, play the laugh at 1.0× for adults and 1.35× without pitch preservation for babies, hide the bubble while sound is on and show meme lines as subtitles when muted, and fit the baby hands-on-hips pose by both width and height so the elbows stay complete.
- 2026-11-16 remove the sad state as well (user clarified the ugly state was 伤心), leaving five states: idle / walk / happy / click / wave; regenerate all four frame sets without sad and update ARIA/docs.
- 2026-11-16 bind six click lines to six matching Naiwa meme WAVs (安迪/嘎嘎提拉瞎/干巴得/哈哈哈哈哈/哦啦/噶韭菜), play the selected line's audio at 1.0× for adults and 1.35× for babies, and document the no-LICENSE fan-use source plus removal policy.
- 2026-11-16 set the HTML title and initial pet/settings window titles to 赛博奶蛙, fix the mojibake settings title, and remove the remaining sleep tone/CSS rules.
- 2026-11-16 expand the baby wave crop to include the full V-sign hand, delay native dragging until the pointer moves 5px so double-clicks survive, and split click audio: adult single = laugh only, adult double = meme line, baby = meme lines only.
- 2026-11-16 restrict click effects to non-transparent character cells (transparent margins can still drag the window), and clear stale press state on `buttons === 0` / global pointerup/blur so the window cannot drift with the mouse.
- 2026-11-16 add a monitor fallback for `monitorForWindow`: if the window centre is outside every monitor, pick the monitor with the largest overlap (then the primary) so `clampPetToMonitor` / default placement can bring an off-screen pet back.
- 2026-11-16 bump to 0.2.1 and replace `docs/settings.png` with the 赛博奶蛙 settings screenshot (原色模式/量子模式, no sleep copy, version 0.2.1).
