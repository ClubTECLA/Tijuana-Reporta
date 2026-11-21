import { apiRequest } from "@/lib/http";
import type { ApiRecoveryRequest, ApiVerifyRecoveryRequest } from "@/types/api-types";

/** Solicita que el backend envíe un PIN de recuperación al correo, si corresponde. */
export function solicitarRecuperacion(request: ApiRecoveryRequest): Promise<void> {
    return apiRequest<void>("/auth/recovery", {
        method: "POST",
        json: request,
        auth: false,
    });
}

/** Verifica el PIN y guarda la nueva contraseña; el backend responde 204. */
export function verificarRecuperacion(request: ApiVerifyRecoveryRequest): Promise<void> {
    return apiRequest<void>("/auth/recovery/verify", {
        method: "POST",
        json: request,
        auth: false,
    });
}
