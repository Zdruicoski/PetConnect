import { CorpoRequisicao, RespostaHttp } from "../Servidor";
import type { ContextoRequisicao } from "../Servidor";
import type { AutenticacaoService } from "../service/AutenticacaoService";

export class AutenticacaoController {
  private servico: AutenticacaoService;

  constructor(servico: AutenticacaoService) {
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
    const usuario = await this.servico.exigirUsuario(
      contexto.requisicao.headers.authorization
    );
    RespostaHttp.json(contexto.resposta, 200, { user: usuario });
  }

  async sair(contexto: ContextoRequisicao): Promise<void> {
    await this.servico.sair(contexto.requisicao.headers.authorization);
    RespostaHttp.json(contexto.resposta, 200, { ok: true });
  }
}
