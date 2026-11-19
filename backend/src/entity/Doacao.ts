export type TipoDoacao = "money" | "food";

export interface DoacaoProps {
  id: string;
  campaignId: string;
  donorName: string;
  type: TipoDoacao;
  amount: number;
  foodDescription: string;
  createdAt: string;
}

export class Doacao implements DoacaoProps {
  public id: string;
  public campaignId: string;
  public donorName: string;
  public type: TipoDoacao;
  public amount: number;
  public foodDescription: string;
  public createdAt: string;

  constructor(props: DoacaoProps) {
    this.id = props.id;
    this.campaignId = props.campaignId;
    this.donorName = props.donorName;
    this.type = props.type;
    this.amount = props.amount;
    this.foodDescription = props.foodDescription;
    this.createdAt = props.createdAt;
  }

  public ehMonetaria(): boolean {
    return this.type === "money";
  }

  public ehAlimento(): boolean {
    return this.type === "food";
  }
}
