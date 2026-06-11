"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  onErrorChange?: (message: string | null) => void;
};

declare global {
  interface Window {
    turnstile?: any;
  }
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  ({ onTokenChange, onErrorChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const [isConfigured] = useState<boolean>(!!siteKey);

    useImperativeHandle(ref, () => ({
      reset: () => {
        onTokenChange(null);
        if (onErrorChange) onErrorChange(null);
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!isConfigured) return;

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const startTime = Date.now();
      const MAX_WAIT_MS = 10000;

      const renderWidget = () => {
        if (!containerRef.current || widgetIdRef.current) return;
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onTokenChange(token);
              if (onErrorChange) onErrorChange(null);
            },
            "error-callback": () => {
              onTokenChange(null);
              if (onErrorChange) onErrorChange("Security check failed to load. Please try again.");
            },
            "expired-callback": () => {
              onTokenChange(null);
              if (onErrorChange) onErrorChange("Security check expired. Please complete it again.");
            },
            "timeout-callback": () => {
              onTokenChange(null);
              if (onErrorChange) onErrorChange("Security check timed out. Please complete it again.");
            },
          });
          widgetIdRef.current = id;
        } catch (e) {
          onTokenChange(null);
          if (onErrorChange) onErrorChange("Security check failed to load. Please refresh the page and try again.");
        }
      };

      const checkAndRender = () => {
        if (window.turnstile) {
          renderWidget();
        } else if (Date.now() - startTime > MAX_WAIT_MS) {
          onTokenChange(null);
          if (onErrorChange) onErrorChange("Security check failed to load. Please refresh the page and try again.");
        } else {
          timeoutId = setTimeout(checkAndRender, 100);
        }
      };

      const handleScriptError = () => {
        onTokenChange(null);
        if (onErrorChange) onErrorChange("Security check failed to load. Please refresh the page and try again.");
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      let script = document.getElementById("turnstile-script") as HTMLScriptElement | null;
      
      if (window.turnstile) {
        renderWidget();
      } else {
        if (!script) {
          script = document.createElement("script");
          script.id = "turnstile-script";
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
        
        script.addEventListener("error", handleScriptError);
        checkAndRender();
      }

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (script) {
          script.removeEventListener("error", handleScriptError);
        }
        onTokenChange(null);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [isConfigured, siteKey, onTokenChange, onErrorChange]);

    if (!isConfigured) {
      return (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">CAPTCHA is not configured. Please contact support.</p>
        </div>
      );
    }

    return <div ref={containerRef} className="my-4 flex justify-center" />;
  }
);

TurnstileWidget.displayName = "TurnstileWidget";

export default TurnstileWidget;
