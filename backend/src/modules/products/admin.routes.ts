import { Router } from "express";
import { requireAdmin, requireStaff } from "@/middleware/auth";
import { asyncRoute } from "@/middleware/errorHandler";
import { productSchema, stockUpdateSchema } from "@/validation/product";
import { adminProductQuerySchema } from "@/validation/adminQuery";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductDetail,
  listAdminCategories,
  listAdminProducts,
  updateAdminProduct,
  updateVariantStock,
} from "@/services/adminProducts";

export const adminProductsRouter = Router();
export const adminVariantsRouter = Router();
export const adminCategoriesRouter = Router();

adminProductsRouter.use(requireStaff);

adminProductsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const query = adminProductQuerySchema.parse(req.query);
    res.json(await listAdminProducts(query));
  }),
);

adminProductsRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    res.json(await getAdminProductDetail(String(req.params.id)));
  }),
);

adminProductsRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const staff = req.user!;
    const input = productSchema.parse(req.body);
    const product = await createAdminProduct(staff.id, input);
    res.status(201).json({ product: { id: product.id, slug: product.slug } });
  }),
);

adminProductsRouter.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const staff = req.user!;
    const input = productSchema.parse(req.body);
    const product = await updateAdminProduct(String(req.params.id), staff.id, input);
    res.json({ product });
  }),
);

adminProductsRouter.delete(
  "/:id",
  requireAdmin, // deleting a product is destructive — admins only, staff can archive instead
  asyncRoute(async (req, res) => {
    await deleteAdminProduct(String(req.params.id));
    res.json({ deleted: true });
  }),
);

adminVariantsRouter.use(requireStaff);

/** Manual stock edit. Always writes a StockLog row so every movement is auditable. */
adminVariantsRouter.patch(
  "/:id/stock",
  asyncRoute(async (req, res) => {
    const staff = req.user!;
    const input = stockUpdateSchema.parse(req.body);
    const variant = await updateVariantStock(String(req.params.id), staff.id, input);
    res.json({ variant });
  }),
);

adminCategoriesRouter.get(
  "/",
  requireStaff,
  asyncRoute(async (_req, res) => {
    res.json({ categories: await listAdminCategories() });
  }),
);
