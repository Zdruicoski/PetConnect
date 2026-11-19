export type TipoUsuario = "visitante" | "ong";

export interface UsuarioProps {
  id: string;
  name: string;
  type: TipoUsuario;
  cpf?: string | null;
  ngoId: string | null;
  ngoName: string | null;
}

export class Usuario implements UsuarioProps {
  public id: string;
  public name: string;
  public type: TipoUsuario;
  public cpf: string | null;
  public ngoId: string | null;
  public ngoName: string | null;

  constructor(props: UsuarioProps) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.cpf = props.cpf ?? null;
    this.ngoId = props.ngoId;
    this.ngoName = props.ngoName;
  }

  public ehOng(): boolean {
    return this.type === "ong";
  }

  public ehVisitante(): boolean {
    return this.type === "visitante";
  }
}

export interface UsuarioComSenhaProps extends UsuarioProps {
  passwordHash: string | null;
}

export class UsuarioComSenha extends Usuario {
  public passwordHash: string | null;

  constructor(props: UsuarioComSenhaProps) {
    super(props);
    this.passwordHash = props.passwordHash;
  }
}
