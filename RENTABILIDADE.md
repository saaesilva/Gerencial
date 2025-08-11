# Análise de Rentabilidade

## Visão Geral

A nova funcionalidade de análise de rentabilidade foi desenvolvida para ajudar a calcular e analisar a rentabilidade dos produtos com base na fórmula específica fornecida pela equipe do Atacadão.

## Fórmula de Rentabilidade

A fórmula implementada para cálculo de rentabilidade é:

```
=(((Custo_Medio/Preco_Siderio)*100-100)*-1-6,35)-(((Custo_Medio/Preco_Atual)*100-100)*-1-6,35-Rent_Atual)
```

Onde:
- **Custo_Medio**: Custo médio do produto (coluna `CUSTO MEDIO`)
- **Preco_Siderio**: Preço de referência (considerado como 5% acima do preço de venda atual)
- **Preco_Atual**: Preço de venda atual (coluna `PRECO VENDA`)
- **Rent_Atual**: Rentabilidade atual (coluna `PERC RENT`)

## Funcionalidades

### 1. Filtros Avançados

A aba de rentabilidade oferece filtros específicos:

- **Setor**: Filtrar por setor específico
- **Grupo**: Filtrar por grupo de produtos
- **Fornecedor**: Busca por nome do fornecedor
- **Rentabilidade Mínima/Maxima**: Definir faixa de rentabilidade
- **Impacto Mínimo**: Filtrar produtos com impacto significativo na rentabilidade

### 2. Indicadores Chave

- **Total de Itens**: Quantidade de produtos analisados
- **Rentabilidade Média**: Média de rentabilidade dos produtos filtrados
- **Impacto Médio**: Impacto médio na rentabilidade
- **Valor em Estoque**: Valor total do estoque dos produtos filtrados
- **Rentabilidade Negativa**: Quantidade de produtos com rentabilidade negativa
- **Impacto Positivo**: Quantidade de produtos com impacto positivo na rentabilidade

### 3. Visualizações Gráficas

#### Por Setor
- Gráfico de barras mostrando rentabilidade média por setor
- Gráfico de barras mostrando impacto médio por setor

#### Top Impacto
- Gráfico horizontal com os 10 produtos de maior impacto na rentabilidade

#### Dispersão
- Gráfico de dispersão mostrando relação entre rentabilidade e impacto
- Tamanho dos pontos representa o valor em estoque

### 4. Tabela Detalhada

Tabela com informações detalhadas de cada produto:
- Código e descrição do produto
- Custo médio e preço de venda
- Rentabilidade atual e calculada
- Impacto na rentabilidade
- Setor e valor em estoque

### 5. Exportação de Dados

É possível exportar a análise completa para Excel com todas as informações calculadas.

## Como Usar

1. **Carregue os dados**: Faça upload do arquivo CSV na aba principal "Dados"
2. **Navegue até a aba Rentabilidade**: Clique na aba "Rentabilidade" no menu superior
3. **Aplique filtros**: Use os filtros para focar nos produtos de interesse
4. **Analise os resultados**: 
   - Verifique os indicadores-chave no topo
   - Explore os gráficos para identificar padrões
   - Use a tabela detalhada para análise específica
5. **Exporte se necessário**: Clique em "Exportar" para baixar a análise em Excel

## Colunas Necessárias no CSV

Para que a análise funcione corretamente, o arquivo CSV deve conter as seguintes colunas:

```
MERC, DIGITO, DESCRICAO, EMBALAGEM, FORNECEDOR, CUSTO MEDIO, PRECO VENDA, PERC RENT, ESTOQ EMB1, QTD VENDA EMB1, SETOR_LOJA, GRUPO, SUBGRUPO
```

## Interpretação dos Resultados

### Rentabilidade Calculada
- **Positiva (verde)**: O produto tem boa rentabilidade
- **Negativa (vermelho)**: O produto tem rentabilidade abaixo do esperado

### Impacto na Rentabilidade
- **Positivo (verde)**: Ajustes no preço podem melhorar a rentabilidade
- **Negativo (vermelho)**: Ajustes no preço podem piorar a rentabilidade

## Recomendações de Uso

1. **Foque em produtos com alto impacto**: Priorize produtos com impacto absoluto > 5%
2. **Analise setores com baixa rentabilidade**: Identifique setores que precisam de atenção
3. **Monitore produtos com rentabilidade negativa**: Verifique possibilidades de reajuste de preços
4. **Use a exportação para relatórios**: Gere relatórios periódicos para acompanhamento

## Benefícios

- **Análise precisa**: Cálculo de rentabilidade baseado na fórmula específica do Atacadão
- **Identificação de oportunidades**: Encontra produtos com potencial de melhoria na rentabilidade
- **Tomada de decisão**: Fornece dados concretos para decisões de precificação
- **Acompanhamento**: Permite monitoramento contínuo da rentabilidade por setor e produto