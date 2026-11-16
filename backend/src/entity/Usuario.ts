export type TipoUsuario = "visitante" | "ong";

export type Usuario = {
  id: string;
  name: string;
  type: TipoUsuario;
  ngoId: string | null;
  ngoName: string | null;
};

export type EstatisticasPainel = {
  animalsHelped: number;
  activeNgos: number;
  donors: number;
  activeReports: number;
};
