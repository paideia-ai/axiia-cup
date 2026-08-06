#!/usr/bin/env python3
"""Fetch the pinned Wikisource passages used by this event-material corpus."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path


API_URL = "https://zh.wikisource.org/w/api.php"
USER_AGENT = "axiia-cup-event-material-fetcher/1.0 (source corpus; contact via repository)"
RETRIEVED_ON = "2026-07-24"
ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Source:
    output: str
    document_title: str
    category: str
    page_title: str
    revision_id: int
    revision_timestamp: str
    selection_note: str
    start_heading: str | None = None
    stop_headings: tuple[str, ...] = ()
    required_terms: tuple[str, ...] = ()

    @property
    def page_url(self) -> str:
        return "https://zh.wikisource.org/wiki/" + urllib.parse.quote(
            self.page_title, safe="/"
        )

    @property
    def revision_url(self) -> str:
        query = urllib.parse.urlencode(
            {"title": self.page_title, "oldid": self.revision_id}
        )
        return f"https://zh.wikisource.org/w/index.php?{query}"


SOURCES = (
    Source(
        output="正史/三国志-卷六-董卓.md",
        document_title="《三国志》卷六·董卓",
        category="正史（《三国志》为二十四史之一）",
        page_title="三國志/卷06",
        revision_id=2132349,
        revision_timestamp="2022-05-07T18:21:50Z",
        selection_note="节录“董卓”本传；保留裴松之注，止于李傕、郭汜附传之前。",
        start_heading="== 董卓 ==",
        stop_headings=("=== 李傕、郭汜 ===",),
        required_terms=("董卓", "呂布", "王允", "三年四月"),
    ),
    Source(
        output="正史/三国志-卷七-吕布.md",
        document_title="《三国志》卷七·吕布",
        category="正史（《三国志》为二十四史之一）",
        page_title="三國志/卷07",
        revision_id=2452141,
        revision_timestamp="2024-09-06T16:52:57Z",
        selection_note="节录“吕布”本传；保留裴松之注，止于张邈传之前。",
        start_heading="== 呂布 ==",
        stop_headings=("=== 張邈 ===",),
        required_terms=("呂布", "董卓", "侍婢私通", "王允"),
    ),
    Source(
        output="正史/后汉书-卷六十六-王允.md",
        document_title="《后汉书》卷六十六·王允",
        category="正史（《后汉书》为二十四史之一）",
        page_title="後漢書/卷66",
        revision_id=2405344,
        revision_timestamp="2024-05-09T15:39:12Z",
        selection_note="节录“王允”本传中谋诛董卓及其后续；止于王宏附传之前。",
        start_heading="== 王允 ==",
        stop_headings=("=== 王宏 ===",),
        required_terms=("王允", "董卓", "呂布", "士孫瑞"),
    ),
    Source(
        output="正史/后汉书-卷七十二-董卓.md",
        document_title="《后汉书》卷七十二·董卓列传",
        category="正史（《后汉书》为二十四史之一）",
        page_title="後漢書/卷72",
        revision_id=2676948,
        revision_timestamp="2026-03-26T00:35:59Z",
        selection_note="节录“董卓”本传，止于李傕、郭汜附传之前。",
        start_heading="== 董卓 ==",
        stop_headings=("== 李傕、郭汜 ==",),
        required_terms=("董卓", "呂布", "王允", "三年四月"),
    ),
    Source(
        output="正史/后汉书-卷七十五-吕布.md",
        document_title="《后汉书》卷七十五·吕布列传",
        category="正史（《后汉书》为二十四史之一）",
        page_title="後漢書/卷75",
        revision_id=5979054,
        revision_timestamp="2026-06-03T02:17:56Z",
        selection_note="节录“吕布”本传，止于卷末评语之前。",
        start_heading="== 呂布 ==",
        stop_headings=("== 評語 ==",),
        required_terms=("呂布", "董卓", "傅婢情通", "王允"),
    ),
    Source(
        output="文学/三国演义-第三回.md",
        document_title="《三国演义》第三回：议温明董卓叱丁原　馈金珠李肃说吕布",
        category="历史小说",
        page_title="三國演義/第003回",
        revision_id=2567965,
        revision_timestamp="2025-06-11T01:48:21Z",
        selection_note="全回；交代董卓入京、吕布杀丁原并投董卓，形成二人的义父子关系。",
        required_terms=("董卓", "呂布", "丁原", "赤兔"),
    ),
    Source(
        output="文学/三国演义-第八回.md",
        document_title="《三国演义》第八回：王司徒巧使连环计　董太师大闹凤仪亭",
        category="历史小说",
        page_title="三國演義/第008回",
        revision_id=5314829,
        revision_timestamp="2026-05-19T11:45:51Z",
        selection_note="全回；貂蝉登场，王允实施连环计，凤仪亭冲突发生。",
        required_terms=("董卓", "呂布", "貂蟬", "連環計", "鳳儀亭"),
    ),
    Source(
        output="文学/三国演义-第九回.md",
        document_title="《三国演义》第九回：除暴凶吕布助司徒　犯长安李傕听贾诩",
        category="历史小说",
        page_title="三國演義/第009回",
        revision_id=2567971,
        revision_timestamp="2025-06-11T01:48:23Z",
        selection_note="全回；承接凤仪亭冲突，写吕布倒向王允并杀董卓。",
        required_terms=("董卓", "呂布", "貂蟬", "王允"),
    ),
)


def fetch(source: Source) -> str:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "prop": "extracts|revisions",
            "explaintext": "1",
            "exsectionformat": "wiki",
            "rvprop": "ids|timestamp",
            "revids": str(source.revision_id),
            "format": "json",
            "formatversion": "2",
            "maxlag": "5",
        }
    )
    request = urllib.request.Request(
        f"{API_URL}?{params}", headers={"User-Agent": USER_AGENT}
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
            break
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 503) or attempt == 3:
                raise
            retry_after = int(exc.headers.get("Retry-After", 2 ** (attempt + 1)))
            time.sleep(min(retry_after, 15))
    page = payload["query"]["pages"][0]
    revision = page["revisions"][0]
    if revision["revid"] != source.revision_id:
        raise RuntimeError(
            f"{source.page_title}: expected revision {source.revision_id}, "
            f"got {revision['revid']}"
        )
    if revision["timestamp"] != source.revision_timestamp:
        raise RuntimeError(
            f"{source.page_title}: revision timestamp changed unexpectedly"
        )

    extract = page.get("extract", "").strip()
    if not extract:
        raise RuntimeError(f"{source.page_title}: Wikisource returned an empty extract")
    return extract


def select_passage(extract: str, source: Source) -> str:
    lines = extract.splitlines()
    start = 0
    if source.start_heading is not None:
        try:
            start = next(
                index
                for index, line in enumerate(lines)
                if line.strip() == source.start_heading
            )
        except StopIteration as exc:
            raise RuntimeError(
                f"{source.page_title}: missing start heading {source.start_heading!r}"
            ) from exc

    stop = len(lines)
    if source.stop_headings:
        candidates = [
            index
            for index, line in enumerate(lines[start + 1 :], start=start + 1)
            if line.strip() in source.stop_headings
        ]
        if not candidates:
            raise RuntimeError(
                f"{source.page_title}: missing stop heading from {source.stop_headings!r}"
            )
        stop = min(candidates)

    passage = "\n".join(lines[start:stop]).strip()
    for term in source.required_terms:
        if term not in passage:
            raise RuntimeError(
                f"{source.page_title}: selected passage is missing required term {term!r}"
            )
    return passage


HEADING_RE = re.compile(r"^(={2,6})\s*(.*?)\s*\1$")


def mediawiki_headings_to_markdown(text: str) -> str:
    converted: list[str] = []
    for line in text.splitlines():
        match = HEADING_RE.match(line)
        if match:
            level = len(match.group(1))
            converted.append(f"{'#' * level} {match.group(2)}")
        else:
            converted.append(line.rstrip())
    return "\n".join(converted).strip()


def render(source: Source, passage: str) -> str:
    body = mediawiki_headings_to_markdown(passage)
    metadata = (
        f"# {source.document_title}\n\n"
        f"> 类别：{source.category}\n>\n"
        f"> 选段：{source.selection_note}\n>\n"
        f"> 来源页面：[{source.page_title}]({source.page_url})\n>\n"
        f"> 固定版本：[oldid={source.revision_id}]({source.revision_url})，"
        f"该版本时间 {source.revision_timestamp}\n>\n"
        f"> 抓取日期：{RETRIEVED_ON}\n>\n"
        "> 处理方式：通过维基文库 API 的纯文本抽取接口下载；仅将 MediaWiki "
        "标题标记转换为 Markdown，正文与校注文字未作改写。\n\n"
        "---\n\n"
    )
    return metadata + body + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fetch and compare with checked-in files without rewriting them",
    )
    args = parser.parse_args()

    mismatches: list[str] = []
    for index, source in enumerate(SOURCES):
        if index:
            time.sleep(1)
        rendered = render(source, select_passage(fetch(source), source))
        destination = ROOT / source.output
        if args.check:
            if not destination.exists() or destination.read_text(encoding="utf-8") != rendered:
                mismatches.append(source.output)
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(rendered, encoding="utf-8", newline="\n")
        print(f"wrote {destination.relative_to(ROOT)}")

    if mismatches:
        print("generated source files differ:", file=sys.stderr)
        for mismatch in mismatches:
            print(f"  {mismatch}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
