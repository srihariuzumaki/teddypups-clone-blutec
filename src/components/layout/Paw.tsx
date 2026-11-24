import { PAW_D as D } from "./pawPath";

export function PawPath() {
  return <path d={D} />;
}

export default function Paw({ className = "tp-nav-link__paw" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="currentColor">
      <PawPath />
    </svg>
  );
}
