# Dia 1 - Diagnostico da Arquitetura Atual

## Objetivo
Transformar este projeto em um case de pratica de Angular com qualidade suficiente para portfolio e entrevista tecnica.

## Estado atual (mapeado)

### 1) Componente raiz com responsabilidades excessivas
Arquivo principal: src/app/app.component.ts

O componente raiz concentra:
- Estado de UI geral (tabs, modais, wizard, filtros)
- Estado de dominio (pets, tutores, vacinas, atendimentos)
- Regras de negocio de cadastro
- Operacoes de lista (adicionar/remover/editar itens)
- Orquestracao de formularios reativos

Diagnostico:
- Funciona para MVP.
- Dificulta manutencao, testes e escalabilidade.
- Para mercado, o ideal e quebrar por feature.

### 2) Boa base de infraestrutura
Arquivos:
- src/app/app.config.ts
- src/app/app.routes.ts
- src/app/guards/auth.guard.ts
- src/app/core/interceptors/api-base-url.interceptor.ts
- src/app/core/interceptors/auth-token.interceptor.ts

Pontos positivos:
- Guard de autenticacao funcional.
- Interceptors de URL e token ja separados.
- Configuracao moderna com providers.

### 3) Servicos de dominio existentes
Arquivos:
- src/app/services/auth.service.ts
- src/app/services/registration.service.ts

Pontos positivos:
- Servicos separados por responsabilidade.
- Fluxo de mock e API coexistindo no cadastro.

Pontos de evolucao:
- Contratos DTO e modelos ainda podem ficar mais limpos por dominio.
- Melhor padronizacao de tratamento de erro para UI.

### 4) Estrutura de componentes
Arquivos:
- src/app/components/dashboard-view.component.ts
- src/app/components/pets-view.component.ts
- src/app/components/tutors-view.component.ts
- src/app/components/registration-view.component.ts
- src/app/components/care-view.component.ts

Diagnostico:
- Boa divisao de apresentacao em subcomponentes.
- Mas o estado e regras ainda estao centralizados no app.component.ts.

## Lacunas para um case forte de mercado
1. Separacao por features (container + presentational por area)
2. Rotas lazy por dominio
3. Estado previsivel por feature
4. Tipos/DTOs fora do componente raiz
5. Testes estrategicos (servicos, guard, componentes)
6. README tecnico com arquitetura e trade-offs

## Metas de curto prazo (Semana 1)
1. Organizar estrutura por feature sem quebrar o comportamento
2. Desacoplar estado de dashboard/pets do app.component.ts
3. Preparar projeto para testes e documentacao tecnica

## Definicao de pronto do Dia 1
- [x] Diagnostico tecnico do estado atual
- [x] Pontos fortes e gaps levantados
- [x] Metas imediatas da refatoracao definidas
