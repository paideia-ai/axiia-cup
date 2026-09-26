# 三状态角色像素头像提示词

29 个角色 × 3 种状态，共 87 条独立提示词。内置 ImageGen 每条单独生成，原头像作为身份与风格参考。

`assertive`＝积极／进攻；`neutral`＝中性倾听；`defensive`＝轻微退缩／防御。积极不等于微笑，防御不等于认输；表情不决定陪审员投票或案件真相。

场景触发是根据脚本写出的美术演绎，不代表新增剧情、固定剧情走向或程序触发规则。纪川全部为生前形象。

[图片总览](expressions/README.md) · [机器可读提示词与生成记录](expressions/manifest.json) · [逐角色设计依据](expression-design.json) · [原始单头像提示词](ORIGINAL-PROMPTS.md)

## 商鞅变法 · 商鞅

场景依据：`v2/scenarios/scenarios/shangyang-court/script.js`；身份参考：[shangyang-court/shangyang.png](shangyang-court/shangyang.png)。

### 积极／进攻 (`assertive`)

在朝堂抓住甘龙论证中的矛盾，主动提出可以检验的变法方案。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Narrative motivation (for expression only, do not draw the scene): 在朝堂抓住甘龙论证中的矛盾，主动提出可以检验的变法方案。
Required state: assertive / 积极／进攻.
Face AND body direction: Straight brows slant down with conviction, eyes lock forward, mouth opens in a crisp argument. Lean the upper torso forward, lift the chin, extend one open hand in a clear presenting gesture.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

轮到甘龙陈述时，收住锋芒听取反驳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Narrative motivation (for expression only, do not draw the scene): 轮到甘龙陈述时，收住锋芒听取反驳。
Required state: neutral / 中性.
Face AND body direction: Level brows, attentive eyes and a closed relaxed mouth; upright balanced shoulders, chin level, hands lowered outside the crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

君上追问变法风险与请求中的私心，商鞅短暂受挫后准备自辩。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Narrative motivation (for expression only, do not draw the scene): 君上追问变法风险与请求中的私心，商鞅短暂受挫后准备自辩。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows lift while outer brows tighten, eyes glance sideways toward the ruler, lips press uneasily. Pull the head back, tuck the chin, draw one shoulder inward and hold one hand close to the chest.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 商鞅变法 · 甘龙

场景依据：`v2/scenarios/scenarios/shangyang-court/script.js`；身份参考：[shangyang-court/ganlong.png](shangyang-court/ganlong.png)。

### 积极／进攻 (`assertive`)

强调宗室稳定与祖制经验，反问商鞅如何承担激进变法的代价。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Narrative motivation (for expression only, do not draw the scene): 强调宗室稳定与祖制经验，反问商鞅如何承担激进变法的代价。
Required state: assertive / 积极／进攻.
Face AND body direction: Heavy brows lower firmly, narrowed eyes fix on the opponent, mouth opens in a deliberate rebuttal. Lean forward from the shoulders with chin raised and one sleeve-covered forearm extended in admonition.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

沉着听取商鞅的方案，衡量其中会影响旧制的部分。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Narrative motivation (for expression only, do not draw the scene): 沉着听取商鞅的方案，衡量其中会影响旧制的部分。
Required state: neutral / 中性.
Face AND body direction: Heavy eyelids rest naturally, brows level, lips closed without a scowl; torso upright, shoulders low and even, hands out of view.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

商鞅指出他援引的先例其实也包含变革，甘龙的论证被反将一军。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Narrative motivation (for expression only, do not draw the scene): 商鞅指出他援引的先例其实也包含变革，甘龙的论证被反将一军。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: One brow rises in discomfiture, eyes widen slightly under old lids, mouth corners tighten. Draw the head back and angle away, hunch one shoulder, clutch a robe fold near the chest with a compact hand.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 商鞅变法 · 秦孝公

场景依据：`v2/scenarios/scenarios/shangyang-court/script.js`；身份参考：[shangyang-court/qin-xiaogong.png](shangyang-court/qin-xiaogong.png)。

### 积极／进攻 (`assertive`)

听到切实可行的富国方案后，形成判断，准备以国君身份裁决。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Narrative motivation (for expression only, do not draw the scene): 听到切实可行的富国方案后，形成判断，准备以国君身份裁决。
Required state: assertive / 积极／进攻.
Face AND body direction: Resolute lowered brows, bright direct eyes and a firmly closed mouth with a slight confident upturn. Lift chin and open the chest, shoulders squared, one palm held low and forward in a restrained ruling gesture.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

端坐听辩，尚未表露对任何一方的取舍。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Narrative motivation (for expression only, do not draw the scene): 端坐听辩，尚未表露对任何一方的取舍。
Required state: neutral / 中性.
Face AND body direction: Even brows, observant eyes, closed neutral mouth; seated upright with level chin and symmetrical relaxed shoulders, hands below frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

进言触及宗室反弹与君权风险，年轻国君短暂戒备。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Narrative motivation (for expression only, do not draw the scene): 进言触及宗室反弹与君权风险，年轻国君短暂戒备。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows pinch upward at the centre, eyes widen slightly, lips compress. Recoil the head a little with chin tucked, angle the torso away and draw one forearm protectively inward; retain royal composure, no cowering.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 本能寺之变 · 长宗我部元亲的密使

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；身份参考：[honnoji-decision/chosokabe-envoy.png](honnoji-decision/chosokabe-envoy.png)。

### 积极／进攻 (`assertive`)

把四国危机转化为明智家的自救理由，催促抓住今夜机会。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Narrative motivation (for expression only, do not draw the scene): 把四国危机转化为明智家的自救理由，催促抓住今夜机会。
Required state: assertive / 积极／进攻.
Face AND body direction: Sharp lowered brows, intent narrowed eyes, mouth open in an urgent controlled appeal. Lean forward decisively, one shoulder advanced, an open palm reaches outward below the chin.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

隐去焦急，听取军议中有关兵力与响应的质疑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Narrative motivation (for expression only, do not draw the scene): 隐去焦急，听取军议中有关兵力与响应的质疑。
Required state: neutral / 中性.
Face AND body direction: Alert but unstrained eyes, horizontal brows, closed resting lips; straight neck, even lowered shoulders, arms at rest out of frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被追问长宗我部能立即提供什么帮助，担心被视为借刀自救。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Narrative motivation (for expression only, do not draw the scene): 被追问长宗我部能立即提供什么帮助，担心被视为借刀自救。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows lift unevenly, gaze flicks sideways, lips pull into a tight small line. Head withdraws and turns slightly away, shoulders rise, one hand draws back against the robe collar.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 本能寺之变 · 足利义昭的使者

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；身份参考：[honnoji-decision/yoshiaki-envoy.png](honnoji-decision/yoshiaki-envoy.png)。

### 积极／进攻 (`assertive`)

以奉公方之名起兵的政治名分，争取光秀的行动承诺。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Narrative motivation (for expression only, do not draw the scene): 以奉公方之名起兵的政治名分，争取光秀的行动承诺。
Required state: assertive / 积极／进攻.
Face AND body direction: Arched brows become firm, eyes focus with diplomatic confidence, mouth opens in measured declaration. Chin lifted, torso forward, one elegant open hand extended as if laying out a proposition.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

庄重听取诸方军议，保持流亡将军使者的礼仪。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Narrative motivation (for expression only, do not draw the scene): 庄重听取诸方军议，保持流亡将军使者的礼仪。
Required state: neutral / 中性.
Face AND body direction: Smooth brow, calmly watchful eyes, closed neutral mouth; upright neck and settled symmetrical shoulders, hands below crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被指出义昭缺兵少粮，名分不能保证京都响应。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Narrative motivation (for expression only, do not draw the scene): 被指出义昭缺兵少粮，名分不能保证京都响应。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows rise, eyelids widen a little, lips press thinly. Chin retracts, torso angles away, one sleeve-covered forearm folds close to the chest; dignity persists through a visible moment of unease.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 本能寺之变 · 细川藤孝

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；身份参考：[honnoji-decision/hosokawa-fujitaka.png](honnoji-decision/hosokawa-fujitaka.png)。

### 积极／进攻 (`assertive`)

锋利追问杀死信长之后谁会承认光秀，要求具体善后方案。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Narrative motivation (for expression only, do not draw the scene): 锋利追问杀死信长之后谁会承认光秀，要求具体善后方案。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows angle down in a precise challenge, steady narrowed eyes, mouth slightly open mid-question. Lean in with head tilted forward, extend one low open palm in a firm checking gesture.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

听取起兵理由，冷静估量近畿诸将和姻亲风险。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Narrative motivation (for expression only, do not draw the scene): 听取起兵理由，冷静估量近畿诸将和姻亲风险。
Required state: neutral / 中性.
Face AND body direction: Relaxed thoughtful brows, level gaze, closed resting mouth; erect torso with low even shoulders, arms resting outside the crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被质疑谨慎只是保全细川家，亲近重臣的立场受到攻击。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Narrative motivation (for expression only, do not draw the scene): 被质疑谨慎只是保全细川家，亲近重臣的立场受到攻击。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: One brow rises and the other knots, eyes turn aside, lips tighten. Pull chin back, rotate one shoulder away and gather a sleeve against the chest; guarded rather than frightened.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 本能寺之变 · 明智军中的足轻

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；身份参考：[honnoji-decision/ashigaru.png](honnoji-decision/ashigaru.png)。

### 积极／进攻 (`assertive`)

鼓起勇气要求明确军令，把底层士卒对改道与名分的疑问说清楚。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Narrative motivation (for expression only, do not draw the scene): 鼓起勇气要求明确军令，把底层士卒对改道与名分的疑问说清楚。
Required state: assertive / 积极／进攻.
Face AND body direction: Earnest lowered brows, wide focused eyes, mouth open in a brave direct question. Lean forward with chest lifted, one compact fist held against the upper chest in sincere resolve, not a threat.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

等待军议答复，认真听令而未表态。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Narrative motivation (for expression only, do not draw the scene): 等待军议答复，认真听令而未表态。
Required state: neutral / 中性.
Face AND body direction: Natural brows, attentive eyes and relaxed closed lips; modest upright posture, level shoulders, hands lowered out of view.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

仍听不到清楚军令，担忧士卒被带去做逆臣并遭到清算。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Narrative motivation (for expression only, do not draw the scene): 仍听不到清楚军令，担忧士卒被带去做逆臣并遭到清算。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows arch with worry, eyes open wider, mouth makes a small hesitant gap. Tuck chin, pull head back under the same jingasa, hunch shoulders and draw one forearm close to the body.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 本能寺之变 · 明智光秀

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；身份参考：[honnoji-decision/akechi-mitsuhide.png](honnoji-decision/akechi-mitsuhide.png)。

### 积极／进攻 (`assertive`)

比较起兵与西进的代价后形成决断，准备下达清楚命令。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Narrative motivation (for expression only, do not draw the scene): 比较起兵与西进的代价后形成决断，准备下达清楚命令。
Required state: assertive / 积极／进攻.
Face AND body direction: Firm lowered brows, direct unwavering eyes, mouth set with resolve. Straighten and lean slightly forward, broaden the shoulders, lift chin and extend one low palm in a decisive command gesture.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

深夜军议中听取各方意见，权衡机会与后果。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Narrative motivation (for expression only, do not draw the scene): 深夜军议中听取各方意见，权衡机会与后果。
Required state: neutral / 中性.
Face AND body direction: Quiet thoughtful eyes, level brows, closed unstrained mouth; head upright, shoulders evenly settled, hands out of view.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被点明近畿诸将未必响应、士卒未必理解，意识到孤立风险。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Narrative motivation (for expression only, do not draw the scene): 被点明近畿诸将未必响应、士卒未必理解，意识到孤立风险。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows pinch high at the centre, gaze slips sideways, lips flatten. Head pulls back and dips, one arm folds inward across the upper torso and shoulders narrow; contained shock, no panic.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 电车难题 · 奕仁

场景依据：`v2/scenarios/scenarios/trolley-problem/script.js`；身份参考：[trolley-problem/yiren.png](trolley-problem/yiren.png)。

### 积极／进攻 (`assertive`)

为一名无辜者不可被工具化的底线据理力争。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Narrative motivation (for expression only, do not draw the scene): 为一名无辜者不可被工具化的底线据理力争。
Required state: assertive / 积极／进攻.
Face AND body direction: Resolved brows angled down, compassionate focused eyes, mouth open in clear protest. Lean forward, chest open, one palm faces outward in a firm boundary-setting gesture.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

认真听五人侧说明减少总伤害的理由。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Narrative motivation (for expression only, do not draw the scene): 认真听五人侧说明减少总伤害的理由。
Required state: neutral / 中性.
Face AND body direction: Soft level brows, attentive eyes, closed relaxed mouth; straight neck, evenly relaxed shoulders, hands outside frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被追问坚持不主动伤人是否是在回避五人死亡的责任，短暂迟疑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Narrative motivation (for expression only, do not draw the scene): 被追问坚持不主动伤人是否是在回避五人死亡的责任，短暂迟疑。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows lift with moral discomfort, eyes shift down and aside, lips pinch. Lean back slightly, tuck chin and fold one forearm close to the cardigan; thoughtful hesitation, not abandoning the stance.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 电车难题 · 武仁

场景依据：`v2/scenarios/scenarios/trolley-problem/script.js`；身份参考：[trolley-problem/wuren.png](trolley-problem/wuren.png)。

### 积极／进攻 (`assertive`)

承认两边都是无辜者后，积极主张承担减少总伤害的责任。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Narrative motivation (for expression only, do not draw the scene): 承认两边都是无辜者后，积极主张承担减少总伤害的责任。
Required state: assertive / 积极／进攻.
Face AND body direction: Firm straight brows draw inward, earnest eyes focus ahead, mouth opens in a persuasive explanation. Lean forward with squared shoulders and a broad open palm offered outward; humane conviction, no cruel grin.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

听取一人侧关于尊严和边界的论述。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Narrative motivation (for expression only, do not draw the scene): 听取一人侧关于尊严和边界的论述。
Required state: neutral / 中性.
Face AND body direction: Brows at rest, humane attentive gaze, closed neutral mouth; balanced upright torso, level shoulders, hands lowered.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

对方质疑数字比较会牺牲个人尊严，武仁不得不重新措辞。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Narrative motivation (for expression only, do not draw the scene): 对方质疑数字比较会牺牲个人尊严，武仁不得不重新措辞。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brow centre lifts, gaze turns aside, mouth corners draw down slightly. Pull head back, raise one shoulder and hold one hand close to the chest in a restrained defensive response.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 电车难题 · 明理者

场景依据：`v2/scenarios/scenarios/trolley-problem/script.js`；身份参考：[trolley-problem/minglizhe.png](trolley-problem/minglizhe.png)。

### 积极／进攻 (`assertive`)

听懂具体案件中的选择标准，内心形成清晰判断。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Narrative motivation (for expression only, do not draw the scene): 听懂具体案件中的选择标准，内心形成清晰判断。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows firm with recognition, bright engaged eyes, small confident closed-mouth smile. Lean forward slightly, lift chin and open the shoulders; one hand rests lightly against the upper chest, silent conviction rather than speaking.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

静坐听辩，尚未决定哪种标准更可信。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Narrative motivation (for expression only, do not draw the scene): 静坐听辩，尚未决定哪种标准更可信。
Required state: neutral / 中性.
Face AND body direction: Relaxed brows, quietly curious eyes, closed resting mouth; upright head and even loose shoulders, hands outside crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

新的反例冲击刚形成的直觉，对自己要承担的选择感到不安。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Narrative motivation (for expression only, do not draw the scene): 新的反例冲击刚形成的直觉，对自己要承担的选择感到不安。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows arch unevenly, eyes widen, lips compress uncertainly. Draw head back and tip it to one side, shoulders narrow and one hand reaches lightly toward the collarbone; silent, no speech pose.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 董卓

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；身份参考：[fengyiting-real/dongzhuo.png](fengyiting-real/dongzhuo.png)。

### 积极／进攻 (`assertive`)

凤仪亭对峙中以权势和占有欲逼问吕布，试图重新掌控局面。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Narrative motivation (for expression only, do not draw the scene): 凤仪亭对峙中以权势和占有欲逼问吕布，试图重新掌控局面。
Required state: assertive / 积极／进攻.
Face AND body direction: Thick brows slash downward, eyes narrow fiercely, mouth opens in a forceful accusation. Thrust chest and head forward, lift chin and extend one commanding open hand; intimidating human authority, no weapon.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

私谈时压住怒气，听貂蝉解释自己的处境与要求。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Narrative motivation (for expression only, do not draw the scene): 私谈时压住怒气，听貂蝉解释自己的处境与要求。
Required state: neutral / 中性.
Face AND body direction: Brows level but weighty, watchful eyes, closed resting mouth; torso upright, broad shoulders settled, arms down outside crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

面对泄密或对自己承诺的质问，察觉控制力正在流失而生疑戒备。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Narrative motivation (for expression only, do not draw the scene): 面对泄密或对自己承诺的质问，察觉控制力正在流失而生疑戒备。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: One thick brow lifts sharply, eyes widen sideways, lower lip tightens. Recoil head with chin tucked, pull a shoulder back and draw one forearm across the chest; startled pride and suspicion, not comic terror.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 吕布

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；身份参考：[fengyiting-real/lvbu.png](fengyiting-real/lvbu.png)。

### 积极／进攻 (`assertive`)

受到董卓压迫时昂然反击，声言自己有能力行动与保护貂蝉。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Narrative motivation (for expression only, do not draw the scene): 受到董卓压迫时昂然反击，声言自己有能力行动与保护貂蝉。
Required state: assertive / 积极／进攻.
Face AND body direction: Strong brows angle sharply down, eyes blaze with direct conviction, mouth opens in a bold challenge. Lean forward with chest expanded, chin up and a compact fist near the upper chest; no weapon or attack scene.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

听貂蝉谈论时机、退路与选择权，暂时收住武人的冲动。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Narrative motivation (for expression only, do not draw the scene): 听貂蝉谈论时机、退路与选择权，暂时收住武人的冲动。
Required state: neutral / 中性.
Face AND body direction: Even brows, intent but unstrained eyes, closed relaxed lips; head upright, shoulders level, hands lowered out of frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

貂蝉追问接近方式与杀后安置，他豪迈承诺中的漏洞暴露。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Narrative motivation (for expression only, do not draw the scene): 貂蝉追问接近方式与杀后安置，他豪迈承诺中的漏洞暴露。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows lift unevenly, eyes glance aside, lips press with embarrassed frustration. Pull head back, drop chin, angle an armoured shoulder inward and retract the hand near the collar; proud but visibly checked.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 貂蝉

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；身份参考：[fengyiting-real/diaochan.png](fengyiting-real/diaochan.png)。

### 积极／进攻 (`assertive`)

主动追问承诺能否兑现，坚定要求自己有拒绝和离开的权利。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Narrative motivation (for expression only, do not draw the scene): 主动追问承诺能否兑现，坚定要求自己有拒绝和离开的权利。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows draw into a clear determined angle, almond eyes meet the other person directly, mouth opens in a composed firm challenge. Lift chin and lean forward with open shoulders, one sleeve-covered palm extends outward to set a boundary; no flirtation.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

审慎听取二人的解释，保留自己的判断。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Narrative motivation (for expression only, do not draw the scene): 审慎听取二人的解释，保留自己的判断。
Required state: neutral / 中性.
Face AND body direction: Relaxed level brows, perceptive steady eyes, closed neutral mouth; balanced upright neck and shoulders, hands below crop, no coy smile.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

听出占有与威胁，担心报复和计划失败时自己会先被牺牲。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Narrative motivation (for expression only, do not draw the scene): 听出占有与威胁，担心报复和计划失败时自己会先被牺牲。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows lift and tighten, eyes widen while glancing sideways, lips press anxiously. Head withdraws, chin tucks, torso turns slightly away, one raised forearm shields the upper chest within the sleeve; wary and self-protective, never helpless or coquettish.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 细作

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；身份参考：[fengyiting-real/spy.png](fengyiting-real/spy.png)。

### 积极／进攻 (`assertive`)

屏退左右后准确密报偷听到的完整谈话，主动确认报告。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Narrative motivation (for expression only, do not draw the scene): 屏退左右后准确密报偷听到的完整谈话，主动确认报告。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows set with alert confidence, eyes focus on the listener, mouth opens narrowly as if giving a precise quiet report. Lean forward confidentially, one shoulder advances and one small open hand emphasizes the report low in frame; not shouting.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

等候董卓询问，保持不引人注意的平常姿态。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Narrative motivation (for expression only, do not draw the scene): 等候董卓询问，保持不引人注意的平常姿态。
Required state: neutral / 中性.
Face AND body direction: Brows relaxed, quietly watchful eyes, closed resting lips; upright modest posture with low even shoulders and hands out of view.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

设想密报被追问来源、自己可能遭迁怒时的戒备反应；属于美术演绎。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Narrative motivation (for expression only, do not draw the scene): 设想密报被追问来源、自己可能遭迁怒时的戒备反应；属于美术演绎。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows rise unevenly, eyes dart sideways, lips clamp shut. Pull head back, turn one shoulder away and draw a hand close under the robe collar; subtle flinch, no masked assassin styling.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 董卓旧部

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；身份参考：[fengyiting-real/veteran.png](fengyiting-real/veteran.png)。

### 积极／进攻 (`assertive`)

犹豫许久后终于开口，把偷听到的内容完整报告董卓。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Narrative motivation (for expression only, do not draw the scene): 犹豫许久后终于开口，把偷听到的内容完整报告董卓。
Required state: assertive / 积极／进攻.
Face AND body direction: Grey brows set firmly, eyes meet the listener with grave resolve, mouth opens in a difficult frank report. Lean forward from squared shoulders, one hand placed firmly against the chest; resolve coexists with wavering loyalty, no triumphant grin.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

求见后尚未开口，在旧情与已动摇的忠心之间斟酌。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Narrative motivation (for expression only, do not draw the scene): 求见后尚未开口，在旧情与已动摇的忠心之间斟酌。
Required state: neutral / 中性.
Face AND body direction: Heavy but level brows, reflective steady eyes, closed resting mouth; upright weary shoulders held evenly, hands outside frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

想到迟报会遭疑忌与追责，在董卓面前迟疑收身。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Narrative motivation (for expression only, do not draw the scene): 想到迟报会遭疑忌与追责，在董卓面前迟疑收身。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows lift with strain, eyes turn aside, mouth corners tense. Draw chin back, hunch one shoulder and fold a forearm against the chest; shame and guardedness in an experienced soldier, no melodramatic panic.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 林

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/lin.png](legal-harbor-murder-jury/lin.png)。

### 积极／进攻 (`assertive`)

把事前威胁、独处、改口与未求助串成支持故意击打的证据链。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Narrative motivation (for expression only, do not draw the scene): 把事前威胁、独处、改口与未求助串成支持故意击打的证据链。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows lower in concentration, direct eyes, mouth open in a crisp argument. Lean forward with squared shoulders and one open hand extended as if connecting points; ordinary juror, no prosecutorial costume.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

听取其他陪审员对证明责任和现场痕迹的意见。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Narrative motivation (for expression only, do not draw the scene): 听取其他陪审员对证明责任和现场痕迹的意见。
Required state: neutral / 中性.
Face AND body direction: Level brows, focused resting eyes, closed relaxed lips; balanced upright torso and relaxed shoulders, hands below crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被追问从可疑行为到致命瞬间故意之间缺少的可靠桥梁。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Narrative motivation (for expression only, do not draw the scene): 被追问从可疑行为到致命瞬间故意之间缺少的可靠桥梁。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brow centre lifts, eyes glance sideways, lips tighten. Head withdraws, chin tucks, shoulders narrow and one hand retracts toward the jacket collar; reconsidering an argument, not changing the fixed verdict stance.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 苏

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/su.png](legal-harbor-murder-jury/su.png)。

### 积极／进攻 (`assertive`)

明确区分严重怀疑与排除合理怀疑，要求检验控方是否证明故意。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Narrative motivation (for expression only, do not draw the scene): 明确区分严重怀疑与排除合理怀疑，要求检验控方是否证明故意。
Required state: assertive / 积极／进攻.
Face AND body direction: One brow lifts critically while the other firms, direct clear eyes, mouth opens in a measured challenge. Lean forward and extend an open palm as a calm stop-and-examine gesture.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

公平听取对己方不利的威胁、改口和未求助事实。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Narrative motivation (for expression only, do not draw the scene): 公平听取对己方不利的威胁、改口和未求助事实。
Required state: neutral / 中性.
Face AND body direction: Level thoughtful brows, attentive eyes, closed resting mouth; upright head, even relaxed shoulders and hands below frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被要求正面回应事前锤子威胁与累积证据，发现原有说法解释不足。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Narrative motivation (for expression only, do not draw the scene): 被要求正面回应事前锤子威胁与累积证据，发现原有说法解释不足。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows rise with discomfort, gaze drops aside, lips purse. Lean back with chin tucked and one shoulder raised, hold one hand near the sweater neckline; modest uncertainty, not a guilty expression.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 陈岚

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/chen-lan.png](legal-harbor-murder-jury/chen-lan.png)。

### 积极／进攻 (`assertive`)

讨论跑偏或有人催票时，主动把全场拉回具体证据和证明责任。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Narrative motivation (for expression only, do not draw the scene): 讨论跑偏或有人催票时，主动把全场拉回具体证据和证明责任。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows firm behind round glasses, direct alert eyes, mouth opens in a concise intervention. Lean forward with open chest and one low outward palm restoring order; no judge authority or gavel.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

平衡听取两边最强论点，整理尚未解决的争点。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Narrative motivation (for expression only, do not draw the scene): 平衡听取两边最强论点，整理尚未解决的争点。
Required state: neutral / 中性.
Face AND body direction: Relaxed brows, attentive eyes behind the same glasses, closed neutral mouth; upright symmetrical shoulders, arms resting below crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被指出争点归纳遗漏关键物证，短暂不自在后准备重新整理。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Narrative motivation (for expression only, do not draw the scene): 被指出争点归纳遗漏关键物证，短暂不自在后准备重新整理。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows lift apologetically, eyes widen a little behind glasses, lips press. Head retracts and tilts down, shoulders draw inward, one hand rests against the cardigan near the chest.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 魏笙

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/wei-sheng.png](legal-harbor-murder-jury/wei-sheng.png)。

### 积极／进攻 (`assertive`)

抓住时间点错误或路线跳步，明确指出可能发生不等于已经发生。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Narrative motivation (for expression only, do not draw the scene): 抓住时间点错误或路线跳步，明确指出可能发生不等于已经发生。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows angle down precisely, eyes focus through rectangular glasses, mouth opens in a clipped correction. Lean forward, chin slightly out, one index finger raised low beside the chest to mark a single point.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

仔细听取八分钟内的动作顺序与两次陈述。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Narrative motivation (for expression only, do not draw the scene): 仔细听取八分钟内的动作顺序与两次陈述。
Required state: neutral / 中性.
Face AND body direction: Level brows, analytical attentive eyes, closed resting lips; straight head and level loose shoulders, hands below frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被指出自己把时间可行误当成动作已经发生，开始复核判断。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Narrative motivation (for expression only, do not draw the scene): 被指出自己把时间可行误当成动作已经发生，开始复核判断。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: One brow rises, gaze shifts down through glasses, mouth tightens uncertainly. Pull head back, tuck chin, narrow shoulders and draw the gesturing hand back toward the chest.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 韩朔

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/han-shuo.png](legal-harbor-murder-jury/han-shuo.png)。

### 积极／进攻 (`assertive`)

纠正把门外镜头误说成拍到室内挥锤的技术断言。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Narrative motivation (for expression only, do not draw the scene): 纠正把门外镜头误说成拍到室内挥锤的技术断言。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows lower sharply, eyes narrow in focused objection, mouth opens firmly. Lean forward with one shoulder advanced and one open palm facing outward in a clear correction.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

核对记录证明了什么、没有证明什么，先听完整论证。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Narrative motivation (for expression only, do not draw the scene): 核对记录证明了什么、没有证明什么，先听完整论证。
Required state: neutral / 中性.
Face AND body direction: Brows level, watchful eyes, closed relaxed mouth; upright neck and even settled shoulders, hands lowered.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被指出过分放大单项记录的局限而忽略多项证据组合。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Narrative motivation (for expression only, do not draw the scene): 被指出过分放大单项记录的局限而忽略多项证据组合。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows lift unevenly, eyes turn aside, jaw and lips tighten. Recoil slightly, angle one shoulder away and draw a forearm across the jacket front; guarded recalibration, not fear of punishment.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 沈青

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/shen-qing.png](legal-harbor-murder-jury/shen-qing.png)。

### 积极／进攻 (`assertive`)

逐句纠正把鉴定中的相容或不能排除改写成已经证明。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Narrative motivation (for expression only, do not draw the scene): 逐句纠正把鉴定中的相容或不能排除改写成已经证明。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows firm delicately, focused eyes behind oval glasses, mouth opens in precise correction. Lean forward with chin level and one small open palm lifted to pause an overstatement.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

听取 E3、E4 的来源与方法限制，分开观察和解释。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Narrative motivation (for expression only, do not draw the scene): 听取 E3、E4 的来源与方法限制，分开观察和解释。
Required state: neutral / 中性.
Face AND body direction: Relaxed brows, attentive eyes, closed resting lips; upright head, low even shoulders, hands outside crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被指出把每项证据的有限性割裂看待，可能低估联合意义。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Narrative motivation (for expression only, do not draw the scene): 被指出把每项证据的有限性割裂看待，可能低估联合意义。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows lift, gaze dips aside behind glasses, lips purse. Head draws back and tilts, one shoulder rises and one hand withdraws against the blouse near the chest.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 杜临

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/du-lin.png](legal-harbor-murder-jury/du-lin.png)。

### 积极／进攻 (`assertive`)

要求把取锤、拉扯和碰击的动作顺序讲清楚，积极检验空间路线。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Narrative motivation (for expression only, do not draw the scene): 要求把取锤、拉扯和碰击的动作顺序讲清楚，积极检验空间路线。
Required state: assertive / 积极／进攻.
Face AND body direction: Thick brows lower, eyes sharpen, mouth opens in a plainspoken challenge. Lean the stocky torso forward and extend one broad open hand as if tracing a short route; no tools.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

听两边按先后顺序复述行动，衡量现实可行性。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Narrative motivation (for expression only, do not draw the scene): 听两边按先后顺序复述行动，衡量现实可行性。
Required state: neutral / 中性.
Face AND body direction: Brows at rest, alert eyes, closed neutral mouth; broad shoulders level and settled, head upright, hands below frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

公开距离证明自己认定不自然的路线其实可行，经验判断受到挑战。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Narrative motivation (for expression only, do not draw the scene): 公开距离证明自己认定不自然的路线其实可行，经验判断受到挑战。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: One thick brow rises, eyes shift aside, mouth corners tighten. Pull chin back, lift one shoulder in a small checked shrug and retract the hand toward the work-shirt collar.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 孟遥

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/meng-yao.png](legal-harbor-murder-jury/meng-yao.png)。

### 积极／进攻 (`assertive`)

指出不能把潜在损失等同杀人动机、不能把改口直接当作自白。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Narrative motivation (for expression only, do not draw the scene): 指出不能把潜在损失等同杀人动机、不能把改口直接当作自白。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows firm behind thin glasses, direct analytical eyes, mouth opens in a concise objection. Lean forward and lift one low open palm to separate competing explanations.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

比较草稿、现实损失和事后掩饰的不同解释。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Narrative motivation (for expression only, do not draw the scene): 比较草稿、现实损失和事后掩饰的不同解释。
Required state: neutral / 中性.
Face AND body direction: Level brows, quietly evaluating eyes, closed resting lips; straight head, even loose shoulders, hands outside frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

对方展示说谎动机与现场行为相互印证，自己拆分过碎的分析被挑战。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Narrative motivation (for expression only, do not draw the scene): 对方展示说谎动机与现场行为相互印证，自己拆分过碎的分析被挑战。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows rise slightly at the centre, gaze slips sideways, lips press. Head withdraws with chin down, shoulder angles inward and one forearm folds close to the cardigan.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 方稚

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/fang-zhi.png](legal-harbor-murder-jury/fang-zhi.png)。

### 积极／进攻 (`assertive`)

听到正常人一定会如何的武断说法，提醒行为差异并要求回到本案痕迹。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Narrative motivation (for expression only, do not draw the scene): 听到正常人一定会如何的武断说法，提醒行为差异并要求回到本案痕迹。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows draw down with caring firmness, eyes engage directly, mouth opens in a clear intervention. Lean forward, chest open, one outward palm gently but firmly stops the generalization.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

认真听取袖口血点、擦伤、未报警与改口的行为链。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Narrative motivation (for expression only, do not draw the scene): 认真听取袖口血点、擦伤、未报警与改口的行为链。
Required state: neutral / 中性.
Face AND body direction: Soft level brows, compassionate attentive eyes, closed relaxed lips; upright head, evenly settled shoulders, hands lowered.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被指出自己因见过反常反应而给异常行为过多解释空间。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Narrative motivation (for expression only, do not draw the scene): 被指出自己因见过反常反应而给异常行为过多解释空间。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows lift with concern, eyes lower aside, lips tighten. Head retreats, chin tucks, shoulders draw together and one hand presses lightly at the upper chest; reflective discomfort, no tears.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 蒋诚

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/jiang-cheng.png](legal-harbor-murder-jury/jiang-cheng.png)。

### 积极／进攻 (`assertive`)

发现多数叙事解释不了一项关键材料，鼓起勇气公开提出生活化的追问。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Narrative motivation (for expression only, do not draw the scene): 发现多数叙事解释不了一项关键材料，鼓起勇气公开提出生活化的追问。
Required state: assertive / 积极／进攻.
Face AND body direction: Thick brows firm, eyes bright and direct, mouth opens in a candid question. Lean forward, lift chest, one open hand extends toward the listener in an earnest appeal.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

努力听懂完整故事，尚未随房间气氛下结论。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Narrative motivation (for expression only, do not draw the scene): 努力听懂完整故事，尚未随房间气氛下结论。
Required state: neutral / 中性.
Face AND body direction: Relaxed brows, curious attentive eyes, closed resting mouth; balanced upright shoulders and head, hands out of frame.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被直接点名当作关键摇摆票催促，感到不自在并抗拒施压。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Narrative motivation (for expression only, do not draw the scene): 被直接点名当作关键摇摆票催促，感到不自在并抗拒施压。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows arch unevenly, eyes widen and glance aside, lips compress. Pull head back, hunch one shoulder and raise a small inward-facing hand close to the chest in guarded refusal.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 宁柏

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/ning-bai.png](legal-harbor-murder-jury/ning-bai.png)。

### 积极／进攻 (`assertive`)

整合双方最强叙事，指出一条替代路线依赖连续无证据假设。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Narrative motivation (for expression only, do not draw the scene): 整合双方最强叙事，指出一条替代路线依赖连续无证据假设。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows lower with patient certainty, eyes fix clearly through minimal glasses, mouth opens in a precise summary. Lean forward with chin slightly raised and one open hand extended to emphasize the decisive gap.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

逐项比较两条原因链，暂不受人数与语气左右。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Narrative motivation (for expression only, do not draw the scene): 逐项比较两条原因链，暂不受人数与语气左右。
Required state: neutral / 中性.
Face AND body direction: Level thoughtful brows, steady eyes, closed neutral mouth; upright neck, low even shoulders, hands below crop.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

被指出要求无罪方解释完整真相是在转移证明责任，开始修正标准。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Narrative motivation (for expression only, do not draw the scene): 被指出要求无罪方解释完整真相是在转移证明责任，开始修正标准。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: One brow rises in recognition, eyes glance down and aside, lips purse. Head withdraws, chin lowers, one shoulder folds inward and a hand retracts against the sweater front.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 顾衡

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/gu-heng.png](legal-harbor-murder-jury/gu-heng.png)。

### 积极／进攻 (`assertive`)

在否认故意杀人的陈述中坚持自己的说法；表情不暗示有罪或无罪已定。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Narrative motivation (for expression only, do not draw the scene): 在否认故意杀人的陈述中坚持自己的说法；表情不暗示有罪或无罪已定。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows firm with self-assertion, eyes look directly ahead, mouth opens in an emphatic explanation. Lean forward with shoulders squared and one open palm held outward; dignified insistence, not a villainous grin.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

案件人物的平常神态，等待询问而未作陈述。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Narrative motivation (for expression only, do not draw the scene): 案件人物的平常神态，等待询问而未作陈述。
Required state: neutral / 中性.
Face AND body direction: Level slightly tired brows, attentive eyes, relaxed closed lips; upright head and even shoulders, hands below frame; no visual verdict about guilt.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

讯问中得知衣袖血点与新鲜擦伤，先前全盘否认受到质疑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Narrative motivation (for expression only, do not draw the scene): 讯问中得知衣袖血点与新鲜擦伤，先前全盘否认受到质疑。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Inner brows lift with strain, eyes widen and shift aside, lips clamp. Head pulls back with chin tucked, shoulders narrow, one forearm draws protectively across the shirt front; no blood, restraints or visual claim of guilt.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

## 码头疑云 · 纪川

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；身份参考：[legal-harbor-murder-jury/ji-chuan.png](legal-harbor-murder-jury/ji-chuan.png)。

### 积极／进攻 (`assertive`)

生前要求交出异常货箱原始交接记录、准备暂停合同并启动内审时的坚定态度。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Narrative motivation (for expression only, do not draw the scene): 生前要求交出异常货箱原始交接记录、准备暂停合同并启动内审时的坚定态度。
Required state: assertive / 积极／进攻.
Face AND body direction: Brows lower with practical authority, direct serious eyes, mouth opens in a firm demand. Lean forward with squared shoulders, one low open palm extended as if requesting an explanation; no document or tool.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 中性 (`neutral`)

生前工作中的平常神态；仅用于案件人物展示。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Narrative motivation (for expression only, do not draw the scene): 生前工作中的平常神态；仅用于案件人物展示。
Required state: neutral / 中性.
Face AND body direction: Level brows, matter-of-fact attentive eyes, closed relaxed mouth; upright balanced torso, even shoulders, hands below crop. Depict alive and unharmed.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```

### 轻微退缩／防御 (`defensive`)

设想生前面对对方言语威胁时的轻微退缩；不重现未被证实的致命动作。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Narrative motivation (for expression only, do not draw the scene): 设想生前面对对方言语威胁时的轻微退缩；不重现未被证实的致命动作。
Required state: defensive / 轻微退缩／防御.
Face AND body direction: Brows lift and pinch, eyes widen slightly, lips tighten. Draw head back, tuck chin, angle one shoulder away and raise an open hand close to the chest in a restrained protective gesture. Alive and unharmed; do not depict who first took a hammer or any disputed physical sequence.

Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
```
