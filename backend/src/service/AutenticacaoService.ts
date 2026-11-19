import * as crypto from "crypto";

import {
  type DadosCadastroOng,
  type DadosCadastroVisitante,
  type DadosLoginOng,
  type DadosLoginVisitante,
  ResultadoLogin
} from "../dto/AutenticacaoDTO";
import { Usuario } from "../entity/Usuario";
import { ErroHttp } from "../ErroHttp";
import type { CatalogoRepository } from "../repository/CatalogoRepository";
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
  private catalogo?: CatalogoRepository;

  constructor(usuarios: UsuarioRepository, catalogo?: CatalogoRepository) {
    this.usuarios = usuarios;
    this.catalogo = catalogo;
  }

  async entrarComoVisitante(dados: DadosLoginVisitante): Promise<ResultadoLogin> {
    const email = String(dados.email || "").trim().toLowerCase();
    const senha = String(dados.password || "");

    if (!email || !senha) {
      throw new ErroHttp(400, "Email e senha são obrigatórios.");
    }

    const usuario = await this.usuarios.buscarPorEmail(email);

    if (
      !usuario ||
      usuario.type !== "visitante" ||
      !usuario.passwordHash ||
      !Senha.conferir(senha, usuario.passwordHash)
    ) {
      throw new ErroHttp(401, "Email ou senha inválidos.");
    }

    const usuarioPublico = new Usuario({
      id: usuario.id,
      name: usuario.name,
      type: usuario.type,
      ngoId: usuario.ngoId,
      ngoName: usuario.ngoName
    });

    return this.abrirSessao(usuarioPublico);
  }

  async cadastrarVisitante(dados: DadosCadastroVisitante): Promise<ResultadoLogin> {
    const nome = String(dados.name || "").trim().slice(0, 80);
    const email = String(dados.email || "").trim().toLowerCase();
    const cpf = String(dados.cpf || "").trim();
    const senha = String(dados.password || "");

    if (!nome) {
      throw new ErroHttp(400, "Informe seu nome para se cadastrar.");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ErroHttp(400, "Informe um email válido.");
    }

    if (!cpf) {
      throw new ErroHttp(400, "Informe o CPF para se cadastrar.");
    }

    if (!senha || senha.length < 6) {
      throw new ErroHttp(400, "A senha deve conter no mínimo 6 caracteres.");
    }

    const existente = await this.usuarios.buscarPorEmail(email);
    if (existente) {
      throw new ErroHttp(409, "Este email já está cadastrado.");
    }

    const usuario = new Usuario({
      id: `usr-${crypto.randomUUID()}`,
      name: nome,
      type: "visitante",
      cpf,
      ngoId: null,
      ngoName: null
    });

    await this.usuarios.inserir({
      id: usuario.id,
      name: nome,
      email,
      cpf,
      passwordHash: Senha.gerarHash(senha),
      type: "visitante",
      ngoId: null
    });

    return this.abrirSessao(usuario);
  }

  async cadastrarOng(dados: DadosCadastroOng): Promise<ResultadoLogin> {
    const nome = String(dados.name || "").trim().slice(0, 100);
    const email = String(dados.email || "").trim().toLowerCase();
    const cnpj = String(dados.cnpj || "").trim();
    const senha = String(dados.password || "");

    if (!nome) {
      throw new ErroHttp(400, "Informe o nome da ONG.");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ErroHttp(400, "Informe um email válido.");
    }

    if (!cnpj) {
      throw new ErroHttp(400, "Informe o CNPJ da ONG.");
    }

    if (!senha || senha.length < 6) {
      throw new ErroHttp(400, "A senha deve conter no mínimo 6 caracteres.");
    }

    const existente = await this.usuarios.buscarPorEmail(email);
    if (existente) {
      throw new ErroHttp(409, "Este email já está cadastrado.");
    }

    const ongId = `ong-${crypto.randomUUID()}`;

    if (this.catalogo) {
      await this.catalogo.inserirOng({
        id: ongId,
        name: nome,
        cnpj,
        city: "Tubarão - SC",
        about: "ONG cadastrada na plataforma PetConnect.",
        animalsHelped: 0,
        volunteers: 0,
        imageUrl:
          "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80"
      });
    }

    const usuario = new Usuario({
      id: `usr-${crypto.randomUUID()}`,
      name: nome,
      type: "ong",
      ngoId: ongId,
      ngoName: nome
    });

    await this.usuarios.inserir({
      id: usuario.id,
      name: nome,
      email,
      passwordHash: Senha.gerarHash(senha),
      type: "ong",
      ngoId: ongId
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

    const usuarioPublico = new Usuario({
      id: usuario.id,
      name: usuario.name,
      type: usuario.type,
      ngoId: usuario.ngoId,
      ngoName: usuario.ngoName
    });
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

    return usuario as Usuario & { ngoId: string };
  }

  private async abrirSessao(usuario: Usuario): Promise<ResultadoLogin> {
    const token = crypto.randomBytes(32).toString("hex");
    await this.usuarios.criarSessao(token, usuario.id);
    return new ResultadoLogin(token, usuario);
  }

  private lerToken(autorizacao?: string): string | null {
    if (!autorizacao) {
      return null;
    }

    return autorizacao.startsWith("Bearer ") ? autorizacao.slice(7).trim() : null;
  }
}
