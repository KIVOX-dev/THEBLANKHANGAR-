"use client";

import { useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { ReviewItem } from "@/types/catalog";

export function ReviewsSection({
  productId,
  initialReviews,
  average,
  count,
}: {
  productId: string;
  initialReviews: ReviewItem[];
  average: number;
  count: number;
}) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const alreadyReviewed = reviews.some((r) => r.authorName === session?.user?.name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title || undefined, body }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not post your review.");
        return;
      }

      setReviews((prev) => [data.review, ...prev]);
      setTitle("");
      setBody("");
      setShowForm(false);
    } catch {
      setError("Could not post your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const liveCount = reviews.length;
  const liveAverage =
    liveCount === 0
      ? average
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / liveCount) * 10) / 10;

  return (
    <section className="border-t border-line bg-bone-deep/40">
      <div className="wrap py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div>
            <h2 className="text-2xl">Reviews</h2>
            {liveCount > 0 ? (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <Stars value={Math.round(liveAverage)} />
                  <span className="text-sm font-medium">{liveAverage.toFixed(1)}</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Based on {liveCount} {liveCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No reviews yet.</p>
            )}

            {!session?.user ? (
              <Link href="/login" className="btn btn-outline mt-6 w-full">
                Sign in to Review
              </Link>
            ) : alreadyReviewed ? (
              <p className="mt-6 text-xs text-ink-muted">
                You&apos;ve already reviewed this product.
              </p>
            ) : (
              <button
                onClick={() => setShowForm((s) => !s)}
                className="btn btn-outline mt-6 w-full"
              >
                {showForm ? "Cancel" : "Write a Review"}
              </button>
            )}
          </div>

          <div>
            {showForm && session?.user && (
              <form onSubmit={submit} className="mb-10 border border-line bg-white p-5">
                <div className="mb-4">
                  <label className="label">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        className={`text-2xl leading-none transition-colors ${
                          n <= rating ? "text-rust" : "text-line"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="review-title" className="label">
                    Title (optional)
                  </label>
                  <input
                    id="review-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    className="field"
                    placeholder="Sums up your experience"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="review-body" className="label">
                    Your review
                  </label>
                  <textarea
                    id="review-body"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    minLength={10}
                    maxLength={1000}
                    className="field resize-y"
                    placeholder="How does the fit, fabric and finish hold up?"
                  />
                </div>

                {error && <p className="mb-3 text-sm text-rust">{error}</p>}

                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? "Posting…" : "Post Review"}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Be the first to review this piece.
              </p>
            ) : (
              <ul className="space-y-7">
                {reviews.map((review) => (
                  <li key={review.id} className="border-b border-line pb-7 last:border-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars value={review.rating} />
                      <span className="text-sm font-medium">{review.authorName}</span>
                      <span className="text-xs text-ink-muted">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {review.title && (
                      <p className="mt-2.5 text-sm font-medium">{review.title}</p>
                    )}
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-base leading-none" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? "text-rust" : "text-line"}>
          ★
        </span>
      ))}
    </span>
  );
}
