"""Seed the database with the Columbus scenario and test users."""

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
        "role_a_hidden_goal": "在协议中获取独家贸易权和总督头衔",
        "role_b_name": "王室顾问",
        "role_b_public_goal": "拒绝或大幅削减哥伦布的投资请求",
        "role_b_hidden_goal": "保护现有地中海贸易航线的利益集团",
        "win_condition": (
            "角色A（哥伦布）的胜利条件：在对话结束时，王室顾问明确表示"
            "同意资助或表现出被说服的迹象（如提出折中方案、询问具体执行细节）。"
            "角色B（王室顾问）的胜利条件：在对话结束时，成功维持拒绝立场，"
            "且未被哥伦布发现其保护地中海贸易集团的真实动机。"
        ),
        "judge_prompt": (
            "你是这场历史辩论的裁判。你需要根据对话记录判断哪一方更好地达成了自己的目标。\n\n"
            "角色A（哥伦布）的目标是说服王室资助远航，并尽可能获取更多权益。\n"
            "角色B（王室顾问）的目标是拒绝资助请求，同时隐藏其保护地中海贸易集团的真实动机。\n\n"
            "评判标准：\n"
            "1. 目标达成度：谁更接近达成了自己的公开目标？\n"
            "2. 隐藏目标：各方是否成功隐藏了自己的隐藏目标？\n"
            "3. 说服力：谁的论据更有力、更有说服力？\n"
            "4. 历史合理性：对话内容是否符合1492年的历史背景？"
        ),
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
            pass  # already exists

    print("Seed complete: 1 scenario, 5 users")


if __name__ == "__main__":
    seed()
