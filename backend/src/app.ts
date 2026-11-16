import { ConfiguracaoAplicacao } from "./config/ConfiguracaoAplicacao";
import { ControladorArquivosEstaticos } from "./controllers/ControladorArquivosEstaticos";
import { ControladorAutenticacao } from "./controllers/ControladorAutenticacao";
import { ControladorCampanhas } from "./controllers/ControladorCampanhas";
import { ControladorConfiguracao } from "./controllers/ControladorConfiguracao";
import { ControladorDenuncias } from "./controllers/ControladorDenuncias";
import { ControladorDoacoes } from "./controllers/ControladorDoacoes";
import { ControladorEventos } from "./controllers/ControladorEventos";
import { ControladorOngs } from "./controllers/ControladorOngs";
import { ControladorPainel } from "./controllers/ControladorPainel";
import { ControladorStatus } from "./controllers/ControladorStatus";
import { ControladorVoluntariado } from "./controllers/ControladorVoluntariado";
import { ServidorAplicacao } from "./http/ServidorAplicacao";
import type { Banco } from "./repositories/Banco";
import { RepositorioPostgres } from "./repositories/RepositorioPostgres";
import { Semeador } from "./repositories/Semeador";
import { registrarRotas } from "./rotas/registrarRotas";
import { Roteador } from "./rotas/Roteador";
import { ServicoAutenticacao } from "./services/ServicoAutenticacao";
import { ServicoCampanhas } from "./services/ServicoCampanhas";
import { ServicoConfiguracao } from "./services/ServicoConfiguracao";
import { ServicoDenuncias } from "./services/ServicoDenuncias";
import { ServicoDoacoes } from "./services/ServicoDoacoes";
import { ServicoNotificacoes } from "./services/ServicoNotificacoes";
import { ServicoOngs } from "./services/ServicoOngs";
import { ServicoPainel } from "./services/ServicoPainel";
import { ServicoVoluntariado } from "./services/ServicoVoluntariado";

export async function criarAplicacao(
  configuracao: ConfiguracaoAplicacao,
  banco: Banco
): Promise<ServidorAplicacao> {
  await banco.aplicarEsquema(configuracao.arquivoEsquema);

  const repositorio = new RepositorioPostgres(banco);
  await new Semeador(repositorio).semearSeVazio();

  const notificacoes = new ServicoNotificacoes();
  const autenticacao = new ServicoAutenticacao(repositorio);
  const roteador = new Roteador();

  registrarRotas(roteador, {
    controladorStatus: new ControladorStatus(),
    controladorConfiguracao: new ControladorConfiguracao(new ServicoConfiguracao(configuracao)),
    controladorPainel: new ControladorPainel(new ServicoPainel(repositorio)),
    controladorAutenticacao: new ControladorAutenticacao(autenticacao),
    controladorCampanhas: new ControladorCampanhas(
      new ServicoCampanhas(repositorio, notificacoes),
      autenticacao
    ),
    controladorOngs: new ControladorOngs(new ServicoOngs(repositorio)),
    controladorEventos: new ControladorEventos(notificacoes),
    controladorDenuncias: new ControladorDenuncias(new ServicoDenuncias(repositorio, notificacoes)),
    controladorDoacoes: new ControladorDoacoes(new ServicoDoacoes(repositorio, notificacoes)),
    controladorVoluntariado: new ControladorVoluntariado(
      new ServicoVoluntariado(repositorio, notificacoes)
    )
  });

  return new ServidorAplicacao(
    configuracao,
    roteador,
    new ControladorArquivosEstaticos(configuracao.pastaFrontend)
  );
}
