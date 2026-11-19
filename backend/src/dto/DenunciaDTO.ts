import type { UrgenciaDenuncia } from "../entity/Denuncia";
import { ErroHttp } from "../ErroHttp";

export interface DadosDenuncia {
  title?: unknown;
  description?: unknown;
  urgency?: unknown;
  reporterName?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
}

export interface DenunciaValidada {
  title: string;
  description: string;
  urgency: UrgenciaDenuncia;
  reporterName: string;
  address: string;
  lat: number;
  lng: number;
}

export class DenunciaDTO {
  static validar(dados: DadosDenuncia): DenunciaValidada {
    if (!dados.title || !dados.description || dados.lat === undefined || dados.lng === undefined) {
      throw new ErroHttp(400, "Título, descrição e localização são obrigatórios.");
    }

    const latitude = Number(dados.lat);
    const longitude = Number(dados.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new ErroHttp(400, "Localização inválida.");
    }

    return {
      title: String(dados.title).trim(),
      description: String(dados.description).trim(),
      urgency: DenunciaDTO.normalizarUrgencia(dados.urgency),
      reporterName: String(dados.reporterName || "Usuário PetConnect").trim(),
      address: String(dados.address || "Local marcado no mapa").trim(),
      lat: latitude,
      lng: longitude
    };
  }

  private static normalizarUrgencia(valor: unknown): UrgenciaDenuncia {
    if (valor === "Alta" || valor === "Média" || valor === "Baixa") {
      return valor;
    }

    return "Média";
  }
}

export const validarDadosDenuncia = DenunciaDTO.validar;
