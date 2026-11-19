import { Campanha, type NovaCampanha } from "../entity/Campanha";
import { Doacao, type TipoDoacao } from "../entity/Doacao";
import { Ong, type OngProps } from "../entity/Ong";
import type { Banco, Consultor } from "./Banco";

type Linha = Record<string, any>;

export type CampanhaParaInserir = NovaCampanha & {
  id: string;
  ngoId: string;
  raised?: number;
  supporters?: number;
  donations?: number;
  createdAt?: Date;
};

const colunasOng =
  "id, name, cnpj, city, about, animals_helped, volunteers, active_campaigns, image_url";

const selecionarCampanha = `
  SELECT c.*, o.name AS ngo_name
  FROM campaigns c
  JOIN ngos o ON o.id = c.ngo_id`;

export class CatalogoRepository {
  private banco: Banco;

  constructor(banco: Banco) {
    this.banco = banco;
  }

  // ---------- ONGs ----------

  async listarOngs(): Promise<Ong[]> {
    const linhas = await this.banco.consultar<Linha>(
      `SELECT ${colunasOng} FROM ngos ORDER BY name`
    );
    return linhas.map(paraOng);
  }

  async buscarOng(id: string): Promise<Ong | undefined> {
    const linhas = await this.banco.consultar<Linha>(
      `SELECT ${colunasOng} FROM ngos WHERE id = $1`,
      [id]
    );
    return linhas[0] && paraOng(linhas[0]);
  }

  async inserirOng(
    ong: Omit<OngProps, "activeCampaigns">,
    consultor: Consultor = this.banco
  ): Promise<void> {
    await consultor.consultar(
      `INSERT INTO ngos (id, name, cnpj, city, about, animals_helped, volunteers, active_campaigns, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)`,
      [
        ong.id,
        ong.name,
        ong.cnpj || "",
        ong.city,
        ong.about,
        ong.animalsHelped,
        ong.volunteers,
        ong.imageUrl
      ]
    );
  }

  async contarOngs(): Promise<number> {
    const [linha] = await this.banco.consultar<Linha>("SELECT COUNT(*) AS total FROM ngos");
    return Number(linha.total);
  }

  // ---------- Campanhas ----------

  async listarCampanhas(): Promise<Campanha[]> {
    const linhas = await this.banco.consultar<Linha>(
      `${selecionarCampanha} ORDER BY c.created_at DESC, c.id`
    );
    return linhas.map(paraCampanha);
  }

  async buscarCampanha(id: string): Promise<Campanha | undefined> {
    const linhas = await this.banco.consultar<Linha>(`${selecionarCampanha} WHERE c.id = $1`, [
      id
    ]);
    return linhas[0] && paraCampanha(linhas[0]);
  }

  async inserirCampanha(
    campanha: CampanhaParaInserir,
    consultor: Consultor = this.banco
  ): Promise<void> {
    await consultor.consultar(
      `INSERT INTO campaigns
         (id, ngo_id, title, description, details, target, raised, supporters, donations, image_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        campanha.id,
        campanha.ngoId,
        campanha.title,
        campanha.description,
        campanha.details,
        campanha.target,
        campanha.raised ?? 0,
        campanha.supporters ?? 0,
        campanha.donations ?? 0,
        campanha.imageUrl,
        campanha.createdAt ?? new Date()
      ]
    );

    await consultor.consultar(
      "UPDATE ngos SET active_campaigns = active_campaigns + 1 WHERE id = $1",
      [campanha.ngoId]
    );
  }

  // ---------- Doações ----------

  async listarDoacoes(): Promise<Doacao[]> {
    const linhas = await this.banco.consultar<Linha>(
      "SELECT * FROM donations ORDER BY created_at DESC"
    );
    return linhas.map(paraDoacao);
  }

  async listarDoacoesPorCampanha(campanhaId: string, limite: number): Promise<Doacao[]> {
    const linhas = await this.banco.consultar<Linha>(
      "SELECT * FROM donations WHERE campaign_id = $1 ORDER BY created_at DESC LIMIT $2",
      [campanhaId, limite]
    );
    return linhas.map(paraDoacao);
  }

  async registrarDoacao(doacao: Doacao): Promise<Campanha | undefined> {
    const registrada = await this.banco.transacao(async (consultor) => {
      const atualizadas = await consultor.consultar<Linha>(
        `UPDATE campaigns
         SET raised = raised + $2, supporters = supporters + 1, donations = donations + 1
         WHERE id = $1
         RETURNING id`,
        [doacao.campaignId, doacao.type === "money" ? doacao.amount : 0]
      );

      if (atualizadas.length === 0) {
        return false;
      }

      await consultor.consultar(
        `INSERT INTO donations
           (id, campaign_id, donor_name, type, amount, food_description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          doacao.id,
          doacao.campaignId,
          doacao.donorName,
          doacao.type,
          doacao.amount,
          doacao.foodDescription,
          doacao.createdAt
        ]
      );

      return true;
    });

    return registrada ? this.buscarCampanha(doacao.campaignId) : undefined;
  }
}

function paraOng(linha: Linha): Ong {
  return new Ong({
    id: linha.id,
    name: linha.name,
    cnpj: linha.cnpj || "",
    city: linha.city,
    about: linha.about,
    animalsHelped: Number(linha.animals_helped),
    volunteers: Number(linha.volunteers),
    activeCampaigns: Number(linha.active_campaigns),
    imageUrl: linha.image_url
  });
}

function paraCampanha(linha: Linha): Campanha {
  return new Campanha({
    id: linha.id,
    ngoId: linha.ngo_id,
    title: linha.title,
    ngoName: linha.ngo_name,
    description: linha.description,
    details: linha.details || "",
    target: Number(linha.target),
    raised: Number(linha.raised),
    supporters: Number(linha.supporters),
    donations: Number(linha.donations),
    imageUrl: linha.image_url,
    createdAt: new Date(linha.created_at).toISOString()
  });
}

function paraDoacao(linha: Linha): Doacao {
  return new Doacao({
    id: linha.id,
    campaignId: linha.campaign_id,
    donorName: linha.donor_name,
    type: linha.type as TipoDoacao,
    amount: Number(linha.amount),
    foodDescription: linha.food_description,
    createdAt: new Date(linha.created_at).toISOString()
  });
}
