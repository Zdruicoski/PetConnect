import * as path from "path";

import { ConfiguracaoAplicacao } from "./config/ConfiguracaoAplicacao";
import { ControladorArquivosEstaticos } from "./controllers/ControladorArquivosEstaticos";
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
import { RepositorioJson } from "./repositories/RepositorioJson";
import { registrarRotas } from "./rotas/registrarRotas";
import { Roteador } from "./rotas/Roteador";
import { ServicoCampanhas } from "./services/ServicoCampanhas";
import { ServicoConfiguracao } from "./services/ServicoConfiguracao";
import { ServicoDenuncias } from "./services/ServicoDenuncias";
import { ServicoDoacoes } from "./services/ServicoDoacoes";
import { ServicoNotificacoes } from "./services/ServicoNotificacoes";
import { ServicoOngs } from "./services/ServicoOngs";
import { ServicoPainel } from "./services/ServicoPainel";
import { ServicoVoluntariado } from "./services/ServicoVoluntariado";

const pastaRaiz = path.resolve(__dirname, "..", "..");
const configuracao = new ConfiguracaoAplicacao(pastaRaiz);
const repositorio = new RepositorioJson(configuracao.pastaDados, configuracao.arquivoDados);
const notificacoes = new ServicoNotificacoes();
const roteador = new Roteador();

const controladores = {
  controladorStatus: new ControladorStatus(),
  controladorConfiguracao: new ControladorConfiguracao(new ServicoConfiguracao(configuracao)),
  controladorPainel: new ControladorPainel(new ServicoPainel(repositorio)),
  controladorCampanhas: new ControladorCampanhas(new ServicoCampanhas(repositorio)),
  controladorOngs: new ControladorOngs(new ServicoOngs(repositorio)),
  controladorEventos: new ControladorEventos(notificacoes),
  controladorDenuncias: new ControladorDenuncias(new ServicoDenuncias(repositorio, notificacoes)),
  controladorDoacoes: new ControladorDoacoes(new ServicoDoacoes(repositorio, notificacoes)),
  controladorVoluntariado: new ControladorVoluntariado(
    new ServicoVoluntariado(repositorio, notificacoes)
  )
};

registrarRotas(roteador, controladores);

const controladorArquivosEstaticos = new ControladorArquivosEstaticos(configuracao.pastaFrontend);
const servidor = new ServidorAplicacao(configuracao, roteador, controladorArquivosEstaticos);

servidor.iniciar();
