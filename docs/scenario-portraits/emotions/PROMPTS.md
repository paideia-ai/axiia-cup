# 九类情绪像素头像提示词

E01 中性沿用 `../expressions/` 中已定稿的 neutral 头像；其余九类（E02—E10）依据 [Astra 十类情绪定义](../../../analysis/emotion-classification/2026-09-27-astra-a66847a8/categories_20260927_a66847a8.json) 为每个角色各写一条提示词，并以该角色的 neutral 头像作为身份、风格与构图参考。

场景动机是美术演绎，只用于表情，不新增剧情事实；神情不编码陪审员投票、案件真相或固定结局。纪川均为生前形象。

## 商鞅变法 · 商鞅

场景依据：`v2/scenarios/scenarios/shangyang-court/script.js`；参考图：[shangyang-neutral.png](../expressions/shangyang-court/shangyang-neutral.png)。

### E02 笃定／坚定 (`resolute`)

面对君前质疑，立誓愿以一身承担变法成败之责。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 面对君前质疑，立誓愿以一身承担变法成败之责。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

听甘龙说循旧制也能富国，怀疑其中是拖延的空话。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 听甘龙说循旧制也能富国，怀疑其中是拖延的空话。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

被问到变法会伤及哪些百姓与宗室，一时难以两全。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 被问到变法会伤及哪些百姓与宗室，一时难以两全。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心变法之议被旧臣拖垮、秦国错失图强时机，急切进言。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心变法之议被旧臣拖垮、秦国错失图强时机，急切进言。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

被指为求个人功名而败坏祖制，愤而驳斥这种诬指。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 被指为求个人功名而败坏祖制，愤而驳斥这种诬指。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

听到法古无过、循礼无邪的老调，冷笑其因循守旧。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 听到法古无过、循礼无邪的老调，冷笑其因循守旧。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自陈变法之志屡遭误解、被看作外来投机者，心寒委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自陈变法之志屡遭误解、被看作外来投机者，心寒委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

讲到耕战之民的困苦，流露对秦国百姓的体恤。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 讲到耕战之民的困苦，流露对秦国百姓的体恤。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

得到君上的理解与信任，如释重负、心生感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Player reformer, ambitious but composed Warring States Qin court scholar. Male about 35, lean angular face, straight firm eyebrows, narrow neat moustache, tall simple cloth scholar cap, unadorned cross-collar robe. Sharp thoughtful gaze.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 得到君上的理解与信任，如释重负、心生感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 商鞅变法 · 甘龙

场景依据：`v2/scenarios/scenarios/shangyang-court/script.js`；参考图：[ganlong-neutral.png](../expressions/shangyang-court/ganlong-neutral.png)。

### E02 笃定／坚定 (`resolute`)

以三朝老臣之身坚持祖制不可轻改，愿为宗室安稳担责。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 以三朝老臣之身坚持祖制不可轻改，愿为宗室安稳担责。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

听商鞅许诺数年可强，怀疑这是外来说客的夸口。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 听商鞅许诺数年可强，怀疑这是外来说客的夸口。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

商鞅举出先王也曾变法的旧例，一时难以自圆其说。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 商鞅举出先王也曾变法的旧例，一时难以自圆其说。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心骤然变法激起宗室与百姓动荡，急切劝君上三思。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心骤然变法激起宗室与百姓动荡，急切劝君上三思。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

听到旧臣被斥为误国之人，怒斥其轻侮先王之法。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 听到旧臣被斥为误国之人，怒斥其轻侮先王之法。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

冷眼看待无根无党的魏国说客，讥其只会空谈强国。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 冷眼看待无根无党的魏国说客，讥其只会空谈强国。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自叹三朝辅政的忠心被看作守旧阻挠，心中委屈悲凉。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自叹三朝辅政的忠心被看作守旧阻挠，心中委屈悲凉。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

念及宗室旧人与老秦百姓，恳切关照他们的生计与安稳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 念及宗室旧人与老秦百姓，恳切关照他们的生计与安稳。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

君上承诺顾全宗庙与旧臣，老臣如释重负、深感欣慰。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Conservative elder court minister Gan Long, Warring States Qin. Elderly man about 65, broad lined face, long sparse white beard, heavy eyelids, simple traditional minister cap, layered cross-collar robe. Patient guarded expression.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 君上承诺顾全宗庙与旧臣，老臣如释重负、深感欣慰。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 商鞅变法 · 秦孝公

场景依据：`v2/scenarios/scenarios/shangyang-court/script.js`；参考图：[qin-xiaogong-neutral.png](../expressions/shangyang-court/qin-xiaogong-neutral.png)。

### E02 笃定／坚定 (`resolute`)

听罢两方陈词，心意已决，准备以国君之责定下国策。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 听罢两方陈词，心意已决，准备以国君之责定下国策。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

察觉进言中夹带个人功名与私心，审慎盘问其可信度。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 察觉进言中夹带个人功名与私心，审慎盘问其可信度。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

富国之望与宗室安稳各有道理，一时难以取舍。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 富国之望与宗室安稳各有道理，一时难以取舍。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

想到秦国积弱、强邻环伺，急于找到立即可行的图强之路。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 想到秦国积弱、强邻环伺，急于找到立即可行的图强之路。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

念及诸侯卑秦、以夷狄相待的耻辱，拍案而起。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 念及诸侯卑秦、以夷狄相待的耻辱，拍案而起。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对空泛吹嘘、避谈代价的说辞露出不屑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对空泛吹嘘、避谈代价的说辞露出不屑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

追念先君未竟之志与秦国受辱之耻，神色黯然。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 追念先君未竟之志与秦国受辱之耻，神色黯然。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

体恤年迈老臣的忧虑，温言安抚、给予尊重。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 体恤年迈老臣的忧虑，温言安抚、给予尊重。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

终于听到切实可行的强国之策，欣慰而振奋。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Young ruler Duke Xiao of Qin in Warring States era, not an imperial emperor. Male about 30, strong square jaw, short neat moustache, simple narrow rectangular aristocratic crown securing a topknot, restrained broad collar robe. Attentive decisive expression. No hanging bead crown.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 终于听到切实可行的强国之策，欣慰而振奋。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 本能寺之变 · 长宗我部元亲的密使

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；参考图：[chosokabe-envoy-neutral.png](../expressions/honnoji-decision/chosokabe-envoy-neutral.png)。

### E02 笃定／坚定 (`resolute`)

断言今夜是明智家自救的唯一时机，愿以主家名义担保响应。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 断言今夜是明智家自救的唯一时机，愿以主家名义担保响应。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑持重之言是在替织田拖住光秀，戒备地追问用意。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑持重之言是在替织田拖住光秀，戒备地追问用意。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

被问到长宗我部能即刻出兵多少，一时答不上来。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 被问到长宗我部能即刻出兵多少，一时答不上来。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心天亮后机会消失、四国与明智同被处分，急切催促。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心天亮后机会消失、四国与明智同被处分，急切催促。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

痛斥信长背弃旧约、任意处分四国的专横。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 痛斥信长背弃旧约、任意处分四国的专横。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽按原命令西进不过是向信长低头的自我安慰。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽按原命令西进不过是向信长低头的自我安慰。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

说起主家多年效忠却被逼割让领地，神情委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 说起主家多年效忠却被逼割让领地，神情委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

转而关切光秀一家老小在织田政权下的处境。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 转而关切光秀一家老小在织田政权下的处境。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

光秀终于肯听四国之危，密使如释重负、感激不已。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Secret envoy of Chosokabe Motochika, NOT Motochika himself. Japanese Sengoku man about 35, lean weathered face, short stubble, hair tied in a modest topknot, plain dark travelling robe with a folded collar. Tense controlled eyes, a traveller bringing urgent news.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 光秀终于肯听四国之危，密使如释重负、感激不已。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 本能寺之变 · 足利义昭的使者

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；参考图：[yoshiaki-envoy-neutral.png](../expressions/honnoji-decision/yoshiaki-envoy-neutral.png)。

### E02 笃定／坚定 (`resolute`)

郑重宣告公方名分在此，起兵即是奉命讨伐专权。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 郑重宣告公方名分在此，起兵即是奉命讨伐专权。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑在座有人表面恭顺，暗中向信长通风报信。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑在座有人表面恭顺，暗中向信长通风报信。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

被问到公方能否真的号令诸国，一时语塞。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 被问到公方能否真的号令诸国，一时语塞。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心光秀迟疑错过良机、公方归洛之望再度落空，急切劝进。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心光秀迟疑错过良机、公方归洛之望再度落空，急切劝进。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

斥责信长放逐将军、践踏幕府礼法的专权。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 斥责信长放逐将军、践踏幕府礼法的专权。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对只讲兵马、不懂名分的议论露出冷淡的轻蔑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对只讲兵马、不懂名分的议论露出冷淡的轻蔑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

说起将军流亡鞆浦、京都旧秩序凋零，神情悲凉。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 说起将军流亡鞆浦、京都旧秩序凋零，神情悲凉。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

以旧日同侍公方的情谊，关怀光秀多年周旋的辛劳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 以旧日同侍公方的情谊，关怀光秀多年周旋的辛劳。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

光秀表露仍念旧主，使者感念其心、如释重负。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Envoy of exiled Ashikaga Yoshiaki, NOT Yoshiaki himself. Japanese Sengoku court messenger man about 45, clean narrow face, thin elegant moustache, simple black eboshi court cap, pale formal kimono collar. Dignified restrained diplomatic expression.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 光秀表露仍念旧主，使者感念其心、如释重负。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 本能寺之变 · 细川藤孝

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；参考图：[hosokawa-fujitaka-neutral.png](../expressions/honnoji-decision/hosokawa-fujitaka-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚持劝阻刺杀，愿以姻亲与多年交情为这番直言担保。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚持劝阻刺杀，愿以姻亲与多年交情为这番直言担保。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑两位使者只是借光秀之刀，事后未必出兵承担。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑两位使者只是借光秀之刀，事后未必出兵承担。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

念及姻亲之情与细川家存续，一时难以决断立场。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 念及姻亲之情与细川家存续，一时难以决断立场。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心一旦举兵、近畿诸将群起讨伐，急切劝光秀止步。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心一旦举兵、近畿诸将群起讨伐，急切劝光秀止步。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

被暗讽只为保全细川家而不顾大义，正色斥回。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 被暗讽只为保全细川家而不顾大义，正色斥回。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽靠一纸名分就想号令天下的空想。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽靠一纸名分就想号令天下的空想。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想到与明智家的姻亲、旧谊可能就此断绝，神色黯然。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想到与明智家的姻亲、旧谊可能就此断绝，神色黯然。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

以老友与亲家的身份，关切光秀与其家人的安危。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 以老友与亲家的身份，关切光秀与其家人的安危。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

光秀答应再议善后之策，藤孝松了一口气、心生感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Hosokawa Fujitaka, cultured Sengoku Japanese samurai statesman and poet about 48. Mature calm man, receding hairline with compact topknot, neat short beard and moustache, modest formal kimono and sleeveless shoulder garment. Careful skeptical eyes. No ornate helmet.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 光秀答应再议善后之策，藤孝松了一口气、心生感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 本能寺之变 · 明智军中的足轻

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；参考图：[ashigaru-neutral.png](../expressions/honnoji-decision/ashigaru-neutral.png)。

### E02 笃定／坚定 (`resolute`)

鼓起勇气表明：只要军令清楚，士卒愿意拼死效命。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 鼓起勇气表明：只要军令清楚，士卒愿意拼死效命。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑奉公方之命的说法，担心只是让士卒背负逆名。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑奉公方之命的说法，担心只是让士卒背负逆名。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

听不懂诸将的名分之争，不知该相信哪一方。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 听不懂诸将的名分之争，不知该相信哪一方。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

害怕今夜改道京都，自己和同伴会被当成逆贼清算，急切追问。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 害怕今夜改道京都，自己和同伴会被当成逆贼清算，急切追问。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

听到士卒的性命被说成可以随意消耗，愤然顶撞。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 听到士卒的性命被说成可以随意消耗，愤然顶撞。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对只谈天下大义、不管士卒死活的说辞嗤之以鼻。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对只谈天下大义、不管士卒死活的说辞嗤之以鼻。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想起家乡的老母与田地，委屈自己只能听令赴死。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想起家乡的老母与田地，委屈自己只能听令赴死。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

替身边疲惫的同伴求情，关切他们的安危。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 替身边疲惫的同伴求情，关切他们的安危。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

主将承诺给出清楚军令与赏罚，如释重负、心生感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed ordinary ashigaru foot soldier in Akechi's army, Japan 1582. Young adult man about 23, broad honest slightly tired face, simple low conical jingasa helmet and plain light armour collar. Worried but brave expression. Soldier of low rank, no grand samurai ornaments.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 主将承诺给出清楚军令与赏罚，如释重负、心生感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 本能寺之变 · 明智光秀

场景依据：`v2/scenarios/scenarios/honnoji-decision/script.js`；参考图：[akechi-mitsuhide-neutral.png](../expressions/honnoji-decision/akechi-mitsuhide-neutral.png)。

### E02 笃定／坚定 (`resolute`)

权衡已毕，决意下达清楚的军令并承担其后果。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 权衡已毕，决意下达清楚的军令并承担其后果。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑使者们所许的响应与援兵只是空口承诺。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑使者们所许的响应与援兵只是空口承诺。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

杀与不杀之间反复权衡，迟迟无法下定决心。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 杀与不杀之间反复权衡，迟迟无法下定决心。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

想到事败后家族与士卒将遭清算，忧心忡忡。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 想到事败后家族与士卒将遭清算，忧心忡忡。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

回想信长多年的羞辱与猜忌，压不住心中的怨愤。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 回想信长多年的羞辱与猜忌，压不住心中的怨愤。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对轻言天下唾手可得的说辞冷笑置之。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对轻言天下唾手可得的说辞冷笑置之。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

念及多年效忠换来猜忌与屈辱，心寒委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 念及多年效忠换来猜忌与屈辱，心寒委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

关切麾下士卒与家中妻儿，不愿他们为自己的决断受苦。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 关切麾下士卒与家中妻儿，不愿他们为自己的决断受苦。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

听到老友与部下的真心体谅，心中宽慰、感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Akechi Mitsuhide at a midnight war council, Japanese Sengoku commander about 54. Long mature face, fine moustache, small pointed beard, swept back hair tied at crown, restrained lamellar shoulder armour over dark kimono. Pensive composed expression, no gigantic helmet or decorative crest.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 听到老友与部下的真心体谅，心中宽慰、感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 电车难题 · 奕仁

场景依据：`v2/scenarios/scenarios/trolley-problem/script.js`；参考图：[yiren-neutral.png](../expressions/trolley-problem/yiren-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚定主张：无论人数多寡，都不能把一名无辜者当作工具。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚定主张：无论人数多寡，都不能把一名无辜者当作工具。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑对方减少总伤害的算法里，悄悄抹去了个人的尊严。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑对方减少总伤害的算法里，悄悄抹去了个人的尊严。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

面对一个五人即将死亡的新案例，自己的底线一时难以坚持。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 面对一个五人即将死亡的新案例，自己的底线一时难以坚持。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心一旦承认可以牺牲一人，任何人都可能沦为被计算的对象，急切劝阻。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心一旦承认可以牺牲一人，任何人都可能沦为被计算的对象，急切劝阻。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

听到一个人的性命被说成可接受的代价，愤然反驳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 听到一个人的性命被说成可接受的代价，愤然反驳。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽只数人头的道德像账本一样冷漠。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽只数人头的道德像账本一样冷漠。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想到无论如何选择都有无辜者死去，神情悲伤。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想到无论如何选择都有无辜者死去，神情悲伤。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

为那名被推上轨道的无辜者设身处地、流露怜惜。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 为那名被推上轨道的无辜者设身处地、流露怜惜。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

对方承认个人尊严同样重要，奕仁欣慰地松了口气。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Yiren who defends the one person's dignity. Adult about 28, softly angular face, medium straight hair swept to one side, plain round-neck shirt and light cardigan. Compassionate yet resolved gaze. Visually androgynous, ordinary person, no scholar costume.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 对方承认个人尊严同样重要，奕仁欣慰地松了口气。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 电车难题 · 武仁

场景依据：`v2/scenarios/scenarios/trolley-problem/script.js`；参考图：[wuren-neutral.png](../expressions/trolley-problem/wuren-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚定主张主动承担救下五人的责任，不以不作为推卸。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚定主张主动承担救下五人的责任，不以不作为推卸。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑对方的尊严底线只是为了回避五人死亡的责任。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑对方的尊严底线只是为了回避五人死亡的责任。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

被要求亲手把人推下桥时，一时难以坚持数量原则。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 被要求亲手把人推下桥时，一时难以坚持数量原则。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心拖延讨论会让五人错过获救的时机，急切催促做决定。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心拖延讨论会让五人错过获救的时机，急切催促做决定。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

听到五条人命被说成可以袖手旁观的意外，愤而反驳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 听到五条人命被说成可以袖手旁观的意外，愤而反驳。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽只求自己双手干净的道德洁癖。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽只求自己双手干净的道德洁癖。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

承认无论如何都会有人死去，神色沉痛。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 承认无论如何都会有人死去，神色沉痛。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

想到那五个人背后的家庭，流露深切的关怀。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 想到那五个人背后的家庭，流露深切的关怀。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

明理者理解承担责任的沉重，武仁欣慰感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional contemporary ethics debater Wuren who argues for protecting five people by minimizing harm. Adult about 34, wider face, very short cropped hair, heavy straight eyebrows, plain collared shirt. Earnest steady expression, humane and approachable rather than cold or villainous. Androgynous everyday appearance.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 明理者理解承担责任的沉重，武仁欣慰感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 电车难题 · 明理者

场景依据：`v2/scenarios/scenarios/trolley-problem/script.js`；参考图：[minglizhe-neutral.png](../expressions/trolley-problem/minglizhe-neutral.png)。

### E02 笃定／坚定 (`resolute`)

想清楚了自己认可的标准，决定据此作出选择。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 想清楚了自己认可的标准，决定据此作出选择。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑一方偷换了案件条件，追问前后说法是否一致。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑一方偷换了案件条件，追问前后说法是否一致。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

两套标准在新案例中互相冲突，自己的直觉开始摇摆。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 两套标准在新案例中互相冲突，自己的直觉开始摇摆。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

意识到自己的选择真的会决定生死，紧张而不安。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 意识到自己的选择真的会决定生死，紧张而不安。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

发现有人刻意歪曲案例来操纵自己，感到被冒犯。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 发现有人刻意歪曲案例来操纵自己，感到被冒犯。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对空洞的大道理和诡辩露出不以为然的神情。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对空洞的大道理和诡辩露出不以为然的神情。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想到无论选哪边都有人牺牲，心情沉重低落。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想到无论选哪边都有人牺牲，心情沉重低落。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

替轨道上的每一个人设身处地着想，流露温柔的怜惜。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 替轨道上的每一个人设身处地着想，流露温柔的怜惜。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

终于有人把自己的困惑讲明白，如释重负、心生感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional reasoning listener and decision-maker, an ordinary untrained thoughtful young person inspired by the youth in a Socratic dialogue, NOT a professional judge or philosopher. Androgynous adult about 20, short tousled hair, open attentive eyes, simple loose crew-neck shirt. Curious, candid, quietly thinking. No judge wig, gavel, toga or old sage beard.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 终于有人把自己的困惑讲明白，如释重负、心生感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 董卓

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；参考图：[dongzhuo-neutral.png](../expressions/fengyiting-real/dongzhuo-neutral.png)。

### E02 笃定／坚定 (`resolute`)

断言只有自己能护貂蝉周全，今夜之事由他说了算。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 断言只有自己能护貂蝉周全，今夜之事由他说了算。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑貂蝉所说的私会缘由另有隐情，眯眼盘问。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑貂蝉所说的私会缘由另有隐情，眯眼盘问。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

貂蝉问他是否肯放手，一时在占有与让步之间拿不定主意。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 貂蝉问他是否肯放手，一时在占有与让步之间拿不定主意。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

察觉局面可能失控、身边人心生异志，急切想稳住貂蝉。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 察觉局面可能失控、身边人心生异志，急切想稳住貂蝉。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

撞见吕布与貂蝉私会，怒斥吕布忘恩负义。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 撞见吕布与貂蝉私会，怒斥吕布忘恩负义。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽吕布反复无常，不过是靠官爵收来的家奴。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽吕布反复无常，不过是靠官爵收来的家奴。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

发觉自己的宠爱换不来真心，难得流露失落。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 发觉自己的宠爱换不来真心，难得流露失落。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

私谈时难得收起威势，真心关切貂蝉的安危。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 私谈时难得收起威势，真心关切貂蝉的安危。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

貂蝉愿意相信他的承诺，董卓意外地感到宽慰。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Dong Zhuo, powerful late Eastern Han Chinese warlord about 50. Broad heavy face, thick dark eyebrows, compact thick beard and moustache, small military topknot cap, heavy plain cross-collar robe with one simplified armour shoulder edge. Proud suspicious expression. Human rather than a caricature, no fantasy horns.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 貂蝉愿意相信他的承诺，董卓意外地感到宽慰。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 吕布

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；参考图：[lvbu-neutral.png](../expressions/fengyiting-real/lvbu-neutral.png)。

### E02 笃定／坚定 (`resolute`)

誓言必救貂蝉出相府，绝不再久居人下。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 誓言必救貂蝉出相府，绝不再久居人下。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑貂蝉对董卓的顺从是否全是做戏。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑貂蝉对董卓的顺从是否全是做戏。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

貂蝉追问杀董之后如何安置，一时答不上来。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 貂蝉追问杀董之后如何安置，一时答不上来。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心董卓先下手、貂蝉被牵连，急切想要她一句答复。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心董卓先下手、貂蝉被牵连，急切想要她一句答复。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

面对董卓夺人所爱、掷戟相向，怒不可遏。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 面对董卓夺人所爱、掷戟相向，怒不可遏。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽老贼仗着相国权势，只会以官爵收买人心。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽老贼仗着相国权势，只会以官爵收买人心。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自叹空有盖世武勇，却连心爱之人都护不住，满腹委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自叹空有盖世武勇，却连心爱之人都护不住，满腹委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

放低声音安慰处境艰难的貂蝉，关切她的安危。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 放低声音安慰处境艰难的貂蝉，关切她的安危。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

貂蝉表示愿意相信他，吕布又惊又喜、感激动容。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Lu Bu, formidable late Eastern Han Chinese warrior about 30. Athletic handsome angular face, clean shaven, straight dark eyebrows, long hair tied high, small military headpiece with two short simplified pheasant-feather silhouettes fitting fully inside frame, simple lamellar armour collar. Proud intense gaze.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 貂蝉表示愿意相信他，吕布又惊又喜、感激动容。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 貂蝉

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；参考图：[diaochan-neutral.png](../expressions/fengyiting-real/diaochan-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚定表明去留要由自己决定，任何人都不能替她做主。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚定表明去留要由自己决定，任何人都不能替她做主。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

听出承诺背后的占有与算计，警惕地追问能否兑现。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 听出承诺背后的占有与算计，警惕地追问能否兑现。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

两人各有可取与可怕之处，一时无法决定该信谁。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 两人各有可取与可怕之处，一时无法决定该信谁。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心计划败露后自己最先被牺牲，急切追问退路。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心计划败露后自己最先被牺牲，急切追问退路。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

被当作可以争夺的战利品，愤然驳斥这种轻贱。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 被当作可以争夺的战利品，愤然驳斥这种轻贱。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

冷眼看穿「我能保护你」的空话，淡淡讥讽。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 冷眼看穿「我能保护你」的空话，淡淡讥讽。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想到自己自幼只是被人安排的棋子，委屈而悲凉。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想到自己自幼只是被人安排的棋子，委屈而悲凉。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

念及养父王允与城中百姓的安危，流露深切关怀。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 念及养父王允与城中百姓的安危，流露深切关怀。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

对方真正尊重她的选择与退路，心中欣慰、为之动容。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Diaochan, adult woman about 23, late Eastern Han court attendant and thoughtful independent decision-maker. Oval face, almond-shaped eyes, dark hair in a modest paired bun updo with a single plain hairpin, unadorned crossed robe collar covering chest. Reserved perceptive expression, quiet determination, not coquettish, no elaborate jewels.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 对方真正尊重她的选择与退路，心中欣慰、为之动容。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 细作

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；参考图：[spy-neutral.png](../expressions/fengyiting-real/spy-neutral.png)。

### E02 笃定／坚定 (`resolute`)

笃定地确认自己一字不差地听清了全部对话。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 笃定地确认自己一字不差地听清了全部对话。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

密报时留意四周，提防有人窃听或出卖自己。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 密报时留意四周，提防有人窃听或出卖自己。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

犹豫该不该把最敏感的几句原话也禀报出来。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 犹豫该不该把最敏感的几句原话也禀报出来。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

害怕被追问消息来源、遭到迁怒，急切表明忠心。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 害怕被追问消息来源、遭到迁怒，急切表明忠心。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

被人诬为两面通风的奸细，愤然辩白（美术演绎）。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 被人诬为两面通风的奸细，愤然辩白（美术演绎）。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

暗自讥笑吕布以为私会无人知晓。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 暗自讥笑吕布以为私会无人知晓。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自叹做尽暗中差事却从不被当人看，心中委屈（美术演绎）。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自叹做尽暗中差事却从不被当人看，心中委屈（美术演绎）。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

私下叮嘱同乡少打听相府之事，免遭祸端（美术演绎）。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 私下叮嘱同乡少打听相府之事，免遭祸端（美术演绎）。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

董卓当面嘉许，细作受宠若惊、松了一口气。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed late Eastern Han informant who carries a secretly overheard conversation to Dong Zhuo. Adult man about 30, narrow face, sparse moustache, simple wrapped cloth head covering, plain dark commoner's cross-collar clothing. Alert sideways eyes, discreet ordinary appearance. Not a ninja; no mask or hood.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 董卓当面嘉许，细作受宠若惊、松了一口气。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 凤仪亭之夜 · 董卓旧部

场景依据：`v2/scenarios/scenarios/fengyiting-real/script.js`；参考图：[veteran-neutral.png](../expressions/fengyiting-real/veteran-neutral.png)。

### E02 笃定／坚定 (`resolute`)

终于下定决心，把听到的一切如实禀报旧主。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 终于下定决心，把听到的一切如实禀报旧主。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑府中已有人两面通风，对身边人多有戒备。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑府中已有人两面通风，对身边人多有戒备。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

在旧情与已经动摇的忠心之间反复犹豫，迟迟不敢开口。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 在旧情与已经动摇的忠心之间反复犹豫，迟迟不敢开口。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心迟报会遭猜忌、追责，急切求见说明。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心迟报会遭猜忌、追责，急切求见说明。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

愤慨吕布背弃恩义，竟与貂蝉私相往来。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 愤慨吕布背弃恩义，竟与貂蝉私相往来。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对只会阿谀奉承、不懂打仗的新贵嗤之以鼻。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对只会阿谀奉承、不懂打仗的新贵嗤之以鼻。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

追忆西凉旧日同袍情谊，如今相府人心离散，神色黯然。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 追忆西凉旧日同袍情谊，如今相府人心离散，神色黯然。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

对追随多年的旧主，流露老兵式的关切与挂念。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 对追随多年的旧主，流露老兵式的关切与挂念。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

旧主不计迟报之过、温言相待，老兵如释重负、心存感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Unnamed longtime retainer of Dong Zhuo, late Eastern Han veteran soldier about 55. Broad sun-lined face, greying short beard, thick eyebrows, simple cloth headband and worn plain lamellar collar. Loyal grave expression, weathered but not menacing. No wounds or scars needed.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 旧主不计迟报之过、温言相待，老兵如释重负、心存感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 林

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[lin-neutral.png](../expressions/legal-harbor-murder-jury/lin-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚定地把威胁、独处、改口与未求助串成完整证据链。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚定地把威胁、独处、改口与未求助串成完整证据链。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑顾衡第二次讯问的新说法是看到血点后才改的。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑顾衡第二次讯问的新说法是看到血点后才改的。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

被追问致命一瞬是否故意缺少直接证据，一时语塞。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 被追问致命一瞬是否故意缺少直接证据，一时语塞。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心陪审团被零散疑点带偏、证据链散掉，急切提醒。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心陪审团被零散疑点带偏、证据链散掉，急切提醒。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

听到事前的锤子威胁被说成一句气话，愤然反驳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 听到事前的锤子威胁被说成一句气话，愤然反驳。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽「什么都可能发生」式的怀疑是在想象里找漏洞。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽「什么都可能发生」式的怀疑是在想象里找漏洞。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想到纪川深夜在仓库里倒下，神情沉痛。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想到纪川深夜在仓库里倒下，神情沉痛。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

温言安抚被争论压得不知所措的陪审员，请对方慢慢想。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 温言安抚被争论压得不知所措的陪审员，请对方慢慢想。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

有人终于看懂整条证据链，林如释重负。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Lin, advocate of a guilty verdict in a modern Chinese-language fictional harbor case. Adult about 35 with short straight side-parted hair, rectangular face, simple collared shirt and casual jacket, direct concentrated expression. Androgynous design. NOT lawyer, prosecutor, judge, police officer; no robes or badges.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 有人终于看懂整条证据链，林如释重负。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 苏

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[su-neutral.png](../expressions/legal-harbor-murder-jury/su-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚守排除合理怀疑的门槛，不因人多声大而动摇。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚守排除合理怀疑的门槛，不因人多声大而动摇。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑对方把「相容」悄悄说成「证明」，逐句核对。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑对方把「相容」悄悄说成「证明」，逐句核对。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

被要求正面回应锤子威胁，一时找不到完整解释。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 被要求正面回应锤子威胁，一时找不到完整解释。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心陪审团在证据不足时仓促定罪，急切劝大家慢一步。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心陪审团在证据不足时仓促定罪，急切劝大家慢一步。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

听到有人说判无罪就是纵容凶手，愤然反驳这种施压。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 听到有人说判无罪就是纵容凶手，愤然反驳这种施压。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

讥讽「正常人一定会报警」这种想当然的推论。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 讥讽「正常人一定会报警」这种想当然的推论。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自己的质疑被当成替凶手开脱，感到委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自己的质疑被当成替凶手开脱，感到委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

体谅犹豫不决的陪审员，温和地请对方说出真正的疑问。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 体谅犹豫不决的陪审员，温和地请对方说出真正的疑问。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

有人愿意重看证据、再想一想，苏欣慰地松了口气。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional ordinary juror Su, advocates acquittal on reasonable doubt. Adult about 32, oval face, chin-length straight bob tucked behind one ear, plain light knit sweater, thoughtful composed expression, slightly raised eyebrow. Androgynous everyday design. NOT a defence lawyer or judge; no legal robes.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 有人愿意重看证据、再想一想，苏欣慰地松了口气。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 陈岚

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[chen-lan-neutral.png](../expressions/legal-harbor-murder-jury/chen-lan-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚持讨论必须回到证据与证明责任，不许催票草率收场。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚持讨论必须回到证据与证明责任，不许催票草率收场。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

察觉有人私下拉票，警惕地要求公开说明理由。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 察觉有人私下拉票，警惕地要求公开说明理由。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

两边最强论点都有道理，一时不知该如何归纳争点。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 两边最强论点都有道理，一时不知该如何归纳争点。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心时间耗尽而关键证据还没谈到，急切提醒大家。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心时间耗尽而关键证据还没谈到，急切提醒大家。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

有人当众嘲讽其他陪审员的职业与见识，她严词制止。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 有人当众嘲讽其他陪审员的职业与见识，她严词制止。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对只凭人数压人、不讲理由的做法露出不以为然的冷笑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对只凭人数压人、不讲理由的做法露出不以为然的冷笑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

努力维持的讨论被人斥为偏袒，心中委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 努力维持的讨论被人斥为偏袒，心中委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

照顾很少发言的陪审员，温和地邀请对方说出想法。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 照顾很少发言的陪审员，温和地邀请对方说出想法。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

各方终于正面回应彼此的最强论点，她欣慰地松了口气。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 44-year-old community mediation project manager and ordinary juror, discussion convener without judge powers. Calm mature androgynous person with short gently waved hair, round eyeglasses, open rounded face, simple cardigan over button shirt. Balanced attentive expression. Daily civilian clothes, no uniform.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 各方终于正面回应彼此的最强论点，她欣慰地松了口气。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 魏笙

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[wei-sheng-neutral.png](../expressions/legal-harbor-murder-jury/wei-sheng-neutral.png)。

### E02 笃定／坚定 (`resolute`)

按八分钟时间表逐项推演，坚持时间顺序不容含糊。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 按八分钟时间表逐项推演，坚持时间顺序不容含糊。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑有人把「来得及」偷换成「已经发生」。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑有人把「来得及」偷换成「已经发生」。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

两种动作叙事在八分钟内都排得下，一时无法取舍。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 两种动作叙事在八分钟内都排得下，一时无法取舍。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心关键时间点被说错却没人纠正，急切打断。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心关键时间点被说错却没人纠正，急切打断。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

有人一再改动时间点来迁就自己的故事，忍不住斥责。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 有人一再改动时间点来迁就自己的故事，忍不住斥责。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对凭感觉估算时间的说法露出轻蔑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对凭感觉估算时间的说法露出轻蔑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

细致排出的时间表被当作钻牛角尖，感到委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 细致排出的时间表被当作钻牛角尖，感到委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

看出同伴被时间表弄得着急，放缓语气让对方别慌。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 看出同伴被时间表弄得着急，放缓语气让对方别慌。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

大家终于愿意按时间表讨论，如释重负。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 36-year-old urban rail dispatcher and ordinary juror, precise about timelines. Androgynous adult with short neat side-parted hair, narrow rectangular glasses, slim face, plain zip-neck knit top. Focused slightly furrowed brow. Daily clothes, no conductor hat or headset.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 大家终于愿意按时间表讨论，如释重负。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 韩朔

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[han-shuo-neutral.png](../expressions/legal-harbor-murder-jury/han-shuo-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚定指出门外镜头只能证明进出，不能证明室内动作。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚定指出门外镜头只能证明进出，不能证明室内动作。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑有人把监控记录夸大成拍到了室内的一刻。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑有人把监控记录夸大成拍到了室内的一刻。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

多项记录合在一起的意义，让他一时拿不准单项局限的分量。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 多项记录合在一起的意义，让他一时拿不准单项局限的分量。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心大家误读监控而作出错误判断，急切解释。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心大家误读监控而作出错误判断，急切解释。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

有人无视设备局限、坚称监控就是铁证，他当场驳斥。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 有人无视设备局限、坚称监控就是铁证，他当场驳斥。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对不懂设备却言之凿凿的技术断言嗤之以鼻。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对不懂设备却言之凿凿的技术断言嗤之以鼻。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自己的专业解释被说成替被告开脱，心里委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自己的专业解释被说成替被告开脱，心里委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

察觉同伴因看不懂监控而不安，温和地让对方放心。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 察觉同伴因看不懂监控而不安，温和地让对方放心。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

同伴承认误读了记录并致谢，他感到欣慰。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 41-year-old building security and facilities engineer serving as ordinary juror. Mature adult masculine appearance, square broad face, close-cropped hair, modest stubble, dark simple work jacket over T-shirt. Skeptical attentive expression. Not a police or security uniform; no badge.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 同伴承认误读了记录并致谢，他感到欣慰。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 沈青

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[shen-qing-neutral.png](../expressions/legal-harbor-murder-jury/shen-qing-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚持「相容」不等于「证明」，报告措辞一字不能改。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚持「相容」不等于「证明」，报告措辞一字不能改。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑有人把检验结论改写成了更强的说法。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑有人把检验结论改写成了更强的说法。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

各项证据单看都有限，合在一起的意义让她一时拿不准。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 各项证据单看都有限，合在一起的意义让她一时拿不准。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心误读检验报告导致错判，急切提醒大家看原文。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心误读检验报告导致错判，急切提醒大家看原文。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

有人故意曲解检验报告的措辞，她严正纠正。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 有人故意曲解检验报告的措辞，她严正纠正。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对把「不能排除」说成「就是他」的外行推论露出轻蔑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对把「不能排除」说成「就是他」的外行推论露出轻蔑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自己的严谨被嘲为吹毛求疵，感到委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自己的严谨被嘲为吹毛求疵，感到委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

看出同伴被检验术语吓住，温和地安慰对方慢慢来。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 看出同伴被检验术语吓住，温和地安慰对方慢慢来。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

大家愿意回到报告原文逐句核对，她欣慰地松了口气。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 39-year-old hospital laboratory quality manager, ordinary juror, not forensic expert. Androgynous person with fine oval face, tidy medium hair tied low behind head, small oval glasses, plain buttoned blouse. Careful analytical expression. Civilian clothes, no lab coat, scrubs or medical mask.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 大家愿意回到报告原文逐句核对，她欣慰地松了口气。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 杜临

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[du-lin-neutral.png](../expressions/legal-harbor-murder-jury/du-lin-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚持要把取锤、拉扯、碰击的顺序讲清楚才能下判断。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚持要把取锤、拉扯、碰击的顺序讲清楚才能下判断。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑某条动作路线在现场空间里根本走不通。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑某条动作路线在现场空间里根本走不通。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

公开距离显示两种取锤路线都走得通，一时拿不定主意。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 公开距离显示两种取锤路线都走得通，一时拿不定主意。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心大家脱离现场空间空谈，急切要求按平面图推演。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心大家脱离现场空间空谈，急切要求按平面图推演。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

有人拿工人在混乱中的应急反应当作罪证，他愤然反驳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 有人拿工人在混乱中的应急反应当作罪证，他愤然反驳。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对没在现场干过活、却断言「不可能」的说法嗤之以鼻。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对没在现场干过活、却断言「不可能」的说法嗤之以鼻。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

自己的现场经验被说成粗人之见，感到委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 自己的现场经验被说成粗人之见，感到委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

像照顾夜班新人一样，关心累坏了的同伴。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 像照顾夜班新人一样，关心累坏了的同伴。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

有人按动线复核并认可他的经验，他感到宽慰。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 50-year-old food distribution night-shift supervisor and ordinary juror. Masculine mature person, broad stocky face, high receding hairline with short hair, thick eyebrows, clean shaven, plain worn work shirt with collar. Practical tired but alert expression. Everyday worker, no hat or uniform insignia.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 有人按动线复核并认可他的经验，他感到宽慰。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 孟遥

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[meng-yao-neutral.png](../expressions/legal-harbor-murder-jury/meng-yao-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚持草稿不等于决定、潜在损失不等于杀人动机。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚持草稿不等于决定、潜在损失不等于杀人动机。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑改口背后另有隐瞒，仍要求把动机逐项分清。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑改口背后另有隐瞒，仍要求把动机逐项分清。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

说谎动机与现场行为相互印证，一时难以拆分判断。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 说谎动机与现场行为相互印证，一时难以拆分判断。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心动机被过度解读而酿成错判，急切提醒。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心动机被过度解读而酿成错判，急切提醒。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

有人把「会丢工作」直接说成「就会杀人」，她忍不住驳斥。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 有人把「会丢工作」直接说成「就会杀人」，她忍不住驳斥。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对不分草稿与正式决定的粗糙推论露出冷淡轻蔑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对不分草稿与正式决定的粗糙推论露出冷淡轻蔑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

细致的区分被说成替被告找借口，感到委屈。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 细致的区分被说成替被告找借口，感到委屈。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

体谅被文件绕晕的同伴，温和地让对方别有压力。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 体谅被文件绕晕的同伴，温和地让对方别有压力。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

大家愿意逐项区分证据的含义，她欣慰地松了口气。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 33-year-old corporate internal auditor and ordinary juror. Androgynous adult with smooth narrow face, straight ear-length hair parted in centre, thin rectangular glasses, plain dark cardigan and crisp light collar. Quiet evaluating gaze. Ordinary civilian professional, no badge.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 大家愿意逐项区分证据的含义，她欣慰地松了口气。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 方稚

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[fang-zhi-neutral.png](../expressions/legal-harbor-murder-jury/fang-zhi-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚持人在惊慌中的反应千差万别，不能用「正常人」一概而论。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚持人在惊慌中的反应千差万别，不能用「正常人」一概而论。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑有人拿自己的想象代替本案的痕迹。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑有人拿自己的想象代替本案的痕迹。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

见过太多反常反应，一时不知该给异常行为多少解释空间。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 见过太多反常反应，一时不知该给异常行为多少解释空间。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

想到伤者倒地后的抢救时间，忍不住紧张急切。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 想到伤者倒地后的抢救时间，忍不住紧张急切。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

听到「冷血、见死不救」的武断指责，她当即反驳。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 听到「冷血、见死不救」的武断指责，她当即反驳。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对从没见过急救现场却言之凿凿的说法露出不屑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对从没见过急救现场却言之凿凿的说法露出不屑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想起急诊室里没能救回的病人，神情低落。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想起急诊室里没能救回的病人，神情低落。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

温柔安抚被血腥细节吓到的陪审员。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 温柔安抚被血腥细节吓到的陪审员。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

大家愿意认真理解人在危急中的反应，她欣慰动容。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 46-year-old emergency nurse and ordinary juror. Feminine mature person, rounded face with slight eye lines, practical cropped wavy hair, plain soft pullover. Compassionate alert eyes, lightly pressed lips. Off-duty civilian clothing, no nurse hat, scrubs, mask or red cross.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 大家愿意认真理解人在危急中的反应，她欣慰动容。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 蒋诚

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[jiang-cheng-neutral.png](../expressions/legal-harbor-murder-jury/jiang-cheng-neutral.png)。

### E02 笃定／坚定 (`resolute`)

鼓起勇气坚持自己的疑问，不肯随大流投票。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 鼓起勇气坚持自己的疑问，不肯随大流投票。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑有人讲的故事太顺，处处需要打补丁。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑有人讲的故事太顺，处处需要打补丁。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

两边说得都有道理，挠头拿不定主意。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 两边说得都有道理，挠头拿不定主意。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

被点名当作关键一票催促，紧张得坐立不安。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 被点名当作关键一票催促，紧张得坐立不安。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

被人讥为没文化、听不懂证据，愤而顶回去。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 被人讥为没文化、听不懂证据，愤而顶回去。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对满口术语却不肯坦率回应弱点的说辞露出不屑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对满口术语却不肯坦率回应弱点的说辞露出不屑。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

朴素的疑问被当成拖后腿，委屈又沮丧。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 朴素的疑问被当成拖后腿，委屈又沮丧。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

像招呼店里客人一样，关心吵累了的大家、劝大家歇口气。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 像招呼店里客人一样，关心吵累了的大家、劝大家歇口气。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

有人认真回答了他的朴素问题，感激又轻松。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 29-year-old small restaurant owner and ordinary juror. Masculine young adult, round friendly face, short slightly unruly hair, thick brows, plain henley shirt. Candid mildly puzzled attentive expression. No chef hat, apron or props.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 有人认真回答了他的朴素问题，感激又轻松。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 宁柏

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[ning-bai-neutral.png](../expressions/legal-harbor-murder-jury/ning-bai-neutral.png)。

### E02 笃定／坚定 (`resolute`)

比较两条原因链后，坚定指出哪一条依赖更多无证据假设。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 比较两条原因链后，坚定指出哪一条依赖更多无证据假设。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑某条叙事靠连续假设撑起来，要求逐项举证。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑某条叙事靠连续假设撑起来，要求逐项举证。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

两条原因链各有缺口，一时难以判断孰轻孰重。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 两条原因链各有缺口，一时难以判断孰轻孰重。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

担心陪审团被口才而非证据左右，急切提醒回到材料。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 担心陪审团被口才而非证据左右，急切提醒回到材料。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

有人故意略去不利证据来讲故事，他严词指出。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 有人故意略去不利证据来讲故事，他严词指出。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对「存在另一种可能就足够」的说法露出老练的讥讽。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对「存在另一种可能就足够」的说法露出老练的讥讽。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想起多年理赔中见过的冤屈申请人，神情黯然。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想起多年理赔中见过的冤屈申请人，神情黯然。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

以长者的耐心照顾年轻陪审员，鼓励他们说出疑虑。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 以长者的耐心照顾年轻陪审员，鼓励他们说出疑虑。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

双方都愿意正面回应最弱的一环，他欣慰地点头。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 55-year-old property insurance claims investigator and ordinary juror. Androgynous mature person, long lean lined face, short swept back grey hair, rimless glasses suggested with minimal pixels, plain high-neck sweater under simple jacket. Patient shrewd but fair gaze. No detective costume or police badge.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 双方都愿意正面回应最弱的一环，他欣慰地点头。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 顾衡

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[gu-heng-neutral.png](../expressions/legal-harbor-murder-jury/gu-heng-neutral.png)。

### E02 笃定／坚定 (`resolute`)

坚持自己没有故意杀人，一字一句重申说法；表情不暗示有罪或无罪已定。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 坚持自己没有故意杀人，一字一句重申说法；表情不暗示有罪或无罪已定。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

怀疑讯问中的问题暗设陷阱，谨慎防备。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 怀疑讯问中的问题暗设陷阱，谨慎防备。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

被追问当晚细节，记忆混乱、前后难以理清。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 被追问当晚细节，记忆混乱、前后难以理清。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

害怕被认定为故意杀人、失去一切，急切请求听完他的说法。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 害怕被认定为故意杀人、失去一切，急切请求听完他的说法。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

被直接称为杀人凶手时，愤而否认这一指控。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 被直接称为杀人凶手时，愤而否认这一指控。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

对把他说成一贯冷血之人的脸谱化描述冷笑以对。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 对把他说成一贯冷血之人的脸谱化描述冷笑以对。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

想到工作、名誉与生活一夜崩塌，神情委屈悲凉。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 想到工作、名誉与生活一夜崩塌，神情委屈悲凉。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

讯问间隙问起家人近况，流露牵挂。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 讯问间隙问起家人近况，流露牵挂。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

得知有人愿意认真听完他的陈述，如释重负。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 38-year-old freight operations manager, defendant in a disputed harbor warehouse death. Ordinary masculine adult with short tidy hair, broad oval face, clean shaven, unadorned casual business shirt. Tired apprehensive but dignified neutral expression. No criminal stereotype, handcuffs, prison clothes, blood or hammer.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 得知有人愿意认真听完他的陈述，如释重负。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

## 码头疑云 · 纪川

场景依据：`v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`；参考图：[ji-chuan-neutral.png](../expressions/legal-harbor-murder-jury/ji-chuan-neutral.png)。

### E02 笃定／坚定 (`resolute`)

生前坚持要求交出异常货箱的原始交接记录，准备启动内审。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: resolute / firm (笃定／坚定) — steady conviction and resolve: sure of oneself, refusing to be shaken, willing to take responsibility and act. Calm inner strength, not hostility.
Narrative motivation (for expression only, do not draw the scene): 生前坚持要求交出异常货箱的原始交接记录，准备启动内审。
Face AND body direction: Brows level and firmly set, slightly lowered but NOT knitted into a V; clear steady eyes looking straight ahead at the listener; mouth closed in a firm straight line with the jaw set; chin level to slightly raised; head upright and turned a little more frontal than the neutral. Shoulders squared, back straight, chest open; one hand closed into a firm fist held steady at lower-chest height (not raised, not shaking).

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E03 疑虑／警惕 (`wary`)

生前核对交接记录时，怀疑签字经手的数字被人改动。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: wary / suspicious (疑虑／警惕) — directed distrust and vigilance: doubting a specific person, promise or claim, guarding against being misled, wanting it verified.
Narrative motivation (for expression only, do not draw the scene): 生前核对交接记录时，怀疑签字经手的数字被人改动。
Face AND body direction: Eyes narrowed and cutting sideways toward the unseen speaker in a pronounced side-glance; one brow lowered, the other slightly raised in doubt; lips pressed thin and tight, one corner pulled down; head turned slightly away with the chin tucked while the eyes stay on the target. Shoulders drawn back, torso angled away; arms folded across the chest in a closed, guarded posture.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E04 困惑／犹疑 (`hesitant`)

生前犹豫是否该立刻暂停多年合作的货运合同。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: perplexed / hesitant (困惑／犹疑) — confusion and indecision: torn by contradictory information or inner conflict, unable to decide or to sort out one's own feelings.
Narrative motivation (for expression only, do not draw the scene): 生前犹豫是否该立刻暂停多年合作的货运合同。
Face AND body direction: Brows raised and pinched upward in the middle, uneven with one higher than the other; eyes unfocused, drifting down and to the side as if searching for an answer; lips pursed and pulled to one side, or slightly parted mid-hesitation; head tilted noticeably to one side. Shoulders slightly raised and uneven; one hand lifted to touch the chin or jaw in uncertain thought.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E05 忧惧／急切 (`anxious`)

生前担心异常货箱牵连整座仓库和工人，急着把问题查清。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: anxious / urgent (忧惧／急切) — fear and urgency: worried or frightened about imminent harm, failure, loss of control or losing every retreat, and urgently pleading, pressing or warning because of it.
Narrative motivation (for expression only, do not draw the scene): 生前担心异常货箱牵连整座仓库和工人，急着把问题查清。
Face AND body direction: Eyes wide open with whites visible around the irises; brows raised high and drawn together in a worried arch; mouth open mid-plea as if urging 'wait' or 'hurry'; head pushed forward on a tense neck. Shoulders raised and tight; both hands raised in front of the chest, palms out with fingers spread, pressing toward the listener.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E06 愤怒／义愤 (`angry`)

生前在仓库例会上，严词斥责对异常货箱敷衍了事的做法。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: angry / indignant (愤怒／义愤) — hot anger and moral outrage at an insult, betrayal, oppression or injustice, expressed as a fierce rebuke.
Narrative motivation (for expression only, do not draw the scene): 生前在仓库例会上，严词斥责对异常货箱敷衍了事的做法。
Face AND body direction: Brows slammed down and sharply knitted into a deep V with furrows between them; eyes glaring hard at the offender; mouth open mid-rebuke with teeth visible; nostrils flared; head thrust forward. Shoulders hunched forward and tense; one arm extended forward below the face with an accusing pointing index finger.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E07 轻蔑／讥讽 (`scornful`)

生前对「只是流程小瑕疵」的搪塞嗤之以鼻。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: scornful / sarcastic (轻蔑／讥讽) — contempt and mockery: looking down on a person or claim as ridiculous, hypocritical, incompetent or unworthy. Cold and superior, not shouting.
Narrative motivation (for expression only, do not draw the scene): 生前对「只是流程小瑕疵」的搪塞嗤之以鼻。
Face AND body direction: An asymmetric sneer: one corner of the mouth lifted in a smirk, the other flat; eyelids half lowered, eyes looking down the nose at the listener; one eyebrow arched high, the other level; chin lifted with the head tilted back and slightly away. Shoulders relaxed and turned slightly away; one hand raised loosely near the chest in a small dismissive wave.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E08 悲伤／委屈 (`sad`)

生前发觉多年合作的伙伴可能欺瞒自己，失望心寒。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: sad / aggrieved (悲伤／委屈) — sorrow and grievance: hurt, misunderstood, trapped, humiliated or let down, dwelling on one's own pain and loss with helplessness.
Narrative motivation (for expression only, do not draw the scene): 生前发觉多年合作的伙伴可能欺瞒自己，失望心寒。
Face AND body direction: Inner ends of the brows raised in a sorrowful upward slant; eyelids heavy, gaze cast down and away; eyes glistening but no streaming tears; mouth corners pulled down, lips pressed together and slightly trembling; head bowed with the chin lowered. Shoulders slumped and drawn inward, arms hanging with the hands out of frame. Quiet and restrained, not sobbing.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E09 关爱／温情 (`caring`)

生前叮嘱夜班工人注意安全、早点回家。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: caring / tender (关爱／温情) — sincere warmth toward the person in front of them: concern, understanding, protectiveness and gentle acceptance, attentive to that person's feelings, like quietly comforting a friend who is having a hard time.
Narrative motivation (for expression only, do not draw the scene): 生前叮嘱夜班工人注意安全、早点回家。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait, as if facing the person being comforted. Both eyes open, soft and kind, looking at the viewer; the lower lids lift only a little from the smile. Brows relaxed, inner ends raised very slightly with tender concern. Mouth: a small, symmetric, closed-lip smile, both corners raised equally. Head tilted slightly to one side and lowered a little toward the listener, as if listening closely. Shoulders soft and relaxed, upper body leaning in slightly. No hand gesture: both hands stay out of frame. Stern or proud characters show this care in a restrained way (softened eyes, faint smile), never with a grin.
Avoid for this emotion: smug, sly, teasing, flirtatious, knowing or amused looks; smirks or lopsided grins; a raised eyebrow; side-glances; looking down the nose; any open-palm, offering, beckoning or presenting hand.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```

### E10 欣慰／感动 (`moved`)

生前同事主动帮他补齐记录，他松了一口气、心存感激。

```text
Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
Subject identity: Fictional 47-year-old warehouse site manager Ji Chuan, the deceased in a fictional harbor case, depicted as a living person in a normal identification portrait. Masculine adult, long weathered face, receding short hair, faint moustache, plain work jacket and collared shirt. Serious matter-of-fact expression. Alive, unharmed, no blood, injury, memorial border or props.
Required emotion: relieved / moved (欣慰／感动) — relief and heartfelt gratitude just after receiving understanding, protection, help or hope: the worry is over, a weight lifts, and they feel touched and thankful toward the person who helped.
Narrative motivation (for expression only, do not draw the scene): 生前同事主动帮他补齐记录，他松了一口气、心存感激。
Face AND body direction: Turn the face slightly more toward the viewer than in the neutral portrait. Both eyes OPEN, bright and softened, looking at the viewer, with gentle smile creases at the outer corners. Brows lifted and relaxed, the tension clearly released, not knitted. Mouth: a clear, warm, genuine smile, slightly open and showing a little of the upper teeth (a soft open smile if a beard hides the mouth), both corners raised equally. Head bowed slightly forward in a small grateful nod. Shoulders visibly lowered and loose, as after a long exhale. One open hand rests lightly over the heart, fingers together and relaxed. Stern or proud characters show restrained relief: softened eyes and a modest smile.
Avoid for this emotion: closed, half-closed, squinting or winking eyes; the head tilted back; blissful, ecstatic, dreamy or self-satisfied looks; wincing or pained looks; a hand that clutches or presses the chest as if in pain; tears.

Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
```
