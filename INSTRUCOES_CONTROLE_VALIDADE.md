# Controle de Validade - Frios

## Funcionalidade

Nova aba no sistema para controle de validade de produtos frios com base nas regras do PVPS (Política de Vencimento Próximo à Validade).

## Como Usar

### 1. Acesso
- No menu principal, clique na aba **"Validade"** (ícone de calendário)
- Esta aba está localizada ao lado da aba "Frios"

### 2. Upload do Relatório
- Clique no campo de upload para selecionar o arquivo SAEOU60
- Formatos aceitos: .xlsx, .xls
- O arquivo deve conter as colunas de validade e dados de produtos

### 3. Estrutura do Arquivo SAEOU60

O arquivo deve conter as seguintes colunas obrigatórias:
- `codigo`: Código do produto
- `descricao`: Descrição do produto
- `dtaVencimento`: Data de vencimento (formato DD/MM/AAAA)
- `estoque_liq_1`: Estoque atual
- `vnd_30_dias_emb1`: Venda dos últimos 30 dias
- `dias_sem_venda`: Dias sem venda
- `setor_fisico`: Setor físico do produto
- `valor_vencto`: Valor do vencimento

### 4. Análise PVPS

O sistema utiliza os seguintes parâmetros do PVPS:

#### Status de Validade:
- **Vencido** (vermelho): Produto com data de vencimento expirada
- **Crítico** (laranja): 7 dias ou menos para vencer
- **Atenção** (amarelo): 15 dias ou menos para vencer
- **Regular** (verde): Mais de 15 dias para vencer

#### Risco de Giro:
- **Alto** (vermelho): Baixo estoque, alta parada de vendas ou estoque parado
- **Médio** (amarelo): Estoque médio com giro moderado
- **Baixo** (verde): Estoque adequado com bom giro

### 5. Abas Disponíveis

#### Análise PVPS
- Visão geral com estatísticas
- Recomendações inteligentes baseadas em regras do PVPS
- Filtros por setor, status e risco
- Priorização de ações (1 a 4, onde 1 é mais urgente)

#### Controle de Validade
- Lista completa de produtos ordenados por data de vencimento
- Status visual de cada produto
- Informações de estoque e valor

#### Dados Detalhados
- Todos os campos do relatório SAEOU60
- Visão completa para análise detalhada

### 6. Recomendações Automáticas

O sistema gera recomendações automáticas baseadas na combinação de:

**Status PVPS + Risco de Giro = Ação Recomendada**

Exemplos:
- **Vencido + Qualquer risco**: "PRODUTO VENCIDO - Retirar imediatamente do estoque"
- **Crítico + Risco Alto**: "CRÍTICO - Baixar preço e promover venda imediata"
- **Atenção + Risco Alto**: "ATENÇÃO - Monitorar vendas, preparar ação promocional"
- **Regular + Risco Baixo**: "REGULAR - Estoque adequado"

### 7. Funcionalidades

- **Filtros**: Por setor, status PVPS, risco de giro e busca por produto
- **Exportação**: Gerar planilha com análise completa
- **Detalhamento**: Clique no ícone de olho para ver análise detalhada
- **Estatísticas**: Visão geral em cards coloridos

### 8. Benefícios

- Prevenção de perdas por vencimento
- Otimização de giro de estoque
- Ações prioritárias baseadas em risco
- Cumprimento das regras do PVPS
- Redução de custos com perdas

### 9. Exemplo de Uso

1. Faça download do relatório SAEOU60 do sistema
2. Upload na aba "Validade"
3. Analise as recomendações geradas
4. Priorize ações com prioridade 1 e 2
5. Monitore produtos com status "Crítico" e "Atenção"
6. Exporte relatório para acompanhamento

### 10. Dicas

- Verifique diariamente produtos com status "Crítico"
- Monitore produtos com mais de 7 dias sem venda
- Acompanhe setores com maior número de vencidos
- Utilize os filtros para focar em setores específicos
- Exporte relatórios semanais para acompanhamento

---

*Esta funcionalidade ajuda a evitar giro de datas erradas e respeita as regras do PVPS, garantindo melhor controle de validade e redução de perdas.*