import type { ReactNode } from "react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";

/** Public contact fields shown on apply landings / contact dialogs. */
export type BrokerPublicContactPerson = {
  email: string;
  phone?: string | null;
  office_address?: string | null;
  office_city?: string | null;
  office_state?: string | null;
  office_zip?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
};

function hasOfficeAddress(p: BrokerPublicContactPerson): boolean {
  return !!(p.office_address || p.office_city || p.office_state || p.office_zip);
}

function officeMapsUrl(p: BrokerPublicContactPerson): string {
  const parts = [
    p.office_address,
    p.office_city,
    p.office_state,
    p.office_zip,
  ].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

const SOCIALS: Array<{
  key: keyof BrokerPublicContactPerson;
  label: string;
  icon: ReactNode;
  className: string;
}> = [
  {
    key: "website_url",
    label: "Website",
    icon: <Globe className="h-3.5 w-3.5" />,
    className: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  },
  {
    key: "linkedin_url",
    label: "LinkedIn",
    icon: <FaLinkedin className="h-3.5 w-3.5" />,
    className: "bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2]",
  },
  {
    key: "facebook_url",
    label: "Facebook",
    icon: <FaFacebook className="h-3.5 w-3.5" />,
    className: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2]",
  },
  {
    key: "instagram_url",
    label: "Instagram",
    icon: <FaInstagram className="h-3.5 w-3.5" />,
    className: "bg-[#E1306C]/10 hover:bg-[#E1306C]/20 text-[#E1306C]",
  },
  {
    key: "twitter_url",
    label: "X",
    icon: <FaXTwitter className="h-3.5 w-3.5" />,
    className: "bg-gray-100 hover:bg-gray-200 text-gray-900",
  },
  {
    key: "youtube_url",
    label: "YouTube",
    icon: <FaYoutube className="h-3.5 w-3.5" />,
    className: "bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-[#FF0000]",
  },
];

/**
 * Organized public contact block for apply landings.
 * Empty channels (phone, address, each social) are omitted entirely.
 */
export function BrokerPublicContactCard({
  person,
  className,
  showHeading = true,
}: {
  person: BrokerPublicContactPerson;
  className?: string;
  /** When false, skip the "Get in touch" label (e.g. inside a dialog). */
  showHeading?: boolean;
}) {
  const socials = SOCIALS.filter((s) => {
    const v = person[s.key];
    return typeof v === "string" && v.trim().length > 0;
  });
  const showAddress = hasOfficeAddress(person);
  const showPhone = !!(person.phone && String(person.phone).trim());

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-gray-50/80 p-4",
        className,
      )}
    >
      {showHeading && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-3">
          Get in touch
        </p>
      )}

      <div className="space-y-2">
        {showPhone && (
          <a
            href={`tel:${person.phone}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/25 hover:bg-primary/[0.03] transition-colors group"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Phone className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
                Phone
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {person.phone}
              </p>
            </div>
          </a>
        )}

        <a
          href={`mailto:${person.email}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/25 hover:bg-primary/[0.03] transition-colors group"
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
            <Mail className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
              Email
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {person.email}
            </p>
          </div>
        </a>

        {showAddress && (
          <a
            href={officeMapsUrl(person)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/25 hover:bg-primary/[0.03] transition-colors group"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
                Address · Open in Maps ↗
              </p>
              {person.office_address && (
                <p className="text-sm font-semibold text-gray-900">
                  {person.office_address}
                </p>
              )}
              <p className="text-sm font-semibold text-gray-900">
                {[person.office_city, person.office_state, person.office_zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </a>
        )}
      </div>

      {socials.length > 0 && (
        <div className="mt-3.5 pt-3.5 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2.5">
            Connect
          </p>
          <div className="flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={String(person[s.key])}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-medium",
                  s.className,
                )}
              >
                {s.icon} {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
