# DRP — Darpe Regional Uberlândia

Definição fechada e PRD do sistema do **Darpe** (Departamento de Assistência Religiosa para Evangelização) da Congregação Cristã no Brasil, Regional Uberlândia-MG.

Este repositório não é o sistema operacional ainda. É o documento vivo da sessão de definição: atores, domínio, fluxos, métricas e requisitos da primeira versão.

## Como rodar

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 43147
```

Abra [http://127.0.0.1:43147](http://127.0.0.1:43147).

## O que está neste app

- Visão geral do que foi resgatado da sessão
- Modelo conceitual da regional
- Painéis administrativo, de coordenação e do colaborador
- Entidades, estados e relacionamentos
- Fluxos de credenciamento, escala, presença, eventos e batismo
- PRD da v1
- Painel de métricas e construtor controlado de relatórios
- Decisões fechadas e pendências curtas

## Fora deste recorte

Stack, banco e implementação do produto ficam para depois do PRD. Há menção a um repositório GitHub chamado `drp`; se ele for privado, este workspace serve de base até o código do produto ir para lá.
