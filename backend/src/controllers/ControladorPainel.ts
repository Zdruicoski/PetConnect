import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoPainel } from "../services/ServicoPainel";

export class ControladorPainel {
  servico: ServicoPainel;

  constructor(servico: ServicoPainel) {
    this.servico = servico;
  }

  listar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.servico.obterPainel());
  }
}
