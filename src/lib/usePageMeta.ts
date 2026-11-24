import { useEffect } from "react";

const DEFAULT_TITLE = "TeddyPups U.A.E. — Premium teacup puppies in Dubai";

export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ?? DEFAULT_TITLE;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    }
  }, [title, description]);
}
