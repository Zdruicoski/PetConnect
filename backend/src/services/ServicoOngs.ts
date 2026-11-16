import type { Ong } from "../entity/Ong";
import type { RepositorioPostgres } from "../repositories/RepositorioPostgres";

export class ServicoOngs {
  repositorio: RepositorioPostgres;

  constructor(repositorio: RepositorioPostgres) {
    this.repositorio = repositorio;
  }

  listarOngs(): Promise<Ong[]> {
    return this.repositorio.listarOngs();
  }
}
