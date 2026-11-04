import * as fs from "fs";

import type { DadosAplicacao } from "../entity/DadosAplicacao";
import { dadosIniciais } from "../compartilhado/dadosIniciais";

export class RepositorioJson {
  pastaDados: string;
  arquivoDados: string;

  constructor(pastaDados: string, arquivoDados: string) {
    this.pastaDados = pastaDados;
    this.arquivoDados = arquivoDados;
    this.garantirArquivoDados();
  }

  buscarTodos(): DadosAplicacao {
    try {
      return JSON.parse(fs.readFileSync(this.arquivoDados, "utf8"));
    } catch {
      this.salvar(dadosIniciais);
      return structuredClone(dadosIniciais);
    }
  }

  salvar(dadosAplicacao: DadosAplicacao): void {
    fs.mkdirSync(this.pastaDados, { recursive: true });
    const arquivoTemporario = `${this.arquivoDados}.tmp`;
    fs.writeFileSync(arquivoTemporario, JSON.stringify(dadosAplicacao, null, 2), "utf8");
    fs.renameSync(arquivoTemporario, this.arquivoDados);
  }

  atualizar(alterarDados: (dadosAplicacao: DadosAplicacao) => void): DadosAplicacao {
    const dadosAplicacao = this.buscarTodos();
    alterarDados(dadosAplicacao);
    this.salvar(dadosAplicacao);
    return dadosAplicacao;
  }

  private garantirArquivoDados(): void {
    fs.mkdirSync(this.pastaDados, { recursive: true });

    if (!fs.existsSync(this.arquivoDados)) {
      this.salvar(dadosIniciais);
    }
  }
}
