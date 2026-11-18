import * as path from "path";

import { criarAplicacao } from "./app";
import { Configuracao } from "./Configuracao";

async function iniciar(): Promise<void> {
  const pastaRaiz = path.resolve(__dirname, "..", "..");
  const configuracao = new Configuracao(pastaRaiz);
  const servidor = await criarAplicacao(configuracao);

  servidor.iniciar();
}

iniciar().catch((erro) => {
  console.error("Não foi possível iniciar o PetConnect:", erro.message || erro);
  process.exit(1);
});
