import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoCampanhas } from "../services/ServicoCampanhas";

export class ControladorCampanhas {
  servico: ServicoCampanhas;

  constructor(servico: ServicoCampanhas) {
    this.servico = servico;
  }

  listar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.servico.listarCampanhas());
  }
}
