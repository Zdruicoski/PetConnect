import { CorpoRequisicao } from "../http/CorpoRequisicao";
import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoAutenticacao } from "../services/ServicoAutenticacao";

export class ControladorAutenticacao {
  servico: ServicoAutenticacao;

  constructor(servico: ServicoAutenticacao) {
    this.servico = servico;
  }

  async entrarComoVisitante(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 200, await this.servico.entrarComoVisitante(dados));
  }

  async entrarComoOng(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 200, await this.servico.entrarComoOng(dados));
  }

  async mostrarUsuario(contexto: ContextoRequisicao): Promise<void> {
    const usuario = await this.servico.exigirUsuario(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 200, { user: usuario });
  }

  async sair(contexto: ContextoRequisicao): Promise<void> {
    await this.servico.sair(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 200, { ok: true });
  }
}
