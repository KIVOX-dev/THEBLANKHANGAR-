import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getSettings } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Your Bag",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="text-3xl lg:text-4xl">Your Bag</h1>
      <CartView
        shippingCharge={settings.shippingCharge}
        freeShippingThreshold={settings.freeShippingThreshold}
        taxRatePercent={settings.taxRatePercent}
      />
    </div>
  );
}
