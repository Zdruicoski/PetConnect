-- Esquema do PetConnect. É aplicado automaticamente ao iniciar o servidor (idempotente).

CREATE TABLE IF NOT EXISTS ongs (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  sobre TEXT NOT NULL,
  animais_ajudados INTEGER NOT NULL DEFAULT 0,
  voluntarios INTEGER NOT NULL DEFAULT 0,
  imagem_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  senha_hash TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('visitante', 'ong')),
  ong_id TEXT REFERENCES ongs (id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessoes (
  token TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campanhas (
  id TEXT PRIMARY KEY,
  ong_id TEXT NOT NULL REFERENCES ongs (id),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  detalhes TEXT NOT NULL DEFAULT '',
  meta NUMERIC(12, 2) NOT NULL,
  arrecadado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  apoiadores INTEGER NOT NULL DEFAULT 0,
  doacoes INTEGER NOT NULL DEFAULT 0,
  imagem_url TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doacoes (
  id TEXT PRIMARY KEY,
  campanha_id TEXT NOT NULL REFERENCES campanhas (id),
  doador TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('money', 'food')),
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0,
  descricao_alimento TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS denuncias (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  urgencia TEXT NOT NULL,
  denunciante TEXT NOT NULL,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'Nova',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidaturas_voluntario (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  vaga TEXT NOT NULL,
  mensagem TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
)
