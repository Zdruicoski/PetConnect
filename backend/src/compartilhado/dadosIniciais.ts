import type { NovaCampanha } from "../entity/Campanha";
import type { Ong } from "../entity/Ong";

// Senha das contas de ONG criadas na primeira execução (apenas para demonstração).
export const senhaDemonstracaoOngs = "petconnect123";

export type OngInicial = Omit<Ong, "activeCampaigns"> & { email: string };
export type CampanhaInicial = NovaCampanha & {
  id: string;
  ngoId: string;
  raised: number;
  supporters: number;
  donations: number;
};

export const ongsIniciais: OngInicial[] = [
  {
    id: "ong-4patas",
    email: "contato@amigos4patas.org",
    name: "Amigos de 4 Patas Tubarão",
    city: "Tubarão - SC",
    about: "Resgate, cuidado e adoção responsável de animais abandonados.",
    animalsHelped: 243,
    volunteers: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "ong-protecao",
    email: "contato@protecaoanimal.org",
    name: "Proteção Animal Tubarão",
    city: "Tubarão - SC",
    about: "Campanhas de castração, conscientização e apoio veterinário.",
    animalsHelped: 312,
    volunteers: 22,
    imageUrl:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "ong-esperanca",
    email: "contato@abrigoesperanca.org",
    name: "Abrigo Esperança Animal",
    city: "Tubarão - SC",
    about: "Abrigo temporário para animais em situação de risco.",
    animalsHelped: 178,
    volunteers: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=900&q=80"
  }
];

export const campanhasIniciais: CampanhaInicial[] = [
  {
    id: "camp-racao",
    ngoId: "ong-4patas",
    title: "Ração Solidária Tubarão",
    description: "Campanha para garantir alimentação durante o inverno.",
    details:
      "No inverno a demanda por ração aumenta e as doações diminuem. Esta campanha reúne recursos para comprar ração seca e úmida, além de suplementos para filhotes e animais idosos.\n\nTodo o valor arrecadado é convertido em alimento e distribuído entre os mais de 60 animais abrigados e as famílias da região que cuidam de animais comunitários. Doações de ração também são bem-vindas.",
    target: 3500,
    raised: 1840,
    supporters: 88,
    donations: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "camp-resgate",
    ngoId: "ong-protecao",
    title: "Resgate e Castração",
    description: "Recursos para transporte, consulta e castração de animais abandonados.",
    details:
      "O controle populacional é a forma mais eficaz de reduzir o abandono. Com esta campanha, a ONG custeia o transporte de animais resgatados, consultas veterinárias e cirurgias de castração.\n\nCada R$ 120 cobre uma castração completa, com exames e pós-operatório. Os animais são devolvidos saudáveis ou encaminhados para adoção responsável.",
    target: 5000,
    raised: 2680,
    supporters: 124,
    donations: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "camp-abrigo",
    ngoId: "ong-esperanca",
    title: "Reforma do Abrigo",
    description: "Compra de materiais para ampliar baias e áreas cobertas.",
    details:
      "O abrigo recebe mais animais do que comporta e parte das baias está sem cobertura adequada. Os recursos serão usados em telhas, alvenaria, telas e pisos laváveis para ampliar baias e criar áreas cobertas de convivência.\n\nA obra será feita em mutirão com voluntários e a prestação de contas será publicada aos apoiadores.",
    target: 4200,
    raised: 1250,
    supporters: 67,
    donations: 9,
    imageUrl:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80"
  }
];

export const denunciasIniciais = [
  {
    id: "rep-centro",
    title: "Cachorro ferido próximo ao Centro",
    description: "Animal de porte médio aparenta estar mancando e precisa de avaliação.",
    urgency: "Alta" as const,
    reporterName: "Equipe PetConnect",
    address: "Centro, Tubarão - SC",
    lat: -28.4819,
    lng: -49.0067,
    status: "Nova" as const,
    minutosAtras: 35
  },
  {
    id: "rep-oficinas",
    title: "Gata com filhotes em terreno aberto",
    description: "Moradores relataram ninhada em área sem proteção.",
    urgency: "Média" as const,
    reporterName: "Equipe PetConnect",
    address: "Oficinas, Tubarão - SC",
    lat: -28.4688,
    lng: -49.0182,
    status: "Em análise" as const,
    minutosAtras: 90
  }
];
