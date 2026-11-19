export interface CampanhaProps {
  id: string;
  ngoId: string;
  title: string;
  ngoName: string;
  description: string;
  details: string;
  target: number;
  raised: number;
  supporters: number;
  donations: number;
  imageUrl: string;
  createdAt: string;
}

export interface NovaCampanhaProps {
  title: string;
  description: string;
  details: string;
  target: number;
  imageUrl: string;
}

export type NovaCampanha = NovaCampanhaProps;

export class Campanha implements CampanhaProps {
  public id: string;
  public ngoId: string;
  public title: string;
  public ngoName: string;
  public description: string;
  public details: string;
  public target: number;
  public raised: number;
  public supporters: number;
  public donations: number;
  public imageUrl: string;
  public createdAt: string;

  constructor(props: CampanhaProps) {
    this.id = props.id;
    this.ngoId = props.ngoId;
    this.title = props.title;
    this.ngoName = props.ngoName;
    this.description = props.description;
    this.details = props.details;
    this.target = props.target;
    this.raised = props.raised;
    this.supporters = props.supporters;
    this.donations = props.donations;
    this.imageUrl = props.imageUrl;
    this.createdAt = props.createdAt;
  }

  public calcularProgressoPercentual(): number {
    if (this.target <= 0) return 0;
    return Math.min(100, (this.raised / this.target) * 100);
  }

  public metaAtingida(): boolean {
    return this.raised >= this.target;
  }
}
