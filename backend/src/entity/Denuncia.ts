export type UrgenciaDenuncia = "Alta" | "Média" | "Baixa";
export type StatusDenuncia = "Nova" | "Em análise" | "Resolvida";

export interface DenunciaProps {
  id: string;
  title: string;
  description: string;
  urgency: UrgenciaDenuncia;
  reporterName: string;
  address: string;
  lat: number;
  lng: number;
  status: StatusDenuncia;
  createdAt: string;
}

export class Denuncia implements DenunciaProps {
  public id: string;
  public title: string;
  public description: string;
  public urgency: UrgenciaDenuncia;
  public reporterName: string;
  public address: string;
  public lat: number;
  public lng: number;
  public status: StatusDenuncia;
  public createdAt: string;

  constructor(props: DenunciaProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.urgency = props.urgency;
    this.reporterName = props.reporterName;
    this.address = props.address;
    this.lat = props.lat;
    this.lng = props.lng;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public marcarComoResolvida(): void {
    this.status = "Resolvida";
  }

  public marcarEmAnalise(): void {
    this.status = "Em análise";
  }
}
