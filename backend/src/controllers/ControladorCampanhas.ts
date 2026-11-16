import { CorpoRequisicao } from "../http/CorpoRequisicao";
import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoAutenticacao } from "../services/ServicoAutenticacao";
import type { ServicoCampanhas } from "../services/ServicoCampanhas";

export class ControladorCampanhas {
  servico: ServicoCampanhas;
  autenticacao: ServicoAutenticacao;

  constructor(servico: ServicoCampanhas, autenticacao: ServicoAutenticacao) {
    this.servico = servico;
    this.autenticacao = autenticacao;
  }

  async listar(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarCampanhas());
  }

  async detalhar(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.detalharCampanha(contexto.parametros.id));
  }

  async criar(contexto: ContextoRequisicao): Promise<void> {
    const ong = await this.autenticacao.exigirOng(contexto.requisicao);
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 201, await this.servico.abrirCampanha(ong.ngoId, dados));
  }
}
