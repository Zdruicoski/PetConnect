import type { DadosAplicacao, EstatisticasPainel } from "../entity/DadosAplicacao";
import type { RepositorioJson } from "../repositories/RepositorioJson";

export class ServicoPainel {
  repositorio: RepositorioJson;

  constructor(repositorio: RepositorioJson) {
    this.repositorio = repositorio;
  }

  obterPainel(): DadosAplicacao & { stats: EstatisticasPainel } {
    const dadosAplicacao = this.repositorio.buscarTodos();

    return {
      ...dadosAplicacao,
      stats: this.montarEstatisticas(dadosAplicacao)
    };
  }

  montarEstatisticas(dadosAplicacao: DadosAplicacao): EstatisticasPainel {
    return {
      animalsHelped: dadosAplicacao.ngos.reduce((total, ong) => total + ong.animalsHelped, 0),
      activeNgos: dadosAplicacao.ngos.length,
      donors: dadosAplicacao.campaigns.reduce((total, campanha) => total + campanha.supporters, 0),
      activeReports: dadosAplicacao.reports.filter((denuncia) => denuncia.status !== "Resolvida").length
    };
  }
}
