# Dashboard de Hortifruti

## Visão Geral

O Dashboard de Hortifruti foi desenvolvido especificamente para gerenciar os pedidos de hortifruti, considerando o calendário de entregas (Segunda, Quarta e Sábado) e garantindo a qualidade dos produtos através de análise inteligente de estoque e demanda.

## Funcionalidades Principais

### 1. Seleção de Dia de Entrega

- **Calendário Fixo**: Entregas realizadas em Segunda, Quarta e Sábado
- **Cálculo Automático**: O sistema calcula automaticamente os dias até a próxima entrega
- **Sugestões Personalizadas**: As sugestões de pedido são ajustadas conforme o dia selecionado

### 2. Análise Inteligente de Estoque

O sistema considera múltiplos fatores para gerar sugestões de pedido:

#### Fatores Considerados:
- **Estoque Atual**: Quantidade disponível em caixas e unidades
- **Venda Média Diária**: Calculada baseada no histórico de vendas
- **Idade do Produto**: Dias desde a entrada no estoque
- **Vida Útil**: Tempo de validade do produto (TVIDA)
- **Dias sem Venda**: Período de inatividade do produto
- **Status de Ruptura**: Produtos marcados como ruptura

#### Prioridades Automáticas:
- **ALTA (Vermelho)**: 
  - Produtos em ruptura
  - Estoque insuficiente para próxima entrega
- **MÉDIA (Amarelo)**:
  - Produtos com 70% ou mais da vida útil consumida
  - Estoque abaixo de 2 dias de venda
- **BAIXA (Verde)**:
  - Reposição preventiva
  - Estoque adequado

### 3. Filtros Avançados

- **Fornecedor**: Filtrar por fornecedor específico
- **Classe**: Classificação dos produtos (Frutas, Legumes, Verduras, etc.)
- **Idade Máxima**: Limitar por idade do estoque
- **Apenas Críticos**: Mostrar apenas itens com prioridade ALTA

### 4. Sugestões de Pedido

O sistema calcula automaticamente:

#### Cálculo de Sugestão:
```
Venda Média Diária = Total Vendas / Dias sem Venda
Estoque Projetado = Estoque Atual - (Venda Média × Dias até Entrega)
Sugestão de Pedido = Calculado baseado na prioridade e regras de negócio
```

#### Regras de Sugestão:
1. **Ruptura**: Pedido mínimo de 10 unidades ou 7 dias de venda
2. **Estoque Insuficiente**: Pedido para cobrir 7 dias de venda
3. **Vencimento Próximo**: Pedido para 3 dias de venda
4. **Estoque Baixo**: Pedido para 2 dias de venda
5. **Reposição Preventiva**: Pedido para 1 dia de venda

### 5. Visualizações e Gráficos

#### Gráfico de Prioridades:
- Distribuição percentual de itens por prioridade
- Visualização em pizza com cores intuitivas

#### Gráfico de Fornecedores:
- Top 10 fornecedores por valor do pedido
- Ajuda a identificar principais parceiros comerciais

### 6. Geração de Pedidos

#### Funcionalidades:
- **Geração Automática**: Cria pedido com base nas sugestões
- **Ordenação por Prioridade**: Itens críticos aparecem primeiro
- **Resumo do Pedido**: Total de itens, unidades e valor
- **Exportação para Excel**: Arquivo completo com todas as informações

#### Informações do Pedido:
- Código e descrição do produto
- Quantidade sugerida
- Custo unitário e valor total
- Prioridade e motivo da sugestão
- Data prevista de entrega

### 7. Qualidade e Freshness

#### Controle de Qualidade:
- **Monitoramento de Idade**: Alerta para produtos próximos do vencimento
- **Vida Útil**: Consideração do tempo total de validade
- **Rotação de Estoque**: Priorização de produtos mais velhos

#### Alertas de Qualidade:
- Produtos com mais de 70% da vida útil são marcados
- Sugestões reduzidas para evitar perdas
- Foco em produtos frescos e boa qualidade

## Como Usar

### Passo a Passo:

1. **Carregar Dados**: Faça upload do arquivo CSV na aba "Dados"
2. **Selecionar Aba**: Clique na aba "Hortifruti"
3. **Escolher Dia de Entrega**: Selecione Segunda, Quarta ou Sábado
4. **Aplicar Filtros (Opcional)**: Use os filtros para refinar a análise
5. **Analisar Sugestões**: Verifique as sugestões na tabela
6. **Gerar Pedido**: Clique em "Gerar Pedido" para criar o pedido
7. **Exportar**: Exporte o pedido ou análise completa

### Melhores Práticas:

#### Para Compras:
- **Priorize itens ALTA**: Comece pelos itens críticos
- **Verifique fornecedores**: Negocie com fornecedores de alto volume
- **Considere sazonalidade**: Ajuste pedidos conforme épocas do ano
- **Monitore qualidade**: Dê preferência a produtos frescos

#### Para Estoque:
- **Controle de idade**: Monitore produtos próximos do vencimento
- **Rotação adequada**: Primeiro a entrar, primeiro a sair
- **Evite excesso**: Pedidos maiores podem causar perdas
- **Acompanhe rupturas**: Reponha rapidamente produtos faltantes

## Colunas Necessárias no CSV

Para o funcionamento correto, o arquivo deve conter:

```
MERC, DIGITO, DESCRICAO, EMBALAGEM, FORNECEDOR, SETOR_LOJA, GRUPO, SUBGRUPO, 
CLASSE, ESTOQ EMB1, ESTOQ EMB9, CUSTO MEDIO, PRECO VENDA, QTD VENDA EMB1, 
DIAS S/VND, IDADE, TVIDA, DT ULT ENT, QTD ULT ENT, NAO VENDE (RUPT.), PERC RENT
```

## Benefícios

### Para o Negócio:
- **Redução de Perdas**: Controle de validade e qualidade
- **Otimização de Compras**: Pedidos baseados em demanda real
- **Melhoria de Qualidade**: Foco em produtos frescos
- **Redução de Rupturas**: Identificação rápida de faltas

### Para a Operação:
- **Automação**: Cálculos automáticos de sugestões
- **Eficiência**: Processo de compra padronizado
- **Controle**: Monitoramento completo do estoque
- **Flexibilidade**: Adaptação a diferentes dias de entrega

### Para a Qualidade:
- **Freshness**: Produtos sempre frescos
- **Segurança**: Controle de validade e vencimento
- **Satisfação**: Melhor experiência para o cliente
- **Reputação**: Imagem de qualidade e frescor

## Indicadores Chave

### Monitorar Diariamente:
- **Taxa de Ruptura**: Manter abaixo de 2%
- **Idade Média**: Controlar tempo de estoque
- **Perdas**: Reduzir produtos vencidos
- **Rentabilidade**: Manter margens saudáveis

### Ações Corretivas:
- **Aumentar pedidos** se ruptura > 2%
- **Reduzir pedidos** se perdas > 5%
- **Negociar prazos** se idade média alta
- **Revisar preços** se rentabilidade baixa