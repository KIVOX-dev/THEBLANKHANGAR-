"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FITS, PRODUCT_TYPES, SIZES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { assetUrl } from "@/lib/assets";
import { IconSpinner } from "@/components/ui/Icons";

export type VariantDraft = {
  id?: string;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  stock: number;
  priceOverride: number | null;
};

export type ProductDraft = {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  fit: string;
  type: string;
  fabric: string;
  careInstructions: string;
  basePrice: number;
  mrp: number;
  images: string[];
  status: "DRAFT" | "LIVE" | "ARCHIVED";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  variants: VariantDraft[];
};

const BLANK: ProductDraft = {
  title: "",
  slug: "",
  description: "",
  categoryId: "",
  fit: "",
  type: "",
  fabric: "",
  careInstructions: "",
  basePrice: 0,
  mrp: 0,
  images: [],
  status: "DRAFT",
  isFeatured: false,
  isNewArrival: false,
  isBestseller: false,
  variants: [],
};

export function ProductForm({
  productId,
  initial,
  categories,
}: {
  productId?: string;
  initial?: ProductDraft;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductDraft>(
    initial ?? { ...BLANK, categoryId: categories[0]?.id ?? "" },
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function addVariant(size?: string) {
    const nextSize = size ?? SIZES.find((s) => !form.variants.some((v) => v.size === s)) ?? "";
    if (!nextSize) return;
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        {
          size: nextSize,
          color: f.variants[0]?.color ?? "",
          colorHex: f.variants[0]?.colorHex ?? "",
          sku: `BH-${(f.slug || "NEW").toUpperCase().replace(/-/g, "").slice(0, 10)}-${nextSize}`,
          stock: 0,
          priceOverride: null,
        },
      ],
    }));
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not upload that image.");
        return;
      }
      set("images", [...form.images, data.url]);
    } catch {
      setError("Could not upload that image.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save this product.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Could not save this product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="border border-line bg-white p-5">
        <h2 className="mb-4 text-base">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="title"
            label="Title"
            value={form.title}
            error={fieldErrors.title}
            required
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({
                ...f,
                title,
                // Auto-derive the slug until it's been edited by hand.
                slug: !productId && (!f.slug || f.slug === slugify(f.title)) ? slugify(title) : f.slug,
              }));
            }}
          />
          <Field
            id="slug"
            label="Slug"
            value={form.slug}
            error={fieldErrors.slug}
            required
            onChange={(e) => set("slug", e.target.value)}
          />

          <div className="sm:col-span-2">
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              required
              className="field resize-y"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-rust">{fieldErrors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="categoryId" className="label">
              Category
            </label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="field"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <p className="mt-1 text-xs text-rust">{fieldErrors.categoryId}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="label">
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as ProductDraft["status"])}
              className="field"
            >
              <option value="DRAFT">Draft</option>
              <option value="LIVE">Live</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label htmlFor="fit" className="label">
              Fit
            </label>
            <input
              id="fit"
              list="fit-options"
              value={form.fit}
              onChange={(e) => set("fit", e.target.value)}
              className="field"
            />
            <datalist id="fit-options">
              {FITS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="type" className="label">
              Type
            </label>
            <input
              id="type"
              list="type-options"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="field"
            />
            <datalist id="type-options">
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <Field
            id="basePrice"
            label="Selling price (₹)"
            type="number"
            min={0}
            value={form.basePrice}
            error={fieldErrors.basePrice}
            required
            onChange={(e) => set("basePrice", Number(e.target.value))}
          />
          <Field
            id="mrp"
            label="MRP (₹)"
            type="number"
            min={0}
            value={form.mrp}
            error={fieldErrors.mrp}
            required
            onChange={(e) => set("mrp", Number(e.target.value))}
          />

          <Field
            id="fabric"
            label="Fabric"
            value={form.fabric}
            onChange={(e) => set("fabric", e.target.value)}
          />

          <div className="sm:col-span-2">
            <label htmlFor="care" className="label">
              Care instructions
            </label>
            <textarea
              id="care"
              value={form.careInstructions}
              onChange={(e) => set("careInstructions", e.target.value)}
              rows={2}
              className="field resize-y"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-5 border-t border-line pt-4">
          <Toggle
            label="Featured"
            checked={form.isFeatured}
            onChange={(v) => set("isFeatured", v)}
          />
          <Toggle
            label="New arrival"
            checked={form.isNewArrival}
            onChange={(v) => set("isNewArrival", v)}
          />
          <Toggle
            label="Bestseller"
            checked={form.isBestseller}
            onChange={(v) => set("isBestseller", v)}
          />
        </div>
      </section>

      <section className="border border-line bg-white p-5">
        <h2 className="mb-1 text-base">Images</h2>
        <p className="mb-4 text-xs text-ink-muted">
          First image is the primary; the second shows on card hover.
        </p>

        {form.images.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {form.images.map((src, i) => (
              <div key={src} className="relative">
                <div className="relative h-32 w-26 overflow-hidden border border-line bg-bone-deep" style={{ width: 104 }}>
                  <Image src={assetUrl(src)} alt="" fill sizes="104px" className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                  className="mt-1 w-full text-[10px] uppercase tracking-widest text-ink-muted hover:text-rust"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="upload" className="label">
              Upload an image
            </label>
            <input
              id="upload"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
              className="field"
            />
            {uploading && <p className="mt-1 text-xs text-ink-muted">Uploading…</p>}
          </div>

          <div>
            <label htmlFor="imageUrl" className="label">
              …or paste an image path
            </label>
            <div className="flex gap-2">
              <input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/uploads/seed/example.svg"
                className="field"
              />
              <button
                type="button"
                onClick={() => {
                  if (imageUrl.trim()) {
                    set("images", [...form.images, imageUrl.trim()]);
                    setImageUrl("");
                  }
                }}
                className="btn btn-outline px-4"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {fieldErrors.images && <p className="mt-2 text-xs text-rust">{fieldErrors.images}</p>}
      </section>

      <section className="border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base">Variants & Stock</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              One row per size. Stock of 0 makes that size unselectable on the storefront.
            </p>
          </div>
          <button type="button" onClick={() => addVariant()} className="btn btn-outline px-4 py-2 text-[10px]">
            + Add Size
          </button>
        </div>

        {form.variants.length === 0 ? (
          <div className="border border-dashed border-line py-8 text-center">
            <p className="text-sm text-ink-muted">No sizes yet.</p>
            <button
              type="button"
              onClick={() => SIZES.forEach((s) => addVariant(s))}
              className="btn btn-primary mt-3 px-5 py-2.5"
            >
              Add all standard sizes
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 pr-3 eyebrow text-ink-muted">Size</th>
                  <th className="py-2 pr-3 eyebrow text-ink-muted">Colour</th>
                  <th className="py-2 pr-3 eyebrow text-ink-muted">Hex</th>
                  <th className="py-2 pr-3 eyebrow text-ink-muted">SKU</th>
                  <th className="py-2 pr-3 eyebrow text-ink-muted">Stock</th>
                  <th className="py-2 pr-3 eyebrow text-ink-muted">Price override</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {form.variants.map((variant, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3">
                      <input
                        value={variant.size}
                        onChange={(e) => updateVariant(i, { size: e.target.value })}
                        className="field w-20 px-2 py-1.5"
                        aria-label="Size"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={variant.color}
                        onChange={(e) => updateVariant(i, { color: e.target.value })}
                        className="field w-28 px-2 py-1.5"
                        aria-label="Colour name"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={variant.colorHex}
                        onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                        placeholder="#111111"
                        className="field w-24 px-2 py-1.5"
                        aria-label="Colour hex"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={variant.sku}
                        onChange={(e) => updateVariant(i, { sku: e.target.value })}
                        className="field w-40 px-2 py-1.5"
                        aria-label="SKU"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                        className="field w-20 px-2 py-1.5 tabular-nums"
                        aria-label="Stock"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        value={variant.priceOverride ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          updateVariant(i, {
                            priceOverride: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="field w-24 px-2 py-1.5 tabular-nums"
                        aria-label="Price override"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            variants: f.variants.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="text-[10px] uppercase tracking-widest text-ink-muted hover:text-rust"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {fieldErrors.variants && <p className="mt-2 text-xs text-rust">{fieldErrors.variants}</p>}
      </section>

      {error && (
        <p role="alert" className="border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? (
            <>
              <IconSpinner className="h-4 w-4" />
              Saving
            </>
          ) : productId ? (
            "Save Changes"
          ) : (
            "Create Product"
          )}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="field" aria-invalid={!!error} {...props} />
      {error && <p className="mt-1 text-xs text-rust">{error}</p>}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-ink"
      />
      {label}
    </label>
  );
}
