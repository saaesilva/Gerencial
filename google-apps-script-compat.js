/**
 * Google Apps Script Compatibility Layer
 * Este arquivo contém funções preparadas para migração para Google Apps Script
 * 
 * Para usar este código no Google Apps Script:
 * 1. Copie as funções para um projeto do Google Apps Script
 * 2. Ajuste as referências de planilha conforme necessário
 * 3. Configure os gatilhos e menus conforme necessário
 */

// Função principal para obter dados da planilha
function getSpreadsheetData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Dados") || spreadsheet.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    // Converte para array de objetos com cabeçalho
    const headers = data[0];
    const jsonData = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      
      jsonData.push(obj);
    }
    
    return jsonData;
  } catch (error) {
    Logger.log('Erro ao obter dados: ' + error.toString());
    return [];
  }
}

// Função para processar upload de arquivo (simulada - no GAS seria diferente)
function processFileUpload(fileContent, fileName) {
  try {
    let data;
    
    if (fileName.toLowerCase().endsWith('.csv')) {
      data = parseCSVGas(fileContent);
    } else if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')) {
      // No Google Apps Script, você usaria a API do Drive ou outra abordagem
      data = parseExcelGas(fileContent);
    } else {
      throw new Error('Formato de arquivo não suportado');
    }
    
    return data;
  } catch (error) {
    Logger.log('Erro ao processar arquivo: ' + error.toString());
    throw error;
  }
}

// Função para parsear CSV no Google Apps Script
function parseCSVGas(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV deve ter pelo menos um cabeçalho e uma linha de dados');
  }

  const delimiter = detectDelimiterGas(csvText);
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/["']/g, ''));

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

// Função para detectar delimitador no Google Apps Script
function detectDelimiterGas(csvText) {
  const lines = csvText.split('\n').slice(0, 5);
  const delimiters = [',', ';', '\t', '|'];
  let scores = {};

  delimiters.forEach(d => scores[d] = 0);

  lines.forEach(line => {
    delimiters.forEach(d => {
      const count = (line.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      scores[d] += count;
    });
  });

  return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
}

// Função para parsear Excel (simulada - requer biblioteca adicional no GAS)
function parseExcelGas(fileContent) {
  // No Google Apps Script, você precisaria usar o Advanced Drive Service
  // ou uma biblioteca como Parser
  // Esta é uma implementação simulada
  
  try {
    const data = JSON.parse(fileContent);
    return data;
  } catch (error) {
    throw new Error('Parse de Excel não implementado no GAS - use biblioteca adequada');
  }
}

// Função para aplicar filtros
function applyFiltersGas(data, filters) {
  return data.filter(item => {
    const matchCnpj = !filters.cnpj || String(item.FORNECEDOR || '').toLowerCase().includes(filters.cnpj.toLowerCase());
    const matchDescricao = !filters.descricao || String(item.DESCRICAO || '').toLowerCase().includes(filters.descricao.toLowerCase());
    const matchMerc = !filters.merc || String(item.MERC || '').toLowerCase().includes(filters.merc.toLowerCase());
    const matchSetor = filters.setor === 'all' || !filters.setor || String(item.SETOR_LOJA || '') === filters.setor;
    
    return matchCnpj && matchDescricao && matchMerc && matchSetor;
  });
}

// Função para calcular estatísticas
function calculateStatsGas(data) {
  const totalItems = data.length;
  const totalStock = data.reduce((sum, item) => sum + parseInt(item['ESTOQ EMB1'] || '0'), 0);
  const totalValue = data.reduce((sum, item) => {
    const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'));
    const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'));
    return sum + (estoq * custo);
  }, 0);
  const rupturas = data.filter(item => parseInt(item['QTD VENDA EMB1'] || '0') === 0).length;

  return {
    totalItems,
    totalStock,
    totalValue,
    rupturas
  };
}

// Função para gerar relatório por fornecedor
function generateSupplierReportGas(cnpj) {
  try {
    const data = getSpreadsheetData();
    const supplierData = data.filter(item => 
      String(item.FORNECEDOR || '').toLowerCase().includes(cnpj.toLowerCase())
    );

    if (supplierData.length === 0) {
      throw new Error('Não foram encontrados dados para o CNPJ informado');
    }

    // Criar nova planilha com o relatório
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const newSheet = spreadsheet.insertSheet('Relatório Fornecedor');
    
    // Escrever cabeçalho
    const headers = Object.keys(supplierData[0]);
    newSheet.appendRow(headers);
    
    // Escrever dados
    supplierData.forEach(row => {
      const values = headers.map(header => row[header] || '');
      newSheet.appendRow(values);
    });

    // Formatar planilha
    const range = newSheet.getDataRange();
    range.setFontFamily('Arial');
    range.setFontSize(10);
    
    // Congelar cabeçalho
    newSheet.setFrozenRows(1);
    
    // Auto-ajustar colunas
    for (let i = 1; i <= headers.length; i++) {
      newSheet.autoResizeColumn(i);
    }

    return supplierData;
  } catch (error) {
    Logger.log('Erro ao gerar relatório: ' + error.toString());
    throw error;
  }
}

// Função para criar menu no Google Apps Script
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Dashboard Atacadão')
    .addItem('Atualizar Dados', 'updateDashboard')
    .addItem('Gerar Relatório por Fornecedor', 'showSupplierReportDialog')
    .addItem('Estatísticas', 'showStatsDialog')
    .addToUi();
}

// Função para mostrar diálogo de relatório
function showSupplierReportDialog() {
  const html = HtmlService.createHtmlOutputFromFile('SupplierReportDialog')
    .setWidth(400)
    .setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Gerar Relatório por Fornecedor');
}

// Função para mostrar diálogo de estatísticas
function showStatsDialog() {
  const data = getSpreadsheetData();
  const stats = calculateStatsGas(data);
  
  const html = HtmlService.createHtmlOutput(`
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2>Estatísticas do Dashboard</h2>
      <p><strong>Total de Itens:</strong> ${stats.totalItems.toLocaleString('pt-BR')}</p>
      <p><strong>Estoque Total:</strong> ${stats.totalStock.toLocaleString('pt-BR')}</p>
      <p><strong>Valor em Estoque:</strong> R$ ${stats.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
      <p><strong>Itens sem Vendas:</strong> ${stats.rupturas.toLocaleString('pt-BR')}</p>
      <button onclick="google.script.host.close()" style="margin-top: 20px; padding: 10px 20px; background: #FF6600; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
    </div>
  `).setWidth(300).setHeight(250);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Estatísticas');
}

// Função para atualizar dashboard
function updateDashboard() {
  try {
    const data = getSpreadsheetData();
    const stats = calculateStatsGas(data);
    
    // Aqui você poderia atualizar uma planilha de dashboard
    // ou enviar os dados para um serviço externo
    
    SpreadsheetApp.getUi().alert('Dashboard atualizado com sucesso!');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Erro ao atualizar dashboard: ' + error.toString());
  }
}

// Função para tratamento de erros global
function handleError(error) {
  Logger.log('Erro: ' + error.toString());
  SpreadsheetApp.getUi().alert('Ocorreu um erro: ' + error.toString());
}

// Exportar funções para uso no cliente
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSpreadsheetData,
    processFileUpload,
    applyFiltersGas,
    calculateStatsGas,
    generateSupplierReportGas
  };
}