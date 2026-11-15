# 奶蛙点击语音

点击桌宠时，`src/hooks/usePetState.ts` 先随机选一句台词，再由
`src/services/sound.ts` 播放同一句对应的 WAV。成年按 1.0× 播放；幼体按
1.35× 播放并关闭 `preservesPitch`，得到更高频的幼体声线。

| 台词 | 文件 | 原始文件名 | 时长 |
| --- | --- | --- | --- |
| 安迪 | `naiwa-andi.wav` | `安迪.wav` | 1.85s |
| 嘎嘎提拉瞎 | `naiwa-gaga.wav` | `嘎嘎提拉瞎.wav` | 1.17s |
| 干巴得 | `naiwa-ganbade.wav` | `干巴得.wav` | 1.11s |
| 哈哈哈哈哈 | `naiwa-laugh-long.wav` | `大笑.wav` | 4.11s |
| 哦啦 | `naiwa-ola.wav` | `哦啦.wav` | 0.96s |
| 噶韭菜 | `naiwa-gajiucai.wav` | `噶韭菜.wav` | 0.89s |

## 来源与授权

六段语音来自 [VIPmrgj/Dragon-frog](https://github.com/VIPmrgj/Dragon-frog)
的 `音效/` 目录：

<https://github.com/VIPmrgj/Dragon-frog/tree/main/%E9%9F%B3%E6%95%88>

该仓库没有 LICENSE 文件，也没有 README 授权声明。本项目按粉丝二创、非商业
方式使用，并在主 README 和 `README.en.md` 标注来源；奶蛙形象和语音的权利归
各自原作者/二创作者，若权利人要求会立即移除。**不要**把这六段音频当作 MIT
素材再分发。

## 旧版 MIT 笑声

`naiwa-laugh.wav` 是 1.8 秒、22050Hz 单声道的旧版点击笑声，来自
[Nailong-Studio/NaiWa-Wallpaper](https://github.com/Nailong-Studio/NaiWa-Wallpaper)
的 `audio/奶蛙-桌宠笑声.wav`；该文件声明为 MIT，原始来源是
[liaosongjie/Codex-Voice-Input](https://github.com/liaosongjie/Codex-Voice-Input)
的 `assets/pet/sounds/laugh.wav`。当前点击逻辑使用上面的六段语音，这个文件
仅作为历史/备用素材保留。
