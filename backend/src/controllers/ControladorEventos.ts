import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoNotificacoes } from "../services/ServicoNotificacoes";

export class ControladorEventos {
  notificacoes: ServicoNotificacoes;

  constructor(notificacoes: ServicoNotificacoes) {
    this.notificacoes = notificacoes;
  }

  transmitir(contexto: ContextoRequisicao): void {
    this.notificacoes.conectar(contexto.requisicao, contexto.resposta);
  }
}
