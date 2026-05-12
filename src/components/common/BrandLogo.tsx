import { cn } from "@/lib/utils";

const iconSrc = "/brand/sisicallcall-icon.png";
const wordmarkSrc = "/brand/sisicallcall-wordmark.png";
const logoSrc = "/brand/sisicallcall-logo.png";

type BrandLogoVariant = "icon" | "wordmark" | "full";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

export function BrandLogo({
  variant = "full",
  className,
}: BrandLogoProps) {
  if (variant === "icon") {
    return (
      <img
        src={iconSrc}
        alt="시시콜콜 아이콘"
        className={cn("h-9 w-9 object-contain", className)}
      />
    );
  }

  if (variant === "wordmark") {
    return (
      <img
        src={wordmarkSrc}
        alt="시시콜콜"
        className={cn("h-8 w-auto object-contain", className)}
      />
    );
  }

  return (
    <img
      src={logoSrc}
      alt="시시콜콜"
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
