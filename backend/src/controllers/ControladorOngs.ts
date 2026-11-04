import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoOngs } from "../services/ServicoOngs";

export class ControladorOngs {
  servico: ServicoOngs;

  constructor(servico: ServicoOngs) {
    this.servico = servico;
  }

  listar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.servico.listarOngs());
  }
}
