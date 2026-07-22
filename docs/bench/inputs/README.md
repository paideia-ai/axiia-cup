# Shared Benchmark Inputs

This directory contains selected inputs reused across benchmark families.

- [Honnoji user prompts](user-prompt-samples/honnoji/README.md)
- [Trolley user prompts](user-prompt-samples/trolley/README.md)

These inventories contain production-derived metadata and are internal
analysis artifacts. Judge Bias uses them to build representative history
panels; Judge Sensitivity reuses selected prompts for stronger prompt levels.

Every run must still save the exact scenario snapshot and selected-input
provenance it used. Shared inputs are convenient sources, not substitutes for
run-local provenance.
