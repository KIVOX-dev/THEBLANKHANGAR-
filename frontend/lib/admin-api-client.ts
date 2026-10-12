import "server-only";
import { authedBackendFetch } from "@/lib/backend";
import type { OrderStatus, PaymentStatus, ProductStatus } from "@/types/enums";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Backend request failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type DashboardData = {
  kpis: {
    totalOrders: number;
    revenue: number;
    pendingOrders: number;
    lowStockCount: number;
    customerCount: number;
    liveProducts: number;
  };
  salesSeries: { date: string; label: string; revenue: number; orders: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    createdAt: string;
    user: { name: string };
    items: { id: string }[];
  }[];
  lowStockVariants: {
    id: string;
    sku: string;
    size: string;
    stock: number;
    productId: string;
    productTitle: string;
    isOut: boolean;
  }[];
  lowStockThreshold: number;
};

export async function getDashboardData(): Promise<DashboardData> {
  return json(await authedBackendFetch("/api/admin/dashboard"));
}

// ---------------------------------------------------------------------------
// Products — image fields here are left as raw relative paths (not `assetUrl`-prefixed):
// these DTOs feed the admin product form, which round-trips `images` straight back into a
// save. Apply `assetUrl()` at the actual `<Image>` render site instead.
// ---------------------------------------------------------------------------

export type AdminVariant = {
  id: string;
  size: string;
  color: string | null;
  colorHex: string | null;
  sku: string;
  stock: number;
  priceOverride: number | null;
  state: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
};

export type AdminProductListItem = {
  id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  images: string[];
  basePrice: number;
  mrp: number;
  fit: string | null;
  type: string | null;
  category: { name: string };
  variants: AdminVariant[];
};

export async function getAdminProducts(
  searchParams: Record<string, string | undefined>,
): Promise<{
  products: AdminProductListItem[];
  categories: { name: string; slug: string }[];
  lowStockThreshold: number;
  total: number;
  page: number;
  pageCount: number;
}> {
  const params = new URLSearchParams(
    Object.entries(searchParams).filter((e): e is [string, string] => e[1] !== undefined),
  );
  return json(await authedBackendFetch(`/api/admin/products?${params.toString()}`));
}

export type AdminProductDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  fit: string | null;
  type: string | null;
  fabric: string | null;
  careInstructions: string | null;
  basePrice: number;
  mrp: number;
  images: string[];
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  variants: {
    id: string;
    size: string;
    color: string | null;
    colorHex: string | null;
    sku: string;
    stock: number;
    priceOverride: number | null;
  }[];
};

export type StockLogEntry = {
  id: string;
  delta: number;
  stockAfter: number;
  reason: string;
  source: string;
  size: string;
  sku: string;
  adminName: string | null;
  createdAt: string;
};

export async function getAdminProduct(id: string): Promise<{
  product: AdminProductDetail;
  categories: { id: string; name: string }[];
  stockLogs: StockLogEntry[];
} | null> {
  const res = await authedBackendFetch(`/api/admin/products/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  return json(res);
}

export async function getAdminCategories(): Promise<{ id: string; name: string }[]> {
  const data = await json<{ categories: { id: string; name: string }[] }>(
    await authedBackendFetch("/api/admin/categories"),
  );
  return data.categories;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  user: { name: string; email: string };
  items: { id: string; quantity: number }[];
};

export async function getAdminOrders(
  searchParams: Record<string, string | undefined>,
): Promise<{ orders: AdminOrderListItem[]; total: number; page: number; pageCount: number }> {
  const params = new URLSearchParams(
    Object.entries(searchParams).filter((e): e is [string, string] => e[1] !== undefined),
  );
  return json(await authedBackendFetch(`/api/admin/orders?${params.toString()}`));
}

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentReference: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: {
    id: string;
    productTitle: string;
    productImage: string | null;
    productSlug: string;
    variantSize: string;
    variantColor: string | null;
    quantity: number;
    priceAtPurchase: number;
  }[];
  statusHistory: {
    id: string;
    status: OrderStatus;
    note: string | null;
    createdAt: string;
    changedByAdmin: { name: string } | null;
  }[];
};

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const res = await authedBackendFetch(`/api/admin/orders/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  const data = await json<{ order: AdminOrderDetail }>(res);
  return data.order;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type AdminCustomerListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  lifetimeSpend: number;
};

export async function getAdminCustomers(
  searchParams: Record<string, string | undefined>,
): Promise<{ customers: AdminCustomerListItem[]; total: number; page: number; pageCount: number }> {
  const params = new URLSearchParams(
    Object.entries(searchParams).filter((e): e is [string, string] => e[1] !== undefined),
  );
  return json(await authedBackendFetch(`/api/admin/customers?${params.toString()}`));
}

export type AdminCustomerDetail = {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    addresses: {
      id: string;
      fullName: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      pincode: string;
      phone: string;
      isDefault: boolean;
    }[];
    orders: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      total: number;
      createdAt: string;
      items: { id: string }[];
    }[];
  };
  lifetimeSpend: number;
};

export async function getAdminCustomer(id: string): Promise<AdminCustomerDetail | null> {
  const res = await authedBackendFetch(`/api/admin/customers/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  return json(res);
}
