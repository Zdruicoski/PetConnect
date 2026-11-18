import * as fs from "fs";
import * as path from "path";

export type ConfiguracaoMapa = {
  provedor: "leaflet-openstreetmap";
  urlTiles: string;
  atribuicao: string;
  zoomInicial: number;
  defaultCenter: {
    lat: number;
    lng: number;
  };
};

const urlBancoPadrao = "postgres://postgres:postgres@localhost:5432/PetConnect_db";

export class Configuracao {
  pastaRaiz: string;
  pastaFrontend: string;
  urlBanco: string;
  nomeBanco: string;
  porta: number;
  mapa: ConfiguracaoMapa;

  constructor(pastaRaiz: string) {
    const variaveisAmbiente = lerEnv(path.join(pastaRaiz, ".env"));

    this.pastaRaiz = pastaRaiz;
    this.pastaFrontend = path.join(pastaRaiz, "frontend");
    this.urlBanco =
      process.env.DATABASE_URL || variaveisAmbiente.DATABASE_URL || urlBancoPadrao;
    this.nomeBanco = extrairNomeBanco(this.urlBanco);
    this.porta = Number(process.env.PORT || variaveisAmbiente.PORT || 3000);
    this.mapa = {
      provedor: "leaflet-openstreetmap",
      urlTiles:
        process.env.MAP_TILE_URL ||
        variaveisAmbiente.MAP_TILE_URL ||
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      atribuicao:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      zoomInicial: 13,
      defaultCenter: { lat: -28.4806, lng: -49.0064 }
    };
  }
}

function lerEnv(caminhoArquivo: string): Record<string, string> {
  if (!fs.existsSync(caminhoArquivo)) {
    return {};
  }

  return fs
    .readFileSync(caminhoArquivo, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((variaveis, linha) => {
      const linhaLimpa = linha.trim();

      if (!linhaLimpa || linhaLimpa.startsWith("#") || !linhaLimpa.includes("=")) {
        return variaveis;
      }

      const [chave, ...partesValor] = linhaLimpa.split("=");
      variaveis[chave.trim()] = partesValor.join("=").trim().replace(/^["']|["']$/g, "");
      return variaveis;
    }, {});
}

function extrairNomeBanco(urlBanco: string): string {
  try {
    const nome = decodeURIComponent(new URL(urlBanco).pathname.replace(/^\//, ""));
    return nome || "PetConnect_db";
  } catch {
    return "PetConnect_db";
  }
}
