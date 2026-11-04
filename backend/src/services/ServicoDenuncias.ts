import { Denuncia, type DadosDenuncia } from "../entity/Denuncia";
import type { RepositorioJson } from "../repositories/RepositorioJson";
import type { ServicoNotificacoes } from "./ServicoNotificacoes";

export class ServicoDenuncias {
  repositorio: RepositorioJson;
  notificacoes: ServicoNotificacoes;

  constructor(repositorio: RepositorioJson, notificacoes: ServicoNotificacoes) {
    this.repositorio = repositorio;
    this.notificacoes = notificacoes;
  }

  listarDenuncias(): Denuncia[] {
    return this.repositorio.buscarTodos().reports;
  }

  criarDenuncia(dados: DadosDenuncia): Denuncia {
    const denuncia = Denuncia.criar(dados);

    this.repositorio.atualizar((dadosAplicacao) => {
      dadosAplicacao.reports.unshift(denuncia);
    });

    this.notificacoes.notificarTodos("report-created", {
      report: denuncia,
      message: `Nova denúncia registrada: ${denuncia.title}`
    });

    return denuncia;
  }
}
