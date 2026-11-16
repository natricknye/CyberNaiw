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
- 设计参考：[奶蛙百科](https://neta.art/app/milk-frog-wiki)。0.1.0 的大笑帧来自宽版参考；0.2.0 已改用官方成年/幼体/大笑/挥手/低头参考。
- README/LICENSE/DEVELOPMENT 补齐。

## 2026-11-16 — Phase 8：官方美术、高清 ASCII、双语

- 用户提供官方奶蛙设计资料库与 `Nailong-Studio/NaiWa-Wallpaper` 素材仓库；只取角色动作参考，忽略与艺术作品结合的整图。
- 下载官方成年三视图、大笑、挥手、低头、幼体参考，用 `_qa/convert-naiwa.ps1` 先采样为 96×60，再试 112×70 与 128×80。128×80 的原色版在默认 380px 窗口里眼睛过小，所以原色保持 112×70；赛博版按用户要求单独用 128×80，利用更细的网格表现终端质感。
- 修复高分辨率下暴露的问题：嘴腔深栗色被误判为瞳孔、细嘴唇线被平均掉、手脚暗部被误判为嘴、白牙丢失。现在嘴腔 `_` 只保留大笑帧最大连通块，牙齿用 `=` 单独着色，闭口帧的 `_` 归入手脚棕色。
- 七态：idle / walk / sleep / happy / click / wave / sad；成年与幼体各一套 JSON，每态 2 帧。
- 实体同色底填掉字符缝隙，角色内部不再透桌面；轮廓外仍是透明窗口。
- 曾试过按眼睛位置加 `-` 嘴线和 `;` 下巴线，但用户反馈像“鼻子 + 大嘴”，已撤销；现在只保留官方源图的极短嘴线，并用 `mouthline` 把已有嘴像素轻微加深。
- 幼体改为直接对齐 `official-juvenile.png` 05 幼态版左一：保留素材的短圆身体、短手脚和原始腿间缝，不再全局压扁/填洞；局部保留眼睛 1 格外扩、嘴线加深、笑牙按源图空洞生成。成年保持修长梨形，和幼体不是同一套比例。
- 成年动作和幼体动作分开：成年使用官方大笑/挥手/低头；幼体 happy/click 使用幼体素材右一的叉腰姿势，wave 使用中间抬手姿势，不再套用成年动作。happy/click 因叉腰姿态较宽，按幼体 idle 的高度重新缩放，保证同一只幼体尺寸一致。
- 双语 UI：默认中文，顶部切换 English；设置、气泡、ARIA、托盘菜单、原生窗口标题同步。
- 模式：成年 / 幼体 × 赛博 / 原色；默认成年 + 赛博。
- 验证：`pnpm build`、`cargo check`、真实 Tauri CDP 点击、语言/体型/配色切换、恢复默认、原生标题查询；生产包里赛博为 80 行 / 0.32，原色为 70 行 / 0.3657，赛博幼体 0.2625，原色幼体 0.3。截图在 `_qa/art/states-cyber-128.png`、`states-original-112.png`、`states-cyber-baby-128.png`、`states-original-baby-112.png`、`mode-cyber-128.png`、`mode-original-112.png`、`release-cyber-128-click.png`，以及 96/112/128 的 `compare-resolutions.png`。
- 版本 0.2.0；Windows NSIS 已构建（`CyberNaiwa_0.2.0_x64-setup.exe`，约 1.48 MiB），生产包点击验收通过；macOS 由 CI 构建。

## 2026-11-16 — Phase 9：设置页与图标

- 设置页去掉方格背景、双大卡片和绿色霓虹，改成暖黑底 + 奶蛙黄、一块平面板、全直角；标题改为“这就叫奶娃桌宠”，英文为 “This is Naiwa”。
- 品牌头去掉头像和 `[N]` 方块，只留黄色竖条 + 标题；语言切换和成年/幼体、原色/赛博都改成直角分段控件，不再用胶囊/圆角。
- 操作按钮放在主面板之后、“关于”之前，保证 700px 窗口里能看到「恢复默认 / 收起设置」；中文状态和关于元信息使用带 `Microsoft YaHei / PingFang SC / Noto Sans SC` 回退的 sans。
- 新图标：暖黄梨形奶蛙、浅绿眼环+黑瞳、极短嘴线、奶油肚、橄榄褐手脚，加一条细青色赛博弧线；重新生成 Windows/macOS 全套图标。32×32 仍能读出黄身、绿眼和肚皮。
- 验证：`pnpm build`；无头 Edge CDP 点击 English → Baby → Original → Restore defaults；中文/英文 460×700 截图（`settings-yellow-zh.png`、`settings-yellow-en4.png`）和 512px 图标样张在 `_qa/art`。

## 2026-11-16 — Phase 10：真实台词、经典笑声、中文设置与长腿成年

- 点击气泡不再自编，改用中文互联网奶蛙衍生语：安迪、嘎嘎滴辣虾、卡脚先、无了、甘巴爹、有用不、哈哈哈哈哈；来源写进 README。
- 在 `Nailong-Studio/NaiWa-Wallpaper` 找到 `audio/奶蛙-桌宠笑声.wav`（1.8 秒、22.05kHz、38KB），接入点击播放，并加设置里的“声音”开关；实测关闭后不再调用 `play()`。
- 设置页去掉语言切换，App 界面固定中文；英文只保留在 `README.en.md`。底部文字被裁掉的原因是 `.settings-shell` 只有 `min-height:100%`，改为 `height:100%` + `overflow-y:auto`，实测 700px 窗口可滚到 778px 内容底部。
- 成年正面改用用户桌面提供的 `mature-official-front-side-back.webp` 中间正面（长腿/瘦高）；成年大笑、挥手、低头仍用之前那批官方成年动作素材，动作帧的体型和站立帧可能不同。

## 2026-11-16 — Phase 11：删除伤心、最终五态

- 用户澄清之前说的“丑”是“伤心”界面，不只是睡觉；因此 sleep 和 sad 两个状态都移除。
- `PetAnimationState` 只剩 idle / walk / happy / click / wave；随机 idle 只在 walk（3.2s）和 wave（2.4s）之间选，不再进入 sad。
- 四套帧 JSON 全部重新生成，不再包含 sad；`_qa/state-preview.html` 也只渲染五态。
- 验证：`pnpm build` 通过；真实 Tauri CDP 点击序列为 `IDLE → CLICK → HAPPY → IDLE`，页面无 SAD/伤心内容；五态幼体预览见 `_qa/art/baby-five-final.png`。
- 0.2.1 版本号已更新，安装包在此改动后重新构建。

## 2026-11-16 — Phase 12：六段点击语音

- “卡球赛”查证结果：更像“卡脚先”或《喀秋莎》的空耳；奶蛙衍生语音主要是变调版不知火舞台词，没有找到可确认授权的独立“卡球赛”原声。
- 找到 `VIPmrgj/Dragon-frog` 的六段奶蛙语音：安迪、嘎嘎提拉瞎、干巴得、大笑、哦啦、噶韭菜；用户确认按粉丝二创直接打包。
- 每句台词绑定一个 `NaiwaVoice` key，点击时先选台词再播同一句音频；成年 1.0×，幼体 1.35× 且关闭 `preservesPitch`。
- 声音开启时气泡为空；静音时显示同一句字幕。CDP 连续点击采集到全部六个文件，幼体速率全为 1.35；静音后播放次数 0、六句字幕都可见。
- 六段音频源仓库无 LICENSE，已在 `src/assets/audio/README.md`、主 README 和 `README.en.md` 标注来源、非商业粉丝使用和移除声明。

## 2026-11-16 — Phase 13：幼体挥手补手、单击/双击语音分流

- 幼体挥手源图裁切框原来从 V 字手中间切过；改为 `X=310/W=285` 后手部完整，112×70 和 128×80 两套帧都重新采样。预览见 `_qa/art/baby-five-wavefix.png`、`baby-five-wavefix-cyber.png`。
- 交互改为 pointerdown 记录、移动 ≥5px 才 `startDragging()`、pointerup 未拖动才算点击；300ms 内第二次点击算双击。这样原生拖拽不会吞掉双击。
- 成年单击只播「哈哈哈哈哈」大笑；成年双击取消待播大笑，随机播一条安迪类语音；幼体没有大笑语音，单击/双击都只播安迪类，双击只触发一次。
- 静音时不播音频：成年单击字幕「哈哈哈哈哈」，双击字幕为安迪类，幼体字幕为安迪类。
- 验证：CDP 和真实系统鼠标双击都只播一条安迪类、不播大笑；移动 5px 不触发点击。

## 2026-11-16 — Phase 14：点击只命中角色本体

- 用户反馈桌宠窗口旁边的透明区域也会触发点击。原因是非透明字符 span 也被 `.pet-visual { pointer-events: none }` 关掉了，所有点击都由整块 `.pet-stage` 接收。
- 现在给 `.pet-ascii [class^="tone-"]:not(.tone-empty)` 重新开启 `pointer-events: auto`；透明格保持 none。按下时再用 `closest()` 确认目标是否为非透明字符。
- 透明区域仍可拖动窗口（pointermove 超过 5px 就 `startDragging()`），但松开不会触发点击、语音或字幕。
- 额外修复：pointermove 在 `buttons === 0` 时清空 pressRef，window pointerup/pointercancel/blur 也清理；否则 pointerup 丢失后窗口会跟随鼠标漂移。
- 验证：`elementFromPoint` 在中心返回 `SPAN.tone-shade`，在角落返回 `MAIN.pet-stage`；CDP 点中心播一条 meme，点角落 0 次播放、无气泡、HUD 保持 IDLE。
- 顺带修复：窗口中心离开所有显示器时，`monitorForWindow` 会退回到重叠面积最大的显示器/主显示器，启动 clamp 和默认定位仍能把窗口拉回可见区域。

## 2026-11-16 — Phase 15：0.2.2 控制台、图标与幼体嘴部

- 状态数保持 5：idle / walk / happy / click / wave。
- 设置页「关于」改成按需覆盖层，平时不占主面板；删除「恢复默认设置」按钮和 hook；真实 700px 窗口 `clientHeight 700 / scrollHeight 700`，不再滚动。
- 标签语改为「让奶娃住进每个奶家人的电脑」，README 同步。
- 应用图标改成幼体原色 ASCII 待机帧，`tauri icon` 重新生成 Windows/macOS/Android/iOS 全套图标；32×32 仍能读出黄身、绿眼和深色底。
- 幼体闭嘴帧的嘴线改成眼睛下方一条干净的 5 字符 `-`，清掉旧散点；112×70 / 128×80 两套都重生成。
- 控制台最后切成量子蓝黑终端配色：深蓝黑底、青色强调、浅青文字，保留直角布局；预览截图 `_qa/art/settings-quantum-closed.png`、`settings-quantum-about.png`。
- 版本 0.2.2，准备重新打包。

## 2026-11-16 — Phase 16：全局字号与 NSIS 安装器主题

- 用户反馈多处字号太小；设置页最小字号提到 12px：标签 15px、提示 13px、说明 12px、按钮 13px、关于元信息 12/13px；标题 30px。
- 设置窗口从 460×700 调到 520×760，放大后内容约 718px，仍不需要滚动。
- 桌宠 HUD 8px → 11px，字幕 11px → 13px。
- NSIS 安装器：header 150×57、sidebar 164×314 都改用幼体 ASCII 图标和量子配色；sidebar 标题 21px、标签 11px、底注 10px，header 标题 16px、副标题 10px。
- 安装器使用 `MUI_BGCOLOR 0B1116` / `MUI_TEXTCOLOR D7F8FF`，欢迎页/完成页文案改成赛博奶蛙主题；语言固定中文，去掉白色许可页。
- 验证：安装器首屏实际截图为深色 sidebar + 幼体图 + “欢迎使用赛博奶蛙”；设置页实际 520×760、760/760 不滚动，提示 13px、标签 15px、说明 12px。

## 2026-11-16 — Phase 17：成年奶蛙 25 帧大笑

- 明确角色边界：奶龙是可爱的原版、有版权；奶蛙是猎奇/无版权二创。本项目只做奶蛙，不使用奶龙素材。
- 找到 Codex Voice Input 的 25 帧 MIT 原始奶蛙大笑（`assets/pet/target/000–024.png`，180×180，2.25s）；动作是手放肚子 → 仰头 → 抱头/抱肚 → 回落。
- 为解决逐帧自动裁切造成的抖动，转换器增加 `-FixedSide/-CenterX/-CenterY`；25 帧统一使用 `side=149, center=84,101`。
- 嘴腔处理：先把所有 `_` 还原成手脚，再在上半脸找最大 `@/_` 连通块恢复为嘴腔，补 3 个 `=` 牙齿；解决脚底被误判成红色嘴腔的问题。
- 成年 happy/click 改为 25 帧、90ms/帧；click 380ms + happy 1870ms = 2.25s，click→happy 不重置帧索引，避免“抱头两次”。幼体仍使用 2 帧和 320/180ms 的原节奏。
- 验证：JSON 中 happy/click 各 25 个唯一帧；React 页面 2.8 秒采样到 26 个唯一帧，HUD `CLICK → HAPPY → IDLE`；`pnpm build` 通过。
- 修复 click→happy 重置导致的“抱头两次”：成年 click 与 happy 共用同一组 25 帧，click→happy 不重置帧索引；380ms + 1870ms = 2.25s，帧序列实测 0→25 连续递增。

## 2026-11-16 — Phase 18：设置页文案与桌宠标签开关

- 删除设置页“设置只存在本机，不上传，也不用登录。”这一行，只保留标签语。
- 新增 `hudEnabled` 设置（默认 `true`），控制桌宠下方 `NAIWA//IDLE` 的显示；设置页增加「桌宠标签」开关，旧设置缺省为显示。
- 设置页在 520×760 下仍为 `clientHeight 760 / scrollHeight 760`，没有滚动；冷启动后开关 true→false→true 双向生效。
- `pnpm build` 通过。

## 待人工确认

- 托盘菜单的物理点击仍需在桌面通知区实际点一遍；窗口 show/hide/设置/退出逻辑已实现。
- macOS 运行时行为无法在本机验证；CI 只能证明构建通过。
- 透明边缘点击穿透未实现，作为 v1 已知限制。
- 原色 112×70 / 赛博 128×80 已完成官方参考重做；赛博的 128 网格更细，原色的 112 网格脸部更清楚。再往上需要同步放大窗口或接受更细的字符。
- 长腿成年目前只有正面/侧面/背面三视图，大笑/挥手/低头仍用之前的成年动作素材；如果要动作也严格长腿版，需要补长腿动作参考。
