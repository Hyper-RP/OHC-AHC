# Phase 3: Design — Employee Health History Graphical Dashboard

**Project:** OHC-AHC Employee Health History - Graphical Dashboard
**Date:** 2026-05-12
**Status:** In Progress

---

## Progress Bar

```
[████████████████████████████████████████████████████] Phase 1: Planning (Completed)
[████████████████████████████████████████████████████] Phase 2: Requirements (Completed)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
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
│  │                    React Application (Vite)                        │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │                 EmployeeHealthHistory Page                │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │  │
│  │  │  │           Employee Summary Section              │  │ │  │
│  │  │  │  • Fitness Status Badge                      │  │ │  │
│  │  │  │  • Health Score Gauge                        │  │ │  │
│  │  │  │  • Quick Stats Cards                        │  │ │  │
│  │  │  └──────────────────────────────────────────────────┘  │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │  │
│  │  │  │            Visit Trends Section                │  │ │  │
│  │  │  │  • Visit Frequency Line Chart                │  │ │  │
│  │  │  │  • Visit Type Breakdown Bar Chart          │  │ │  │
│  │  │  │  • Daily/Monthly Toggle                  │  │ │  │
│  │  │  └──────────────────────────────────────────────────┘  │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │  │
│  │  │  │         Diagnosis Distribution Section          │  │ │  │
│  │  │  │  • Diagnosis Donut Chart                  │  │ │  │
│  │  │  │  • Severity Breakdown Bar Chart            │  │ │  │
│  │  │  └──────────────────────────────────────────────────┘  │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │  │
│  │  │  │           Health Index Trend Section          │  │ │  │
│  │  │  │  • Health Index Area Chart                │  │ │  │
│  │  │  │  • Trend Indicators                       │  │ │  │
│  │  │  └──────────────────────────────────────────────────┘  │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │  │
│  │  │  │              Existing Features                 │  │ │  │
│  │  │  │  • Search & Period Selector               │  │ │  │
│  │  │  │  • Visits List                           │  │ │  │
│  │  │  │  • CSV Export                           │  │ │  │
│  │  │  └──────────────────────────────────────────────────┘  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │                  Chart Components (New)                │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │ │  │
│  │  │  │FitnessBadge │  │HealthGauge  │  │VisitTrend│ │ │  │
│  │  │  │(Component)  │  │(Custom)     │  │LineChart │ │ │  │
│  │  │  └─────────────┘  └─────────────┘  └──────────┘ │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │ │  │
│  │  │  │VisitTypeBar │  │DiagnosisDonu│ │Severity  │ │ │  │
│  │  │  │Chart        │  │tChart      │  │BarChart  │ │ │  │
│  │  │  │(Recharts)   │  │(Recharts)   │  │(Recharts)│ │ │  │
│  │  │  └─────────────┘  └─────────────┘  └──────────┘ │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │ │  │
│  │  │  │HealthIndex  │  │DailyMonthl │  │ExportBut │ │ │  │
│  │  │  │AreaChart    │  │yToggle     │  │ton       │ │ │  │
│  │  │  │(Recharts)   │  │(Component)  │  │(Util)    │ │ │  │
│  │  │  └─────────────┘  └─────────────┘  └──────────┘ │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │              Data Transformation Layer (New)              │ │  │
│  │  │                                                           │ │  │
│  │  │  - transformVisitFrequencyData()                       │ │  │
│  │  │  - transformVisitTypeData()                           │ │  │
│  │  │  - transformDiagnosisDistributionData()                 │ │  │
│  │  │  - transformSeverityBreakdownData()                     │ │  │
│  │  │  - calculateHealthScore()                               │ │  │
│  │  │  - calculateHealthIndexTrend()                         │ │  │
│  │  │  - aggregateDailyMonthly()                            │ │  │
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
│  API Endpoint:                                                           │
│  - GET /api/reports/employee-health-history/              (Existing)        │
│    - employee_code (required)                                        │
│    - date_from (optional)                                              │
│    - date_to (optional)                                                │
│                                                                         │
│  Export Endpoint:                                                        │
│  - GET /exports/employee-health-history.csv            (Existing)        │
│    - employee_code (required)                                        │
│    - date_from (optional)                                              │
│    - date_to (optional)                                                │
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
        └── EmployeeHealthHistory (Enhanced with Charts)
            ├── EmployeeSummarySection
            │   ├── FitnessStatusBadge
            │   ├── HealthScoreGauge
            │   └── QuickStatsCards
            │       ├── TotalVisitsCard
            │       ├── AvgRecoveryTimeCard
            │       └── FitnessTrendCard
            │
            ├── VisitTrendsSection
            │   ├── VisitFrequencyLineChart
            │   ├── VisitTypeBarChart
            │   └── DailyMonthlyToggle
            │
            ├── DiagnosisDistributionSection
            │   ├── DiagnosisDonutChart
            │   └── SeverityBarChart
            │
            ├── HealthIndexTrendSection
            │   └── HealthIndexAreaChart
            │
            ├── Existing Controls
            │   ├── SearchSection
            │   └── PeriodSelector
            │
            └── Existing Features
                ├── SummaryCard
                ├── VisitsList
                └── ExportButton
```

---

## New Components to Create

### 1. Employee Summary Components

#### `FitnessStatusBadge.tsx`
Color-coded badge showing employee fitness status.

```typescript
interface FitnessStatusBadgeProps {
  status: 'FIT' | 'UNFIT' | 'TEMPORARY_UNFIT' | 'UNDER_OBSERVATION';
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Color mapping: FIT (green), UNFIT (red), TEMPORARY_UNFIT (yellow), UNDER_OBSERVATION (orange)
- Icon per status
- ARIA label for accessibility

#### `HealthScoreGauge.tsx`
Circular gauge showing calculated health index (0-100).

```typescript
interface HealthScoreGaugeProps {
  score: number; // 0-100
  size?: number; // 120, 150, 180
  showLabel?: boolean;
  animate?: boolean;
}
```

**Features:**
- Circular SVG gauge with gradient fill
- Color zones: <60 (red), 60-79 (yellow), 80-100 (green)
- Animated fill on load
- Score displayed in center
- Tooltip with score breakdown

#### `QuickStatsCards.tsx`
Container for quick stat cards.

```typescript
interface QuickStatsCardsProps {
  totalVisits: number;
  avgRecoveryTime: number; // in days
  fitnessTrend: { direction: 'up' | 'down' | 'stable'; percentage: number };
}
```

---

### 2. Visit Trends Components

#### `VisitFrequencyLineChart.tsx`
Line chart showing visit counts over time.

```typescript
interface VisitFrequencyData {
  date: string; // formatted date
  fullDate: string; // ISO date for tooltip
  count: number;
  visitTypes: {
    routine: number;
    walk_in: number;
    follow_up: number;
  };
}

interface VisitFrequencyLineChartProps {
  data: VisitFrequencyData[];
  height?: number;
}
```

**Features:**
- Line chart with data points
- Hover tooltip with detailed breakdown
- Smooth transitions
- Responsive height

#### `VisitTypeBarChart.tsx`
Bar chart showing visits by type.

```typescript
interface VisitTypeData {
  type: 'Routine' | 'Walk-in' | 'Follow-up';
  count: number;
  percentage: number;
}

interface VisitTypeBarChartProps {
  data: VisitTypeData[];
  height?: number;
}
```

**Features:**
- Vertical bars
- Color-coded by type
- Hover with count + percentage
- Legend

#### `DailyMonthlyToggle.tsx`
Toggle switch for daily/monthly view.

```typescript
interface DailyMonthlyToggleProps {
  value: 'daily' | 'monthly';
  onChange: (value: 'daily' | 'monthly') => void;
  disabled?: boolean;
}
```

---

### 3. Diagnosis Distribution Components

#### `DiagnosisDonutChart.tsx`
Donut chart for top diagnoses.

```typescript
interface DiagnosisData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface DiagnosisDonutChartProps {
  data: DiagnosisData[];
  height?: number;
  maxItems?: number; // top N diagnoses
}
```

**Features:**
- Donut chart with center text (total count)
- Color-coded segments
- Interactive legend
- "Other" category if > maxItems

#### `SeverityBarChart.tsx`
Bar chart for severity breakdown.

```typescript
interface SeverityData {
  severity: 'MILD' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  count: number;
  color: string;
}

interface SeverityBarChartProps {
  data: SeverityData[];
  height?: number;
}
```

**Features:**
- Bars sorted by severity level
- Color-coded (green/yellow/orange/red)
- Hover with count + percentage

---

### 4. Health Index Trend Component

#### `HealthIndexAreaChart.tsx`
Area chart showing health index over time.

```typescript
interface HealthIndexTrendData {
  date: string;
  fullDate: string;
  healthIndex: number;
  status: 'good' | 'warning' | 'concern';
}

interface HealthIndexAreaChartProps {
  data: HealthIndexTrendData[];
  height?: number;
}
```

**Features:**
- Area chart with semi-transparent fill
- Horizontal reference line at 60
- Color-coded based on health index
- Trend indicator

---

## Data Flow Design

### State Management

```typescript
interface EmployeeHealthHistoryState {
  // Search & Filter
  employeeId: string;
  period: number; // 30, 90, 180, 365
  dailyMonthly: 'daily' | 'monthly';

  // Data
  apiData: EmployeeHealthHistory | null;
  transformedData: TransformedChartData | null;

  // UI State
  loading: boolean;
  error: string | null;
  showCharts: boolean;
}

interface TransformedChartData {
  summary: {
    healthScore: number;
    totalVisits: number;
    avgRecoveryTime: number;
    fitnessTrend: { direction: 'up' | 'down' | 'stable'; percentage: number };
  };
  visitFrequency: VisitFrequencyData[];
  visitTypes: VisitTypeData[];
  diagnosisDistribution: DiagnosisData[];
  severityBreakdown: SeverityData[];
  healthIndexTrend: HealthIndexTrendData[];
}
```

### Data Fetching & Transformation Flow

```
User enters Employee ID + Period
    ↓
useEffect triggers
    ↓
getEmployeeHealthHistory(employeeId, period)
    ↓
API returns EmployeeHealthHistory
    ↓
transformEmployeeHealthHistoryData(apiData, dailyMonthly)
    ↓
1. Calculate health score from visits/diagnoses
2. Aggregate visit frequency (daily or monthly)
3. Count visit types
4. Extract diagnosis distribution
5. Count severity breakdown
6. Calculate health index trend
    ↓
setTransformedData(result)
    ↓
Components re-render with chart data
```

---

## Styling & Theme

### Color Palette

```css
/* Brand Colors */
--primary-color: #3b82f6;      /* Blue */
--primary-dark: #1d4ed8;
--primary-light: #93c5fd;

--success-color: #10b981;     /* Green */
--success-dark: #059669;
--success-light: #6ee7b7;

--warning-color: #f59e0b;     /* Yellow */
--warning-dark: #d97706;
--warning-light: #fcd34d;

--danger-color: #ef4444;      /* Red */
--danger-dark: #b91c1c;
--danger-light: #f87171;

/* Fitness Status Colors */
--fitness-fit: #10b981;
--fitness-unfit: #ef4444;
--fitness-temp-unfit: #f59e0b;
--fitness-observation: #f97316;

/* Severity Colors */
--severity-mild: #10b981;
--severity-moderate: #f59e0b;
--severity-serious: #f97316;
--severity-critical: #ef4444;

/* Chart Colors */
--chart-1: #3b82f6;
--chart-2: #10b981;
--chart-3: #f59e0b;
--chart-4: #8b5cf6;
--chart-5: #06b6d4;
--chart-6: #ec4899;
--chart-7: #f97316;

/* Background */
--bg-gauge-bg: #f3f4f6;
--bg-card: #ffffff;
--bg-section: #f9fafb;
```

### Component Styling

```css
/* Employee Summary Section */
.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

/* Quick Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

/* Chart Container */
.chart-card {
  background: var(--bg-card);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Daily/Monthly Toggle */
.toggle-container {
  display: inline-flex;
  background: var(--bg-section);
  border-radius: 2rem;
  padding: 0.25rem;
  gap: 0.25rem;
}

.toggle-button {
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-button.active {
  background: var(--primary-color);
  color: white;
}
```

---

## Performance Considerations

### Bundle Optimization
- Lazy load chart components: `React.lazy()`
- Use `import()` for Recharts sub-libs
- Tree-shake unused components

### Rendering Optimization
- `useMemo` for transformed data
- `React.memo` for chart components
- Debounce rapid toggle changes

### Data Caching
- Cache API response in `useRef`
- Reuse transformed data when only toggle changes

---

## Accessibility Design

### Keyboard Navigation
- Tab to focus charts
- Arrow keys to navigate data points
- Enter/Space to show details
- Escape to close tooltips

### Screen Reader
- ARIA roles: `role="img" aria-label="Chart showing..."`
- Live regions for data updates: `aria-live="polite"`
- Table alternative for chart data

### Visual
- Color contrast: 4.5:1 minimum
- Focus indicators visible
- High contrast mode support

---

## Testing Strategy

### Unit Tests
- Data transformation functions
- Health score calculation
- Daily/monthly aggregation

### Component Tests
- Chart rendering with test data
- User interactions
- Loading/error/empty states

### Integration Tests
- Full data flow from API to chart
- Toggle behavior
- Period change behavior

---

**Phase 3 Output:** `docs/design/employee-health-history-architecture.md`
