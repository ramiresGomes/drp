"use client";

import { useState } from "react";
import { checkInEvent } from "@/app/actions/member";
import { Button } from "@/components/ui/button";

export function CheckinForm({
  token,
  hasGeofence,
}: {
  token: string;
  hasGeofence: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("token", token);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Este aparelho não informa localização."));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
        });
      });
      formData.set("latitude", String(position.coords.latitude));
      formData.set("longitude", String(position.coords.longitude));
    } catch (caught) {
      if (hasGeofence) {
        const denied = caught instanceof GeolocationPositionError && caught.code === caught.PERMISSION_DENIED;
        setError(
          denied
            ? "Autorize a localização para registrar presença no local."
            : "Não foi possível validar a localização. Tente de novo no local do evento.",
        );
        setPending(false);
        return;
      }
    }
    await checkInEvent(formData);
  }

  return (
    <div className="mt-6 grid gap-3">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {hasGeofence
          ? "O check-in só vale com login válido e localização compatível com o local do evento."
          : "O check-in registra login e a localização do aparelho no momento da leitura do QR."}
      </p>
      <Button type="button" onClick={submit} disabled={pending}>
        {pending ? "Validando localização…" : "Registrar minha presença"}
      </Button>
    </div>
  );
}
