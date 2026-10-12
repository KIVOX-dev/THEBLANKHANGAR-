import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { requireUser } from "@/lib/session";
import { getSettings, listAddresses } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=/checkout");

  const [addresses, settings] = await Promise.all([listAddresses(), getSettings()]);

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="text-3xl lg:text-4xl">Checkout</h1>
      <CheckoutFlow
        addresses={addresses.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          line1: a.line1,
          line2: a.line2 ?? "",
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          phone: a.phone,
          isDefault: a.isDefault,
        }))}
        shippingCharge={settings.shippingCharge}
        freeShippingThreshold={settings.freeShippingThreshold}
        taxRatePercent={settings.taxRatePercent}
        paymentProvider={(process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "mock").toUpperCase()}
      />
    </div>
  );
}
