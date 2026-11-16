import { CorpoRequisicao } from "../http/CorpoRequisicao";
import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoDoacoes } from "../services/ServicoDoacoes";

export class ControladorDoacoes {
  servico: ServicoDoacoes;

  constructor(servico: ServicoDoacoes) {
    this.servico = servico;
  }

  async listar(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarDoacoes());
  }

  async criar(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    const resultado = await this.servico.criarDoacao(dados);
    RespostaHttp.json(contexto.resposta, 201, resultado);
  }
}
