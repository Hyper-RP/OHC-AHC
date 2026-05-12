# Phase 2: Requirements — Employee Health History Graphical Dashboard

**Project:** OHC-AHC Employee Health History - Graphical Dashboard
**Date:** 2026-05-12
**Status:** In Progress

---

## Progress Bar

```
[████████████████████████████████████████████████████] Phase 1: Planning (Completed)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 2: Requirements (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Requirements Overview

This document outlines functional requirements for transforming the Employee Health History page from a text-based list into an attractive graphical dashboard with interactive visualizations.

**Total User Stories:** 12
**Must-Have (P1):** 9 stories
**Nice-to-Have (P2):** 3 stories

---

## User Stories

### Employee Summary Section

#### US-EH-001: Visual Fitness Status Badge
**Priority:** P1 (Must-Have)
**As a** healthcare administrator
**I want** to see a visual fitness status badge with color coding
**So that** I can immediately identify the employee's fitness level

**Acceptance Criteria:**
- [ ] Fitness status displayed as a colored badge/icon
- [ ] Color coding: Green (Fit), Yellow (Temporarily Unfit), Red (Unfit)
- [ ] Badge shows status text clearly
- [ ] Status is derived from employee's current fitness_status field
- [ ] Icon changes based on status (check, warning, x)
- [ ] Accessible with proper ARIA labels

#### US-EH-002: Health Score Gauge
**Priority:** P1 (Must-Have)
**As a** HR manager
**I want** to see a health index gauge showing the employee's overall health score
**So that** I can assess employee wellness at a glance

**Acceptance Criteria:**
- [ ] Circular gauge displays health index (0-100)
- [ ] Color gradient: Red (<60), Yellow (60-79), Green (80-100)
- [ ] Gauge shows percentage number in center
- [ ] Score calculated from visit data (fewer severe visits = higher score)
- [ ] Hover tooltip shows score breakdown explanation
- [ ] Animation on load (gauge fills from 0 to current value)

#### US-EH-003: Quick Stats Cards
**Priority:** P1 (Must-Have)
**As a** healthcare coordinator
**I want** to see quick stat cards for total visits, average recovery time, and fitness trend
**So that** I can get a quick overview without reading the full history

**Acceptance Criteria:**
- [ ] Total Visits card: shows total visits in selected period
- [ ] Avg Recovery Time card: shows average days between visits
- [ ] Fitness Trend card: shows trend indicator (↑ improving, → stable, ↓ deteriorating)
- [ ] Each card has an icon
- [ ] Trend indicator shows percentage change vs previous period
- [ ] Trend colored: Green (good), Red (concerning)
- [ ] Cards responsive: grid on desktop, stacked on mobile

---

### Visit Trends Section

#### US-EH-004: Visit Frequency Line Chart
**Priority:** P1 (Must-Have)
**As a** healthcare administrator
**I want** to see a line chart showing visit frequency over the selected period
**So that** I can identify patterns and spikes in the employee's health visits

**Acceptance Criteria:**
- [ ] Line chart displays visit counts over time
- [ ] X-axis shows dates (daily view) or months (monthly view)
- [ ] Y-axis shows visit count
- [ ] Data points with hover tooltips showing exact count and date
- [ ] Line color uses OHC-AHC brand color (blue/primary)
- [ ] Smooth interpolation between points
- [ ] Chart updates when period selector changes
- [ ] Empty state shows "No visits in this period"

#### US-EH-005: Visit Type Breakdown Bar Chart
**Priority:** P1 (Must-Have)
**As a** healthcare provider
**I want** to see a bar chart showing visits by type (Routine, Walk-in, Follow-up)
**So that** I can understand the nature of visits

**Acceptance Criteria:**
- [ ] Vertical or horizontal bar chart showing visit types
- [ ] Each bar labeled with visit type and count
- [ ] Different colors for each visit type
- [ ] Hover tooltip shows type, count, and percentage
- [ ] Legend showing all visit types
- [ ] Bar animation on load
- [ ] Handles missing types gracefully (shows 0 or hides)

#### US-EH-006: Daily/Monthly Toggle
**Priority:** P1 (Must-Have)
**As a** dashboard user
**I want** to toggle between daily and monthly view for all charts
**So that** I can see data at different granularities

**Acceptance Criteria:**
- [ ] Toggle switch with "Daily" and "Monthly" options
- [ ] Toggle prominently placed near charts
- [ ] Default view is "Daily"
- [ ] All charts update smoothly when toggle changes
- [ ] Toggle state persists during session (not saved to server)
- [ ] ARIA labels for accessibility
- [ ] Visual feedback on selection (active state highlighted)

---

### Diagnosis Distribution Section

#### US-EH-007: Diagnosis Distribution Pie/Donut Chart
**Priority:** P1 (Must-Have)
**As a** healthcare analyst
**I want** to see a donut chart showing top diagnoses for the employee
**So that** I can quickly see what health issues are most common

**Acceptance Criteria:**
- [ ] Donut chart shows top 5-7 diagnoses
- [ ] Segments color-coded with interactive legend
- [ ] Center shows total unique diagnoses count
- [ ] Hover effect highlights segment and shows diagnosis, count, percentage
- [ ] Legend can click to show/hide segments
- [ ] "Other" category if more than top diagnoses
- [ ] Empty state for employees with no diagnoses

#### US-EH-008: Severity Breakdown Bar Chart
**Priority:** P1 (Must-Have)
**As a** healthcare manager
**I want** to see a bar chart showing visit severity breakdown
**So that** I can assess the seriousness of health issues

**Acceptance Criteria:**
- [ ] Bar chart showing severity levels: MILD, MODERATE, SERIOUS, CRITICAL
- [ ] Bars color-coded by severity (Green, Yellow, Orange, Red)
- [ ] Each bar labeled with severity level and count
- [ ] Hover shows severity, count, and percentage of total
- [ ] Chart sorted by severity level (MILD to CRITICAL)
- [ ] Handles missing severity levels gracefully

---

### Health Index Trend Section

#### US-EH-009: Health Index Trend Area Chart
**Priority:** P1 (Must-Have)
**As a** healthcare coordinator
**I want** to see an area chart showing health index trend over time
**So that** I can track whether the employee's health is improving or deteriorating

**Acceptance Criteria:**
- [ ] Area chart shows health index (0-100) over time
- [ ] Semi-transparent fill under the line
- [ ] X-axis shows dates (daily/monthly based on toggle)
- [ ] Y-axis shows health index (0-100)
- [ ] Trend line color: primary brand color
- [ ] Hover tooltip shows date, health index, and assessment
- [ ] Horizontal reference line at 60 (threshold for concern)
- [ ] Updates when period selector changes

---

### Common Features

#### US-EH-010: Period Selector Integration
**Priority:** P1 (Must-Have)
**As a** dashboard user
**I want** the period selector (30/90/180/365 days) to update all charts
**So that** I can analyze different time periods consistently

**Acceptance Criteria:**
- [ ] Period selector dropdown positioned prominently
- [ ] Options: 30, 90, 180, 365 days
- [ ] Changing period updates all charts with loading state
- [ ] Period value displayed in page subtitle
- [ ] Default period is 90 days
- [ ] Date range shown in human-readable format

#### US-EH-011: Loading and Empty States
**Priority:** P1 (Must-Have)
**As a** dashboard user
**I want** clear loading indicators and helpful empty states
**So that** I know the system is working and understand when no data exists

**Acceptance Criteria:**
- [ ] Skeleton loader or spinner for each chart during load
- [ ] Loading state consistent across all charts
- [ ] Empty state for no visits: "No visit records found for this period"
- [ ] Empty state for no diagnoses: "No diagnosis records available"
- [ ] Empty state icon and helpful text
- [ ] Error state shows message and retry button
- [ ] All states responsive

#### US-EH-012: Export Charts as Image
**Priority:** P2 (Nice-to-Have)
**As a** healthcare administrator
**I want** to export charts as PNG images
**So that** I can include them in reports and presentations

**Acceptance Criteria:**
- [ ] Each chart has export button (download icon)
- [ ] Export downloads chart as high-quality PNG
- [ ] Image includes chart title and legend
- [ ] White background (not transparent)
- [ ] Filename descriptive: "employee_[id]_[chart-type]_2026-05-12.png"
- [ ] Maintain existing CSV export for full data

---

## Non-Functional Requirements

### Performance
- [ ] Initial page load time < 3 seconds
- [ ] Chart rendering time < 1 second for standard datasets
- [ ] No layout shift (CLS) during chart loading
- [ ] Smooth animations (60fps)

### Accessibility
- [ ] All charts keyboard navigable
- [ ] Screen reader announces chart data
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] ARIA labels on interactive elements
- [ ] Focus indicators visible

### Responsive Design
- [ ] Charts readable on mobile (320px+)
- [ ] Tablet-optimized layout (768px+)
- [ ] Desktop grid layout (1024px+)
- [ ] Touch interactions work on mobile

### Browser Support
- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile browsers supported

### Security
- [ ] Data fetched through authenticated API
- [ ] No sensitive data in client-side code
- [ ] Export respects user permissions

---

## Data Requirements

### Existing API Endpoint
**Endpoint:** `/api/reports/employee-health-history/`
**Parameters:**
- `employee_code` (required): Employee ID
- `date_from` (optional): Start date filter
- `date_to` (optional): End date filter

**Response Structure:**
```typescript
{
  employee: {
    user: { first_name, last_name },
    department,
    designation,
    fitness_status
  },
  visits: [
    {
      uuid,
      visit_date,
      visit_type,
      chief_complaint,
      diagnoses: [
        {
          diagnosis_name,
          severity
        }
      ]
    }
  ]
}
```

### Data Transformations Needed

1. **Visit Frequency Data:**
   - Group visits by date (daily) or month (monthly)
   - Count visits per period

2. **Visit Type Breakdown:**
   - Count visits by visit_type
   - Calculate percentages

3. **Diagnosis Distribution:**
   - Count occurrences by diagnosis_name
   - Sort by count (descending), take top 5-7

4. **Severity Breakdown:**
   - Count visits by severity level
   - Group: MILD, MODERATE, SERIOUS, CRITICAL

5. **Health Index Calculation:**
   - Base score: 100
   - Deduct points: Severe (-20), Serious (-10), Moderate (-5), Mild (-1)
   - Time-weighted: recent visits have higher impact
   - Clamped between 0-100

6. **Health Index Trend:**
   - Calculate rolling health index over time
   - Use sliding window approach

---

## Out of Scope

The following features are explicitly out of scope:
- Real-time data updates via WebSocket
- Predictive health forecasting
- Comparison with peer group averages
- Dark mode for charts
- Print optimization
- Medication tracking visualization

---

## Questions for Stakeholders

1. What formula should be used for health index calculation?
2. Should the health index trend show weekly, monthly, or daily data points?
3. What is the minimum number of visits before displaying charts?
4. Are there specific colors required for severity levels?
5. Should diagnosis names be abbreviated if too long for chart display?

---

## Success Metrics

- [ ] All 9 P1 user stories implemented and tested
- [ ] At least 1 P2 user story implemented
- [ ] Page load time < 3 seconds
- [ ] All existing tests passing
- [ ] No regressions in Employee Health History functionality
- [ ] Mobile responsive verified
- [ ] Accessibility audit passed

---

**Phase 2 Output:** `docs/requirements/employee-health-history-user-stories.md`

**✅ Phase 2 complete. Shall I continue to Phase 3 — Design? (yes/no)**
