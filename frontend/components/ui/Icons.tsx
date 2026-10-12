type IconProps = { className?: string; strokeWidth?: number };

const base = (className?: string) => className ?? "w-5 h-5";

export const IconSearch = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" strokeLinecap="round" />
  </svg>
);

export const IconHeart = ({ className, strokeWidth = 1.6 }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 5.8-8.5 11.3-8.5 11.3Z" strokeLinejoin="round" />
  </svg>
);

export const IconHeartFilled = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={base(className)} aria-hidden>
    <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 5.8-8.5 11.3-8.5 11.3Z" />
  </svg>
);

export const IconBag = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="M5 8h14l1 12H4L5 8Z" strokeLinejoin="round" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
  </svg>
);

export const IconUser = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
  </svg>
);

export const IconMenu = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
  </svg>
);

export const IconClose = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);

export const IconChevron = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconHome = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="M4 10.5 12 4l8 6.5V20h-5v-5H9v5H4v-9.5Z" strokeLinejoin="round" />
  </svg>
);

export const IconGrid = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <rect x="4" y="4" width="7" height="7" />
    <rect x="13" y="4" width="7" height="7" />
    <rect x="4" y="13" width="7" height="7" />
    <rect x="13" y="13" width="7" height="7" />
  </svg>
);

export const IconCheck = ({ className, strokeWidth = 2 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconTruck = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinejoin="round" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17.5" cy="18" r="1.8" />
  </svg>
);

export const IconFilter = ({ className, strokeWidth = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={base(className)} aria-hidden>
    <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
  </svg>
);

export const IconSpinner = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cnSpin(className)} aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

function cnSpin(className?: string) {
  return `${className ?? "w-5 h-5"} animate-spin`;
}
