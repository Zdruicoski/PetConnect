import * as crypto from "crypto";

import {
  campanhasIniciais,
  denunciasIniciais,
  ongsIniciais,
  senhaDemonstracaoOngs
} from "../compartilhado/dadosIniciais";
import { Senha } from "../compartilhado/Senha";
import type { RepositorioPostgres } from "./RepositorioPostgres";

export class Semeador {
  repositorio: RepositorioPostgres;

  constructor(repositorio: RepositorioPostgres) {
    this.repositorio = repositorio;
  }

  async semearSeVazio(): Promise<void> {
    if ((await this.repositorio.contarOngs()) > 0) {
      return;
    }

    await this.repositorio.banco.transacao(async (consultor) => {
      const hashSenha = Senha.gerarHash(senhaDemonstracaoOngs);

      for (const { email, ...ong } of ongsIniciais) {
        await this.repositorio.inserirOng(ong, consultor);
        await this.repositorio.inserirUsuario(
          {
            id: `usr-${crypto.randomUUID()}`,
            name: ong.name,
            email,
            passwordHash: hashSenha,
            type: "ong",
            ngoId: ong.id
          },
          consultor
        );
      }

      // Datas escalonadas para que a primeira campanha da lista seja a mais recente.
      for (const [indice, campanha] of campanhasIniciais.entries()) {
        await this.repositorio.inserirCampanha(
          { ...campanha, createdAt: new Date(Date.now() - indice * 60_000) },
          consultor
        );
      }

      for (const { minutosAtras, ...denuncia } of denunciasIniciais) {
        await this.repositorio.inserirDenuncia(
          { ...denuncia, createdAt: new Date(Date.now() - minutosAtras * 60_000).toISOString() },
          consultor
        );
      }
    });

    console.log("Banco populado com os dados iniciais.");
  }
}
