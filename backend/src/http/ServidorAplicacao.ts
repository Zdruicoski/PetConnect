import * as http from "http";
import type { IncomingMessage, Server, ServerResponse } from "http";

import type { ConfiguracaoAplicacao } from "../config/ConfiguracaoAplicacao";
import type { ControladorArquivosEstaticos } from "../controllers/ControladorArquivosEstaticos";
import type { Roteador } from "../rotas/Roteador";
import { ErroHttp } from "../compartilhado/ErroHttp";
import { RespostaHttp } from "./RespostaHttp";

export class ServidorAplicacao {
  configuracao: ConfiguracaoAplicacao;
  roteador: Roteador;
  controladorArquivosEstaticos: ControladorArquivosEstaticos;
  servidor: Server;

  constructor(
    configuracao: ConfiguracaoAplicacao,
    roteador: Roteador,
    controladorArquivosEstaticos: ControladorArquivosEstaticos
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
      console.log(`PetConnect TypeScript API rodando em http://localhost:${this.configuracao.porta}`);
    });
  }

  async atenderRequisicao(requisicao: IncomingMessage, resposta: ServerResponse): Promise<void> {
    try {
      const rotaAtendida = await this.roteador.atender(requisicao, resposta);

      if (!rotaAtendida) {
        const url = new URL(requisicao.url || "/", `http://${requisicao.headers.host || "localhost"}`);
        this.controladorArquivosEstaticos.servir({ requisicao, resposta, url });
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
