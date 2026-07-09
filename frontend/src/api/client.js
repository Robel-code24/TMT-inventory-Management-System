const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Cannot connect to server. Make sure the backend is running on http://localhost:8000",
      0
    );
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(", ")
      : detail || "Something went wrong";
    throw new ApiError(message, response.status);
  }

  return data;
}

// Mock data for when using direct login without backend
const mockData = {
  stats: {
    total_products: 3,
    low_stock_count: 0,
    total_inventory_value: 1596000,
    recent_activity: [
      { id: 1, action: "Added product Fresh Tomatoes", user_name: "Admin User", created_at: new Date().toISOString() },
      { id: 2, action: "Added product Whole Milk", user_name: "Admin User", created_at: new Date().toISOString() },
    ]
  },
  charts: {
    stock_by_category: [
      { category: "Fresh Produce", total_quantity: 100 },
      { category: "Dairy & Refrigerated", total_quantity: 50 },
      { category: "Meat, Poultry & Seafood", total_quantity: 30 },
    ],
    top_products: [
      { name: "Fresh Tomatoes", quantity: 100 },
      { name: "Whole Milk", quantity: 50 },
      { name: "Chicken Breast", quantity: 30 },
    ],
    inventory_value_over_time: [
      { date: "Day 1", value: 760000 },
      { date: "Day 2", value: 950000 },
      { date: "Day 3", value: 1140000 },
      { date: "Day 4", value: 1330000 },
      { date: "Day 5", value: 1596000 },
    ]
  },
  products: [
    { id: 1, name: "Fresh Tomatoes", sku: "FT-001", category_id: 1, supplier_id: 1, unit_price: 9500, quantity_in_stock: 100, reorder_level: 20, description: "Fresh red tomatoes, locally sourced", is_low_stock: false, category_name: "Fresh Produce", supplier_name: "FreshMart Ltd" },
    { id: 2, name: "Whole Milk", sku: "WM-002", category_id: 2, supplier_id: 1, unit_price: 11400, quantity_in_stock: 50, reorder_level: 15, description: "Fresh whole milk 1L, pasteurized", is_low_stock: false, category_name: "Dairy & Refrigerated", supplier_name: "FreshMart Ltd" },
    { id: 3, name: "Chicken Breast", sku: "CB-003", category_id: 3, supplier_id: 2, unit_price: 32300, quantity_in_stock: 30, reorder_level: 10, description: "Fresh chicken breast 1kg, boneless", is_low_stock: false, category_name: "Meat, Poultry & Seafood", supplier_name: "FoodSupply Co" },
  ],
  categories: [
    { id: 1, name: "Fresh Produce", description: "Fresh fruits and vegetables" },
    { id: 2, name: "Dairy & Refrigerated", description: "Dairy products and refrigerated items" },
    { id: 3, name: "Meat, Poultry & Seafood", description: "Fresh and frozen meat, poultry, and seafood" },
    { id: 4, name: "Bakery Items", description: "Bread, pastries, and baked goods" },
    { id: 5, name: "Dry Foods & Grains", description: "Rice, pasta, cereals, and grains" },
    { id: 6, name: "Canned & Packaged Foods", description: "Canned goods and packaged food items" },
    { id: 7, name: "Beverages", description: "Soft drinks, juices, water, and other beverages" },
    { id: 8, name: "Snacks & Candy", description: "Chips, cookies, candy, and confectionery" },
    { id: 9, name: "Cleaning Supplies", description: "Cleaning products and household supplies" },
    { id: 10, name: "Personal Care & Toiletries", description: "Personal hygiene and toiletry items" },
    { id: 11, name: "Baby & Pet Care", description: "Baby products and pet supplies" },
    { id: 12, name: "Prepared Food Ingredients", description: "Pre-cooked and ready-to-use ingredients" },
    { id: 13, name: "Packaging Materials", description: "Packaging supplies and materials" },
  ],
  suppliers: [
    { id: 1, name: "Tech Supplies Ltd", contact: "John Smith", email: "john@techsupplies.com", phone: "+256123456789" },
    { id: 2, name: "Office Depot Uganda", contact: "Sarah Johnson", email: "sarah@officedepot.ug", phone: "+256987654321" },
  ],
  stockTransactions: [
    { id: 1, product_id: 1, product_name: "Wireless Mouse", transaction_type: "in", quantity: 50, user_name: "Admin User", created_at: new Date().toISOString() },
    { id: 2, product_id: 3, product_name: "A4 Paper Ream", transaction_type: "in", quantity: 200, user_name: "Admin User", created_at: new Date().toISOString() },
  ],
  activity: [
    { id: 1, action: "Added product Wireless Mouse", user_name: "Admin User", created_at: new Date().toISOString() },
    { id: 2, action: "Updated stock for USB-C Hub", user_name: "Admin User", created_at: new Date().toISOString() },
  ],
  users: [
    { id: 1, email: "admin@inventory.com", full_name: "Admin User", role: "admin" },
    { id: 2, email: "staff@inventory.com", full_name: "Staff User", role: "staff" },
  ]
};

export const api = {
  login: (email, password) =>
    request("/api/auth/login/json", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request("/api/auth/me"),

  // Users
  getUsers: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.users);
    return request("/api/users/");
  },
  updateUser: (id, data) => request(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
  registerUser: (data) => request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  // Categories
  getCategories: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.categories);
    return request("/api/categories/");
  },
  createCategory: (data) => request("/api/categories/", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),

  // Suppliers
  getSuppliers: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.suppliers);
    return request("/api/suppliers/");
  },
  createSupplier: (data) => request("/api/suppliers/", { method: "POST", body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/api/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/api/suppliers/${id}`, { method: "DELETE" }),

  // Products
  getProducts: (params = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve({
      items: mockData.products,
      total: mockData.products.length,
      page: 1,
      page_size: 10,
      total_pages: 1
    });
    const query = new URLSearchParams(params).toString();
    return request(`/api/products/?${query}`);
  },
  createProduct: (data) => request("/api/products/", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),

  // Stock
  getTransactions: (params = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.stockTransactions);
    const query = new URLSearchParams(params).toString();
    return request(`/api/stock/transactions?${query}`);
  },
  recordTransaction: (data) =>
    request("/api/stock/transactions", { method: "POST", body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.stats);
    return request("/api/dashboard/stats");
  },
  getDashboardCharts: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.charts);
    return request("/api/dashboard/charts");
  },

  // Reports
  getStockMovement: (params = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve([]);
    const query = new URLSearchParams(params).toString();
    return request(`/api/reports/stock-movement?${query}`);
  },
  getLowStock: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.products.filter(p => p.quantity <= p.min_stock));
    return request("/api/reports/low-stock");
  },
  getValuation: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve({ total_inventory_value: 1596000, items: [
      { name: "Fresh Tomatoes", sku: "FT-001", quantity: 100, unit_price: 9500, total_value: 950000 },
      { name: "Whole Milk", sku: "WM-002", quantity: 50, unit_price: 11400, total_value: 570000 },
      { name: "Chicken Breast", sku: "CB-003", quantity: 30, unit_price: 32300, total_value: 969000 },
    ]});
    return request("/api/reports/valuation");
  },

  // Activity
  getActivity: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(mockData.activity);
    return request("/api/activity/");
  },
};

export { API_URL, ApiError };
