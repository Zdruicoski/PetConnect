import * as path from "path";

import { criarAplicacao } from "./app";
import { ConfiguracaoAplicacao } from "./config/ConfiguracaoAplicacao";
import { Banco } from "./repositories/Banco";

async function iniciar(): Promise<void> {
  const pastaRaiz = path.resolve(__dirname, "..", "..");
  const configuracao = new ConfiguracaoAplicacao(pastaRaiz);

  if (!configuracao.urlBanco) {
    console.error(
      "DATABASE_URL não definida. Copie .env.example para .env e informe a conexão com o PostgreSQL."
    );
    process.exit(1);
  }

  const banco = await Banco.conectar(configuracao.urlBanco);
  const servidor = await criarAplicacao(configuracao, banco);
  servidor.iniciar();
}

iniciar().catch((erro) => {
  console.error("Não foi possível iniciar o PetConnect:", erro.message || erro);
  process.exit(1);
});
