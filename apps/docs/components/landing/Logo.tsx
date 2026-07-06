import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  showText?: boolean;
}

export function GripIcon({ size = 24, className, ...props }: Omit<LogoProps, "showText">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 group-hover:rotate-45 group-hover:scale-110 ${className || ""}`}
      {...props}
    >
      {/* Central glowing solid dot */}
      <circle cx="12" cy="12" r="3" className="fill-current text-blue-500" stroke="none" />
      
      {/* Surrounding grip ring of colored dots matching our flow canvas */}
      <circle cx="12" cy="5" r="1.5" className="fill-current text-emerald-400" stroke="none" />
      <circle cx="19" cy="12" r="1.5" className="fill-current text-purple-400" stroke="none" />
      <circle cx="12" cy="19" r="1.5" className="fill-current text-amber-400" stroke="none" />
      <circle cx="5" cy="12" r="1.5" className="fill-current text-blue-400" stroke="none" />
      
      {/* Outer dotted orbit connection paths */}
      <path d="M12 5a7 7 0 0 1 7 7" strokeDasharray="2 3" className="stroke-zinc-600" />
      <path d="M19 12a7 7 0 0 1-7 7" strokeDasharray="2 3" className="stroke-zinc-600" />
      <path d="M12 19a7 7 0 0 1-7-7" strokeDasharray="2 3" className="stroke-zinc-600" />
      <path d="M5 12a7 7 0 0 1 7-7" strokeDasharray="2 3" className="stroke-zinc-600" />
    </svg>
  );
}

export function Logo({ size = 20, showText = true }: LogoProps) {
  return (
    <div className="group flex items-center gap-2 select-none cursor-pointer">
      <GripIcon size={size} />
      {showText && (
        <span className="logo-font text-lg font-bold tracking-wider text-white transition-colors duration-200 group-hover:text-zinc-200">
          Grip
        </span>
      )}
    </div>
  );
}
