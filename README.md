# 📊 Gerencial Online — Sistema de Gestão Comercial e Operacional

<p align="center">
  <img src="https://raw.githubusercontent.com/saaesilva/Gerencial/main/docs/preview.jpg" alt="Gerencial Online - Dashboard Comercial e Módulos" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Produção_Ativa-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Licença-MIT-blue?style=for-the-badge" alt="Licença MIT" />
</p>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

> Sistema web moderno e escalável desenvolvido para otimizar processos de atacado e varejo, abrangendo controle dinâmico de compras, cálculos de rentabilidade, monitoramento de validade e gestão de perdas.

---

## 📈 Impacto no Negócio

- 🎯 **Precisão na Margem Real**: Cálculo automatizado de rentabilidade líquida considerando custos médios e preços competitivos de mercado.
- 🗓️ **Gestão Inteligente de Pedidos (Hortifruti)**: Escala semanal sincronizada com o calendário do fornecedor (Segunda, Quarta e Sábado).
- 🛑 **Ação Preventiva de Validade**: Alertas por semáforo de criticidade que aceleram decisões promocionais antes de qualquer perda de mercadoria.

---

## 🚀 Principais Módulos

### 🍎 1. Dashboard de Hortifruti
Planejamento e gestão de pedidos ajustados à frequência de entrega e giro de mercadorias perecíveis:
- **Calendário Inteligente**: Escala fixa de entregas com cálculo automático dos dias até o próximo recebimento.
- **Sugestão de Compra Automática**: Algoritmo que projeta a demanda diária, saldo em estoque e lead time.
- **Controle de Perdas**: Visão analítica de quebras operacionais e ajustes de saldo por filial.

### 📈 2. Análise Avançada de Rentabilidade
Módulo construído para auditar margens comerciais com precisão matemática:
- **Fórmula de Rentabilidade Implementada**:
  ```text
  (((Custo_Medio / Preco_Siderio) * 100 - 100) * -1 - 6.35) - (((Custo_Medio / Preco_Atual) * 100 - 100) * -1 - 6.35 - Rent_Atual)
  ```
- **Comparativo de Cenários**: Simulação de impacto na margem entre preço atual, concorrente e sugerido.

### ⏱️ 3. Controle e Prevenção de Validade
- **Alertas Antecipados**: Triagem de lotes com risco de vencimento por criticidade (Vermelho, Amarelo, Verde).
- **Ações Promocionais**: Identificação imediata de produtos para queima de estoque ou rebaixa de preço.

---

## 🛠️ Stack Tecnológica

- **Front-end:** Next.js (App Router), React, Tailwind CSS, Lucide Icons
- **Back-end:** Next.js Server Components, API Routes, Node.js
- **Linguagem:** TypeScript
- **ORM & Banco de Dados:** Prisma ORM, SQLite / PostgreSQL
- **Integração:** Scripts de compatibilidade com Google Apps Script

---

## 💻 Como Executar Localmente

```bash
# 1. Clonar repositório
git clone https://github.com/saaesilva/Gerencial.git
cd Gerencial

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Sincronizar banco de dados
npx prisma db push

# 5. Iniciar servidor de desenvolvimento
npm run dev
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.  
Desenvolvido por **[Samuel Silva](https://github.com/saaesilva)**.
