import { lazy, Suspense, useEffect, useState } from "react";

const LeafletMap = lazy(() => import("./LeafletMap").then((m) => ({ default: m.MapPicker })));

export function MapPicker(props: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const h = props.height ?? 360;
  const placeholder = (
    <div
      className="bg-muted/40 flex items-center justify-center rounded-xl border text-xs text-muted-foreground"
      style={{ height: h }}
    >
      Загрузка карты…
    </div>
  );
  if (!mounted) return placeholder;
  return <Suspense fallback={placeholder}><LeafletMap {...props} /></Suspense>;
}