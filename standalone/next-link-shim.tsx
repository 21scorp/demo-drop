import type { AnchorHTMLAttributes } from "react";

/** Drop-in replacement for next/link in the single-file embed build. */
export default function Link({
  href,
  children,
  ...rest
}: { href?: string; children?: React.ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const h = typeof href === "string" ? href : "#";
  const internal = h.startsWith("/") || h.startsWith("#");
  return (
    <a
      href={internal ? "#" : h}
      onClick={internal ? (e) => e.preventDefault() : undefined}
      {...rest}
    >
      {children}
    </a>
  );
}
