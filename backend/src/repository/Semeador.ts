import * as crypto from "crypto";

import type { NovaCampanha } from "../entity/Campanha";
import type { OngProps } from "../entity/Ong";
import { Senha } from "../service/AutenticacaoService";
import type { Banco } from "./Banco";
import type { CatalogoRepository } from "./CatalogoRepository";
import type { ComunidadeRepository } from "./ComunidadeRepository";
import type { UsuarioRepository } from "./UsuarioRepository";

const senhaDemonstracaoOngs = "petconnect123";

type OngInicial = Omit<OngProps, "activeCampaigns"> & { email: string };

type CampanhaInicial = NovaCampanha & {
  id: string;
  ngoId: string;
  raised: number;
  supporters: number;
  donations: number;
};

const ongsIniciais: OngInicial[] = [
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

const campanhasIniciais: CampanhaInicial[] = [
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

const emailsIniciaisPorOng: Record<string, string> = Object.fromEntries(
  ongsIniciais.map(({ id, email }) => [id, email])
);

export class Semeador {
  private banco: Banco;
  private catalogo: CatalogoRepository;
  private comunidade: ComunidadeRepository;
  private usuarios: UsuarioRepository;

  constructor(
    banco: Banco,
    catalogo: CatalogoRepository,
    comunidade: ComunidadeRepository,
    usuarios: UsuarioRepository
  ) {
    this.banco = banco;
    this.catalogo = catalogo;
    this.comunidade = comunidade;
    this.usuarios = usuarios;
  }

  async semear(): Promise<void> {
    if ((await this.catalogo.contarOngs()) === 0) {
      await this.semearDadosIniciais();
      console.log("Banco populado com os dados iniciais.");
    }

    // Limpa todas as denúncias registradas no banco para permitir testes do zero
    await this.banco.consultar("DELETE FROM reports");

    await this.garantirUsuariosDasOngs();
    await this.garantirUsuarioVisitanteTeste();
  }

  private async semearDadosIniciais(): Promise<void> {
    await this.banco.transacao(async (consultor) => {
      for (const { email: _email, ...ong } of ongsIniciais) {
        await this.catalogo.inserirOng(ong, consultor);
      }

      // Datas escalonadas para que a primeira campanha da lista seja a mais recente.
      for (const [indice, campanha] of campanhasIniciais.entries()) {
        await this.catalogo.inserirCampanha(
          { ...campanha, createdAt: new Date(Date.now() - indice * 60_000) },
          consultor
        );
      }
    });
  }

  // Garante que as ONGs já existentes no banco tenham uma conta de acesso.
  private async garantirUsuariosDasOngs(): Promise<void> {
    const ongs = await this.catalogo.listarOngs();
    const senhaHash = Senha.gerarHash(senhaDemonstracaoOngs);

    for (const ong of ongs) {
      const email = emailsIniciaisPorOng[ong.id] || `ong-${ong.id}@petconnect.local`;

      if (await this.usuarios.buscarPorEmail(email)) {
        continue;
      }

      await this.usuarios.inserir({
        id: `usr-${crypto.randomUUID()}`,
        name: ong.name,
        email,
        passwordHash: senhaHash,
        type: "ong",
        ngoId: ong.id
      });

      console.log(`Conta de ONG criada: ${email} (senha: ${senhaDemonstracaoOngs})`);
    }
  }

  // Garante que exista um usuário visitante de teste para demonstração.
  private async garantirUsuarioVisitanteTeste(): Promise<void> {
    const emailVisitante = "visitante@petconnect.com";
    const usuarioExistente = await this.usuarios.buscarPorEmail(emailVisitante);

    if (usuarioExistente) {
      return;
    }

    const senhaHash = Senha.gerarHash(senhaDemonstracaoOngs);
    await this.usuarios.inserir({
      id: "usr-visitante-teste",
      name: "Visitante Solidário (Teste)",
      email: emailVisitante,
      passwordHash: senhaHash,
      type: "visitante",
      ngoId: null
    });

    console.log(`Conta de Visitante criada: ${emailVisitante} (senha: ${senhaDemonstracaoOngs})`);
  }
}
