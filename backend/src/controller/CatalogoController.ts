import { CorpoRequisicao, RespostaHttp } from "../Servidor";
import type { ContextoRequisicao } from "../Servidor";
import type { AutenticacaoService } from "../service/AutenticacaoService";
import type { CatalogoService } from "../service/CatalogoService";

export class CatalogoController {
  private servico: CatalogoService;
  private autenticacao: AutenticacaoService;

  constructor(servico: CatalogoService, autenticacao: AutenticacaoService) {
    this.servico = servico;
    this.autenticacao = autenticacao;
  }

  // ---------- Campanhas ----------

  async listarCampanhas(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarCampanhas());
  }

  async detalharCampanha(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(
      contexto.resposta,
      200,
      await this.servico.detalharCampanha(contexto.parametros.id)
    );
  }

  async criarCampanha(contexto: ContextoRequisicao): Promise<void> {
    const ong = await this.autenticacao.exigirOng(
      contexto.requisicao.headers.authorization
    );
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    RespostaHttp.json(
      contexto.resposta,
      201,
      await this.servico.abrirCampanha(ong.ngoId, dados)
    );
  }

  // ---------- ONGs ----------

  async listarOngs(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarOngs());
  }

  // ---------- Doações ----------

  async listarDoacoes(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.listarDoacoes());
  }

  async criarDoacao(contexto: ContextoRequisicao): Promise<void> {
    const dados = await CorpoRequisicao.lerJson(contexto.requisicao);
    RespostaHttp.json(contexto.resposta, 201, await this.servico.criarDoacao(dados));
  }

  // ---------- Painel ----------

  async mostrarPainel(contexto: ContextoRequisicao): Promise<void> {
    RespostaHttp.json(contexto.resposta, 200, await this.servico.obterPainel());
  }
}
