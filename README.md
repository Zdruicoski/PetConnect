# PetConnect — Documentação do Projeto

> Plataforma solidária para animais em situação de rua: campanhas de doação, denúncias geolocalizadas e voluntariado. Protótipo acadêmico funcional para a região de Tubarão - SC.

> 📘 **Quer entender o código na ordem em que ele acontece?**
> Veja [`FLUXO-DO-CODIGO.md`](./FLUXO-DO-CODIGO.md): um passo a passo didático
> que segue o dado desde a criação das entidades até o PostgreSQL e a volta
> para o navegador, com os fluxos completos de denúncia, doação, login e
> carregamento da página.

---

## Sumário

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Como Iniciar o Projeto](#como-iniciar-o-projeto)
4. [Fluxo Completo de uma Requisição](#fluxo-completo-de-uma-requisição)
5. [Camada: Entidades (`entity/`)](#camada-entidades-entity)
6. [Camada: DTOs (`dto/`)](#camada-dtos-dto)
7. [Camada: Banco de Dados (`Banco.ts`)](#camada-banco-de-dados-bancots)
8. [Camada: Repositórios (`repository/`)](#camada-repositórios-repository)
9. [Camada: Services (`service/`)](#camada-services-service)
10. [Camada: Controllers (`controller/`)](#camada-controllers-controller)
11. [Servidor e Roteador (`Servidor.ts`)](#servidor-e-roteador-servidorts)
12. [Inicialização (`main.ts` → `app.ts`)](#inicialização-maints--appts)
13. [Frontend (`frontend/`)](#frontend-frontend)
14. [Fluxo de Autenticação](#fluxo-de-autenticação)
15. [Fluxo de Eventos em Tempo Real (SSE)](#fluxo-de-eventos-em-tempo-real-sse)
16. [Tabelas do Banco de Dados](#tabelas-do-banco-de-dados)
17. [Rotas da API](#rotas-da-api)

---

## Visão Geral da Arquitetura

O PetConnect segue uma **arquitetura em camadas** no backend, onde cada camada tem uma responsabilidade única e depende apenas da camada abaixo dela. O frontend é uma SPA (Single Page Application) em HTML/CSS/JS puro que se comunica com o backend via API REST e eventos SSE.

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                      │
│               index.html + styles.css + app.js              │
│         Comunicação via fetch() REST + EventSource SSE       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP / SSE
┌───────────────────────────▼─────────────────────────────────┐
│                   BACKEND (Node.js / TypeScript)             │
│                                                             │
│  main.ts ──► app.ts ──► Servidor.ts (HTTP nativo)           │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│  │Controller│──►│ Service  │──►│Repository│──►│  Banco  │  │
│  │          │   │          │   │          │   │(PostgreS│  │
│  │  Recebe  │   │  Regras  │   │  Queries │   │   QL)   │  │
│  │HTTP e    │   │  de      │   │  SQL     │   │         │  │
│  │responde  │   │  Negócio │   │          │   │         │  │
│  └──────────┘   └────┬─────┘   └──────────┘   └─────────┘  │
│                      │                                      │
│               ┌──────▼──────┐                               │
│               │  Entidades  │  ◄── Objetos do domínio       │
│               │  + DTOs     │  ◄── Dados de entrada/saída   │
│               └─────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas

```
PetConnect/
├── .env                         # Variáveis de ambiente (DATABASE_URL, PORT)
├── .env.example                 # Modelo de configuração
├── package.json                 # Scripts npm (start, build, dev)
├── tsconfig.json                # Configuração TypeScript raiz
│
├── backend/
│   ├── tsconfig.json            # Configuração TypeScript do backend
│   └── src/
│       ├── main.ts              # Ponto de entrada da aplicação
│       ├── app.ts               # Monta toda a aplicação (DI manual)
│       ├── Configuracao.ts      # Lê variáveis de ambiente
│       ├── Servidor.ts          # HTTP server, Roteador e helpers
│       ├── ErroHttp.ts          # Classe de erro com status HTTP
│       │
│       ├── entity/              # Entidades do domínio (POO)
│       │   ├── Campanha.ts
│       │   ├── CandidaturaVoluntario.ts
│       │   ├── Denuncia.ts
│       │   ├── Doacao.ts
│       │   ├── Ong.ts
│       │   ├── Usuario.ts
│       │   └── index.ts         # Barrel export
│       │
│       ├── dto/                 # Objetos de transferência de dados
│       │   ├── AutenticacaoDTO.ts
│       │   ├── CampanhaDTO.ts
│       │   ├── CandidaturaVoluntarioDTO.ts
│       │   ├── DenunciaDTO.ts
│       │   ├── DoacaoDTO.ts
│       │   ├── PainelDTO.ts
│       │   └── index.ts         # Barrel export
│       │
│       ├── repository/          # Acesso ao banco de dados
│       │   ├── Banco.ts         # Conexão + schema + transações
│       │   ├── CatalogoRepository.ts   # ONGs, campanhas, doações
│       │   ├── ComunidadeRepository.ts # Denúncias, voluntariado
│       │   ├── UsuarioRepository.ts    # Usuários e sessões
│       │   └── Semeador.ts      # Dados iniciais (seed)
│       │
│       ├── service/             # Regras de negócio
│       │   ├── AutenticacaoService.ts
│       │   ├── CatalogoService.ts
│       │   ├── ComunidadeService.ts
│       │   └── NotificacaoService.ts   # SSE em tempo real
│       │
│       └── controller/          # Entrada/saída HTTP
│           ├── ArquivosEstaticosController.ts
│           ├── AutenticacaoController.ts
│           ├── CatalogoController.ts
│           ├── ComunidadeController.ts
│           ├── EventosController.ts
│           └── SistemaController.ts
│
└── frontend/
    ├── index.html               # Estrutura da página (SPA)
    ├── styles.css               # Estilos visuais
    └── app.js                   # Lógica do lado do cliente
```

---

## Como Iniciar o Projeto

### Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/PetConnect.git
cd PetConnect

# 2. Instale as dependências
npm install

# 3. Configure o banco de dados
# Copie o arquivo de exemplo e edite com seus dados
cp .env.example .env
# Edite .env e defina DATABASE_URL e PORT

# 4. Compile o TypeScript
npm run build

# 5. Inicie o servidor
npm start
```

Acesse `http://localhost:3000` no navegador.

> **Conta de teste (visitante):** `visitante@petconnect.com` / `petconnect123`  
> Criada automaticamente pelo Semeador na primeira execução.

---

## Fluxo Completo de uma Requisição

Veja o exemplo de **criar uma denúncia** para entender como as camadas se comunicam:

```
[Browser] Usuário clica "Enviar denúncia"
     │
     │  POST /api/reports  { title, description, lat, lng, ... }
     ▼
[Servidor.ts] ServidorAplicacao.atenderRequisicao()
     │  Roteador encontra a rota POST /api/reports
     ▼
[ComunidadeController.ts] criarDenuncia()
     │  1. Lê o corpo JSON via CorpoRequisicao.lerJson()
     │  2. Chama comunidadeService.criarDenuncia(dados)
     ▼
[ComunidadeService.ts] criarDenuncia()
     │  1. Cria objeto Denuncia (entidade) com ID gerado por UUID
     │  2. Valida os dados via validarDadosDenuncia() (DTO)
     │  3. Chama comunidadeRepository.inserirDenuncia(denuncia)
     │  4. Notifica todos via notificacoes.notificarTodos("report-created", ...)
     ▼
[ComunidadeRepository.ts] inserirDenuncia()
     │  Executa INSERT no PostgreSQL via Banco.consultar()
     ▼
[Banco.ts] consultar()
     │  pool.query(sql, parametros) → retorna rows[]
     ▼
[PostgreSQL] Tabela "reports" recebe a nova linha
     │
     ◄─────────────────── retorna a Denuncia criada ───────────────────
     │
[ComunidadeController.ts] responde com JSON 201
     │
[Browser] app.js recebe a resposta + exibe no mapa
          Também recebe o evento SSE "report-created" em tempo real
```

---

## Camada: Entidades (`entity/`)

As entidades representam os **objetos do mundo real** do sistema. Seguem os princípios de POO: encapsulam dados e comportamentos relacionados.

### Como funcionam

Cada entidade tem:
- Uma **interface de Props** com os campos obrigatórios
- Uma **classe** que implementa essa interface com lógica de negócio
- Um **construtor** que recebe um objeto Props

```typescript
// Exemplo: Campanha.ts
export class Campanha implements CampanhaProps {
  public id: string;
  public title: string;
  public raised: number;
  public target: number;
  // ...

  constructor(props: CampanhaProps) {
    this.id = props.id;
    // ...
  }

  // Comportamento da entidade — lógica pertence à entidade, não ao service
  public calcularProgressoPercentual(): number {
    return Math.min(100, (this.raised / this.target) * 100);
  }

  public metaAtingida(): boolean {
    return this.raised >= this.target;
  }
}
```

### Entidades disponíveis

| Arquivo | Responsabilidade | Métodos notáveis |
|---|---|---|
| `Campanha.ts` | Campanha de doação de uma ONG | `calcularProgressoPercentual()`, `metaAtingida()` |
| `Denuncia.ts` | Denúncia geolocalizada de animal | `marcarComoResolvida()` |
| `Doacao.ts` | Doação (dinheiro ou alimento) feita a uma campanha | — |
| `Ong.ts` | Organização não-governamental | `adicionarCampanhaAtiva()` |
| `Usuario.ts` | Usuário do sistema (visitante ou ONG) | `ehOng()`, `ehVisitante()` |
| `CandidaturaVoluntario.ts` | Candidatura de voluntário | — |

> **Por que separar em arquivos individuais?** Seguindo boas práticas de POO, cada classe fica em seu próprio arquivo. Isso facilita localizar, editar e testar cada entidade sem abrir arquivos gigantes.

O arquivo `entity/index.ts` reexporta tudo para que outras partes do código importem assim:
```typescript
import { Campanha, Denuncia, Ong } from "../entity";
```

---

## Camada: DTOs (`dto/`)

**DTO = Data Transfer Object.** São estruturas simples que definem o formato dos dados que **entram** na API (vindos do browser) ou **saem** dela como resposta formatada.

### Por que DTOs existem?

- As **entidades** representam o estado interno do sistema — podem ter campos sensíveis (como `passwordHash`)
- Os **DTOs** controlam o que o usuário pode enviar e o que ele recebe de volta — só expõem o necessário

### Tipos de DTOs no projeto

**DTOs de entrada** — definem os campos aceitos numa requisição:
```typescript
// AutenticacaoDTO.ts
export interface DadosLoginVisitante {
  email?: unknown;
  password?: unknown;
}

export interface DadosCadastroVisitante {
  name?: unknown;
  email?: unknown;
  cpf?: unknown;
  password?: unknown;
}
```

> Os campos são `unknown` intencionalmente: assim o Service faz a validação e conversão, não confiando cegamente no que o browser enviou.

**DTOs de saída** — estruturam a resposta que o browser recebe:
```typescript
// PainelDTO.ts — agrupa campanhas, ONGs, denúncias e estatísticas numa única resposta
export class PainelDTO {
  campaigns: Campanha[];
  ngos: Ong[];
  reports: Denuncia[];
  stats: { animalsHelped: number; activeNgos: number; donors: number; activeReports: number };
}

// ResultadoLogin (AutenticacaoDTO.ts) — retorna token + dados públicos do usuário
export class ResultadoLogin {
  token: string;
  user: Usuario; // sem passwordHash
}
```

**Funções de validação** — ficam junto dos DTOs de entrada:
```typescript
// CampanhaDTO.ts
export function validarDadosCampanha(dados: DadosCampanha): NovaCampanha {
  const title = String(dados.title || "").trim();
  if (!title) throw new ErroHttp(400, "Informe o título da campanha.");
  // ...
  return { title, description, details, target, imageUrl };
}
```

---

## Camada: Banco de Dados (`Banco.ts`)

A classe `Banco` é a **única responsável por se comunicar com o PostgreSQL**. Ela usa o driver `pg` (node-postgres) com um pool de conexões.

### O que ela faz

**1. Conectar (método estático)**
```
Banco.conectar(urlConexao)
  → Tenta conectar ao banco
  → Se o banco não existir (erro 3D000): cria automaticamente
  → Retorna uma instância pronta para uso
```

**2. Aplicar o esquema**
```
banco.aplicarEsquema()
  → Executa todos os CREATE TABLE IF NOT EXISTS
  → Executa todos os ALTER TABLE IF NOT EXISTS
  → Idempotente: pode rodar quantas vezes quiser sem quebrar
```

**Tabelas criadas:**
`ngos` → `campaigns` → `donations` → `reports` → `volunteer_applications` → `users` → `sessions`

**3. Consultar**
```typescript
banco.consultar<T>(sql, parametros?) → Promise<T[]>
// Wrapper simples sobre pool.query(), sempre retorna array de rows
```

**4. Transação**
```typescript
banco.transacao(async (consultor) => {
  await consultor.consultar("INSERT INTO ...");
  await consultor.consultar("UPDATE ...");
  // Se qualquer linha lançar erro → ROLLBACK automático
})
```

---

## Camada: Repositórios (`repository/`)

Os repositórios são a **tradução entre as entidades TypeScript e as tabelas SQL**. Cada repositório conhece o schema de uma parte do banco.

### `CatalogoRepository.ts`

Gerencia ONGs, campanhas e doações.

```
inserirOng(dados)      → INSERT INTO ngos
listarOngs()           → SELECT * FROM ngos → mapeia rows para objetos Ong
buscarOng(id)          → SELECT ... WHERE id = $1
inserirCampanha(dados) → INSERT INTO campaigns
listarCampanhas()      → SELECT campaigns + ngo_name (JOIN)
buscarCampanha(id)     → SELECT ... WHERE id = $1
registrarDoacao(doacao)→ INSERT INTO donations + UPDATE campaigns (raised, supporters)
listarDoacoes()        → SELECT * FROM donations
```

> O método `registrarDoacao` usa `banco.transacao()` para garantir que o INSERT da doação e o UPDATE da campanha aconteçam juntos ou não aconteçam.

### `ComunidadeRepository.ts`

Gerencia denúncias e candidaturas de voluntariado.

```
inserirDenuncia(denuncia)       → INSERT INTO reports
listarDenuncias()               → SELECT * FROM reports
inserirCandidatura(candidatura) → INSERT INTO volunteer_applications
listarCandidaturas()            → SELECT * FROM volunteer_applications
```

### `UsuarioRepository.ts`

Gerencia usuários e sessões de autenticação.

```
buscarPorEmail(email) → SELECT users JOIN ngos WHERE email = $1
inserir(novoUsuario)  → INSERT INTO users (com cpf, passwordHash, etc.)
criarSessao(token, userId) → INSERT INTO sessions
buscarSessao(token)        → SELECT sessions JOIN users WHERE token = $1
removerSessao(token)       → DELETE FROM sessions WHERE token = $1
```

### `Semeador.ts`

Responsável por **preparar o banco na inicialização**. Roda uma única vez ao subir o servidor.

```
semear()
  ├── DELETE FROM reports         ← limpa todas as denúncias para testes limpos
  ├── garantirOngsIniciais()      ← insere ONGs padrão se a tabela estiver vazia
  ├── garantirCampanhasIniciais() ← insere campanhas padrão se não existirem
  └── garantirUsuarioVisitanteTeste()
        └── cria visitante@petconnect.com / petconnect123 se não existir
```

> O `DELETE FROM reports` roda **toda vez** que o servidor sobe. Isso foi configurado intencionalmente para facilitar os testes partindo de um mapa limpo.

---

## Camada: Services (`service/`)

Os services contêm as **regras de negócio**. Eles não sabem nada de HTTP (não leem headers, não escrevem responses). Recebem dados já extraídos pelo controller, processam e devolvem resultados.

### `AutenticacaoService.ts`

Centraliza toda a lógica de identidade e sessão.

```
entrarComoVisitante(dados)
  → valida email e senha
  → busca usuário no banco
  → confere o hash da senha com crypto.scrypt (timing-safe)
  → abre sessão (gera token aleatório de 64 hex chars)
  → retorna ResultadoLogin { token, user }

cadastrarVisitante(dados)
  → valida nome, email, CPF e senha (mín. 6 chars)
  → verifica se email já existe
  → cria Usuario + salva no banco com senha hasheada
  → abre sessão automaticamente

cadastrarOng(dados)
  → valida nome, email, CNPJ e senha
  → insere registro em ngos (via CatalogoRepository)
  → insere registro em users vinculado ao ngo_id
  → abre sessão automaticamente

entrarComoOng(dados)
  → igual ao visitante, mas verifica type === 'ong'

sair(autorizacao)
  → extrai Bearer token do header
  → remove a sessão do banco

obterUsuario(autorizacao)
  → busca sessão pelo token
  → verifica se não expirou (7 dias)
  → retorna o Usuario

exigirOng(autorizacao)
  → chama exigirUsuario + verifica type === 'ong'
  → usado como "guard" nos controllers protegidos
```

A classe auxiliar `Senha` implementa hash seguro:
```
Senha.gerarHash(senha) → "sal_hex:hash_hex"  (scrypt + salt aleatório)
Senha.conferir(senha, hashSalvo) → boolean    (timing-safe, resistente a timing attacks)
```

### `CatalogoService.ts`

Gerencia o catálogo público: ONGs, campanhas e doações.

```
listarCampanhas()     → delega ao repositório
detalharCampanha(id)  → busca campanha + ONG + doações recentes → DetalheCampanhaDTO
abrirCampanha(ongId, dados)
  → valida dados (via DTO)
  → gera UUID
  → persiste no banco
  → notifica todos os clientes SSE ("campaign-created")
criarDoacao(dados)
  → valida dados
  → registra doação em transação (INSERT + UPDATE campaign)
  → notifica SSE ("donation-created")
obterPainel()
  → carrega campanhas + ONGs + denúncias em paralelo (Promise.all)
  → calcula estatísticas
  → retorna PainelDTO
```

### `ComunidadeService.ts`

Gerencia denúncias e voluntariado.

```
criarDenuncia(dados)
  → valida dados (via DenunciaDTO)
  → cria objeto Denuncia com ID e status "Nova"
  → persiste no banco
  → notifica SSE ("report-created")

criarCandidatura(dados)
  → valida dados
  → persiste no banco
  → notifica SSE ("volunteer-created")
```

### `NotificacaoService.ts`

Implementa **Server-Sent Events (SSE)** — notificações em tempo real do servidor para o browser.

```
conectar(req, res)
  → configura headers SSE (Content-Type: text/event-stream)
  → adiciona a conexão ao Set de clientes
  → mantém viva com ping a cada 25 segundos
  → remove ao fechar

notificarTodos(evento, dados)
  → itera por todos os clientes conectados
  → escreve "event: nome\ndata: {...json}\n\n"
```

---

## Camada: Controllers (`controller/`)

Os controllers são a **fronteira entre o HTTP e o código de negócio**. Responsabilidades:

1. Extrair dados da requisição (body JSON, parâmetros de URL, headers)
2. Chamar o service correspondente
3. Formatar e enviar a resposta HTTP

### `AutenticacaoController.ts`

| Método | Rota | O que faz |
|---|---|---|
| `entrarComoVisitante` | POST `/api/auth/visitor` | Login visitante → token |
| `cadastrarVisitante` | POST `/api/auth/visitor/register` | Cadastro + login |
| `entrarComoOng` | POST `/api/auth/ngo` | Login ONG → token |
| `cadastrarOng` | POST `/api/auth/ngo/register` | Cadastro ONG + login |
| `mostrarUsuario` | GET `/api/auth/me` | Retorna usuário da sessão atual |
| `sair` | POST `/api/auth/logout` | Invalida sessão |

### `CatalogoController.ts`

| Método | Rota | Autenticação |
|---|---|---|
| `mostrarPainel` | GET `/api/dashboard` | Pública |
| `listarCampanhas` | GET `/api/campaigns` | Pública |
| `detalharCampanha` | GET `/api/campaigns/:id` | Pública |
| `criarCampanha` | POST `/api/campaigns` | Exige ONG logada |
| `listarOngs` | GET `/api/ngos` | Pública |
| `listarDoacoes` | GET `/api/donations` | Pública |
| `criarDoacao` | POST `/api/donations` | Pública |

### `ComunidadeController.ts`

| Método | Rota | Autenticação |
|---|---|---|
| `listarDenuncias` | GET `/api/reports` | Pública |
| `criarDenuncia` | POST `/api/reports` | Pública |
| `listarCandidaturas` | GET `/api/volunteer-applications` | Pública |
| `criarCandidatura` | POST `/api/volunteer-applications` | Pública |

### `EventosController.ts`

| Método | Rota | O que faz |
|---|---|---|
| `transmitir` | GET `/api/events` | Mantém conexão SSE aberta |

### `SistemaController.ts`

| Método | Rota | O que faz |
|---|---|---|
| `mostrarSaude` | GET `/api/health` | Retorna `{ ok: true }` |
| `mostrarConfiguracao` | GET `/api/config` | Configurações do mapa (centro, zoom, tiles) |

### `ArquivosEstaticosController.ts`

Serve os arquivos do `frontend/` (HTML, CSS, JS). Atua como fallback quando nenhuma rota da API casa com a URL.

---

## Servidor e Roteador (`Servidor.ts`)

O projeto **não usa Express ou Fastify** — o servidor HTTP é construído sobre o módulo nativo `http` do Node.js.

### Classes

**`Roteador`** — registra rotas e as casa com as requisições:
```
roteador.get("/api/campaigns/:id", handler)
roteador.post("/api/reports", handler)

// Ao receber uma requisição:
roteador.atender(req, res)
  → compara método + pathname com cada rota registrada
  → extrai parâmetros dinâmicos (ex: ":id" → { id: "camp-abc123" })
  → chama o handler da primeira rota que casar
```

**`ServidorAplicacao`** — cria o servidor HTTP e conecta ao roteador:
```
http.createServer() → atenderRequisicao()
  → roteador.atender()  // tenta as rotas da API
  → se nenhuma casar → arquivosEstaticosController.servir()
  → se der erro → tratarErro() → JSON com statusCode
```

**`RespostaHttp`** — helpers estáticos para responder:
```typescript
RespostaHttp.json(res, 201, { data })  // Content-Type: application/json
RespostaHttp.texto(res, 200, "ok")     // Content-Type: text/plain
```

**`CorpoRequisicao`** — lê o body da requisição em streaming:
```typescript
const corpo = await CorpoRequisicao.lerJson(req)
// Lê chunks, limita a 1MB, faz JSON.parse()
```

**`ErroHttp`** — erros com código HTTP específico:
```typescript
throw new ErroHttp(404, "Campanha não encontrada.")
// Capturado em tratarErro() → { error: "Campanha não encontrada." } com status 404
```

---

## Inicialização (`main.ts` → `app.ts`)

```
main.ts
  │  Lê a pasta raiz e cria Configuracao (porta, DATABASE_URL, pasta frontend)
  │
  └─► app.ts  criarAplicacao(configuracao)
        │
        ├── Banco.conectar()          → conecta ao PostgreSQL
        ├── banco.aplicarEsquema()    → cria/atualiza tabelas
        │
        ├── new CatalogoRepository(banco)
        ├── new ComunidadeRepository(banco)
        ├── new UsuarioRepository(banco)
        │
        ├── new Semeador(...).semear()
        │     ├── DELETE FROM reports
        │     ├── insere ONGs e campanhas iniciais (se vazio)
        │     └── cria usuário de teste visitante
        │
        ├── new NotificacaoService()
        ├── new AutenticacaoService(usuarioRepository, catalogoRepository)
        ├── new CatalogoService(catalogoRepository, comunidadeRepository, notificacoes)
        ├── new ComunidadeService(comunidadeRepository, notificacoes)
        │
        ├── new Roteador()
        ├── [registra todas as rotas da API]
        │
        └── return new ServidorAplicacao(configuracao, roteador, arquivosEstaticos)
              │
              └── servidor.iniciar() → escuta na porta configurada
```

> Toda a **injeção de dependência é manual**: o `app.ts` cria os repositórios e os passa para os services, e os services para os controllers. Não há framework de DI.

---

## Frontend (`frontend/`)

O frontend é uma **SPA pura** (sem React, Vue ou Angular): três arquivos que rodam no browser.

### `index.html`

Define toda a estrutura da página em HTML semântico:

- **Header** com navegação e botão Entrar/Sair
- **Seção Campanhas** (`#campanhas`) — grade de cards populada pelo JS
- **Seção Denúncias** (`#denuncias`) — mapa Leaflet + formulário de registro
- **Seção ONGs** (`#ongs`) — grade de cards
- **Seção Voluntariado** (`#voluntariado`) — form de candidatura (oculto quando logado)
- **`<dialog id="loginModal">`** — modal de login/cadastro com abas Visitante/ONG
- **`<dialog id="donationModal">`** — modal de doação
- **`<dialog id="campaignModal">`** — modal de criação de campanha (apenas ONGs)
- **`<dialog id="campaignDetailModal">`** — detalhe completo da campanha

### `styles.css`

Estilização completa sem frameworks CSS:

- **Variáveis CSS** (`--brand`, `--ink`, `--muted`, etc.) para identidade visual consistente
- Layout com **CSS Grid e Flexbox**
- **`.login-modal-box`** — modal de login com abas
- **`.password-field-wrapper`** — campo de senha com botão de mostrar/ocultar
- **`.toggle-password-btn`** — botão do ícone de olho (SVG)
- **`.toast`** — notificações temporárias
- **`.progress-track`** / **`.progress-fill`** — barra de progresso das campanhas

### `app.js`

Toda a lógica do lado cliente. Organizado em funções:

**Inicialização (`DOMContentLoaded`):**
```
vincularElementos()      → guarda referências dos elementos HTML em `elementos`
vincularEventosInterface() → registra todos os event listeners
restaurarSessao()        → tenta recuperar sessão do localStorage
carregarPainel()         → GET /api/dashboard → renderiza tudo
carregarMapa()           → GET /api/config → inicia Leaflet
conectarEventos()        → EventSource /api/events → escuta SSE
```

**Estado global (`estado`):**
```javascript
const estado = {
  config,           // configurações do mapa
  campaigns,        // lista de campanhas
  ngos,             // lista de ONGs
  reports,          // lista de denúncias
  stats,            // estatísticas do painel
  selectedLocation, // { lat, lng } selecionado no mapa
  map,              // instância Leaflet
  user,             // usuário logado (null se não logado)
  token             // JWT/token de sessão do localStorage
};
```

**Fluxo de renderização:**
```
carregarPainel()
  → GET /api/dashboard → { campaigns, ngos, reports, stats }
  → renderizarEstatisticas() → atualiza #heroStats
  → renderizarCampanhas()   → gera HTML dos campaign-cards
  → renderizarOngs()        → gera HTML dos ngo-cards
  → renderizarDenuncias()   → gera HTML da lista de denúncias
  → renderizarMarcadoresLeaflet() → pins no mapa
```

**Comunicação com a API (`buscarJson`):**
```javascript
buscarJson(url, opcoes)
  → fetch() com Content-Type: application/json
  → inclui Authorization: Bearer <token> automaticamente
  → lança Error se !response.ok (capturado pelos handlers)
```

---

## Fluxo de Autenticação

```
[Browser] Usuário preenche email + senha e clica "Entrar como Visitante"
     │
     │  POST /api/auth/visitor  { email, password }
     ▼
[AutenticacaoController] entrarComoVisitante()
     │  CorpoRequisicao.lerJson() → extrai dados
     │  autenticacaoService.entrarComoVisitante(dados)
     ▼
[AutenticacaoService]
     │  buscarPorEmail(email) → UsuarioRepository → SQL
     │  Senha.conferir(password, usuario.passwordHash)
     │  abrirSessao(usuario)
     │    → crypto.randomBytes(32) → token
     │    → criarSessao(token, usuario.id) → INSERT INTO sessions
     │    → return ResultadoLogin { token, user }
     ▼
[AutenticacaoController] RespostaHttp.json(res, 200, resultado)
     │
     ▼
[Browser] app.js recebe { token, user }
     │  salvarSessao(token) → localStorage.setItem("petconnect:token", token)
     │  estado.user = resultado.user
     │  atualizarBotaoLogin() → muda "Entrar" para o nome do usuário
     │  seção #voluntariado → hidden = true (quando logado)
     └  exibirAlerta("Olá, Nome. Bem-vindo ao PetConnect!")
```

**Próximas requisições autenticadas:**
```
buscarJson("/api/campaigns", { method: "POST", body: ... })
  → header: Authorization: Bearer <token>
     │
[CatalogoController] criarCampanha()
  → autenticacaoService.exigirOng(req.headers.authorization)
      → buscarSessao(token) → valida tipo "ong"
      → se não for ONG: ErroHttp 403 "Apenas ONGs podem fazer isso."
```

---

## Fluxo de Eventos em Tempo Real (SSE)

```
[Browser] conectarEventos()
  → EventSource("/api/events")
  → Mantém conexão HTTP aberta (streaming)

[Servidor] EventosController.transmitir()
  → notificacaoService.conectar(req, res)
  → headers: Content-Type: text/event-stream
  → envia ping a cada 25s para manter vivo

[Servidor] Quando alguém cria uma denúncia:
  notificacoes.notificarTodos("report-created", { report, message })
  → escreve para TODOS os clients conectados:
    "event: report-created\ndata: {...}\n\n"

[Browser] EventSource dispara o event listener:
  fluxo.addEventListener("report-created", (evento) => {
    const { report, message } = JSON.parse(evento.data);
    estado.reports.unshift(report);
    renderizarTudo();         // atualiza mapa e lista
    exibirAlerta(message);    // toast de notificação
  })
```

Eventos SSE disponíveis:

| Evento | Disparado quando |
|---|---|
| `connected` | Conexão SSE estabelecida |
| `report-created` | Nova denúncia registrada |
| `donation-created` | Nova doação recebida |
| `campaign-created` | Nova campanha publicada |
| `volunteer-created` | Nova candidatura de voluntário |

---

## Tabelas do Banco de Dados

```
ngos
  id TEXT PK | name | cnpj | city | about | animals_helped | volunteers
  active_campaigns | image_url | created_at

campaigns
  id TEXT PK | ngo_id FK(ngos) | title | description | details
  target | raised | supporters | donations | image_url | created_at

donations
  id TEXT PK | campaign_id FK(campaigns) | donor_name | type (money|food)
  amount | food_description | created_at

reports
  id TEXT PK | title | description | urgency (Alta|Média|Baixa)
  reporter_name | address | lat | lng | status (Nova|Em análise|Resolvida)
  created_at

volunteer_applications
  id TEXT PK | name | email | role | message | created_at

users
  id TEXT PK | name | email UNIQUE | cpf | password_hash | type (visitante|ong)
  ngo_id FK(ngos) | created_at

sessions
  token TEXT PK | user_id FK(users) | created_at
```

**Relacionamentos:**
- `campaigns` → pertence a → `ngos`
- `donations` → pertence a → `campaigns`
- `users` → pode estar vinculado a → `ngos` (quando type = "ong")
- `sessions` → pertence a → `users`

---

## Rotas da API

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/api/health` | Pública | Status do servidor |
| GET | `/api/config` | Pública | Configurações do mapa |
| GET | `/api/dashboard` | Pública | Painel completo (campanhas + ONGs + denúncias + stats) |
| POST | `/api/auth/visitor` | Pública | Login de visitante |
| POST | `/api/auth/visitor/register` | Pública | Cadastro de visitante |
| POST | `/api/auth/ngo` | Pública | Login de ONG |
| POST | `/api/auth/ngo/register` | Pública | Cadastro de nova ONG |
| GET | `/api/auth/me` | Bearer Token | Retorna usuário da sessão |
| POST | `/api/auth/logout` | Bearer Token | Encerra sessão |
| GET | `/api/campaigns` | Pública | Lista campanhas |
| POST | `/api/campaigns` | ONG logada | Cria campanha |
| GET | `/api/campaigns/:id` | Pública | Detalhe de campanha |
| GET | `/api/ngos` | Pública | Lista ONGs |
| GET | `/api/donations` | Pública | Lista doações |
| POST | `/api/donations` | Pública | Registra doação |
| GET | `/api/reports` | Pública | Lista denúncias |
| POST | `/api/reports` | Pública | Cria denúncia |
| GET | `/api/volunteer-applications` | Pública | Lista candidaturas |
| POST | `/api/volunteer-applications` | Pública | Registra candidatura |
| GET | `/api/events` | Pública | Stream SSE de eventos |
| `*` | qualquer outra URL | — | Serve arquivos estáticos do `frontend/` |
