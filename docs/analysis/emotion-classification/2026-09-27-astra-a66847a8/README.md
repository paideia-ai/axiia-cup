# Astra 十类情绪标注与 Jev 提示词

归档用户提供的 Astra 标注 `20260927_a66847a8`，以及本轮 Jev 对照实验实际使用的提示词。
语料版本为 `dataset-outputs-v2`：5 个场景、15 局对战、642 条完整可见 LLM 输出，ID 为 `U0001`—`U0642`。

## 文件

| 文件 | 内容 |
| --- | --- |
| [summary_20260927_a66847a8.md](summary_20260927_a66847a8.md) | Astra 原始汇总、类别分布、边界说明与校验记录 |
| [categories_20260927_a66847a8.json](categories_20260927_a66847a8.json) | 10 个类别的中文名称、定义、边界及示例 ID |
| [labels_20260927_a66847a8.jsonl](labels_20260927_a66847a8.jsonl) | 642 条原文及 Astra 的 `category_id`、`reason` |
| [jev-prompt.md](jev-prompt.md) | Jev 英文指令和十类定义的阅读版 |
| [jev-request-template.json](jev-request-template.json) | 本轮 Jev 请求体模板，待填入单条原文 |
| [manifest.json](manifest.json) | 来源版本、文件 SHA-256、字节数及提示词提取方式 |

三份 Astra 文件保留用户提供的原始文件名与字节。原始汇总中提到的
`categories.json`、`labels.jsonl`，在本目录对应上述带分析标识的文件。
JSONL 已包含每条完整 `text`，可直接作为逐条推理的文本来源。

## 标注单位与类别

**一次生成给人看的完整输出是一个单位。** 其中的多句话、段落、动作描写和尾部附文
共同对应一个标签；不按句子拆分，也不合并不同 ID。自然重复的原文按各自 ID 保留。

本份标注的 `E01` 是「中性／无明显情绪」。类别 ID 以随附的类别文件为准，
不应与其他标注批次仅凭 ID 直接合并。

## Jev 请求如何使用

本轮使用 TypeSafe 的 `POST https://api.typesafe.ai/v1/systemone`，模型固定为
`jev-1.13.0`，提示词版本为 `astra-emotion10-en-v1`。这是实验版本记录。

1. 解析 `jev-request-template.json`。
2. 将 `state.text` 的占位字符串替换为某条记录的完整 `text`，保留所有字符和换行。
3. 按 JSON 序列化后发送请求；认证凭据由调用方另行配置。
4. 将响应的 `answers.emotion.choice`（`E01`—`E10`）关联回该条记录的 ID。

`questions.emotion.instructions` 和 `questions.emotion.criteria` 与本轮冻结配置逐字一致。
阅读版的中文标题用于解释类别，不属于发送给 Jev 的提示词。模板中的占位字符串也不是
实验输入；实际实验每次都以未经改写的中文原文替换它。

请求仅包含原文与固定分类指令，不传入 Astra 的逐条标签、依据、类别示例、场景或角色元数据。
本轮不训练模型，也不向 Jev 施加类别比例配额。

## 使用结果时的限制

Astra 汇总说明标注采用了「中性不超过全量 30%」的约束；实际为 188／642（29.28%）。
Jev 则独立判断每条输出，没有这个全局配额。两者的一致率衡量对这份 Astra 标注的匹配，
不等同于人工核验准确率。类别来自同一份语料，本份资料也不是独立留出的测试集。

文件校验保证记录覆盖、原文完整性和提示词提取一致，不证明每个语义标签是唯一答案。
