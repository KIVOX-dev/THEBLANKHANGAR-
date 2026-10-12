import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listAddresses } from "@/lib/api-client";
import { AddressBook } from "@/components/account/AddressBook";

export const metadata: Metadata = {
  title: "Saved Addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await requireUser();
  if (!user) return null;

  const addresses = await listAddresses();

  return (
    <div>
      <h2 className="text-xl">Saved Addresses</h2>
      <AddressBook
        initialAddresses={addresses.map((a) => ({
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
      />
    </div>
  );
}
