import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  showText?: boolean;
}

export function Logo({ showText = true }: LogoProps) {
  return (
    <div className="group flex items-center gap-2 select-none cursor-pointer">
      {showText && (
        <span className="logo-font text-3xl font-bold tracking-wider text-white transition-colors duration-200 group-hover:text-zinc-200">
          Grip
        </span>
      )}
    </div>
  );
}

