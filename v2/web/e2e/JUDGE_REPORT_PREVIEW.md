# Judge OS report preview

Run from `v2/web`:

```sh
deno task preview:judge-report
```

Open <http://localhost:6034/> for all five complete match pages. The server
serves `build/client` unchanged and intercepts only local API reads with the
repository's historical fixtures (144, 120, 122, 123, 145). Writes return 405.
There is no production API proxy. The preview account and historical data are
explicitly labelled; account state, new match data and release metadata will
differ online. The report components, CSS and interactions are the production
implementation.

For the live states of the two court/council scenarios, run:

```sh
deno task preview:live-judge
```

Open <http://localhost:6036/>. Each scenario is listed as queued (no rows yet),
in progress (its first 12 rows, with the recorded next speaker streaming a short
simulated speech) and finished. The data comes from the same historical fixtures
and nothing is sent to the live backend.

## Delivered behavior

- Completed Shangyang, Honnoji and Trolley reports use a wider dialogue column
  and a narrower Judge OS column at desktop widths (900px and above).
- Each OS card starts at its source speech's midpoint. Cards move down only when
  necessary to avoid overlapping earlier cards or the chart (including expanded
  debug reasoning). Missing legacy anchors use sequential placement.
- Trolley tabs update dialogue and OS together. The full-match trend stays
  mounted; selecting a beat opens its case and focuses its OS card.
- Small screens use one column. Court/council OS follows its dialogue segment;
  Trolley OS follows the selected case. Final decisions remain outside the tabs.
- Shangyang and Honnoji keep the same dialogue and Judge OS columns from the
  first row: queued and live matches show a waiting state until the first note,
  a note still being generated waits in the sidebar, and the transcript is not
  rebuilt when the match finishes. Replay reveals notes with their rows and
  fills in a trend sized for every beat; inquiry and the final verdict stay
  outside the sidebar layout, as in the report. Trolley keeps its chronological
  live and replay views.
- A match that ends without any OS note, and incompatible legacy records, retain
  the original single-column layout.
- Trend markers have fixed circular radii, equal visible connector lengths and
  4px clearance from the visible dot/ring. Overflow scrollbars are hidden while
  scrolling and keyboard navigation remain available.
- OS bars fade from yellow to the current favor. Final verdict bars fade from
  yellow to the recorded match winner in all five scenarios; unresolved outcomes
  remain yellow. Final verdict headings are 16px.

The consolidated Storybook story (`Design/Final review`) also renders the
default `MatchDetailPage`, with no presentation overrides. Its interaction
checks cover all five endings, sidebar counts, circular markers, tab
persistence, keyboard selection and replay spoiler protection. Geometry unit
tests cover equal segment lengths, marker clearance, compact charts and
overflow.
