import type {
  Campanha,
  CandidaturaVoluntario,
  Denuncia,
  Doacao,
  NovaCampanha,
  Ong,
  TipoDoacao,
  UrgenciaDenuncia,
  Usuario
} from "../entity/modelos";
import { ErroHttp } from "../ErroHttp";

// ---------- Campanhas ----------

export type DadosCampanha = {
  title?: unknown;
  description?: unknown;
  details?: unknown;
  target?: unknown;
  imageUrl?: unknown;
};

export type DetalheCampanhaDTO = {
  campaign: Campanha;
  ngo: Ong;
  recentDonations: Doacao[];
};

const imagemPadrao =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80";

export function validarDadosCampanha(dados: DadosCampanha): NovaCampanha {
  const titulo = String(dados.title || "").trim();
  const descricao = String(dados.description || "").trim();
  const meta = Number(dados.target);

  if (!titulo || !descricao) {
    throw new ErroHttp(400, "Título e descrição são obrigatórios.");
  }

  if (!Number.isFinite(meta) || meta <= 0) {
    throw new ErroHttp(400, "A meta da campanha deve ser maior que zero.");
  }

  const imagem = String(dados.imageUrl || "").trim();

  if (imagem && !/^https?:\/\//i.test(imagem)) {
    throw new ErroHttp(400, "A imagem deve ser um link http(s).");
  }

  return {
    title: titulo.slice(0, 120),
    description: descricao.slice(0, 240),
    details: String(dados.details || "").trim().slice(0, 4000),
    target: meta,
    imageUrl: imagem || imagemPadrao
  };
}

// ---------- Doações ----------

export type DadosDoacao = {
  campaignId?: unknown;
  donorName?: unknown;
  type?: unknown;
  amount?: unknown;
  foodDescription?: unknown;
};

export type DoacaoValidada = {
  campaignId: string;
  donorName: string;
  type: TipoDoacao;
  amount: number;
  foodDescription: string;
};

export function validarDadosDoacao(dados: DadosDoacao): DoacaoValidada {
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

// ---------- Denúncias ----------

export type DadosDenuncia = {
  title?: unknown;
  description?: unknown;
  urgency?: unknown;
  reporterName?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
};

export type DenunciaValidada = Omit<Denuncia, "id" | "status" | "createdAt">;

export function validarDadosDenuncia(dados: DadosDenuncia): DenunciaValidada {
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
    urgency: normalizarUrgencia(dados.urgency),
    reporterName: String(dados.reporterName || "Usuário PetConnect").trim(),
    address: String(dados.address || "Local marcado no mapa").trim(),
    lat: latitude,
    lng: longitude
  };
}

function normalizarUrgencia(valor: unknown): UrgenciaDenuncia {
  if (valor === "Alta" || valor === "Média" || valor === "Baixa") {
    return valor;
  }

  return "Média";
}

// ---------- Voluntariado ----------

export type DadosCandidaturaVoluntario = {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  message?: unknown;
};

export type CandidaturaVoluntarioValidada = Pick<
  CandidaturaVoluntario,
  "name" | "email" | "role" | "message"
>;

export function validarDadosCandidatura(
  dados: DadosCandidaturaVoluntario
): CandidaturaVoluntarioValidada {
  if (!dados.name || !dados.email || !dados.role) {
    throw new ErroHttp(400, "Nome, email e vaga são obrigatórios.");
  }

  return {
    name: String(dados.name).trim(),
    email: String(dados.email).trim(),
    role: String(dados.role).trim(),
    message: String(dados.message || "").trim()
  };
}

// ---------- Autenticação ----------

export type DadosLoginVisitante = {
  name?: unknown;
};

export type DadosLoginOng = {
  email?: unknown;
  password?: unknown;
};

export type ResultadoLogin = {
  token: string;
  user: Usuario;
};

// ---------- Painel ----------

export type EstatisticasPainel = {
  animalsHelped: number;
  activeNgos: number;
  donors: number;
  activeReports: number;
};

export type PainelDTO = {
  campaigns: Campanha[];
  ngos: Ong[];
  reports: Denuncia[];
  stats: EstatisticasPainel;
};
