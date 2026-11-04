import type { Campanha } from "../entity/Campanha";
import type { RepositorioJson } from "../repositories/RepositorioJson";

export class ServicoCampanhas {
  repositorio: RepositorioJson;

  constructor(repositorio: RepositorioJson) {
    this.repositorio = repositorio;
  }

  listarCampanhas(): Campanha[] {
    return this.repositorio.buscarTodos().campaigns;
  }
}
