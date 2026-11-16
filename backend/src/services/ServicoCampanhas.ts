import * as crypto from "crypto";

import { ErroHttp } from "../compartilhado/ErroHttp";
import { validarNovaCampanha, type Campanha, type DadosCampanha } from "../entity/Campanha";
import type { Doacao } from "../entity/Doacao";
import type { Ong } from "../entity/Ong";
import type { RepositorioPostgres } from "../repositories/RepositorioPostgres";
import type { ServicoNotificacoes } from "./ServicoNotificacoes";

export type DetalheCampanha = {
  campaign: Campanha;
  ngo: Ong;
  recentDonations: Doacao[];
};

export class ServicoCampanhas {
  repositorio: RepositorioPostgres;
  notificacoes: ServicoNotificacoes;

  constructor(repositorio: RepositorioPostgres, notificacoes: ServicoNotificacoes) {
    this.repositorio = repositorio;
    this.notificacoes = notificacoes;
  }

  listarCampanhas(): Promise<Campanha[]> {
    return this.repositorio.listarCampanhas();
  }

  async detalharCampanha(id: string): Promise<DetalheCampanha> {
    const campanha = await this.repositorio.buscarCampanha(id);

    if (!campanha) {
      throw new ErroHttp(404, "Campanha não encontrada.");
    }

    const [ong, doacoesRecentes] = await Promise.all([
      this.repositorio.buscarOng(campanha.ngoId),
      this.repositorio.listarDoacoesDaCampanha(id, 8)
    ]);

    return { campaign: campanha, ngo: ong as Ong, recentDonations: doacoesRecentes };
  }

  async abrirCampanha(ongId: string, dados: DadosCampanha): Promise<Campanha> {
    const novaCampanha = validarNovaCampanha(dados);
    const id = `camp-${crypto.randomUUID()}`;

    await this.repositorio.inserirCampanha({ ...novaCampanha, id, ngoId: ongId });
    const campanha = (await this.repositorio.buscarCampanha(id)) as Campanha;

    this.notificacoes.notificarTodos("campaign-created", {
      campaign: campanha,
      message: `${campanha.ngoName} abriu a campanha ${campanha.title}`
    });

    return campanha;
  }
}
