export class ErroHttp extends Error {
  statusCode: number;

  constructor(statusCode: number, mensagem: string) {
    super(mensagem);
    this.name = "ErroHttp";
    this.statusCode = statusCode;
  }
}
