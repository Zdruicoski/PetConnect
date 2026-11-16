import type { Campanha, NovaCampanha } from "../entity/Campanha";
import type { CandidaturaVoluntario } from "../entity/CandidaturaVoluntario";
import type { Denuncia, StatusDenuncia, UrgenciaDenuncia } from "../entity/Denuncia";
import type { Doacao, TipoDoacao } from "../entity/Doacao";
import type { Ong } from "../entity/Ong";
import type { TipoUsuario, Usuario } from "../entity/Usuario";
import type { Banco, Consultor } from "./Banco";

type Linha = Record<string, any>;

export type UsuarioComSenha = Usuario & { passwordHash: string | null };

export type NovoUsuario = {
  id: string;
  name: string;
  email: string | null;
  passwordHash: string | null;
  type: TipoUsuario;
  ngoId: string | null;
};

export type CampanhaParaInserir = NovaCampanha & {
  id: string;
  ngoId: string;
  raised?: number;
  supporters?: number;
  donations?: number;
  createdAt?: Date;
};

const selecionarCampanha = `
  SELECT c.*, o.nome AS ong_nome
  FROM campanhas c
  JOIN ongs o ON o.id = c.ong_id`;

const selecionarUsuario = `
  SELECT u.*, o.nome AS ong_nome
  FROM usuarios u
  LEFT JOIN ongs o ON o.id = u.ong_id`;

const colunasOng = "o.id, o.nome, o.cidade, o.sobre, o.animais_ajudados, o.voluntarios, o.imagem_url";

const selecionarOng = `
  SELECT ${colunasOng}, COUNT(c.id) AS campanhas_ativas
  FROM ongs o
  LEFT JOIN campanhas c ON c.ong_id = o.id`;

export class RepositorioPostgres {
  banco: Banco;

  constructor(banco: Banco) {
    this.banco = banco;
  }

  async listarOngs(): Promise<Ong[]> {
    const linhas = await this.banco.consultar<Linha>(`${selecionarOng} GROUP BY ${colunasOng} ORDER BY o.nome`);
    return linhas.map(paraOng);
  }

  async buscarOng(id: string): Promise<Ong | undefined> {
    const linhas = await this.banco.consultar<Linha>(`${selecionarOng} WHERE o.id = $1 GROUP BY ${colunasOng}`, [id]);
    return linhas[0] && paraOng(linhas[0]);
  }

  async inserirOng(
    ong: Omit<Ong, "activeCampaigns">,
    consultor: Consultor = this.banco
  ): Promise<void> {
    await consultor.consultar(
      `INSERT INTO ongs (id, nome, cidade, sobre, animais_ajudados, voluntarios, imagem_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ong.id, ong.name, ong.city, ong.about, ong.animalsHelped, ong.volunteers, ong.imageUrl]
    );
  }

  async contarOngs(): Promise<number> {
    const [linha] = await this.banco.consultar<Linha>("SELECT COUNT(*) AS total FROM ongs");
    return Number(linha.total);
  }

  async listarCampanhas(): Promise<Campanha[]> {
    const linhas = await this.banco.consultar<Linha>(
      `${selecionarCampanha} ORDER BY c.criado_em DESC, c.id`
    );
    return linhas.map(paraCampanha);
  }

  async buscarCampanha(id: string): Promise<Campanha | undefined> {
    const linhas = await this.banco.consultar<Linha>(`${selecionarCampanha} WHERE c.id = $1`, [id]);
    return linhas[0] && paraCampanha(linhas[0]);
  }

  async inserirCampanha(
    campanha: CampanhaParaInserir,
    consultor: Consultor = this.banco
  ): Promise<void> {
    await consultor.consultar(
      `INSERT INTO campanhas
         (id, ong_id, titulo, descricao, detalhes, meta, arrecadado, apoiadores, doacoes, imagem_url, criado_em)
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
  }

  async listarDoacoes(): Promise<Doacao[]> {
    const linhas = await this.banco.consultar<Linha>("SELECT * FROM doacoes ORDER BY criado_em DESC");
    return linhas.map(paraDoacao);
  }

  async listarDoacoesDaCampanha(campanhaId: string, limite: number): Promise<Doacao[]> {
    const linhas = await this.banco.consultar<Linha>(
      "SELECT * FROM doacoes WHERE campanha_id = $1 ORDER BY criado_em DESC LIMIT $2",
      [campanhaId, limite]
    );
    return linhas.map(paraDoacao);
  }

  async registrarDoacao(doacao: Doacao): Promise<Campanha | undefined> {
    const encontrada = await this.banco.transacao(async (consultor) => {
      const atualizadas = await consultor.consultar<Linha>(
        `UPDATE campanhas
         SET arrecadado = arrecadado + $2, apoiadores = apoiadores + 1, doacoes = doacoes + 1
         WHERE id = $1
         RETURNING id`,
        [doacao.campaignId, doacao.type === "money" ? doacao.amount : 0]
      );

      if (atualizadas.length === 0) {
        return false;
      }

      await consultor.consultar(
        `INSERT INTO doacoes (id, campanha_id, doador, tipo, valor, descricao_alimento, criado_em)
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

    return encontrada ? this.buscarCampanha(doacao.campaignId) : undefined;
  }

  async listarDenuncias(): Promise<Denuncia[]> {
    const linhas = await this.banco.consultar<Linha>("SELECT * FROM denuncias ORDER BY criado_em DESC");
    return linhas.map(paraDenuncia);
  }

  async inserirDenuncia(denuncia: Denuncia, consultor: Consultor = this.banco): Promise<void> {
    await consultor.consultar(
      `INSERT INTO denuncias (id, titulo, descricao, urgencia, denunciante, endereco, lat, lng, status, criado_em)
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

  async listarCandidaturas(): Promise<CandidaturaVoluntario[]> {
    const linhas = await this.banco.consultar<Linha>(
      "SELECT * FROM candidaturas_voluntario ORDER BY criado_em DESC"
    );
    return linhas.map(paraCandidatura);
  }

  async inserirCandidatura(candidatura: CandidaturaVoluntario): Promise<void> {
    await this.banco.consultar(
      `INSERT INTO candidaturas_voluntario (id, nome, email, vaga, mensagem, criado_em)
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

  async inserirUsuario(usuario: NovoUsuario, consultor: Consultor = this.banco): Promise<void> {
    await consultor.consultar(
      `INSERT INTO usuarios (id, nome, email, senha_hash, tipo, ong_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuario.id, usuario.name, usuario.email, usuario.passwordHash, usuario.type, usuario.ngoId]
    );
  }

  async buscarUsuarioPorEmail(email: string): Promise<UsuarioComSenha | undefined> {
    const linhas = await this.banco.consultar<Linha>(`${selecionarUsuario} WHERE u.email = $1`, [
      email
    ]);
    return linhas[0] && { ...paraUsuario(linhas[0]), passwordHash: linhas[0].senha_hash };
  }

  async criarSessao(token: string, usuarioId: string): Promise<void> {
    await this.banco.consultar("INSERT INTO sessoes (token, usuario_id) VALUES ($1, $2)", [
      token,
      usuarioId
    ]);
  }

  async buscarUsuarioPorSessao(
    token: string
  ): Promise<{ usuario: Usuario; criadaEm: Date } | undefined> {
    const linhas = await this.banco.consultar<Linha>(
      `SELECT u.*, o.nome AS ong_nome, s.criado_em AS sessao_criada_em
       FROM sessoes s
       JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN ongs o ON o.id = u.ong_id
       WHERE s.token = $1`,
      [token]
    );
    return (
      linhas[0] && {
        usuario: paraUsuario(linhas[0]),
        criadaEm: new Date(linhas[0].sessao_criada_em)
      }
    );
  }

  async removerSessao(token: string): Promise<void> {
    await this.banco.consultar("DELETE FROM sessoes WHERE token = $1", [token]);
  }
}

function paraOng(linha: Linha): Ong {
  return {
    id: linha.id,
    name: linha.nome,
    city: linha.cidade,
    about: linha.sobre,
    animalsHelped: Number(linha.animais_ajudados),
    volunteers: Number(linha.voluntarios),
    activeCampaigns: Number(linha.campanhas_ativas),
    imageUrl: linha.imagem_url
  };
}

function paraCampanha(linha: Linha): Campanha {
  return {
    id: linha.id,
    ngoId: linha.ong_id,
    title: linha.titulo,
    ngoName: linha.ong_nome,
    description: linha.descricao,
    details: linha.detalhes,
    target: Number(linha.meta),
    raised: Number(linha.arrecadado),
    supporters: Number(linha.apoiadores),
    donations: Number(linha.doacoes),
    imageUrl: linha.imagem_url,
    createdAt: new Date(linha.criado_em).toISOString()
  };
}

function paraDoacao(linha: Linha): Doacao {
  return {
    id: linha.id,
    campaignId: linha.campanha_id,
    donorName: linha.doador,
    type: linha.tipo as TipoDoacao,
    amount: Number(linha.valor),
    foodDescription: linha.descricao_alimento,
    createdAt: new Date(linha.criado_em).toISOString()
  };
}

function paraDenuncia(linha: Linha): Denuncia {
  return {
    id: linha.id,
    title: linha.titulo,
    description: linha.descricao,
    urgency: linha.urgencia as UrgenciaDenuncia,
    reporterName: linha.denunciante,
    address: linha.endereco,
    lat: Number(linha.lat),
    lng: Number(linha.lng),
    status: linha.status as StatusDenuncia,
    createdAt: new Date(linha.criado_em).toISOString()
  };
}

function paraCandidatura(linha: Linha): CandidaturaVoluntario {
  return {
    id: linha.id,
    name: linha.nome,
    email: linha.email,
    role: linha.vaga,
    message: linha.mensagem,
    createdAt: new Date(linha.criado_em).toISOString()
  };
}

function paraUsuario(linha: Linha): Usuario {
  return {
    id: linha.id,
    name: linha.nome,
    type: linha.tipo as TipoUsuario,
    ngoId: linha.ong_id,
    ngoName: linha.ong_nome
  };
}
