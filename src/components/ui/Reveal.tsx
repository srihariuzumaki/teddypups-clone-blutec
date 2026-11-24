import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReveal } from "../../lib/useReveal";

interface Props {
  as?: ElementType;
  className?: string;
  delay?: number;
  tilt?: number;
  children: ReactNode;
  style?: CSSProperties;
}

export default function Reveal({ as: Tag = "div", className, delay = 0, tilt, children, style }: Props) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref}
      data-reveal="true"
      className={className}
      style={{ ["--d" as string]: `${delay}ms`, ...(tilt !== undefined ? { ["--tilt" as string]: `${tilt}deg` } : {}), ...style }}
    >
      {children}
    </Tag>
  );
}
