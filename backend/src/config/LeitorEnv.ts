import * as fs from "fs";

export type MapaEnv = Record<string, string>;

export class LeitorEnv {
  carregar(caminhoArquivo: string): MapaEnv {
    if (!fs.existsSync(caminhoArquivo)) {
      return {};
    }

    return fs
      .readFileSync(caminhoArquivo, "utf8")
      .split(/\r?\n/)
      .reduce<MapaEnv>((variaveis, linha) => {
        const linhaLimpa = linha.trim();

        if (!linhaLimpa || linhaLimpa.startsWith("#") || !linhaLimpa.includes("=")) {
          return variaveis;
        }

        const [chave, ...partesValor] = linhaLimpa.split("=");
        variaveis[chave.trim()] = partesValor.join("=").trim().replace(/^["']|["']$/g, "");
        return variaveis;
      }, {});
  }
}
