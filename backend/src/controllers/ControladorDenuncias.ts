import { CorpoRequisicao } from "../http/CorpoRequisicao";
import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoDenuncias } from "../services/ServicoDenuncias";

export class ControladorDenuncias {
  servico: ServicoDenuncias;

  constructor(servico: ServicoDenuncias) {
    this.servico = servico;
  }

  async listar(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarDenuncias());
  }

  async criar(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    const denuncia = await this.servico.criarDenuncia(dados);
    RespostaHttp.json(contexto.resposta, 201, denuncia);
  }
}
