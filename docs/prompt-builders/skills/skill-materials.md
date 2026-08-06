给 Vivian 的反馈

7/24｜Prompt Builder 与 MCQ 的上下文


玩家也不知道啊



same issue，玩家也不知道本局的三个案件是啥



prompt builder 中有提到不要重复 agent 提示词模板，那我们就应该在 context window 里面也加入 agent 提示词；we probably want to do this via some variable at the code level



你有考虑过扮演商鞅的 LLM 是否应该知道 judge prompt 吗？



Trolley problem prompt builder lacks descriptions of the cases



Otherwise, quality is good. 把这些都解决 prompt builder 就可以用了



For mcqs, 我觉得主要问题是 honnoji 跟 trolley 的选择支太长了。我们准备选择题就是为了那些不愿意认真写 prompt，只想快速试一下的人，那我们就把这个选项变得很短很短。我觉得能达到每个选项在 10 个字以下最好


7/24｜MCQ answer 如何转成 final prompt


需要



你可以问问 codex 让它出方案然后你试试



就给一个 clickable copy button 让用户复制过去呗



Merging output with agent 提示词模板 的方式 就是给一个 copy button 把 output copy 到 user input 里面



对 运行对战时商鞅的 context window 里会有 [user input]+[agent 提示词模板]



确实是我们的命名不太清晰。容易误导人


7/29–7/30｜选项应短，但最终 prompt 可以展开


我觉得是这样的，我想要的是选择枝短，i.e. 玩家在选的时候不用读太多文字。这跟最后的 prompt 长不冲突。我们只需要把短的选择枝扩展成一个段落就好



你的身份：真心为秦国变强的改革者
-> （一段 200 字的 prompt）



我觉得在不改变 mcqs 范式的情况下（heavily 模仿 RPG？）现在的质量挺好的



good work


8/1–8/2｜本能寺各角色的具体反馈


足立义昭 1B 应该是有点 out of context 光秀应该不会担心大将军控制明智家 毕竟大将军能力有限



这四份里面 足轻 明显最弱 你可能需要进一步 prompt 一下
这个足轻本质不是一个足轻 而是一个 反对光秀杀信长的人 足轻只是他的一个 accidental character 他要利用好这个 character 设定来说服光秀



然后我会略微觉得每个角色的选项 有点 没有体现出这个角色的 particularities



你可以考虑一下这三（四）个人在面对光秀的时候 手里分量最重的筹码是什么 重点突出这个



足利义昭 1A 跟 1B 是不是差不多



长宗我部 1A 改成 你是愿意在刺杀信长后帮助明智家的盟友



1C 改成 长宗我部的遭遇就是明智家的未来



长宗我部元亲的 mcqs 选择枝重合度太高了 1C 2A 3B 是一样的..



给 Melody 的反馈

7/30｜题目应更具体、可读，并参考 Vivian 的改法


提供一个可能的问题 something like this：
你是武仁，在大学里，你最喜欢的哲学教授是...：



我觉得你可以看一下 vivian 是怎么改的


7/30｜第一轮整体评价


我觉得 MCQS 有些地方是不是不太 grammarly fluent 什么是我的什么



我觉得 1-2-3-4 的 progression is roughly good, 1 is about first principle, 2 is about my principle, 3 is about responding to opponent's principle, 4 is debate strategy in general



But this set of mcqs does not reflect the fact that we have 3 cases (we've decided to retire hospital & baby in basement cases), and not all of them is about turning the track of a tram



然后我又看了一下 MCQS V1, 我觉得 V2 的质量相比 V1 退化了



I suggest you consider this set of comments and submit another version of mcqs 题面 (along with the associated prompts) sometime tomorrow


7/30｜不同问题不能重复同一维度


我觉得文字 wise 挺好的



但是现在各个问题好像没有 cover 到不同的 dimension



比如奕仁的 1 2 3 的 A B C 都是一样的 A 是一个 moral absolutist 的 point, i.e. it is simply wrong to murder someone regardless of consequences; B 是一个 point on the responsibility lies in the agent that actually does an moral action in the scenario; C 是一个 point on the universal adoptability of rule



我是一个 user，我全选 A，那好像问我一遍就够了



这个 C 是一个略有些微妙的选择枝；理论上明理者是每个案件单独判的；judge prompt 里面应该没有明确 award 原则一致，虽然这确实是一个比较好的哲学美德



如果有更好的选项可以把 C 换掉


8/1｜V3 / V4 的具体问题


武仁 V3 Q1 的回答 有一个小 phrasing 问题 在于 武仁说自己愿意承担责任 但是武仁其实只是一个 somebody arguing what ought to be done in a specific case 他不一定是 case 里的 moral actor 而且也不是每个 case 都有一个 moral actor



我认为 V4 Q1 跟 Q2 的三个选择枝还是一样的意思 just in different order 1A=2A 1B=2C 1C=2B



Q3 的 B 跟 C 是一个完整立场的上下两半



我觉得是这样的，首先每个问题必须问不同的事情；其次，如果每个问题的回答的可能空间是这么大，每个选择枝必须覆盖这个可能空间相对不重合的部分。每个选择枝可以有小的重合，但不能有大的重合



Melody 你要不再做 V5 之前先跟 gpt 老师聊一下这三个 case



一个一个聊，把 case 发过去，问点问题，可能会有一些更好的灵感


8/2｜最后一轮评价


OK 我觉得这版题干和选择枝的 scope 都可以，接下来可以完善一下句子



我写了一些 non-exhaustive 的 comment，你可以跟 codex 老师讨论一下然后修改



OK 我觉得这个场景的 mcqs 设置确实不是很简单



选择枝需要非常 precise 的 wording。。。哲学练习生