import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";

export class ControladorStatus {
  mostrar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, {
      ok: true,
      service: "petconnect-api",
      language: "TypeScript"
    });
  }
}
