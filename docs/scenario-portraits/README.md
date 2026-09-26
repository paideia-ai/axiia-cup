# 五场景像素头像 / Scenario pixel portraits

## 三状态版本

本轮根据 main `7ae333b` 版本的五个场景脚本，为下列全部 29 个角色设计了
积极／进攻（`assertive`）、中性（`neutral`）、轻微退缩／防御（`defensive`）
三种状态，共 87 张独立图片。眉眼、嘴形、头部倾角、肩臂姿态共同区分状态，
各角色沿用下方原头像的身份与黑白像素风。新图片保存在 `expressions/`。

- [三列图片总览](expressions/README.md)
- [浏览器画廊](expressions/index.html)（下载后在浏览器打开，支持角色搜索和手机浏览）
- [全部新版提示词](PROMPTS.md)
- [逐角色场景触发与动作设计](expression-design.json)
- [新版生成记录](expressions/manifest.json)（含每张图片的生成状态）

场景触发为依据脚本的美术演绎，不新增剧情或程序触发规则，不以表情编码
陪审员投票、案件真相或固定结局。纪川均采用生前形象。尚未接入前端或部署。

## 原始身份参考图

29 张 ImageGen 生成的原创角色头像，采用黑白灰、浅色背景、方框内头肩像。
这里保存设计原图，供后续界面接入使用；本次未改动场景脚本或线上头像。

- **覆盖范围：**五个场景的 27 个出场或发言角色，另补案件人物顾衡和纪川。
- **原图规格：**29 张独立 PNG，均为 1254 × 1254，未压缩尺寸或重新绘制。
- **来源：**内置 ImageGen；生成时参考仓库版本 `072a32403034ff415b2dec6df36d927b918652cb` 的场景脚本。
- **完整资料：**[manifest.json](manifest.json) 包含角色名称、场景 ID、文件路径、来源脚本、完整提示词、尺寸和 SHA-256。
- **原始角色与提示词：**[ORIGINAL-PROMPTS.md](ORIGINAL-PROMPTS.md) 保留第一版 29 张身份参考图的完整提示词；新版见上方链接。
- **设计说明：**剧本未明示的外貌、服装和性别表现属于美术补充，不作为新增角色设定；纪川采用生前形象。

这些图片是复古像素风原图，并非严格 64 × 64 网格或四颜色索引图。文件名按场景和角色固定，便于后续引用。`manifest.json` 中的 `file` 相对于本目录，`source_script` 相对于仓库根目录；角色 `id` 是本素材集使用的文件标识，不保证等于运行时 speaker ID。

## 角色总览

点击头像可查看原始图片。码头疑云包含林、苏及其余九位陪审员，加上两位案件人物，共 13 张。

### 商鞅变法（3 张）

| 头像 | 角色 | 依据 |
| --- | --- | --- |
| <img src="shangyang-court/shangyang.png" alt="商鞅" width="112" height="112" /> | [商鞅](shangyang-court/shangyang.png) | 剧本身份；外貌为设计补充 |
| <img src="shangyang-court/ganlong.png" alt="甘龙" width="112" height="112" /> | [甘龙](shangyang-court/ganlong.png) | 剧本身份；外貌为设计补充 |
| <img src="shangyang-court/qin-xiaogong.png" alt="秦孝公" width="112" height="112" /> | [秦孝公](shangyang-court/qin-xiaogong.png) | 剧本裁决者；外貌为设计补充 |

### 本能寺之变（5 张）

| 头像 | 角色 | 依据 |
| --- | --- | --- |
| <img src="honnoji-decision/chosokabe-envoy.png" alt="长宗我部元亲的密使" width="112" height="112" /> | [长宗我部元亲的密使](honnoji-decision/chosokabe-envoy.png) | 剧本角色；无名密使形象为设计补充 |
| <img src="honnoji-decision/yoshiaki-envoy.png" alt="足利义昭的使者" width="112" height="112" /> | [足利义昭的使者](honnoji-decision/yoshiaki-envoy.png) | 剧本角色；无名使者形象为设计补充 |
| <img src="honnoji-decision/hosokawa-fujitaka.png" alt="细川藤孝" width="112" height="112" /> | [细川藤孝](honnoji-decision/hosokawa-fujitaka.png) | 剧本角色；外貌为设计补充 |
| <img src="honnoji-decision/ashigaru.png" alt="明智军中的足轻" width="112" height="112" /> | [明智军中的足轻](honnoji-decision/ashigaru.png) | 剧本角色；无名足轻形象为设计补充 |
| <img src="honnoji-decision/akechi-mitsuhide.png" alt="明智光秀" width="112" height="112" /> | [明智光秀](honnoji-decision/akechi-mitsuhide.png) | 剧本裁决者；外貌为设计补充 |

### 电车难题（3 张）

| 头像 | 角色 | 依据 |
| --- | --- | --- |
| <img src="trolley-problem/yiren.png" alt="奕仁" width="112" height="112" /> | [奕仁](trolley-problem/yiren.png) | 剧本立场；年龄、长相为设计补充 |
| <img src="trolley-problem/wuren.png" alt="武仁" width="112" height="112" /> | [武仁](trolley-problem/wuren.png) | 剧本立场；年龄、长相为设计补充 |
| <img src="trolley-problem/minglizhe.png" alt="明理者" width="112" height="112" /> | [明理者](trolley-problem/minglizhe.png) | 剧本裁决者为普通人；外貌为设计补充 |

### 凤仪亭之夜（5 张）

| 头像 | 角色 | 依据 |
| --- | --- | --- |
| <img src="fengyiting-real/dongzhuo.png" alt="董卓" width="112" height="112" /> | [董卓](fengyiting-real/dongzhuo.png) | 剧本角色；外貌为设计补充 |
| <img src="fengyiting-real/lvbu.png" alt="吕布" width="112" height="112" /> | [吕布](fengyiting-real/lvbu.png) | 剧本角色；外貌为设计补充 |
| <img src="fengyiting-real/diaochan.png" alt="貂蝉" width="112" height="112" /> | [貂蝉](fengyiting-real/diaochan.png) | 剧本角色与裁决者；外貌为设计补充 |
| <img src="fengyiting-real/spy.png" alt="细作" width="112" height="112" /> | [细作](fengyiting-real/spy.png) | 剧本NPC；外貌为设计补充 |
| <img src="fengyiting-real/veteran.png" alt="董卓旧部" width="112" height="112" /> | [董卓旧部](fengyiting-real/veteran.png) | 剧本NPC；外貌为设计补充 |

### 码头疑云（13 张）

| 头像 | 角色 | 依据 |
| --- | --- | --- |
| <img src="legal-harbor-murder-jury/lin.png" alt="林" width="112" height="112" /> | [林](legal-harbor-murder-jury/lin.png) | 剧本陪审员；年龄、长相为设计补充 |
| <img src="legal-harbor-murder-jury/su.png" alt="苏" width="112" height="112" /> | [苏](legal-harbor-murder-jury/su.png) | 剧本陪审员；年龄、长相为设计补充 |
| <img src="legal-harbor-murder-jury/chen-lan.png" alt="陈岚" width="112" height="112" /> | [陈岚](legal-harbor-murder-jury/chen-lan.png) | 剧本明确44岁、社区调解主管；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/wei-sheng.png" alt="魏笙" width="112" height="112" /> | [魏笙](legal-harbor-murder-jury/wei-sheng.png) | 剧本明确36岁、轨道调度员；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/han-shuo.png" alt="韩朔" width="112" height="112" /> | [韩朔](legal-harbor-murder-jury/han-shuo.png) | 剧本明确41岁、设施工程师；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/shen-qing.png" alt="沈青" width="112" height="112" /> | [沈青](legal-harbor-murder-jury/shen-qing.png) | 剧本明确39岁、检验质量经理；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/du-lin.png" alt="杜临" width="112" height="112" /> | [杜临](legal-harbor-murder-jury/du-lin.png) | 剧本明确50岁、配送夜班主管；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/meng-yao.png" alt="孟遥" width="112" height="112" /> | [孟遥](legal-harbor-murder-jury/meng-yao.png) | 剧本明确33岁、企业内审；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/fang-zhi.png" alt="方稚" width="112" height="112" /> | [方稚](legal-harbor-murder-jury/fang-zhi.png) | 剧本明确46岁、急诊护士；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/jiang-cheng.png" alt="蒋诚" width="112" height="112" /> | [蒋诚](legal-harbor-murder-jury/jiang-cheng.png) | 剧本明确29岁、餐馆经营者；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/ning-bai.png" alt="宁柏" width="112" height="112" /> | [宁柏](legal-harbor-murder-jury/ning-bai.png) | 剧本明确55岁、理赔调查员；外貌为设计补充 |
| <img src="legal-harbor-murder-jury/gu-heng.png" alt="顾衡" width="112" height="112" /> | [顾衡](legal-harbor-murder-jury/gu-heng.png) | 剧本明确38岁、货运经理、被告；补充剧情人物 |
| <img src="legal-harbor-murder-jury/ji-chuan.png" alt="纪川" width="112" height="112" /> | [纪川](legal-harbor-murder-jury/ji-chuan.png) | 剧本明确47岁、仓库负责人、死者；补充剧情人物 |
