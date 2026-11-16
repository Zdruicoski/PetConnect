import { Denuncia, type DadosDenuncia } from "../entity/Denuncia";
import type { RepositorioPostgres } from "../repositories/RepositorioPostgres";
import type { ServicoNotificacoes } from "./ServicoNotificacoes";

export class ServicoDenuncias {
  repositorio: RepositorioPostgres;
  notificacoes: ServicoNotificacoes;

  constructor(repositorio: RepositorioPostgres, notificacoes: ServicoNotificacoes) {
    this.repositorio = repositorio;
    this.notificacoes = notificacoes;
  }

  listarDenuncias(): Promise<Denuncia[]> {
    return this.repositorio.listarDenuncias();
  }

  async criarDenuncia(dados: DadosDenuncia): Promise<Denuncia> {
    const denuncia = Denuncia.criar(dados);

    await this.repositorio.inserirDenuncia(denuncia);

    this.notificacoes.notificarTodos("report-created", {
      report: denuncia,
      message: `Nova denúncia registrada: ${denuncia.title}`
    });

    return denuncia;
  }
}
