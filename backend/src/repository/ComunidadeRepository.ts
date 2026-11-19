import { CandidaturaVoluntario } from "../entity/CandidaturaVoluntario";
import { Denuncia, type StatusDenuncia, type UrgenciaDenuncia } from "../entity/Denuncia";
import type { Banco, Consultor } from "./Banco";

type Linha = Record<string, any>;

export class ComunidadeRepository {
  private banco: Banco;

  constructor(banco: Banco) {
    this.banco = banco;
  }

  // ---------- Denúncias ----------

  async listarDenuncias(): Promise<Denuncia[]> {
    const linhas = await this.banco.consultar<Linha>(
      "SELECT * FROM reports ORDER BY created_at DESC"
    );
    return linhas.map(paraDenuncia);
  }

  async inserirDenuncia(denuncia: Denuncia, consultor: Consultor = this.banco): Promise<void> {
    await consultor.consultar(
      `INSERT INTO reports
         (id, title, description, urgency, reporter_name, address, lat, lng, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        denuncia.id,
        denuncia.title,
        denuncia.description,
        denuncia.urgency,
        denuncia.reporterName,
        denuncia.address,
        denuncia.lat,
        denuncia.lng,
        denuncia.status,
        denuncia.createdAt
      ]
    );
  }

  // ---------- Candidaturas ----------

  async listarCandidaturas(): Promise<CandidaturaVoluntario[]> {
    const linhas = await this.banco.consultar<Linha>(
      "SELECT * FROM volunteer_applications ORDER BY created_at DESC"
    );
    return linhas.map(paraCandidatura);
  }

  async inserirCandidatura(
    candidatura: CandidaturaVoluntario,
    consultor: Consultor = this.banco
  ): Promise<void> {
    await consultor.consultar(
      `INSERT INTO volunteer_applications (id, name, email, role, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        candidatura.id,
        candidatura.name,
        candidatura.email,
        candidatura.role,
        candidatura.message,
        candidatura.createdAt
      ]
    );
  }
}

function paraDenuncia(linha: Linha): Denuncia {
  return new Denuncia({
    id: linha.id,
    title: linha.title,
    description: linha.description,
    urgency: linha.urgency as UrgenciaDenuncia,
    reporterName: linha.reporter_name,
    address: linha.address,
    lat: Number(linha.lat),
    lng: Number(linha.lng),
    status: linha.status as StatusDenuncia,
    createdAt: new Date(linha.created_at).toISOString()
  });
}

function paraCandidatura(linha: Linha): CandidaturaVoluntario {
  return new CandidaturaVoluntario({
    id: linha.id,
    name: linha.name,
    email: linha.email,
    role: linha.role,
    message: linha.message,
    createdAt: new Date(linha.created_at).toISOString()
  });
}
