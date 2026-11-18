import type { ContextoRequisicao } from "../Servidor";
import type { NotificacaoService } from "../service/NotificacaoService";

export class EventosController {
  private notificacoes: NotificacaoService;

  constructor(notificacoes: NotificacaoService) {
    this.notificacoes = notificacoes;
  }

  transmitir(contexto: ContextoRequisicao): void {
    this.notificacoes.conectar(contexto.requisicao, contexto.resposta);
  }
}
