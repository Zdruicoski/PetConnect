import type { DadosAplicacao } from "../entity/DadosAplicacao";

export const dadosIniciais: DadosAplicacao = {
  campaigns: [
    {
      id: "camp-racao",
      title: "Ração Solidária Tubarão",
      ngoName: "Amigos de 4 Patas Tubarão",
      description: "Campanha para garantir alimentação durante o inverno.",
      target: 3500,
      raised: 1840,
      supporters: 88,
      donations: 12,
      imageUrl:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "camp-resgate",
      title: "Resgate e Castração",
      ngoName: "Proteção Animal Tubarão",
      description: "Recursos para transporte, consulta e castração de animais abandonados.",
      target: 5000,
      raised: 2680,
      supporters: 124,
      donations: 18,
      imageUrl:
        "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "camp-abrigo",
      title: "Reforma do Abrigo",
      ngoName: "Abrigo Esperança Animal",
      description: "Compra de materiais para ampliar baias e áreas cobertas.",
      target: 4200,
      raised: 1250,
      supporters: 67,
      donations: 9,
      imageUrl:
        "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80"
    }
  ],
  ngos: [
    {
      id: "ong-4patas",
      name: "Amigos de 4 Patas Tubarão",
      city: "Tubarão - SC",
      about: "Resgate, cuidado e adoção responsável de animais abandonados.",
      animalsHelped: 243,
      volunteers: 18,
      activeCampaigns: 3,
      imageUrl:
        "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "ong-protecao",
      name: "Proteção Animal Tubarão",
      city: "Tubarão - SC",
      about: "Campanhas de castração, conscientização e apoio veterinário.",
      animalsHelped: 312,
      volunteers: 22,
      activeCampaigns: 2,
      imageUrl:
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "ong-esperanca",
      name: "Abrigo Esperança Animal",
      city: "Tubarão - SC",
      about: "Abrigo temporário para animais em situação de risco.",
      animalsHelped: 178,
      volunteers: 14,
      activeCampaigns: 4,
      imageUrl:
        "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=900&q=80"
    }
  ],
  reports: [
    {
      id: "rep-centro",
      title: "Cachorro ferido próximo ao Centro",
      description: "Animal de porte médio aparenta estar mancando e precisa de avaliação.",
      urgency: "Alta",
      reporterName: "Equipe PetConnect",
      address: "Centro, Tubarão - SC",
      lat: -28.4819,
      lng: -49.0067,
      status: "Nova",
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      id: "rep-oficinas",
      title: "Gata com filhotes em terreno aberto",
      description: "Moradores relataram ninhada em área sem proteção.",
      urgency: "Média",
      reporterName: "Equipe PetConnect",
      address: "Oficinas, Tubarão - SC",
      lat: -28.4688,
      lng: -49.0182,
      status: "Em análise",
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    }
  ],
  donations: [],
  volunteerApplications: []
};
