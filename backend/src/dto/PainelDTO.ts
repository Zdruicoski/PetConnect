import type { Campanha } from "../entity/Campanha";
import type { Denuncia } from "../entity/Denuncia";
import type { Ong } from "../entity/Ong";

export interface EstatisticasPainel {
  animalsHelped: number;
  activeNgos: number;
  donors: number;
  activeReports: number;
}

export class PainelDTO {
  public campaigns: Campanha[];
  public ngos: Ong[];
  public reports: Denuncia[];
  public stats: EstatisticasPainel;

  constructor(
    campaigns: Campanha[],
    ngos: Ong[],
    reports: Denuncia[],
    stats: EstatisticasPainel
  ) {
    this.campaigns = campaigns;
    this.ngos = ngos;
    this.reports = reports;
    this.stats = stats;
  }
}
