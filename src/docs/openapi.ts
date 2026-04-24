export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Coffee Shop POS API",
    version: "1.0.0",
    description: "REST API modular untuk sistem POS coffee shop.",
  },
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Categories" },
    { name: "Products" },
    { name: "Modifiers" },
    { name: "Ingredients" },
    { name: "Recipes" },
    { name: "Inventory" },
    { name: "Orders" },
    { name: "Payments" },
    { name: "Receipts" },
    { name: "Reports" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List products",
      },
      post: {
        tags: ["Products"],
        summary: "Create product",
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "List orders",
      },
      post: {
        tags: ["Orders"],
        summary: "Create draft order",
      },
    },
    "/api/payments/orders/{orderId}/cash": {
      post: {
        tags: ["Payments"],
        summary: "Pay order with cash",
      },
    },
    "/api/payments/orders/{orderId}/qris": {
      post: {
        tags: ["Payments"],
        summary: "Create mock QRIS payment",
      },
    },
    "/api/receipts/public/{token}": {
      get: {
        tags: ["Receipts"],
        summary: "Get public receipt",
        security: [],
      },
    },
    "/api/reports/sales-summary": {
      get: {
        tags: ["Reports"],
        summary: "Get sales summary",
      },
    },
  },
};
