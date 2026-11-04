import type { ServerResponse } from "http";

export class RespostaHttp {
  static json(resposta: ServerResponse, status: number, dados: unknown): void {
    resposta.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    resposta.end(JSON.stringify(dados));
  }

  static texto(resposta: ServerResponse, status: number, dados: string): void {
    resposta.writeHead(status, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    resposta.end(dados);
  }
}
