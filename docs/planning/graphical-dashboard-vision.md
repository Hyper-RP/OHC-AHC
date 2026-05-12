# Phase 1: Planning — Employee Health History Graphical Dashboard

**Project:** OHC-AHC Employee Health History - Graphical Visualization Enhancement
**Date:** 2026-05-12
**Status:** In Progress

---

## Progress Bar

```
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 1: Planning (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 2: Requirements
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Vision Statement

Transform the Employee Health History page from a text-based visit list into an engaging, visually rich graphical dashboard that displays daily and monthly health records through interactive charts and visualizations. The enhanced dashboard will enable healthcare managers and administrators to quickly identify health patterns, track visit frequency, and understand an employee's health journey at a glance.

---

## Context

### Current State (Employee Health History Page)

The current Employee Health History page (`/reports/employee-history`) displays:
- **Summary Card:** Text-based employee information (name, department, designation, fitness status)
- **Visits List:** Plain text list showing visit date, type, complaint, and diagnosis
- **Period Selector:** Dropdown for 30/90/180/365 days
- **CSV Export:** Basic export functionality
- **No Visualizations:** No charts, graphs, or trend indicators

### Problem Statement

- **Text-heavy presentation:** Health data is displayed in a plain list format
- **No trend visualization:** Cannot see health patterns or trends over time
- **Limited daily/monthly view:** Period selector exists but no visual distinction
- **No severity visualization:** Case severity not shown visually
- **No quick insights:** Health status at a glance is difficult

### Opportunity

By implementing graphical visualizations for Employee Health History, we can:
- Show visit trends over time (daily/monthly)
- Visualize diagnosis distribution for the employee
- Display health index trend over the period
- Enable quick identification of health patterns
- Support better decision-making for employee health management

---

## Top 3 Risks

### Risk 1: API Data Granularity
**Severity:** Medium
**Impact:** Current API may not provide daily/monthly aggregated data suitable for charts.

**Mitigation:**
- Review existing `getEmployeeHealthHistory` API response structure
- Add backend aggregation endpoints if needed
- Implement frontend data transformation for chart rendering

### Risk 2: Sparse Data for Single Employee
**Severity:** Low
**Impact:** Individual employees may have very few visits, making charts appear empty or misleading.

**Mitigation:**
- Implement proper empty states for charts
- Show "Insufficient data" messages when applicable
- Combine with department-wide data for context when available

### Risk 3: Privacy Concerns
**Severity:** Medium
**Impact:** Detailed health visualization may expose sensitive information.

**Mitigation:**
- Ensure existing authentication and authorization is maintained
- Only show data to authorized personnel
- Keep export functionality secure

---

## Must-Have vs Nice-to-Have

### Must-Have (Core Graphical Features)

#### Employee Summary Section
- [ ] Visual fitness status badge (color-coded)
- [ ] Health score gauge/meter (derived from visit data)
- [ ] Quick stat cards: Total Visits, Avg Recovery Time, Fitness Trend

#### Visit Trends Section
- [ ] Line chart showing visit frequency over selected period
- [ ] Daily/Monthly toggle with smooth transitions
- [ ] Interactive tooltips showing visit details on hover
- [ ] Color-coded markers for visit types (Routine, Walk-in, Follow-up)

#### Diagnosis Distribution Section
- [ ] Pie/donut chart showing top diagnoses for the employee
- [ ] Bar chart for severity breakdown (Mild/Moderate/Serious/Critical)
- [ ] Treemap or bubble chart for diagnosis frequency visualization

#### Health Index Trend Section
- [ ] Area chart showing health index score over time
- [ ] Trend indicators (improving/stable/deteriorating)
- [ ] Comparison with department average (if available)

#### Common Requirements
- [ ] Daily/Monthly toggle switch affecting all charts
- [ ] Period selector (30/90/180/365 days) integration with charts
- [ ] Loading states for all chart components
- [ ] Empty state handling when no visit data exists
- [ ] Export chart as image functionality
- [ ] Maintain existing CSV export feature
- [ ] Responsive design for mobile/tablet/desktop

### Nice-to-Have (Enhanced Features)

- [ ] Animated chart transitions between periods
- [ ] Click on chart point to see detailed visit information
- [ ] Prediction line showing health trend forecast
- [ ] Comparison with employee's historical baseline
- [ ] Dark mode support for charts
- [ ] Print-optimized layout
- [ ] Comparison with peer group (department/company averages)
- [ ] Heat map showing busiest months/days
- [ ] Treatment timeline visualization
- [ ] Medication/prescription tracking chart

---

## Recommended Tech Stack

### Chart Library
**Recharts** (Already installed in project)
- Lightweight (~150KB gzipped)
- React-native, declarative API
- Good documentation
- Already used in other dashboard pages

### Additional Components Needed
- Custom gauge/meter component for health index
- Toggle switch component for daily/monthly
- Enhanced tooltip components

---

## Success Criteria

- [ ] Employee Health History page displays at least 4 different chart types
- [ ] Daily/Monthly toggle works and updates all charts
- [ ] Period selector updates chart data correctly
- [ ] Loading states are clear and professional
- [ ] Empty states display appropriately
- [ ] Charts are responsive on all device sizes
- [ ] Existing functionality (search, CSV export) is preserved
- [ ] Design matches OHC-AHC brand colors and typography
- [ ] Performance is acceptable (<2s load time)
- [ ] No breaking changes to existing API

---

## Data Requirements

### Minimum Data Points Needed
- Visit date (for time-series charts)
- Visit type (for categorization)
- Diagnosis name (for distribution charts)
- Severity level (for breakdown visualization)
- Health index/score (if available, or calculate from visit data)

### Proposed Data Transformations
1. **Daily Visits:** Group visits by date for line chart
2. **Monthly Visits:** Aggregate visits by month for trend chart
3. **Diagnosis Distribution:** Count occurrences by diagnosis name
4. **Severity Breakdown:** Count visits by severity level
5. **Health Index Trend:** Calculate score from fitness status + recent visits

---

## Next Steps

After approval, proceed to Phase 2: Requirements Gathering to create detailed user stories and acceptance criteria for each graphical feature.

---

**✅ Phase 1 complete. Shall I continue to Phase 2 — Requirements Gathering? (yes/no)**
