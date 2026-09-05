# WCAG 2.1 토큰 색 대비 재검사

READ: /Users/seongho/seongho/999_study/inner_circle/design_harnesston/harnessthon-2-team-5/design/stimuli/token_sets.json, /Users/seongho/seongho/999_study/inner_circle/design_harnesston/harnessthon-2-team-5/design/stimuli/design_guide_SET-A.html, /Users/seongho/seongho/999_study/inner_circle/design_harnesston/harnessthon-2-team-5/design/stimuli/design_guide_SET-B.html

## 실행 명령 및 계산

```
WCAG 2.1 상대 휘도: sRGB linearize → L = 0.2126*R + 0.7152*G + 0.0722*B
대비율 = (max(L1,L2) + 0.05) / (min(L1,L2) + 0.05)
```

## 검사 항목 결과

**SET-A: (1) 대비 쌍**
- text.primary/bg.page: 17.76:1 ≥ 4.5:1 ✓
- text.primary/bg.surface: 16.71:1 ≥ 4.5:1 ✓
- text.secondary/bg.page: 9.64:1 ≥ 4.5:1 ✓
- text.on-primary/brand.default: 5.13:1 ≥ 4.5:1 ✓
- text.link/bg.page: 8.67:1 ≥ 4.5:1 ✓
- border.default/bg.page: 3.08:1 ≥ 3.0:1 ✓
- border.strong/bg.page: 4.83:1 ≥ 3.0:1 ✓

**SET-A: (2) neutral 단조성** 0→50→100→200→300→400→500→700→900 더 어두워짐 ✓

**SET-A: (3) border.strong < border.default** (500: 0.1672 < 400: 0.2906) ✓

**SET-A: (4) JSON-HTML 일치** 모든 neutral, primary 값 일치 ✓

**SET-B: (1) 대비 쌍**
- text.primary/bg.page: 17.41:1 ≥ 4.5:1 ✓
- text.primary/bg.surface: 16.49:1 ≥ 4.5:1 ✓
- text.secondary/bg.page: 9.29:1 ≥ 4.5:1 ✓
- text.on-primary/brand.default: 5.27:1 ≥ 4.5:1 ✓
- text.link/bg.page: 7.93:1 ≥ 4.5:1 ✓
- border.default/bg.page: 3.10:1 ≥ 3.0:1 ✓
- border.strong/bg.page: 4.74:1 ≥ 3.0:1 ✓

**SET-B: (2) neutral 단조성** 0→50→100→200→300→400→500→700→900 더 어두워짐 ✓

**SET-B: (3) border.strong < border.default** (500: 0.1714 < 400: 0.2884) ✓

**SET-B: (4) JSON-HTML 일치** 모든 neutral, primary 값 일치 ✓

RESULT: SET-A PASS / SET-B PASS
