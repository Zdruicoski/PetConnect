import * as crypto from "crypto";

import type { DadosLoginOng, DadosLoginVisitante, ResultadoLogin } from "../dto/dtos";
import type { Usuario } from "../entity/modelos";
import { ErroHttp } from "../ErroHttp";
import type { UsuarioRepository } from "../repository/UsuarioRepository";

const duracaoSessaoMs = 7 * 24 * 60 * 60 * 1000;

export class Senha {
  static gerarHash(senha: string): string {
    const sal = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(senha, sal, 64).toString("hex");
    return `${sal}:${hash}`;
  }

  static conferir(senha: string, hashSalvo: string): boolean {
    const [sal, hash] = hashSalvo.split(":");

    if (!sal || !hash) {
      return false;
    }

    const esperado = Buffer.from(hash, "hex");
    const calculado = crypto.scryptSync(senha, sal, esperado.length);
    return crypto.timingSafeEqual(esperado, calculado);
  }
}

export class AutenticacaoService {
  private usuarios: UsuarioRepository;

  constructor(usuarios: UsuarioRepository) {
    this.usuarios = usuarios;
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

    await this.usuarios.inserir({
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
    const usuario = email ? await this.usuarios.buscarPorEmail(email) : undefined;

    if (
      !usuario ||
      usuario.type !== "ong" ||
      !usuario.passwordHash ||
      !Senha.conferir(senha, usuario.passwordHash)
    ) {
      throw new ErroHttp(401, "Email ou senha inválidos.");
    }

    const { passwordHash: _passwordHash, ...usuarioPublico } = usuario;
    return this.abrirSessao(usuarioPublico);
  }

  async sair(autorizacao?: string): Promise<void> {
    const token = this.lerToken(autorizacao);

    if (token) {
      await this.usuarios.removerSessao(token);
    }
  }

  async obterUsuario(autorizacao?: string): Promise<Usuario | null> {
    const token = this.lerToken(autorizacao);
    const sessao = token ? await this.usuarios.buscarSessao(token) : undefined;

    if (!token || !sessao) {
      return null;
    }

    if (Date.now() - sessao.criadaEm.getTime() > duracaoSessaoMs) {
      await this.usuarios.removerSessao(token);
      return null;
    }

    return sessao.usuario;
  }

  async exigirUsuario(autorizacao?: string): Promise<Usuario> {
    const usuario = await this.obterUsuario(autorizacao);

    if (!usuario) {
      throw new ErroHttp(401, "Faça login para continuar.");
    }

    return usuario;
  }

  async exigirOng(autorizacao?: string): Promise<Usuario & { ngoId: string }> {
    const usuario = await this.exigirUsuario(autorizacao);

    if (usuario.type !== "ong" || !usuario.ngoId) {
      throw new ErroHttp(403, "Apenas ONGs podem fazer isso.");
    }

    return { ...usuario, ngoId: usuario.ngoId };
  }

  private async abrirSessao(usuario: Usuario): Promise<ResultadoLogin> {
    const token = crypto.randomBytes(32).toString("hex");
    await this.usuarios.criarSessao(token, usuario.id);
    return { token, user: usuario };
  }

  private lerToken(autorizacao?: string): string | null {
    if (!autorizacao) {
      return null;
    }

    return autorizacao.startsWith("Bearer ") ? autorizacao.slice(7).trim() : null;
  }
}
