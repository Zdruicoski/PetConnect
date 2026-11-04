import { CorpoRequisicao } from "../http/CorpoRequisicao";
import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoDenuncias } from "../services/ServicoDenuncias";

export class ControladorDenuncias {
  servico: ServicoDenuncias;

  constructor(servico: ServicoDenuncias) {
    this.servico = servico;
  }

  listar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.servico.listarDenuncias());
  }

  async criar(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    const denuncia = this.servico.criarDenuncia(dados);
    RespostaHttp.json(contexto.resposta, 201, denuncia);
  }
}
