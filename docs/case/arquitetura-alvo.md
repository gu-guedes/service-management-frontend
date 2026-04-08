# Arquitetura Alvo do Case

## Principios
1. Manter simplicidade para iniciante
2. Evoluir para padrao proximo de mercado
3. Separar apresentacao, estado e dominio
4. Facilitar testes e leitura

## Estrutura alvo (proposta)

src/app/
- core/
  - interceptors/
  - guards/
  - layout/
- shared/
  - ui/
  - models/
  - utils/
- features/
  - auth/
    - pages/
    - services/
    - models/
  - dashboard/
    - pages/
    - components/
    - store/
    - models/
  - pets/
    - pages/
    - components/
    - store/
    - services/
    - models/
  - tutors/
    - pages/
    - components/
    - store/
    - services/
    - models/
  - registration/
    - pages/
    - components/
    - store/
    - services/
    - models/
  - care/
    - pages/
    - components/
    - store/
    - services/
    - models/
- app.routes.ts
- app.config.ts

## Regras de distribuicao de responsabilidade

### Container (page)
- Orquestra dados de store/service
- Dispara efeitos de tela
- Passa dados para componentes de apresentacao

### Componente de apresentacao
- Recebe Input e emite Output
- Nao conhece regra de negocio
- Nao faz chamada HTTP

### Store da feature
- Estado de loading, erro e dados
- Atualizacoes previsiveis de estado
- API simples para o container

### Service
- Integracao HTTP
- Mapeamento de DTO para modelo de dominio
- Tratamento de erro tecnico

## Rotas alvo
- /login
- /app/dashboard
- /app/pets
- /app/tutors
- /app/registration
- /app/care

Com lazy loading por feature.

## Evolucao por fases

### Fase 1 (semana 1)
- Criar estrutura de features
- Mover dashboard, pets e tutors
- Reduzir o tamanho do app.component.ts

### Fase 2 (semana 2)
- Introduzir store leve por feature
- Consolidar formularios e validacoes
- Adicionar testes e README tecnico

## Definicao de pronto da arquitetura
- app.component.ts com responsabilidade minima
- Features independentes e navegaveis
- Estado e servicos separados por dominio
- Projeto pronto para testes por camada
