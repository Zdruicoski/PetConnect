import { type TipoUsuario, Usuario, UsuarioComSenha } from "../entity/Usuario";
import type { Banco, Consultor } from "./Banco";

type Linha = Record<string, any>;

export type NovoUsuario = {
  id: string;
  name: string;
  email: string | null;
  cpf?: string | null;
  passwordHash: string | null;
  type: TipoUsuario;
  ngoId: string | null;
};

const selecionarUsuario = `
  SELECT u.*, o.name AS ngo_name
  FROM users u
  LEFT JOIN ngos o ON o.id = u.ngo_id`;

export class UsuarioRepository {
  private banco: Banco;

  constructor(banco: Banco) {
    this.banco = banco;
  }

  async inserir(usuario: NovoUsuario, consultor: Consultor = this.banco): Promise<void> {
    await consultor.consultar(
      `INSERT INTO users (id, name, email, cpf, password_hash, type, ngo_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        usuario.id,
        usuario.name,
        usuario.email,
        usuario.cpf ?? null,
        usuario.passwordHash,
        usuario.type,
        usuario.ngoId
      ]
    );
  }

  async buscarPorEmail(email: string): Promise<UsuarioComSenha | undefined> {
    const linhas = await this.banco.consultar<Linha>(`${selecionarUsuario} WHERE u.email = $1`, [
      email
    ]);
    if (!linhas[0]) return undefined;
    const base = paraUsuario(linhas[0]);
    return new UsuarioComSenha({
      ...base,
      passwordHash: linhas[0].password_hash
    });
  }

  async criarSessao(token: string, usuarioId: string): Promise<void> {
    await this.banco.consultar("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [
      token,
      usuarioId
    ]);
  }

  async buscarSessao(
    token: string
  ): Promise<{ usuario: Usuario; criadaEm: Date } | undefined> {
    const linhas = await this.banco.consultar<Linha>(
      `SELECT u.*, o.name AS ngo_name, s.created_at AS sessao_created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN ngos o ON o.id = u.ngo_id
       WHERE s.token = $1`,
      [token]
    );

    return (
      linhas[0] && {
        usuario: paraUsuario(linhas[0]),
        criadaEm: new Date(linhas[0].sessao_created_at)
      }
    );
  }

  async removerSessao(token: string): Promise<void> {
    await this.banco.consultar("DELETE FROM sessions WHERE token = $1", [token]);
  }
}

function paraUsuario(linha: Linha): Usuario {
  return new Usuario({
    id: linha.id,
    name: linha.name,
    type: linha.type as TipoUsuario,
    cpf: linha.cpf ?? null,
    ngoId: linha.ngo_id,
    ngoName: linha.ngo_name
  });
}
