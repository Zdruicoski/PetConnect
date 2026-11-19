import type { TipoDoacao } from "../entity/Doacao";
import { ErroHttp } from "../ErroHttp";

export interface DadosDoacao {
  campaignId?: unknown;
  donorName?: unknown;
  type?: unknown;
  amount?: unknown;
  foodDescription?: unknown;
}

export interface DoacaoValidada {
  campaignId: string;
  donorName: string;
  type: TipoDoacao;
  amount: number;
  foodDescription: string;
}

export class DoacaoDTO {
  static validar(dados: DadosDoacao): DoacaoValidada {
    if (!dados.campaignId) {
      throw new ErroHttp(400, "Campanha obrigatória.");
    }

    const tipo: TipoDoacao = dados.type === "food" ? "food" : "money";
    const valor = Number(dados.amount || 0);

    if (tipo === "money" && (!Number.isFinite(valor) || valor <= 0)) {
      throw new ErroHttp(400, "Valor de doação inválido.");
    }

    return {
      campaignId: String(dados.campaignId),
      donorName: String(dados.donorName || "Doador anônimo").trim(),
      type: tipo,
      amount: tipo === "money" ? valor : 0,
      foodDescription: String(dados.foodDescription || "").trim()
    };
  }
}

export const validarDadosDoacao = DoacaoDTO.validar;
