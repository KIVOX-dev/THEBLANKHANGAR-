import { Router } from "express";
import { requireStaff } from "@/middleware/auth";
import { asyncRoute } from "@/middleware/errorHandler";
import { adminCustomerQuerySchema } from "@/validation/adminQuery";
import { getAdminCustomerDetail, listAdminCustomers } from "@/services/adminCustomers";

export const adminCustomersRouter = Router();

adminCustomersRouter.use(requireStaff);

adminCustomersRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const query = adminCustomerQuerySchema.parse(req.query);
    res.json(await listAdminCustomers(query));
  }),
);

adminCustomersRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    res.json(await getAdminCustomerDetail(String(req.params.id)));
  }),
);
