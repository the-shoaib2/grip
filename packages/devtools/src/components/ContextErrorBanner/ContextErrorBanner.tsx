interface ContextErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ContextErrorBanner({ message, onRetry }: ContextErrorBannerProps) {
  return (
    <div className="grip-pick-error-banner" role="alert">
      <p className="grip-popup-error">{message}</p>
      <button type="button" className="grip-btn-ghost grip-btn-toolbar" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
