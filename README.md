# ðŸ“Š Gerencial Online â€” Sistema de GestÃ£o Comercial e Operacional

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

> Sistema web moderno e escalÃ¡vel desenvolvido para otimizar processos de varejo e atacado, abrangendo controle dinÃ¢mico de compras, cÃ¡lculos de rentabilidade, monitoramento de validade e gestÃ£o de perdas.

---

## ðŸš€ Principais MÃ³dulos

### ðŸŽ 1. Dashboard de Hortifruti
Planejamento e gestÃ£o de pedidos ajustados Ã  frequÃªncia de entrega e giro de mercadorias perecÃ­veis:
- **CalendÃ¡rio Inteligente**: Escala fixa de entregas (Segunda, Quarta e SÃ¡bado) com cÃ¡lculo automÃ¡tico dos dias atÃ© o prÃ³ximo recebimento.
- **SugestÃ£o de Compra AutomÃ¡tica**: Algoritmo que projeta a demanda diÃ¡ria, saldo em estoque e lead time do fornecedor para evitar rupturas e excessos.
- **Controle de Perdas**: VisÃ£o analÃ­tica de quebras operacionais e ajustes de saldo por loja.

### ðŸ“ˆ 2. AnÃ¡lise AvanÃ§ada de Rentabilidade
MÃ³dulo construÃ­do para auditar margens comerciais com precisÃ£o:
- **FÃ³rmula de Rentabilidade Real**:
  ```text
  (((Custo_Medio / Preco_Siderio) * 100 - 100) * -1 - 6.35) - (((Custo_Medio / Preco_Atual) * 100 - 100) * -1 - 6.35 - Rent_Atual)
  ```
- **Comparativo de CenÃ¡rios**: SimulaÃ§Ã£o de impacto na margem lÃ­quida entre preÃ§o atual, preÃ§o concorrente e preÃ§o sugerido.
- **RelatÃ³rios Gerenciais**: ExportaÃ§Ã£o e visualizaÃ§Ã£o rÃ¡pida para tomada de decisÃ£o em compras e pricing.

### â±ï¸ 3. Controle e PrevenÃ§Ã£o de Validade
- **Alertas Antecipados**: Triagem de lotes com risco de vencimento por criticidade (vermelho, amarelo, verde).
- **AÃ§Ãµes Promocionais**: IdentificaÃ§Ã£o imediata de produtos para queima de estoque ou rebaixa de preÃ§o antes da perda total.

---

## ðŸ› ï¸ Stack TecnolÃ³gica

- **Front-end / Framework:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, Shadcn UI
- **Back-end:** Next.js Server Components, API Routes, Node.js
- **Linguagem:** TypeScript
- **ORM & Banco de Dados:** Prisma ORM, SQLite / PostgreSQL
- **IntegraÃ§Ã£o:** Scripts de compatibilidade com Google Apps Script

---

## ðŸ’» Como Executar Localmente

### PrÃ©-requisitos
- Node.js 18+ instalado
- npm ou yarn

### InstalaÃ§Ã£o

```bash
# 1. Clone o repositÃ³rio
git clone https://github.com/saaesilva/Gerencial.git

# 2. Acesse a pasta do projeto
cd Gerencial

# 3. Instale as dependÃªncias
npm install

# 4. Configure as variÃ¡veis de ambiente
cp .env.example .env

# 5. Execute as migraÃ§Ãµes do banco
npx prisma db push

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para utilizar o sistema.

---

## ðŸ“„ LicenÃ§a e Autoria

Desenvolvido por **[Samuel Silva](https://github.com/saaesilva)**.  
Todos os direitos reservados.