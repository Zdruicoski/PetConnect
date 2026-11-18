import * as crypto from "crypto";

import type { DadosCandidaturaVoluntario, DadosDenuncia } from "../dto/dtos";
import { validarDadosCandidatura, validarDadosDenuncia } from "../dto/dtos";
import type { CandidaturaVoluntario, Denuncia } from "../entity/modelos";
import type { ComunidadeRepository } from "../repository/ComunidadeRepository";
import type { NotificacaoService } from "./NotificacaoService";

export class ComunidadeService {
  private comunidade: ComunidadeRepository;
  private notificacoes: NotificacaoService;

  constructor(comunidade: ComunidadeRepository, notificacoes: NotificacaoService) {
    this.comunidade = comunidade;
    this.notificacoes = notificacoes;
  }

  // ---------- Denúncias ----------

  listarDenuncias(): Promise<Denuncia[]> {
    return this.comunidade.listarDenuncias();
  }

  async criarDenuncia(dados: DadosDenuncia): Promise<Denuncia> {
    const denuncia: Denuncia = {
      id: `rep-${crypto.randomUUID()}`,
      ...validarDadosDenuncia(dados),
      status: "Nova",
      createdAt: new Date().toISOString()
    };

    await this.comunidade.inserirDenuncia(denuncia);

    this.notificacoes.notificarTodos("report-created", {
      report: denuncia,
      message: `Nova denúncia registrada: ${denuncia.title}`
    });

    return denuncia;
  }

  // ---------- Voluntariado ----------

  listarCandidaturas(): Promise<CandidaturaVoluntario[]> {
    return this.comunidade.listarCandidaturas();
  }

  async criarCandidatura(
    dados: DadosCandidaturaVoluntario
  ): Promise<CandidaturaVoluntario> {
    const candidatura: CandidaturaVoluntario = {
      id: `vol-${crypto.randomUUID()}`,
      ...validarDadosCandidatura(dados),
      createdAt: new Date().toISOString()
    };

    await this.comunidade.inserirCandidatura(candidatura);

    this.notificacoes.notificarTodos("volunteer-created", {
      application: candidatura,
      message: `${candidatura.name} se candidatou para voluntariado.`
    });

    return candidatura;
  }
}
