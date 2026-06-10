# Engineering Choices

## 1. CLI

在 Axiia Cup 的开发过程中，尤其是在调试和运营过程中，我们使用了 CLI 这样的工具。这个 CLI 不是一开始就天然存在的，而是在开发过程中让 LLM 帮我们写出来的。

这件事本身很有代表性：当项目变复杂之后，不只是产品里会出现多个 AI agent，开发过程中也需要给人和 AI agent 准备更合适的工具。CLI 就是其中一种工具。

### 什么是 CLI

CLI 是 Command Line Interface，也就是命令行界面。

如果网页 UI 是用鼠标点按钮，那么 CLI 就是在终端里输入命令，让程序做事。

例如，网页里可以点一个按钮：

```text
Start Tournament
```

CLI 里则可能是：

```bash
axiia start shangyang-court
```

两者可以触发同一个后端操作。区别在于：网页 UI 更适合人手动操作，CLI 更适合重复执行、脚本化和自动化。

### Web UI 和 CLI 的区别

一个网站完全可以只有 web app，没有 CLI。

比如如果 Axiia Cup 只有网页 UI，那么这些操作都可以通过按钮完成：

- 编辑 scenario：打开 admin 页面，修改表单，点击 save。
- 开始 tournament：点击 start tournament。
- 查看结果：打开排行榜页面。
- 导出数据：点击 download。

这是很常见的产品形态，尤其适合非技术用户。

CLI 提供的是另一种 control surface。同样的事情可以通过命令完成：

```bash
axiia scenario:get shangyang-court --output scenario.json
axiia scenario:update shangyang-court --file scenario.json
axiia start shangyang-court
```

所以可以这样理解：

- Web UI：适合人在浏览器里点。
- CLI：适合人、脚本、CI、AI agent 在终端里操作。

### 为什么这对 Axiia Cup 有用

Axiia Cup 里有很多经常需要查看、修改和导出的东西：

- scenario
- player prompt
- judge prompt
- scorer prompt
- tournament
- playground run
- battle transcript
- LLM call logs

如果只能通过网页操作，很多迭代会比较慢。

有 CLI 之后，一个人或 AI agent 可以先导出 scenario：

```bash
axiia scenario:get shangyang-court --output scenario.json
```

然后修改 JSON，再写回：

```bash
axiia scenario:update shangyang-court --file scenario.json
```

这对 AI agent 特别友好，因为 AI 很擅长读文件、改 JSON、运行命令、看结构化输出。它不需要像人一样在网页里一步步点击。

### Axiia Cup CLI 的几个例子

下面这些例子足够说明 CLI 在 Axiia Cup 里的作用。

#### 查看和更新 scenario

```bash
bun run ./apps/cli/src/index.ts scenario:get shangyang-court \
  --output /tmp/shangyang-court.json
```

```bash
bun run ./apps/cli/src/index.ts scenario:update shangyang-court \
  --file /tmp/shangyang-court.json
```

这可以用来修改场景里的角色信息、prompt template、judge prompt、scorer prompt 等。

#### 导出玩家 prompt

```bash
bun run ./apps/cli/src/index.ts players:prompts \
  --scenario shangyang-court \
  --jsonl \
  --output /tmp/prompts.jsonl
```

这适合做 prompt 分析，比如比较高分 prompt 和低分 prompt 的差别。

#### 启动和查看比赛

```bash
bun run ./apps/cli/src/index.ts start shangyang-court
```

```bash
bun run ./apps/cli/src/index.ts status
```

```bash
bun run ./apps/cli/src/index.ts leaderboard 3
```

这些命令对应网页里的“开始比赛”“查看状态”“查看排行榜”。

#### 先 dry-run 一个 tournament

```bash
bun run ./apps/cli/src/index.ts tournament:run \
  --scenario shangyang-court \
  --format swiss \
  --rounds 4 \
  --dry-run
```

`--dry-run` 表示只检查运行计划，不真的开赛。对于 LLM 比赛来说，这很有用，因为比赛有时间和 token 成本，正式运行前最好先检查配置。

#### 导出一局 battle

```bash
bun run ./apps/cli/src/index.ts battle:export playground 144 \
  --output /tmp/battle.json
```

这个命令可以把一局对战的 transcript、judge output、scoring、LLM calls 等信息导出来，方便 debug 或分析。

## 2. Scenario data in database

Axiia Cup 在早期设计时就预期会有多个场景，而不是只有一个固定游戏。因此，一个重要设计选择是：scenario 的数据存进数据库，而不是完全 hardcode 在代码里。

如果 hardcode，场景可能会写成代码里的常量：

```ts
const scenario = {
  id: "shangyang-court",
  judgePrompt: "...",
  roleAName: "商鞅",
  roleBName: "甘龙"
}
```

这在原型阶段并不一定错，甚至可能更快。但 Axiia Cup 的场景需要不断修改和测试，比如：

- 改角色设定
- 改 judge prompt
- 改 scorer prompt
- 改隐藏目标
- 改对话轮数
- 增加新场景

所以把 scenario 存进数据库，会更方便编辑、测试和迭代。它也让 CLI 有意义：CLI 可以导出 scenario JSON，让人或 AI agent 修改，再写回数据库。

## 3. Database schema

把 scenario 放进数据库之后，还有一个更难的问题：scenario 的 schema 应该长什么样？

这里的 schema 可以理解为：一类数据必须有哪些字段、每个字段是什么格式。

Axiia Cup 的难点是，不同场景虽然都叫 scenario，但结构并不完全一样：

- 商鞅变法有隐藏请求和赛后问询。
- 本能寺之变有可选角色。
- 电车难题没有隐藏目标，更像多个伦理案件的逐案辩论。

如果 schema 太死，就只能支持一种场景。  
如果 schema 太松，又会让系统很难验证、运行和调试。

所以这里的设计选择是：保留一个统一的 scenario schema，但让其中一些部分可以为空或配置化。

例如：

- 有些场景可以有 hidden info，有些可以没有。
- 有些场景可以有 requests，有些可以没有。
- `trueRequestCount` 可以是 1，也可以是 0。
- `examinationQuestionTemplate` 可以有内容，也可以为空。
- 有些场景可以使用 role options，让玩家选择不同角色。
- 不同场景可以有不同的 agent prompt、judge prompt 和 scorer prompt。

这样做的好处是：底层 engine 仍然可以用同一套流程运行比赛，但场景设计上有足够空间容纳不同玩法。

## 4. Langfuse

在 Axiia Cup 里，一场比赛不是一次 LLM 调用，而是一串 LLM 调用：

- player agent A 发言
- player agent B 回应
- 继续多轮对话
- judge 阅读对话并裁决
- scorer 根据裁决和规则计算分数

从人的角度看，这里面最困难的事情之一是：我们需要知道这些大模型到底看到了什么、说了什么、在哪一步出错。

Langfuse 的作用，就是把这些 LLM 调用变成人可以阅读、检查和调试的记录。

它可以帮助我们看到：

- 这一轮是谁在发言
- 使用的是哪个模型
- 输入给模型的 prompt 是什么
- 模型返回了什么
- 这一 call 属于 player、judge 还是 scorer
- 花了多长时间
- 有没有报错
- token 使用量大概是多少

这对于 Axiia Cup 特别重要，因为这里不是一个模型在单独回答问题，而是多个模型在同一个系统里互相接力。

如果没有这样的观察工具，开发者只能看到最后结果：这局赢了、输了，或者失败了。但很难知道失败到底发生在哪里：

- 是 player agent 没有遵守角色？
- 是 judge prompt 没有给对上下文？
- 是 scorer 没有正确解析 judge output？
- 是某个模型返回了格式错误的 JSON？

Langfuse 让这些过程变得可见。它让人可以像看比赛录像一样，回到某一次模型调用，检查当时的输入、输出和上下文。

所以这个设计选择的意义是：当系统里有多个 LLM agent 在连续互动时，开发者需要一种人类可读的方式来观察它们。Langfuse 提供的就是这种观察和调试界面。
