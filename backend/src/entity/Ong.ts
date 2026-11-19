export interface OngProps {
  id: string;
  name: string;
  cnpj?: string;
  city: string;
  about: string;
  animalsHelped: number;
  volunteers: number;
  activeCampaigns: number;
  imageUrl: string;
}

export class Ong implements OngProps {
  public id: string;
  public name: string;
  public cnpj: string;
  public city: string;
  public about: string;
  public animalsHelped: number;
  public volunteers: number;
  public activeCampaigns: number;
  public imageUrl: string;

  constructor(props: OngProps) {
    this.id = props.id;
    this.name = props.name;
    this.cnpj = props.cnpj || "";
    this.city = props.city;
    this.about = props.about;
    this.animalsHelped = props.animalsHelped;
    this.volunteers = props.volunteers;
    this.activeCampaigns = props.activeCampaigns;
    this.imageUrl = props.imageUrl;
  }

  public adicionarCampanhaAtiva(): void {
    this.activeCampaigns += 1;
  }
}
