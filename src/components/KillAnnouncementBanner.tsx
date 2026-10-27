import React, { useEffect, useState } from 'react';

interface KillAnnouncementBannerProps {
  text: string | null;
  subtext?: string;
  onDismiss: () => void;
}

export const KillAnnouncementBanner: React.FC<KillAnnouncementBannerProps> = ({
  text,
  subtext,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (text) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [text, onDismiss]);

  if (!text) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none">
      <div
        className={`bg-slate-950/95 border border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.35)] px-8 py-3 rounded-2xl flex flex-col items-center transition-all duration-300 ${
          visible ? 'scale-100 opacity-100 -translate-y-0' : 'scale-90 opacity-0 -translate-y-4'
        }`}
      >
        <span className="text-xl font-extrabold font-cinzel text-amber-300 tracking-wider drop-shadow-md">
          {text}
        </span>
        {subtext && (
          <span className="text-xs text-amber-200/90 font-medium mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
