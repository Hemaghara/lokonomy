import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

global.React = React;

// Mock window.location
const originalLocation = window.location;
delete window.location;
window.location = Object.defineProperties(
  {},
  {
    ...Object.getOwnPropertyDescriptors(originalLocation),
    href: {
      enumerable: true,
      configurable: true,
      set: vi.fn(),
      get: () => 'http://localhost:3000',
    },
    assign: { value: vi.fn() },
    replace: { value: vi.fn() },
  }
);

// Mock window.URL.createObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'mock-url');
  window.URL.revokeObjectURL = vi.fn();
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Global fetch mock
global.fetch = vi.fn().mockImplementation((url) => {
  if (url.includes('nominatim.openstreetmap.org')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        display_name: 'Test City, State, Country',
        address: { city: 'Test City', state_district: 'Test District', suburb: 'Test Suburb' }
      })
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({})
  });
});

// Mock framer-motion without JSX
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    h1: ({ children, ...props }) => React.createElement('h1', props, children),
    p: ({ children, ...props }) => React.createElement('p', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    section: ({ children, ...props }) => React.createElement('section', props, children),
    header: ({ children, ...props }) => React.createElement('header', props, children),
    nav: ({ children, ...props }) => React.createElement('nav', props, children),
    ul: ({ children, ...props }) => React.createElement('ul', props, children),
    li: ({ children, ...props }) => React.createElement('li', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
    a: ({ children, ...props }) => React.createElement('a', props, children),
    img: (props) => React.createElement('img', props),
    form: ({ children, ...props }) => React.createElement('form', props, children),
    table: ({ children, ...props }) => React.createElement('table', props, children),
    tr: ({ children, ...props }) => React.createElement('tr', props, children),
    td: ({ children, ...props }) => React.createElement('td', props, children),
    th: ({ children, ...props }) => React.createElement('th', props, children),
    tbody: ({ children, ...props }) => React.createElement('tbody', props, children),
    thead: ({ children, ...props }) => React.createElement('thead', props, children),
    article: ({ children, ...props }) => React.createElement('article', props, children),
    aside: ({ children, ...props }) => React.createElement('aside', props, children),
    main: ({ children, ...props }) => React.createElement('main', props, children),
    footer: ({ children, ...props }) => React.createElement('footer', props, children),
  },
  AnimatePresence: ({ children }) => children,
  useScroll: () => ({ scrollYProgress: { onChange: vi.fn() } }),
  useTransform: () => ({}),
  useSpring: () => ({}),
  useInView: () => true,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

// Mock SVG elements that cause warnings in JSDOM
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createElement: (type, props, ...children) => {
      if (['stop', 'linearGradient', 'defs', 'svg', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'text', 'tspan'].includes(type)) {
        return actual.createElement('div', { ...props, 'data-svg-tag': type }, ...children);
      }
      return actual.createElement(type, props, ...children);
    }
  };
});

// Consolidated Services Mock
vi.mock('./services', async (importOriginal) => {
  const actual = await importOriginal().catch(() => ({}));
  
  return {
    ...actual,
    authService: { 
      login: vi.fn(), 
      register: vi.fn(), 
      logout: vi.fn(), 
      getProfile: vi.fn().mockResolvedValue({ data: {} }),
      updateProfile: vi.fn().mockResolvedValue({ data: {} }),
    },
    businessService: { 
      getBusinesses: vi.fn().mockResolvedValue({ data: [] }), 
      getBusinessById: vi.fn().mockResolvedValue({ data: {} }), 
      incrementVisits: vi.fn().mockResolvedValue({ data: { success: true } }), 
      addReview: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    adminService: { 
      getDashboardStats: vi.fn().mockResolvedValue({ data: {} }), 
      getUsers: vi.fn().mockResolvedValue({ data: { users: [], total: 0, totalPages: 0 } }), 
      getBusinesses: vi.fn().mockResolvedValue({ data: { businesses: [], total: 0, totalPages: 0 } }),
      getBusinessReviews: vi.fn().mockResolvedValue({ data: { reviews: [], pages: 1 } }),
      getProductReviews: vi.fn().mockResolvedValue({ data: { reviews: [], pages: 1 } }),
      getCampaigns: vi.fn().mockResolvedValue({ data: [] }),
      getHeatmapData: vi.fn().mockResolvedValue({ data: { dates: [] } }),
      updateProfile: vi.fn().mockResolvedValue({ data: {} }),
      getAllReferrals: vi.fn().mockResolvedValue({ data: { referrals: [], pagination: { pages: 1, total: 0 }, stats: {} } }),
      getTopReferrers: vi.fn().mockResolvedValue({ data: { topReferrers: [] } }),
      getReferralLeaderboard: vi.fn().mockResolvedValue({ data: { leaderboard: [], pagination: { pages: 1 } } }),
      getMarketOrders: vi.fn().mockResolvedValue({ data: { orders: [], totalPages: 1, totalOrders: 0 } }),
      updateOrderStatus: vi.fn().mockResolvedValue({ data: {} }),
      deleteContent: vi.fn().mockResolvedValue({ data: {} }),
      updateUserStatus: vi.fn().mockResolvedValue({ data: {} }),
      impersonateUser: vi.fn().mockResolvedValue({ data: { token: 'mock-token', user: {} } }),
      exportUsersCSV: vi.fn().mockResolvedValue({ data: 'mock-csv' }),
      bulkUpdateUserStatus: vi.fn().mockResolvedValue({ data: { message: 'Success' } }),
      getStoryDetails: vi.fn().mockResolvedValue({ data: {} }),
      deleteStory: vi.fn().mockResolvedValue({ data: { success: true } }),
      getRewardsStats: vi.fn().mockResolvedValue({ data: { stats: {} } }),
      getLoyaltyBalances: vi.fn().mockResolvedValue({ data: { users: [] } }),
      getRedemptionHistory: vi.fn().mockResolvedValue({ data: { history: [] } }),
      updateLoyaltyPoints: vi.fn().mockResolvedValue({ data: { success: true } }),
      getCoupons: vi.fn().mockResolvedValue({ data: { coupons: [], stats: {} } }),
      createCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
      updateCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
      deleteCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
      toggleCouponStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    wishlistService: { 
      getWishlist: vi.fn().mockResolvedValue({ data: [] }), 
      addToWishlist: vi.fn().mockResolvedValue({ data: {} }),
      removeFromWishlist: vi.fn().mockResolvedValue({ data: {} }),
      checkStatus: vi.fn().mockResolvedValue({ data: { inWishlist: false } }),
    },
    subscriptionService: { 
      getPlanLimits: vi.fn().mockResolvedValue({ data: {} }),
      getCurrentSubscription: vi.fn().mockResolvedValue({ data: {} }),
      upgradePlan: vi.fn().mockResolvedValue({ data: {} }),
      logFailedPayment: vi.fn().mockResolvedValue({ data: {} }),
    },
    storyService: { 
      getStories: vi.fn().mockResolvedValue({ data: { data: [] } }),
      getStoryById: vi.fn().mockResolvedValue({ data: { data: {} } }),
      createStory: vi.fn().mockResolvedValue({ data: { success: true } }),
      getHighlights: vi.fn().mockResolvedValue({ data: { data: [] } }),
      deleteStory: vi.fn().mockResolvedValue({ data: { success: true } }),
      likeStory: vi.fn().mockResolvedValue({ data: { success: true } }),
      shareStory: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    aiService: { 
      analyzeBusiness: vi.fn().mockResolvedValue({ data: { analysis: 'Mock analysis' } }),
      getBusinessInsights: vi.fn().mockResolvedValue({ data: { insights: [] } }),
      generateDescription: vi.fn().mockResolvedValue({ data: { description: 'Mock description' } }),
    },
    jobService: { 
      getJobs: vi.fn().mockResolvedValue({ data: [] }),
      getJobById: vi.fn().mockResolvedValue({ data: {} }),
    },
    marketService: { 
      getProducts: vi.fn().mockResolvedValue({ data: [] }),
      getProductById: vi.fn().mockResolvedValue({ data: {} }),
    },
    orderService: { 
      getUserOrders: vi.fn().mockResolvedValue({ data: [] }),
      getOrderById: vi.fn().mockResolvedValue({ data: {} }),
    },
    feedService: { 
      getFeeds: vi.fn().mockResolvedValue({ data: [] }),
      getFeedById: vi.fn().mockResolvedValue({ data: {} }),
    },
    chatService: { 
      getConversations: vi.fn().mockResolvedValue({ data: [] }),
      getConversationById: vi.fn().mockResolvedValue({ data: {} }),
      sendMessage: vi.fn().mockResolvedValue({ data: {} }),
    },
    notificationService: { 
      getNotifications: vi.fn().mockResolvedValue({ data: [] }), 
      markAsRead: vi.fn().mockResolvedValue({ data: {} }),
    },
    growthService: { 
      getGrowthStats: vi.fn().mockResolvedValue({ data: {} }),
      getCoupons: vi.fn().mockResolvedValue({ data: [] }),
      createCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
      updateCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
      deleteCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
      redeemCoupon: vi.fn().mockResolvedValue({ data: { success: true, message: 'Coupon redeemed' } }),
      getBookings: vi.fn().mockResolvedValue({ data: [] }),
      getActiveCoupons: vi.fn().mockResolvedValue({ data: [] }),
    },
    qaService: { getQuestions: vi.fn().mockResolvedValue({ data: [] }) },
    referralService: { getReferrals: vi.fn().mockResolvedValue({ data: [] }) },
    rewardsService: { getRewards: vi.fn().mockResolvedValue({ data: [] }) },
    recommendationService: { 
      trackInteraction: vi.fn().mockResolvedValue({ data: { success: true } }),
      trackView: vi.fn().mockResolvedValue({ data: { success: true } }),
      getRecommendations: vi.fn().mockResolvedValue({ data: [] }),
      getSuggestions: vi.fn().mockResolvedValue({ data: [] }),
    },
  };
});

// Global mock for socket service - prevents real WebSocket connections
vi.mock('./services/socket', () => ({
  connectSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
  disconnectSocket: vi.fn(),
}));

// Global mock for recharts to avoid canvas/SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  AreaChart: ({ children }) => React.createElement('div', { 'data-testid': 'area-chart' }, children),
  Area: () => React.createElement('div'),
  BarChart: ({ children }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  Bar: () => React.createElement('div'),
  LineChart: ({ children }) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
  Line: () => React.createElement('div'),
  ResponsiveContainer: ({ children }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  Tooltip: () => React.createElement('div'),
  XAxis: () => React.createElement('div'),
  YAxis: () => React.createElement('div'),
  CartesianGrid: () => React.createElement('div'),
  Legend: () => React.createElement('div'),
  Cell: () => React.createElement('div'),
  PieChart: ({ children }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  Pie: () => React.createElement('div'),
  RadarChart: ({ children }) => React.createElement('div', { 'data-testid': 'radar-chart' }, children),
  Radar: () => React.createElement('div'),
  PolarGrid: () => React.createElement('div'),
  PolarAngleAxis: () => React.createElement('div'),
  PolarRadiusAxis: () => React.createElement('div'),
  ScatterChart: ({ children }) => React.createElement('div', { 'data-testid': 'scatter-chart' }, children),
  Scatter: () => React.createElement('div'),
  ComposedChart: ({ children }) => React.createElement('div', { 'data-testid': 'composed-chart' }, children),
  FunnelChart: ({ children }) => React.createElement('div', { 'data-testid': 'funnel-chart' }, children),
  Funnel: () => React.createElement('div'),
  LabelList: () => React.createElement('div'),
  ReferenceLine: () => React.createElement('div'),
  ReferenceArea: () => React.createElement('div'),
}));

// Global mock for leaflet
vi.mock('leaflet', () => {
  const Default = function() {};
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
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
  TileLayer: () => React.createElement('div'),
  Marker: ({ children }) => React.createElement('div', { 'data-testid': 'marker' }, children),
  Circle: ({ children }) => React.createElement('div', { 'data-testid': 'circle' }, children),
  Popup: ({ children }) => React.createElement('div', { 'data-testid': 'popup' }, children),
  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }),
  useMapEvents: () => ({}),
}));

// Global mock for AdminLayout
vi.mock('./layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => React.createElement('div', { 'data-testid': 'admin-layout' }, children),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
