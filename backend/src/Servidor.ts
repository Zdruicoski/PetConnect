import * as http from "http";
import type { IncomingMessage, Server, ServerResponse } from "http";

import type { Configuracao } from "./Configuracao";
import type { ArquivosEstaticosController } from "./controller/ArquivosEstaticosController";
import { ErroHttp } from "./ErroHttp";

export type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ContextoRequisicao = {
  requisicao: IncomingMessage;
  resposta: ServerResponse;
  url: URL;
  parametros: Record<string, string>;
};

export type ManipuladorRota = (contexto: ContextoRequisicao) => Promise<void> | void;

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

type Rota = {
  metodo: MetodoHttp;
  caminho: string;
  manipulador: ManipuladorRota;
};

export class Roteador {
  private rotas: Rota[] = [];

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
      const parametros =
        rota.metodo === requisicao.method ? this.casar(rota.caminho, url.pathname) : null;

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

export class ServidorAplicacao {
  private configuracao: Configuracao;
  private roteador: Roteador;
  private controladorArquivosEstaticos: ArquivosEstaticosController;
  private servidor: Server;

  constructor(
    configuracao: Configuracao,
    roteador: Roteador,
    controladorArquivosEstaticos: ArquivosEstaticosController
  ) {
    this.configuracao = configuracao;
    this.roteador = roteador;
    this.controladorArquivosEstaticos = controladorArquivosEstaticos;
    this.servidor = http.createServer((requisicao, resposta) => {
      this.atenderRequisicao(requisicao, resposta);
    });
  }

  iniciar(): void {
    this.servidor.on("error", (erro: NodeJS.ErrnoException) => {
      if (erro.code === "EADDRINUSE") {
        console.error(
          `A porta ${this.configuracao.porta} já está em uso. Encerre o outro servidor com Ctrl+C ou altere PORT no arquivo .env.`
        );
        process.exit(1);
      }

      throw erro;
    });

    this.servidor.listen(this.configuracao.porta, () => {
      console.log(
        `PetConnect TypeScript API rodando em http://localhost:${this.configuracao.porta}`
      );
    });
  }

  private async atenderRequisicao(
    requisicao: IncomingMessage,
    resposta: ServerResponse
  ): Promise<void> {
    try {
      const rotaAtendida = await this.roteador.atender(requisicao, resposta);

      if (!rotaAtendida) {
        const url = new URL(
          requisicao.url || "/",
          `http://${requisicao.headers.host || "localhost"}`
        );
        this.controladorArquivosEstaticos.servir({ requisicao, resposta, url, parametros: {} });
      }
    } catch (erro) {
      this.tratarErro(resposta, erro);
    }
  }

  private tratarErro(resposta: ServerResponse, erro: unknown): void {
    if (erro instanceof ErroHttp) {
      RespostaHttp.json(resposta, erro.statusCode, { error: erro.message });
      return;
    }

    console.error(erro);
    RespostaHttp.json(resposta, 500, { error: "Erro interno no servidor." });
  }
}
