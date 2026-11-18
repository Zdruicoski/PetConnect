import { CorpoRequisicao, RespostaHttp } from "../Servidor";
import type { ContextoRequisicao } from "../Servidor";
import type { ComunidadeService } from "../service/ComunidadeService";

export class ComunidadeController {
  private servico: ComunidadeService;

  constructor(servico: ComunidadeService) {
    this.servico = servico;
  }

  // ---------- Denúncias ----------

  async listarDenuncias(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarDenuncias());
  }

  async criarDenuncia(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 201, await this.servico.criarDenuncia(dados));
  }

  // ---------- Voluntariado ----------

  async listarCandidaturas(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarCandidaturas());
  }

  async criarCandidatura(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 201, await this.servico.criarCandidatura(dados));
  }
}
