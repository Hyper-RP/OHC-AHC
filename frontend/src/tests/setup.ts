import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Alias jest to vitest's vi for compatibility
(global as any).jest = vi;

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.resizeTo for testing responsive components
Object.defineProperty(window, 'resizeTo', {
  writable: true,
  value: vi.fn(),
});

// Mock window.location.reload for ErrorBoundary tests
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// Mock getBoundingClientRect for proper chart dimensions
// This is a more sophisticated mock that handles Recharts' dimension checking
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = vi.fn(function(this: Element) {
  // For chart containers, always return positive dimensions
  const className = this.className || '';
  if (typeof className === 'string' && (className.includes('chartContainer') || className.includes('chartWrapper') || className.includes('chart'))) {
    const height = parseInt(this.getAttribute('height') || '300', 10);
    return {
      width: 800,
      height: height > 0 ? height : 300,
      top: 0,
      left: 0,
      bottom: height > 0 ? height : 300,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({ width: 800, height: height > 0 ? height : 300 }),
    };
  }

  // If the element has explicit width/height styles, use those
  const style = window.getComputedStyle(this);
  const explicitWidth = style.width;
  const explicitHeight = style.height;

  // For elements with percentage dimensions, return reasonable defaults
  if (typeof explicitWidth === 'string' && (explicitWidth.includes('%') || explicitHeight.includes('%'))) {
    return {
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({ width: 800, height: 400 }),
    };
  }

  // For elements with explicit pixel dimensions, try to parse them
  if (typeof explicitWidth === 'string' && typeof explicitHeight === 'string') {
    const widthMatch = explicitWidth.match(/^(\d+(?:\.\d+)?)px$/);
    const heightMatch = explicitHeight.match(/^(\d+(?:\.\d+)?)px$/);

    if (widthMatch && heightMatch) {
      return {
        width: parseFloat(widthMatch[1]),
        height: parseFloat(heightMatch[1]),
        top: 0,
        left: 0,
        bottom: parseFloat(heightMatch[1]),
        right: parseFloat(widthMatch[1]),
        x: 0,
        y: 0,
        toJSON: () => ({ width: parseFloat(widthMatch[1]), height: parseFloat(heightMatch[1]) }),
      };
    }
  }

  // Default fallback - ensure positive dimensions for all elements
  return {
    width: 800,
    height: 400,
    top: 0,
    left: 0,
    bottom: 400,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => ({ width: 800, height: 400 }),
  };
});

// Mock getBoundingClientRect on HTMLElement as well (for completeness)
(HTMLElement.prototype as any).getBoundingClientRect = Element.prototype.getBoundingClientRect;

// Mock clientWidth and clientHeight for Recharts
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() {
    const className = this.className || '';
    if (typeof className === 'string' && className.includes('chartContainer')) {
      const height = parseInt(this.getAttribute('height') || '300', 10);
      return 800;
    }
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get() {
    const className = this.className || '';
    if (typeof className === 'string' && className.includes('chartContainer')) {
      const height = parseInt(this.getAttribute('height') || '300', 10);
      return height > 0 ? height : 300;
    }
    return 400;
  },
});

// Mock offsetWidth and offsetHeight as well
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    const className = this.className || '';
    if (typeof className === 'string' && className.includes('chartContainer')) {
      const height = parseInt(this.getAttribute('height') || '300', 10);
      return height > 0 ? height : 300;
    }
    return 400;
  },
});

// Mock scrollWidth and scrollHeight
Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
  configurable: true,
  get() {
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get() {
    const className = this.className || '';
    if (typeof className === 'string' && className.includes('chartContainer')) {
      const height = parseInt(this.getAttribute('height') || '300', 10);
      return height > 0 ? height : 300;
    }
    return 400;
  },
});

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as Storage;

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock Recharts components to avoid dimension issues in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');

  return {
    ...actual,
    ResponsiveContainer: ({ children, width, height }: any) =>
      React.createElement('div', { 'data-testid': 'recharts-responsive-container', style: { width: width || 800, height: height || 400 } }, children),
    PieChart: ({ children }: any) => React.createElement('svg', { 'data-testid': 'recharts-pie-chart' }, children),
    BarChart: ({ children }: any) => React.createElement('svg', { 'data-testid': 'recharts-bar-chart' }, children),
    LineChart: ({ children }: any) => React.createElement('svg', { 'data-testid': 'recharts-line-chart' }, children),
    AreaChart: ({ children }: any) => React.createElement('svg', { 'data-testid': 'recharts-area-chart' }, children),
    Pie: ({ children, label }: any) => {
      const result = React.createElement('g', { 'data-testid': 'recharts-pie' }, children);
      // Call label function with mock viewBox if provided
      if (label) {
        try {
          React.createElement(label, { viewBox: { cx: 200, cy: 200 } });
        } catch {
          // Ignore errors from label rendering
        }
      }
      return result;
    },
    Bar: ({ children }: any) => React.createElement('g', { 'data-testid': 'recharts-bar' }, children),
    Line: () => React.createElement('path', { 'data-testid': 'recharts-line', d: 'M0,0 L100,100' }),
    Area: () => React.createElement('path', { 'data-testid': 'recharts-area', d: 'M0,100 L100,0 L100,100 Z' }),
    Cell: ({ fill }: any) => React.createElement('circle', { r: '10', fill: fill, 'data-testid': 'recharts-cell' }),
    XAxis: () => React.createElement('g', { 'data-testid': 'recharts-x-axis' }),
    YAxis: () => React.createElement('g', { 'data-testid': 'recharts-y-axis' }),
    CartesianGrid: () => React.createElement('g', { 'data-testid': 'recharts-cartesian-grid' }),
    Tooltip: () => React.createElement('g', { 'data-testid': 'recharts-tooltip' }),
    Legend: () => React.createElement('g', { 'data-testid': 'recharts-legend' }),
    ReferenceLine: () => React.createElement('line', { 'data-testid': 'recharts-reference-line', x1: '0', y1: '60', x2: '100', y2: '60' }),
  };
});