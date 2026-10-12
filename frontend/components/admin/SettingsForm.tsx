"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconSpinner } from "@/components/ui/Icons";

type HeroBannerDraft = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  sortOrder: number;
  darkBackground: boolean;
};

type SettingsDraft = {
  shippingCharge: number;
  freeShippingThreshold: number;
  taxRatePercent: number;
  lowStockThreshold: number;
  storeEmail: string;
  storePhone: string;
  announcementMessages: string[];
  heroBanners: HeroBannerDraft[];
};

export function SettingsForm({ initial }: { initial: SettingsDraft }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="border border-line bg-white p-5">
        <h2 className="mb-4 text-base">Shipping & Tax</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="shippingCharge"
            label="Shipping charge (₹)"
            value={form.shippingCharge}
            onChange={(v) => set("shippingCharge", v)}
          />
          <NumberField
            id="freeShippingThreshold"
            label="Free shipping above (₹)"
            value={form.freeShippingThreshold}
            onChange={(v) => set("freeShippingThreshold", v)}
          />
          <NumberField
            id="taxRatePercent"
            label="Tax rate (%)"
            value={form.taxRatePercent}
            onChange={(v) => set("taxRatePercent", v)}
          />
          <NumberField
            id="lowStockThreshold"
            label="Low-stock threshold"
            value={form.lowStockThreshold}
            onChange={(v) => set("lowStockThreshold", v)}
          />
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Lowering the threshold instantly reclassifies every variant&apos;s stock badge on the
          storefront — no code change.
        </p>
      </section>

      <section className="border border-line bg-white p-5">
        <h2 className="mb-4 text-base">Store Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="storeEmail" className="label">
              Support email
            </label>
            <input
              id="storeEmail"
              type="email"
              value={form.storeEmail}
              onChange={(e) => set("storeEmail", e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="storePhone" className="label">
              Support phone
            </label>
            <input
              id="storePhone"
              value={form.storePhone}
              onChange={(e) => set("storePhone", e.target.value)}
              className="field"
            />
          </div>
        </div>
      </section>

      <section className="border border-line bg-white p-5">
        <h2 className="mb-1 text-base">Announcement Bar</h2>
        <p className="mb-4 text-xs text-ink-muted">One message per line. Rotates automatically.</p>
        <textarea
          value={form.announcementMessages.join("\n")}
          onChange={(e) => set("announcementMessages", e.target.value.split("\n"))}
          rows={4}
          className="field resize-y"
        />
      </section>

      <section className="border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base">Hero Banners</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Home page carousel, editable without a redeploy.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              set("heroBanners", [
                ...form.heroBanners,
                {
                  id: `hero-${Date.now()}`,
                  title: "",
                  subtitle: "",
                  cta: "",
                  href: "/collections/t-shirts",
                  image: "",
                  sortOrder: form.heroBanners.length + 1,
                  darkBackground: true,
                },
              ])
            }
            className="btn btn-outline px-4 py-2 text-[10px]"
          >
            + Add Banner
          </button>
        </div>

        <div className="space-y-4">
          {form.heroBanners.map((banner, i) => (
            <div key={banner.id} className="grid gap-3 border border-line p-4 sm:grid-cols-2">
              <input
                value={banner.title}
                onChange={(e) =>
                  set(
                    "heroBanners",
                    form.heroBanners.map((b, idx) => (idx === i ? { ...b, title: e.target.value } : b)),
                  )
                }
                placeholder="Title"
                className="field"
              />
              <input
                value={banner.subtitle}
                onChange={(e) =>
                  set(
                    "heroBanners",
                    form.heroBanners.map((b, idx) => (idx === i ? { ...b, subtitle: e.target.value } : b)),
                  )
                }
                placeholder="Subtitle"
                className="field"
              />
              <input
                value={banner.cta}
                onChange={(e) =>
                  set(
                    "heroBanners",
                    form.heroBanners.map((b, idx) => (idx === i ? { ...b, cta: e.target.value } : b)),
                  )
                }
                placeholder="Button text"
                className="field"
              />
              <input
                value={banner.href}
                onChange={(e) =>
                  set(
                    "heroBanners",
                    form.heroBanners.map((b, idx) => (idx === i ? { ...b, href: e.target.value } : b)),
                  )
                }
                placeholder="/collections/t-shirts"
                className="field"
              />
              <input
                value={banner.image}
                onChange={(e) =>
                  set(
                    "heroBanners",
                    form.heroBanners.map((b, idx) => (idx === i ? { ...b, image: e.target.value } : b)),
                  )
                }
                placeholder="/uploads/seed/hero-example.svg"
                className="field sm:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={banner.darkBackground}
                  onChange={(e) =>
                    set(
                      "heroBanners",
                      form.heroBanners.map((b, idx) =>
                        idx === i ? { ...b, darkBackground: e.target.checked } : b,
                      ),
                    )
                  }
                  className="h-4 w-4 accent-ink"
                />
                Dark background image (use light text over it)
              </label>
              <button
                type="button"
                onClick={() => set("heroBanners", form.heroBanners.filter((_, idx) => idx !== i))}
                className="text-left text-xs uppercase tracking-widest text-ink-muted hover:text-rust sm:col-span-2"
              >
                Remove banner
              </button>
            </div>
          ))}

          {form.heroBanners.length === 0 && (
            <p className="border border-dashed border-line py-6 text-center text-sm text-ink-muted">
              No banners yet — the hero section will be hidden on the storefront.
            </p>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-olive-deep">Settings saved.</p>}

      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? (
          <>
            <IconSpinner className="h-4 w-4" />
            Saving
          </>
        ) : (
          "Save Settings"
        )}
      </button>
    </form>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="field"
      />
    </div>
  );
}
