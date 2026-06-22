interface PickErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function PickErrorBanner({ message, onRetry }: PickErrorBannerProps) {
  return (
    <div className="grip-pick-error-banner" role="alert">
      <p className="grip-popup-error">{message}</p>
      <button type="button" className="grip-btn-ghost grip-btn-toolbar" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
