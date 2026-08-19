import { LinkButton } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="rounded-full bg-forest-50 text-forest-600 p-4 mb-4">
        <Compass size={28} />
      </div>
      <h1 className="font-display text-2xl text-forest-900 mb-1">No se encontró esta página</h1>
      <p className="text-sm text-stone-500 mb-6 max-w-sm">
        Puede que el enlace esté roto o que el registro ya no exista.
      </p>
      <LinkButton href="/dashboard">Volver al panel</LinkButton>
    </div>
  );
}
