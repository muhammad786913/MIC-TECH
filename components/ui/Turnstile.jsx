"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({ siteKey = "", onVerify, disabled = false, className = "" }) {
  const [token, setToken] = useState("");
  const readyRef = useRef(false);
  const widgetIdRef = useRef(null);

  // Dev-mode auto-bypass: when no site key is configured, immediately verify.
  useEffect(() => {
    if (!siteKey && !disabled) {
      const autoToken = `dev-bypass-${Date.now()}`;
      window.setTimeout(() => {
        setToken(autoToken);
        onVerify?.(autoToken);
      }, 0);
    }
  }, [siteKey, disabled, onVerify]);

  // Load Turnstile script when a site key is provided.
  useEffect(() => {
    if (!siteKey || disabled) {
      readyRef.current = true;
      return;
    }
    if (window?.turnstile) {
      readyRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      readyRef.current = true;
    };
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch {}
    };
  }, [siteKey, disabled]);

  // Render the Turnstile widget once the script is ready.
  useEffect(() => {
    if (!readyRef.current || !siteKey || disabled || !window?.turnstile) return;

    const container = document.createElement("div");
    container.className = className || "";
    document.body.appendChild(container);

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (tok) => {
        setToken(tok);
        onVerify?.(tok);
      },
      "expired-callback": () => {
        setToken("");
        widgetIdRef.current = null;
        try {
          document.body.removeChild(container);
        } catch {}
      },
    });

    return () => {
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
      try {
        document.body.removeChild(container);
      } catch {}
    };
  }, [siteKey, disabled, onVerify, className]);

  return null;
}

export function useTurnstile(siteKey = "") {
  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(false);

  const handleVerify = (tok) => {
    setToken(tok);
    setVerified(true);
  };

  const reset = () => {
    setToken("");
    setVerified(false);
  };

  return {
    token,
    verified,
    reset,
    TurnstileProps: { siteKey, onVerify: handleVerify },
  };
}
