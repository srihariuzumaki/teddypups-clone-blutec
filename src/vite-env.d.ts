
import "react";
declare module "react" {
  interface HTMLAttributes<T> {
    inert?: boolean;
  }
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
