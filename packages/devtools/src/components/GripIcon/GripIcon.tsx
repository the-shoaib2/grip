import { useGripRuntime } from "../../runtime/context";

interface GripIconProps {
  size?: number;
  className?: string;
}

export function GripIcon({ size = 20, className = "" }: GripIconProps) {
  const runtime = useGripRuntime();
  return (
    <img
      src={runtime.getIconUrl("public/icons/icon-32.png")}
      alt=""
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  );
}
