# 用 NP-hard 问题建模确定性的人类判断法庭

可以。最自然的方式是把“人类法庭判断”建模成一个**确定性的约束满足 / 加权最优化问题**。

核心思想：

> 法庭不是随机地判，而是在一堆互相冲突的证据、规则、先例、动机、可信度之间，寻找一个“整体最一致、代价最小、解释力最高”的结论。
> 这个“寻找最优解释”的过程，可以设计成 NP-hard。

---

## 1. 基本形式

设一个案件输入为：

$$
x = \text{案件材料}
$$

候选裁决为：

$$
y = \text{事实认定 + 法律适用 + 最终判决}
$$

然后定义一个确定性的评分函数：

$$
S(x, y)
$$

它衡量这个裁决有多好，比如：

- 是否符合证据？
- 是否满足法律要件？
- 是否内部一致？
- 是否解释了反常证据？
- 是否符合先例？
- 是否满足“优势证据”“排除合理怀疑”等证明标准？
- 是否最小化了不公正、矛盾和例外？

最终法庭输出：

$$
J(x) = \arg\max_y S(x,y)
$$

这就是一个确定性法庭：

> 同一个案件 \(x\)，永远输出同一个判决 \(J(x)\)。

难点在于：候选裁决 \(y\) 的空间可以是指数级的。找到最高分的 \(y\)，可以被设计成 NP-hard。

---

## 2. 最合适的 NP-hard 模型：Weighted Max-SAT

我会优先用 **Weighted Max-SAT** 来建模。

### 对应关系

| 法庭元素         | Max-SAT 元素             |
| ---------------- | ------------------------ |
| 一个事实判断     | 布尔变量                 |
| “被告是否有故意” | \(A = 1\) 或 \(A = 0\)   |
| 一条证据         | 一个 clause / constraint |
| 证据强度         | 权重                     |
| 法律要件         | hard constraint          |
| 证人矛盾         | 两个不能同时满足的约束   |
| 判决             | 最优变量赋值             |
| 证明标准         | 分数阈值                 |

例如：

- \(A\)：被告是否在现场
- \(B\)：被告是否有动机
- \(C\)：证人甲是否可信
- \(D\)：监控是否可靠
- \(E\)：是否构成犯罪要件

一些规则可以写成：

$$
C \land D \Rightarrow A
$$

$$
A \land B \Rightarrow E
$$

$$
\neg C \Rightarrow \text{降低证词权重}
$$

$$
E \land \text{证据分数} > T \Rightarrow \text{有罪}
$$

如果你把这些变成加权逻辑约束，那么“找出最合理判决”就是：

> 找一个变量赋值，使被满足的加权约束总分最大。

Weighted Max-SAT 是 NP-hard。

---

## 3. 为什么这像“人类判断法庭”

人类法庭不是单纯做演绎推理。它更像是在做：

> abductive inference，也就是“最佳解释推理”。

法官或陪审团面对的不是一个干净的数学证明，而是：

- 证词互相矛盾；
- 证据有噪音；
- 动机可以多重解释；
- 法律规则有例外；
- 先例有相似但不完全相同的地方；
- 某些事实可信但不确定；
- 某些规则必须满足，某些规则只是倾向性考虑。

这很适合用 **hard constraints + soft constraints** 建模。

例如：

### Hard constraints

这些不能违反：

- 判决必须符合法律定义；
- 同一事实不能同时为真和假；
- 不能用被排除的证据；
- 不能违反程序性规则。

### Soft constraints

这些可以违反，但有代价：

- 某个证人通常可信；
- 某条证据支持某个事实；
- 某个先例倾向于某种结论；
- 某种解释更符合常识；
- 某种裁决社会成本更低。

最后系统选择总代价最低、解释力最高的裁决。

这就是一个确定性的“判断机器”。

---

## 4. 更像法庭的模型：Argumentation Framework

如果你想更贴近“法庭辩论”，可以用 **computational argumentation**。

把案件建模成一个论证图：

- 节点 = 一个论点；
- 边 = 攻击、支持、削弱、反驳；
- 权重 = 论点强度；
- 判决 = 哪些论点最终被接受。

例如：

```text
A: 被告有动机
B: 被告在现场
C: 证人甲可信
D: 证人甲说被告不在现场
E: 监控显示被告在现场
F: 监控时间戳可能错误
```

攻击关系：

```text
D attacks B
E supports B
F attacks E
C supports D
```

法庭要找一个稳定的、最大一致的 accepted argument set。

很多 argumentation semantics 的推理问题本身就是 NP-complete 或更高复杂度。加上权重之后，可以自然变成 NP-hard optimization。

这个模型的优点是：

> 它不像 SAT 那么“工程化”，更像真实法庭里的攻防结构。

---

## 5. 另一个很优雅的模型：Kemeny Ranking / Judgment Aggregation

如果你想模拟“多人类法官 / 陪审团”的判断，可以用 **Kemeny-Young rank aggregation** 或 **judgment aggregation**。

法庭不是只问“是 / 否”，而是要在多个解释之间排序：

```text
解释 A：被告有罪
解释 B：被告无罪但撒谎
解释 C：第三方作案
解释 D：证据污染
解释 E：双方都有部分责任
```

不同证据、证人、专家报告、法律原则分别给出不同偏序。

法庭最终要找一个总排序，使它和所有局部排序的冲突最小。

这对应：

> minimum feedback arc set / Kemeny optimal aggregation

它是 NP-hard。

这个模型特别像人类判断，因为人类经常不是直接判断真假，而是在多个叙事之间比较：

- 哪个故事更连贯？
- 哪个故事解释更多证据？
- 哪个故事牺牲的假设最少？
- 哪个故事更符合制度原则？

---

## 6. 怎么让它“不容易被 solve”

这里要小心：**NP-hard 不自动等于实际难**。

一个问题 NP-hard，只说明最坏情况下没有已知多项式时间算法。很多实例依然很容易被 SAT solver、ILP solver、启发式算法或 LLM 辅助破解。

所以你需要设计的是：

> deterministic judge + hard instance distribution

不是随便拿一个 NP-hard 问题。

### 方法一：使用 phase transition 附近的实例

比如随机 3-SAT 在 clause-to-variable ratio 接近某些临界区域时最难。

太少约束：容易满足。
太多约束：容易发现无解。
中间区域：最难。

法庭类比：

- 证据太少：随便判，没信息；
- 证据太多且一致：很好判；
- 最难的是证据足够多，但互相冲突，且每种解释都有局部合理性。

### 方法二：使用 planted solution，但隐藏结构

你可以先生成一个真实最优判决 \(y^\*\)，然后围绕它生成证据。

但不能让 planted structure 太明显，否则会被反推出答案。

做法：

1. 先生成隐藏裁决；
2. 生成支持它的证据；
3. 加入大量干扰证据；
4. 加入局部一致但全局错误的 alternative explanations；
5. 打乱变量、证据顺序、自然语言表述；
6. 保证只有全局优化才能稳定找到最优答案。

这很像现实法庭：真相可能存在，但证据呈现出来时是混乱的。

### 方法三：设计 gap hardness

不要只问：

> 找最优解。

而是设计成：

> 要达到 95 分以上才算过，90 分以下不算。

这样可以利用 approximation hardness。

例如 Max-SAT、Set Cover、Clique、Independent Set、Label Cover 等问题有很多已知的近似困难性。你可以让系统不只是难以精确求解，而且难以轻易得到高质量近似。

### 方法四：让自然语言只是表层，核心是隐藏组合结构

表面上是案件材料：

```text
证人 A 说……
专家 B 认为……
合同第 7 条规定……
先例 X 与本案相似……
```

底层其实对应一个加权约束图。

如果玩家或模型只是读文本，会觉得像在做法律推理。
如果它想完全破解，就必须还原底层约束结构并求解 NP-hard optimization。

### 方法五：每个用户 / 每次测试生成不同实例

如果所有人面对同一题，很快会被记录答案。

可以使用 deterministic seed：

$$
x = G(\text{user\_id}, \text{date}, \text{task\_id})
$$

这仍然是确定性的。
同一个 seed 永远生成同一题。
但外部无法提前知道所有实例。

---

## 7. 一个具体设计模板

可以这样构造一个“确定性人类判断法庭 benchmark”。

### Step 1：定义事实变量

例如 100 个变量：

```text
F1: 合同是否有效
F2: 原告是否知情
F3: 被告是否故意隐瞒
F4: 第三方是否介入
F5: 损害是否可预见
...
```

### Step 2：定义法律规则

例如：

```text
若合同有效 + 被告故意隐瞒 + 原告合理依赖，则被告承担责任。
若原告已知风险，则责任下降。
若第三方独立介入，则因果链断裂。
```

这些是 hard constraints 或 high-weight constraints。

### Step 3：生成证据

每条证据支持或反驳某些变量：

```text
E1 supports F2, weight 7
E2 attacks F2, weight 5
E3 supports F3, weight 9
E4 attacks F4, weight 3
```

### Step 4：生成冲突结构

加入：

- 证人矛盾；
- 证据污染；
- 例外条款；
- 多个相似先例；
- 可替代因果链；
- 局部合理但全局错误的解释。

### Step 5：确定性评分

对任何提交的裁决 \(y\)，计算：

```text
score =
  evidence_consistency
+ legal_validity
+ precedent_alignment
+ explanation_compression
- contradiction_penalty
- unsupported_claim_penalty
```

### Step 6：输出判决

系统选择最高分裁决，或者要求参与者提交裁决并评分。

---

## 8. 最推荐的三种底层 NP-hard problem

### A. Weighted Max-SAT

最通用。适合模拟：

- 事实认定；
- 证据冲突；
- 法律要件；
- 例外条款；
- 多因素平衡。

这是我最推荐的核心形式。

---

### B. Minimum Feedback Arc Set / Kemeny Aggregation

最像“多证据、多法官、多价值排序”。

适合模拟：

- 陪审团判断；
- 专家证词冲突；
- 多个解释之间的排序；
- 谁更可信；
- 哪个叙事更合理。

---

### C. Weighted Argumentation Framework

最像真实庭审辩论。

适合模拟：

- 原告论点；
- 被告抗辩；
- 反驳；
- 削弱；
- 支持；
- 证据链；
- 最终 accepted argument set。

---

## 9. 一个简化例子

案件材料表面上是：

```text
一家公司被指控误导投资人。
原告说公司隐瞒了关键风险。
被告说风险已在文件中披露。
专家 A 认为披露足够。
专家 B 认为披露不充分。
董事会会议记录显示管理层知道风险。
但邮件显示原告投资前已经接触过类似信息。
```

底层变量：

```text
R: 风险是否重大
K: 被告是否知道风险
D: 是否充分披露
L: 原告是否合理依赖
C: 因果关系是否成立
M: 是否构成误导
```

法律规则：

```text
R ∧ K ∧ ¬D ∧ L ∧ C -> M
```

证据权重：

```text
会议记录 supports K, weight 8
专家 A supports D, weight 5
专家 B supports ¬D, weight 6
邮件 attacks L, weight 7
投资时间线 supports C, weight 4
市场波动 attacks C, weight 5
```

现在系统要决定：

```text
R, K, D, L, C, M
```

哪个组合总分最高？

这就是一个小型 Weighted Max-SAT。扩大到 100–1000 个变量，加入复杂依赖，就不容易 solve。

---

## 10. 关键限制

你需要明确三件事。

### 第一，NP-hard 不是安全性保证

如果实例太小，照样能被暴力解。
如果结构太明显，照样能被启发式算法解。
如果题目重复，照样能被记忆。
如果评分函数暴露，可能被反向优化。

### 第二，确定性和不可预测可以共存

只要：

- 生成过程确定；
- 评分函数确定；
- seed 不公开；
- 实例足够复杂；
- 每个用户实例不同；

那么系统可以是完全 deterministic，但外部仍然难以提前求解。

### 第三，如果你需要真正抗攻击，要靠密码学而不只是 NP-hard

NP-hard 是 complexity-theoretic hardness。
如果你面对的是有资源的 adversary，更接近 cryptographic security。

这时可以考虑：

- hidden seed；
- commitment scheme；
- verifiable computation；
- zero-knowledge proof；
- one-way function；
- collision-resistant hashing；
- proof-of-work 风格实例生成。

但如果你的目标只是“让 LLM / 普通解题者不能轻易暴力刷 benchmark”，NP-hard instance design 通常已经够有用。

---

## 11. 最简洁的设计公式

可以把它写成：

```text
Court(x):
    generate deterministic constraint system C from case x
    for each possible judgment y:
        compute S(x, y)
    return y with maximum S(x, y)
```

其中：

```text
finding argmax_y S(x, y) is NP-hard
checking S(x, y) is polynomial-time
```

这点很重要：

> 判一个答案好不好很快；找到最好的答案很难。

这正是很多法庭判断、人类判断、竞赛题、AI benchmark 的理想结构。

---

## 12. 我的建议

如果你要做一个“人类判断法庭式”的 deterministic benchmark，我会用这个架构：

```text
表层：自然语言案件材料
中层：argument graph
底层：Weighted Max-SAT / Weighted Max-CSP
评分：deterministic polynomial-time verifier
难度：phase-transition + planted solution + distractor arguments
输出：verdict + factual findings + reasoning chain
```

最终它测的不是单纯智商，而是：

- 能不能抽取事实；
- 能不能识别冲突；
- 能不能构造全局一致解释；
- 能不能在局部合理的诱饵中保持全局最优；
- 能不能给出可验证的推理链；
- 能不能接近隐藏的最优 judgment。

这比普通数学题更像“法庭”，也比普通主观评分更 deterministic。
