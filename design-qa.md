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

## 2026-11-16 — Phase 19：三种形态与奶家经典原画

- 原来的「配色」升级为「形态」：原色赛博 / 量子赛博继续使用 ASCII，新增奶家经典直接显示原画，不再转 ASCII。
- 从官方设计参考图抠出 6 张透明原画：成年 idle/wave、幼体 idle/happy/wave；只移除与边缘连通的白底/软阴影，并只保留最大连通角色，避免带上邻图手臂和橙色碎片。
- 成年 happy/click 使用 Codex Voice Input 的 25 帧 MIT 原画（原始 180×180 帧保存在 `classic/laugh/`，产品用 `classic/laugh-cropped/000–024.png`），90ms/帧；幼体三态各一张静态原画。图片皮肤注册为 `naiwa-classic`，`palette === "classic"` 时由 `PetAnimation` 切换到图片渲染。
- 图片点击按 alpha 命中：点击坐标换算到原图尺寸，读取 canvas 像素，alpha > 16 才算本体；透明像素不触发点击/语音/字幕，但透明区域仍可拖动窗口。
- 设置页改成三个直角分段按钮；`palette` 持久化接受 `original/cyber/classic`。520×760 下仍为 760/760，不滚动。
- 验证：冷启动恢复 `palette-classic` 后渲染 `adult-idle.png` 且无 ASCII；点击身体 2.7 秒采样到 `laugh-cropped/000` → `024` → `adult-idle`，HUD `CLICK → HAPPY → IDLE`；点击 alpha=0 的左上角 HUD 保持 `IDLE`；原色赛博/量子赛博来回切换均恢复 ASCII；`pnpm build` 通过。
- 截图：`_qa/art/settings-classic.png`、`_qa/art/classic-pet.png`；`docs/settings.png` 与 `docs/preview-classic.png` 已同步。

## 2026-11-16 — Phase 20：经典动作尺寸与脚部完整性

- 用户反馈：奶家经典成年大笑时身体变小，做动作时脚像被削掉。
- 原因一：图片皮肤只设 `max-height: 78vh`，180×180 的大笑帧不会被放大，仍按 180px 显示；成年待机 276×465 会缩到 296px 高，两者身体高度差近一半。
- 原因二：25 帧大笑原画的透明边距很大，180×180 里公共不透明范围只有 100×140，实际角色只占 140px 高。
- 修复：图片统一改成 `height: 78vh; width: auto`，小图也按窗口高度放大；25 帧按公共 alpha 范围加 4px padding 裁成 108×148 的 `laugh-cropped/`，角色占 140/148，显示后约 280px，和成年待机一致。原始帧保留在 `classic/laugh/` 以便复查。
- 六个经典状态实测（343×379 窗口）：成年待机 176×296 / 大笑 216×296 / 挥手 212×296；幼体待机 212×296 / 开心 217×296 / 挥手 244×296。所有可见像素都在窗口内，脚底距底边 30–38px，无横向或底部裁切。
- 目视检查：`_qa/art/classic-all-states.png`；单张 `_qa/art/classic-adult-laugh-cropped.png`。`pnpm build` 通过。

## 2026-11-16 — Phase 21：成年大笑高分辨率帧

- 用户反馈：成年大笑的分辨率可以再高一点，而且边缘有点过度锐化。
- 源仓库 `liaosongjie/Codex-Voice-Input` 只有 180×180 的 25 帧，没有更高分辨率原图；高分辨率静态参考图不能替代连续动作。传统插值只能减少放大痕迹，不能增加源图没有的细节。
- 第一版是 4× Lanczos + UnsharpMask（radius 1.4 / 45%）输出 432×592，边缘出现光晕；已废弃。
- 最终改为 6× Lanczos、无 UnsharpMask，输出 648×888 透明 WebP（`classic/laugh-hires/`），25 帧共约 1.75 MiB，90ms/帧。原始 180×180 帧和 108×148 紧裁帧都保留，便于复查或重新生成。
- 当前 343×379 窗口中，648×888 帧显示为 216×296，浏览器走降采样；在 100% / 150% 窗口缩放下也不会直接拉伸 108px 小图。
- 逐帧检查：25 帧全部为 648×888；按 alpha > 64 计算，最外可见像素距边缘至少 23px，腿、手臂和脚都没有被裁切。
- 验证：真实点击后 `img.naturalWidth×naturalHeight = 648×888`，`src` 为 `laugh-hires/006.webp`，显示尺寸 216×296；身体像素完整、脚底距底边 32px；`pnpm build` 通过。

## 2026-11-16 — Phase 22：成年动作栈、右键大笑与设置入口

- 成年左键改为走动作栈：`站立 → 扎马步 → 走 → 跑 → 张望 → 思考 → 鼓掌 → 进食 → 蹲伏 → 站立`；每档有独立时长，动作结束回站立但索引保留，连续点击可走完整套。左键同时随机播安迪类台词，260ms 防抖。
- 成年右键改为完整大笑：`click 380ms → happy 1870ms → idle`，不再打开原生菜单。中键点桌宠直接打开设置；Ctrl/⌘ + 右键保留原生菜单；托盘入口不变。
- 幼体保持独立动作栈：左键 `interact("meme")` → click/happy 1100ms，无大笑语音，右键仍是原生菜单。
- 空闲行为：成年 idle 9–16 秒只自动切 `wave`（扎马步）2.4 秒；walk/run/look/think/clap/eat/crouch 不自动播放。幼体仍随机 walk/wave。
- 奶家经典新增 47 张 Nailong-Studio MIT 动作帧，统一补齐到 180×210、底部对齐 y=204（6px 底边距）；逐帧 alpha 检查最小边距 6px。实测奔跑可见像素 x=70–273 / y=66–345，蹲伏 x=90–252 / y=67–346（343×379 窗口），脚和膝盖完整。
- 原色/量子 ASCII 共用同一动作栈，但新动作暂时映射到最接近的现有姿态：run=walk、look/think=idle、clap/eat=happy、crouch=wave；HUD/语音/时长仍是真实动作。实测 ASCII 状态序列 `idle → run → look → think → clap → eat → crouch → idle → wave → walk → run`。
- 实测经典动作序列 `idle → wave → walk → run → look → think → clap → eat → crouch → idle → wave`；右键采样 `idle → happy(005) → happy(013) → idle`；中键后设置窗 `visibility: visible`；幼体采样 `idle → click → happy → idle`。
- 截图：`_qa/art/classic-run.png`、`_qa/art/classic-crouch.png`、`_qa/art/classic-actions-padded.png`。`pnpm build` 通过。

## 2026-11-16 — Phase 23：1080p 大笑原片

- 用户反馈 6× Lanczos 仍然偏糊、边缘过锐，并同意使用素材库里的 1080×1474 `naiwa-laugh.mp4`。
- 从 6.50–8.75 秒按 11.11fps 精确抽 25 帧（1080×1474），动作覆盖手放肚子 → 仰头 → 双手抱头 → 回落，首尾姿态接近，可无缝循环。
- 抠图第一版出现奶油肚皮被咬掉、脚下白影、手臂/头之间白三角；改为：白底/软阴影阈值 `B>200 & S<25`、最大连通块、15px 形态学闭运算补细缝、脸部/身体保护区内的亮色细节保留、底部 18% 清地面阴影、脸部外亮楔形清除。
- 产品帧统一留 3% padding，Lanczos 缩到 524×720，透明 WebP quality 95，无 UnsharpMask，25 帧共约 975 KiB；`laugh-hires` 648×888 保留为 MIT 180×180 回退版。
- 验证：真实右键后 `naturalWidth×naturalHeight = 524×720`，`src` 为 `laugh-hd/008.webp`，显示 215×296；可见像素 x=86–256 / y=82–349（343×379 窗口），脚底距底边 30px，无裁切。截图 `_qa/art/classic-laugh-hd.png`。`pnpm build` 通过。

## 2026-11-16 — Phase 24：齿轮设置入口与“左键不出大笑”

- 用户问“中键是什么意思”，并明确“大笑不存在于左键能召唤出的一个动作”。
- 中键 = 按下鼠标滚轮；为触控板/不熟悉中键的用户增加右上角常驻半透明齿轮按钮，点击打开设置；中键、Ctrl/⌘ + 右键、托盘入口继续保留。
- 左键动作栈审计发现：ASCII 端 clap/eat 原先复用 `happy`（25 帧大笑），导致左键走到鼓掌/进食时看起来像大笑。已改为 clap=wave、eat=idle；左键栈不包含 happy/click，只有右键 `interact("laugh")` 会进入大笑。
- 冷启动验证 ASCII 左键序列：`wave → walk → run → look → think → clap → eat → crouch → idle → wave`，采样中没有 `click` / `happy`。
- 模块级验证：`frames.clap === frames.wave`、`frames.eat === frames.idle`、`frames.clap !== frames.happy`、`frames.eat !== frames.happy`；cyber 帧组同样成立。
- 齿轮按钮 `.pet-settings-button` 存在，程序化点击后设置窗 `visibility: visible`；按钮在鼠标悬停时变亮。
- `pnpm build` 通过。

## 2026-11-16 — Phase 25：经典站立提亮与 HUD 规则

- 用户反馈：奶家经典站立原画比其他形态/动作帧更深；其他颜色不动，只把站立稍微提亮。
- 原站立帧 mean luminance 154.9 / saturation 163.7；动作 walk 170.8 / 129.3、run 172.9 / 130.6。用 PIL 对原图做 ×1.09 亮度、×0.80 色彩，生成 `adult-idle-aligned.png`，实测 170.9 / 137.4，接近动作帧；原 `adult-idle.png` 保留。
- 删除设置页「桌宠标签」开关和 `hudEnabled` 持久化字段；旧设置里的 `hudEnabled` 直接忽略。
- HUD 规则改为按形态派生：原色赛博显示暖黄 `rgba(255,216,77,0.62)` + 黄点；量子赛博保持蓝色 `rgba(126,249,255,0.6)` + 青点；奶家经典不渲染 HUD。
- 验证：设置页标签只剩 始终置顶 / 桌宠大小 / 成长阶段 / 形态 / 动画 / 声音，520×760 下 `clientHeight 760 / scrollHeight 760`；原色 HUD 计算色为暖黄，量子为青色，经典 `hud: false`；`docs/settings.png` 和 `docs/preview-classic.png` 已更新；`pnpm build` 通过。

## 2026-11-16 — Phase 26：经典站立换源、悬停齿轮与大笑胯下白块

- 用户要求只改经典站立，让颜色/画风与动作帧一致，并注意腿脚完整。改用 Nailong-Studio 的 6 帧待机 `classic/idle/00–05.png`（MIT），统一补到 180×210、底部 y=204；6 帧 alpha 最小边距 6px，脚和膝盖完整。旧的调亮长腿站立保留为回退/参考。
- 经典 idle 现在按 260ms/帧轮播；实测 `idle/04.png → idle/00.png`，HUD 仍为 `false`。
- 设置齿轮改为悬停显示：未悬停时 computed opacity `0`、pointer-events `none`；鼠标移到桌宠上后 opacity `1`、pointer-events `auto`。
- 用户反馈左键仍会“召唤大笑”。逐帧比对发现左键栈里的「进食」张嘴仰头，视觉上就是一次大笑；已把 `eat` 从 `ADULT_ACTION_STACK` 移除（素材保留）。左键栈现在是 站立 → 扎马步 → 走 → 跑 → 张望 → 思考 → 鼓掌 → 蹲伏；25 帧 `happy`/`click` 只能右键触发。
- 用户反馈大笑胯部有空白白块。25 帧合成到深色背景后确认：两腿/胯下的白底是封闭区域，边缘灌水到不了，身体保护又把它留下。新增下半身 `brightness > 235 & saturation < 20` 清理规则，25 帧全部重抠；深色审计图 `_qa/art/laugh-hd-audit-dark-fixed.png` 中白块消失，脚和腿完整。
- 截图：`_qa/art/classic-idle-frames.png`、`_qa/art/classic-idle-nailong.png`、`_qa/art/classic-laugh-crotch-fixed-dark.png`。`pnpm build` 通过。

## 2026-11-16 — Phase 27：恢复正面站立

- 用户反馈经典站立变成斜着站，问有没有正面站立。Nailong `待机` 6 帧都是 3/4 侧身；同画风没有正面桌宠待机。
- 恢复正面官方站立 `adult-idle-aligned.png` 为默认经典 idle（×1.09 亮度、×0.80 色彩，腿部/脚部完整）；Nailong 的 `classic/idle/00–05.png` 保留为 3/4 侧身备选，不再作为默认。
- `docs/preview-classic.png` 改回正面站立，HUD 仍隐藏；`pnpm build` 通过。

## 2026-11-16 — Phase 28：手/脚/膝盖完整性与站立再提亮

- 用户要求彻底检查手、脚、膝盖被削掉的问题。79 个经典图片资产逐一跑 alpha bbox：`baby-happy` 最小边距 0px、`baby-idle` 1px；成人动作帧 6px；laugh 18px；成人正面 idle 14px。
- 幼体三张从官方 `official-juvenile.png` 重新放宽裁切（idle X=50/W=310、wave X=290/W=320、happy X=560/W=330，Y=220/H=540），并保留 14px 内边距；输出 239×315 / 259×314 / 251×314，手、脚、膝盖完整。审计图 `_qa/art/baby-limb-audit.png`。
- ASCII 四套 JSON 的网格边界也检查：成人最小 1–2 格，幼体 happy/click 有 0 格贴边，但 pre/transform 完整可见、未被窗口裁切，所以不改 ASCII 画稿。
- 正面站立再提亮：从原始未调色版本按 ×1.14 亮度、×0.78 色彩重新生成 `adult-idle-aligned.png`，实测 mean lum 176.6 / sat 134.4（之前 170.9 / 137.4）；`docs/preview-classic.png` 已更新。
- 设置齿轮仍为悬停显示；经典 HUD 隐藏。`pnpm build` 通过。

## 2026-11-16 — Phase 29：并发点击、4.11s 大笑与 ASCII 马扎步

- 用户反馈动作/语音没结束时再点无效。移除了成年左键的 260ms 防抖；`advanceAction()` 每次点击都清掉上一档定时器并立即推进。150ms 间隔连点实测状态持续前进，不再等动作结束。
- 语音并发：`sound.ts` 增加 `activePlayer` 和 `stopNaiwaVoice()`；`playNaiwaVoice()` 先 pause 当前播放器再播新语音。实测右键大笑 500ms 后左键，日志为 `pause laugh → play laugh → pause laugh → pause gaga → play gaga`，新语音正常打断旧语音。
- 成年大笑音频 `naiwa-laugh-long.wav` 实测 4.11s；ASCII happy/click 帧间隔改为 164ms（25×164≈4.10s），`HAPPY_STATE_MS` 改为 3730ms，click 380 + happy 3730 = 4.11s；奶家经典图片帧全局间隔也改为 164ms。实测右键后 0.8s/2.5s/3.5s 仍是 `happy`（帧 004/014/021），4.4s 回 `idle`。
- 用户反馈 ASCII 马扎步膝盖被削。经典 `adult-wave.png` 完整；ASCII wave 帧贴着 112×70/128×80 网格边缘。给四套 JSON 的 wave 帧统一加 2 格透明边距并居中缩小，audit 图 `_qa/art/ascii-wave-padded.png`；其他动作帧不动。
- `pnpm build` 通过。

## 2026-11-16 — Phase 30：动作流程锁（按用户澄清）

- 用户澄清：不是要“连点打断”，而是要“点进一个动作流程后，必须等动作和语音完全结束，才能进入下一个流程”。之前 Phase 29 的打断/防抖移除按此纠正。
- `Pet.tsx` 增加 `flowLock`：成年左键锁 `max(actionDuration, voiceDuration) + 50ms`，右键大笑锁 `max(4110, 4.11s语音) + 50ms`，幼体锁 `max(1480, 语音/1.35) + 50ms`；锁内左键/右键一律忽略。
- `playNaiwaVoice()` 返回本次语音实际时长（优先 `audio.duration`，回退 WAV 时长表；baby 除以 1.35）。`usePetState.advanceAction()` 返回 `{ state, duration }`，供流程锁使用。
- 实测：站立第一次点击进入 `wave`，150ms 连点 5 次仍保持 `wave`；3 秒后下一次点击才进入 `walk`。右键大笑后 800ms 左键仍保持 `happy`；4.3 秒流程结束后下一次左键才推进（`run`）。
- 设置齿轮、托盘、中键/Ctrl+右键不受流程锁影响，仍可打开设置/菜单。
- `pnpm build` 通过。

## 2026-11-16 — Phase 31：ASCII 马扎步左膝补全

- 用户反馈 Phase 29 的“加 2 格边距”后左膝仍像被削。审计发现：源图 `classic/adult-wave.png` 左膝完整，ASCII 网格也没有越界；源图在脚踝处本身有收窄，112×70 下膝→小腿的宽度从 19 格降到 11 格，且小腿被判成棕色 `|`，与金色膝盖之间出现生硬断层，视觉上像被截断。
- 改为从 `classic/adult-wave.png` 固定取景重采样：`FixedSide 430`、`CenterX 148`、`CenterY 206`（原色 112×70，量子 128×80）；网格帧四周留 3/4 格，膝/脚不再贴边。审计图 `_qa/art/ascii-wave-regenerated.png`。
- 新增 `_qa/patch-ascii-wave-knee.py`：把成年 wave 帧膝下小腿的 `|`（棕色四肢）提升为 `%`（金色阴影），脚掌保留 `|`；左膝到小腿变成连续金色轮廓，脚仍是棕色。原色/量子两套都处理，其他动作帧和幼体不动。
- 实机截图：`_qa/art/ascii-wave-knee-patched-app-dark.png`、`_qa/art/ascii-cyber-wave-knee-patched-app-dark.png`；两套都确认左膝、左脚完整，HUD 仍为 STANCE。
- `pnpm build` 通过。

## 2026-11-16 — Phase 32：圆胖站立与新增招手动作

- 用户要求多找成年动作，并让站立奶蛙更像动作原画里的圆胖奶蛙。检查 `_qa/reference/actions` 发现一组未接入的 `待机-01/03/06` 全身帧和 `招手-01/02/04` 3 帧，和 walk/run 是同一套 Nailong 圆胖 3D 画风。
- 经典 idle 改为 `classic/idle-chubby/00–02.png`：从 `待机-06/01/03` 生成 3 帧，180×210、底部 y=204（6px 底边距），1200ms/帧；首帧用最正面的 `待机-06`。`adult-idle-aligned.png` 保留为高瘦正面回退，`classic/idle/00–05.png` 仍是 3/4 备选。之前“3/4 待机不能当默认”的结论只针对 `classic/idle` 那组；这组 `待机` 首帧是正面，且和动作帧同画风。
- 新增成年 `beckon`（招手）状态：经典帧 `classic/actions/beckon/00–02.png` 来自 `招手-01/02/04`，220ms/帧；动作时长 1800ms；动作栈插在 `wave` 后：`idle → wave → beckon → walk → ...`；HUD `BECKON`，ARIA 中英同步。ASCII 两套用 `FixedSide 230`、中心 `(63,99)` 生成 3 帧 112×70/128×80，350ms/帧；转 ASCII 时脚/手误判的 `_` 已改回 `|`。幼体不使用。
- 实测：经典 idle 首帧 `idle-chubby/00.png` 正面圆胖；经典 `beckon` 第 1 帧 `actions/beckon/01.png` 抬手；原色/量子 ASCII `beckon` 都显示抬手，HUD `NAIWA//BECKON`；流程锁实测 `wave → beckon`，招手 300ms 内再点仍是 `beckon`，1.9s 后下一档才到 `walk`。
- 动作原画仍来自 Nailong-Studio 的 MIT 素材；没有引入新的外部授权来源。`pnpm build` 通过。

## 2026-11-16 — Phase 33：透明区域点击穿透

- 用户反馈只有桌宠本身和设置键应该拦截鼠标，透明区域不应挡住后面。之前整个矩形窗口都会挡住点击，只有 DOM 层忽略透明格，OS 层没有穿透。
- 新增 `useClickThrough`：每 32ms 读取全局 `cursorPosition()`，用 `innerPosition()` + `devicePixelRatio` 换算到窗口 client 坐标；ASCII 命中 tone 格、图片命中 alpha>16、或命中 `.pet-settings-button` 矩形时 `setIgnoreCursorEvents(false)`，其余保持 `true`。只在状态变化时调用原生 API。
- 齿轮显示改由 `pointerInside` 状态类驱动，不再依赖 `:hover`；因此窗口处于穿透状态时，光标进入窗口仍能显示齿轮，齿轮矩形也会参与命中。透明边、气泡、HUD、阴影都不再拦截。
- 补权限：`core:window:allow-cursor-position`、`allow-inner-position`、`allow-scale-factor`、`allow-set-ignore-cursor-events`。IPC 失败按 500ms 重试，连续 8 次才回退普通窗口。
- 验证：用仅开发态的命中点模拟分别测 ASCII idle、经典 idle 的角色/透明边/齿轮；Win32 `WS_EX_TRANSPARENT` 在角色和齿轮时为 `False`，在透明边时为 `True`。开发态钩子已移除；物理光标测试受窗口拖动干扰，但原生标志与命中结果一致。
- 已知取舍：32ms 轮询意味着快速掠过边缘可能有不到一帧的延迟；透明边不再能拖动，拖动要抓角色；设置窗口本身不穿透。`pnpm build` 通过。

## 2026-11-17 — Phase 34：右键菜单、双击大笑、走跑静音与取消齿轮

- 用户要求成年右键恢复原生菜单，左键双击大笑；走、跑不搭配声音；右键可用后去掉右上角设置键。
- `usePetInteraction` 的右键分支简化为始终 `showPetMenu(language)`，删掉 `onSecondary`、Ctrl/⌘ 条件和右键大笑。`PetMenu` 里已有「设置 / 隐藏 / 退出」三项。
- `Pet.tsx` 的成年单击改为 300ms 双击窗口：第一次点击只启动计时；300ms 内第二次点击取消待执行动作并 `interact("laugh")`；超时后才 `advanceAction()`。单击流程锁仍按 `max(actionDuration, voiceDuration) + 50ms`。
- 走、跑进入时调用 `clearReaction()`，不调用 `speak()` / `playNaiwaVoice()`；流程锁只按动作时长。其他动作保持原语音和字幕。
- 去掉 `.pet-settings-button` 按钮、悬停 CSS、`pointerInside` 状态和 `pet-stage--pointer-inside` 类；`useClickThrough` 也去掉设置键矩形命中。现在只有角色不透明像素拦截鼠标，透明边、气泡、HUD、阴影和右上角全部穿透。
- 实测：单击后 100ms 仍是 `idle`，400ms 进入 `wave`；双击后进入 `happy`，音频日志只有 `naiwa-laugh-long.wav`；`walk` / `run` 进入时音频日志为空；右键后状态保持 `idle`，系统出现 `#32768` 原生菜单窗口，没有笑声。
- 已知取舍：双击要等 300ms 才执行单击动作；动作流程进行中双击仍被流程锁忽略；设置可通过右键菜单、中键或托盘进入。`pnpm build` 通过。

## 2026-11-17 — Phase 35：6 帧待机循环

- 上游 NaiWa-Wallpaper v2.7 的 `pet/` 列出 6 帧待机；本地 `_qa/reference/actions/full/idle/00–05.png` 已经是完整一套（对应 `待机-01`–`待机-06`），不需要重新下载。
- `classic/idle-chubby` 从 3 帧扩到 6 帧，输出顺序 `05 → 00 → 01 → 02 → 03 → 04`（从最正面的 `待机-06` 开始循环），仍为 180×210、底部 y=204（6px 底边距）。
- `frameIntervalMsByState.idle` 从 1200ms 改为 600ms，6 帧约 3.6 秒一循环；`src` 实测在 `00 → 02 → 03` 之间轮播。
- 文档同步：站立从“3 帧 / 1200ms / 待机-06/01/03”改为“6 帧 / 600ms / 待机-01–06”。`pnpm build` 通过。

## 2026-11-17 — Phase 36：新增躺平

- 用户从候选里只保留躺平，要求去掉地上的白色/浅灰线；倾听、忙碌、沮丧都不接。
- 源图 `躺平帧.png` / `躺平翻身帧.png` 的贴地浅灰阴影在底部 5 行及缩放后的低饱和区域；`_qa/build-classic-lie.py` 先清底部阴影，再在最终画布上清除低饱和亮像素，白线消失。
- 躺平使用 280×170 宽画布、2 帧、底部 y=164（6px 底边距），帧间隔 800ms；CSS 对 `.pet-visual--lie img` 改为 `height:auto; width:92%`，否则 78vh 高度规则会把横躺角色缩成小条。
- `lie` 插在动作栈末尾：`... → crouch → lie → idle`，时长 2600ms；经典使用 `classic/lie/00–01.png`，ASCII 原色/量子复用 `crouch` 帧，HUD 为 `LIE`，ARIA 中英同步。
- 实机点完整套动作栈后停在 `lie`：`src=/src/assets/pets/classic/lie/00.png`，图片区域 231×140，横躺落在窗口底部，白线不再出现。
- 同库的 192×208 `emotes`（爬行/得意/张望/托腮）是扁平 2D 风格，和经典 3D 动作不搭；Codex 的 waiting/review 是另一套模型，暂不混入。`pnpm build` 通过。

## 2026-11-17 — Phase 37：新增等待 / 检查

- 继续找全身动画时，`NaiWa-Wallpaper` 的 `emotes` 是扁平 2D（爬行/得意/张望/托腮），和经典 3D 动作不搭；Codex 奶蛙仓库的 `waiting.png` / `review.png` 是 192×208 的 3D 透明 APNG，各有 6 帧，风格更接近。
- `_qa/build-classic-codex-actions.py` 把每帧等比缩到 180×195、底部对齐到 y=204，输出 `classic/actions/wait/00–05.png` 和 `classic/actions/review/00–05.png`。
- 动作栈插入 `think → wait → review → clap`；经典帧间隔 150ms，动作时长各 1800ms；ASCII 原色/量子分别复用 idle，HUD 为 `WAIT` / `REVIEW`，ARIA 中英同步。
- 实机点击确认：`wait` 停在 `actions/wait/03.png`，`review` 停在 `actions/review/03.png`，画面正常。Codex 模型比 Nailong 动作帧略高瘦，但仍是圆胖 3D 奶蛙，先接进来供评估。
- 来源/授权：`timerring/codex-pet-naiwa` 仓库 MIT；上游 Credits 中的第三方素材授权未随仓库完全明确，已在 README 标注，若需严格合规可回退这两档。`pnpm build` 通过。

## 2026-11-17 — Phase 38：CV 超分修复躺平锯齿

- 用户反馈躺平边缘仍有锯齿/白线。源图只有 98×57，直接 Lanczos 放大到 280×170 会保留硬边。
- 新增 `_qa/cv-lie-sr.py`，用本地 OpenCV 5 venv（`_qa/cv-venv`，不改全局）：裁到 alpha、去掉底部灰线、对透明区做 `cv2.inpaint`，再用 FSRCNN x4 超分、双边滤波保边；alpha 取最大连通域后用有符号距离场重建，4px 羽化，缩到显示尺寸后边缘平滑。
- 输出改为 560×340（2×）画布，底部 y=328（12px 底边距），浏览器显示时再缩小，边缘更平滑；最后的连通域清理只删除底部面积 <200、y>280 的小亮块，保留肚皮、眼睛高光和自然的接触阴影。
- 预览对比 `_qa/art/lie-display-compare.png`（按实际 231×140 显示尺寸）：旧帧底部白线和台阶状边缘明显，新帧白斑消失、轮廓平滑；剩下的一条很细暗线是贴地接触阴影，不是白线。`pnpm build` 通过。

## 待人工确认

- 托盘菜单的物理点击仍需在桌面通知区实际点一遍；窗口 show/hide/设置/退出逻辑已实现。
- macOS 运行时行为无法在本机验证；CI 只能证明构建通过。
- 原色 112×70 / 赛博 128×80 已完成官方参考重做；赛博的 128 网格更细，原色的 112 网格脸部更清楚。再往上需要同步放大窗口或接受更细的字符。
- 长腿成年目前只有正面/侧面/背面三视图，大笑/挥手/低头仍用之前的成年动作素材；如果要动作也严格长腿版，需要补长腿动作参考。
