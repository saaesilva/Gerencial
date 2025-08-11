'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Snowflake, AlertTriangle, CheckCircle, Clock, Package, TrendingUp, Download, Printer, Calculator, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import * as XLSX from 'xlsx'

interface AuditoriaItem {
  MERC: string
  DIGITO: string
  DESCRICAO: string
  EMBALAGEM: string
  FORNECEDOR: string
  'ESTOQ EMB1': string
  'ESTOQ EMB9': string
  'CUSTO MEDIO': string
  'PRECO VENDA': string
  'DIAS S/VND': string
  IDADE: string
  TVIDA: string
  SETOR_LOJA: string
  'DT ULT ENT': string
  risco: 'critico' | 'alto' | 'moderado' | 'baixo'
  justificativa: string
  recomendacao: string
  diasAteVencimento: number
  percentualVidaUtilizado: number
}

interface ShelfLifeItem {
  product: string
  shelfLife: number
  category: string
}

export default function AuditorValidadeFrios() {
  const { allData } = useData()
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaItem[]>([])
  const [filteredData, setFilteredData] = useState<AuditoriaItem[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [selectedRisco, setSelectedRisco] = useState('all')
  
  // Tabela de vida útil para produtos de frios (em dias) - baseada em normas sanitárias
  const shelfLifeTable: ShelfLifeItem[] = [
    // Laticínios
    { product: 'RF. LEITE', shelfLife: 7, category: 'Laticínios' },
    { product: 'RF. QUEIJO', shelfLife: 14, category: 'Laticínios' },
    { product: 'RF. IOGURTE', shelfLife: 21, category: 'Laticínios' },
    { product: 'RF. MANTEIGA', shelfLife: 30, category: 'Laticínios' },
    { product: 'RF. REQUEIJÃO', shelfLife: 14, category: 'Laticínios' },
    { product: 'RF. CREME LEITE', shelfLife: 7, category: 'Laticínios' },
    { product: 'RF. CHANTILLY', shelfLife: 5, category: 'Laticínios' },
    { product: 'RF. RICOTA', shelfLife: 10, category: 'Laticínios' },
    { product: 'RF. COALHADA', shelfLife: 7, category: 'Laticínios' },
    { product: 'RF. MUSSARELA', shelfLife: 12, category: 'Laticínios' },
    
    // Embutidos
    { product: 'RF. PRESUNTO', shelfLife: 21, category: 'Embutidos' },
    { product: 'RF. SALAME', shelfLife: 30, category: 'Embutidos' },
    { product: 'RF. MORTADELA', shelfLife: 14, category: 'Embutidos' },
    { product: 'RF. LINGUIÇA', shelfLife: 7, category: 'Embutidos' },
    { product: 'RF. BLUMENAU', shelfLife: 20, category: 'Embutidos' },
    { product: 'RF. COZIDO', shelfLife: 10, category: 'Embutidos' },
    { product: 'RF. PEITO PERU', shelfLife: 14, category: 'Embutidos' },
    { product: 'RF. SALAME ITALIANO', shelfLife: 35, category: 'Embutidos' },
    
    // Carnes Frias
    { product: 'RF. CARNE BOVINA', shelfLife: 5, category: 'Carnes Frias' },
    { product: 'RF. CARNE SUINA', shelfLife: 5, category: 'Carnes Frias' },
    { product: 'RF. FRANGO', shelfLife: 4, category: 'Carnes Frias' },
    { product: 'RF. PEIXE', shelfLife: 3, category: 'Carnes Frias' },
    { product: 'RF. BACON', shelfLife: 14, category: 'Carnes Frias' },
    { product: 'RF. LOMBO', shelfLife: 7, category: 'Carnes Frias' },
    { product: 'RF. CONTRA FILÉ', shelfLife: 4, category: 'Carnes Frias' },
    { product: 'RF. PERNIL', shelfLife: 5, category: 'Carnes Frias' },
    { product: 'RF. FILÉ FRANGO', shelfLife: 3, category: 'Carnes Frias' },
    { product: 'RF. CAMARÃO', shelfLife: 2, category: 'Carnes Frias' },
    
    // Sorvetes
    { product: 'RF. SORVETE', shelfLife: 90, category: 'Sorvetes' },
    { product: 'RF. PICOLÉ', shelfLife: 60, category: 'Sorvetes' },
    { product: 'RF. GELADO', shelfLife: 75, category: 'Sorvetes' },
    { product: 'RF. CREME', shelfLife: 80, category: 'Sorvetes' },
    
    // Congelados
    { product: 'RF. HAMBURGUER', shelfLife: 120, category: 'Congelados' },
    { product: 'RF. LASANHA', shelfLife: 90, category: 'Congelados' },
    { product: 'RF. PIZZA', shelfLife: 60, category: 'Congelados' },
    { product: 'RF. BATATA FRITA', shelfLife: 180, category: 'Congelados' },
    { product: 'RF. LEGUMES', shelfLife: 150, category: 'Congelados' },
    { product: 'RF. FRANGO ASSADO', shelfLife: 90, category: 'Congelados' },
    { product: 'RF. ESFIHA', shelfLife: 60, category: 'Congelados' },
    { product: 'RF. PÃO QUEIJO', shelfLife: 90, category: 'Congelados' },
    
    // Outros
    { product: 'RF. OVO', shelfLife: 21, category: 'Outros' },
    { product: 'RF. MAIONESE', shelfLife: 30, category: 'Outros' },
    { product: 'RF. KETCHUP', shelfLife: 90, category: 'Outros' },
    { product: 'RF. MOSTARDA', shelfLife: 120, category: 'Outros' },
    { product: 'RF. MOLHO', shelfLife: 60, category: 'Outros' },
    { product: 'RF. AZEITONA', shelfLife: 180, category: 'Outros' },
    { product: 'RF. PALMITO', shelfLife: 90, category: 'Outros' },
    { product: 'RF. ERVILHA', shelfLife: 150, category: 'Outros' },
    { product: 'RF. MILHO', shelfLife: 150, category: 'Outros' },
    { product: 'RF. ATUM', shelfLife: 180, category: 'Outros' }
  ]

  useEffect(() => {
    // Filtrar apenas produtos de frios (RF) e realizar análise de auditoria
    const friosProducts = allData.filter(item => 
      item.DESCRICAO && item.DESCRICAO.trim().toUpperCase().startsWith('RF.')
    )

    const auditoriaItems = friosProducts.map(item => {
      const idade = parseInt(item.IDADE || '0')
      const vidaUtil = getShelfLife(item.DESCRICAO || '')
      const estoque = parseInt(item['ESTOQ EMB1'] || '0')
      const diasSemVenda = parseInt(item['DIAS S/VND'] || '0')
      const diasAteVencimento = Math.max(0, vidaUtil - idade)
      const percentualVidaUtilizado = vidaUtil > 0 ? (idade / vidaUtil) * 100 : 100

      const analise = realizarAnaliseAuditoria(item, idade, vidaUtil, estoque, diasSemVenda, diasAteVencimento, percentualVidaUtilizado)

      return {
        MERC: item.MERC || '',
        DIGITO: item.DIGITO || '',
        DESCRICAO: item.DESCRICAO || '',
        EMBALAGEM: item.EMBALAGEM || '',
        FORNECEDOR: item.FORNECEDOR || '',
        'ESTOQ EMB1': item['ESTOQ EMB1'] || '0',
        'ESTOQ EMB9': item['ESTOQ EMB9'] || '0',
        'CUSTO MEDIO': item['CUSTO MEDIO'] || '0',
        'PRECO VENDA': item['PRECO VENDA'] || '0',
        'DIAS S/VND': item['DIAS S/VND'] || '0',
        IDADE: item.IDADE || '0',
        TVIDA: vidaUtil.toString(),
        SETOR_LOJA: item.SETOR_LOJA || '',
        'DT ULT ENT': item['DT ULT ENT'] || '',
        risco: analise.risco,
        justificativa: analise.justificativa,
        recomendacao: analise.recomendacao,
        diasAteVencimento,
        percentualVidaUtilizado
      }
    }) as AuditoriaItem[]

    setAuditoriaData(auditoriaItems)
    setFilteredData(auditoriaItems)
  }, [allData])

  const getShelfLife = (description: string): number => {
    const upperDesc = description.toUpperCase()
    const shelfLifeItem = shelfLifeTable.find(item => 
      upperDesc.includes(item.product.toUpperCase())
    )
    return shelfLifeItem ? shelfLifeItem.shelfLife : 7 // padrão 7 dias se não encontrado
  }

  const getCategory = (description: string): string => {
    const upperDesc = description.toUpperCase()
    const shelfLifeItem = shelfLifeTable.find(item => 
      upperDesc.includes(item.product.toUpperCase())
    )
    return shelfLifeItem ? shelfLifeItem.category : 'Outros'
  }

  const realizarAnaliseAuditoria = (
    item: any, 
    idade: number, 
    vidaUtil: number, 
    estoque: number, 
    diasSemVenda: number, 
    diasAteVencimento: number, 
    percentualVidaUtilizado: number
  ): { risco: 'critico' | 'alto' | 'moderado' | 'baixo', justificativa: string, recomendacao: string } => {

    // Análise crítica: produto vencido com estoque
    if (idade > vidaUtil && estoque > 0) {
      return {
        risco: 'critico',
        justificativa: `PRODUTO VENCIDO! Idade (${idade} dias) excede vida útil (${vidaUtil} dias). Estoque atual: ${estoque} unidades.`,
        recomendacao: 'RETIRAR IMEDIATAMENTE DO ESTOQUE. Realizar descarte conforme normas sanitárias. Investigar falha no controle de validade.'
      }
    }

    // Análise crítica: próximo do vencimento com alto estoque e sem venda
    if (diasAteVencimento <= 3 && estoque > 10 && diasSemVenda > 7) {
      return {
        risco: 'critico',
        justificativa: `RISCO IMINENTE DE VENCIMENTO! ${diasAteVencimento} dias para vencer, estoque elevado (${estoque} unidades) e sem venda há ${diasSemVenda} dias.`,
        recomendacao: 'AÇÃO IMEDIATA: Promover queima de estoque com descontos agressivos. Contatar fornecedor para possível devolução.'
      }
    }

    // Análise de alto risco: próximo do vencimento
    if (diasAteVencimento <= 7 && estoque > 0) {
      return {
        risco: 'alto',
        justificativa: `Próximo do vencimento (${diasAteVencimento} dias). Estoque: ${estoque} unidades. ${percentualVidaUtilizado.toFixed(1)}% da vida útil consumida.`,
        recomendacao: 'Priorizar venda imediata. Aplicar descontos progressivos. Monitorar diariamente.'
      }
    }

    // Análise de alto risco: alto tempo sem venda
    if (diasSemVenda > 21 && estoque > 5) {
      return {
        risco: 'alto',
        justificativa: `Estoque parado há ${diasSemVenda} dias. ${estoque} unidades em risco de obsolescência.`,
        recomendacao: 'Investigar causas da falta de rotação. Verificar precificação e posicionamento. Considerar promoções.'
      }
    }

    // Análise de alto risco: mais de 70% da vida útil consumida
    if (percentualVidaUtilizado > 70 && estoque > 0) {
      return {
        risco: 'alto',
        justificativa: `${percentualVidaUtilizado.toFixed(1)}% da vida útil consumida. Produto envelhecido no estoque.`,
        recomendacao: 'Acelerar vendas. Monitorar temperatura de armazenamento. Verificar qualidade do produto.'
      }
    }

    // Análise moderada: médio prazo sem venda
    if (diasSemVenda > 14 && estoque > 0) {
      return {
        risco: 'moderado',
        justificativa: `${diasSemVenda} dias sem venda. Estoque atual: ${estoque} unidades.`,
        recomendacao: 'Monitorar rotação. Verificar necessidade de reposicionamento ou ação promocional leve.'
      }
    }

    // Análise moderada: entre 50-70% da vida útil consumida
    if (percentualVidaUtilizado > 50 && estoque > 0) {
      return {
        risco: 'moderado',
        justificativa: `${percentualVidaUtilizado.toFixed(1)}% da vida útil consumida. Atenção necessária.`,
        recomendacao: 'Manter monitoramento regular. Planejar ações para acelerar vendas se necessário.'
      }
    }

    // Análise de baixo risco
    return {
      risco: 'baixo',
      justificativa: `Produto dentro dos parâmetros normais. ${diasAteVencimento} dias para vencimento.`,
      recomendacao: 'Manter monitoramento padrão. Seguir controles normais de qualidade.'
    }
  }

  const getRiscoColor = (risco: string): string => {
    switch (risco) {
      case 'critico': return 'bg-red-100 text-red-800 border-red-200'
      case 'alto': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'moderado': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getRiscoIcon = (risco: string) => {
    switch (risco) {
      case 'critico': return <AlertTriangle className="h-4 w-4" />
      case 'alto': return <AlertTriangle className="h-4 w-4" />
      case 'moderado': return <Clock className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const applyFilters = () => {
    let filtered = auditoriaData

    if (selectedRisco !== 'all') {
      filtered = filtered.filter(item => item.risco === selectedRisco)
    }

    setFilteredData(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [selectedRisco, auditoriaData])

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      Código: item.MERC,
      Dígito: item.DIGITO,
      Descrição: item.DESCRICAO,
      Categoria: getCategory(item.DESCRICAO),
      Fornecedor: item.FORNECEDOR,
      'Estoque CX': parseInt(item['ESTOQ EMB1'] || '0'),
      'Estoque UN': parseInt(item['ESTOQ EMB9'] || '0'),
      Idade: parseInt(item.IDADE || '0'),
      'Vida Útil (dias)': parseInt(item.TVIDA || '7'),
      'Dias até Vencimento': item.diasAteVencimento,
      '% Vida Útil Utilizada': item.percentualVidaUtilizado.toFixed(1),
      'Dias sem Venda': parseInt(item['DIAS S/VND'] || '0'),
      'Última Entrada': item['DT ULT ENT'],
      Risco: item.risco.toUpperCase(),
      Justificativa: item.justificativa,
      Recomendação: item.recomendacao
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria Validade')

    const fileName = `auditoria_validade_frios_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const gerarRelatorioAuditoria = () => {
    const criticos = filteredData.filter(item => item.risco === 'critico').length
    const altoRisco = filteredData.filter(item => item.risco === 'alto').length
    const moderado = filteredData.filter(item => item.risco === 'moderado').length
    const baixo = filteredData.filter(item => item.risco === 'baixo').length
    const totalVerificar = criticos + altoRisco

    const printContent = `
      <html>
        <head>
          <title>Relatório de Auditoria de Validade - Frios</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f8fafc; }
            h1 { color: #dc2626; text-align: center; margin-bottom: 10px; font-size: 24px; }
            h2 { color: #374151; margin-top: 30px; text-align: center; font-size: 18px; margin-bottom: 20px; }
            .header { text-align: center; margin-bottom: 30px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid #dc2626; }
            .auditor-info { font-size: 16px; color: #374151; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { background-color: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid; }
            .stat-card.critico { border-left-color: #dc2626; }
            .stat-card.alto { border-left-color: #f59e0b; }
            .stat-card.moderado { border-left-color: #eab308; }
            .stat-card.baixo { border-left-color: #059669; }
            .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .stat-number.critico { color: #dc2626; }
            .stat-number.alto { color: #f59e0b; }
            .stat-number.moderado { color: #eab308; }
            .stat-number.baixo { color: #059669; }
            .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            th { background-color: #fef2f2; color: #dc2626; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dc2626; }
            td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr:hover { background-color: #f3f4f6; }
            .risco-critico { color: #dc2626; font-weight: bold; }
            .risco-alto { color: #f59e0b; font-weight: bold; }
            .risco-moderado { color: #eab308; font-weight: bold; }
            .risco-baixo { color: #059669; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #6b7280; padding: 10px; background-color: white; border-radius: 8px; }
            .alert-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .alert-title { color: #dc2626; font-weight: bold; margin-bottom: 10px; }
            @media print {
              body { margin: 0; background-color: white; }
              .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
              .stat-card { margin: 0; padding: 10px; }
              .stat-number { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔍 RELATÓRIO DE AUDITORIA DE VALIDADE</h1>
            <div class="auditor-info">
              <strong>Auditoria Especializada em Produtos de Frios</strong><br>
              Setor: Frios - Análise de Risco de Validade<br>
              Data: ${new Date().toLocaleDateString('pt-BR')}<br>
              Perito Auditor: Sistema de Gestão de Validade
            </div>
            
            <div class="stats-grid">
              <div class="stat-card critico">
                <div class="stat-number critico">${criticos}</div>
                <div class="stat-label">Risco Crítico</div>
              </div>
              <div class="stat-card alto">
                <div class="stat-number alto">${altoRisco}</div>
                <div class="stat-label">Alto Risco</div>
              </div>
              <div class="stat-card moderado">
                <div class="stat-number moderado">${moderado}</div>
                <div class="stat-label">Risco Moderado</div>
              </div>
              <div class="stat-card baixo">
                <div class="stat-number baixo">${baixo}</div>
                <div class="stat-label">Baixo Risco</div>
              </div>
            </div>
          </div>

          ${totalVerificar > 0 ? `
          <div class="alert-box">
            <div class="alert-title">⚠️ RECOMENDAÇÃO URGENTE</div>
            <p><strong>${totalVerificar} produtos</strong> necessitam verificação física imediata devido a risco de validade. Priorizar produtos com risco crítico e alto risco.</p>
          </div>
          ` : ''}

          <h2>Detalhamento da Análise de Risco</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Estoque</th>
                <th>Idade</th>
                <th>Vida Útil</th>
                <th>Dias p/ Vencer</th>
                <th>% Vida Usada</th>
                <th>Dias s/ Venda</th>
                <th>Risco</th>
                <th>Justificativa</th>
                <th>Recomendação</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(item => `
                <tr>
                  <td>${item.MERC}</td>
                  <td>${item.DESCRICAO}</td>
                  <td>${item['ESTOQ EMB1']}</td>
                  <td>${item.IDADE}</td>
                  <td>${item.TVIDA}</td>
                  <td>${item.diasAteVencimento}</td>
                  <td>${item.percentualVidaUtilizado.toFixed(1)}%</td>
                  <td>${item['DIAS S/VND']}</td>
                  <td class="risco-${item.risco}">${item.risco.toUpperCase()}</td>
                  <td>${item.justificativa}</td>
                  <td>${item.recomendacao}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Relatório gerado pelo Sistema de Auditoria de Validade - ${new Date().toLocaleString('pt-BR')}<br>
            Este relatório contém análise especializada e deve ser utilizado como ferramenta complementar ao controle físico de estoque.
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const resumoEstatistico = () => {
    const criticos = auditoriaData.filter(item => item.risco === 'critico').length
    const altoRisco = auditoriaData.filter(item => item.risco === 'alto').length
    const moderado = auditoriaData.filter(item => item.risco === 'moderado').length
    const baixo = auditoriaData.filter(item => item.risco === 'baixo').length
    const total = auditoriaData.length
    const totalVerificar = criticos + altoRisco

    return { criticos, altoRisco, moderado, baixo, total, totalVerificar }
  }

  const stats = resumoEstatistico()

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-800">🔍 Auditor de Validade - Frios</h1>
          <p className="text-gray-600 mt-1">
            Análise especializada de risco de validade conforme critérios auditoriais
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button onClick={gerarRelatorioAuditoria} size="sm" className="gap-2 bg-red-600 hover:bg-red-700">
            <Printer className="h-4 w-4" />
            Relatório Auditoria
          </Button>
        </div>
      </div>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Risco Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticos}</div>
            <p className="text-xs text-red-600">Ação imediata</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Alto Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.altoRisco}</div>
            <p className="text-xs text-orange-600">Prioridade alta</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Risco Moderado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.moderado}</div>
            <p className="text-xs text-yellow-600">Monitorar</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Baixo Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.baixo}</div>
            <p className="text-xs text-green-600">Normal</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Verificar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalVerificar}</div>
            <p className="text-xs text-blue-600">Atenção requerida</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Total Analisado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <p className="text-xs text-purple-600">Produtos frios</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {stats.criticos > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>⚠️ ATENÇÃO CRÍTICA:</strong> {stats.criticos} produtos identificados com risco crítico que necessitam intervenção imediata. 
            Ação requerida: retirada de estoque e descarte conforme normas sanitárias.
          </AlertDescription>
        </Alert>
      )}

      {stats.totalVerificar > stats.total * 0.3 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>⚠️ ALERTA GERAL:</strong> {(stats.totalVerificar / stats.total * 100).toFixed(1)}% dos produtos apresentam risco de validade. 
            Recomendamos revisão completa dos processos de controle e gestão de estoque.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-800">Filtros de Auditoria</CardTitle>
          <CardDescription>
            Filtre os produtos por nível de risco para análise detalhada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Nível de Risco:</label>
              <select 
                value={selectedRisco} 
                onChange={(e) => setSelectedRisco(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">Todos</option>
                <option value="critico">Crítico</option>
                <option value="alto">Alto</option>
                <option value="moderado">Moderado</option>
                <option value="baixo">Baixo</option>
              </select>
            </div>
            <Button 
              onClick={() => setShowDetails(!showDetails)} 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos com Análise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-800">Análise de Risco de Validade</CardTitle>
          <CardDescription>
            Relatório detalhado com justificativas e recomendações auditoriais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg">
            <table className="w-full min-w-max table-auto border-collapse">
              <thead className="bg-red-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[80px]">Código</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[300px]">Descrição</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[60px]">Estoque</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[50px]">Idade</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[60px]">Vida Útil</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[70px]">Dias p/ Vencer</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[70px]">% Vida Usada</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[70px]">Dias s/ Venda</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[80px]">Risco</th>
                  {showDetails && (
                    <>
                      <th className="px-2 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[400px]">Justificativa</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b min-w-[400px]">Recomendação</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.MERC}</td>
                    <td className="px-2 py-2 text-sm text-gray-900">{item.DESCRICAO}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item['ESTOQ EMB1']}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.IDADE}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.TVIDA}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center font-medium">{item.diasAteVencimento}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.percentualVidaUtilizado.toFixed(1)}%</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item['DIAS S/VND']}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                      <Badge className={getRiscoColor(item.risco)}>
                        {getRiscoIcon(item.risco)}
                        <span className="ml-1">{item.risco.toUpperCase()}</span>
                      </Badge>
                    </td>
                    {showDetails && (
                      <>
                        <td className="px-2 py-2 text-sm text-gray-900" title={item.justificativa}>
                          <div className="truncate max-w-xs">{item.justificativa}</div>
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-900" title={item.recomendacao}>
                          <div className="truncate max-w-xs">{item.recomendacao}</div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Nota Metodológica */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 text-sm">📋 Metodologia de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Critérios de Avaliação:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Risco Crítico:</strong> Produto vencido com estoque ou próximo do vencimento com estoque elevado e parado</li>
              <li><strong>Alto Risco:</strong> Próximo do vencimento (≤7 dias), alto tempo sem venda (&gt;21 dias), ou mais de 70% da vida útil consumida</li>
              <li><strong>Risco Moderado:</strong> Entre 14-21 dias sem venda ou 50-70% da vida útil consumida</li>
              <li><strong>Baixo Risco:</strong> Dentro dos parâmetros normais de controle</li>
            </ul>
            <p><strong>Nota:</strong> Esta análise considera vida útil padrão por categoria. Para análise completa, recomenda-se cruzar com datas de validade específicas (PVPS) e quantidades de última entrada.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}