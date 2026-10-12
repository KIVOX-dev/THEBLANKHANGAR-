import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="wrap max-w-2xl py-14 lg:py-20">
      <h1 className="text-4xl lg:text-5xl">Privacy Policy</h1>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-ink-soft">
        <p>
          We collect the information you give us at account creation and checkout — name,
          email, phone, and delivery address — to process orders and provide support. We do not
          sell your personal information.
        </p>
        <p>
          Payment details are handled by our payment processor and are never stored on our
          servers. Order and account data is retained for as long as your account is active.
        </p>
        <p>
          You can request a copy of your data, or ask us to delete your account, by contacting{" "}
          <a href="mailto:hello@theblankhangar.com" className="underline underline-offset-4">
            hello@theblankhangar.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
