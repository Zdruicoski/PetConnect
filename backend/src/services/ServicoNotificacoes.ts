import type { IncomingMessage, ServerResponse } from "http";

export type DadosNotificacao = Record<string, unknown>;

export class ServicoNotificacoes {
  clientes: Set<ServerResponse>;

  constructor() {
    this.clientes = new Set();
  }

  conectar(requisicao: IncomingMessage, resposta: ServerResponse): void {
    resposta.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });

    resposta.write("event: connected\n");
    resposta.write(`data: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);

    this.clientes.add(resposta);
    const manterConexao = setInterval(() => {
      resposta.write(`: keep-alive ${Date.now()}\n\n`);
    }, 25000);

    requisicao.on("close", () => {
      clearInterval(manterConexao);
      this.clientes.delete(resposta);
    });
  }

  notificarTodos(evento: string, dados: DadosNotificacao): void {
    const mensagem = `event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`;

    for (const cliente of this.clientes) {
      cliente.write(mensagem);
    }
  }
}
