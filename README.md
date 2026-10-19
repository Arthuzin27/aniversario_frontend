# Convite de 15 Anos — Site (frontend)

Site do convite de uma festa de 15 anos. As famílias confirmam presença informando o **nome da família**, a
**quantidade de pessoas** e o **nome completo de cada participante**. Os organizadores acompanham tudo pelo
**painel administrativo** em `/admin`.

> A API (Spring Boot) fica em um repositório separado — o **backend**. Ela precisa estar rodando para o site funcionar.

## Funcionalidades

**Convite público** (`/`)
- Nome da aniversariante, data, horário, local, traje e mensagem — tudo configurável por variáveis de ambiente.
- Formulário que gera **exatamente** um campo de nome para cada pessoa informada (até o limite definido pela API).
- Etapa de **revisão**, botão desabilitado durante o envio e sucesso exibido **somente depois que a API confirma**.
- Mensagens de erro em português (validação, falha de conexão, limite de requisições).
- Proteção contra envio duplicado: cada preenchimento envia uma chave `Idempotency-Key` (uma nova tentativa após falha
  de rede não duplica o cadastro) e o aparelho avisa, numa visita posterior, que um novo envio criará outro cadastro.

**Painel administrativo** (`/admin`, exige login)
- **Resumo**: total de pessoas, total de famílias e média por família.
- **Famílias**: integrantes, data de cadastro, busca e paginação; visualizar, editar (renomear, adicionar, corrigir e
  remover participantes) e excluir, com confirmação antes de operações destrutivas. Famílias com nome repetido aparecem
  com o alerta "Possível duplicidade".
- **Relatório**: lista geral de convidados em ordem alfabética, numerada e com total; pré-visualização e exportação em
  PDF e CSV (Excel).

## Tecnologias

React 19, Vite 8, React Router 8, JavaScript (sem TypeScript), Fetch API e CSS por página/componente.
Testes com Vitest, Testing Library e jsdom. Publicação na Vercel.

## Estrutura de pastas

```
.
├── src/
│   ├── auth/                Contexto de autenticação e rota protegida
│   ├── components/convite/  Formulário dinâmico, revisão e validações
│   ├── components/admin/    Layout, cards, editor, modal e paginação do painel
│   ├── config/festa.js      Dados da festa (lidos das variáveis VITE_FESTA_*)
│   ├── pages/               Convite, login, resumo, famílias e relatório
│   ├── services/            Cliente HTTP (fetch) e chamadas da API
│   ├── utils/               Formatação de datas
│   ├── test/                Configuração e utilitários dos testes
│   └── index.css            Base mínima: paleta, tipografia, campos e botões compartilhados
├── public/                  Ícone do site
├── index.html
├── vercel.json              Reescrita de rotas da SPA e cabeçalhos de segurança
├── vite.config.js
└── .env.example             Modelo das variáveis de ambiente
```

## Pré-requisitos

- **Node.js 22.22+** (recomendado 24 LTS) e npm
- A API do backend rodando (localmente em http://localhost:8080)

## Configuração

```powershell
Copy-Item .env.example .env.local
```

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | Endereço da API, sem barra no final (local: `http://localhost:8080`) |
| `VITE_FESTA_ANIVERSARIANTE` | Nome exibido no convite |
| `VITE_FESTA_DATA` | Data no formato `AAAA-MM-DD` (ex.: `2027-01-09`) |
| `VITE_FESTA_HORARIO` | Ex.: `19h` |
| `VITE_FESTA_LOCAL` / `VITE_FESTA_ENDERECO` | Nome do local e endereço |
| `VITE_FESTA_MAPA_URL` | Link do mapa (mostra o botão "Ver no mapa") |
| `VITE_FESTA_TRAJE` | Traje |
| `VITE_FESTA_PRAZO_CONFIRMACAO` | Prazo para confirmar, `AAAA-MM-DD` |
| `VITE_FESTA_MENSAGEM` | Texto de abertura do convite |

Itens deixados em branco não aparecem no convite — não é preciso alterar código.

> As variáveis `VITE_*` vão para o JavaScript do navegador: **nunca** coloque senhas ou segredos nelas.

## Executando localmente

```powershell
npm install
npm run dev
```

- Convite: http://localhost:5173
- Painel: http://localhost:5173/admin

A API precisa aceitar a origem `http://localhost:5173` (variável `CORS_ALLOWED_ORIGINS` do backend).

Build de produção: `npm run build` (gera a pasta `dist`) e `npm run preview` para conferir.

## Testes

```powershell
npm test
```

21 testes: geração dinâmica dos campos; alteração da quantidade preservando nomes; validação de obrigatórios;
mensagens de erro e de sucesso (sucesso só após a resposta da API); bloqueio de duplo clique; reenvio com a mesma chave
após falha de rede; erros de campo vindos da API; integração com a API (cabeçalhos, corpo, token); proteção de
navegação do painel, login, logout e expiração de sessão; exclusão com confirmação; edição.

## Acesso ao painel

Acesse `/admin` e entre com o usuário e a senha do administrador definidos no `.env` do backend (`ADMIN_USERNAME` e
`ADMIN_PASSWORD`). O token fica no `sessionStorage`: a sessão termina ao fechar a aba ou quando expira. O convite
público não tem link para o painel.

## Deploy na Vercel

1. Importe este repositório na Vercel (framework **Vite** detectado; build `npm run build`, saída `dist`).
2. Em *Settings → Environment Variables*, defina `VITE_API_URL` com o endereço HTTPS da API (ex.:
   `https://brenonun3s.vps-kinghost.net:3041`) e as variáveis `VITE_FESTA_*`.
3. Em *Settings → Domains*, adicione o seu domínio (ex.: `convite.seudominio.com.br`) e crie o registro DNS indicado.
4. O [vercel.json](vercel.json) já redireciona as rotas da SPA (`/admin/...`) para o `index.html`.
5. Informe o domínio final do site em `CORS_ALLOWED_ORIGINS` no backend (exatamente igual, sem barra no final).

Variáveis `VITE_*` são aplicadas no build: depois de alterá-las na Vercel, faça um novo deploy.
