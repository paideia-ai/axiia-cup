# 海报邀请码预填：前端交接

海报链接已经固定为：<https://axiia-cup.isofucius.cn/?invite=axiia_cup>。

目标流程是扫码进入首页，点击注册后，邮箱和手机号注册表单均已填入`axiia_cup`，且仍允许用户手动修改。

## 改动范围

当前接口具备邮箱注册的`code`和手机发验证码的`inviteCode`字段。预填功能主要在`v2/web`实现，后台需确认邀请码有效可用。

以下路径基于`11ecf6409069b7e2f52ec567549764f1e1b8d7aa`的检查；实施时读取最新主分支及AGENTS.md，先确认是否已有等效实现。

| 文件 | 目标 |
| --- | --- |
| `v2/web/src/pages/landing.tsx` | 顶部和主区域注册入口保留`invite`；登录入口也透传以支持后续转注册。 |
| `v2/web/src/pages/register.tsx` | 读取`location.search`，预填邮箱`code`，并向手机表单传初始邀请码。 |
| `v2/web/src/components/auth/phone-form.tsx` | 接收可选初始邀请码，只在`withInvite=true`时用于`inviteCode`；不能误填短信验证码`code`。 |
| `v2/web/src/pages/login.tsx` | “去注册”保留`invite`，注册页“去登录”也应保留。 |
| `v2/web/src/lib/`及相关测试 | 共用参数读取和链接生成逻辑，覆盖导航与请求体。 |

使用`URLSearchParams`解析和构建URL。带参数时预填；无参数或空值时保持原有手动填写。用户修改或清空输入后，不要反复覆盖。沿用现有`next`校验、`loginReturnPath`和`registrationReturnPath`，保留登录返回与新用户首战行为。

## 接口字段

- 邮箱：`POST /v1/auth/signup`，邀请码字段为`code`。
- 手机发码：`POST /v1/auth/sms/code`，字段为`inviteCode`。
- 手机后续验证继续现有流程，无需为本需求新增接口字段。

## 验收

从首页两个注册入口、直接注册URL、刷新页面、邮箱/手机号切换、登录/注册互相跳转分别验证。用MSW或现有fixture核对实际请求中的邀请码，并覆盖手动改码、无参数和带`next`的情况。

前端变更提供本地预览；按当前仓库要求执行格式、lint、类型检查、相关Storybook/导航测试和构建。发布后再在实际域名验证两种注册方式的预填值，并明确报告上线状态。无需为验证预填完成真实注册。
