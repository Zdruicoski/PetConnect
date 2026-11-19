export interface CandidaturaVoluntarioProps {
  id: string;
  name: string;
  email: string;
  role: string;
  message: string;
  createdAt: string;
}

export class CandidaturaVoluntario implements CandidaturaVoluntarioProps {
  public id: string;
  public name: string;
  public email: string;
  public role: string;
  public message: string;
  public createdAt: string;

  constructor(props: CandidaturaVoluntarioProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.role = props.role;
    this.message = props.message;
    this.createdAt = props.createdAt;
  }
}
