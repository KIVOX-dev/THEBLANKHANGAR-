import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { WishlistSync } from "@/components/product/WishlistSync";
import { getNavCategories, getSettings } from "@/lib/api-client";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, settings] = await Promise.all([getNavCategories(), getSettings()]);

  return (
    <>
      <AnnouncementBar messages={settings.announcementMessages} />
      <Header categories={categories} />

      {/* pb-16 clears the mobile tab bar */}
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>

      <Footer
        categories={categories}
        storeEmail={settings.storeEmail}
        storePhone={settings.storePhone}
      />

      <MobileTabBar />
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
      <WishlistSync />
    </>
  );
}
