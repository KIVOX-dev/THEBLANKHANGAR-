import "server-only";
import { backendFetch, authedBackendFetch } from "@/lib/backend";
import { assetUrl, assetUrls } from "@/lib/assets";
import type {
  NavCategory,
  ProductCardData,
  ProductDetailData,
  ReviewItem,
} from "@/types/catalog";
import type { OrderStatus, PaymentStatus } from "@/types/enums";

/**
 * Server-only fetch wrapper for Server Components / route handlers that need data from the
 * backend API. Function names mirror what the old direct-Prisma service calls looked like, so
 * page rendering logic barely changed — only the data-fetching line did.
 *
 * Uploaded/seeded imagery is served by the backend at its own origin, so every image path
 * coming back from the API is rewritten to an absolute URL here — once, centrally — rather
 * than at each of the many places a component renders one.
 */

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Backend request failed: ${res.status}`);
  return res.json();
}

function withCategoryImage(category: NavCategory): NavCategory {
  return { ...category, image: category.image ? assetUrl(category.image) : null };
}

function withCardImages(product: ProductCardData): ProductCardData {
  return { ...product, images: assetUrls(product.images) };
}

function withDetailImages(product: ProductDetailData): ProductDetailData {
  return { ...product, images: assetUrls(product.images) };
}

function withItemImage<T extends { productImage: string | null }>(item: T): T {
  return { ...item, productImage: item.productImage ? assetUrl(item.productImage) : null };
}

// ---------------------------------------------------------------------------
// Catalog (public)
// ---------------------------------------------------------------------------

export async function getNavCategories(): Promise<NavCategory[]> {
  const data = await json<{ categories: NavCategory[] }>(await backendFetch("/api/categories"));
  return data.categories.map(withCategoryImage);
}

export type Settings = {
  shippingCharge: number;
  freeShippingThreshold: number;
  taxRatePercent: number;
  lowStockThreshold: number;
  storeEmail: string;
  storePhone: string;
  announcementMessages: string[];
  heroBanners: {
    id: string;
    title: string;
    subtitle: string | null;
    cta: string | null;
    href: string;
    image: string;
    sortOrder: number;
    darkBackground: boolean;
  }[];
};

/**
 * Returns settings with image paths exactly as stored (relative) — this is also used to
 * populate the admin settings form, where absolute URLs would get baked into a save. Use
 * `assetUrl()` at the actual display site (e.g. the home page hero) instead.
 */
export async function getSettings(): Promise<Settings> {
  const data = await json<{ settings: Settings }>(await backendFetch("/api/settings"));
  return data.settings;
}

export async function getProductCards(
  filters: { isNewArrival?: boolean; isBestseller?: boolean; categorySlug?: string; excludeId?: string },
  options: { take?: number } = {},
): Promise<ProductCardData[]> {
  const params = new URLSearchParams();
  if (filters.isNewArrival) params.set("isNewArrival", "1");
  if (filters.isBestseller) params.set("isBestseller", "1");
  if (filters.categorySlug) params.set("category", filters.categorySlug);
  if (filters.excludeId) params.set("excludeId", filters.excludeId);
  if (options.take) params.set("take", String(options.take));

  const data = await json<{ products: ProductCardData[] }>(
    await backendFetch(`/api/products?${params.toString()}`),
  );
  return data.products.map(withCardImages);
}

export type SearchResult = {
  products: ProductCardData[];
  total: number;
  hasMore: boolean;
  skip: number;
  take: number;
};

/** Mirrors the backend's searchProducts(query, categorySlug) — used by the collection page. */
export async function searchProducts(
  query: Record<string, string | string[] | undefined>,
  categorySlug?: string,
): Promise<SearchResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, value);
  }
  if (categorySlug) params.set("category", categorySlug);

  const data = await json<SearchResult>(await backendFetch(`/api/products?${params.toString()}`));
  return { ...data, products: data.products.map(withCardImages) };
}

export async function getProductDetail(slug: string): Promise<ProductDetailData | null> {
  const res = await backendFetch(`/api/products/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  const data = await json<{ product: ProductDetailData }>(res);
  return withDetailImages(data.product);
}

export async function getProductReviews(
  productId: string,
): Promise<{ items: ReviewItem[]; count: number; average: number }> {
  return json(await backendFetch(`/api/products/${encodeURIComponent(productId)}/reviews`));
}

export async function getCategoryBySlug(slug: string): Promise<NavCategory | null> {
  if (slug === "all") {
    return {
      id: "all",
      name: "Shop All",
      slug: "all",
      image: null,
      comingSoon: false,
      description: "Every piece currently in the hangar.",
    };
  }
  const categories = await getNavCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export type SitemapEntry = { slug: string; updatedAt: string };

export async function getSitemapEntries(): Promise<{
  products: SitemapEntry[];
  categories: SitemapEntry[];
}> {
  return json(await backendFetch("/api/sitemap"));
}

// ---------------------------------------------------------------------------
// Account (authenticated, own data)
// ---------------------------------------------------------------------------

export type AddressRecord = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

export async function listAddresses(): Promise<AddressRecord[]> {
  const data = await json<{ addresses: AddressRecord[] }>(
    await authedBackendFetch("/api/addresses"),
  );
  return data.addresses;
}

export type AccountOverview = {
  profile: { name: string; email: string; phone: string | null; createdAt: string } | null;
  orders: OrderSummary[];
  addressCount: number;
  wishlistCount: number;
};

export async function getAccountOverview(): Promise<AccountOverview> {
  return json(await authedBackendFetch("/api/account/overview"));
}

export async function getWishlistProducts(): Promise<ProductCardData[]> {
  const data = await json<{ products: ProductCardData[] }>(
    await authedBackendFetch("/api/wishlist/products"),
  );
  return data.products.map(withCardImages);
}

export type OrderItemRecord = {
  id: string;
  productTitle: string;
  variantSize: string;
  variantColor: string | null;
  productImage: string | null;
  productSlug: string;
  quantity: number;
  priceAtPurchase: number;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  items: OrderItemRecord[];
};

export async function listOrdersForUser(): Promise<OrderSummary[]> {
  const data = await json<{ orders: OrderSummary[] }>(await authedBackendFetch("/api/orders"));
  return data.orders.map((o) => ({ ...o, items: o.items.map(withItemImage) }));
}

export type OrderDetail = OrderSummary & {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  couponCode: string | null;
  paymentMethod: string;
  paymentReference: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  statusHistory: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
};

export async function getOrderForUser(orderNumber: string): Promise<OrderDetail | null> {
  const res = await authedBackendFetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
  if (res.status === 404) return null;
  const data = await json<{ order: OrderDetail }>(res);
  return { ...data.order, items: data.order.items.map(withItemImage) };
}
