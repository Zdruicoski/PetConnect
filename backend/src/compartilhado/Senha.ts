import * as crypto from "crypto";

export class Senha {
  static gerarHash(senha: string): string {
    const sal = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(senha, sal, 64).toString("hex");
    return `${sal}:${hash}`;
  }

  static conferir(senha: string, hashSalvo: string): boolean {
    const [sal, hash] = hashSalvo.split(":");

    if (!sal || !hash) {
      return false;
    }

    const esperado = Buffer.from(hash, "hex");
    const calculado = crypto.scryptSync(senha, sal, esperado.length);
    return crypto.timingSafeEqual(esperado, calculado);
  }
}
