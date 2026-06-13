import { useEffect, useState } from "react";
import { getSignedUrl } from "@/lib/storage";

export function SignedImage({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);
  if (!path) return null;
  if (!url)
    return (
      <div
        className={`bg-muted animate-pulse rounded-lg ${className ?? "h-40 w-full"}`}
        aria-label={alt}
      />
    );
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}