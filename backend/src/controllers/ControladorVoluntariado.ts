import { CorpoRequisicao } from "../http/CorpoRequisicao";
import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoVoluntariado } from "../services/ServicoVoluntariado";

export class ControladorVoluntariado {
  servico: ServicoVoluntariado;

  constructor(servico: ServicoVoluntariado) {
    this.servico = servico;
  }

  listar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.servico.listarCandidaturas());
  }

  async criar(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    const candidatura = this.servico.criarCandidatura(dados);
    RespostaHttp.json(contexto.resposta, 201, candidatura);
  }
}
