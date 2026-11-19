import { ErroHttp } from "../ErroHttp";

export interface DadosCandidaturaVoluntario {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  message?: unknown;
}

export interface CandidaturaVoluntarioValidada {
  name: string;
  email: string;
  role: string;
  message: string;
}

export class CandidaturaVoluntarioDTO {
  static validar(dados: DadosCandidaturaVoluntario): CandidaturaVoluntarioValidada {
    if (!dados.name || !dados.email || !dados.role) {
      throw new ErroHttp(400, "Nome, email e vaga são obrigatórios.");
    }

    return {
      name: String(dados.name).trim(),
      email: String(dados.email).trim(),
      role: String(dados.role).trim(),
      message: String(dados.message || "").trim()
    };
  }
}

export const validarDadosCandidatura = CandidaturaVoluntarioDTO.validar;
