import * as crypto from "crypto";

import { ErroHttp } from "../compartilhado/ErroHttp";

export type TipoDoacao = "money" | "food";

export type DadosDoacao = {
  campaignId?: unknown;
  donorName?: unknown;
  type?: unknown;
  amount?: unknown;
  foodDescription?: unknown;
};

export class Doacao {
  id: string;
  campaignId: string;
  donorName: string;
  type: TipoDoacao;
  amount: number;
  foodDescription: string;
  createdAt: string;

  constructor(dados: {
    id: string;
    campaignId: string;
    donorName: string;
    type: TipoDoacao;
    amount: number;
    foodDescription: string;
    createdAt: string;
  }) {
    this.id = dados.id;
    this.campaignId = dados.campaignId;
    this.donorName = dados.donorName;
    this.type = dados.type;
    this.amount = dados.amount;
    this.foodDescription = dados.foodDescription;
    this.createdAt = dados.createdAt;
  }

  static criar(dados: DadosDoacao): Doacao {
    if (!dados.campaignId) {
      throw new ErroHttp(400, "Campanha obrigatória.");
    }

    const tipo: TipoDoacao = dados.type === "food" ? "food" : "money";
    const valor = Number(dados.amount || 0);

    if (tipo === "money" && (!Number.isFinite(valor) || valor <= 0)) {
      throw new ErroHttp(400, "Valor de doação inválido.");
    }

    return new Doacao({
      id: `don-${crypto.randomUUID()}`,
      campaignId: String(dados.campaignId),
      donorName: String(dados.donorName || "Doador anônimo").trim(),
      type: tipo,
      amount: tipo === "money" ? valor : 0,
      foodDescription: String(dados.foodDescription || "").trim(),
      createdAt: new Date().toISOString()
    });
  }
}
