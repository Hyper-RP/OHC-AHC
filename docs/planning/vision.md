# Phase 1: Planning — Graphical Dashboard Redesign

**Project:** OHC-AHC Dashboard Redesign - Attractive Graphical Dashboard
**Date:** 2026-05-11
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

Transform the current text-based OHC-AHC dashboard into a modern, visually appealing graphical dashboard with interactive charts and visualizations. The new dashboard will display daily and monthly health records through beautiful, data-rich visualizations that make insights immediately clear and actionable.

---

## Context

### Current State

The OHC-AHC health portal currently has three data-heavy pages that are primarily text-based with simple card layouts:

1. **Dashboard (`/dashboard`)**
   - Shows basic stats in text format
   - Quick action cards with icons
   - Recent activity list
   - Simple trend indicators (+5%, -8%, etc.)

2. **Department Stats (`/reports/department-stats`)**
   - Department-wise metrics in card grid
   - Text-based statistics (Employees, Visits, Referrals, Unfit)
   - Health index percentage display
   - No visual representation of trends

3. **Disease Trends (`/reports/disease-trends`)**
   - Diagnosis trends in list format
   - Severity breakdown as simple text
   - Period selector (30/90/180/365 days)
   - No graphical charts or trend lines

### Problem Statement

- **Boring presentation:** Current data is displayed in plain text and simple cards
- **No visual trends:** Users cannot see patterns or trends at a glance
- **Limited insights:** Text-based data makes comparison and analysis difficult
- **No daily/monthly visualization:** No clear distinction or toggle between daily and monthly views

### Opportunity

By implementing a graphical dashboard, we can:
- Make data instantly understandable through visual patterns
- Enable quick trend analysis and pattern recognition
- Provide actionable insights through interactive visualizations
- Improve user engagement with the health portal
- Support better decision-making for healthcare management

---

## Top 3 Risks

### Risk 1: Chart Library Integration Complexity
**Severity:** Medium
**Impact:** Integrating chart libraries with existing React codebase may cause bundle size bloat or performance issues.

**Mitigation:**
- Choose lightweight, tree-shakeable chart library (Recharts, Chart.js with React wrapper)
- Implement lazy loading for chart components
- Optimize chart rendering with data virtualization for large datasets

### Risk 2: API Data Structure Mismatch
**Severity:** Medium
**Impact:** Current API may not provide data in the format needed for graphical visualizations (time-series, aggregated data).

**Mitigation:**
- Review existing API endpoints and data structures
- Add new endpoints if needed for chart-specific data formats
- Implement data transformation utilities on frontend

### Risk 3: Performance with Large Datasets
**Severity:** Low
**Impact:** Rendering complex charts with large datasets (monthly records) may cause lag.

**Mitigation:**
- Implement data pagination and lazy loading
- Use server-side aggregation where possible
- Add loading states and skeleton screens for charts

---

## Must-Have vs Nice-to-Have

### Must-Have (Core Graphical Dashboard Features)

#### Dashboard Page
- [ ] Replace text stats with visual metric cards with trend indicators
- [ ] Add a line chart showing daily visit trends (last 7/30 days)
- [ ] Add a bar chart showing department-wise visit comparison
- [ ] Add a pie/donut chart for disease severity breakdown
- [ ] Add a trend line for common diagnoses over time
- [ ] Maintain existing quick actions and recent activity sections

#### Department Stats Page
- [ ] Replace card grid with horizontal bar chart for department comparison
- [ ] Add visual health index gauge/meter per department
- [ ] Add stacked bar chart showing visits vs referrals per department
- [ ] Add toggle for daily/monthly view

#### Disease Trends Page
- [ ] Replace list with line chart showing diagnosis trends over time
- [ ] Add area chart for severity distribution trends
- [ ] Add interactive tooltips with detailed information on hover
- [ ] Add date range picker for custom time periods
- [ ] Add daily/monthly toggle with smooth transitions

#### Common Requirements
- [ ] Daily/Monthly toggle switch on all chart pages
- [ ] Responsive design for mobile/tablet/desktop
- [ ] Loading states for charts
- [ ] Empty state handling when no data
- [ ] Export chart as image functionality
- [ ] Maintain existing CSV/PDF export features

### Nice-to-Have (Enhanced Features)

- [ ] Real-time data updates with WebSocket
- [ ] Drill-down capability on charts (click to see details)
- [ ] Animated chart transitions
- [ ] Dark mode support for charts
- [ ] Customizable dashboard with widget arrangement
- [ ] Data comparison between different time periods
- [ ] Predictive analytics/trend forecasting
- [ ] Heat map showing busiest times/days
- [ ] Geolocation-based visualization (if location data available)
- [ ] Print-optimized chart layouts

---

## Recommended Tech Stack

### Chart Library Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Recharts** | React-native, declarative, great docs | Limited chart types | ✅ **Recommended** |
| Chart.js + React-Chartjs-2 | Many chart types, widely used | Larger bundle size | Alternative |
| Victory | React-native, accessible | Steeper learning curve | Alternative |
| Nivo | Beautiful, responsive | Large bundle size | For advanced needs |

**Primary Recommendation:** Recharts
- Lightweight (~150KB gzipped)
- Built for React
- Good documentation
- Supports most common chart types needed

---

## Success Criteria

- [ ] All three pages (Dashboard, Department Stats, Disease Trends) have graphical visualizations
- [ ] Daily/Monthly toggle works on all pages
- [ ] Charts are responsive and work on mobile
- [ ] Loading states are clear and professional
- [ ] Performance is acceptable (<2s initial load)
- [ ] Existing functionality (exports, navigation) is preserved
- [ ] Charts are accessible (keyboard navigation, screen readers)
- [ ] Design matches existing OHC-AHC brand (colors, typography)

---

## Next Steps

After approval, proceed to Phase 2: Requirements Gathering to create detailed user stories and acceptance criteria for each graphical feature.

---

**✅ Phase 1 complete. Shall I continue to Phase 2 — Requirements Gathering? (yes/no)**
