import type { IncomingMessage } from "http";

import { ErroHttp } from "../compartilhado/ErroHttp";

export class CorpoRequisicao {
  static lerJson(requisicao: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let corpo = "";

      requisicao.on("data", (parte) => {
        corpo += parte;

        if (corpo.length > 1_000_000) {
          requisicao.destroy();
          reject(new ErroHttp(413, "Corpo da requisição muito grande."));
        }
      });

      requisicao.on("end", () => {
        try {
          resolve(corpo ? JSON.parse(corpo) : {});
        } catch {
          reject(new ErroHttp(400, "JSON inválido."));
        }
      });
    });
  }
}
