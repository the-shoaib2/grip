interface GripIconProps {
  size?: number;
  className?: string;
}

export function GripIcon({ size = 20, className = "" }: GripIconProps) {
  return (
    <img
      src={chrome.runtime.getURL("public/icons/icon-32.png")}
      alt=""
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  );
}
