import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/api-client";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin");

  const settings = await getSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Changes apply to the storefront immediately — no redeploy needed.
        </p>
      </header>

      <SettingsForm
        initial={{
          shippingCharge: settings.shippingCharge,
          freeShippingThreshold: settings.freeShippingThreshold,
          taxRatePercent: settings.taxRatePercent,
          lowStockThreshold: settings.lowStockThreshold,
          storeEmail: settings.storeEmail,
          storePhone: settings.storePhone,
          announcementMessages: settings.announcementMessages,
          heroBanners: settings.heroBanners.map((b) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle ?? "",
            cta: b.cta ?? "",
            href: b.href,
            image: b.image,
            sortOrder: b.sortOrder,
            darkBackground: b.darkBackground,
          })),
        }}
      />
    </div>
  );
}
