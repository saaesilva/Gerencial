'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Snowflake, Package, Clock, AlertTriangle, CheckCircle, TrendingUp, Download, Printer, Calculator, RefreshCw, Eye, EyeOff, Shield } from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import * as XLSX from 'xlsx'
import AuditorValidadeFrios from './AuditorValidadeFrios'

interface FriosProduct {
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
}

interface ShelfLifeItem {
  product: string
  shelfLife: number
  category: string
}

export default function FriosDashboard() {
  const { allData } = useData()
  const [friosData, setFriosData] = useState<FriosProduct[]>([])
  const [filteredData, setFilteredData] = useState<FriosProduct[]>([])
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderData, setOrderData] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [agingFilter, setAgingFilter] = useState('all')
  
  // Tabela de vida útil para produtos de frios (em dias)
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
    { product: 'RF. SALAME', shelfLife: 25, category: 'Embutidos' },
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
    // Filtrar apenas produtos de frios (RF)
    const friosProducts = allData.filter(item => 
      item.DESCRICAO && item.DESCRICAO.trim().toUpperCase().startsWith('RF.')
    ).map(item => ({
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
      TVIDA: getShelfLife(item.DESCRICAO || '').toString(),
      SETOR_LOJA: item.SETOR_LOJA || '',
      'DT ULT ENT': item['DT ULT ENT'] || ''
    })) as FriosProduct[]

    setFriosData(friosProducts)
    setFilteredData(friosProducts)
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

  const getPriority = (item: FriosProduct): 'alta' | 'media' | 'baixa' => {
    const idade = parseInt(item.IDADE || '0')
    const vidaUtil = parseInt(item.TVIDA || '7')
    const estoque = parseInt(item['ESTOQ EMB1'] || '0')
    const diasSemVenda = parseInt(item['DIAS S/VND'] || '0')
    
    const percentualVida = (idade / vidaUtil) * 100
    
    // Prioridade ALTA: produto próximo do vencimento ou sem venda há muitos dias
    if (percentualVida > 80 || diasSemVenda > 14 || (idade > vidaUtil && estoque > 0)) {
      return 'alta'
    }
    
    // Prioridade MÉDIA: produto com mais de 50% da vida útil utilizada ou sem venda há mais de 7 dias
    if (percentualVida > 50 || diasSemVenda > 7) {
      return 'media'
    }
    
    // Prioridade BAIXA: demais casos
    return 'baixa'
  }

  const getStatus = (item: FriosProduct): string => {
    const idade = parseInt(item.IDADE || '0')
    const vidaUtil = parseInt(item.TVIDA || '7')
    const estoque = parseInt(item['ESTOQ EMB1'] || '0')
    
    if (estoque === 0) return 'Sem Estoque'
    if (idade > vidaUtil) return 'Vencido'
    if (idade > vidaUtil * 0.8) return 'Próximo do Vencimento'
    if (idade > vidaUtil * 0.5) return 'Atenção'
    return 'Bom Estado'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Vencido': return 'bg-red-100 text-red-800 border-red-200'
      case 'Próximo do Vencimento': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Atenção': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Sem Estoque': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getDaysUntilExpiration = (item: FriosProduct): number => {
    const idade = parseInt(item.IDADE || '0')
    const vidaUtil = parseInt(item.TVIDA || '7')
    return Math.max(0, vidaUtil - idade)
  }

  const applyFilters = () => {
    let filtered = friosData

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => getCategory(item.DESCRICAO) === selectedCategory)
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(item => getPriority(item) === selectedPriority)
    }

    if (agingFilter !== 'all') {
      const idade = parseInt(agingFilter)
      filtered = filtered.filter(item => {
        const itemAge = parseInt(item.IDADE || '0')
        if (agingFilter === 'vencido') {
          const vidaUtil = parseInt(item.TVIDA || '7')
          return itemAge > vidaUtil
        }
        return itemAge >= idade
      })
    }

    setFilteredData(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [selectedCategory, selectedPriority, agingFilter, friosData])

  const generateOrder = () => {
    const orderSuggestions = filteredData
      .filter(item => {
        const priority = getPriority(item)
        const diasAteVencimento = getDaysUntilExpiration(item)
        const estoque = parseInt(item['ESTOQ EMB1'] || '0')
        
        // Sugerir pedido para produtos com prioridade alta ou média
        return (priority === 'alta' || priority === 'media') && estoque > 0
      })
      .map(item => ({
        codigo: item.MERC,
        digito: item.DIGITO,
        descricao: item.DESCRICAO,
        fornecedor: item.FORNECEDOR,
        estoqueAtual: parseInt(item['ESTOQ EMB1'] || '0'),
        idade: parseInt(item.IDADE || '0'),
        vidaUtil: parseInt(item.TVIDA || '7'),
        diasAteVencimento: getDaysUntilExpiration(item),
        categoria: getCategory(item.DESCRICAO),
        status: getStatus(item),
        prioridade: getPriority(item),
        sugestaoPedido: Math.max(1, Math.ceil(parseInt(item['ESTOQ EMB1'] || '0') * 0.3)),
        motivo: getPriority(item) === 'alta' ? 'Produto próximo do vencimento' : 'Produto necessita atenção'
      }))
      .sort((a, b) => a.diasAteVencimento - b.diasAteVencimento)

    setOrderData(orderSuggestions)
    setIsOrderModalOpen(true)
  }

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      Código: item.MERC,
      Dígito: item.DIGITO,
      Descrição: item.DESCRICAO,
      Categoria: getCategory(item.DESCRICAO),
      Embalagem: item.EMBALAGEM,
      Fornecedor: item.FORNECEDOR,
      'Estoque CX': parseInt(item['ESTOQ EMB1'] || '0'),
      'Estoque UN': parseInt(item['ESTOQ EMB9'] || '0'),
      'Custo Médio': parseFloat(item['CUSTO MEDIO'] || '0'),
      'Preço Venda': parseFloat(item['PRECO VENDA'] || '0'),
      'Dias sem Venda': parseInt(item['DIAS S/VND'] || '0'),
      Idade: parseInt(item.IDADE || '0'),
      'Vida Útil (dias)': parseInt(item.TVIDA || '7'),
      'Dias até Vencimento': getDaysUntilExpiration(item),
      Status: getStatus(item),
      Prioridade: getPriority(item),
      Setor: item.SETOR_LOJA,
      'Última Entrada': item['DT ULT ENT']
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Frios')

    const fileName = `relatorio_frios_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const printOrder = () => {
    const totalItems = orderData.length
    const totalValue = orderData.reduce((sum, item) => {
      const custo = filteredData.find(f => f.MERC === item.codigo)?.['CUSTO MEDIO'] || '0'
      return sum + (item.sugestaoPedido * parseFloat(custo.replace(',', '.')))
    }, 0)

    const vencidosCount = orderData.filter(item => item.diasAteVencimento <= 0).length
    const proximosVencimentoCount = orderData.filter(item => item.diasAteVencimento <= 3).length

    const printContent = `
      <html>
        <head>
          <title>Relatório de Gestão de Frios</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f8fafc; }
            h1 { color: #0c4a6e; text-align: center; margin-bottom: 10px; font-size: 24px; }
            h2 { color: #0284c7; margin-top: 30px; text-align: center; font-size: 18px; margin-bottom: 20px; }
            .header { text-align: center; margin-bottom: 30px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .report-info { font-size: 16px; color: #374151; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { background-color: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid; }
            .stat-card.total { border-left-color: #0c4a6e; }
            .stat-card.vencidos { border-left-color: #dc2626; }
            .stat-card.proximos { border-left-color: #f59e0b; }
            .stat-card.value { border-left-color: #7c3aed; }
            .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .stat-number.total { color: #0c4a6e; }
            .stat-number.vencidos { color: #dc2626; }
            .stat-number.proximos { color: #f59e0b; }
            .stat-number.value { color: #7c3aed; }
            .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            th { background-color: #f0f9ff; color: #0c4a6e; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #0c4a6e; }
            td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr:hover { background-color: #f3f4f6; }
            .priority-alta { color: #dc2626; font-weight: bold; }
            .priority-media { color: #f59e0b; font-weight: bold; }
            .priority-baixa { color: #059669; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #6b7280; padding: 10px; background-color: white; border-radius: 8px; }
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
            <h1>Relatório de Gestão de Frios</h1>
            <div class="report-info">
              <strong>Análise de produtos refrigerados e congelados para controle de validade</strong><br>
              Data: ${new Date().toLocaleDateString('pt-BR')}
            </div>
            
            <div class="stats-grid">
              <div class="stat-card total">
                <div class="stat-number total">${totalItems}</div>
                <div class="stat-label">Itens Críticos</div>
              </div>
              <div class="stat-card vencidos">
                <div class="stat-number vencidos">${vencidosCount}</div>
                <div class="stat-label">Produtos Vencidos</div>
              </div>
              <div class="stat-card proximos">
                <div class="stat-number proximos">${proximosVencimentoCount}</div>
                <div class="stat-label">Próximos Vencimento</div>
              </div>
              <div class="stat-card value">
                <div class="stat-number value">R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div class="stat-label">Valor Estimado</div>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Estoque</th>
                <th>Idade</th>
                <th>Vida Útil</th>
                <th>Dias P/Venc</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Sugestão</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.map(item => `
                <tr>
                  <td>${item.codigo}</td>
                  <td>${item.descricao}</td>
                  <td>${item.categoria}</td>
                  <td style="text-align: right">${item.estoqueAtual}</td>
                  <td style="text-align: center">${item.idade}</td>
                  <td style="text-align: center">${item.vidaUtil}</td>
                  <td style="text-align: center; font-weight: bold; ${item.diasAteVencimento <= 0 ? 'color: #dc2626;' : item.diasAteVencimento <= 3 ? 'color: #f59e0b;' : ''}">${item.diasAteVencimento}</td>
                  <td style="text-align: center">${item.status}</td>
                  <td style="text-align: center" class="priority-${item.prioridade}">${item.prioridade.toUpperCase()}</td>
                  <td style="text-align: right">${item.sugestaoPedido}</td>
                  <td>${item.motivo}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Relatório gerado pelo Dashboard Atacadão - Setor de Frios<br>
            Data de geração: ${new Date().toLocaleString('pt-BR')}
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

  // Estatísticas
  const totalItems = filteredData.length
  const vencidos = filteredData.filter(item => parseInt(item.IDADE || '0') > parseInt(item.TVIDA || '7')).length
  const proximosVencimento = filteredData.filter(item => {
    const idade = parseInt(item.IDADE || '0')
    const vidaUtil = parseInt(item.TVIDA || '7')
    return idade > vidaUtil * 0.8 && idade <= vidaUtil
  }).length
  const prioridadeAlta = filteredData.filter(item => getPriority(item) === 'alta').length

  const categories = [...new Set(shelfLifeTable.map(item => item.category))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sky-900">Gestão de Frios</h1>
          <p className="text-gray-600 mt-1">Controle de validade e qualidade de produtos refrigerados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={generateOrder} size="sm" className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
            <Calculator className="h-4 w-4" />
            Análise Crítica
          </Button>
        </div>
      </div>

      <Tabs defaultValue="gestao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gestao" className="gap-2">
            <Snowflake className="h-4 w-4" />
            Gestão de Estoque
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <Shield className="h-4 w-4" />
            Auditor de Validade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestao" className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-sky-800">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-800">{totalItems}</div>
              <div className="text-sm font-medium text-gray-600">Total de Itens</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-600">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{vencidos}</div>
              <div className="text-sm font-medium text-gray-600">Vencidos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{proximosVencimento}</div>
              <div className="text-sm font-medium text-gray-600">Próximos Vencimento</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{prioridadeAlta}</div>
              <div className="text-sm font-medium text-gray-600">Prioridade Alta</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sky-800">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="categoryFilter">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priorityFilter">Prioridade</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="agingFilter">Idade</Label>
              <Select value={agingFilter} onValueChange={setAgingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                  <SelectItem value="30">Acima de 30 dias</SelectItem>
                  <SelectItem value="15">Acima de 15 dias</SelectItem>
                  <SelectItem value="7">Acima de 7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sky-800">Produtos de Frios</CardTitle>
          <CardDescription>
            Produtos identificados com RF. - Monitoramento de validade e controle de qualidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="w-full min-w-full table-auto">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Código</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">Descrição</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Categoria</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Estoque</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">Idade</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">T.Vida</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Dias P/Venc</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Status</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Prioridade</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Dias S/Vnd</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => {
                  const priority = getPriority(item)
                  const status = getStatus(item)
                  const diasAteVencimento = getDaysUntilExpiration(item)
                  
                  return (
                    <tr key={index} className={`hover:bg-gray-50 ${priority === 'alta' ? 'bg-red-50' : priority === 'media' ? 'bg-yellow-50' : ''}`}>
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.MERC}
                      </td>
                      <td className="px-2 py-3 text-sm text-gray-900">
                        {item.DESCRICAO}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {getCategory(item.DESCRICAO)}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {parseInt(item['ESTOQ EMB1'] || '0').toLocaleString('pt-BR')}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.IDADE}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.TVIDA}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center font-bold">
                        <span className={diasAteVencimento <= 0 ? 'text-red-600' : diasAteVencimento <= 3 ? 'text-orange-600' : 'text-green-600'}>
                          {diasAteVencimento}
                        </span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        <Badge className={`text-xs ${getStatusColor(status)}`}>
                          {status}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        <Badge className={`text-xs ${getPriorityColor(priority)}`}>
                          {priority.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item['DIAS S/VND']}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-sky-900">Análise Crítica de Frios</DialogTitle>
            <DialogDescription>
              Produtos que necessitam atenção imediata para evitar perdas e vencimentos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-sky-800">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sky-800">{orderData.length}</div>
                    <div className="text-sm font-medium text-gray-600">Itens Críticos</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-600">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {orderData.filter(item => item.diasAteVencimento <= 0).length}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Vencidos</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-600">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {orderData.filter(item => item.diasAteVencimento <= 3).length}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Próximos Vencimento</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-600">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {orderData.filter(item => item.prioridade === 'alta').length}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Prioridade Alta</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button onClick={printOrder} className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Análise
              </Button>
            </div>

            {/* Order Table */}
            <div className="overflow-x-auto max-h-[50vh] overflow-y-auto custom-scrollbar">
              <table className="w-full min-w-full table-auto">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Código</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">Descrição</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Categoria</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">Estoque</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">Idade</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">Vida Útil</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Dias P/Venc</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Status</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Prioridade</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Ação</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.map((item, index) => (
                    <tr key={index} className={`hover:bg-gray-50 ${
                      item.prioridade === 'alta' ? 'bg-red-50' : 
                      item.prioridade === 'media' ? 'bg-yellow-50' : ''
                    }`}>
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.codigo}
                      </td>
                      <td className="px-2 py-3 text-sm text-gray-900">
                        {item.descricao}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.categoria}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.estoqueAtual}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.idade}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.vidaUtil}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center font-bold">
                        <span className={
                          item.diasAteVencimento <= 0 ? 'text-red-600' : 
                          item.diasAteVencimento <= 3 ? 'text-orange-600' : 'text-green-600'
                        }>
                          {item.diasAteVencimento}
                        </span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        <Badge className={`text-xs ${getPriorityColor(item.prioridade)}`}>
                          {item.prioridade.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {item.diasAteVencimento <= 0 && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          {item.diasAteVencimento > 0 && item.diasAteVencimento <= 3 && (
                            <Clock className="h-4 w-4 text-orange-600" />
                          )}
                          {item.diasAteVencimento > 3 && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-xs">
                            {item.diasAteVencimento <= 0 ? 'VENCIDO' : 
                             item.diasAteVencimento <= 3 ? 'URGENTE' : 'ATENÇÃO'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="auditoria">
          <AuditorValidadeFrios />
        </TabsContent>
      </Tabs>
    </div>
  )
}