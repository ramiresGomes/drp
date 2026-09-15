# DRP — Darpe Regional Uberlândia

Definição fechada e PRD do sistema do **Darpe** (Departamento de Assistência Religiosa para Evangelização) da Congregação Cristã no Brasil, Regional Uberlândia-MG.

Produto no GitHub: [ramiresGomes/drp](https://github.com/ramiresGomes/drp).

Este app é o documento vivo da sessão de definição: atores, domínio, fluxos, métricas e requisitos da primeira versão.

## Decisões de acesso

- Todos os painéis autenticam com **Google OAuth** e e-mail Google.
- O painel administrativo usa o mesmo provedor; a restrição é por papel e permissão.
- Menores também entram com conta Google, após cadastro e consentimento pela secretaria.
- Cidades da regional são cadastradas no painel. Não há lista fechada no PRD.

## Como rodar

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 43147
```

Abra [http://127.0.0.1:43147](http://127.0.0.1:43147).

## O que está neste app

- Visão geral da sessão recuperada
- Modelo conceitual da regional
- Painéis administrativo, de coordenação e do colaborador
- Entidades, estados e relacionamentos
- Fluxos de credenciamento, escala, presença, eventos e batismo
- PRD da v1
- Painel de métricas e construtor controlado de relatórios
- Decisões fechadas e a pendência de dupla aprovação
