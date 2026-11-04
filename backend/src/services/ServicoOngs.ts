import type { Ong } from "../entity/Ong";
import type { RepositorioJson } from "../repositories/RepositorioJson";

export class ServicoOngs {
  repositorio: RepositorioJson;

  constructor(repositorio: RepositorioJson) {
    this.repositorio = repositorio;
  }

  listarOngs(): Ong[] {
    return this.repositorio.buscarTodos().ngos;
  }
}
