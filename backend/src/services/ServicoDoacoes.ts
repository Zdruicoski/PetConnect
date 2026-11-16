import type { Campanha } from "../entity/Campanha";
import { Doacao, type DadosDoacao } from "../entity/Doacao";
import type { RepositorioPostgres } from "../repositories/RepositorioPostgres";
import { ErroHttp } from "../compartilhado/ErroHttp";
import type { ServicoNotificacoes } from "./ServicoNotificacoes";

export type ResultadoDoacao = {
  donation: Doacao;
  campaign: Campanha;
};

export class ServicoDoacoes {
  repositorio: RepositorioPostgres;
  notificacoes: ServicoNotificacoes;

  constructor(repositorio: RepositorioPostgres, notificacoes: ServicoNotificacoes) {
    this.repositorio = repositorio;
    this.notificacoes = notificacoes;
  }

  listarDoacoes(): Promise<Doacao[]> {
    return this.repositorio.listarDoacoes();
  }

  async criarDoacao(dados: DadosDoacao): Promise<ResultadoDoacao> {
    const doacao = Doacao.criar(dados);
    const campanha = await this.repositorio.registrarDoacao(doacao);

    if (!campanha) {
      throw new ErroHttp(404, "Campanha não encontrada.");
    }

    const resultado = { donation: doacao, campaign: campanha };

    this.notificacoes.notificarTodos("donation-created", {
      ...resultado,
      message: `${doacao.donorName} apoiou ${campanha.title}`
    });

    return resultado;
  }
}
