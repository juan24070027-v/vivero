"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "./toast";

/**
 * Muestra un toast cuando la URL trae ?<param>=1 (típicamente tras un
 * redirect de una Server Action que no puede disparar un toast por sí
 * misma), y luego limpia el query param para que no reaparezca al recargar.
 */
export function ToastOnParam({ param, message, type = "success" }: { param: string; message: string; type?: "success" | "error" | "info" }) {
  const { show } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get(param) === "1") {
      show(message, type);
      const params = new URLSearchParams(searchParams.toString());
      params.delete(param);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
