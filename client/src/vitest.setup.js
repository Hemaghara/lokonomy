import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
vi.hoisted(() => {
  const React = require("react");
  global.React = React;
});

// Mock window.location
const mockLocation = new URL("http://localhost:3000/");
mockLocation.assign = vi.fn();
mockLocation.replace = vi.fn();
mockLocation.reload = vi.fn();

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
  configurable: true,
});

// Mock window.URL.createObjectURL
if (typeof window !== "undefined") {
  window.URL.createObjectURL = vi.fn(() => "mock-url");
  window.URL.revokeObjectURL = vi.fn();
}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock FileReader
class MockFileReader {
  constructor() {
    this.onloadend = null;
    this.result = null;
    this.readAsDataURL = vi.fn().mockImplementation(() => {
      this.result = "data:image/png;base64,mock-data";
      if (this.onloadend) {
        this.onloadend();
      }
    });
  }
}
global.FileReader = MockFileReader;

// Global fetch mock
global.fetch = vi.fn().mockImplementation((url) => {
  if (url.includes("nominatim.openstreetmap.org")) {
    return Promise.resolve({
      json: () =>
        Promise.resolve({
          display_name: "Test City, State, Country",
          address: {
            city: "Test City",
            state_district: "Test District",
            suburb: "Test Suburb",
          },
        }),
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({}),
  });
});

vi.hoisted(() => {
  if (typeof global !== "undefined") {
    // We can't use import here if it's not a module, but vitest should handle it
  }
});

// Mock framer-motion with a proxy to handle any motion element
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal();
  const motionProxy = new Proxy(
    {},
    {
      get: (target, prop) => {
        return typeof prop === "string" ? prop : "div";
      },
    },
  );

  return {
    ...actual,
    motion: motionProxy,
    AnimatePresence: ({ children }) => children,
  };
});

// Mock lucide-react with a proxy to handle any icon name
vi.mock("lucide-react", async (importOriginal) => {
  try {
    const actual = await importOriginal();
    return new Proxy(
      { ...actual },
      {
        get: (target, prop) => {
          if (prop === "__esModule") return true;
          if (prop in target) return target[prop];
          return "svg";
        },
      },
    );
  } catch (e) {
    // Fallback if importOriginal fails
    return new Proxy(
      {},
      {
        get: (target, prop) => {
          if (prop === "__esModule") return true;
          return "svg";
        },
      },
    );
  }
});

// Consolidated Services Mock with Proxy to handle any service/method
vi.mock("./services", async (importOriginal) => {
  const actual = await importOriginal().catch(() => ({}));

  const createMockService = () => {
    const service = {};
    return new Proxy(service, {
      has: () => true,
      get: (target, prop) => {
        if (prop in target) return target[prop];
        if (typeof prop === "string" && prop !== "then") {
          if (
            prop.startsWith("get") ||
            prop.startsWith("fetch") ||
            prop.startsWith("search")
          ) {
            target[prop] = vi.fn().mockResolvedValue({ data: {} });
          } else {
            target[prop] = vi.fn().mockResolvedValue({ success: true });
          }
          return target[prop];
        }
        return target[prop];
      },
    });
  };

  const services = {
    authService: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getProfile: vi.fn().mockResolvedValue({ data: {} }),
      getMe: vi.fn().mockResolvedValue({ data: { success: true, user: {} } }),
      updateProfile: vi.fn().mockResolvedValue({ data: {} }),
      verifyToken: vi.fn().mockResolvedValue({ data: { user: {} } }),
    },
    businessService: {
      getBusinesses: vi.fn().mockResolvedValue({ data: [] }),
      getBusinessById: vi.fn().mockResolvedValue({ data: {} }),
      incrementVisits: vi.fn().mockResolvedValue({ data: { success: true } }),
      addReview: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    adminService: createMockService(),
    orderService: createMockService(),
    marketService: createMockService(),
    storyService: createMockService(),
    wishlistService: createMockService(),
    jobService: createMockService(),
    chatService: createMockService(),
    notificationService: createMockService(),
  };

  return {
    ...actual,
    ...services,
  };
});

// Global mock for socket service
vi.mock("./services/socket", () => ({
  connectSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
  }),
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
  }),
  disconnectSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Global mock for recharts
vi.mock("recharts", () => ({
  AreaChart: ({ children }) =>
    React.createElement("div", { "data-testid": "area-chart" }, children),
  Area: () => React.createElement("div"),
  BarChart: ({ children }) =>
    React.createElement("div", { "data-testid": "bar-chart" }, children),
  Bar: () => React.createElement("div"),
  LineChart: ({ children }) =>
    React.createElement("div", { "data-testid": "line-chart" }, children),
  Line: () => React.createElement("div"),
  ResponsiveContainer: ({ children }) =>
    React.createElement(
      "div",
      { "data-testid": "responsive-container" },
      children,
    ),
  Tooltip: () => React.createElement("div"),
  XAxis: () => React.createElement("div"),
  YAxis: () => React.createElement("div"),
  CartesianGrid: () => React.createElement("div"),
  Legend: () => React.createElement("div"),
  Cell: () => React.createElement("div"),
  PieChart: ({ children }) =>
    React.createElement("div", { "data-testid": "pie-chart" }, children),
  Pie: () => React.createElement("div"),
  RadarChart: ({ children }) =>
    React.createElement("div", { "data-testid": "radar-chart" }, children),
  Radar: () => React.createElement("div"),
  PolarGrid: () => React.createElement("div"),
  PolarAngleAxis: () => React.createElement("div"),
  PolarRadiusAxis: () => React.createElement("div"),
  ScatterChart: ({ children }) =>
    React.createElement("div", { "data-testid": "scatter-chart" }, children),
  Scatter: () => React.createElement("div"),
  ComposedChart: ({ children }) =>
    React.createElement("div", { "data-testid": "composed-chart" }, children),
  FunnelChart: ({ children }) =>
    React.createElement("div", { "data-testid": "funnel-chart" }, children),
  Funnel: () => React.createElement("div"),
  LabelList: () => React.createElement("div"),
  ReferenceLine: () => React.createElement("div"),
  ReferenceArea: () => React.createElement("div"),
}));

// Global mock for leaflet
vi.mock("leaflet", () => {
  const Default = function () {};
  Default.prototype._getIconUrl = vi.fn();
  Default.mergeOptions = vi.fn();

  const mockLeaflet = {
    Icon: class {
      constructor() {}
      static Default = Default;
    },
    latLngBounds: () => ({
      extend: vi.fn(),
      pad: vi.fn().mockReturnThis(),
    }),
  };
  mockLeaflet.default = mockLeaflet;
  return mockLeaflet;
});

// Global mock for react-leaflet
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) =>
    React.createElement("div", { "data-testid": "map-container" }, children),
  TileLayer: () => React.createElement("div"),
  Marker: ({ children }) =>
    React.createElement("div", { "data-testid": "marker" }, children),
  Circle: ({ children }) =>
    React.createElement("div", { "data-testid": "circle" }, children),
  Popup: ({ children }) =>
    React.createElement("div", { "data-testid": "popup" }, children),
  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }),
  useMapEvents: () => ({}),
}));

// Global mock for AdminLayout
vi.mock("./layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) =>
    React.createElement("div", { "data-testid": "admin-layout" }, children),
}));

// Global mock for react-hot-toast
const mockToast = vi.fn();
mockToast.success = vi.fn();
mockToast.error = vi.fn();
mockToast.loading = vi.fn();
mockToast.dismiss = vi.fn();

vi.mock("react-hot-toast", () => ({
  toast: mockToast,
  default: mockToast,
  Toaster: () => null,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
