import { Helmet } from "react-helmet-async";

interface MetaHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  canonical?: string;
}

const defaultMeta = {
  title: "Loan Broker Management Platform",
  description:
    "Streamline your loan application process with our comprehensive broker management platform.",
  keywords: "loan, broker, mortgage, real estate, finance, application",
  image: "/og-image.jpg",
  type: "website",
  author: "Loan Broker Platform",
};

export function MetaHelmet({
  title,
  description,
  keywords,
  image,
  url,
  type,
  author,
  canonical,
}: MetaHelmetProps) {
  const pageTitle = title
    ? `${title} | ${defaultMeta.title}`
    : defaultMeta.title;
  const pageDescription = description || defaultMeta.description;
  const pageKeywords = keywords || defaultMeta.keywords;
  const pageImage = image || defaultMeta.image;
  const pageType = type || defaultMeta.type;
  const pageAuthor = author || defaultMeta.author;
  const pageUrl =
    url || typeof window !== "undefined" ? window.location.href : "";

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={pageAuthor} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={pageType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={pageImage} />

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
}
