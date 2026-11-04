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
    const rota = this.rotas.find(
      (item) => item.metodo === requisicao.method && item.caminho === url.pathname
    );

    if (!rota) {
      return false;
    }

    await rota.manipulador({ requisicao, resposta, url });
    return true;
  }
}
