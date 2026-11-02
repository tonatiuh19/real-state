import { ExternalLink, Star } from "lucide-react";
import { ENCORE_GOOGLE_REVIEWS } from "@/lib/encoreGoogleReviews";
import { cn } from "@/lib/utils";

/**
 * Compact Google reviews CTA for public apply landings.
 * Opens the company Maps listing in a new tab.
 */
export function GoogleReviewsBadge({ className }: { className?: string }) {
  const { url, rating, reviewCount, businessName } = ENCORE_GOOGLE_REVIEWS;
  const stars = Math.round(rating);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm",
        "hover:border-primary/30 hover:bg-primary/[0.02] transition-colors",
        className,
      )}
    >
      <div className="h-10 w-10 rounded-full bg-[#FBBC04]/15 flex items-center justify-center shrink-0">
        <Star className="h-5 w-5 fill-[#FBBC04] text-[#FBBC04]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: stars }).map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3 fill-[#FBBC04] text-[#FBBC04]"
              />
            ))}
          </span>
          <span className="text-xs text-gray-500">
            ({reviewCount.toLocaleString()} reviews)
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {businessName} on Google · Read reviews
        </p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
    </a>
  );
}
