# CyberNaiwa 开发说明

## 概览

CyberNaiwa 是一个 Tauri 2 + React + TypeScript 桌面宠物。应用有两个 webview 窗口：

- `pet`：透明、无边框、置顶、不可聚焦、默认隐藏，启动后由前端应用设置与位置再显示。
- `settings`：普通系统窗口，默认隐藏，通过右键菜单、中键（按下滚轮）或托盘打开；关闭时只隐藏。

Rust 只负责系统级部分：托盘图标/菜单、窗口显示隐藏、退出。业务状态、动画、设置 UI 都在前端。

## 目录

```text
CyberNaiwa/
├── src/
│   ├── assets/
│   │   ├── audio/                    # 六段点击语音 + 来源/授权说明
│   │   ├── branding/icon-baby.png   # 幼体原色 ASCII 图标源（tauri icon 生成各平台图标）
│   │   └── pets/
│   │       ├── README.md            # 图片皮肤扩展说明
│   │       ├── index.ts             # 皮肤注册表（ASCII / image 两种）
│   │       ├── cyber-naiwa/
│   │       │   ├── naiwa-frames.json            # 112×70 原色赛博成年帧
│   │       │   ├── naiwa-baby-frames.json       # 112×70 原色赛博幼体帧
│   │       │   ├── naiwa-cyber-frames.json      # 128×80 量子赛博成年帧
│   │       │   ├── naiwa-cyber-baby-frames.json # 128×80 量子赛博幼体帧
│   │       │   └── frames.ts              # tone、帧间隔、JSON 导入
│   │       └── classic/
│   │           ├── adult-idle.png / adult-wave.png
│   │           ├── baby-idle.png / baby-happy.png / baby-wave.png
│   │           ├── actions/                    # 走/跑/张望/思考/鼓掌/进食/蹲伏逐帧
│   │           │   ├── walk/00–07.png
│   │           │   ├── run/00–07.png
│   │           │   ├── look/00–05.png
│   │           │   ├── think/00–05.png
│   │           │   ├── clap/00–05.png
│   │           │   ├── eat/00–04.png
│   │           │   └── crouch/00–07.png
│   │           ├── laugh-hd/000–024.webp      # 产品用 524×720（1080p 原片抽帧）
│   │           ├── laugh-hires/000–024.webp   # 648×888 回退放大版
│   │           ├── laugh-cropped/000–024.png  # 紧裁中间帧（108×148）
│   │           └── laugh/000–024.png          # MIT 原始 180×180 帧
│   ├── components/
│   │   ├── Pet.tsx                  # 桌宠启动、设置同步、位置持久化
│   │   ├── PetAnimation.tsx         # ASCII 分色渲染 / 图片序列渲染
│   │   ├── PetMenu.tsx              # 原生右键菜单
│   │   ├── Settings.tsx             # 设置窗口
│   │   └── SpeechBubble.tsx
│   ├── hooks/
│   │   ├── usePetState.ts           # 动作栈/点击反应/自动扎马步
│   │   ├── usePetInteraction.ts     # 左键单击/双击 + 右键菜单 + 中键设置 + 拖动
│   │   └── useSettings.ts           # 读取/防抖保存/跨窗口通知
│   ├── services/
│   │   ├── settings.ts              # store JSON、校验、事件
│   │   ├── sound.ts                 # 六段语音缓存 / 成年与幼体倍速
│   │   └── window.ts                # 尺寸/位置/置顶/显示/拖动
│   ├── i18n/strings.ts               # 中英文 UI 文案
│   ├── styles/{base,pet,settings}.css
│   ├── types/pet.ts                  # 设置、年龄、形态、语言类型
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/lib.rs                   # 托盘、托盘语言、显示/隐藏、设置窗口、quit_app
│   ├── capabilities/{pet,settings}.json
│   ├── nsis/theme.nsh               # 安装器深色 MUI 颜色和欢迎/完成文案
│   ├── tauri.conf.json
│   └── icons/                       # 应用图标、installer icon、NSIS header/sidebar BMP
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
5. 设置窗口 `onCloseRequested` 阻止默认关闭并 `hide()`；托盘或右键菜单负责真正退出。

### 平台差异

- Windows 的桌宠窗口配置 `focusable: false`，点击不抢焦点；`startDragging()` 由 pointerdown 调用，交给系统处理 DPI 和多显示器。
- macOS 的透明窗口需要 `app.macOSPrivateApi: true`，因此启用 Tauri 的 `macos-private-api` feature；这会限制 Mac App Store 上架。
- `acceptFirstMouse: true` 仅对 macOS 生效，确保未聚焦时第一次点击也能到达 webview。
- `skipTaskbar: true` 在 Windows 隐藏任务栏项；macOS 行为以实际系统为准。

### 点击穿透

- Tauri 的 `setIgnoreCursorEvents` 只能整窗开关，不能按像素设置；这里用 `useClickThrough` 每 32ms 读取全局光标，换算到窗口 client 坐标后再做命中检测。
- 命中角色（ASCII tone 格 / 图片 alpha >16）时关闭穿透；透明边、气泡、HUD、阴影和窗口空白处保持穿透。
- 窗口移动或缩放后下一帧重新读取 `innerPosition()`；IPC 短暂失败按 500ms 重试，连续 8 次失败才回退为普通矩形窗口，避免启动瞬间的失败把穿透永久卡死。
- 透明边不能拖动，拖动只能抓角色；这是点击穿透的直接取舍。

## 角色状态机

`PetAnimationState = "idle" | "walk" | "happy" | "click" | "wave" | "beckon" | "run" | "look" | "think" | "wait" | "review" | "clap" | "eat" | "crouch" | "lie"`。

- `usePetState` 持有唯一状态，避免动画互相冲突。
- `usePetInteraction`：pointerdown 只记录起点；移动 ≥5px 才调用 `startDragging()`，避免原生拖拽吞掉点击；pointerup 且未拖动才算一次点击。
- 命中判定：ASCII 必须命中 `.pet-ascii [class^="tone-"]:not(.tone-empty)`，图片必须按 alpha 命中（>16）；透明格/透明像素不接收鼠标，由 `useClickThrough` 让原生窗口穿透到后面。
- 点击穿透：`useClickThrough` 每 32ms 读取全局 `cursorPosition()`，用 `innerPosition()` + `devicePixelRatio` 换算到窗口 client 坐标；命中角色像素时 `setIgnoreCursorEvents(false)`，其余（透明边、气泡、HUD、阴影）`true`。IPC 短暂失败按 500ms 重试，连续 8 次失败才回退为普通矩形窗口。透明边不再能拖动，拖动请抓角色。
- **成年左键**：单击会先等 300ms 确认不是双击；确认后 `advanceAction()` 沿 `ADULT_ACTION_STACK` 前进：`idle → wave（扎马步）→ beckon（招手）→ walk → run → look → think → wait（等待）→ review（检查）→ clap → crouch → lie（躺平）→ idle`。每档有独立持续时间，动作结束回 idle，但索引保留。300ms 内第二次左键会取消待执行的单击并 `interact("laugh")`：`click` 380ms → `happy` 3730ms → `idle`，合计 4.11 秒，和 `naiwa-laugh-long.wav` 对齐。走、跑进入时 `clearReaction()` 且不调 `speak`/`playNaiwaVoice`，所以无语音、无台词；其他动作仍随机选一条安迪类台词。`Pet.tsx` 用 `flowLock` 锁住整个动作流程，锁定时常为 `max(actionDuration, voiceDuration) + 50ms`，期间左键一律忽略；只有动作和语音都结束后，下一次单击才进入下一档。`playNaiwaVoice()` 返回本次语音时长，baby 按 1.35× 折算；`eat` 帧保留在素材里，但因其张嘴仰头太像大笑，不接入左键动作栈。
- **成年右键**：打开原生菜单（设置 / 隐藏 / 退出），不再触发大笑，也不再需要 Ctrl/⌘ 组合键。**大笑只由左键双击触发**，单击动作栈不含 `happy`/`click`。中键（按下滚轮）打开设置；托盘入口保留。
- **幼体左键**：`interact("meme")`，`click` 380ms → `happy` 1100ms → `idle`；没有大笑语音，右键仍是原生菜单。幼体同样使用 `flowLock`（动作 1480ms 与语音时长取最大值），流程中不响应下一次点击；幼体的动作栈与成年完全分开。
- **空闲自动行为**：成年 idle 9–16 秒后只自动进入 `wave`（扎马步）2.4 秒，再回 idle；beckon/walk/run/look/think/clap/crouch 不会自动播放。幼体保持 7–14 秒随机 walk/wave 的独立行为。
- 动画关闭时强制回到 idle，并取消进行中的状态定时器；点击仍能切换动作/触发大笑，但只显示静态首帧。
- `PetAnimation` 只在当前状态内轮播帧，切状态立即重置到第 0 帧；缺少某状态的帧时回退到 `idle`，不会渲染空帧。
- 成年：经典 Idle 使用 `classic/idle-chubby/00–05.png` 六帧圆胖待机（`待机-01–06`，循环从最正面的 06 开始，600ms/帧）；Walk 使用同一画风的 Nailong 走路帧；Click / Happy 使用 Codex Voice Input 的 25 帧大笑（手放肚子 → 仰头 → 抱头 → 回落），只由左键双击触发；Wave（扎马步）使用 `adult-wave.png`，Beckon（招手）使用 `classic/actions/beckon/00–02.png`。新动作的经典原画来自 Nailong-Studio 的 `pet/` 逐帧；ASCII 端 `beckon` 有独立 3 帧，其余新增动作复用最接近的现有姿态：run=walk、look/think=idle、clap=wave、eat=idle、crouch=wave，**绝不把 clap/eat 指到 happy/click 大笑帧**。
- 幼体：Idle / Walk 使用幼体正面；Happy / Click 使用幼体素材右一叉腰；Wave 使用幼体素材中间抬手。幼体不使用成年大笑、挥手或新动作素材。
- Sleep 与 Sad 状态均已移除（用户反馈睡觉和伤心界面不好看）；不再生成/播放 sleep 或 sad 帧。
- ASCII 帧间隔：成年 idle 1200ms、walk 260ms、happy/click 164ms、wave 500ms、beckon 350ms、run 130ms、look 300ms、think 350ms、wait 500ms、review 350ms、clap 160ms、eat 260ms、crouch 500ms、lie 500ms；幼体 idle 1200ms、walk 260ms、happy 320ms、click 180ms、wave 500ms、beckon 350ms、wait 500ms、review 500ms、lie 500ms。
- 奶家经典图片帧有独立间隔：idle 600ms、beckon 220ms、lie 800ms、wait 150ms、review 150ms、walk 140ms、run 90ms、look 220ms、think 260ms、clap 110ms、eat 180ms、crouch 160ms、happy/click 164ms；wave 单帧不轮播，idle 6 帧循环。25×164ms ≈ 4.10s，和 4.11s 音频对齐。

### 点击语音

- 六句台词和六个 WAV 一一对应：安迪、嘎嘎提拉瞎、干巴得、哈哈哈哈哈、哦啦、噶韭菜。
- 成年左键：单击 `advanceAction()` 切动作；走/跑不调 `speak`，其他动作 `speak("meme")` 随机选安迪类台词；300ms 内双击 `interact("laugh")` 只选「哈哈哈哈哈」。成年右键：`showPetMenu()` 原生菜单。幼体左键：`interact("meme")` 选安迪类，没有双击大笑。
- `usePetState.speak(kind)` 只负责随机选 `NaiwaReaction`（含 `text` 和 `voice`）并显示字幕；`interact(kind)` 在 speak 之上再加 click→happy→idle 动画。`Pet.tsx` 用同一个 `voice` 调 `playNaiwaVoice()`，避免字幕和声音不一致。
- `sound.ts` 为每个 `voice` 缓存一个 `HTMLAudioElement`；成年 `playbackRate 1`，幼体 `1.35`，两者都设 `preservesPitch false`。
- 声音开启时气泡不渲染文字；静音时才显示同一句台词作为字幕。走/跑不进入 `speak`，所以静音时也不会显示台词。
- 音频来自 `VIPmrgj/Dragon-frog` 的 `音效/`（无 LICENSE），按粉丝二创非商业使用，来源和移除声明写在 `src/assets/audio/README.md`。旧版 1.8 秒 MIT 笑声保留为 `naiwa-laugh.wav` 备用。

### ASCII 渲染

- 原色赛博帧在 `naiwa-frames.json` / `naiwa-baby-frames.json`：112 列 × 70 行；量子赛博帧在 `naiwa-cyber-frames.json` / `naiwa-cyber-baby-frames.json`：128 列 × 80 行。用 `.` 表示透明格。帧由官方设计资料库的成年 / 幼体 / 大笑 / 挥手参考图逐像素映射到字符 tone；仓库不包含参考图片本身。成年 `beckon` 3 帧来自 Nailong-Studio 的 `招手` MIT 素材（和 walk/run 同库），不是官方设计资料库。
- 幼体挥手源图裁切框从 `X=365/W=270` 改为 `X=310/W=285`：原框正好从 V 字手中间切过，导致手指缺失；新框完整包住中间幼体的抬手，112×70 与 128×80 两套网格都已重新采样。
- `PetAnimation` 根据 `settings.palette` 选择帧组：`original` 走 `frames` / `babyFrames`，`cyber` 走 `cyberFrames` / `cyberBabyFrames`，`classic` 直接切到图片皮肤 `naiwa-classic`。成年 ASCII JSON 现在有 6 个基础动作的帧（idle/walk/happy/click/wave/beckon），幼体仍是原来的 5 个；`index.ts` 把 run/look/think/clap/eat/crouch 映射到最接近的现有姿态（run=walk、look/think=idle、wait=idle、review=idle、clap=wave、eat=idle、crouch=wave、lie=crouch），`beckon` 使用自己的 3 帧，并让 HUD、语音、时长保持独立。幼体不使用新动作；左键动作栈永远不引用 happy/click。
- 成年 ASCII `wave` 不再从旧的裁切帧补边距，而是从经典 `adult-wave.png` 固定取景重采样：`FixedSide 430`、`CenterX 148`、`CenterY 206`，原色 112×70、量子 128×80 各一套；膝下小腿的 `|` 色调回金色 `%`，脚掌保留棕色 `|`，所以左膝到脚掌是连续轮廓。脚本是 `_qa/convert-naiwa.ps1` 和 `_qa/patch-ascii-wave-knee.py`。
- 奶家经典图片皮肤：成年 idle 默认用 `classic/idle-chubby/00–05.png`（6 帧，来自 Nailong `待机-01–06`，180×210、底部 y=204、600ms/帧，循环从最正面的 06 开始，和走路/跑步同一圆胖画风）；`adult-idle-aligned.png` 保留为高瘦正面备选，`classic/idle/00–05.png` 仍是 3/4 侧身备选。wave/扎马步用 `adult-wave.png`，beckon/招手用 `classic/actions/beckon/00–02.png`（来自 `招手-01/02/04`，220ms/帧），lie/躺平用 `classic/lie/00–01.png`（280×170 宽画布、2 帧、800ms/帧，已清掉贴地灰线），wait/等待和 review/检查用 `classic/actions/wait/00–05.png`、`classic/actions/review/00–05.png`（来自 timerring/codex-pet-naiwa 的 6 帧 waiting/review，150ms/帧），happy/click 用 `laugh-hd/000–024.webp`（524×720，164ms/帧，25×164≈4.10s，对齐 4.11s 音频；来自 1080×1474 原片 6.5–8.75s 抽 25 帧，去白底/地面阴影/胯下白块，3% padding，Lanczos 缩到 720 高，不锐化）；walk/run/look/think/clap/beckon/crouch 用 `classic/actions/<state>/` 的逐帧 PNG，`eat` 保留但不接入左键栈。动作帧统一补齐到 180×210 画布、底部对齐到 y=204（6px 底边距），所以脚和膝盖不会被裁。幼体 idle/walk、happy/click、wave 各用一张原画。`laugh/` 保留 180×180 的 MIT 原始帧，`laugh-cropped/` 是紧裁中间帧，`laugh-hires/` 是 648×888 的 6× 回退放大版；当前产品路径是 `laugh-hd`。
- HUD 渲染规则：`Pet.tsx` 只在 `settings.palette !== "classic"` 时渲染 `NAIWA//STATE`；原色赛博用暖黄 `rgba(255,216,77,0.62)` + 黄点，量子赛博沿用蓝色 `rgba(126,249,255,0.6)` + 青点，奶家经典不渲染 HUD。设置页不再有「桌宠标签」开关，`hudEnabled` 从 `PetSettings` 移除。
- 图片尺寸用 `height: 78vh; width: auto`，不是 `max-height`：原图小于窗口时也会放大。图片底部对齐 stage 内容底边，保留 22px 底部 padding；成年待机和动作的角色高约 280px，47 张动作帧的 alpha 最外像素距画布边缘至少 6px，映射到窗口后脚底距底边约 30px。
- 奶家经典每个动作的帧间隔由 `frameIntervalMsByState` 控制；happy/click 使用 164ms，和 4.11s 大笑音频对齐。
- 图片皮肤的点击命中按 alpha 判断：`usePetInteraction` 把点击坐标换算到 `naturalWidth × naturalHeight`，首次读取时把当前图片画进 canvas 并按 `currentSrc` 缓存，alpha > 16 才算命中。透明像素不触发点击/语音/字幕，但拖动仍由整个 `.pet-stage` 接管。
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
- 键 `settings`：`{ alwaysOnTop, scale, animationsEnabled, soundEnabled, language, age, palette }`。HUD 不再持久化：`palette !== "classic"` 时显示 `NAIWA//IDLE`，原色用暖黄、量子用蓝色；奶家经典不渲染 HUD。旧设置里的 `hudEnabled` 直接忽略。
- 键 `windowPosition`：`{ x, y }`（物理像素）。
- 读取时做类型校验和范围夹取：`scale` 限制在 0.7–1.5，`language` 只接受 `zh/en`，`age` 只接受 `adult/baby`，`palette` 只接受 `original/cyber/classic`，非法值回退默认 `cyber`。
- App 界面固定中文（设置页不再提供语言切换）；README 保留 `README.en.md`。托盘语言固定调用 `zh`，设置窗口标题为中文。
- 设置窗口保存防抖 180ms；跨窗口通知立即发出，保证滑杆跟手。
- 浏览器预览模式用 `localStorage` 作为回退，不涉及 Tauri store。

## 权限（capabilities）

`pet` 和 `settings` 各自最小授权：

- `core:default` + 明确的 `core:window:allow-*`：start-dragging、show、hide、set-size、set-position、set-always-on-top、outer-size、outer-position、inner-position、available-monitors、monitor-from-point、set-focus、unminimize、cursor-position、scale-factor、set-ignore-cursor-events。
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
- `cargo check --manifest-path src-tauri/Cargo.toml`：通过（0.2.2）。
- 前端页面用 Edge headless + 固定 iframe 做了 380×420 角色预览、520×760 设置页预览；新预览图在 `docs/preview.png`。
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
- `pnpm tauri build --bundles nsis`：0.1.0 通过，生成 `CyberNaiwa_0.1.0_x64-setup.exe`（约 1.47 MiB）；0.2.0 通过，生成 `CyberNaiwa_0.2.0_x64-setup.exe`（约 1.48 MiB）；0.2.1 通过，生成 `CyberNaiwa_0.2.1_x64-setup.exe`（约 2.87 MiB，含六段语音）；0.2.2 通过，生成 `CyberNaiwa_0.2.2_x64-setup.exe`（约 3.05 MiB，含主题安装器）。
- 0.2.1 release exe 在生产 CSP 下启动成功：窗口标题「赛博奶蛙」、设置页 0.2.1、五态可见；六段音频以 hash 资源名加载，成年 1.0×、幼体 1.35× 且 `preservesPitch false`；静音后 0 次播放、六句字幕全部出现；设置页 `700 / 793 / auto`。生产包截图在 `_qa/art/release-0.2.1-pet.png`。
- 托盘菜单由 Rust 在启动时创建；托盘的物理点击未纳入自动化测试，需要人工点一次确认。
- 设置页/图标：`pnpm build` 通过；设置页改为中文-only，实际点击 幼体 → 原色 → 恢复默认 均正确；`settings-cn-final.png` 为完整中文截图，`settings-scrolled-bottom.png` 显示底部说明可见；shell `clientHeight 700 / scrollHeight 778 / overflow-y auto`，可滚到底。
- 声音：六段 WAV 与六句台词一一对应；CDP 采集到 `naiwa-andi / naiwa-gaga / naiwa-ganbade / naiwa-laugh-long / naiwa-ola / naiwa-gajiucai`，成年 1.0×、幼体 1.35× 且 `preservesPitch false`；开启声音时气泡为空，关闭后 0 次播放且六句字幕可见。
- 成年正面改用桌面提供的 `mature-official-front-side-back.webp` 中间正面（长腿/瘦高）；大笑/挥手/低头仍用官方成年动作素材，动作帧与站立帧的体型可能会有差异。
- 2026-11-16 最终 CDP 验证：成年点击 `playbackRate 1`、幼体 `1.35` 且 `preservesPitch false`；六段语音都实际命中，声音开启时气泡为空，静音后 0 次播放且显示六句字幕之一；设置页 `clientHeight 700 / scrollHeight 793 / overflow-y auto`；点击状态序列 `IDLE → CLICK → HAPPY → IDLE`，页面无 SAD/伤心内容；`_qa/art/settings-rename-final.png` 与 `_qa/art/baby-five-final.png` 确认新名称、五态和幼体叉腰肘部完整。
- 2026-11-16 幼体挥手修复：裁切框改为 `X=310/W=285` 后，112×70 帧边界为 x=5–92，128×80 为 x=6–105，V 字手完整；`_qa/art/baby-five-wavefix.png` 与 `baby-five-wavefix-cyber.png` 两套配色均确认。
- 2026-11-16 点击语音规则：CDP 验证成年单击只播 `naiwa-laugh-long`、成年双击只播一条安迪类 WAV、幼体单击/双击都不播大笑且只触发一次；静音成年单击字幕「哈哈哈哈哈」、双击字幕为安迪类、幼体字幕为安迪类；真实系统鼠标双击也只播一条安迪类语音。移动 5px 的拖拽测试不触发点击。
- 2026-11-16 点击命中限制：`elementFromPoint` 在窗口中心返回 `SPAN.tone-shade`，在角落返回 `MAIN.pet-stage`；CDP 在中心点击播一条 meme，在角落点击 0 次播放、无气泡、HUD 保持 IDLE。透明区域仍可拖动窗口。
- 2026-11-16 0.2.2 设置页：窗口改为 520×760，主面板内容约 718px，放大字号后仍不滚动；「关于」覆盖层打开/关闭后不改变主面板高度，版本显示 0.2.2；底部按钮只有「关于 / 收起设置」，无恢复默认。
- 2026-11-16 字号：设置页最小 12px（标签 15px、提示 13px、正文/说明 12–13px）；桌宠 HUD 11px、字幕 13px；安装器 sidebar 标题 21px、标签 11px、底注 10px，header 标题 16px、副标题 10px。
- 2026-11-16 幼体嘴部：112×70 待机帧第 19 行 x=44–48 为连续 5 个 `-`，原先散落的嘴线已清掉；128×80 帧同步生成，嘴部在五态预览和 32×32 图标中都可读。
- 2026-11-16 图标：`src-tauri/icons/32x32.png` 与 `128x128.png` 检查通过，均为幼体原色 ASCII 黄身/绿眼/深色底；Tauri 全套 Windows/macOS/Android/iOS 图标由 `tauri icon` 重新生成。
- 2026-11-16 0.2.2 生产包：设置窗口 `520×760 / 760 / 760`，提示 13px、标签 15px、说明 12px，关于覆盖层打开/关闭不改变高度；安装器首屏为深色 sidebar + 幼体 ASCII + “欢迎使用赛博奶蛙”，截图在 `_qa/art/settings-final-0.2.2.png`、`_qa/art/installer-final-0.2.2.png`。
- 2026-11-16 成年大笑 25 帧：`naiwa-frames.json` / `naiwa-cyber-frames.json` 的 happy/click 都是 25 帧；React 页面点击后 2.8 秒采样到 26 个唯一帧，HUD 为 `CLICK → HAPPY → IDLE`；click→happy 连续播放、不重置，修复“抱头两次”；`pnpm build` 通过。参考素材与授权见 `_qa/reference/official/laugh/SOURCES.md`。
- macOS 本机无法验证，只能依赖 CI 构建。

## 坑与注意事项

- 如果 Node 装在磁盘根目录（例如 `D:\node.exe`），`corepack enable pnpm` 会尝试往根目录写 shim 而失败；用 `corepack pnpm`，或用 `corepack enable --install-directory <可写目录> pnpm` 指定 shim 目录。
- Tauri 的 `beforeDevCommand`/`beforeBuildCommand` 写的是 `pnpm dev`/`pnpm build`，所以运行 Tauri 命令时 PATH 里必须有 pnpm（或用 shim）。
- 只启用 `tray-icon` 不够；配置了 `macOSPrivateApi` 就必须给 `tauri` crate 加 `macos-private-api` feature，否则 build script 直接报 allowlist mismatch。
- `currentMonitor` 是模块函数，不是 `Window` 实例方法；跨窗口定位用 `monitorFromPoint` 以窗口中心查询。
- 透明窗口 + 非 focusable 的组合在 Windows 上要实际点一下确认；macOS 首次点击依赖 acceptFirstMouse。
- CSP：生产 `csp` 收紧，`devCsp: null` 以便 Vite/React Refresh 正常工作；改 Vite 插件或加内联脚本时要重新检查生产 CSP。
- 设置窗口 520×760；主面板（含 footer）在 760px 内不滚动。「关于」是绝对定位覆盖层，不参与主布局；打开时背景 dim + blur，Escape 先关关于再关设置。
- NSIS 安装器：`installerIcon` + `headerImage` + `sidebarImage` + `installerHooks`（`nsis/theme.nsh`）。深色 `MUI_BGCOLOR 0B1116`、浅青 `MUI_TEXTCOLOR D7F8FF`，sidebar/header 使用幼体 ASCII 图与量子配色；语言固定 SimpChinese，去掉白色许可页。
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
- 2026-11-16 move About into an on-demand overlay, remove restore defaults, fit the 700px settings panel without scrolling, switch the console to the Quantum blue-black terminal palette, and use “让奶娃住进每个奶家人的电脑” as the tagline.
- 2026-11-16 generate the app icon from the baby Original-mode ASCII idle frame instead of the hand-drawn SVG, and strengthen the baby mouth with one clean five-character line (old scattered marks removed).
- 2026-11-16 bump to 0.2.2; README download links and settings preview point at the new release.
- 2026-11-16 raise every UI font in the settings console, pet HUD/bubble and NSIS installer art (minimum 12px in the console) to keep all text readable.
- 2026-11-16 theme the NSIS installer with the baby ASCII sidebar/header BMPs, installer icon, dark MUI colours, Chinese-only pages and a custom welcome/finish copy.
- 2026-11-16 replace the adult single-frame laugh with 25 ASCII frames sampled from Codex Voice Input's MIT 25-frame Naiwa laugh; use one fixed crop for all frames, 90ms per frame, and continue the same frame index across click→happy (380ms + 1870ms = 2.25s) so the hands-on-head beat plays once.
- 2026-11-16 remove the settings intro's local-only line and add a persisted `hudEnabled` toggle for the pet's `NAIWA//IDLE` label; the settings panel still fits 520×760 without scrolling.
- 2026-11-16 turn the two palettes into three forms: 原色赛博 / 量子赛博 stay ASCII, while 奶家经典 renders cut-out original artwork through a new `naiwa-classic` image skin (25 MIT laugh PNGs at 90ms); click hit-testing now samples image alpha so transparent pixels never trigger a reaction.
- 2026-11-16 fix the classic image sizing: render images at `height: 78vh` instead of only limiting `max-height`, crop the 25 laugh frames to their common alpha bounds (108×148) so the body matches the idle height, and verify all six classic states keep the full body and feet inside the window.
- 2026-11-16 ship 648×888 transparent WebP laugh frames generated by 6× Lanczos upscaling from the tight 108×148 crop, with no UnsharpMask; this removes the over-sharpened edge halo while keeping the adult laugh crisp at 90%–150% window scales.
- 2026-11-16 add the adult action stack (stand → horse stance → walk → run → look → think → clap → eat → crouch), driven by adult left-click with a 260ms debounce; right-click now plays the laugh, middle-click opens settings, and Ctrl/⌘ + right-click keeps the native menu. Adult idle only auto-switches to the horse stance; all other actions are click-only, and the baby keeps its own stack.
- 2026-11-16 add 47 Nailong-Studio action frames (MIT) to `classic/actions`, padded to a 180×210 bottom-aligned canvas; add per-state image intervals/new HUD labels; ASCII forms reuse the closest existing poses for the new actions so the shared stack does not require low-quality 112×70 conversions.
- 2026-11-16 replace the classic laugh with 25 high-resolution frames extracted from the 1080×1474 `naiwa-laugh.mp4` at 6.50–8.75 s: remove the white background/floor shadow, pad 3%, Lanczos-downscale to 524×720, save transparent WebP at 90 ms/frame; keep `laugh-hires` as the MIT 180×180 upscale fallback.
- 2026-11-16 add an always-visible top-right gear button for Settings (middle-click still works and is explained as pressing the scroll wheel), and fix the ASCII action aliases so clap/eat never reuse the laugh frames; the left-click stack now only uses wave/idle/walk poses and right-click remains the sole laugh trigger.
- 2026-11-16 brighten the classic standing artwork (`adult-idle-aligned.png`, ×1.09 brightness / ×0.80 colour) to match the action frames, remove the persisted HUD toggle and the settings row, and derive HUD visibility/colour from the palette: Original warm yellow, Quantum blue, Classic hidden.
- 2026-11-16 replace the classic adult standing pose with the six Nailong-Studio MIT idle frames (`classic/idle/00–05.png`, 180×210, 6px bottom) so its colour/art style matches walk/run; make the settings gear appear only while hovering the pet; remove the white crotch gap from all 25 high-res laugh frames; drop `eat` from the left-click stack because its head-back open mouth reads as a laugh.
- 2026-11-16 restore the front-facing official standing art (`adult-idle-aligned.png`) as the default classic idle after the 3/4 Nailong idle looked diagonal; keep `classic/idle/00–05.png` as an alternate only. The front pose now uses ×1.14 brightness / ×0.78 colour, and the leg/feet bounds are unchanged.
- 2026-11-16 audit hands/feet/knees across all classic assets: baby idle/happy were sliced at the source crop (alpha margin 0–1 px). Re-cropped all three baby poses from the official juvenile sheet with wider source regions and a 14 px inner margin; output sizes 239×315 / 259×314 / 251×314. Adult actions keep 6 px canvas margins and the 25 laugh frames keep 18 px; the ASCII grids are fully visible even when a baby frame touches its own grid edge.
- 2026-11-16 remove the adult left-click debounce and slow the adult laugh to 164 ms/frame; extend happy to 3730 ms so click + happy = 4.11 s, matching the laugh WAV; pad the ASCII wave frames by a 2-cell transparent border so the horse-stance knees/feet are not sliced.
- 2026-11-16 replace per-click interruption with a full-flow lock (user clarified): each adult/baby action holds a `flowLock` for `max(action duration, voice duration) + 50 ms`; clicks during the flow are ignored and the next click only advances after both animation and voice end. `playNaiwaVoice` now returns the actual duration, and `advanceAction` returns the action duration.
- 2026-11-16 regenerate the adult ASCII `wave` from `classic/adult-wave.png` with a fixed 430 px crop centred at (148,206) for both the 112×70 and 128×80 sets, replacing the 2-cell padding; promote the shadowed shin cells from `|` to `%` and keep `|` on the feet so the left knee/shin read as one continuous leg. Verified both palettes in-app (`_qa/art/ascii-wave-knee-patched-app-dark.png`, `_qa/art/ascii-cyber-wave-knee-patched-app-dark.png`).
- 2026-11-16 replace the classic idle with the three-frame `idle-chubby` set from the Nailong `待机-06/01/03` art (front-facing first frame, 180×210, 6 px bottom, 1200 ms) and add the adult `beckon` action (three `招手-01/02/04` frames, 220 ms classic / 350 ms ASCII, 1800 ms flow) right after `wave`; generate dedicated 112×70/128×80 beckon grids, restore misread `_` limb pixels to `|`, and keep the action out of the baby stack.
- 2026-11-16 implement native click-through: a 32 ms global cursor poll toggles `setIgnoreCursorEvents` only over character pixels or the settings button, while the bubble/HUD/shadow/transparent margins pass clicks to the window below. The gear is shown from the same `pointerInside` state so it remains reachable while the window is click-through; transparent margins no longer drag, so the character is the drag handle.
- 2026-11-17 move the adult laugh to left double-click, restore right-click to the native menu, skip voice/subtitles for walk/run, and remove the settings gear now that the right-click menu always exposes Settings; transparent edges now have no button hotspot at all.
- 2026-11-17 expand the classic idle from the three-frame preview to all six Nailong `待机` frames (`05 → 00 → 01 → 02 → 03 → 04`, 600 ms/frame) so the standing loop blinks and sways instead of repeating three poses.
- 2026-11-17 add the adult `lie` (躺平) action: remove the light ground-shadow line from the two source frames, compose a wide 280×170 canvas with a width-based CSS rule, use 2 frames at 800 ms and a 2600 ms flow; classic uses the wide frames and ASCII aliases to crouch.
- 2026-11-17 add the adult `wait` and `review` actions from the Codex pet's 6-frame waiting/review APNGs, scaled to 180×195 and bottom-aligned at y=204; insert them after `think`, use 150 ms/frame and 1800 ms flows, and alias them to idle in both ASCII sets.
- 2026-11-16 bump to 0.2.1 and replace `docs/settings.png` with the 赛博奶蛙 settings screenshot (原色模式/量子模式, no sleep copy, version 0.2.1).
