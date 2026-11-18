import type { Configuracao } from "../Configuracao";
import { RespostaHttp } from "../Servidor";
import type { ContextoRequisicao } from "../Servidor";

export class SistemaController {
  private configuracao: Configuracao;

  constructor(configuracao: Configuracao) {
    this.configuracao = configuracao;
  }

  mostrarSaude(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, {
      ok: true,
      service: "petconnect-api",
      language: "TypeScript",
      database: this.configuracao.nomeBanco
    });
  }

  mostrarConfiguracao(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.configuracao.mapa);
  }
}
