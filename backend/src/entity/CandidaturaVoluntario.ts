import * as crypto from "crypto";

import { ErroHttp } from "../compartilhado/ErroHttp";

export type DadosCandidaturaVoluntario = {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  message?: unknown;
};

export class CandidaturaVoluntario {
  id: string;
  name: string;
  email: string;
  role: string;
  message: string;
  createdAt: string;

  constructor(dados: {
    id: string;
    name: string;
    email: string;
    role: string;
    message: string;
    createdAt: string;
  }) {
    this.id = dados.id;
    this.name = dados.name;
    this.email = dados.email;
    this.role = dados.role;
    this.message = dados.message;
    this.createdAt = dados.createdAt;
  }

  static criar(dados: DadosCandidaturaVoluntario): CandidaturaVoluntario {
    if (!dados.name || !dados.email || !dados.role) {
      throw new ErroHttp(400, "Nome, email e vaga são obrigatórios.");
    }

    return new CandidaturaVoluntario({
      id: `vol-${crypto.randomUUID()}`,
      name: String(dados.name).trim(),
      email: String(dados.email).trim(),
      role: String(dados.role).trim(),
      message: String(dados.message || "").trim(),
      createdAt: new Date().toISOString()
    });
  }
}
