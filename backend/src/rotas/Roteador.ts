import type { IncomingMessage, ServerResponse } from "http";

import type { ManipuladorRota, MetodoHttp, Rota } from "../http/TiposRota";

export class Roteador {
  rotas: Rota[];

  constructor() {
    this.rotas = [];
  }

  get(caminho: string, manipulador: ManipuladorRota): void {
    this.adicionar("GET", caminho, manipulador);
  }

  post(caminho: string, manipulador: ManipuladorRota): void {
    this.adicionar("POST", caminho, manipulador);
  }

  adicionar(metodo: MetodoHttp, caminho: string, manipulador: ManipuladorRota): void {
    this.rotas.push({ metodo, caminho, manipulador });
  }

  async atender(requisicao: IncomingMessage, resposta: ServerResponse): Promise<boolean> {
    const url = new URL(requisicao.url || "/", `http://${requisicao.headers.host || "localhost"}`);

    for (const rota of this.rotas) {
      const parametros = rota.metodo === requisicao.method ? this.casar(rota.caminho, url.pathname) : null;

      if (parametros) {
        await rota.manipulador({ requisicao, resposta, url, parametros });
        return true;
      }
    }

    return false;
  }

  // Aceita segmentos dinâmicos no formato "/api/campaigns/:id".
  private casar(padrao: string, caminho: string): Record<string, string> | null {
    const segmentosPadrao = padrao.split("/");
    const segmentosCaminho = caminho.split("/");

    if (segmentosPadrao.length !== segmentosCaminho.length) {
      return null;
    }

    const parametros: Record<string, string> = {};

    for (const [indice, segmento] of segmentosPadrao.entries()) {
      if (segmento.startsWith(":")) {
        parametros[segmento.slice(1)] = decodeURIComponent(segmentosCaminho[indice]);
      } else if (segmento !== segmentosCaminho[indice]) {
        return null;
      }
    }

    return parametros;
  }
}
