熟悉一下 Axie Cup，这是一个智能体对抗大赛。熟悉一下它的三个场景：
- 商鞅变法
- 本能寺之变
- 电车难题

我下周要作为external guest给杭州国家美术学院的一门 Vibe Coding 课程讲一下 Axia Cup。 我现在需要这个分享的一个 outline，分享大概是 50 分钟。 在 outline 出来之后，我可能还需要一些 HTML slides。 

先根据下面我的大致想法写 outline，后面再考虑 HTML 的问题。 在做 HTML slides 之前，research online what are some of the good skills for making HTML slides. 

我觉得这个分享大概会有以下几个部分组成：
a 我会简单介绍一下我自己
b 之后我会介绍一下axia-cup是什么，大致的。 
c 我请大家登录 Axia Cup 的网站，自己随意输入一些 prompt，尝试玩一局游戏。不管是商鞅变法，还是本能寺之变，还是电车难题。
d 之后我会介绍一下axia-cup开发的心路历程。从一开始，怎么会有 AI 智能体对抗赛这个 idea？ 到如何发展这些 idea，并通过 Vibecoding 和 Codex Claude Code 合作的方式完成 axia-cup 的设计以及产品落地 
这个历程里面大概有两个部分：
1. 场景设计的部分
2. 程序开发的部分
那场景设计部分基本上由我负责的，同时我跟 yihan 会密切地讨论很多。而程序开发的部分，其实一开始是由另外一个同事负责的。这里面涉及到一些比较有困难的部分，比如说 prompt 的组装。因为在比赛的过程中，两个智能体要 talk to each other，里面涉及很多 prompt 的问题。正确地上下文有没有以合适的顺序、怎样被给了 large-range model。这部分我的了解就比较少了。 
e 之后，我会非常简单地介绍一下这三个场景具体分别是什么。 
f 然后我会介绍一下我们比赛的机制。这个时候同学都已经玩过, 上手玩过这个 axia-cup 了。他们能够知道有两方, 这两方分别是:
- 一些国产大模型
- 两个大模型会扮演不同的角色
我主要介绍的就是 Judge 的部分和 Scoring 的部分。Judge 的部分其实是非常重要的, 因为 Judge 也是第三个 large language model。然后它会有一个很重要的 judge prompt, 这个 judge prompt 是公开的。如果想要在这个比赛当中获得高分的话, 理论上啊,大家都应该对着这个 judge prompt 来优化 player 的 prompt。
g 然后我会简单说一下上次内测的情况。内测用的是商鞅变法，会简单给出几例较高分的prompt的样例。 
h 最后我会说一下 Judge Prompt Bias 的情况。 参见这个网页https://judge-bias-spectrum.vercel.app/。在这个 repo 里应该也有跟这个网页相关的内容的材料，在 docs analysis 这个 folder 里。 




OK我说完了。根据以上的内容，research stuff in this repo that are relevant, 充实一下细节，写一版outline
