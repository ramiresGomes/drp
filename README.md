# DRP — Darpe Regional Uberlândia

Sistema operacional do **Darpe** (Departamento de Assistência Religiosa para Evangelização) da Congregação Cristã no Brasil, **Regional Uberlândia-MG**.

Há um cadastro Darpe por pessoa, vínculo institucional para autorizar escala, presença no mesmo dia do atendimento e eventos regionais obrigatórios. A definição fechada e o PRD continuam no app, em `/definicao` e `/prd`.

## Painéis

- **Secretaria** — pessoas, cidades, comuns, instituições, vínculos, séries, eventos, avisos, moderação de arquivos, pedidos LGPD, incidentes, dupla aprovação, auditoria e relatórios.
- **Coordenação** — escala só de vinculados, sugestão de disponíveis, cancelamento justificado, presença no mesmo dia (com correção), participação extra, envio de foto/PDF para moderação.
- **Colaborador** — agenda mensal e exportação .ics, justificativa, avisos (ciência/confirmação), dados próprios, bloqueios de agenda e pedido LGPD.
- **Encarregado regional** — concede vínculo institucional sem abrir o restante da secretaria.

Todos os painéis usam o mesmo Google OAuth. Em produção o login de demonstração fica desligado (`AUTH_ALLOW_DEMO` não definido). Localmente ele continua disponível.

## Como rodar (local)

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:setup
npm run dev
```

Abra [http://127.0.0.1:43147](http://127.0.0.1:43147).

O banco local é Postgres (`docker compose`, porta **5433**). Sem Docker, aponte `DATABASE_URL` e `DIRECT_URL` para o mesmo projeto Supabase de desenvolvimento.

## Produção: Supabase + Google OAuth

O Prisma fala com o **Postgres do Supabase**. O Auth continua no NextAuth (Google). Não use o Auth nativo do Supabase nesta v1.

### 1. Banco no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → Database**, copie duas URIs:
   - **Transaction pooler** (porta **6543**) → `DATABASE_URL` (Next.js / Vercel)
   - **Session pooler ou conexão direta** (porta **5432**) → `DIRECT_URL` (migrations)
3. Acrescente `?pgbouncer=true` na `DATABASE_URL` do pooler e `sslmode=require` nas duas.

Exemplo (troque região, referência e senha):

```bash
DATABASE_URL="postgresql://postgres.REFERENCIA:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.REFERENCIA:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

4. No deploy (Vercel ou equivalente), rode `npm run db:migrate` uma vez (ou use o build command `prisma migrate deploy && next build`) e, se quiser a base de exemplo, `npx prisma db seed`.
5. Pessoas reais precisam de **e-mail Google** no cadastro Darpe. As contas `@darpe.local` só servem na prévia.

### 2. Google OAuth

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um **ID do cliente OAuth** do tipo aplicativo da Web.
2. Origens JavaScript autorizadas: `http://127.0.0.1:43147` e `https://SEU-DOMINIO`.
3. URIs de redirecionamento: `http://127.0.0.1:43147/api/auth/callback/google` e `https://SEU-DOMINIO/api/auth/callback/google`.
4. Preencha no ambiente (nunca no git):

```bash
AUTH_SECRET="(openssl rand -base64 32)"
AUTH_URL="https://SEU-DOMINIO"
AUTH_GOOGLE_ID="....apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="...."
AUTH_TRUST_HOST="true"
```

Só entra quem já está cadastrado e **ativo**. E-mail Google fora do cadastro cai em `/entrar?error=nao-cadastrado`.

### Variáveis no Vercel

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | sim | Pooler 6543 |
| `DIRECT_URL` | sim | Migrate 5432 |
| `AUTH_SECRET` | sim | Sessão NextAuth |
| `AUTH_URL` | sim | URL canônica do site |
| `AUTH_GOOGLE_ID` | sim | Cliente OAuth |
| `AUTH_GOOGLE_SECRET` | sim | Segredo OAuth |
| `AUTH_TRUST_HOST` | recomendado | `true` |
| `AUTH_ALLOW_DEMO` | não | `true` só em staging |

## Contas de demonstração

| E-mail | Perfil |
| --- | --- |
| `secretaria@darpe.local` | Ramires Gomes — secretário / superadmin |
| `anciao@darpe.local` | João Batista — ancião coordenador |
| `coordenacao@darpe.local` | Pedro Henrique — responsável do Hospital de Clínicas |
| `colaboradora@darpe.local` | Ana Clara — colaboradora / cantora |
| `encarregada@darpe.local` | Maria das Dores — encarregada regional / músico |
| `juridico@darpe.local` | Helena Souza — jurídico |
| `menor@darpe.local` | Lucas Silva — colaborador menor / músico |

Não há senha: o e-mail precisa existir no cadastro Darpe.

## Regras da v1 já no sistema

- Instituição tem uma cidade e um setor.
- Instituição pode ser inativada sem perder histórico.
- Músico e cantor não se combinam.
- Sem vínculo ativo não há escala.
- Vínculo de recadastramento exige vigência.
- Sem remarcação; cancelamento exige justificativa.
- Presença e fechamento da lista no mesmo dia; correção no mesmo dia sem segunda aprovação.
- Evento obrigatório vale para toda a regional.
- Check-in de evento é pelo QR, com login e localização quando o local tem geofence.
- Foto ou PDF do atendimento só fica visível depois da moderação da secretaria.
- Relatório amplo permanece anonimizado até a secretaria marcar identificação.
- Exportação em CSV e página para imprimir/salvar PDF, com recorte por mês, trimestre, semestre ou ano.
- Avisos internos por função, competência, instituição, setor ou cidade; agendamento congela o público no envio.
- Escala gera aviso interno a quem entra; cancelamento e lembrete de evento também.
- Agenda mensal com exportação `.ics`.
- Pedido LGPD do titular: acesso e correção na secretaria; exclusão segue para dupla aprovação.
- Dupla aprovação: superadmin, exclusão LGPD, reabrir presença após o dia, cancelar reunião/ensaio convocado.
- No mesmo dia a coordenação corrige presença mesmo com a lista fechada; depois do dia pede reabertura.
