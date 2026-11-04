import { CorpoRequisicao } from "../http/CorpoRequisicao";
import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoDoacoes } from "../services/ServicoDoacoes";

export class ControladorDoacoes {
  servico: ServicoDoacoes;

  constructor(servico: ServicoDoacoes) {
    this.servico = servico;
  }

  listar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.servico.listarDoacoes());
  }

  async criar(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    const resultado = this.servico.criarDoacao(dados);
    RespostaHttp.json(contexto.resposta, 201, resultado);
  }
}
