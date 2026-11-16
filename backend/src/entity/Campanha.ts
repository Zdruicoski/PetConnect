import { ErroHttp } from "../compartilhado/ErroHttp";

export type Campanha = {
  id: string;
  ngoId: string;
  title: string;
  ngoName: string;
  description: string;
  details: string;
  target: number;
  raised: number;
  supporters: number;
  donations: number;
  imageUrl: string;
  createdAt: string;
};

export type DadosCampanha = {
  title?: unknown;
  description?: unknown;
  details?: unknown;
  target?: unknown;
  imageUrl?: unknown;
};

export type NovaCampanha = {
  title: string;
  description: string;
  details: string;
  target: number;
  imageUrl: string;
};

const imagemPadrao =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80";

export function validarNovaCampanha(dados: DadosCampanha): NovaCampanha {
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
