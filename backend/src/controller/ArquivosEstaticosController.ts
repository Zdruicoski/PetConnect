import * as fs from "fs";
import * as path from "path";

import { RespostaHttp } from "../Servidor";
import type { ContextoRequisicao } from "../Servidor";

const tiposConteudo: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

export class ArquivosEstaticosController {
  private pastaFrontend: string;

  constructor(pastaFrontend: string) {
    this.pastaFrontend = pastaFrontend;
  }

  servir(contexto: ContextoRequisicao): void {
    const caminhoArquivo = contexto.url.pathname === "/" ? "/index.html" : contexto.url.pathname;
    const caminhoResolvido = path.resolve(
      this.pastaFrontend,
      `.${decodeURIComponent(caminhoArquivo)}`
    );

    if (!caminhoResolvido.startsWith(this.pastaFrontend)) {
      RespostaHttp.texto(contexto.resposta, 403, "Acesso negado.");
      return;
    }

    fs.readFile(caminhoResolvido, (erro, conteudo) => {
      if (erro) {
        RespostaHttp.texto(contexto.resposta, 404, "Arquivo não encontrado.");
        return;
      }

      contexto.resposta.writeHead(200, {
        "Content-Type": tiposConteudo[path.extname(caminhoResolvido).toLowerCase()] ||
          "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      contexto.resposta.end(conteudo);
    });
  }
}
