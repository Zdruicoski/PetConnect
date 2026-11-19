import type { Usuario } from "../entity/Usuario";

export interface DadosLoginVisitante {
  email?: unknown;
  password?: unknown;
}

export interface DadosCadastroVisitante {
  name?: unknown;
  email?: unknown;
  cpf?: unknown;
  password?: unknown;
}

export interface DadosLoginOng {
  email?: unknown;
  password?: unknown;
}

export interface DadosCadastroOng {
  name?: unknown;
  email?: unknown;
  cnpj?: unknown;
  password?: unknown;
}

export class ResultadoLogin {
  public token: string;
  public user: Usuario;

  constructor(token: string, user: Usuario) {
    this.token = token;
    this.user = user;
  }
}
