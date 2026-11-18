import * as crypto from "crypto";

import type { DadosCampanha, DadosDoacao, DetalheCampanhaDTO, PainelDTO } from "../dto/dtos";
import { validarDadosCampanha, validarDadosDoacao } from "../dto/dtos";
import type { Campanha, Doacao, Ong } from "../entity/modelos";
import { ErroHttp } from "../ErroHttp";
import type { CatalogoRepository } from "../repository/CatalogoRepository";
import type { ComunidadeRepository } from "../repository/ComunidadeRepository";
import type { NotificacaoService } from "./NotificacaoService";

export class CatalogoService {
  private catalogo: CatalogoRepository;
  private comunidade: ComunidadeRepository;
  private notificacoes: NotificacaoService;

  constructor(
    catalogo: CatalogoRepository,
    comunidade: ComunidadeRepository,
    notificacoes: NotificacaoService
  ) {
    this.catalogo = catalogo;
    this.comunidade = comunidade;
    this.notificacoes = notificacoes;
  }

  // ---------- Campanhas ----------

  listarCampanhas(): Promise<Campanha[]> {
    return this.catalogo.listarCampanhas();
  }

  async detalharCampanha(id: string): Promise<DetalheCampanhaDTO> {
    const campanha = await this.catalogo.buscarCampanha(id);

    if (!campanha) {
      throw new ErroHttp(404, "Campanha não encontrada.");
    }

    const [ong, doacoesRecentes] = await Promise.all([
      this.catalogo.buscarOng(campanha.ngoId),
      this.catalogo.listarDoacoesPorCampanha(id, 8)
    ]);

    if (!ong) {
      throw new ErroHttp(404, "ONG da campanha não encontrada.");
    }

    return { campaign: campanha, ngo: ong, recentDonations: doacoesRecentes };
  }

  async abrirCampanha(ongId: string, dados: DadosCampanha): Promise<Campanha> {
    const novaCampanha = validarDadosCampanha(dados);
    const id = `camp-${crypto.randomUUID()}`;

    await this.catalogo.inserirCampanha({ ...novaCampanha, id, ngoId: ongId });

    const campanha = await this.catalogo.buscarCampanha(id);

    if (!campanha) {
      throw new ErroHttp(500, "Não foi possível criar a campanha.");
    }

    this.notificacoes.notificarTodos("campaign-created", {
      campaign: campanha,
      message: `${campanha.ngoName} abriu a campanha ${campanha.title}`
    });

    return campanha;
  }

  // ---------- ONGs ----------

  listarOngs(): Promise<Ong[]> {
    return this.catalogo.listarOngs();
  }

  // ---------- Doações ----------

  listarDoacoes(): Promise<Doacao[]> {
    return this.catalogo.listarDoacoes();
  }

  async criarDoacao(dados: DadosDoacao): Promise<{ donation: Doacao; campaign: Campanha }> {
    const doacao: Doacao = {
      id: `don-${crypto.randomUUID()}`,
      ...validarDadosDoacao(dados),
      createdAt: new Date().toISOString()
    };

    const campanha = await this.catalogo.registrarDoacao(doacao);

    if (!campanha) {
      throw new ErroHttp(404, "Campanha não encontrada.");
    }

    const resultado = { donation: doacao, campaign: campanha };

    this.notificacoes.notificarTodos("donation-created", {
      ...resultado,
      message: `${doacao.donorName} apoiou ${campanha.title}`
    });

    return resultado;
  }

  // ---------- Painel ----------

  async obterPainel(): Promise<PainelDTO> {
    const [campanhas, ongs, denuncias] = await Promise.all([
      this.catalogo.listarCampanhas(),
      this.catalogo.listarOngs(),
      this.comunidade.listarDenuncias()
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
