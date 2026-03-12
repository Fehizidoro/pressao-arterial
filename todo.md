# Sistema de Aferição de Pressão Arterial - TODO

## Backend / Banco de Dados
- [x] Schema: tabela `patients` (perfis de pacientes por usuário)
- [x] Schema: tabela `measurements` (medições de pressão arterial)
- [x] Gerar e aplicar migration SQL
- [x] Query helpers em server/db.ts para patients e measurements
- [x] Procedure tRPC: patients.list, patients.create, patients.update, patients.delete
- [x] Procedure tRPC: measurements.list, measurements.create, measurements.delete
- [x] Procedure tRPC: measurements.stats (estatísticas e tendências)
- [x] Lógica de classificação automática da pressão arterial

## Frontend / UI
- [x] Configurar tema visual elegante (cores, tipografia, CSS variables)
- [x] Configurar fonte Google Fonts (Inter + Playfair Display)
- [x] DashboardLayout com sidebar responsiva
- [x] Página Home / Landing page
- [x] Página Dashboard com estatísticas e cards de resumo
- [x] Página de Perfis de Pacientes (listagem e criação)
- [x] Página de Registro de Medição (formulário)
- [x] Página de Histórico de Medições (lista + filtros)
- [x] Gráficos de evolução temporal (Recharts)
- [x] Classificação visual com badges coloridos
- [x] Exportação de relatório PDF
- [x] Responsividade mobile completa

## Testes
- [x] Testes unitários para lógica de classificação da pressão
- [x] Testes para procedures tRPC de measurements
- [x] Testes para procedures tRPC de patients
