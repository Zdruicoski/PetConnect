import * as fs from "fs";
import { Pool } from "pg";

export type Consultor = {
  consultar<T>(sql: string, parametros?: unknown[]): Promise<T[]>;
};

export class Banco implements Consultor {
  pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  static async conectar(urlConexao: string): Promise<Banco> {
    const pool = new Pool({ connectionString: urlConexao });

    try {
      await pool.query("SELECT 1");
    } catch (erro) {
      await pool.end();

      if ((erro as { code?: string }).code !== "3D000") {
        throw erro;
      }

      await Banco.criarBancoInexistente(urlConexao);
      return Banco.conectar(urlConexao);
    }

    return new Banco(pool);
  }

  async aplicarEsquema(caminhoArquivo: string): Promise<void> {
    const comandos = fs
      .readFileSync(caminhoArquivo, "utf8")
      .split(";")
      .map((comando) => comando.trim())
      .filter(Boolean);

    for (const comando of comandos) {
      await this.pool.query(comando);
    }
  }

  async consultar<T>(sql: string, parametros: unknown[] = []): Promise<T[]> {
    const resultado = await this.pool.query(sql, parametros);
    return resultado.rows as T[];
  }

  async transacao<T>(operacao: (consultor: Consultor) => Promise<T>): Promise<T> {
    const cliente = await this.pool.connect();

    try {
      await cliente.query("BEGIN");
      const resultado = await operacao({
        consultar: async <R>(sql: string, parametros: unknown[] = []) =>
          (await cliente.query(sql, parametros)).rows as R[]
      });
      await cliente.query("COMMIT");
      return resultado;
    } catch (erro) {
      await cliente.query("ROLLBACK");
      throw erro;
    } finally {
      cliente.release();
    }
  }

  private static async criarBancoInexistente(urlConexao: string): Promise<void> {
    const url = new URL(urlConexao);
    const nomeBanco = decodeURIComponent(url.pathname.slice(1));

    if (!/^[A-Za-z0-9_]+$/.test(nomeBanco)) {
      throw new Error(`Nome de banco inválido em DATABASE_URL: "${nomeBanco}".`);
    }

    url.pathname = "/postgres";
    const poolAdmin = new Pool({ connectionString: url.toString() });

    try {
      await poolAdmin.query(`CREATE DATABASE ${nomeBanco}`);
      console.log(`Banco "${nomeBanco}" criado.`);
    } finally {
      await poolAdmin.end();
    }
  }
}
