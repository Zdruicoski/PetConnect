import type { Campanha } from "../entity/Campanha";
import { Doacao, type DadosDoacao } from "../entity/Doacao";
import type { RepositorioJson } from "../repositories/RepositorioJson";
import { ErroHttp } from "../compartilhado/ErroHttp";
import type { ServicoNotificacoes } from "./ServicoNotificacoes";

export type ResultadoDoacao = {
  donation: Doacao;
  campaign: Campanha;
};

export class ServicoDoacoes {
  repositorio: RepositorioJson;
  notificacoes: ServicoNotificacoes;

  constructor(repositorio: RepositorioJson, notificacoes: ServicoNotificacoes) {
    this.repositorio = repositorio;
    this.notificacoes = notificacoes;
  }

  listarDoacoes(): Doacao[] {
    return this.repositorio.buscarTodos().donations;
  }

  criarDoacao(dados: DadosDoacao): ResultadoDoacao {
    const doacao = Doacao.criar(dados);
    let campanhaAtualizada: Campanha | undefined;

    this.repositorio.atualizar((dadosAplicacao) => {
      const campanha = dadosAplicacao.campaigns.find((item) => item.id === doacao.campaignId);

      if (!campanha) {
        throw new ErroHttp(404, "Campanha não encontrada.");
      }

      if (doacao.type === "money") {
        campanha.raised += doacao.amount;
      }

      campanha.supporters += 1;
      campanha.donations += 1;
      dadosAplicacao.donations.unshift(doacao);
      campanhaAtualizada = campanha;
    });

    const resultado = {
      donation: doacao,
      campaign: campanhaAtualizada as Campanha
    };

    this.notificacoes.notificarTodos("donation-created", {
      ...resultado,
      message: `${doacao.donorName} apoiou ${resultado.campaign.title}`
    });

    return resultado;
  }
}
