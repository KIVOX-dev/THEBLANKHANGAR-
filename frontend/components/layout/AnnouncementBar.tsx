"use client";

import { useEffect, useState } from "react";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const items = messages.length ? messages : ["Free shipping on orders above ₹1499"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div className="bg-ink text-bone">
      <div className="wrap flex h-9 items-center justify-center overflow-hidden">
        <p key={index} className="eyebrow text-center bh-fade-up">
          {items[index]}
        </p>
      </div>
    </div>
  );
}
