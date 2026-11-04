import * as path from "path";

import { LeitorEnv } from "./LeitorEnv";

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

export class ConfiguracaoAplicacao {
  pastaRaiz: string;
  pastaFrontend: string;
  pastaDados: string;
  arquivoDados: string;
  porta: number;
  mapa: ConfiguracaoMapa;

  constructor(pastaRaiz: string) {
    const variaveisAmbiente = new LeitorEnv().carregar(path.join(pastaRaiz, ".env"));

    this.pastaRaiz = pastaRaiz;
    this.pastaFrontend = path.join(pastaRaiz, "frontend");
    this.pastaDados = path.join(pastaRaiz, "data");
    this.arquivoDados = path.join(this.pastaDados, "store.json");
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
