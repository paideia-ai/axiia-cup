/* 外围四页：G 锦标赛/排名（/tournaments 列表 + /tournaments/:id 积分榜）· I 通知（/notifications）·
   K 设置（/settings）· L 对战历史（/matches）。条款以 spec-index 里 page ∈ {G,I,K,L} 的 45 行为准；
   顶栏铃铛/导航入口属 NAV 组，这里只登记页面本体。 */
import type { StepHints, TmRegistry } from '../types'

export const TM_PERIPHERY: TmRegistry = {
  // ======================= G · 锦标赛列表（/tournaments） =======================
  'G.page-title': {
    label: '排名页标题',
    clauses: ['U11-C01'],
    journeys: ['j9s1'],
    note: '「排名」既是一级导航入口也是 G 排名中心的标题；无独立 J 页',
  },
  'G.page-intro': {
    label: '排名页说明',
    clauses: ['U11-C03', 'U06-C16'],
    note:
      '「玩家天梯待后续版本」＝GP 天梯在 W11 落地前缺席的唯一说明；页面无「天梯」tab',
  },
  'G.loading': {
    label: '锦标赛加载中',
    clauses: ['LACK-10'],
    when: '首次进入 /tournaments 时短暂出现',
  },
  'G.error': {
    label: '锦标赛列表错误',
    clauses: ['LACK-10'],
    when: 'GET /v1/tournaments 失败时出现',
  },
  'G.tournament-list': {
    label: '锦标赛列表',
    clauses: ['U11-C01', 'U11-C02', 'U13-C04'],
    journeys: ['j9s1'],
    note: '「锦标赛选择器」的落地形态：一赛一卡，点卡进积分榜',
    when: '线上至少有一个锦标赛时出现，否则是空态',
  },
  'G.tournament-card': {
    label: '锦标赛卡',
    clauses: ['U11-C02', 'U13-C04'],
    journeys: ['j9s1'],
    note: '整卡是链接 → /tournaments/:id 积分榜',
  },
  'G.tournament-name': {
    label: '锦标赛名',
    clauses: ['U13-C04'],
    note: '「锦标赛 #id」——线上暂无赛名，只有编号',
  },
  'G.tournament-meta': {
    label: '场景与轮次进度',
    clauses: ['U13-C04', 'U13-C03'],
    note: '「场景 · 第 x/y 轮」；U13-C04 e2e 断言「第 2/3 轮」',
  },
  'G.round-timeline': {
    label: '按轮时间线',
    clauses: ['U11-C02', 'U13-C04', 'U13-C03'],
    journeys: ['j9s1'],
    note: 'B4 要求的按轮时间线：一轮一格',
    when: '锦标赛已配过至少一轮时出现',
  },
  'G.round-chip': {
    label: '轮次格',
    clauses: ['U13-C04', 'U13-C03'],
    journeys: ['j9s1', 'j9s3'],
    note:
      '「第 N 轮 海选/正赛」，颜色分 done（绿）/ running（红）/ 待配对（灰）；qualifier/main 译为 海选/正赛（#32）',
  },
  'G.phase-badge': {
    label: '当前阶段徽章',
    clauses: ['U13-C04', 'U13-C02', 'LACK-02'],
    journeys: ['j9s3'],
    note:
      '锦标赛当前处于 海选 还是 正赛（#32 播种切分）；赛制细则规格未写（LACK-02）',
    when: '服务端返回 phase 时出现',
  },
  'G.status-badge': {
    label: '锦标赛状态徽章',
    clauses: ['U13-C04', 'U13-C07'],
    note: '原样显示传输值 running / finished（e2e 断言英文原词）',
  },
  'G.empty': {
    label: '暂无锦标赛空态',
    clauses: ['U11-C01', 'LACK-10'],
    journeys: ['j9s1'],
    note: '0 锦标赛时的 GT 空态「暂无锦标赛。」（第一轮人测时全程如此）',
    when: 'GET /v1/tournaments 为空时出现',
  },

  // ======================= G · 积分榜（/tournaments/:id） =======================
  'G.standings-title': {
    label: '积分榜标题',
    clauses: ['U13-C04', 'U13-C07'],
    journeys: ['j9s2'],
    note: '「锦标赛 #id 积分榜」——e2e 以此 heading 定位',
  },
  'G.standings-hint': {
    label: '排名规则说明',
    clauses: ['LACK-02'],
    note:
      '「同胜场选手对阵，积分高者排名靠前」＝瑞士轮 + 小分的唯一玩家侧说明；细则规格缺席',
  },
  'G.standings-loading': {
    label: '积分榜加载中',
    clauses: ['LACK-10'],
    when: '首次进入积分榜时短暂出现',
  },
  'G.standings-error': {
    label: '积分榜错误',
    clauses: ['LACK-10'],
    when: 'GET /v1/tournaments/:id/standings 失败时出现（如 id 不存在）',
  },
  'G.standings-table': {
    label: '积分榜',
    clauses: ['U11-C04', 'U13-C07'],
    journeys: ['j9s2'],
    note: '桌面为表格、移动端为卡片列表，同一份 entries；一行一个玩家（#64）',
    when: '有积分数据时出现',
  },
  'G.standings-mobile-list': {
    label: '移动端积分榜',
    clauses: ['U11-C04'],
    journeys: ['j9s2'],
    when: '视口 < md（768px）时代替表格显示',
  },
  'G.standings-mobile-row': {
    label: '移动端积分卡',
    clauses: ['U11-C04', 'U13-C07'],
    journeys: ['j9s2'],
    note: '#名次 · 昵称 · 胜率 · 胜负 · 小分',
    when: '视口 < md 时',
  },
  'G.standings-header-row': {
    label: '积分榜表头',
    clauses: ['LACK-02'],
    note: '名次 / 选手 / 胜 / 负 / 小分（title 解释 Buchholz）/ 胜率',
    when: '视口 ≥ md 时',
  },
  'G.standings-row': {
    label: '积分榜行',
    clauses: ['U11-C04', 'U13-C07'],
    journeys: ['j9s2'],
    note: '一行一个玩家，同一玩家不占两行（#64）；U13-C07 e2e 断言结赛后四行',
    when: '视口 ≥ md 时',
  },
  'G.standings-player': {
    label: '选手昵称',
    clauses: ['U11-C04'],
    journeys: ['j9s2'],
    note:
      '排名主体是玩家昵称，不是 agent / 侧 / 版本号（#64）；桌面与移动端各一处，同一 id',
  },
  'G.standings-submissions': {
    label: '两侧版本号小字',
    clauses: ['U11-C04'],
    journeys: ['j9s2'],
    note: '#64：名次属于人，两侧投的版本 #id 降为小字下钻线索',
    when: '视口 ≥ md 时',
  },
  'G.standings-buchholz': {
    label: '小分',
    clauses: ['LACK-02'],
    note:
      'Buchholz 小分＝同胜场时的排名依据；桌面表头与移动端卡各一处，同一 id',
  },
  'G.standings-empty': {
    label: '暂无积分空态',
    clauses: ['U13-C07', 'LACK-10'],
    note: '「暂无积分数据。」——赛未开或无参赛者',
    when: 'standings.entries 为空时出现',
  },

  // ======================= I · 通知（/notifications） =======================
  'I.action-bar': {
    label: '通知操作条',
    clauses: ['U09-C06'],
    journeys: ['jR3s1'],
    note: 'F3：sticky 贴在顶栏下沿，长列表滚到哪都看得见「全部已读 / 清除」',
  },
  'I.page-title': {
    label: '通知页标题',
    clauses: ['U09-C01', 'U09-C16'],
    note:
      'alpha 只做站内通知（#43）：通知只落这一页与铃铛，全站无邮件/推送开关',
  },
  'I.unread-badge': {
    label: '未读数徽章',
    clauses: ['U09-C03', 'U08-C10'],
    journeys: ['jR3s3'],
    note:
      '「N 条未读」由当前列表派生，应与铃铛未读点同源（铃铛本体在 NAV 组）；全部已读后消失',
    when: '有未读通知时出现',
  },
  'I.actions': {
    label: '已读/清除组',
    clauses: ['U09-C06', 'U09-C16'],
    journeys: ['jR3s1', 'jR3s4'],
    note: '空态不给动作：0 条通知时整组不渲染（U09-C16）',
    when: '列表非空时出现',
  },
  'I.read-all-button': {
    label: '全部已读按钮',
    clauses: ['U09-C06', 'U09-C03', 'U09-C02'],
    journeys: ['jR3s3', 'jR3s4'],
    note: '乐观全读，页面位置不动；无未读时禁用；老服务器 404 → 就地提示',
  },
  'I.clear-button': {
    label: '清除按钮',
    clauses: ['U09-C06'],
    note: '破坏性动作：先 confirm「清空全部通知？此操作不可恢复。」再发',
  },
  'I.action-error': {
    label: '操作失败提示',
    clauses: ['U09-C06', 'LACK-10'],
    journeys: ['jR3s4'],
    note:
      '标记/全读/清除失败时的明确提示，并 reload 与服务端对齐；端点缺席有专用文案',
    when: '标为已读 / 全部已读 / 清除请求失败时出现',
  },
  'I.loading': {
    label: '通知加载中',
    clauses: ['LACK-10'],
    when: '仅首载出现；重取期间列表保持挂载（F3）',
  },
  'I.error': {
    label: '通知列表错误',
    clauses: ['LACK-10'],
    when: '首载 GET /v1/notifications 失败时出现',
  },
  'I.group-list': {
    label: '通知分组列表',
    clauses: ['U09-C06', 'U09-C15'],
    note: '按 kind 分两组渲染，空组隐藏',
    when: '有通知时出现',
  },
  'I.group': {
    label: '通知分组',
    clauses: ['U09-C15', 'U09-C06'],
    note: '「PVP / 锦标赛」恒在前、「PVE / 系统」恒在后（#53 优先级）',
  },
  'I.group-title': {
    label: '分组标题',
    clauses: ['U09-C15'],
    note:
      'challenged / automatch_result / tournament_round / tournament_invite → PVP 组；其余（含未知 kind）→ PVE/系统',
  },
  'I.empty': {
    label: '暂无通知空态',
    clauses: ['U09-C16', 'LACK-10'],
    note: '零通知账号「暂无通知。」，且无操作按钮、铃铛无未读点',
    when: '通知列表为空或已清除后出现',
  },
  'I.notification-row': {
    label: '通知行',
    clauses: ['U09-C02', 'U09-C07', 'U13-C06'],
    journeys: ['jR3s2', 'j6s3'],
    note:
      '服务端持久：登出登入原样在列、读态不回退；标已读后就地变已读样式（乐观更新，不整页重载）',
  },
  'I.unread-dot': {
    label: '未读点',
    clauses: ['U09-C03'],
    journeys: ['jR3s2', 'jR3s3'],
    note: '未读＝红点、已读＝灰点；全部已读后所有红点即时熄灭',
  },
  'I.kind-badge': {
    label: '通知类别徽章',
    clauses: ['U09-C15', 'U09-C07', 'U09-C08', 'U09-C12', 'U13-C06', 'LACK-05'],
    journeys: ['j6s3'],
    note:
      '#53 八类的中文标签：对战结束 / 被约战 / 自动匹配结果 / 锦标赛进程 / 锦标赛资格 / 门槛达成 / 参赛版本提醒 / 系统公告；未知 kind 原样显示。PVP 组红、PVE 组蓝。③⑤⑧ 线上无发射器、⑦ 未实现（LACK-05）；不可测的四类（③ U09-C09 自动匹配 · ⑤ U09-C11 锦标赛资格 · ⑦ U09-C13 参赛版本提醒 · ⑧ U09-C14 系统公告）线上无发射器，不挂在这里',
  },
  'I.notification-title': {
    label: '通知标题',
    clauses: ['U09-C07', 'U09-C12', 'U13-C06', 'U13-C07'],
    note:
      '服务端渲染的 title（如「你的对局已出结果」「🎉 双侧试炼完成，约战已解锁」「锦标赛已结束」），客户端只展示',
    when: '服务端给了 title 时出现；老服务器只有类别徽章',
  },
  'I.notification-body': {
    label: '通知正文',
    clauses: ['U09-C07', 'U09-C12'],
    when: '服务端给了 body 时出现',
  },
  'I.detail-link': {
    label: '查看详情链接',
    clauses: ['U09-C04', 'U09-C07', 'U09-C12', 'U09-C08'],
    journeys: ['j10s1'],
    note:
      '深链：服务端 link 优先（/matches/N 战报、/scenarios/x 场景页、约战第 ① 场），老服务器回落「查看对战 #id」；点击顺手标已读',
    when: '通知带 link 或 matchID 时出现',
  },
  'I.mark-read-button': {
    label: '标为已读按钮',
    clauses: ['U09-C06', 'U09-C03', 'U09-C02'],
    journeys: ['jR3s2', 'jR3s4'],
    note: '逐条乐观置已读，未读数递减，页面不跳顶；失败撤销并提示',
    when: '仅未读行显示',
  },

  // ======================= K · 设置（/settings） =======================
  'K.page-title': {
    label: '账户页标题',
    clauses: ['U12-C01'],
    note: '设置页标题是「账户」（e2e heading 用此定位）',
  },
  'K.profile-card': {
    label: '个人资料卡',
    clauses: ['U12-C01', 'U12-C04', 'U12-C05'],
    journeys: ['j10s3'],
    note:
      '昵称（可编辑 #85）· 邮箱（只读）· 角色（只读）三行；B6 列明的「邀请码状态」「通知偏好」区块缺席（U12-C07/C08）',
  },
  'K.nickname-row': {
    label: '昵称行',
    clauses: ['U12-C01', 'U12-C03'],
    journeys: ['j10s3'],
    note: '显示当前昵称 + 「编辑」入口；编辑态换成就地表单',
  },
  'K.nickname-value': {
    label: '当前昵称',
    clauses: ['U12-C03', 'U12-C01'],
    journeys: ['j10s3'],
    note: '保存后立即显示新昵称，顶栏同步（全站即时同步 #85）',
    when: '非编辑态显示',
  },
  'K.nickname-edit-button': {
    label: '编辑昵称按钮',
    clauses: ['U12-C01'],
    journeys: ['j10s3'],
  },
  'K.nickname-form': {
    label: '昵称编辑表单',
    clauses: ['U12-C02', 'U12-C03'],
    journeys: ['j10s3'],
    when: '点「编辑」后出现',
  },
  'K.nickname-input': {
    label: '昵称输入框',
    clauses: ['U12-C02'],
    journeys: ['j10s3'],
    note: 'maxLength 50（上限）；aria-label「昵称」',
    when: '编辑态',
  },
  'K.nickname-save-button': {
    label: '保存昵称按钮',
    clauses: ['U12-C02', 'U12-C03'],
    journeys: ['j10s3'],
    note: '空昵称（下限 1）或未改动时禁用；保存中显示「保存中…」',
    when: '编辑态',
  },
  'K.nickname-cancel-button': {
    label: '取消编辑按钮',
    clauses: ['U12-C02'],
    note: '放弃草稿回到只读态（e2e U12-C02 用它收尾）',
    when: '编辑态',
  },
  'K.nickname-saved-notice': {
    label: '昵称已保存提示',
    clauses: ['U12-C03'],
    journeys: ['j10s3'],
    when: '保存成功后出现在昵称旁',
  },
  'K.nickname-error': {
    label: '昵称保存错误',
    clauses: ['U12-C02', 'LACK-10'],
    note: '服务端拒绝（长度/节流等）的账户类文案',
    when: '保存失败时出现',
  },
  'K.email-row': {
    label: '邮箱行',
    clauses: ['U12-C04'],
    note: '纯文本只读，无输入框；邮箱仅作登录名（无邮件通知渠道 #43）',
  },
  'K.role-row': {
    label: '角色行',
    clauses: ['U12-C05'],
    note: '只读无输入框',
  },
  'K.role-badge': {
    label: '角色徽章',
    clauses: ['U12-C05', 'U12-C06'],
    note: '玩家＝「选手」（蓝），管理员＝「管理员」（黄）；同一 id 两种分支',
  },
  'K.password-card': {
    label: '修改密码卡',
    clauses: ['U12-C13', 'U12-C14', 'U12-C15'],
    journeys: ['j10s4'],
    note: '#86：三输入（当前/新/确认新）+ 提交',
  },
  'K.password-form': {
    label: '修改密码表单',
    clauses: ['U12-C13', 'U12-C14', 'U12-C15'],
    journeys: ['j10s4'],
    note: '客户端先挡两类必错提交（不一致 / <8 位），当前密码错留给服务端裁决',
  },
  'K.current-password-input': {
    label: '当前密码输入框',
    clauses: ['U12-C14'],
    journeys: ['j10s4'],
    note: '需验当前密码：填错 → 服务端拒绝「当前密码不正确」，密码不变',
  },
  'K.new-password-input': {
    label: '新密码输入框',
    clauses: ['U12-C13'],
    journeys: ['j10s4'],
    note: '≥8 位',
  },
  'K.confirm-password-input': {
    label: '确认新密码输入框',
    clauses: ['U12-C13'],
    journeys: ['j10s4'],
    note: '须与新密码一致',
  },
  'K.password-error': {
    label: '改密错误提示',
    clauses: ['U12-C13', 'U12-C14', 'LACK-10'],
    journeys: ['j10s4'],
    note:
      '「新密码至少 8 位」/「两次输入的新密码不一致」（客户端）/「当前密码不正确」（服务端）',
    when: '提交被挡或被拒时出现',
  },
  'K.password-done-notice': {
    label: '改密成功提示',
    clauses: ['U12-C15'],
    journeys: ['j10s4'],
    note: '「密码已修改，其他设备已退出登录」——其他会话失效、当前会话保留',
    when: '改密成功后出现，三输入清空',
  },
  'K.password-submit-button': {
    label: '修改密码按钮',
    clauses: ['U12-C13', 'U12-C14', 'U12-C15'],
    journeys: ['j10s4'],
    note: '三输入任一为空时禁用；提交中显示「提交中…」',
  },
  'K.elevate-card': {
    label: '管理员提权卡',
    clauses: ['U12-C06'],
    note: 'admin-gated：玩家账号不出现此卡',
    when: '仅管理员账号可见',
  },
  'K.elevate-status-badge': {
    label: '提权状态徽章',
    clauses: ['U12-C06'],
    note: '已提权（绿）/ 未提权（红）；同一 id 两种分支',
    when: '仅管理员账号可见',
  },
  'K.admin-link': {
    label: '进入管理面板链接',
    clauses: ['U12-C06', 'U11-C08'],
    note: '→ /admin；/admin 为管理员专属，非管理员导航必须被拒',
    when: '管理员且当前会话已提权时出现',
  },
  'K.elevate-form': {
    label: '提权表单',
    clauses: ['U12-C06'],
    when: '管理员且未提权时出现',
  },
  'K.totp-input': {
    label: '验证码输入框',
    clauses: ['U12-C06'],
    note: 'TOTP 验证码 / 恢复码，数字键盘',
    when: '管理员且未提权时出现',
  },
  'K.elevate-button': {
    label: '提权按钮',
    clauses: ['U12-C06'],
    note: '验证码为空时禁用；验证中显示「验证中…」',
    when: '管理员且未提权时出现',
  },
  'K.elevate-error': {
    label: '提权失败提示',
    clauses: ['U12-C06', 'LACK-10'],
    when: 'TOTP 验证失败时出现',
  },

  // ======================= L · 对战历史（/matches） =======================
  'L.page-title': {
    label: '历史页标题',
    clauses: ['U12-C09'],
    journeys: ['j10s2'],
    note: '标题「历史」（e2e heading 用此定位）；B8 导航里历史居最右',
  },
  'L.page-intro': {
    label: '历史页说明',
    clauses: ['U12-C09'],
    journeys: ['j10s2'],
    note:
      '公开模式（open=true）写「全部对战记录。」——测试期开关，显示全站对局；否则「你的全部对战记录。」',
  },
  'L.loading': {
    label: '历史加载中',
    clauses: ['LACK-10'],
    when: '首次进入 /matches 时短暂出现',
  },
  'L.error': {
    label: '历史列表错误',
    clauses: ['LACK-10'],
    when: 'GET /v1/matches 失败时出现',
  },
  'L.match-list': {
    label: '对战列表',
    clauses: ['U12-C09'],
    journeys: ['j10s2'],
    note:
      '一行一场；成对约战（#66）并成一组；不含「进行中的对战」条（U05-C09：历史页恒不出现）',
    when: '有对局时出现',
  },
  'L.match-card': {
    label: '对战行',
    clauses: ['U12-C10', 'U12-C09'],
    journeys: ['j10s2', 'jR7s5'],
    note: '整行是链接 → /matches/:id 战报（行点开 → 战报）',
  },
  'L.match-id': {
    label: '对战编号',
    clauses: ['U12-C09'],
    note: '「对战 #id」',
  },
  'L.match-meta': {
    label: '场景与类型',
    clauses: ['U12-C09'],
    note: '「场景标题 · PVE/PVP」',
  },
  'L.challenge-leg': {
    label: '约战腿标',
    clauses: ['U05-C11'],
    journeys: ['jR7s3'],
    note: 'F7 · #66：约战①/② 标出这是成对约战里的第几场',
    when: '仅约战产生的对局显示',
  },
  'L.status-badge': {
    label: '对战状态徽章',
    clauses: ['U12-C09'],
    anchors: ['spec-change-69'],
    journeys: ['jR7s5'],
    note:
      '排队中 / 进行中 / 判定中 / 带视角的结果（我方（商鞅）胜 · 对方（甘龙）胜 · 旁观「胜方 商鞅」）——#69 一眼知胜负；旁观对局不得错标「我方」',
  },
  'L.pair-group': {
    label: '成对约战组',
    clauses: ['U05-C11'],
    journeys: ['jR7s3'],
    note: '#66：相邻同 challengeID 的两腿并成一组挂在成对表头下',
    when: '列表里有成对约战的两腿相邻时出现',
  },
  'L.pair-header': {
    label: '成对约战表头',
    clauses: ['U05-C11'],
    journeys: ['jR7s3'],
    note: '「约战 #id」；两腿都判完时并排写清两场结果',
    when: '同成对约战组',
  },
  'L.empty': {
    label: '暂无对战空态',
    clauses: ['U12-C09', 'LACK-10'],
    note:
      '「还没有任何对战。到场景页构建智能体并发起对战。」；公开模式与私有模式文案略异',
    when: '列表为空时出现',
  },
}

export const STEPS_PERIPHERY: StepHints = {
  // r1:9 锦标赛
  j9s1: { route: '/tournaments', marker: 'G.tournament-list' },
  j9s2: { route: '/tournaments/:id', marker: 'G.standings-table' },
  j9s3: { route: '/tournaments', marker: 'G.phase-badge' },
  // j9s4（试炼关闭提示）在 OS 面板里，由 discovery 组登记
  // r1:10 通知、历史、设置
  j10s1: { route: '/notifications', marker: 'I.detail-link' },
  j10s2: { route: '/matches', marker: 'L.match-card' },
  j10s3: { route: '/settings', marker: 'K.nickname-row' },
  j10s4: { route: '/settings', marker: 'K.password-form' },
  // r2:R3 标已读不跳顶
  jR3s1: { route: '/notifications', marker: 'I.action-bar' },
  jR3s2: { route: '/notifications', marker: 'I.mark-read-button' },
  jR3s3: { route: '/notifications', marker: 'I.read-all-button' },
  jR3s4: { route: '/notifications', marker: 'I.actions' },
  // r1:6 第 3 步：B 账号在通知页看「被约战」
  j6s3: { route: '/notifications', marker: 'I.notification-row' },
  // r2:R7 第 3 步：历史页成对表头
  jR7s3: { route: '/matches', marker: 'L.pair-group' },
  // jR7s5（从历史页打开旁观对局）的验收点在战报页，route/marker 由 FA 组登记；本组只在 L.match-card / L.status-badge 上挂 journeys
}
