"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";
import { useState, useTransition } from "react";
import { IconHeart, IconHeartFilled } from "@/components/ui/Icons";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { ids, toggle } = useWishlist();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const saved = ids.includes(productId);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      startTransition(() => router.push("/login?callbackUrl=/account/wishlist"));
      return;
    }

    setBusy(true);
    try {
      await toggle(productId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy || pending}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      className={cn(
        "grid h-8 w-8 place-items-center bg-bone/90 text-ink transition-colors hover:bg-bone disabled:opacity-50",
        className,
      )}
    >
      {saved ? <IconHeartFilled className="h-4 w-4 text-rust" /> : <IconHeart className="h-4 w-4" />}
    </button>
  );
}
