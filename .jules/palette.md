## 2025-05-14 — Arabic Typography & RTL Support
**Learning:** Arabic text in the codebase often lacks proper text direction (dir="rtl") and specific typography (font-amiri), which affects the rendering of ligatures and punctuation. For Quranic verses, a more generous line-height (leading-loose) is essential for readability of diacritics.
**Action:** Always wrap Arabic or Urdu text in elements with `font-amiri` and `dir="rtl"`. Use `leading-loose` for religious texts and `leading-relaxed` for general Arabic names to prevent clipping of ascenders and descenders.
