import type { ConfiguracaoAplicacao, ConfiguracaoMapa } from "../config/ConfiguracaoAplicacao";

export class ServicoConfiguracao {
  configuracao: ConfiguracaoAplicacao;

  constructor(configuracao: ConfiguracaoAplicacao) {
    this.configuracao = configuracao;
  }

  obterConfiguracaoMapa(): ConfiguracaoMapa {
    return this.configuracao.mapa;
  }
}
