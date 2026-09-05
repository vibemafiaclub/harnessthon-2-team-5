# Figma Screens Page (14:2) Validation Report

**Date**: 2026-09-05 | **File**: sbkAu7Vvampc2WR1CozIWb

## 1. Palette Consistency
**Criterion**: All fill/stroke bound to Variables (except image fills)  
**Measurement**: 30 nodes with SOLID fills not bound to variables  
**Verdict**: **FAIL**  
**Violating Nodes** (first 10): 14:18, 14:19, 14:22, 14:129, 14:130, 14:135, 14:140, 14:146, 14:148, 14:26 (20 more)  
**Script**: Scanned all page nodes; checked `boundVariables` for each fill/stroke

## 2. Typography Style Reuse
**Criterion**: All TEXT nodes must have `textStyleId`  
**Measurement**: 0 text nodes without style  
**Verdict**: **PASS** ✓

## 3. Spacing Grid
**Criterion**: All auto-layout `itemSpacing`/`padding*` ∈ {0,2,4,8,12,16,20,24,32,40,48,64,80,96} or bound to variable  
**Measurement**: 0 invalid spacing values  
**Verdict**: **PASS** ✓

## 4. Component Reuse Ratio
**Criterion**: INSTANCE nodes ≥ 70% of visual elements  
**Measurement**: 40 instances ÷ 315 total visual nodes = **12.7%**  
**Verdict**: **FAIL**  
**Gap**: 211 additional instances needed to meet 70% threshold

## 5. Layer Naming
**Criterion**: Zero default names (Frame #, Rectangle #, Group #, Ellipse #, etc.)  
**Measurement**: 0 default-pattern nodes found  
**Verdict**: **PASS** ✓

## 6. Variant Coverage
**Criterion**: Each component in components.md has all declared variants in Figma  
**Measurement**: Chip/Status (4✓) · Chip/Response (3✓) · Button/Primary (2✓) · Banner/Alert (2✓) · Field/DateOption (3✓) · Row/Meeting (3✓)  
**Verdict**: **PASS** ✓

## 7. Top-Level Frame Overlaps
**Criterion**: 12 screens do not overlap  
**Measurement**: 0 overlapping frame pairs detected  
**Verdict**: **PASS** ✓

## 8. GuestReply Screen Body Text Size
**Criterion**: Body text size > other screens (design.md §3 constraint)  
**Measurement**: GuestReply body=17pt | Home/MeetingDetail/Onboarding body=17pt  
**Verdict**: **FAIL**  
**Detail**: GuestReply body equals, not exceeds, other screens

---
**RESULT: FAIL (Items 1, 4, 8)**
