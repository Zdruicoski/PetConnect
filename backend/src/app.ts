import { Configuracao } from "./Configuracao";
import { ArquivosEstaticosController } from "./controller/ArquivosEstaticosController";
import { AutenticacaoController } from "./controller/AutenticacaoController";
import { CatalogoController } from "./controller/CatalogoController";
import { ComunidadeController } from "./controller/ComunidadeController";
import { EventosController } from "./controller/EventosController";
import { SistemaController } from "./controller/SistemaController";
import { Banco } from "./repository/Banco";
import { CatalogoRepository } from "./repository/CatalogoRepository";
import { ComunidadeRepository } from "./repository/ComunidadeRepository";
import { Semeador } from "./repository/Semeador";
import { UsuarioRepository } from "./repository/UsuarioRepository";
import { Roteador, ServidorAplicacao } from "./Servidor";
import { AutenticacaoService } from "./service/AutenticacaoService";
import { CatalogoService } from "./service/CatalogoService";
import { ComunidadeService } from "./service/ComunidadeService";
import { NotificacaoService } from "./service/NotificacaoService";

export async function criarAplicacao(configuracao: Configuracao): Promise<ServidorAplicacao> {
  const banco = await Banco.conectar(configuracao.urlBanco);
  await banco.aplicarEsquema();

  const catalogoRepository = new CatalogoRepository(banco);
  const comunidadeRepository = new ComunidadeRepository(banco);
  const usuarioRepository = new UsuarioRepository(banco);

  await new Semeador(
    banco,
    catalogoRepository,
    comunidadeRepository,
    usuarioRepository
  ).semear();

  const notificacoes = new NotificacaoService();
  const autenticacao = new AutenticacaoService(usuarioRepository);
  const catalogo = new CatalogoService(catalogoRepository, comunidadeRepository, notificacoes);
  const comunidade = new ComunidadeService(comunidadeRepository, notificacoes);

  const roteador = new Roteador();
  const sistemaController = new SistemaController(configuracao);
  const catalogoController = new CatalogoController(catalogo, autenticacao);
  const comunidadeController = new ComunidadeController(comunidade);
  const autenticacaoController = new AutenticacaoController(autenticacao);
  const eventosController = new EventosController(notificacoes);

  roteador.get("/api/health", (contexto) => sistemaController.mostrarSaude(contexto));
  roteador.get("/api/config", (contexto) => sistemaController.mostrarConfiguracao(contexto));
  roteador.get("/api/dashboard", (contexto) => catalogoController.mostrarPainel(contexto));

  roteador.post("/api/auth/visitor", (contexto) =>
    autenticacaoController.entrarComoVisitante(contexto)
  );
  roteador.post("/api/auth/ngo", (contexto) => autenticacaoController.entrarComoOng(contexto));
  roteador.get("/api/auth/me", (contexto) => autenticacaoController.mostrarUsuario(contexto));
  roteador.post("/api/auth/logout", (contexto) => autenticacaoController.sair(contexto));

  roteador.get("/api/campaigns", (contexto) => catalogoController.listarCampanhas(contexto));
  roteador.post("/api/campaigns", (contexto) => catalogoController.criarCampanha(contexto));
  roteador.get("/api/campaigns/:id", (contexto) => catalogoController.detalharCampanha(contexto));
  roteador.get("/api/ngos", (contexto) => catalogoController.listarOngs(contexto));
  roteador.get("/api/donations", (contexto) => catalogoController.listarDoacoes(contexto));
  roteador.post("/api/donations", (contexto) => catalogoController.criarDoacao(contexto));

  roteador.get("/api/reports", (contexto) => comunidadeController.listarDenuncias(contexto));
  roteador.post("/api/reports", (contexto) => comunidadeController.criarDenuncia(contexto));
  roteador.get("/api/volunteer-applications", (contexto) =>
    comunidadeController.listarCandidaturas(contexto)
  );
  roteador.post("/api/volunteer-applications", (contexto) =>
    comunidadeController.criarCandidatura(contexto)
  );

  roteador.get("/api/events", (contexto) => eventosController.transmitir(contexto));

  return new ServidorAplicacao(
    configuracao,
    roteador,
    new ArquivosEstaticosController(configuracao.pastaFrontend)
  );
}
