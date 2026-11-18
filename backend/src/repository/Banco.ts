import { Pool } from "pg";

export type Consultor = {
  consultar<T>(sql: string, parametros?: unknown[]): Promise<T[]>;
};

// Estrutura esperada no banco local "PetConnect_db".
// Os comandos são idempotentes: criam apenas o que ainda não existe.
const comandosEsquema = [
  `CREATE TABLE IF NOT EXISTS ngos (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     city TEXT NOT NULL DEFAULT '',
     about TEXT NOT NULL DEFAULT '',
     animals_helped INTEGER NOT NULL DEFAULT 0,
     volunteers INTEGER NOT NULL DEFAULT 0,
     active_campaigns INTEGER NOT NULL DEFAULT 0,
     image_url TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS campaigns (
     id TEXT PRIMARY KEY,
     ngo_id TEXT NOT NULL REFERENCES ngos (id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     target NUMERIC(12, 2) NOT NULL,
     raised NUMERIC(12, 2) NOT NULL DEFAULT 0,
     supporters INTEGER NOT NULL DEFAULT 0,
     donations INTEGER NOT NULL DEFAULT 0,
     image_url TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS details TEXT NOT NULL DEFAULT ''`,
  `CREATE TABLE IF NOT EXISTS donations (
     id TEXT PRIMARY KEY,
     campaign_id TEXT NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
     donor_name TEXT NOT NULL DEFAULT 'Doador anônimo',
     type TEXT NOT NULL CHECK (type IN ('money', 'food')),
     amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
     food_description TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS reports (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT NOT NULL,
     urgency TEXT NOT NULL DEFAULT 'Média' CHECK (urgency IN ('Alta', 'Média', 'Baixa')),
     reporter_name TEXT NOT NULL DEFAULT 'Usuário PetConnect',
     address TEXT NOT NULL DEFAULT '',
     lat DOUBLE PRECISION NOT NULL,
     lng DOUBLE PRECISION NOT NULL,
     status TEXT NOT NULL DEFAULT 'Nova' CHECK (status IN ('Nova', 'Em análise', 'Resolvida')),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS volunteer_applications (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     role TEXT NOT NULL,
     message TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT UNIQUE,
     password_hash TEXT,
     type TEXT NOT NULL CHECK (type IN ('visitante', 'ong')),
     ngo_id TEXT REFERENCES ngos (id) ON DELETE SET NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`
];

export class Banco implements Consultor {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  static async conectar(urlConexao: string): Promise<Banco> {
    const pool = new Pool({ connectionString: urlConexao });

    try {
      await pool.query("SELECT 1");
      return new Banco(pool);
    } catch (erro) {
      await pool.end().catch(() => undefined);

      if ((erro as { code?: string }).code === "3D000") {
        const nomeBanco = Banco.obterNomeBanco(urlConexao);
        await Banco.criarBancoInexistente(urlConexao, nomeBanco);
        console.log(`Banco "${nomeBanco}" não existia e foi criado.`);

        const novoPool = new Pool({ connectionString: urlConexao });

        try {
          await novoPool.query("SELECT 1");
        } catch (erroConexao) {
          await novoPool.end().catch(() => undefined);
          throw new Error(
            `O banco "${nomeBanco}" foi criado, mas a conexão falhou. Detalhe: ${
              (erroConexao as Error).message
            }`
          );
        }

        return new Banco(novoPool);
      }

      throw new Error(
        `Não foi possível conectar ao banco. Verifique o DATABASE_URL no arquivo .env. Detalhe: ${
          (erro as Error).message
        }`
      );
    }
  }

  async aplicarEsquema(): Promise<void> {
    for (const comando of comandosEsquema) {
      await this.consultar(comando);
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

  async encerrar(): Promise<void> {
    await this.pool.end();
  }

  private static obterNomeBanco(urlConexao: string): string {
    const url = new URL(urlConexao);
    const nomeBanco = decodeURIComponent(url.pathname.replace(/^\//, ""));

    if (!nomeBanco) {
      throw new Error("O DATABASE_URL não informa o nome do banco de dados.");
    }

    if (!/^[A-Za-z0-9_]+$/.test(nomeBanco)) {
      throw new Error(`Nome de banco inválido em DATABASE_URL: "${nomeBanco}".`);
    }

    return nomeBanco;
  }

  private static async criarBancoInexistente(
    urlConexao: string,
    nomeBanco: string
  ): Promise<void> {
    const urlAdmin = new URL(urlConexao);
    urlAdmin.pathname = "/postgres";

    const poolAdmin = new Pool({ connectionString: urlAdmin.toString() });

    try {
      await poolAdmin.query(`CREATE DATABASE "${nomeBanco}"`);
    } catch (erro) {
      // 42P04 = banco criado por outro processo entre a checagem e o CREATE.
      if ((erro as { code?: string }).code !== "42P04") {
        throw erro;
      }
    } finally {
      await poolAdmin.end();
    }
  }
}
