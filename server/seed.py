"""Seed the database with the Columbus scenario and test users."""

import json
from server import db


def seed():
    db.init_db()

    # ─── Scenario: Columbus & The Royal Court ───
    db.create_scenario({
        "id": "columbus",
        "title": "哥伦布与王室",
        "context": (
            "1492年，西班牙。克里斯托弗·哥伦布正在向西班牙王室请求资助，"
            "希望向西航行找到通往印度的新航线。王室刚结束对格拉纳达的战争，"
            "国库紧张。葡萄牙已通过东方航线取得丰厚回报。"
        ),
        "role_a_name": "哥伦布",
        "role_a_public_goal": "说服王室资助你的远航计划",
        "role_a_secrets": json.dumps([
            "在协议中获取独家贸易权和总督头衔",
            "确保航线发现后由自己家族世袭管理新领地",
            "获取新大陆金矿开采权的优先许可",
            "建立独立于王室的私人船队和贸易公司",
        ], ensure_ascii=False),
        "role_b_name": "王室顾问",
        "role_b_public_goal": "拒绝或大幅削减哥伦布的投资请求",
        "role_b_secrets": json.dumps([
            "保护现有地中海贸易航线的利益集团",
            "将远航资金转投北非军事扩张计划",
            "为王室与热那亚银行的秘密债务争取还款时间",
            "阻止航海发现打破教廷对异教地区的管辖权主张",
        ], ensure_ascii=False),
        "win_condition": (
            "胜利判定基于两个客观指标：\n"
            "1. 秘密保护：对方未能猜中你的隐藏目标 (+1分)\n"
            "2. 秘密发现：你成功猜中对方的隐藏目标 (+1分)\n"
            "得分高者获胜，相同则平局。"
        ),
        "judge_prompt": "",
    })

    # ─── Test users ───
    users = [
        ("13800000001", "test_user_1", "林墨涵"),
        ("13800000002", "test_user_2", "张伟"),
        ("13800000003", "test_user_3", "陈宇欣"),
        ("13800000004", "test_user_4", "王思远"),
        ("13800000005", "test_user_5", "赵晨"),
    ]
    for phone, wechat, name in users:
        try:
            db.create_user(phone, wechat, name)
        except Exception:
            pass

    print("Seed complete: 1 scenario (4 secrets per role), 5 users")


if __name__ == "__main__":
    seed()
