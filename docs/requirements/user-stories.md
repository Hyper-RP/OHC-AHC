# Phase 2: Requirements — Graphical Dashboard Redesign

**Project:** OHC-AHC Dashboard Redesign - Attractive Graphical Dashboard
**Date:** 2026-05-11
**Status:** In Progress

---

## Progress Bar

```
[████████████████████████████████████████████████████] Phase 1: Planning (Completed)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 2: Requirements (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Requirements Overview

This document outlines the functional requirements for transforming the OHC-AHC text-based dashboard into an attractive graphical dashboard with interactive visualizations.

**Total User Stories:** 15
**Must-Have (P1):** 10 stories
**Nice-to-Have (P2):** 5 stories

---

## User Stories

### Dashboard Page

#### US-001: Visual Visit Trends Chart
**Priority:** P1 (Must-Have)
**As a** healthcare administrator
**I want** to see a line chart showing daily visit trends
**So that** I can quickly identify patterns and spikes in OHC visits

**Acceptance Criteria:**
- [ ] Line chart displays visit counts for the selected time period (7 days / 30 days)
- [ ] Chart includes data points for each day with hover tooltips showing exact counts
- [ ] X-axis shows dates, Y-axis shows visit counts
- [ ] Chart updates smoothly when period selector changes
- [ ] Empty state displays "No data available" message
- [ ] Loading state shows skeleton or spinner
- [ ] Chart is responsive on mobile, tablet, and desktop

#### US-002: Department Comparison Bar Chart
**Priority:** P1 (Must-Have)
**As a** healthcare manager
**I want** to see a bar chart comparing visits across departments
**So that** I can identify which departments have the highest health needs

**Acceptance Criteria:**
- [ ] Horizontal bar chart shows visits per department
- [ ] Each bar is labeled with department name and visit count
- [ ] Bars are color-coded (e.g., different colors for different departments)
- [ ] Chart supports hover tooltips with additional details (employees, referrals)
- [ ] Sorting option: by visit count (ascending/descending)
- [ ] Responsive design with scrollable bars on mobile if needed

#### US-003: Disease Severity Pie Chart
**Priority:** P1 (Must-Have)
**As a** healthcare analyst
**I want** to see a donut/pie chart showing disease severity breakdown
**So that** I can understand the severity distribution at a glance

**Acceptance Criteria:**
- [ ] Donut chart shows severity categories (MILD, MODERATE, SEVERE, CRITICAL)
- [ ] Each segment is color-coded with legend
- [ ] Center of donut shows total count or percentage
- [ ] Hover effect highlights segment and shows count + percentage in tooltip
- [ ] Legend can be toggled to show/hide segments
- [ ] Empty state shows "No severity data available"

#### US-004: Common Diagnosis Trend Line
**Priority:** P1 (Must-Have)
**As a** healthcare provider
**I want** to see a trend line for the top 5 most common diagnoses
**So that** I can track patterns in common health issues

**Acceptance Criteria:**
- [ ] Multi-line chart shows top 5 diagnoses over time
- [ ] Each diagnosis has a distinct color with legend
- [ ] Hover shows diagnosis name, count, and date for that point
- [ ] Y-axis scales appropriately for the data range
- [ ] Chart updates when time period changes
- [ ] Maximum 5 lines displayed to avoid clutter

#### US-005: Daily/Monthly Toggle
**Priority:** P1 (Must-Have)
**As a** dashboard user
**I want** to toggle between daily and monthly view
**So that** I can see data at different granularities

**Acceptance Criteria:**
- [ ] Toggle switch with "Daily" and "Monthly" options
- [ ] Toggle persists selection in session/URL
- [ ] All charts on the page update smoothly when toggle changes
- [ ] Default view is "Daily"
- [ ] Toggle is clearly visible and accessible
- [ ] ARIA labels for screen readers

#### US-006: Chart Export as Image
**Priority:** P1 (Must-Have)
**As a** healthcare administrator
**I want** to export charts as images (PNG/SVG)
**So that** I can include them in reports and presentations

**Acceptance Criteria:**
- [ ] Each chart has an export button (download icon)
- [ ] Export button shows dropdown with PNG and SVG options
- [ ] Downloaded image includes chart title, legend, and data
- [ ] Image quality is suitable for presentations (at least 2x resolution)
- [ ] Export includes white background (not transparent) for better readability
- [ ] Filename is descriptive (e.g., "visit-trends-2026-05-11.png")

---

### Department Stats Page

#### US-007: Department Health Index Gauge
**Priority:** P1 (Must-Have)
**As a** HR manager
**I want** to see a visual gauge/meter showing health index per department
**So that** I can quickly assess department wellness at a glance

**Acceptance Criteria:**
- [ ] Gauge/meter shows health index (0-100%) for each department
- [ ] Color gradient: Red (<60%), Yellow (60-80%), Green (>80%)
- [ ] Gauge displays percentage number clearly
- [ ] Hover shows detailed breakdown (visits, referrals, unfit count)
- [ ] Gauges are arranged in a responsive grid
- [ ] Animation on load for visual appeal

#### US-008: Visits vs Referrals Stacked Bar
**Priority:** P1 (Must-Have)
**As a** healthcare coordinator
**I want** to see a stacked bar chart comparing visits vs referrals per department
**So that** I can understand referral rates across departments

**Acceptance Criteria:**
- [ ] Stacked bar chart with departments on X-axis
- [ ] Each bar has two segments: Visits (bottom), Referrals (top)
- [ ] Different colors for visits and referrals with legend
- [ ] Hover tooltip shows department name, visits count, referrals count, and referral rate (%)
- [ ] Y-axis shows count or percentage (selectable)
- [ ] Chart is sortable by department name or total count

---

### Disease Trends Page

#### US-009: Diagnosis Trends Area Chart
**Priority:** P1 (Must-Have)
**As a** healthcare analyst
**I want** to see an area chart showing diagnosis trends over time
**So that** I can visualize the volume and distribution of diagnoses

**Acceptance Criteria:**
- [ ] Area chart shows diagnosis volume over time with filled area under line
- [ ] Semi-transparent fill for better visibility of overlapping data
- [ ] Multiple diagnoses can be displayed (up to 5)
- [ ] Hover shows diagnosis, date, and count
- [ ] Color-coded with interactive legend
- [ ] Zoom/pan functionality for longer time periods

#### US-010: Severity Distribution Trends
**Priority:** P1 (Must-Have)
**As a** healthcare manager
**I want** to see a line or area chart showing severity distribution trends
**So that** I can track how severity levels change over time

**Acceptance Criteria:**
- [ ] Multi-line chart showing each severity level (MILD, MODERATE, SEVERE, CRITICAL)
- [ ] Each severity level has distinct color with legend
- [ ] Hover shows severity, date, and count
- [ ] Y-axis shows count, X-axis shows dates
- [ ] Chart updates when date range changes
- [ ] Toggle to show/hide specific severity levels

#### US-011: Custom Date Range Picker
**Priority:** P1 (Must-Have)
**As a** dashboard user
**I want** to select a custom date range for the charts
**So that** I can analyze specific time periods

**Acceptance Criteria:**
- [ ] Date range picker shows start and end date inputs
- [ ] Preset options: Last 7 days, Last 30 days, Last 90 days, Last 180 days, Last 365 days
- [ ] "Apply" button to refresh charts with new range
- [ ] Date validation: end date cannot be before start date
- [ ] Date range is reflected in URL for sharing/bookmarking
- [ ] Shows selected date range in header/subtitle

---

### Common/Technical Requirements

#### US-012: Chart Loading States
**Priority:** P1 (Must-Have)
**As a** dashboard user
**I want** to see clear loading indicators while charts load
**So that** I know the system is working and not broken

**Acceptance Criteria:**
- [ ] Skeleton loader or spinner displays while fetching chart data
- [ ] Loading state is consistent across all charts
- [ ] Loading animation is smooth and not distracting
- [ ] Error state displays user-friendly message with retry button
- [ ] Empty state displays helpful message when no data is available

#### US-013: Responsive Chart Design
**Priority:** P1 (Must-Have)
**As a** mobile user
**I want** charts to be readable and interactive on my phone
**So that** I can access dashboard data on the go

**Acceptance Criteria:**
- [ ] Charts are responsive and adapt to screen width
- [ ] Text labels are readable on mobile (minimum 14px)
- [ ] Touch interactions work (tap for tooltips, pinch to zoom if applicable)
- [ ] Horizontal scrolling for wide charts on mobile
- [ ] Legend collapses to hamburger menu on mobile
- [ ] Portrait and landscape orientations are supported

#### US-014: Preserve Existing Functionality
**Priority:** P1 (Must-Have)
**As a** current user
**I want** all existing features (exports, navigation, quick actions) to continue working
**So that** I don't lose any functionality

**Acceptance Criteria:**
- [ ] CSV export functionality still works on Department Stats and Disease Trends pages
- [ ] PDF export functionality still works on Disease Trends page
- [ ] Quick actions on Dashboard page are unchanged
- [ ] Recent activity section on Dashboard is preserved
- [ ] Navigation links work as before
- [ ] All existing tests continue to pass

#### US-015: Animated Chart Transitions
**Priority:** P2 (Nice-to-Have)
**As a** dashboard user
**I want** smooth animations when charts update
**So that** the dashboard feels polished and modern

**Acceptance Criteria:**
- [ ] Charts animate smoothly when data changes (period toggle, date range change)
- [ ] Animation duration is 300-500ms (not too slow, not too fast)
- [ ] Animation can be disabled for users who prefer performance
- [ ] Loading animation is consistent across all charts
- [ ] Hover effects on chart elements have smooth transitions

---

## Non-Functional Requirements

### Performance
- [ ] Initial page load time < 3 seconds
- [ ] Chart rendering time < 1 second for standard datasets
- [ ] Bundle size increase < 200KB (gzipped)
- [ ] No layout shift (CLS) during chart loading

### Accessibility
- [ ] All charts are keyboard accessible
- [ ] Screen reader announces chart summaries and data points
- [ ] Color contrast ratio meets WCAG AA standards (4.5:1)
- [ ] Charts work without mouse (keyboard navigation)
- [ ] ARIA labels and roles properly defined

### Browser Support
- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Security
- [ ] No sensitive data exposed in client-side code
- [ ] Chart data is fetched through authenticated API calls
- [ ] Export functionality respects user permissions

---

## Data Requirements

### API Endpoints (Existing)
The following existing API endpoints will be used:
- `/api/reports/dashboard-home/` - Dashboard stats
- `/api/reports/disease-trends/` - Disease trends data
- `/api/reports/department-health-stats/` - Department stats

### Data Transformations Needed
- Chart.js/Recharts compatible data format from API responses
- Daily/Monthly aggregation based on toggle state
- Date range filtering for custom periods

---

## Out of Scope

The following features are explicitly out of scope for this phase:
- Real-time data updates via WebSocket
- Predictive analytics and forecasting
- Customizable dashboard widget arrangement
- Dark mode support for charts
- Geolocation-based visualizations
- Heat maps for time-based data

---

## Questions for Stakeholders

1. What is the maximum number of data points a chart should display at once?
2. Should charts support printing? If yes, what layout is preferred?
3. Are there any specific color requirements based on brand guidelines?
4. Should chart data be cached client-side? If yes, for how long?
5. Are there any specific mobile devices that need testing priority?

---

## Success Metrics

- [ ] All 10 P1 user stories implemented and tested
- [ ] At least 2 P2 user stories implemented
- [ ] Page load time < 3 seconds
- [ ] All existing tests still passing
- [ ] No regressions in existing functionality
- [ ] User acceptance testing passed

---

**Phase 2 Output:** `docs/requirements/user-stories.md`

**✅ Phase 2 complete. Shall I continue to Phase 3 — Design? (yes/no)**
