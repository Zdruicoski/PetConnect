import {
  CandidaturaVoluntario,
  type DadosCandidaturaVoluntario
} from "../entity/CandidaturaVoluntario";
import type { RepositorioJson } from "../repositories/RepositorioJson";
import type { ServicoNotificacoes } from "./ServicoNotificacoes";

export class ServicoVoluntariado {
  repositorio: RepositorioJson;
  notificacoes: ServicoNotificacoes;

  constructor(repositorio: RepositorioJson, notificacoes: ServicoNotificacoes) {
    this.repositorio = repositorio;
    this.notificacoes = notificacoes;
  }

  listarCandidaturas(): CandidaturaVoluntario[] {
    return this.repositorio.buscarTodos().volunteerApplications;
  }

  criarCandidatura(dados: DadosCandidaturaVoluntario): CandidaturaVoluntario {
    const candidatura = CandidaturaVoluntario.criar(dados);

    this.repositorio.atualizar((dadosAplicacao) => {
      dadosAplicacao.volunteerApplications.unshift(candidatura);
    });

    this.notificacoes.notificarTodos("volunteer-created", {
      application: candidatura,
      message: `${candidatura.name} se candidatou para voluntariado.`
    });

    return candidatura;
  }
}
