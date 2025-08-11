'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, ShoppingCart, Truck, AlertTriangle, TrendingUp, Package, RefreshCw, Download, Filter, Printer } from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import * as XLSX from 'xlsx'

interface HortifrutiItem {
  MERC: string
  DIGITO: string
  DESCRICAO: string
  EMBALAGEM: string
  FORNECEDOR: string
  SETOR_LOJA: string
  GRUPO: string
  SUBGRUPO: string
  CLASSE: string
  ESTOQ_EMB1: number
  ESTOQ_EMB9: number
  CUSTO_MEDIO: number
  PRECO_VENDA: number
  QTD_VENDA_EMB1: number
  DIAS_S_VND: number
  IDADE: number
  VIDA_PADRAO: number
  VIDA_FINAL: number
  DT_ULT_ENT: string
  QTD_ULT_ENT: number
  NA0_VENDE_RUPT_: boolean
  PERC_RENT: number
  VENDA_MEDIA_DIARIA: number
  ESTOQUE_PROJETADO: number
  SUGESTAO_PEDIDO: number
  PRIORIDADE: 'alta' | 'media' | 'baixa'
  MOTIVO_PRIORIDADE: string
  DIAS_PARA_PROXIMA_ENTREGA: number
  DATA_PROXIMA_ENTREGA: string
}

export default function HortifrutiDashboard() {
  const { allData, filteredData } = useData()
  const [selectedDay, setSelectedDay] = useState<'segunda' | 'quarta' | 'sabado'>('segunda')
  const [fornecedorFilter, setFornecedorFilter] = useState('')
  const [classeFilter, setClasseFilter] = useState('all')
  const [idadeMaxFilter, setIdadeMaxFilter] = useState('')
  const [showOnlyCritical, setShowOnlyCritical] = useState(false)
  const [pedidoItens, setPedidoItens] = useState<HortifrutiItem[]>([])
  const [isPedidoDialogOpen, setIsPedidoDialogOpen] = useState(false)

  // Tabela de vida útil dos produtos
  const vidaUtilProdutos: Record<string, { vidaPadrao: number; vidaFinal: number }> = {
    'HF.ABACATE': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.ABACAXI TROPICAL': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.ABOBORA BRASILEIRA': { vidaPadrao: 30, vidaFinal: 45 },
    'HF.ABOBORA ITALIANA': { vidaPadrao: 30, vidaFinal: 45 },
    'HF.ABOBORA JAP/CABOTIA': { vidaPadrao: 30, vidaFinal: 45 },
    'HF.ABOBORA MORANGA': { vidaPadrao: 30, vidaFinal: 45 },
    'HF.ABOBORA PAULISTA JACAR.': { vidaPadrao: 30, vidaFinal: 45 },
    'HF.ALHO CAIXA': { vidaPadrao: 90, vidaFinal: 150 },
    'HF.ALHO PORO': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.AMEIXA IMPORTADA': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.AMEIXA NACIONAL': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.BANANA MACA': { vidaPadrao: 5, vidaFinal: 7 },
    'HF.BANANA NANICA (CATURRA)': { vidaPadrao: 5, vidaFinal: 7 },
    'HF.BANANA PRATA': { vidaPadrao: 5, vidaFinal: 7 },
    'HF.BANANA TERRA': { vidaPadrao: 5, vidaFinal: 7 },
    'HF.BATATA ASTERIX': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.BATATA DOCE BRANCA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.BATATA DOCE ROXA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.BATATA LAVADA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.BERINJELA COMUM': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.BETERRABA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.CARA PAULISTA': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.CEBOLA ATACADAO': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.CEBOLA P/ CONSERVA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.CEBOLA ROXA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.CENOURA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.CEREJA': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.CHUCHU': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.COCO SECO TROPICAL': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.COCO VERDE FRUTA TROPICAL': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.GENGIBRE': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.GOIABA VERMELHA TROPICAL': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.INHAME DA COSTA': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.KIWI': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.LARANJA IMPORTADA': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.LARANJA LIMA (SERRA D\'AGUA)': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.LARANJA PERA': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.LICHIA': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.LIMAO SICILIANO': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.LIMAO TAITI TROPICAL': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.MACA DIVERTIDA': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.MACA NAC.FUJI': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.MACA NAC.GALA': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.MACA RED IMPORT.': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.MACA VERDE IMPORT.': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.MAMAO FORMOSA': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.MAMAO HAWAI/PAPAYA TROPICAL': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.MANDIOCA-AIPIM': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.MANGA PALMER': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.MANGA TOMMY TROPICAL': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.MARACUJA AZEDO TROPICAL': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.MELANCIA BABY': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.MELANCIA TROPICAL GD': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.MELAO AMARELO 13KG': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.MELAO ORANGE': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.MELAO PELE SAPO': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.MELAO REDINHA': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.MEXIRICA MORGOT': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.MEXIRICA PONKAN': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.MORANGO': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.NECTARINA IMPORTADA': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.NECTARINA NACIONAL': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.PEPINO CAIPIRA': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.PEPINO COMUM': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.PEPINO JAPONES': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.PERA IMPORT.': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.PERA PORTUGUESA': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.PESSEGO IMPORTADO': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.PESSEGO NACIONAL': { vidaPadrao: 3, vidaFinal: 5 },
    'HF.PIMENTA CHEIRO SELECIONADA': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.PIMENTAO AMAR.9KG': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.PIMENTAO VERDE': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.PIMENTAO VERM.9KG': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.PINHAO TROPICAL': { vidaPadrao: 14, vidaFinal: 21 },
    'HF.PITAYA': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.REPOLHO BCO': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.REPOLHO ROXO': { vidaPadrao: 7, vidaFinal: 14 },
    'HF.TOMATE GRAPE': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.TOMATE ITALIANO': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.TOMATE SALADA': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA BENITAKA': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA CRIMSOM': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA ITALIA': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA JUBILEE': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA NIAGARA BDJ': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA RED GLOBE': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA THOMPSON': { vidaPadrao: 7, vidaFinal: 10 },
    'HF.UVA VITORIA': { vidaPadrao: 7, vidaFinal: 10 }
  }

  // Calcular dados de hortifruti
  const hortifrutiData = useMemo(() => {
    if (!allData.length) return []

    return allData
      .filter(item => {
        const descricao = String(item.DESCRICAO || '').toUpperCase()
        const setor = String(item.SETOR_LOJA || '').toUpperCase()
        const grupo = String(item.GRUPO || '').toUpperCase()
        return descricao.startsWith('HF.') || setor.includes('HORTI') || setor.includes('FRUTI') || 
               grupo.includes('HORTI') || grupo.includes('FRUTI') ||
               setor.includes('FL') || grupo.includes('FL')
      })
      .map(item => {
        const estoqEmbalagem1 = parseInt(String(item['ESTOQ EMB1'] || '0'))
        const qtdVendaEmbalagem1 = parseInt(String(item['QTD VENDA EMB1'] || '0'))
        const diasSemVenda = parseInt(String(item['DIAS S/VND'] || '0'))
        const idade = parseInt(String(item.IDADE || '0'))
        const custoMedio = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
        const precoVenda = parseFloat(String(item['PRECO VENDA'] || '0').replace(',', '.'))
        const ruptura = String(item['NAO VENDE (RUPT.)'] || '').toUpperCase() === 'SIM'
        
        // Obter vida útil da tabela
        const descricaoUpper = String(item.DESCRICAO || '').toUpperCase()
        const vidaUtil = vidaUtilProdutos[descricaoUpper] || { vidaPadrao: 7, vidaFinal: 10 }
        const vidaPadrao = vidaUtil.vidaPadrao
        const vidaFinal = vidaUtil.vidaFinal

        // Lógica de idade: zera quando o produto zera o estoque e é comprado novamente
        let idadeCalculada = parseInt(String(item.IDADE || '0'))
        const estoqueAtual = parseInt(String(item['ESTOQ EMB1'] || '0'))
        const qtdUltimaEntrada = parseInt(String(item['QTD ULT ENT'] || '0'))
        
        // Se teve entrada recente e estoque era zero antes, zera a idade
        if (qtdUltimaEntrada > 0 && estoqueAtual > 0) {
          // Considera que a idade foi zerada na última entrada
          idadeCalculada = Math.min(idadeCalculada, 1) // Máximo 1 dia de idade para produtos recém-chegados
        }

        // Calcular venda média diária (baseado nos últimos 7 dias)
        const vendaMediaDiaria = qtdVendaEmbalagem1 / Math.max(diasSemVenda || 1, 1)

        // Calcular dias para próxima entrega
        const hoje = new Date()
        const diasParaEntrega = {
          segunda: (8 - hoje.getDay()) % 7 || 7,
          quarta: (11 - hoje.getDay()) % 7 || 4,
          sabado: (13 - hoje.getDay()) % 7 || 6
        }[selectedDay]

        const dataProximaEntrega = new Date(hoje.getTime() + (diasParaEntrega * 24 * 60 * 60 * 1000))

        // Calcular estoque projetado
        const estoqueProjetado = Math.max(0, estoqEmbalagem1 - (vendaMediaDiaria * diasParaEntrega))

        // Calcular sugestão de pedido
        let sugestaoPedido = 0
        let prioridade: 'alta' | 'media' | 'baixa' = 'baixa'
        let motivoPrioridade = ''

        if (ruptura) {
          sugestaoPedido = Math.max(vendaMediaDiaria * 7, 10) // Pedido mínimo para ruptura
          prioridade = 'alta'
          motivoPrioridade = 'Produto em ruptura'
        } else if (estoqueProjetado <= 0) {
          sugestaoPedido = Math.max(vendaMediaDiaria * 7, 5)
          prioridade = 'alta'
          motivoPrioridade = 'Estoque insuficiente para próxima entrega'
        } else if (idadeCalculada > vidaFinal * 0.7) { // 70% da vida útil
          sugestaoPedido = Math.max(vendaMediaDiaria * 3, 3)
          prioridade = 'media'
          motivoPrioridade = 'Produto próximo do vencimento'
        } else if (estoqueProjetado < vendaMediaDiaria * 2) {
          sugestaoPedido = Math.max(vendaMediaDiaria * 2, 2)
          prioridade = 'media'
          motivoPrioridade = 'Estoque baixo'
        } else if (diasSemVenda > 5 && qtdVendaEmbalagem1 > 0) {
          sugestaoPedido = Math.max(vendaMediaDiaria * 1, 1)
          prioridade = 'baixa'
          motivoPrioridade = 'Reposição preventiva'
        }

        return {
          MERC: item.MERC || '',
          DIGITO: item.DIGITO || '',
          DESCRICAO: item.DESCRICAO || '',
          EMBALAGEM: item.EMBALAGEM || '',
          FORNECEDOR: item.FORNECEDOR || '',
          SETOR_LOJA: item.SETOR_LOJA || '',
          GRUPO: item.GRUPO || '',
          SUBGRUPO: item.SUBGRUPO || '',
          CLASSE: item.CLASSE || '',
          ESTOQ_EMB1: estoqEmbalagem1,
          ESTOQ_EMB9: parseInt(String(item['ESTOQ EMB9'] || '0')),
          CUSTO_MEDIO: custoMedio,
          PRECO_VENDA: precoVenda,
          QTD_VENDA_EMB1: qtdVendaEmbalagem1,
          DIAS_S_VND: diasSemVenda,
          IDADE: idadeCalculada,
          VIDA_PADRAO: vidaPadrao,
          VIDA_FINAL: vidaFinal,
          DT_ULT_ENT: item['DT ULT ENT'] || '',
          QTD_ULT_ENT: parseInt(String(item['QTD ULT ENT'] || '0')),
          NA0_VENDE_RUPT_: ruptura,
          PERC_RENT: parseFloat(String(item['PERC RENT'] || '0').replace(',', '.')),
          VENDA_MEDIA_DIARIA: vendaMediaDiaria,
          ESTOQUE_PROJETADO: estoqueProjetado,
          SUGESTAO_PEDIDO: sugestaoPedido,
          PRIORIDADE: prioridade,
          MOTIVO_PRIORIDADE: motivoPrioridade,
          DIAS_PARA_PROXIMA_ENTREGA: diasParaEntrega,
          DATA_PROXIMA_ENTREGA: dataProximaEntrega.toLocaleDateString('pt-BR')
        }
      })
  }, [allData, selectedDay])

  // Aplicar filtros
  const filteredHortifrutiData = useMemo(() => {
    return hortifrutiData.filter(item => {
      const matchFornecedor = !fornecedorFilter || 
        item.FORNECEDOR.toLowerCase().includes(fornecedorFilter.toLowerCase())
      const matchClasse = classeFilter === 'all' || item.CLASSE === classeFilter
      const matchIdade = !idadeMaxFilter || item.IDADE <= parseInt(idadeMaxFilter)
      const matchCritical = !showOnlyCritical || item.PRIORIDADE === 'alta'

      return matchFornecedor && matchClasse && matchIdade && matchCritical
    })
  }, [hortifrutiData, fornecedorFilter, classeFilter, idadeMaxFilter, showOnlyCritical])

  // Obter opções para filtros
  const fornecedores = [...new Set(hortifrutiData.map(item => item.FORNECEDOR).filter(Boolean))].sort()
  const classes = [...new Set(hortifrutiData.map(item => item.CLASSE).filter(Boolean))].sort()

  // Estatísticas
  const estatisticas = useMemo(() => {
    if (filteredHortifrutiData.length === 0) return null

    const totalItens = filteredHortifrutiData.length
    const itensRuptura = filteredHortifrutiData.filter(item => item.NA0_VENDE_RUPT_).length
    const itensCriticos = filteredHortifrutiData.filter(item => item.PRIORIDADE === 'alta').length
    const valorEstoqueTotal = filteredHortifrutiData.reduce((sum, item) => sum + (item.ESTOQ_EMB1 * item.CUSTO_MEDIO), 0)
    const sugestaoPedidoTotal = filteredHortifrutiData.reduce((sum, item) => sum + item.SUGESTAO_PEDIDO, 0)
    const valorPedidoTotal = filteredHortifrutiData.reduce((sum, item) => sum + (item.SUGESTAO_PEDIDO * item.CUSTO_MEDIO), 0)
    const idadeMedia = filteredHortifrutiData.reduce((sum, item) => sum + item.IDADE, 0) / totalItens

    return {
      totalItens,
      itensRuptura,
      itensCriticos,
      valorEstoqueTotal,
      sugestaoPedidoTotal,
      valorPedidoTotal,
      idadeMedia
    }
  }, [filteredHortifrutiData])

  // Dados para gráficos
  const prioridadeData = useMemo(() => {
    const prioridadeCount = filteredHortifrutiData.reduce((acc, item) => {
      acc[item.PRIORIDADE] = (acc[item.PRIORIDADE] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { name: 'Alta', value: prioridadeCount.alta || 0, color: '#ef4444' },
      { name: 'Média', value: prioridadeCount.media || 0, color: '#f59e0b' },
      { name: 'Baixa', value: prioridadeCount.baixa || 0, color: '#10b981' }
    ]
  }, [filteredHortifrutiData])

  const fornecedorData = useMemo(() => {
    const fornecedorStats = filteredHortifrutiData.reduce((acc, item) => {
      if (!acc[item.FORNECEDOR]) {
        acc[item.FORNECEDOR] = {
          fornecedor: item.FORNECEDOR,
          totalItens: 0,
          sugestaoPedido: 0,
          valorPedido: 0,
          rupturas: 0
        }
      }
      acc[item.FORNECEDOR].totalItens += 1
      acc[item.FORNECEDOR].sugestaoPedido += item.SUGESTAO_PEDIDO
      acc[item.FORNECEDOR].valorPedido += item.SUGESTAO_PEDIDO * item.CUSTO_MEDIO
      if (item.NA0_VENDE_RUPT_) acc[item.FORNECEDOR].rupturas += 1
      return acc
    }, {} as Record<string, any>)

    return Object.values(fornecedorStats)
      .sort((a: any, b: any) => (b as any).valorPedido - (a as any).valorPedido)
      .slice(0, 10)
  }, [filteredHortifrutiData])

  // Gerar pedido
  const gerarPedido = () => {
    const itensParaPedido = filteredHortifrutiData
      .filter(item => item.SUGESTAO_PEDIDO > 0)
      .sort((a, b) => {
        const prioridadeOrder = { alta: 3, media: 2, baixa: 1 }
        return prioridadeOrder[b.PRIORIDADE] - prioridadeOrder[a.PRIORIDADE]
      })

    setPedidoItens(itensParaPedido)
    setIsPedidoDialogOpen(true)
  }

  const exportarPedido = () => {
    if (pedidoItens.length === 0) return

    const pedidoData = pedidoItens.map(item => ({
      'Código': `${item.MERC}-${item.DIGITO}`,
      'Descrição': item.DESCRICAO,
      'Embalagem': item.EMBALAGEM,
      'Fornecedor': item.FORNECEDOR,
      'Estoque Atual': item.ESTOQ_EMB1,
      'Idade (dias)': item.IDADE,
      'Vida Útil (dias)': item.VIDA_FINAL,
      'Venda Média Diária': item.VENDA_MEDIA_DIARIA.toFixed(2),
      'Sugestão de Pedido': item.SUGESTAO_PEDIDO,
      'Prioridade': item.PRIORIDADE.toUpperCase(),
      'Motivo': item.MOTIVO_PRIORIDADE,
      'Custo Unitário': `R$ ${item.CUSTO_MEDIO.toFixed(2)}`,
      'Valor Total': `R$ ${(item.SUGESTAO_PEDIDO * item.CUSTO_MEDIO).toFixed(2)}`,
      'Dias para Entrega': item.DIAS_PARA_PROXIMA_ENTREGA,
      'Data Prevista Entrega': item.DATA_PROXIMA_ENTREGA
    }))

    const ws = XLSX.utils.json_to_sheet(pedidoData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido Hortifruti')

    const exportFileName = `pedido_hortifruti_${selectedDay}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, exportFileName)
  }

  const imprimirPedido = () => {
    if (pedidoItens.length === 0) return

    const totalItens = pedidoItens.length
    const totalUnidades = pedidoItens.reduce((sum, item) => sum + item.SUGESTAO_PEDIDO, 0)
    const valorTotal = pedidoItens.reduce((sum, item) => sum + (item.SUGESTAO_PEDIDO * item.CUSTO_MEDIO), 0)
    const dataEntrega = filteredHortifrutiData[0]?.DATA_PROXIMA_ENTREGA || selectedDay

    const printContent = `
      <html>
        <head>
          <title>Pedido de Hortifruti - ${selectedDay === 'segunda' ? 'Segunda-Feira' : selectedDay === 'quarta' ? 'Quarta-Feira' : 'Sábado'}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background-color: #f9fafb;
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              background-color: white; 
              padding: 20px; 
              border-radius: 8px; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            h1 { 
              color: #059669; 
              text-align: center; 
              margin-bottom: 10px; 
              font-size: 24px; 
              font-weight: bold;
            }
            .subtitle { 
              color: #6b7280; 
              text-align: center; 
              margin-bottom: 20px; 
              font-size: 14px;
            }
            .data-entrega {
              font-size: 16px;
              font-weight: bold;
              color: #dc2626;
              margin-bottom: 15px;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin: 20px 0; 
            }
            .stat-card { 
              background-color: white; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
              border-left: 4px solid;
            }
            .stat-card.itens { border-left-color: #3b82f6; }
            .stat-card.unidades { border-left-color: #f59e0b; }
            .stat-card.valor { border-left-color: #10b981; }
            .stat-number { 
              font-size: 20px; 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .stat-number.itens { color: #3b82f6; }
            .stat-number.unidades { color: #f59e0b; }
            .stat-number.valor { color: #10b981; }
            .stat-label { 
              font-size: 11px; 
              color: #6b7280; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              background-color: white; 
              border-radius: 8px; 
              overflow: hidden; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            th { 
              background-color: #f0fdf4; 
              color: #059669; 
              padding: 12px 8px; 
              text-align: left; 
              font-weight: 600; 
              font-size: 11px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
              border-bottom: 2px solid #059669; 
            }
            td { 
              padding: 10px 8px; 
              border-bottom: 1px solid #e5e7eb; 
              font-size: 11px;
            }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr:hover { background-color: #f3f4f6; }
            .codigo { font-weight: bold; }
            .descricao { max-width: 200px; }
            .quantidade { text-align: right; font-weight: bold; }
            .valor { text-align: right; }
            .prioridade-alta { color: #dc2626; font-weight: bold; }
            .prioridade-media { color: #f59e0b; font-weight: bold; }
            .prioridade-baixa { color: #10b981; font-weight: bold; }
            .idade { text-align: center; font-size: 10px; }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              font-size: 10px; 
              color: #6b7280; 
              padding: 10px; 
              background-color: white; 
              border-radius: 8px; 
            }
            .observacoes {
              margin-top: 20px;
              padding: 15px;
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              font-size: 11px;
            }
            @media print {
              body { margin: 0; background-color: white; }
              .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
              .stat-card { margin: 0; padding: 10px; }
              .stat-number { font-size: 16px; }
              table { font-size: 10px; }
              th, td { padding: 6px 4px; }
              .descricao { max-width: 150px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedido de Hortifruti</h1>
            <div class="subtitle">Sugestão de pedido baseada na análise de estoque e demanda</div>
            <div class="data-entrega">Entrega em: ${dataEntrega}</div>
            
            <div class="stats-grid">
              <div class="stat-card itens">
                <div class="stat-number itens">${totalItens}</div>
                <div class="stat-label">Itens no Pedido</div>
              </div>
              <div class="stat-card unidades">
                <div class="stat-number unidades">${totalUnidades.toLocaleString('pt-BR')}</div>
                <div class="stat-label">Total de Unidades</div>
              </div>
              <div class="stat-card valor">
                <div class="stat-number valor">R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div class="stat-label">Valor Total</div>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código CX</th>
                <th>Descrição</th>
                <th>Estoque</th>
                <th>Idade</th>
                <th>Venda Média/Dia</th>
                <th>Qtde</th>
                <th>Custo Unit.</th>
                <th>Valor Total</th>
                <th>Prioridade</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              ${pedidoItens.map(item => `
                <tr>
                  <td class="codigo">${item.MERC}</td>
                  <td class="descricao">${item.DESCRICAO}</td>
                  <td style="text-align: center">${item.ESTOQ_EMB1}</td>
                  <td class="idade">${item.IDADE}d/${item.VIDA_FINAL}d</td>
                  <td style="text-align: right">${item.VENDA_MEDIA_DIARIA.toFixed(1)}</td>
                  <td class="quantidade">${item.SUGESTAO_PEDIDO}</td>
                  <td class="valor">R$ ${item.CUSTO_MEDIO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="valor">R$ ${(item.SUGESTAO_PEDIDO * item.CUSTO_MEDIO).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="prioridade-${item.PRIORIDADE}">${item.PRIORIDADE.toUpperCase()}</td>
                  <td style="font-size: 10px; color: #6b7280;">${item.MOTIVO_PRIORIDADE}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="observacoes">
            <strong>Observações:</strong><br>
            • Este pedido foi gerado automaticamente com base na análise de estoque e demanda<br>
            • Prioridade ALTA: Produtos em ruptura ou com estoque crítico<br>
            • Prioridade MÉDIA: Produtos com estoque baixo ou próximo do vencimento<br>
            • Prioridade BAIXA: Reposição preventiva<br>
            • Verifique sempre a qualidade dos produtos antes da compra
          </div>
          
          <div class="footer">
            Pedido gerado pelo Dashboard Atacadão - ${new Date().toLocaleString('pt-BR')}<br>
            Sistema de Gestão de Hortifruti
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }

  const exportarAnalise = () => {
    if (filteredHortifrutiData.length === 0) return

    const analiseData = filteredHortifrutiData.map(item => ({
      'Código': `${item.MERC}-${item.DIGITO}`,
      'Descrição': item.DESCRICAO,
      'Fornecedor': item.FORNECEDOR,
      'Classe': item.CLASSE,
      'Estoque CX': item.ESTOQ_EMB1,
      'Estoque UN': item.ESTOQ_EMB9,
      'Idade (dias)': item.IDADE,
      'Vida Útil Padrão (dias)': item.VIDA_PADRAO,
      'Vida Útil Final (dias)': item.VIDA_FINAL,
      'Dias sem Venda': item.DIAS_S_VND,
      'Venda Média Diária': item.VENDA_MEDIA_DIARIA.toFixed(2),
      'Estoque Projetado': item.ESTOQUE_PROJETADO.toFixed(2),
      'Sugestão Pedido': item.SUGESTAO_PEDIDO,
      'Prioridade': item.PRIORIDADE.toUpperCase(),
      'Motivo Prioridade': item.MOTIVO_PRIORIDADE,
      'Custo Unitário': `R$ ${item.CUSTO_MEDIO.toFixed(2)}`,
      'Preço Venda': `R$ ${item.PRECO_VENDA.toFixed(2)}`,
      'Rentabilidade': `${item.PERC_RENT.toFixed(2)}%`,
      'Ruptura': item.NA0_VENDE_RUPT_ ? 'SIM' : 'NÃO'
    }))

    const ws = XLSX.utils.json_to_sheet(analiseData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Análise Hortifruti')

    const exportFileName = `analise_hortifruti_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, exportFileName)
  }

  if (!allData.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>
            Nenhum dado disponível. Por favor, carregue um arquivo de dados para analisar o hortifruti.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Dia de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecione o Dia de Entrega
          </CardTitle>
          <CardDescription>
            Escolha o dia para calcular as sugestões de pedido (entregas: Segunda, Quarta e Sábado)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[
              { value: 'segunda', label: 'Segunda-Feira', days: 2 },
              { value: 'quarta', label: 'Quarta-Feira', days: 4 },
              { value: 'sabado', label: 'Sábado', days: 6 }
            ].map((day) => (
              <Button
                key={day.value}
                variant={selectedDay === day.value ? "default" : "outline"}
                onClick={() => setSelectedDay(day.value as any)}
                className="flex-1"
              >
                <div className="flex flex-col items-center">
                  <span>{day.label}</span>
                  <span className="text-xs opacity-70">{day.days} dias</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Hortifruti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fornecedorFilter">Fornecedor</Label>
              <Input
                id="fornecedorFilter"
                value={fornecedorFilter}
                onChange={(e) => setFornecedorFilter(e.target.value)}
                placeholder="Digite o fornecedor"
              />
            </div>
            <div>
              <Label htmlFor="classeFilter">Classe</Label>
              <Select value={classeFilter} onValueChange={setClasseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {classes.map((classe) => (
                    <SelectItem key={classe} value={classe}>
                      {classe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="idadeMaxFilter">Idade Máxima (dias)</Label>
              <Input
                id="idadeMaxFilter"
                type="number"
                value={idadeMaxFilter}
                onChange={(e) => setIdadeMaxFilter(e.target.value)}
                placeholder="Ex: 5"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant={showOnlyCritical ? "default" : "outline"}
                onClick={() => setShowOnlyCritical(!showOnlyCritical)}
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Apenas Críticos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estatisticas.totalItens}
                </div>
                <div className="text-sm text-gray-600">Total de Itens</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {estatisticas.itensRuptura}
                </div>
                <div className="text-sm text-gray-600">Em Ruptura</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {estatisticas.sugestaoPedidoTotal}
                </div>
                <div className="text-sm text-gray-600">Sugestão de Pedido</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {estatisticas.valorPedidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">Valor do Pedido</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={gerarPedido} className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Gerar Pedido para {selectedDay === 'segunda' ? 'Segunda' : selectedDay === 'quarta' ? 'Quarta' : 'Sábado'}
            </Button>
            <Button onClick={exportarAnalise} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Análise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <Tabs defaultValue="prioridade" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prioridade">Prioridades</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="prioridade">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Prioridades</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prioridadeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prioridadeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Prioridades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prioridadeData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant={item.name === 'Alta' ? 'destructive' : item.name === 'Média' ? 'default' : 'secondary'}>
                        {item.value} itens
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fornecedores">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Fornecedores - Valor do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={fornecedorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fornecedor" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor Pedido']} />
                  <Bar dataKey="valorPedido" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tabela de Sugestões */}
      <Card>
        <CardHeader>
          <CardTitle>Sugestões de Pedido - Hortifruti</CardTitle>
          <CardDescription>
            {filteredHortifrutiData.length} itens encontrados para entrega em {selectedDay === 'segunda' ? 'Segunda-Feira' : selectedDay === 'quarta' ? 'Quarta-Feira' : 'Sábado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left">Código</th>
                  <th className="px-2 py-2 text-left">Descrição</th>
                  <th className="px-2 py-2 text-center">Estoque</th>
                  <th className="px-2 py-2 text-center">Idade</th>
                  <th className="px-2 py-2 text-right">Venda Média/Dia</th>
                  <th className="px-2 py-2 text-right">Estoque Proj.</th>
                  <th className="px-2 py-2 text-right">Sugestão</th>
                  <th className="px-2 py-2 text-center">Prioridade</th>
                  <th className="px-2 py-2 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filteredHortifrutiData.slice(0, 100).map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-2">{item.MERC}-{item.DIGITO}</td>
                    <td className="px-2 py-2 max-w-xs truncate">{item.DESCRICAO}</td>
                    <td className="px-2 py-2 text-center">{item.ESTOQ_EMB1}</td>
                    <td className="px-2 py-2 text-center">
                      <Badge variant={item.IDADE > item.VIDA_FINAL * 0.7 ? "destructive" : "secondary"}>
                        {item.IDADE}d/{item.VIDA_FINAL}d
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-right">{item.VENDA_MEDIA_DIARIA.toFixed(1)}</td>
                    <td className="px-2 py-2 text-right">{item.ESTOQUE_PROJETADO.toFixed(1)}</td>
                    <td className="px-2 py-2 text-right font-medium">
                      {item.SUGESTAO_PEDIDO > 0 ? item.SUGESTAO_PEDIDO : '-'}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Badge variant={item.PRIORIDADE === 'alta' ? 'destructive' : item.PRIORIDADE === 'media' ? 'default' : 'secondary'}>
                        {item.PRIORIDADE.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600 max-w-xs truncate" title={item.MOTIVO_PRIORIDADE}>
                      {item.MOTIVO_PRIORIDADE}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHortifrutiData.length > 100 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Mostrando 100 de {filteredHortifrutiData.length} itens. Use a exportação para ver todos.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pedido */}
      <Dialog open={isPedidoDialogOpen} onOpenChange={setIsPedidoDialogOpen}>
        <DialogContent className="w-[95vw] max-w-none max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Pedido de Hortifruti - {selectedDay === 'segunda' ? 'Segunda-Feira' : selectedDay === 'quarta' ? 'Quarta-Feira' : 'Sábado'}</DialogTitle>
            <DialogDescription className="text-sm">
              Sugestão de pedido baseada na análise de estoque e demanda para entrega em {filteredHortifrutiData[0]?.DATA_PROXIMA_ENTREGA || selectedDay}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo do Pedido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{pedidoItens.length}</div>
                    <div className="text-sm text-gray-600">Itens no Pedido</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {pedidoItens.reduce((sum, item) => sum + item.SUGESTAO_PEDIDO, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total de Unidades</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      R$ {pedidoItens.reduce((sum, item) => sum + (item.SUGESTAO_PEDIDO * item.CUSTO_MEDIO), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela do Pedido */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg">
              <table className="w-full min-w-max table-auto border-collapse text-xs">
                <thead className="bg-green-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[70px]">Código</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[200px]">Descrição</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[60px]">Estoque</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[70px]">Idade</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[80px]">Venda/Dia</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[50px]">Qtde</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[70px]">Custo Unit.</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[80px]">Valor Total</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[70px]">Prioridade</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[150px]">Motivo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidoItens.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.MERC}</td>
                      <td className="px-2 py-2 text-sm text-gray-900" title={item.DESCRICAO}>
                        <div className="truncate">{item.DESCRICAO}</div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.ESTOQ_EMB1}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        <Badge variant={item.IDADE > item.VIDA_FINAL * 0.7 ? "destructive" : "secondary"} className="text-xs">
                          {item.IDADE}d/{item.VIDA_FINAL}d
                        </Badge>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{item.VENDA_MEDIA_DIARIA.toFixed(1)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{item.SUGESTAO_PEDIDO}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        R$ {item.CUSTO_MEDIO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                        R$ {(item.SUGESTAO_PEDIDO * item.CUSTO_MEDIO).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        <Badge variant={item.PRIORIDADE === 'alta' ? 'destructive' : item.PRIORIDADE === 'media' ? 'default' : 'secondary'} className="text-xs">
                          {item.PRIORIDADE.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-600" title={item.MOTIVO_PRIORIDADE}>
                        <div className="truncate">{item.MOTIVO_PRIORIDADE}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsPedidoDialogOpen(false)}>
                Fechar
              </Button>
              <Button onClick={exportarPedido} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button onClick={imprimirPedido} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Pedido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}