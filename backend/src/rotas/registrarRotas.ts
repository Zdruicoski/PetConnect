import type { ControladorCampanhas } from "../controllers/ControladorCampanhas";
import type { ControladorConfiguracao } from "../controllers/ControladorConfiguracao";
import type { ControladorDenuncias } from "../controllers/ControladorDenuncias";
import type { ControladorDoacoes } from "../controllers/ControladorDoacoes";
import type { ControladorEventos } from "../controllers/ControladorEventos";
import type { ControladorOngs } from "../controllers/ControladorOngs";
import type { ControladorPainel } from "../controllers/ControladorPainel";
import type { ControladorStatus } from "../controllers/ControladorStatus";
import type { ControladorVoluntariado } from "../controllers/ControladorVoluntariado";
import type { Roteador } from "./Roteador";

export type RegistroControladores = {
  controladorStatus: ControladorStatus;
  controladorConfiguracao: ControladorConfiguracao;
  controladorPainel: ControladorPainel;
  controladorCampanhas: ControladorCampanhas;
  controladorOngs: ControladorOngs;
  controladorEventos: ControladorEventos;
  controladorDenuncias: ControladorDenuncias;
  controladorDoacoes: ControladorDoacoes;
  controladorVoluntariado: ControladorVoluntariado;
};

export function registrarRotas(roteador: Roteador, controladores: RegistroControladores): void {
  roteador.get("/api/health", (contexto) => controladores.controladorStatus.mostrar(contexto));
  roteador.get("/api/config", (contexto) => controladores.controladorConfiguracao.mostrar(contexto));
  roteador.get("/api/dashboard", (contexto) => controladores.controladorPainel.listar(contexto));
  roteador.get("/api/campaigns", (contexto) => controladores.controladorCampanhas.listar(contexto));
  roteador.get("/api/ngos", (contexto) => controladores.controladorOngs.listar(contexto));
  roteador.get("/api/events", (contexto) => controladores.controladorEventos.transmitir(contexto));
  roteador.get("/api/reports", (contexto) => controladores.controladorDenuncias.listar(contexto));
  roteador.post("/api/reports", (contexto) => controladores.controladorDenuncias.criar(contexto));
  roteador.get("/api/donations", (contexto) => controladores.controladorDoacoes.listar(contexto));
  roteador.post("/api/donations", (contexto) => controladores.controladorDoacoes.criar(contexto));
  roteador.get("/api/volunteer-applications", (contexto) =>
    controladores.controladorVoluntariado.listar(contexto)
  );
  roteador.post("/api/volunteer-applications", (contexto) =>
    controladores.controladorVoluntariado.criar(contexto)
  );
}
