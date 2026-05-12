# Phase 3: Design — Graphical Dashboard Redesign

**Project:** OHC-AHC Dashboard Redesign - Attractive Graphical Dashboard
**Date:** 2026-05-11
**Status:** In Progress

---

## Progress Bar

```
[████████████████████████████████████████████████████] Phase 1: Planning (Completed)
[████████████████████████████████████████████████████] Phase 2: Requirements (Completed)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser (User)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        React Application                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │                     Chart Components                        │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │  │
│  │  │  │ LineChart   │  │ BarChart    │  │ PieChart    │      │ │  │
│  │  │  │ (Recharts)  │  │ (Recharts)  │  │ (Recharts)  │      │ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘      │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │  │
│  │  │  │ AreaChart   │  │ GaugeChart  │  │ StackedBar  │      │ │  │
│  │  │  │ (Recharts)  │  │ (Custom)    │  │ (Recharts)  │      │ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘      │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │                  Data Transformation Layer                  │ │  │
│  │  │                                                           │  │
│  │  │  - visitTrendsTransformer                                 │ │  │
│  │  │  - departmentStatsTransformer                             │ │  │
│  │  │  - diseaseTrendsTransformer                               │ │  │
│  │  │  - dailyMonthlyAggregator                                  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │                       State Management                       │ │  │
│  │  │                                                           │ │  │
│  │  │  - useChartState (custom hook)                            │ │  │
│  │  │  - useDateRange (custom hook)                             │ │  │
│  │  │  - useDailyMonthlyToggle (custom hook)                    │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │                        Page Components                       │ │  │
│  │  │                                                           │ │  │
│  │  │  - Dashboard.tsx (with charts)                             │ │  │
│  │  │  - DepartmentStats.tsx (with charts)                       │ │  │
│  │  │  - DiseaseTrends.tsx (with charts)                         │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ↓ HTTP (Axios + JWT)                        │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         Django Backend (API)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  API Endpoints:                                                         │
│  - GET /api/reports/dashboard-home/                                     │
│  - GET /api/reports/disease-trends/                                     │
│  - GET /api/reports/department-health-stats/                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL Database                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Component Hierarchy

```
App
└── PortalLayout
    ├── Sidebar
    ├── Header
    └── Routes
        ├── Dashboard (Enhanced with Charts)
        │   ├── DashboardCharts
        │   │   ├── VisitTrendsChart (LineChart)
        │   │   ├── DepartmentComparisonChart (BarChart)
        │   │   ├── SeverityPieChart (PieChart)
        │   │   └── DiagnosisTrendLineChart (LineChart)
        │   ├── ChartControls
        │   │   ├── DailyMonthlyToggle
        │   │   └── PeriodSelector
        │   └── Existing QuickActions & Activity
        │
        ├── DepartmentStats (Enhanced with Charts)
        │   ├── DepartmentCharts
        │   │   ├── HealthIndexGauge (Custom Gauge)
        │   │   └── VisitsReferralsStackedBar (BarChart)
        │   ├── ChartControls
        │   │   ├── DailyMonthlyToggle
        │   │   ├── DateRangePicker
        │   │   └── ExportButton
        │   └── Existing Export Functionality
        │
        └── DiseaseTrends (Enhanced with Charts)
            ├── TrendsCharts
            │   ├── DiagnosisAreaChart (AreaChart)
            │   └── SeverityTrendChart (LineChart)
            ├── ChartControls
            │   ├── DailyMonthlyToggle
            │   ├── DateRangePicker
            │   └── ExportButton
            └── Existing Export Functionality
```

---

## New Components to Create

### 1. Chart Wrapper Components

#### `ChartContainer.tsx`
Generic wrapper for all charts with:
- Loading state
- Error state
- Empty state
- Export functionality
- Title and legend
- Responsive container

```typescript
interface ChartContainerProps {
  title: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  onExport?: (format: 'png' | 'svg') => void;
  children: React.ReactNode;
}
```

#### `ChartControls.tsx`
Common controls for charts:
- Daily/Monthly toggle
- Period selector (7/30/90/180/365 days)
- Date range picker
- Apply button
- Export dropdown

```typescript
interface ChartControlsProps {
  period: number;
  onPeriodChange: (period: number) => void;
  dailyMonthly: 'daily' | 'monthly';
  onDailyMonthlyChange: (value: 'daily' | 'monthly') => void;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  onExport?: (format: 'png' | 'svg') => void;
}
```

### 2. Dashboard Chart Components

#### `VisitTrendsChart.tsx`
Line chart showing daily/monthly visit trends.

**Data Structure:**
```typescript
interface VisitTrendData {
  date: string;
  count: number;
}
```

**Features:**
- Responsive line chart with data points
- Hover tooltips
- Smooth animations
- Period-based X-axis labels

#### `DepartmentComparisonChart.tsx`
Horizontal bar chart comparing departments.

**Data Structure:**
```typescript
interface DepartmentComparisonData {
  department: string;
  visits: number;
  employees: number;
  referrals: number;
}
```

**Features:**
- Horizontal bars with colors
- Sorting options
- Hover tooltips with full details

#### `SeverityPieChart.tsx`
Donut/pie chart for disease severity.

**Data Structure:**
```typescript
interface SeverityData {
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  count: number;
  color: string;
}
```

**Features:**
- Donut chart with center text
- Color-coded segments
- Interactive legend
- Hover effects

#### `DiagnosisTrendLineChart.tsx`
Multi-line chart for top 5 diagnoses.

**Data Structure:**
```typescript
interface DiagnosisTrendData {
  diagnosis: string;
  data: Array<{ date: string; count: number }>;
  color: string;
}
```

### 3. Department Stats Chart Components

#### `HealthIndexGauge.tsx`
Custom gauge/meter component showing health index.

**Data Structure:**
```typescript
interface HealthIndexData {
  department: string;
  healthIndex: number; // 0-100
  visits: number;
  referrals: number;
  unfit: number;
}
```

**Features:**
- Circular gauge with color gradient
- Animation on load
- Hover with details
- Responsive size

#### `VisitsReferralsStackedBar.tsx`
Stacked bar chart for visits vs referrals.

**Data Structure:**
```typescript
interface VisitsReferralsData {
  department: string;
  visits: number;
  referrals: number;
}
```

### 4. Disease Trends Chart Components

#### `DiagnosisAreaChart.tsx`
Area chart showing diagnosis volume over time.

**Data Structure:**
```typescript
interface DiagnosisAreaData {
  diagnosis: string;
  data: Array<{ date: string; count: number }>;
  color: string;
}
```

**Features:**
- Semi-transparent fill
- Multiple diagnoses (up to 5)
- Interactive legend
- Zoom/pan support

#### `SeverityTrendChart.tsx`
Line chart showing severity distribution trends.

**Data Structure:**
```typescript
interface SeverityTrendData {
  severity: string;
  data: Array<{ date: string; count: number }>;
  color: string;
}
```

---

## Data Flow Design

### Data Fetching Flow

```
User Action (Page Load / Toggle Change)
    ↓
useEffect triggers data fetch
    ↓
API Service calls endpoint (with params)
    ↓
Django Backend returns data
    ↓
Data Transformer converts API response to chart format
    ↓
Daily/Monthly Aggregator applies aggregation if needed
    ↓
Chart Component receives formatted data
    ↓
Chart renders with Recharts
    ↓
User interacts (hover, click, etc.)
```

### State Management

```typescript
// Global chart state (per page)
interface ChartState {
  period: number; // 7, 30, 90, 180, 365
  dailyMonthly: 'daily' | 'monthly';
  dateRange: { start: string; end: string } | null;
  data: ChartData | null;
  loading: boolean;
  error: string | null;
}

// Custom Hook
function useChartData<T>(
  fetchFn: (params: ChartParams) => Promise<T>,
  transformFn: (data: T) => ChartData
): ChartState {
  // Implementation
}
```

---

## Styling & Theme

### Color Palette

```css
/* Chart Colors */
--chart-color-primary: #3b82f6;    /* Blue */
--chart-color-secondary: #10b981;  /* Green */
--chart-color-tertiary: #f59e0b;   /* Yellow */
--chart-color-danger: #ef4444;     /* Red */
--chart-color-purple: #8b5cf6;    /* Purple */
--chart-color-cyan: #06b6d4;      /* Cyan */

/* Severity Colors */
--severity-mild: #10b981;      /* Green */
--severity-moderate: #f59e0b;  /* Yellow */
--severity-severe: #f97316;   /* Orange */
--severity-critical: #ef4444; /* Red */

/* Health Index Colors */
--health-good: #10b981;    /* >80% */
--health-warning: #f59e0b; /* 60-80% */
--health-danger: #ef4444;  /* <60% */
```

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  .chart-container { height: 250px; }
  .legend { font-size: 12px; }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .chart-container { height: 300px; }
}

/* Desktop */
@media (min-width: 1025px) {
  .chart-container { height: 400px; }
}
```

---

## Performance Considerations

### Bundle Optimization
- Lazy load chart components: `React.lazy()`
- Tree-shake unused chart types from Recharts
- Use dynamic imports for heavy chart features

### Data Optimization
- Implement data pagination for large datasets
- Cache transformed data in useMemo
- Debounce rapid state changes (date range picker)

### Rendering Optimization
- Use React.memo for chart components
- Virtualize long lists (if needed)
- Implement shouldComponentUpdate for complex charts

---

## Accessibility Design

### Keyboard Navigation
- All charts are focusable via Tab
- Arrow keys to navigate data points
- Enter/Space to select and show details
- Escape to close tooltips/modals

### Screen Reader Support
- Chart title announced on focus
- Data points described in ARIA labels
- Table version of chart data available
- Status updates for data loading/changes

### Visual Accessibility
- Color contrast ratio >= 4.5:1
- Patterns/icons alongside colors for data points
- High contrast mode support
- Focus indicators visible

---

## Testing Strategy

### Unit Tests
- Data transformation functions
- Custom hooks (useChartState, useDateRange)
- Component rendering with test data

### Integration Tests
- Chart data fetch → transform → render flow
- User interactions (hover, click, toggle)
- Export functionality

### Visual Regression Tests
- Screenshot comparisons for charts
- Responsive layout verification
- Dark mode (if implemented)

---

**Phase 3 Output:** `docs/design/architecture.md`

**✅ Phase 3 complete. Shall I continue to Phase 4 — Development? (yes/no)**
