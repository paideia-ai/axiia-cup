# 贴码与验收规范

从本活动目录执行命令。依赖清单见[requirements.txt](../tools/requirements.txt)。

## 生成独立二维码

当前 QR 采用 M 纠错、四模块静区。PNG 和 SVG 可重新生成到新的输出路径：

```sh
python tools/make_qr.py --png /tmp/invite-axiia-cup.png --svg /tmp/invite-axiia-cup.svg
```

默认链接读取 [manifest.json](../manifest.json)。更换链接时可显式传入 `--url`；生成后根据实际模块总数重新计算贴码尺寸并保存布局配置。

## 贴入二维码

```sh
python tools/paste_qr.py assets/base/01-shangyang.png /tmp/shangyang.png
python tools/paste_qr.py assets/base/02-westward.png /tmp/westward.png
python tools/paste_qr.py assets/base/05-dongzhuo-lvbu.png /tmp/dongzhuo-lvbu.png --layout layouts/landscape.json
```

脚本检查画布和留白，最近邻缩放真实二维码，并只在配置矩形内粘贴。已有输出文件会被拒绝，避免覆盖。

当前竖版 QR 为164×164，每模块4像素；横版为205×205，每模块5像素。四周静区分别保留16和20像素。

## 自动验证

```sh
python tools/verify_assets.py
python tools/verify_assets.py --report /tmp/winter-beta-validation.json
```

验证内容：

- 文件存在、尺寸及SHA-256与资产清单一致。
- 当前二维码解码为带邀请码的目标链接。
- 将真实二维码重新贴入底图后，像素与成品完全一致。
- 成品原尺寸、474像素宽缩图、JPEG质量85压缩均可识别。
- Markdown内的本地图片、文件链接存在。

## 人工验收与交付

检查主题人物、气泡归属和台词；第五张的貂蝉保持安静旁观。逐字核对日期、活动文案与细高字形，确认二维码未遮挡文字。

交付RGB无损PNG，同时保存无二维码底图、提示词和布局。当前验证记录见[validation.json](../validation.json)。网页自动预填邀请码的验收单独进行，参见[前端交接说明](../registration-invite-handoff.md)。
