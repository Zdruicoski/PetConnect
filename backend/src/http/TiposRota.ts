import type { IncomingMessage, ServerResponse } from "http";

export type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ContextoRequisicao = {
  requisicao: IncomingMessage;
  resposta: ServerResponse;
  url: URL;
};

export type ManipuladorRota = (contexto: ContextoRequisicao) => Promise<void> | void;

export type Rota = {
  metodo: MetodoHttp;
  caminho: string;
  manipulador: ManipuladorRota;
};
