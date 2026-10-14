# 📊 Gerencial Online — Sistema de Gestão Comercial e Operacional

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

> Sistema web moderno e escalável desenvolvido para otimizar processos de varejo e atacado, abrangendo controle dinâmico de compras, cálculos de rentabilidade, monitoramento de validade e gestão de perdas.

---

## 🚀 Principais Módulos

### 🍎 1. Dashboard de Hortifruti
Planejamento e gestão de pedidos ajustados à frequência de entrega e giro de mercadorias perecíveis:
- **Calendário Inteligente**: Escala fixa de entregas (Segunda, Quarta e Sábado) com cálculo automático dos dias até o próximo recebimento.
- **Sugestão de Compra Automática**: Algoritmo que projeta a demanda diária, saldo em estoque e lead time do fornecedor para evitar rupturas e excessos.
- **Controle de Perdas**: Visão analítica de quebras operacionais e ajustes de saldo por loja.

### 📈 2. Análise Avançada de Rentabilidade
Módulo construído para auditar margens comerciais com precisão:
- **Fórmula de Rentabilidade Real**:
  ```text
  (((Custo_Medio / Preco_Siderio) * 100 - 100) * -1 - 6.35) - (((Custo_Medio / Preco_Atual) * 100 - 100) * -1 - 6.35 - Rent_Atual)
  ```
- **Comparativo de Cenários**: Simulação de impacto na margem líquida entre preço atual, preço concorrente e preço sugerido.
- **Relatórios Gerenciais**: Exportação e visualização rápida para tomada de decisão em compras e pricing.

### ⏱️ 3. Controle e Prevenção de Validade
- **Alertas Antecipados**: Triagem de lotes com risco de vencimento por criticidade (vermelho, amarelo, verde).
- **Ações Promocionais**: Identificação imediata de produtos para queima de estoque ou rebaixa de preço antes da perda total.

---

## 🛠️ Stack Tecnológica

- **Front-end / Framework:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, Radix UI
- **Back-end:** Next.js Server Components, API Routes, Node.js
- **Linguagem:** TypeScript
- **ORM & Banco de Dados:** Prisma ORM, SQLite / PostgreSQL
- **Integração:** Scripts de compatibilidade com Google Apps Script

---

## 💻 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/saaesilva/Gerencial.git

# 2. Acesse a pasta do projeto
cd Gerencial

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env

# 5. Execute as migrações do banco
npx prisma db push

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para utilizar o sistema.

---

## 📄 Licença e Autoria

Desenvolvido por **[Samuel Silva](https://github.com/saaesilva)**.  
Todos os direitos reservados.
