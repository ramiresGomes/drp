# DRP — Darpe Regional Uberlândia

Sistema operacional do **Darpe** (Departamento de Assistência Religiosa para Evangelização) da Congregação Cristã no Brasil, **Regional Uberlândia-MG**.

Há um cadastro Darpe por pessoa, vínculo institucional para autorizar escala, presença no mesmo dia do atendimento e eventos regionais obrigatórios. A definição fechada e o PRD continuam no app, em `/definicao` e `/prd`.

## Painéis

- **Secretaria** — pessoas, cidades, comuns, instituições, vínculos, séries, eventos, avisos, moderação de arquivos, pedidos LGPD, incidentes, dupla aprovação, auditoria e relatórios.
- **Coordenação** — escala só de vinculados, cancelamento justificado, presença no mesmo dia, participação extra, envio de foto/PDF para moderação.
- **Colaborador** — agenda, justificativa, avisos (ciência/confirmação), dados próprios, bloqueios de agenda e pedido LGPD.
- **Encarregado regional** — concede vínculo institucional sem abrir o restante da secretaria.

Todos os painéis usam o mesmo Google OAuth. Nesta prévia local, se `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` não estiverem definidos, o login de demonstração por e-mail cadastrado permanece disponível.

## Como rodar

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Abra [http://127.0.0.1:43147](http://127.0.0.1:43147).

O banco local é SQLite (`prisma/dev.db`). Em produção na Vercel será preciso um banco persistente e as chaves Google.

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
- Exportação em CSV e página para imprimir/salvar PDF.
- Avisos internos por função, competência, instituição, setor ou cidade; agendamento congela o público no envio.
- Pedido LGPD do titular: acesso e correção na secretaria; exclusão segue para dupla aprovação.
- Dupla aprovação: superadmin, exclusão LGPD, reabrir presença após o dia, cancelar reunião/ensaio convocado.
