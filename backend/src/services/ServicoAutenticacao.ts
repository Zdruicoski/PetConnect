import * as crypto from "crypto";
import type { IncomingMessage } from "http";

import { ErroHttp } from "../compartilhado/ErroHttp";
import { Senha } from "../compartilhado/Senha";
import type { Usuario } from "../entity/Usuario";
import type { RepositorioPostgres } from "../repositories/RepositorioPostgres";

export type DadosLoginVisitante = {
  name?: unknown;
};

export type DadosLoginOng = {
  email?: unknown;
  password?: unknown;
};

export type ResultadoLogin = {
  token: string;
  user: Usuario;
};

const duracaoSessaoMs = 7 * 24 * 60 * 60 * 1000;

export class ServicoAutenticacao {
  repositorio: RepositorioPostgres;

  constructor(repositorio: RepositorioPostgres) {
    this.repositorio = repositorio;
  }

  async entrarComoVisitante(dados: DadosLoginVisitante): Promise<ResultadoLogin> {
    const nome = String(dados.name || "").trim().slice(0, 80);

    if (!nome) {
      throw new ErroHttp(400, "Informe seu nome para entrar.");
    }

    const usuario: Usuario = {
      id: `usr-${crypto.randomUUID()}`,
      name: nome,
      type: "visitante",
      ngoId: null,
      ngoName: null
    };

    await this.repositorio.inserirUsuario({
      id: usuario.id,
      name: nome,
      email: null,
      passwordHash: null,
      type: "visitante",
      ngoId: null
    });

    return this.abrirSessao(usuario);
  }

  async entrarComoOng(dados: DadosLoginOng): Promise<ResultadoLogin> {
    const email = String(dados.email || "").trim().toLowerCase();
    const senha = String(dados.password || "");
    const usuario = email ? await this.repositorio.buscarUsuarioPorEmail(email) : undefined;

    if (!usuario || usuario.type !== "ong" || !usuario.passwordHash || !Senha.conferir(senha, usuario.passwordHash)) {
      throw new ErroHttp(401, "Email ou senha inválidos.");
    }

    const { passwordHash, ...usuarioPublico } = usuario;
    return this.abrirSessao(usuarioPublico);
  }

  async sair(requisicao: IncomingMessage): Promise<void> {
    const token = this.lerToken(requisicao);

    if (token) {
      await this.repositorio.removerSessao(token);
    }
  }

  async obterUsuario(requisicao: IncomingMessage): Promise<Usuario | null> {
    const token = this.lerToken(requisicao);
    const sessao = token ? await this.repositorio.buscarUsuarioPorSessao(token) : undefined;

    if (!token || !sessao) {
      return null;
    }

    if (Date.now() - sessao.criadaEm.getTime() > duracaoSessaoMs) {
      await this.repositorio.removerSessao(token);
      return null;
    }

    return sessao.usuario;
  }

  async exigirUsuario(requisicao: IncomingMessage): Promise<Usuario> {
    const usuario = await this.obterUsuario(requisicao);

    if (!usuario) {
      throw new ErroHttp(401, "Faça login para continuar.");
    }

    return usuario;
  }

  async exigirOng(requisicao: IncomingMessage): Promise<Usuario & { ngoId: string }> {
    const usuario = await this.exigirUsuario(requisicao);

    if (usuario.type !== "ong" || !usuario.ngoId) {
      throw new ErroHttp(403, "Apenas ONGs podem fazer isso.");
    }

    return { ...usuario, ngoId: usuario.ngoId };
  }

  private async abrirSessao(usuario: Usuario): Promise<ResultadoLogin> {
    const token = crypto.randomBytes(32).toString("hex");
    await this.repositorio.criarSessao(token, usuario.id);
    return { token, user: usuario };
  }

  private lerToken(requisicao: IncomingMessage): string | null {
    const cabecalho = requisicao.headers.authorization || "";
    return cabecalho.startsWith("Bearer ") ? cabecalho.slice(7).trim() : null;
  }
}
