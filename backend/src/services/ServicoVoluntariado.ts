import {
  CandidaturaVoluntario,
  type DadosCandidaturaVoluntario
} from "../entity/CandidaturaVoluntario";
import type { RepositorioPostgres } from "../repositories/RepositorioPostgres";
import type { ServicoNotificacoes } from "./ServicoNotificacoes";

export class ServicoVoluntariado {
  repositorio: RepositorioPostgres;
  notificacoes: ServicoNotificacoes;

  constructor(repositorio: RepositorioPostgres, notificacoes: ServicoNotificacoes) {
    this.repositorio = repositorio;
    this.notificacoes = notificacoes;
  }

  listarCandidaturas(): Promise<CandidaturaVoluntario[]> {
    return this.repositorio.listarCandidaturas();
  }

  async criarCandidatura(dados: DadosCandidaturaVoluntario): Promise<CandidaturaVoluntario> {
    const candidatura = CandidaturaVoluntario.criar(dados);

    await this.repositorio.inserirCandidatura(candidatura);

    this.notificacoes.notificarTodos("volunteer-created", {
      application: candidatura,
      message: `${candidatura.name} se candidatou para voluntariado.`
    });

    return candidatura;
  }
}
