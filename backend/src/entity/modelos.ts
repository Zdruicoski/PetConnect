export type Ong = {
  id: string;
  name: string;
  city: string;
  about: string;
  animalsHelped: number;
  volunteers: number;
  activeCampaigns: number;
  imageUrl: string;
};

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

export type NovaCampanha = {
  title: string;
  description: string;
  details: string;
  target: number;
  imageUrl: string;
};

export type TipoDoacao = "money" | "food";

export type Doacao = {
  id: string;
  campaignId: string;
  donorName: string;
  type: TipoDoacao;
  amount: number;
  foodDescription: string;
  createdAt: string;
};

export type UrgenciaDenuncia = "Alta" | "Média" | "Baixa";
export type StatusDenuncia = "Nova" | "Em análise" | "Resolvida";

export type Denuncia = {
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
};

export type CandidaturaVoluntario = {
  id: string;
  name: string;
  email: string;
  role: string;
  message: string;
  createdAt: string;
};

export type TipoUsuario = "visitante" | "ong";

export type Usuario = {
  id: string;
  name: string;
  type: TipoUsuario;
  ngoId: string | null;
  ngoName: string | null;
};

export type UsuarioComSenha = Usuario & {
  passwordHash: string | null;
};
