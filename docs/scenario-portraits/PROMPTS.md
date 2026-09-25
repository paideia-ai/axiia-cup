# 头像生成角色与完整提示词

本文件记录这 29 张头像实际使用的角色描述和完整英文提示词，可直接复制用于再次生成。每个角色单独调用内置 ImageGen，未使用参考图。

角色来源为 `axiia-cup` 的五个场景脚本，读取版本：`072a32403034ff415b2dec6df36d927b918652cb`。共 27 个出场或发言角色，加顾衡、纪川两位案件人物。未由剧本明确的外貌、服装和性别表现为美术设计补充。

提示词中的 64 × 64 逻辑像素、四色和 1024 × 1024 是生成要求；实际交付为 1254 × 1254 PNG，未做严格网格或四色索引转换。机器可读资料及原图校验值见 [manifest.json](manifest.json)，头像总览见 [README.md](README.md)。

## 角色索引

| 场景 | 角色 | 素材 ID | 原图 |
| --- | --- | --- | --- |
| 商鞅变法 | [商鞅](#portrait-01) | `shangyang` | [PNG](shangyang-court/shangyang.png) |
| 商鞅变法 | [甘龙](#portrait-02) | `ganlong` | [PNG](shangyang-court/ganlong.png) |
| 商鞅变法 | [秦孝公](#portrait-03) | `qin-xiaogong` | [PNG](shangyang-court/qin-xiaogong.png) |
| 本能寺之变 | [长宗我部元亲的密使](#portrait-04) | `chosokabe-envoy` | [PNG](honnoji-decision/chosokabe-envoy.png) |
| 本能寺之变 | [足利义昭的使者](#portrait-05) | `yoshiaki-envoy` | [PNG](honnoji-decision/yoshiaki-envoy.png) |
| 本能寺之变 | [细川藤孝](#portrait-06) | `hosokawa-fujitaka` | [PNG](honnoji-decision/hosokawa-fujitaka.png) |
| 本能寺之变 | [明智军中的足轻](#portrait-07) | `ashigaru` | [PNG](honnoji-decision/ashigaru.png) |
| 本能寺之变 | [明智光秀](#portrait-08) | `akechi-mitsuhide` | [PNG](honnoji-decision/akechi-mitsuhide.png) |
| 电车难题 | [奕仁](#portrait-09) | `yiren` | [PNG](trolley-problem/yiren.png) |
| 电车难题 | [武仁](#portrait-10) | `wuren` | [PNG](trolley-problem/wuren.png) |
| 电车难题 | [明理者](#portrait-11) | `minglizhe` | [PNG](trolley-problem/minglizhe.png) |
| 凤仪亭之夜 | [董卓](#portrait-12) | `dongzhuo` | [PNG](fengyiting-real/dongzhuo.png) |
| 凤仪亭之夜 | [吕布](#portrait-13) | `lvbu` | [PNG](fengyiting-real/lvbu.png) |
| 凤仪亭之夜 | [貂蝉](#portrait-14) | `diaochan` | [PNG](fengyiting-real/diaochan.png) |
| 凤仪亭之夜 | [细作](#portrait-15) | `spy` | [PNG](fengyiting-real/spy.png) |
| 凤仪亭之夜 | [董卓旧部](#portrait-16) | `veteran` | [PNG](fengyiting-real/veteran.png) |
| 码头疑云 | [林](#portrait-17) | `lin` | [PNG](legal-harbor-murder-jury/lin.png) |
| 码头疑云 | [苏](#portrait-18) | `su` | [PNG](legal-harbor-murder-jury/su.png) |
| 码头疑云 | [陈岚](#portrait-19) | `chen-lan` | [PNG](legal-harbor-murder-jury/chen-lan.png) |
| 码头疑云 | [魏笙](#portrait-20) | `wei-sheng` | [PNG](legal-harbor-murder-jury/wei-sheng.png) |
| 码头疑云 | [韩朔](#portrait-21) | `han-shuo` | [PNG](legal-harbor-murder-jury/han-shuo.png) |
| 码头疑云 | [沈青](#portrait-22) | `shen-qing` | [PNG](legal-harbor-murder-jury/shen-qing.png) |
| 码头疑云 | [杜临](#portrait-23) | `du-lin` | [PNG](legal-harbor-murder-jury/du-lin.png) |
| 码头疑云 | [孟遥](#portrait-24) | `meng-yao` | [PNG](legal-harbor-murder-jury/meng-yao.png) |
| 码头疑云 | [方稚](#portrait-25) | `fang-zhi` | [PNG](legal-harbor-murder-jury/fang-zhi.png) |
| 码头疑云 | [蒋诚](#portrait-26) | `jiang-cheng` | [PNG](legal-harbor-murder-jury/jiang-cheng.png) |
| 码头疑云 | [宁柏](#portrait-27) | `ning-bai` | [PNG](legal-harbor-murder-jury/ning-bai.png) |
| 码头疑云 | [顾衡](#portrait-28) | `gu-heng` | [PNG](legal-harbor-murder-jury/gu-heng.png) |
| 码头疑云 | [纪川](#portrait-29) | `ji-chuan` | [PNG](legal-harbor-murder-jury/ji-chuan.png) |

## 商鞅变法

<a id="portrait-01"></a>

### 01. 商鞅

- 角色依据：剧本身份；外貌为设计补充。
- 场景脚本：[shangyang-court](../../v2/scenarios/scenarios/shangyang-court/script.js)。
- 原图：[shangyang-court/shangyang.png](shangyang-court/shangyang.png)。

**生成时的角色描述（原文）**

```text
Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
```

<a id="portrait-02"></a>

### 02. 甘龙

- 角色依据：剧本身份；外貌为设计补充。
- 场景脚本：[shangyang-court](../../v2/scenarios/scenarios/shangyang-court/script.js)。
- 原图：[shangyang-court/ganlong.png](shangyang-court/ganlong.png)。

**生成时的角色描述（原文）**

```text
Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
```

<a id="portrait-03"></a>

### 03. 秦孝公

- 角色依据：剧本裁决者；外貌为设计补充。
- 场景脚本：[shangyang-court](../../v2/scenarios/scenarios/shangyang-court/script.js)。
- 原图：[shangyang-court/qin-xiaogong.png](shangyang-court/qin-xiaogong.png)。

**生成时的角色描述（原文）**

```text
Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
```

## 本能寺之变

<a id="portrait-04"></a>

### 04. 长宗我部元亲的密使

- 角色依据：剧本角色；无名密使形象为设计补充。
- 场景脚本：[honnoji-decision](../../v2/scenarios/scenarios/honnoji-decision/script.js)。
- 原图：[honnoji-decision/chosokabe-envoy.png](honnoji-decision/chosokabe-envoy.png)。

**生成时的角色描述（原文）**

```text
Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
```

<a id="portrait-05"></a>

### 05. 足利义昭的使者

- 角色依据：剧本角色；无名使者形象为设计补充。
- 场景脚本：[honnoji-decision](../../v2/scenarios/scenarios/honnoji-decision/script.js)。
- 原图：[honnoji-decision/yoshiaki-envoy.png](honnoji-decision/yoshiaki-envoy.png)。

**生成时的角色描述（原文）**

```text
Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
```

<a id="portrait-06"></a>

### 06. 细川藤孝

- 角色依据：剧本角色；外貌为设计补充。
- 场景脚本：[honnoji-decision](../../v2/scenarios/scenarios/honnoji-decision/script.js)。
- 原图：[honnoji-decision/hosokawa-fujitaka.png](honnoji-decision/hosokawa-fujitaka.png)。

**生成时的角色描述（原文）**

```text
Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
```

<a id="portrait-07"></a>

### 07. 明智军中的足轻

- 角色依据：剧本角色；无名足轻形象为设计补充。
- 场景脚本：[honnoji-decision](../../v2/scenarios/scenarios/honnoji-decision/script.js)。
- 原图：[honnoji-decision/ashigaru.png](honnoji-decision/ashigaru.png)。

**生成时的角色描述（原文）**

```text
Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
```

<a id="portrait-08"></a>

### 08. 明智光秀

- 角色依据：剧本裁决者；外貌为设计补充。
- 场景脚本：[honnoji-decision](../../v2/scenarios/scenarios/honnoji-decision/script.js)。
- 原图：[honnoji-decision/akechi-mitsuhide.png](honnoji-decision/akechi-mitsuhide.png)。

**生成时的角色描述（原文）**

```text
Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
```

## 电车难题

<a id="portrait-09"></a>

### 09. 奕仁

- 角色依据：剧本立场；年龄、长相为设计补充。
- 场景脚本：[trolley-problem](../../v2/scenarios/scenarios/trolley-problem/script.js)。
- 原图：[trolley-problem/yiren.png](trolley-problem/yiren.png)。

**生成时的角色描述（原文）**

```text
Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
```

<a id="portrait-10"></a>

### 10. 武仁

- 角色依据：剧本立场；年龄、长相为设计补充。
- 场景脚本：[trolley-problem](../../v2/scenarios/scenarios/trolley-problem/script.js)。
- 原图：[trolley-problem/wuren.png](trolley-problem/wuren.png)。

**生成时的角色描述（原文）**

```text
Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
```

<a id="portrait-11"></a>

### 11. 明理者

- 角色依据：剧本裁决者为普通人；外貌为设计补充。
- 场景脚本：[trolley-problem](../../v2/scenarios/scenarios/trolley-problem/script.js)。
- 原图：[trolley-problem/minglizhe.png](trolley-problem/minglizhe.png)。

**生成时的角色描述（原文）**

```text
Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
```

## 凤仪亭之夜

<a id="portrait-12"></a>

### 12. 董卓

- 角色依据：剧本角色；外貌为设计补充。
- 场景脚本：[fengyiting-real](../../v2/scenarios/scenarios/fengyiting-real/script.js)。
- 原图：[fengyiting-real/dongzhuo.png](fengyiting-real/dongzhuo.png)。

**生成时的角色描述（原文）**

```text
Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
```

<a id="portrait-13"></a>

### 13. 吕布

- 角色依据：剧本角色；外貌为设计补充。
- 场景脚本：[fengyiting-real](../../v2/scenarios/scenarios/fengyiting-real/script.js)。
- 原图：[fengyiting-real/lvbu.png](fengyiting-real/lvbu.png)。

**生成时的角色描述（原文）**

```text
Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
```

<a id="portrait-14"></a>

### 14. 貂蝉

- 角色依据：剧本角色与裁决者；外貌为设计补充。
- 场景脚本：[fengyiting-real](../../v2/scenarios/scenarios/fengyiting-real/script.js)。
- 原图：[fengyiting-real/diaochan.png](fengyiting-real/diaochan.png)。

**生成时的角色描述（原文）**

```text
Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
```

<a id="portrait-15"></a>

### 15. 细作

- 角色依据：剧本NPC；外貌为设计补充。
- 场景脚本：[fengyiting-real](../../v2/scenarios/scenarios/fengyiting-real/script.js)。
- 原图：[fengyiting-real/spy.png](fengyiting-real/spy.png)。

**生成时的角色描述（原文）**

```text
Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
```

<a id="portrait-16"></a>

### 16. 董卓旧部

- 角色依据：剧本NPC；外貌为设计补充。
- 场景脚本：[fengyiting-real](../../v2/scenarios/scenarios/fengyiting-real/script.js)。
- 原图：[fengyiting-real/veteran.png](fengyiting-real/veteran.png)。

**生成时的角色描述（原文）**

```text
Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
```

## 码头疑云

<a id="portrait-17"></a>

### 17. 林

- 角色依据：剧本陪审员；年龄、长相为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/lin.png](legal-harbor-murder-jury/lin.png)。

**生成时的角色描述（原文）**

```text
Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
```

<a id="portrait-18"></a>

### 18. 苏

- 角色依据：剧本陪审员；年龄、长相为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/su.png](legal-harbor-murder-jury/su.png)。

**生成时的角色描述（原文）**

```text
Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
```

<a id="portrait-19"></a>

### 19. 陈岚

- 角色依据：剧本明确44岁、社区调解主管；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/chen-lan.png](legal-harbor-murder-jury/chen-lan.png)。

**生成时的角色描述（原文）**

```text
Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
```

<a id="portrait-20"></a>

### 20. 魏笙

- 角色依据：剧本明确36岁、轨道调度员；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/wei-sheng.png](legal-harbor-murder-jury/wei-sheng.png)。

**生成时的角色描述（原文）**

```text
Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
```

<a id="portrait-21"></a>

### 21. 韩朔

- 角色依据：剧本明确41岁、设施工程师；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/han-shuo.png](legal-harbor-murder-jury/han-shuo.png)。

**生成时的角色描述（原文）**

```text
Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
```

<a id="portrait-22"></a>

### 22. 沈青

- 角色依据：剧本明确39岁、检验质量经理；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/shen-qing.png](legal-harbor-murder-jury/shen-qing.png)。

**生成时的角色描述（原文）**

```text
Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
```

<a id="portrait-23"></a>

### 23. 杜临

- 角色依据：剧本明确50岁、配送夜班主管；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/du-lin.png](legal-harbor-murder-jury/du-lin.png)。

**生成时的角色描述（原文）**

```text
Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
```

<a id="portrait-24"></a>

### 24. 孟遥

- 角色依据：剧本明确33岁、企业内审；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/meng-yao.png](legal-harbor-murder-jury/meng-yao.png)。

**生成时的角色描述（原文）**

```text
Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
```

<a id="portrait-25"></a>

### 25. 方稚

- 角色依据：剧本明确46岁、急诊护士；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/fang-zhi.png](legal-harbor-murder-jury/fang-zhi.png)。

**生成时的角色描述（原文）**

```text
Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
```

<a id="portrait-26"></a>

### 26. 蒋诚

- 角色依据：剧本明确29岁、餐馆经营者；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/jiang-cheng.png](legal-harbor-murder-jury/jiang-cheng.png)。

**生成时的角色描述（原文）**

```text
Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
```

<a id="portrait-27"></a>

### 27. 宁柏

- 角色依据：剧本明确55岁、理赔调查员；外貌为设计补充。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/ning-bai.png](legal-harbor-murder-jury/ning-bai.png)。

**生成时的角色描述（原文）**

```text
Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
```

<a id="portrait-28"></a>

### 28. 顾衡

- 角色依据：剧本明确38岁、货运经理、被告；补充剧情人物。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/gu-heng.png](legal-harbor-murder-jury/gu-heng.png)。

**生成时的角色描述（原文）**

```text
Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
```

<a id="portrait-29"></a>

### 29. 纪川

- 角色依据：剧本明确47岁、仓库负责人、死者；补充剧情人物。
- 场景脚本：[legal-harbor-murder-jury](../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js)。
- 原图：[legal-harbor-murder-jury/ji-chuan.png](legal-harbor-murder-jury/ji-chuan.png)。

**生成时的角色描述（原文）**

```text
Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
```

**完整提示词（实际发送原文）**

```text
Use case: stylized-concept. Create ONE standalone square dialogue-game pixel portrait for AXIIA CUP. Original restrained early-1990s Japanese strategy-game portrait, face and upper shoulders INSIDE a simple thin square black pixel frame. Strict four-tone neutral monochrome palette only: near black, dark gray, light gray, warm off-white (almost white, no colored tint). Deliberately coarse hand-placed pixel appearance equivalent to a 64 by 64 logical pixel canvas enlarged with nearest-neighbor, visibly square clean blocks, big simple readable clusters, very sparse dithering. NO antialiasing, NO gradients, NO painterly brushwork, NO photorealism, NO smooth vector contours, NO miniature fine detail. Flat off-white background. Single person centered, slight three-quarter head turn, eyes near 43% image height, head occupies about 65% of inner square height, shoulders cut at lower frame. Face expressive but understated. Simple clothes, no scene, no objects, no lettering, no text, no names, no watermark, no decorative outer page. Entire final image is this ONE square avatar, consistent narrow border inset approximately 3% from edges. 1024x1024 output preferred. Subject: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
```
