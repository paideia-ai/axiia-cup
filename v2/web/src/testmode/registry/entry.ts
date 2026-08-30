/* 入口与导航组：A 首页（/）· B 登录（/login）· C 注册（/register）· NAV 顶栏/底栏/铃铛/页脚（AppShell，登录态全站）
   · ADM 管理面（/admin、/admin/slots/:id）。条款以 spec-index 里 page ∈ {A, B+C, B/C, C, 全局, 运营} 与 U08 单元为准；
   「进行中的对战」条（BattleStrip）归 OS 组（OS.battle-strip），本组不登记。 */
import type { StepHints, TmRegistry } from '../types'

export const TM_ENTRY: TmRegistry = {
  // ======================= A 首页（公开落地页） =======================
  'A.header': {
    label: '首页顶栏',
    clauses: ['U08-C02'],
    note: '未登录：登录 + 注册；已登录：进入场景。这是 B1 主行动的第二处入口',
  },
  'A.logo': {
    label: '首页 logo',
    note: 'AXIIA CUP 字标，回首页；规格无条文',
  },
  'A.session-restoring': {
    label: '恢复会话提示',
    when: '刚打开首页、还在判断是否已登录的一瞬间',
    note: '「正在恢复会话...」；规格无条文',
  },
  'A.header-enter-button': {
    label: '顶栏进入场景按钮',
    when: '已登录时代替 登录/注册 出现',
    note: '已登录用户打开首页的去处（/scenarios）；规格无条文',
  },
  'A.header-login-link': {
    label: '顶栏登录链接',
    clauses: ['U08-C02'],
  },
  'A.header-register-button': {
    label: '顶栏注册按钮',
    clauses: ['U08-C02'],
  },
  'A.pitch': {
    label: '首页主视觉区',
    clauses: ['U08-C01'],
    journeys: ['j1s1'],
    note:
      '营销 hero + 主行动；审计观察（U08-C01）指出首页曾只有这一段而缺 B1 四项内容，四项现在在下方「落地数据区」',
  },
  'A.season-badge': {
    label: '赛季徽章',
    note: '「第一赛季报名中」；规格无条文',
  },
  'A.tagline': {
    label: '首页大标题',
    note: '「用提示词打造最强对话智能体」；规格无条文',
  },
  'A.pitch-intro': {
    label: '首页一句话介绍',
    clauses: ['U08-C01'],
    journeys: ['j1s1'],
    note: '旅程 1 第 1 步「这个产品是干什么的一目了然」落在这句',
  },
  'A.cta-enter': {
    label: '进入场景主按钮',
    when: '已登录时代替 立即注册/登录 出现',
    note: '规格无条文',
  },
  'A.cta-register': {
    label: '立即注册主按钮',
    clauses: ['U08-C02'],
    journeys: ['j1s1', 'j1s2'],
    note: 'B1 主行动＝进入注册/登录；主色按钮',
  },
  'A.cta-login': {
    label: '已有账户登录按钮',
    clauses: ['U08-C02'],
    journeys: ['j1s1'],
  },
  'A.how-it-works': {
    label: '玩法三卡',
    note:
      '01 编写提示词 / 02 自动对战 / 03 排行竞技 三张营销卡；不是 B1 要求的内容，规格无条文（02 卡里的「完成后通知你」是全站唯一一处，见 U09-C05 观察）',
  },
  'A.how-it-works-card': {
    label: '玩法卡',
    note: '三张卡共用一个标记；规格无条文',
  },
  'A.landing-data': {
    label: '落地数据区',
    clauses: ['U08-C01'],
    anchors: ['spec-b1'],
    journeys: ['j1s1'],
    when: '免鉴权 GET /v1/landing 成功才整段渲染；接口失败整段不出现',
    note: 'B1 四项：真实对局节选 / 示范对局 / 顶尖玩家 / 总对战数',
  },
  'A.excerpt': {
    label: '真实对局节选',
    clauses: ['U08-C01'],
    journeys: ['j1s1'],
    when: '后端有可节选的对局才出现',
    note:
      '每条发言（说话人 + 文本）与「节选自《场景》· 对局 #id」出处都在这一块里',
  },
  'A.demo-matches': {
    label: '示范对局列表',
    clauses: ['U08-C01'],
    journeys: ['j1s1'],
    when: '白名单示范对局 ≥ 1 才出现',
  },
  'A.demo-match-link': {
    label: '示范对局链接',
    clauses: ['U08-C01', 'LACK-03'],
    note: '公开页直接链到 /matches/:id；未登录能否看战报（LACK-03）规格未定义',
  },
  'A.top-players': {
    label: '顶尖玩家榜',
    clauses: ['U08-C01'],
    journeys: ['j1s1'],
    when: '有计分胜场的玩家才出现',
  },
  'A.top-player-row': {
    label: '顶尖玩家行',
    clauses: ['U08-C01'],
    note: '名次 · 昵称 · N 胜',
  },
  'A.total-battles': {
    label: '总对战数区块',
    clauses: ['U08-C01'],
    journeys: ['j1s1'],
  },
  'A.total-battles-count': {
    label: '总对战数数字',
    clauses: ['U08-C01'],
    note: 'e2e testid landing-total-battles',
  },
  'A.total-battles-caption': {
    label: '总对战数说明',
    clauses: ['U08-C01'],
    note: '「已完成并计分的对局」——失败局不计（见 LACK-10 观察）',
  },
  'A.footer': {
    label: '首页页脚',
    clauses: ['U08-C12', 'U11-C11'],
    note: '只有备案号；无说明书/帮助类条目',
  },

  // ======================= B 登录 =======================
  'B.page-title': {
    label: '登录页标题',
    note: '规格无条文',
  },
  'B.form': {
    label: '登录表单',
    clauses: ['U08-C06', 'U08-C07', 'LACK-07'],
    note: '邮箱 + 密码；登录节流 / cookie 期限 / 手机号登录（LACK-07）规格未写',
  },
  'B.email-input': {
    label: '邮箱输入框',
    clauses: ['U08-C06', 'U08-C03', 'LACK-07'],
    note: 'B2「邮箱登录（手机号近上线再加）」',
  },
  'B.password-input': {
    label: '密码输入框',
    clauses: ['U08-C06', 'U08-C07'],
  },
  'B.error': {
    label: '登录错误提示',
    clauses: ['U08-C07', 'LACK-10'],
    when: '邮箱或密码错误、提交失败后出现',
    note: '红字为后端英文原文「email or password is incorrect」（观察项）',
  },
  'B.submit-button': {
    label: '登录按钮',
    clauses: ['U08-C06', 'U08-C07'],
    note: '成功落 /scenarios；提交中显示「登录中…」',
  },
  'B.register-link': {
    label: '去注册链接',
    note: '登录页 ↔ 注册页互链；规格无条文',
  },

  // ======================= C 注册 =======================
  'C.page-title': {
    label: '注册页标题',
    note: '规格无条文',
  },
  'C.form': {
    label: '注册表单',
    clauses: ['U08-C03', 'U08-C04', 'U13-C01'],
    journeys: ['j1s2'],
    note: '恰四项：注册码 / 昵称 / 邮箱 / 密码，无手机号',
  },
  'C.code-input': {
    label: '注册码输入框',
    clauses: ['U08-C03', 'U08-C05', 'U11-C10'],
    note: '邀请码 alpha 阶段必填；无效码被拒（U08-C05）',
  },
  'C.code-hint': {
    label: '注册码来源提示',
    note: '「从群聊或活动页面获取」；规格无条文',
  },
  'C.display-name-input': {
    label: '昵称输入框',
    clauses: ['U08-C03'],
  },
  'C.email-input': {
    label: '邮箱输入框',
    clauses: ['U08-C03', 'LACK-07'],
    note: '邮箱即登录名；手机号字段规格说「近上线再加」',
  },
  'C.password-input': {
    label: '密码输入框',
    clauses: ['U08-C03', 'LACK-07'],
    note:
      '占位「至少 8 位」，但注册接口接受 5 位——#86「≥8」只在改密生效（LACK-07 观察）',
  },
  'C.error': {
    label: '注册错误提示',
    clauses: ['U08-C05', 'LACK-10'],
    when: '注册码无效（403）或其他提交失败后出现',
    note: '红字为后端英文原文「registration code unavailable」（观察项）',
  },
  'C.submit-button': {
    label: '创建账户按钮',
    clauses: ['U08-C04', 'U08-C05', 'U03-C01', 'U13-C01'],
    journeys: ['j1s2'],
    note: '成功即自动登录；未打首战落 /express，否则 /scenarios',
  },
  'C.login-link': {
    label: '去登录链接',
    note: '规格无条文',
  },

  // ======================= NAV 全局导航（AppShell） =======================
  'NAV.header': {
    label: '顶栏',
    clauses: ['U08-C08', 'U08-C11', 'U08-C12'],
    journeys: ['j11s1', 'j12s3'],
    note:
      '#72 降噪：h-12，logo + 四 tab + 铃铛 + 设置 + 退出，无对战条、无说明书类条目',
  },
  'NAV.logo': {
    label: '顶栏 logo',
    note: 'AXIIA CUP 字标 → /scenarios；规格无条文',
  },
  'NAV.desktop-nav': {
    label: '桌面一级导航',
    clauses: ['U08-C08', 'U08-C09'],
    journeys: ['j11s1'],
    note: '场景 / 我的智能体 / 排名 / 历史，历史居最右（#73/#74）；md 以上显示',
  },
  'NAV.nav-link': {
    label: '导航项',
    clauses: ['U08-C08', 'U11-C08'],
    note:
      '四项共用一个标记；管理员多一项「管理面板」（U11-C08：规格导航表无管理入口，/admin 管理员专属）；激活态只变字色（#72）',
  },
  'NAV.settings-link': {
    label: '设置入口',
    clauses: ['U08-C08', 'U12-C03'],
    note: '显示当前昵称 → /settings；改昵称后此处即时同步',
  },
  'NAV.logout-button': {
    label: '退出按钮',
    note: '退出后回首页 /；退出/会话结束规格无条文（LACK-07 只列登录侧）',
  },
  'NAV.footer': {
    label: '登录态页脚',
    clauses: ['U11-C11', 'LACK-15', 'U08-C12'],
    note: '桌面才显示：备案号 + build SHA；无 ToS/隐私页',
  },
  'NAV.build-sha': {
    label: 'build 版本',
    clauses: ['LACK-15'],
    note:
      '「build <sha>」——目前唯一的「被测版本」线索，规格未要求；测试模式写看板时用它作 build.web',
  },
  'NAV.mobile-nav': {
    label: '移动底栏',
    clauses: ['U08-C09', 'LACK-12'],
    journeys: ['j11s2'],
    note:
      'md 以下固定底栏，与桌面同一份清单；移动端/无障碍规格只有一句（LACK-12）',
  },
  'NAV.mobile-nav-link': {
    label: '底栏导航项',
    clauses: ['U08-C09'],
    note: '共用一个标记；激活态变主色',
  },
  'NAV.bell': {
    label: '通知铃铛',
    clauses: ['U08-C10', 'U09-C01', 'U13-C06'],
    journeys: ['j10s1', 'jR3s3'],
    note: '登录态处处可见（含移动端）→ /notifications；alpha 只做站内通知',
  },
  'NAV.bell-unread-dot': {
    label: '铃铛未读圆点',
    clauses: ['U08-C10', 'U08-C11', 'U13-C06'],
    journeys: ['j10s1', 'jR3s3'],
    when: '有未读通知时出现',
    note: '#72 降噪：数字角标改小圆点，数量进 aria-label「N 条未读」',
  },
  'NAV.icp-record': {
    label: '备案信息',
    clauses: ['U11-C11', 'LACK-15'],
    note: '首页 / 登录 / 注册 / 登录态页脚四处复用同一组件',
  },
  'NAV.icp-link': {
    label: '备案号链接',
    clauses: ['U11-C11', 'LACK-15'],
    note:
      '全站唯一 target=_blank 外链（U07-C12 观察）；全站唯一 target=_blank 外链（U07-C12 观察，不算体现）',
  },

  // ======================= ADM 管理面（/admin） =======================
  'ADM.page-title': {
    label: '管理面板标题',
    clauses: ['LACK-04', 'U12-C11'],
    note: '规格 #44 说「一切走文件 + CLI，无后台 UI」，现实相反（LACK-04）',
  },
  'ADM.elevation-notice': {
    label: '需要提权提示',
    clauses: ['LACK-04'],
    when:
      '管理员登录但尚未在设置页输入 TOTP 时出现（/admin 与 /admin/slots/:id 同一提示）',
    note: '谁能操作 / 提权时效 规格零条文',
  },
  'ADM.elevation-settings-link': {
    label: '去账户设置链接',
    clauses: ['LACK-04'],
    note: '→ /settings 输入 TOTP',
  },
  'ADM.slots-card': {
    label: '场景槽位卡',
    clauses: ['LACK-11', 'LACK-04'],
    note: '哪个场景在线、哪个脚本生效——只能在这里看到，仓库里读不到（LACK-11）',
  },
  'ADM.slots-loading': {
    label: '槽位加载中',
    clauses: ['LACK-10'],
    when: '槽位列表首次加载时',
  },
  'ADM.slots-error': {
    label: '槽位加载失败',
    clauses: ['LACK-10'],
    when: 'GET 槽位接口失败时',
  },
  'ADM.slots-empty': {
    label: '槽位空态',
    clauses: ['LACK-10'],
    when: '没有任何槽位时',
  },
  'ADM.slots-table': {
    label: '槽位表格',
    clauses: ['LACK-11'],
    note: 'ID / 标题 / 状态 / 脚本 SHA 前 12 位',
  },
  'ADM.slot-row': {
    label: '槽位行',
    clauses: ['LACK-11'],
  },
  'ADM.slot-link': {
    label: '槽位详情链接',
    clauses: ['LACK-11', 'U11-C09'],
    note: '→ /admin/slots/:id（管理员专属）',
  },
  'ADM.slot-status-badge': {
    label: '槽位状态徽章',
    clauses: ['LACK-11'],
    note: 'live / draft / retired 生命周期无条文',
  },
  'ADM.slot-script-sha': {
    label: '槽位脚本 SHA',
    clauses: ['LACK-11'],
    note: '脚本按内容寻址',
  },
  'ADM.registration-code-card': {
    label: '注册码卡',
    clauses: ['U11-C10', 'LACK-04'],
    note: '邀请码 alpha 的发码处',
  },
  'ADM.registration-code-input': {
    label: '注册码输入框',
    clauses: ['U11-C10'],
  },
  'ADM.registration-code-uses-input': {
    label: '可用次数输入框',
    clauses: ['U11-C10', 'LACK-04'],
    note: '次数用尽后的行为规格未写',
  },
  'ADM.registration-code-create-button': {
    label: '创建注册码按钮',
    clauses: ['U11-C10', 'LACK-04'],
    note: '注册码为空时禁用',
  },
  'ADM.registration-code-notice': {
    label: '注册码已创建',
    clauses: ['LACK-04'],
    when: '创建成功后出现',
  },
  'ADM.registration-code-error': {
    label: '注册码创建失败',
    clauses: ['LACK-04', 'LACK-10'],
    when: '创建失败（如重复）后出现',
  },

  // ======================= ADM 槽位详情（/admin/slots/:id） =======================
  'ADM.slot-back-link': {
    label: '返回管理面板',
    note: '规格无条文',
  },
  'ADM.slot-page-title': {
    label: '槽位页标题',
    clauses: ['LACK-11', 'U11-C09'],
    note: '槽位标题（未加载到时显示 id）',
  },
  'ADM.slot-loading': {
    label: '槽位详情加载中',
    clauses: ['LACK-10'],
    when: '首次加载时',
  },
  'ADM.slot-error': {
    label: '槽位详情加载失败',
    clauses: ['LACK-10'],
    when: '接口失败时',
  },
  'ADM.slot-missing': {
    label: '槽位不存在',
    clauses: ['LACK-10'],
    when: 'URL 里的槽位 id 不在列表里',
  },
  'ADM.slot-editor': {
    label: '槽位设置卡',
    clauses: ['LACK-11', 'LACK-08', 'U12-C11'],
    journeys: ['j12s2'],
    note:
      '标题 / 状态 / 脚本 SHA / params——这是规格说不该有的「后台配置界面」（管理员专属）',
  },
  'ADM.slot-title-input': {
    label: '槽位标题输入框',
    clauses: ['LACK-11'],
  },
  'ADM.slot-status-select': {
    label: '槽位状态选择',
    clauses: ['LACK-11'],
    note: 'live / draft / retired；上线/下线/回滚规格无条文',
  },
  'ADM.slot-script-sha-input': {
    label: '脚本 SHA 框',
    clauses: ['LACK-11'],
    note: '手改指向哪个脚本版本',
  },
  'ADM.slot-params-input': {
    label: '参数输入框',
    clauses: ['LACK-08', 'LACK-11', 'U12-C11'],
    note:
      'presets 覆盖脚本自带对手名单——§C2「PVE-NPC 默认 2」vs 十余 preset 的真源（LACK-08）',
  },
  'ADM.slot-params-error': {
    label: '参数校验错误',
    clauses: ['LACK-08', 'LACK-10'],
    when: 'params 不是合法 JSON 对象时出现，并禁用保存',
  },
  'ADM.slot-save-button': {
    label: '保存槽位按钮',
    clauses: ['LACK-11'],
  },
  'ADM.slot-save-notice': {
    label: '槽位保存成功提示',
    clauses: ['LACK-11'],
    when: '保存成功后出现「已保存」',
  },
  'ADM.slot-save-error': {
    label: '槽位保存失败提示',
    clauses: ['LACK-11', 'LACK-10'],
    when: '保存失败后出现',
  },
  'ADM.script-card': {
    label: '脚本卡',
    clauses: ['LACK-11'],
    note: '展示当前 SHA 的脚本源码（源码视图本身是 ADM.slot-script-view）',
  },
  'ADM.script-sha': {
    label: '脚本完整 SHA',
    clauses: ['LACK-11'],
  },
  'ADM.script-loading': {
    label: '脚本加载中',
    clauses: ['LACK-10'],
    when: '脚本源码加载时',
  },
  'ADM.script-error': {
    label: '脚本加载失败',
    clauses: ['LACK-10'],
    when: '脚本接口失败时',
  },
  'ADM.script-edit-button': {
    label: '编辑脚本按钮',
    clauses: ['LACK-11'],
    note: '点开后出现编辑框；脚本未加载时禁用',
  },
  'ADM.script-draft-input': {
    label: '脚本编辑框',
    clauses: ['LACK-11'],
    when: '点「编辑并上传新版本」后出现',
  },
  'ADM.script-upload-button': {
    label: '上传并指向按钮',
    clauses: ['LACK-11'],
    when: '编辑框打开时出现',
    note:
      '新建脚本（内容寻址得新 SHA）并把本槽位指过去；push 是否自动 retire 旧脚本无条文',
  },
  'ADM.script-cancel-button': {
    label: '取消编辑按钮',
    when: '编辑框打开时出现',
    note: '规格无条文',
  },
  'ADM.script-notice': {
    label: '脚本上传成功提示',
    clauses: ['LACK-11'],
    when: '上传成功后出现「已上传并指向 <sha>」',
  },
  'ADM.script-error-notice': {
    label: '脚本上传失败提示',
    clauses: ['LACK-11', 'LACK-10'],
    when: '上传失败后出现',
  },
}

export const STEPS_ENTRY: StepHints = {
  // 第一轮旅程 1：首页 / 注册
  j1s1: { route: '/', marker: 'A.landing-data' },
  j1s2: { route: '/register', marker: 'C.form' },
  // 第一轮旅程 10 第 1 步落在铃铛（通知页本身归 I 组）
  j10s1: { route: '/my-agents', marker: 'NAV.bell' },
  // 第一轮旅程 11：导航与全局（j11s3 对战条归 OS 组）
  j11s1: { route: '/scenarios', marker: 'NAV.desktop-nav' },
  j11s2: { route: '/scenarios', marker: 'NAV.mobile-nav' },
  // 第一轮旅程 12：边界检查（全站巡检，只给起点页面）
  j12s1: { route: '/agents/:id/build', marker: 'E.workspace-card' },
  // j12s2「有没有配置系统参数的页面」——管理面的槽位设置卡就是那个「不该有的后台界面」（管理员专属）
  j12s2: { route: '/admin/slots/:id', marker: 'ADM.slot-editor' },
  j12s3: { route: '/scenarios', marker: 'NAV.header' },
}
