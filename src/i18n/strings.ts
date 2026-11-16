import type {
  Language,
  NaiwaReaction,
  PetAnimationState,
} from "../types/pet";

export const LANGUAGE_NAMES: Record<Language, string> = {
  zh: "中文",
  en: "English",
};

export interface UiStrings {
  settings: {
    windowTitle: string;
    title: string;
    intro: string;
    languageLabel: string;
    appearance: string;
    alwaysOnTop: string;
    alwaysOnTopHint: string;
    petSize: string;
    petSizeHint: string;
    age: string;
    ageHint: string;
    adult: string;
    baby: string;
    palette: string;
    paletteHint: string;
    original: string;
    cyber: string;
    classic: string;
    animation: string;
    animationHint: string;
    animationNote: string;
    hud: string;
    hudHint: string;
    sound: string;
    soundHint: string;
    about: string;
    aboutClose: string;
    version: string;
    data: string;
    dataValue: string;
    license: string;
    aboutNote: string;
    done: string;
    loading: string;
    saving: string;
    saved: string;
    saveFailed: string;
    errorPrefix: string;
    localOnly: string;
  };
  pet: {
    aria: string;
    stateAria: Record<PetAnimationState, string>;
    settingsError: string;
    reactions: readonly NaiwaReaction[];
  };
  menu: {
    hide: string;
    settings: string;
    quit: string;
  };
}

const ZH: UiStrings = {
  settings: {
    windowTitle: "赛博奶蛙",
    title: "赛博奶蛙",
    intro: "让奶娃住进每个奶家人的电脑",
    languageLabel: "语言",
    appearance: "外观",
    alwaysOnTop: "始终置顶",
    alwaysOnTopHint: "让奶蛙待在其他窗口上方。",
    petSize: "桌宠大小",
    petSizeHint: "窗口和 ASCII 角色一起缩放。",
    age: "成长阶段",
    ageHint: "成年是修长梨形；幼体是短圆大头、短手脚。",
    adult: "成年",
    baby: "幼体",
    palette: "形态",
    paletteHint: "原色赛博 / 量子赛博是 ASCII；奶家经典是原画。",
    original: "原色赛博",
    cyber: "量子赛博",
    classic: "奶家经典",
    animation: "动画",
    animationHint: "待机、走动和逐帧动画。",
    animationNote:
      "关闭动画后奶蛙保持静态；点击仍会切换表情作为反馈，但不会自动走动。",
    hud: "桌宠标签",
    hudHint: "在桌宠下方显示 NAIWA//IDLE 等状态字样。",
    sound: "声音",
    soundHint: "点击播放对应奶蛙语音；幼体是更高频的版本。",
    about: "关于",
    aboutClose: "返回设置",
    version: "版本",
    data: "数据",
    dataValue: "本地 JSON · 无云端",
    license: "许可",
    aboutNote:
      "关闭设置窗口后，奶蛙会继续在桌面运行。要完全退出，请使用托盘或奶蛙右键菜单。",
    done: "收起设置",
    loading: "读取中",
    saving: "保存中…",
    saved: "已保存",
    saveFailed: "保存失败",
    errorPrefix: "设置读写失败：",
    localOnly: "LOCAL ONLY",
  },
  pet: {
    aria: "赛博奶蛙桌面宠物",
    stateAria: {
      idle: "赛博奶蛙，待机",
      walk: "赛博奶蛙，走动",
      happy: "赛博奶蛙，开心",
      click: "赛博奶蛙，被点击",
      wave: "赛博奶蛙，挥手",
    },
    settingsError: "设置读取失败，已使用默认值",
    // Naiwa meme sound words, not self-written. Each line has a matching
    // WAV clip in src/assets/audio; sources are listed in README.md.
    reactions: [
      { text: "安迪", voice: "andi" },
      { text: "嘎嘎提拉瞎", voice: "gaga" },
      { text: "干巴得", voice: "ganbade" },
      { text: "哈哈哈哈哈", voice: "laugh" },
      { text: "哦啦", voice: "ola" },
      { text: "噶韭菜", voice: "gajiucai" },
    ],
  },
  menu: {
    hide: "隐藏桌宠",
    settings: "显示设置",
    quit: "退出赛博奶蛙",
  },
};

const EN: UiStrings = {
  settings: {
    windowTitle: "Cyber Naiwa",
    title: "Cyber Naiwa",
    intro: "Let Naiwa move into every Naiwa-family computer.",
    languageLabel: "Language",
    appearance: "Appearance",
    alwaysOnTop: "Always on top",
    alwaysOnTopHint: "Keep Naiwa above other windows.",
    petSize: "Pet size",
    petSizeHint: "Scales the window and the ASCII art together.",
    age: "Growth stage",
    ageHint: "Adults are tall and pear-shaped; babies are short, round, big-headed, with tiny limbs.",
    adult: "Adult",
    baby: "Baby",
    palette: "Form",
    paletteHint:
      "Original and Quantum are ASCII; Naiwa Classic uses the original artwork.",
    original: "Original Cyber",
    cyber: "Quantum Cyber",
    classic: "Naiwa Classic",
    animation: "Animation",
    animationHint: "Idle, walking and frame-by-frame motion.",
    animationNote:
      "With animation off, Naiwa holds still. Clicks still change the expression, but there's no automatic walking.",
    hud: "Status label",
    hudHint: "Show the NAIWA//IDLE status line below the pet.",
    sound: "Sound",
    soundHint: "Play the matching Naiwa voice line on click; the baby uses a higher-pitched version.",
    about: "About",
    aboutClose: "Back to settings",
    version: "Version",
    data: "Data",
    dataValue: "Local JSON · nothing leaves this machine",
    license: "License",
    aboutNote:
      "Closing this window leaves Naiwa on your desktop. To quit for real, use the tray or right-click Naiwa.",
    done: "Done",
    loading: "Loading",
    saving: "Saving…",
    saved: "Saved",
    saveFailed: "Save failed",
    errorPrefix: "Couldn't read or write settings: ",
    localOnly: "LOCAL ONLY",
  },
  pet: {
    aria: "CyberNaiwa desktop pet",
    stateAria: {
      idle: "Cyber Naiwa, idle",
      walk: "Cyber Naiwa, walking",
      happy: "Cyber Naiwa, happy",
      click: "Cyber Naiwa, clicked",
      wave: "Cyber Naiwa, waving",
    },
    settingsError: "Couldn't read settings; using defaults.",
    // These are Naiwa meme sound words; keep the Chinese originals in both locales.
    reactions: [
      { text: "安迪", voice: "andi" },
      { text: "嘎嘎提拉瞎", voice: "gaga" },
      { text: "干巴得", voice: "ganbade" },
      { text: "哈哈哈哈哈", voice: "laugh" },
      { text: "哦啦", voice: "ola" },
      { text: "噶韭菜", voice: "gajiucai" },
    ],
  },
  menu: {
    hide: "Hide pet",
    settings: "Settings",
    quit: "Quit Cyber Naiwa",
  },
};

export const UI_STRINGS: Record<Language, UiStrings> = { zh: ZH, en: EN };
