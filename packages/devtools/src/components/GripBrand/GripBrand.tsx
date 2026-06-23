export interface GripBrandProps {
  className?: string;
}

export function GripBrand({ className = "" }: GripBrandProps) {
  const rootClass = className ? `grip-brand ${className}` : "grip-brand";

  return (
    <div className={rootClass}>
      <span className="grip-brand-title">Grip</span>
    </div>
  );
}
