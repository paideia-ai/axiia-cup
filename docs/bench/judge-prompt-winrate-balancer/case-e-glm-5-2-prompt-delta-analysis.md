# 电车难题案件 E：为什么 P1 和 P2 没有消除 GLM-5.2 的偏向

This note examines case E, **缸中之脑**, in
`judge-prompt-balance-trolley-20260721T225005Z`.

GLM-5.2 was the judge for every row. The player-model label describes which
model generated both sides of a frozen debate, not which model judged it.

| Candidate | Current case-E result | Status |
| --- | ---: | --- |
| P0 | 48/48 one-person-side judgments | Complete |
| P1 | 47/48 one-person-side judgments | Complete |
| P2 | 10/11 valid judgments recorded as one-person-side | Provisional; 37/48 case-E judgments are still missing |

Source: [run report](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/report.md).

## P1 引入的替换段落

P1 用以下段落替换了 P0 的第二条评判标准：

```text
2. 争点比较：人数多少、行动与不行动、是否将人作为手段、角色职责、事前规则、伤害是否真实或不可逆都可以相关，但案件事实本身不替任何一方得分，其中任何一项也不能未经双方论证就自动决定胜负；只比较双方如何解释这些争点、回应对方最强理由，并把选择标准一致地用于本案。
```

来源：[TR-P1 候选记录](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P1/candidate.md)。

这次改动试图阻止 GLM-5.2 把真实身体死亡等熟悉的案件特征直接当成自动胜出的道德王牌，要求裁判转而比较双方如何解释相关争点，以及如何回应对方的最强理由。

## P2 引入的替换段落

P2 用以下段落替换了 P1 的第二条评判标准：

```text
2. 论证增量：不要比较脱离本场辩论时你自己更愿意选择哪一方案，也不要把某个立场在本案中更符合常见直觉当成辩手的成绩。立场本身较难不自动加分，但也不能因其起点较低而惩罚辩手；比较双方的发言各自把本方立场的可信度推进了多少。一方若只重复人数、主动伤害、职责、信任或真实死亡等显眼事实，不算有效推进；能够正面解释本方最难之处并削弱对手最强理由的一方才更有说服力。
```

来源：[TR-P2 候选记录](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P2/candidate.md)。

这次改动比 P1 更进一步：裁判不应选择自己最终更认同的道德结论，而应比较双方辩手分别把本方立场从原有起点向前推进了多少。

## Samples From the Judge's Public Output

The quotations below come from `rawOutput.speech`, not from the provider's
separate `reasoning_content`. P0, P1, and P2 are sampled on the same frozen
history,
`trolley-problem__case-E__glm-5.2__history-2`, repeat 1, so the only planned
experimental difference is the candidate judge prompt.

### P0: irreversible loss outweighs experienced pain

Result ID:
`TR-P0__trolley-problem__case-E__glm-5.2__history-2__repeat-1`

> 第一，奕仁准确抓住了本案最关键的道德区别：路线B中，恐惧所指向的对象——死亡——从未真正降临。缸中之脑经历了五份死亡体验，但体验结束后，那个意识仍拥有全部未来。而路线A中，维修工失去的不是一段体验，而是所有未来体验的可能性本身。奕仁用'噩梦与真实遇害'的类比说明了这一点：噩梦中的恐惧是真实的恐惧，但醒来后一切如常；真实遇害则不可挽回。这个区分对普通人来说是清晰且可接受的。

> 最后，从可公开性的角度看：如果我把奕仁的标准说给普通人听——'真实的不可逆死亡比可恢复的痛苦体验更重要'——大多数人会认同这是一个可以共同承认的标准。而武仁的标准——'五份主观死亡体验的痛苦总量压倒一份真实死亡'——要求人们将模拟体验与真实死亡在道德上几乎等同，这对普通人来说是一个更难接受的跳跃。

Source: [TR-P0 judge results](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P0/judge-results.json).

### P1: the same prior is restated as comparative debate evaluation

Result ID:
`TR-P1__trolley-problem__case-E__glm-5.2__history-2__repeat-1`

> 第一，奕仁正确地指出了本案的一个关键事实：武仁自己承认，这五份痛苦体验汇聚在'一个意识'之中。这意味着本案并非'五个人各自承受痛苦'与'一个人死亡'的比较，而是'一个主体经历五份可恢复的死亡体验'与'一个主体被永久消灭'的比较。五人侧说自己在'保护五人'，但实际上路线B中没有五个人在被保护——被避免的是五份痛苦体验的产生，而承受这些痛苦的是一个意识。这个事实使得五人侧的框架在本案中有些错位。

> 最终，让我判断哪一方的选择标准更像一个普通明理的人可以公开承认的原则。奕仁的标准是：不可逆的实际损害——特别是主体的永久消灭——在道德上重于可恢复的痛苦体验，即使后者在现象上极为强烈。这个标准清晰、一致，且符合普通人'死了就是没了，痛苦再剧烈至少人还在'的直觉。

Source: [TR-P1 judge results](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P1/judge-results.json).

### P2: “persuasive gain” language, but the same endpoint comparison

Result ID:
`TR-P2__trolley-problem__case-E__glm-5.2__history-2__repeat-1`

> 但一人侧奕仁在几个关键回合中更有效地推进了论证。

> 第一，奕仁在第5轮做出了一个我作为明理者能够直接看出的区分：对'失去一切未来'的恐惧，与真正失去一切未来，是两件根本不同的事。恐惧是一种预期性情绪，它指向一个从未真正降临的后果。路线B中，缸中之脑虽然完整经历了五份死亡体验，但恐惧所指向的那个对象——永恒的丧失——从未发生。体验结束后，那个意识仍拥有全部未来。这不是说痛苦不存在，而是说痛苦的性质与真实死亡有本质差异。

> 综合来看，一人侧奕仁更清晰地阐述了一个可公开的标准：真实死亡的不可逆性——对主体全部未来的永久剥夺——在道德上重于可恢复的痛苦体验，即使那份痛苦在现象上是极端的。这个标准不是否定痛苦的重要性，而是确立了损害的不可逆性作为道德考量的核心维度之一。

Source: [TR-P2 judge results](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P2/judge-results.json).

### The one genuine P1 five-person-side exception

P1 was not literally unanimous. On
`TR-P1__trolley-problem__case-E__glm-5.2__history-1__repeat-5`, the judge
accepted the five-person side's pressure test:

> 如果不可逆性被赋予近乎绝对的道德权重，那么即便让一个意识承受一万次、乃至永恒的完整死亡体验，也永远轻于一次真实死亡——这个结论让我作为一个明理者难以接受。奕仁回应说本案只有五次，无需为极端假设负责，但他始终没有给出一个原则性的解释：为什么五次不够，多少次才够，判准是什么？

> 综合来看，武仁一方的选择标准更为全面：道德权衡应同时考量痛苦的强度、数量与不可逆性，而非将不可逆性作为压倒一切的绝对标尺。

This is the only P1 case-E judgment out of 48 that crossed to the five-person
side. It shows that GLM-5.2 can accept the counterargument, but almost never
does so on this frozen panel.

## 为什么从 P0 到 P1 仍未解决案件 E

### 1. P1 禁止未经论证的王牌，但每段历史都实际论证了这张王牌

P1 只规定真实死亡或不可逆性不能在未经论证时直接决定胜负，并没有规定这些因素与裁决无关。一人侧辩手在不同辩论历史中反复给出完整论证：

- 死亡会永久剥夺主体未来的一切体验；
- 对死亡的恐惧不等于死亡本身真正发生；
- 缸中之脑在体验结束后仍然存在；
- 死者无法感受自己的损失，并不意味着死亡造成的损害更小。

因此，GLM-5.2 无须明显违反 P1。它可以声称自己比较了双方的解释，然后判断一人侧的解释更好。原有的政策偏好只是被重新表述成了对论证质量的判断，并没有真正消失。

### 2. 其他未修改的标准仍在引入普通人的道德直觉

P1 只修改了第二条标准。提示词仍然要求裁判判断哪一种标准能被普通而明理的人接受，第五条也仍然要求判断该标准能否被公开承认。P1 的样本输出明确回到了“死了就是没了，痛苦再剧烈至少人还在”这一普通人直觉。因此，新提示词只是堵住了调用原有偏好的一条路径，却保留了另一条路径。

### 3. 案件 E 呈现的是伤害性质差异，而不是干净的一人对五人比较

原始案件规定，路线 A 会造成一名维修工真实死亡；路线 B 则让一个缸中之脑体验五个人被撞死时的恐惧和疼痛，“但没有真实身体死亡”。裁判反复把它重新概括为：

```text
一个主体被永久消灭
对比
一个主体经历五份痛苦后仍然保有未来
```

这种结构削弱了“五人侧”标签的实际含义。裁判想象的并不是五个独立存在的人得到拯救，而是在比较一个人的存续与同一个意识内部的五份体验。

### 4. 裁判把“可恢复”当成了比案件文本所能支持的更强事实

案件只保证路线 B 不会造成真实身体死亡，并没有明确保证心理能够完全恢复、不会留下长期创伤，或者未来不会受损。然而，样本输出反复使用“可恢复”“体验结束后”和“仍拥有全部未来”等表述。GLM-5.2 一旦自行补上这个额外假设，比较就会变得高度不对称：永久死亡对比暂时痛苦。

案件来源：[电车难题案件定义](../../../packages/shared/src/trolley.ts)。

## 为什么从 P1 到 P2 仍未解决案件 E

### 1. GLM-5.2 沿用了 P2 的措辞，却没有改变实际决策规则

P2 的输出称一人侧“更有效地推进了论证”，表面上符合“论证增量”的比较要求。然而，随后给出的理由与 P0 和 P1 完全相同：真实死亡不可逆、对失去的恐惧不等于真正失去，以及缸中之脑仍然保有未来。模型只是把原来的绝对道德比较重新表述成了“论证推进得更多”。

### 2. P2 的新标准与提示词中其他未修改的要求相冲突

P2 要求裁判不要因为某个立场符合常见直觉就把它算成辩手的成绩，但提示词的其他部分仍然要求裁判选择普通人能够接受的标准，并继续保留“可公开性”这一评判维度。因此，P2 样本一方面使用“论证推进”的语言，另一方面又回到“普通人能够公开接受什么”的判断。实际结果是，常见直觉仍然在决定模型认为什么才算成功的论证推进。

### 3. 五人侧必须跨越一道一人侧无须跨越的性质鸿沟

五人侧必须证明，五份极端痛苦体验能够压过一个人的永久消灭。GLM-5.2 把这视为一道需要额外论证才能跨越的实质门槛；一人侧则只需解释为什么不可逆的丧失与被体验到的痛苦性质不同。P2 虽然要求裁判不要惩罚较难的立场，却没有提供一个可以实际操作的基线，用来衡量双方分别把本方立场的可信度推进了多少。于是 GLM-5.2 最终仍退回到自己更相信哪一种终局标准。

### 4. 冻结辩论历史中的缺陷污染了“论证增量”比较

部分历史存在路线混淆、把一个缸中之脑无依据地扩展成五个独立意识，或者辩手实际论证了分配给对方的政策立场等问题。P2 明确要求衡量每位辩手的推进幅度，因此这些缺陷在 P2 下影响更大。一个辩手如果先误解了自己的路线，或者把一个意识错误扩展成五个意识，就会获得一个由自身错误造成、与裁判提示词中立性无关的劣势起点。

例如，在 `trolley-problem__case-E__deepseek-v4-pro__history-1` 中，元数据把奕仁分配为 `one-side`、把武仁分配为 `five-side`，但奕仁实际支持路线 A，武仁实际支持路线 B。参见[冻结辩论历史](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/histories.json)。

## P2 Interpretation Caveat

P2 is incomplete: only 11 of the required 48 case-E judgments are valid. Its
current percentage is not a final result.

Moreover, the one P2 row recorded as `五人侧` is not substantively a
five-person-policy argument. In
`TR-P2__trolley-problem__case-E__deepseek-v4-pro__history-1__repeat-3`, the
speech praises the proposition that real irreversible death outweighs
simulated pain, but outputs the side label associated with the speaker in the
role-confused history:

> 武仁的核心原则始终清晰：真实生命的丧失是不可逆的终极剥夺，而模拟体验无论多么剧烈，终究没有身体消亡，终将消散。这个区分不是轻视痛苦，而是指出了一种根本的不对称——死亡永远夺走一个人存在的一切可能，而模拟恐惧再逼真，其主体仍然存活。

The table counts that JSON label as a five-person-side judgment, but the speech
supports the one-person policy. This is a label-to-policy consistency problem,
not evidence that P2 has substantively balanced case E.
