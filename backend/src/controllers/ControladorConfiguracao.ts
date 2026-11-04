import { RespostaHttp } from "../http/RespostaHttp";
import type { ContextoRequisicao } from "../http/TiposRota";
import type { ServicoConfiguracao } from "../services/ServicoConfiguracao";

export class ControladorConfiguracao {
  servico: ServicoConfiguracao;

  constructor(servico: ServicoConfiguracao) {
    this.servico = servico;
  }

  mostrar(contexto: ContextoRequisicao): void {
    RespostaHttp.json(contexto.resposta, 200, this.servico.obterConfiguracaoMapa());
  }
}
