import type { Campanha } from "./Campanha";
import type { CandidaturaVoluntario } from "./CandidaturaVoluntario";
import type { Denuncia } from "./Denuncia";
import type { Doacao } from "./Doacao";
import type { Ong } from "./Ong";

export type EstatisticasPainel = {
  animalsHelped: number;
  activeNgos: number;
  donors: number;
  activeReports: number;
};

export type DadosAplicacao = {
  campaigns: Campanha[];
  ngos: Ong[];
  reports: Denuncia[];
  donations: Doacao[];
  volunteerApplications: CandidaturaVoluntario[];
};
