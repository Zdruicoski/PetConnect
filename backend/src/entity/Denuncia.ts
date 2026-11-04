import * as crypto from "crypto";

import { ErroHttp } from "../compartilhado/ErroHttp";

export type UrgenciaDenuncia = "Alta" | "Média" | "Baixa";
export type StatusDenuncia = "Nova" | "Em análise" | "Resolvida";

export type DadosDenuncia = {
  title?: unknown;
  description?: unknown;
  urgency?: unknown;
  reporterName?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
};

export class Denuncia {
  id: string;
  title: string;
  description: string;
  urgency: UrgenciaDenuncia;
  reporterName: string;
  address: string;
  lat: number;
  lng: number;
  status: StatusDenuncia;
  createdAt: string;

  constructor(dados: {
    id: string;
    title: string;
    description: string;
    urgency: UrgenciaDenuncia;
    reporterName: string;
    address: string;
    lat: number;
    lng: number;
    status: StatusDenuncia;
    createdAt: string;
  }) {
    this.id = dados.id;
    this.title = dados.title;
    this.description = dados.description;
    this.urgency = dados.urgency;
    this.reporterName = dados.reporterName;
    this.address = dados.address;
    this.lat = dados.lat;
    this.lng = dados.lng;
    this.status = dados.status;
    this.createdAt = dados.createdAt;
  }

  static criar(dados: DadosDenuncia): Denuncia {
    if (!dados.title || !dados.description || dados.lat === undefined || dados.lng === undefined) {
      throw new ErroHttp(400, "Título, descrição e localização são obrigatórios.");
    }

    const latitude = Number(dados.lat);
    const longitude = Number(dados.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new ErroHttp(400, "Localização inválida.");
    }

    return new Denuncia({
      id: `rep-${crypto.randomUUID()}`,
      title: String(dados.title).trim(),
      description: String(dados.description).trim(),
      urgency: normalizarUrgencia(dados.urgency),
      reporterName: String(dados.reporterName || "Usuário PetConnect").trim(),
      address: String(dados.address || "Local marcado no mapa").trim(),
      lat: latitude,
      lng: longitude,
      status: "Nova",
      createdAt: new Date().toISOString()
    });
  }
}

function normalizarUrgencia(valor: unknown): UrgenciaDenuncia {
  if (valor === "Alta" || valor === "Média" || valor === "Baixa") {
    return valor;
  }

  return "Média";
}
