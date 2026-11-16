import type { Campanha } from "../entity/Campanha";
import type { Denuncia } from "../entity/Denuncia";
import type { Ong } from "../entity/Ong";
import type { EstatisticasPainel } from "../entity/Usuario";
import type { RepositorioPostgres } from "../repositories/RepositorioPostgres";

export type Painel = {
  campaigns: Campanha[];
  ngos: Ong[];
  reports: Denuncia[];
  stats: EstatisticasPainel;
};

export class ServicoPainel {
  repositorio: RepositorioPostgres;

  constructor(repositorio: RepositorioPostgres) {
    this.repositorio = repositorio;
  }

  async obterPainel(): Promise<Painel> {
    const [campanhas, ongs, denuncias] = await Promise.all([
      this.repositorio.listarCampanhas(),
      this.repositorio.listarOngs(),
      this.repositorio.listarDenuncias()
    ]);

    return {
      campaigns: campanhas,
      ngos: ongs,
      reports: denuncias,
      stats: {
        animalsHelped: ongs.reduce((total, ong) => total + ong.animalsHelped, 0),
        activeNgos: ongs.length,
        donors: campanhas.reduce((total, campanha) => total + campanha.supporters, 0),
        activeReports: denuncias.filter((denuncia) => denuncia.status !== "Resolvida").length
      }
    };
  }
}
