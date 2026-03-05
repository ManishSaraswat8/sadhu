import { useEffect, useRef } from "react";
import { WellnessWidgetConfig } from "@/config/wellnessLiving";

interface WellnessAppointmentsWidgetProps {
  widget: WellnessWidgetConfig;
  onLoaded: () => void;
  onError: () => void;
}

export const WellnessAppointmentsWidgetEmbed = ({
  widget,
  onLoaded,
  onError,
}: WellnessAppointmentsWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";
    const finishLoaded = () => window.setTimeout(() => onLoaded(), 700);

    if (widget.type === "legacySkin") {
      const legacyContainer = document.createElement("div");
      legacyContainer.className = "wl-widget";
      legacyContainer.setAttribute("data", widget.legacyData || "");
      container.appendChild(legacyContainer);

      const script = document.createElement("script");
      script.src = widget.scriptUrl;
      script.type = "text/javascript";
      script.async = true;
      script.onload = finishLoaded;
      script.onerror = onError;
      container.appendChild(script);

      return () => {
        script.onload = null;
        script.onerror = null;
      };
    }

    if (!widget.tagName) {
      onError();
      return;
    }

    const existingScript = document.querySelector(
      `script[data-wl-widget-script="true"][src="${widget.scriptUrl}"]`,
    ) as HTMLScriptElement | null;

    let script = existingScript;
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = widget.scriptUrl;
      script.dataset.wlWidgetScript = "true";
      script.async = true;
      document.body.appendChild(script);
    }

    const widgetElement = document.createElement(widget.tagName);
    Object.entries(widget.attributes || {}).forEach(([name, value]) => {
      widgetElement.setAttribute(name, value);
    });
    container.appendChild(widgetElement);

    if (script.getAttribute("data-loaded") === "true") {
      finishLoaded();
      return;
    }

    const handleLoad = () => {
      script?.setAttribute("data-loaded", "true");
      finishLoaded();
    };
    const handleError = () => onError();

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    return () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [widget, onLoaded, onError]);

  return <div ref={containerRef} className="min-h-[520px]" />;
};
