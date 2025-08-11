'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VirtualizedTable, PaginatedTable } from '@/components/ui/virtualized-table'
import { 
  FileSpreadsheet, 
  Upload, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Package,
  Calendar,
  BarChart3,
  Eye,
  Download,
  RefreshCw,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Shield,
  Target,
  Printer,
  FileText,
  ClipboardList
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'

// Custom debounce hook for performance optimization
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

// Simple cache utility for expensive function calls
const useCache = <T, Args extends any[]>(
  fn: (...args: Args) => T,
  keyGenerator: (...args: Args) => string
) => {
  const cacheRef = useRef<Map<string, T>>(new Map())
  
  return useCallback((...args: Args): T => {
    const key = keyGenerator(...args)
    
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!
    }
    
    const result = fn(...args)
    cacheRef.current.set(key, result)
    
    // Simple cache cleanup - keep only last 1000 entries
    if (cacheRef.current.size > 1000) {
      const firstKey = cacheRef.current.keys().next().value
      cacheRef.current.delete(firstKey)
    }
    
    return result
  }, [fn, keyGenerator])
}

interface ValidadeItem {
  recnum: string
  código: string
  estoque_liq_1: number
  estoque_liq_9: number
  estoque_bru_1: number
  estoque_bru_9: number
  idade: number
  quantidade: number
  tempo_vida: number
  perc_uso: number
  dtaVencimento: string  // Campo principal baseado na coluna DATA VENCIMENTO do Excel
  dtaEntrada: string
  dtaUltEntrada: string
  vnd_30_dias_emb1: number
  vnd_30_dias_emb9: number
  dias_sem_venda: number
  descricao?: string
  setor?: string
  sta?: string
  embalagem?: string
  qtde_emb1?: number
  qtde_emb9?: number
  data_entrada?: string
  qtde_ult_ent_emb1?: number
  qtde_ult_ent_emb9?: number
  data_ult_entrada?: string
  est_liq_emb1?: number
  est_liq_emb9?: number
  est_bruto_emb1?: number
  est_bruto_emb9?: number
  vnd_30_dias_emb1_novo?: number
  vnd_30_dias_emb9_novo?: number
  dias_sem_venda_novo?: number
  setor_fisico?: string
  setor_balanco?: string
  comprador?: string
  comprador_matriz?: string
  idade_novo?: number
  tempo_de_vida?: number
  perc_uso_t_vida?: number
  rentabilidade?: number
  valor_vencimento?: number
  origem?: string
}

interface AnaliseValidade {
  codigo: string
  descricao: string
  lotes: ValidadeItem[]
  estoqueTotal: number
  riscoValidade: 'Vencido' | 'Crítico' | 'Alto' | 'Normal'
  statusFIFO: 'ok' | 'alerta' | 'erro'
  diasParaVencimento: number
  produtosVencidos: number
  estoqueParado: number
  pvpsRecomendado: string
  recomendacoes: string[]
  scoreRisco: number
}

interface FIFOLote {
  codigo: string
  lote: string
  dataVencimento: string
  dataEntrada: string
  quantidade: number
  diasParaVencimento: number
  deveSerVendidoPrimeiro: boolean
  ordemRecomendada: number
}

interface TabelaValidadeItem {
  codigo: string
  descricao: string
  embalagem?: string
  dataVencimento: string
  diasParaVencer: number
  risco: 'Vencido' | 'Crítico' | 'Alto' | 'Normal'
  quantidade: number
  recnum: string
}

interface AuditoriaValidadeItem {
  lote: string
  dataVencimento: string
  quantidade: number
  diasRestantes: number
  prioridade: string
  status: string
  diasRestantesCorrigido?: number
  statusCorrigido?: 'Vencido' | 'Urgente' | 'Atenção' | 'Normal'
  prioridadeCorrigida?: number
  ordem?: number
  codigo?: string
  descricao?: string
}

export default function AnaliseValidadeDashboard() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Análise de Validade e Controle FIFO
            </CardTitle>
            <CardDescription>
              Análise inteligente de validade de produtos com detecção de inconsistências e recomendações PVPS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-10 bg-gray-100 rounded-md border border-gray-300 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Carregando análise de validade...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <AnaliseValidadeDashboardContent />
}

function AnaliseValidadeDashboardContent() {
  const [validadeData, setValidadeData] = useState<ValidadeItem[]>([])
  const [analises, setAnalises] = useState<AnaliseValidade[]>([])
  const [tabelaValidade, setTabelaValidade] = useState<TabelaValidadeItem[]>([])
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaValidadeItem[]>([])
  const [auditoriaProcessada, setAuditoriaProcessada] = useState<AuditoriaValidadeItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAnalise, setSelectedAnalise] = useState<AnaliseValidade | null>(null)
  const [selectedAuditoria, setSelectedAuditoria] = useState<AuditoriaValidadeItem | null>(null)
  const [filtroRisco, setFiltroRisco] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // 300ms delay for better performance
  const [filtroHabilitaFiltroHF, setFiltroHabilitaFiltroHF] = useState(false)
  const [relatorioTipo, setRelatorioTipo] = useState<'completo' | 'criticos' | 'vencidos' | 'resumo'>('completo')

  // Aplicar filtros aos dados de análise
  const filteredData = useMemo(() => {
    let filtered = analises

    // Aplicar filtro de risco
    if (filtroRisco !== 'todos') {
      filtered = filtered.filter(item => item.riscoValidade === filtroRisco)
    }

    // Aplicar filtro de status FIFO
    if (filtroStatus !== 'todos') {
      filtered = filtered.filter(item => item.statusFIFO === filtroStatus)
    }

    // Aplicar filtro de busca por código ou descrição
    if (debouncedSearchTerm.trim() !== '') {
      const searchTermLower = debouncedSearchTerm.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.codigo.toLowerCase().includes(searchTermLower) ||
        (item.descricao && item.descricao.toLowerCase().includes(searchTermLower))
      )
    }

    return filtered
  }, [analises, filtroRisco, filtroStatus, debouncedSearchTerm])

  // Definição das funções antes dos useEffect
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        // Processar dados brutos
        const processados = jsonData.map(item => ({
          recnum: String(item.recnum || ''),
          código: String(item['CÓDIGO'] || item.código || item.codigo || ''),
          estoque_liq_1: parseFloat(String(item.estoque_liq_1 || item['EST. LÍQ. EMB1'] || '0').replace(',', '.')) || 0,
          estoque_liq_9: parseFloat(String(item.estoque_liq_9 || item['EST. LÍQ. EMB9'] || '0').replace(',', '.')) || 0,
          estoque_bru_1: parseFloat(String(item.estoque_bru_1 || item['EST. BRUTO EMB1'] || '0').replace(',', '.')) || 0,
          estoque_bru_9: parseFloat(String(item.estoque_bru_9 || item['EST. BRUTO EMB9'] || '0').replace(',', '.')) || 0,
          idade: parseInt(String(item.idade || item.IDADE || '0')) || 0,
          quantidade: parseInt(String(item.quantidade || item['QTDE. EMB1'] || '0')) || 0,
          tempo_vida: parseInt(String(item.tempo_vida || item['TEMPO DE VIDA'] || '0')) || 0,
          perc_uso: parseFloat(String(item.perc_uso || item['% USO T. VIDA'] || '0').replace(',', '.')) || 0,
          dtaVencimento: String(item.dtaVencimento || item['DATA VENCIMENTO'] || ''),
          dtaEntrada: String(item.dtaEntrada || item['DATA ENTRADA'] || ''),
          dtaUltEntrada: String(item.dtaUltEntrada || item['DATA ÚLT. ENTRADA'] || ''),
          vnd_30_dias_emb1: parseFloat(String(item.vnd_30_dias_emb1 || item['VND. 30 DIAS EMB1'] || '0').replace(',', '.')) || 0,
          vnd_30_dias_emb9: parseFloat(String(item.vnd_30_dias_emb9 || item['VND. 30 DIAS EMB9'] || '0').replace(',', '.')) || 0,
          dias_sem_venda: parseInt(String(item.dias_sem_venda || item['DIAS SEM VENDA'] || '0')) || 0,
          descricao: String(item.descricao || item['DESCRIÇÃO MERCADORIA'] || ''),
          setor: String(item.setor || ''),
          sta: String(item.sta || item['STA.'] || ''),
          embalagem: String(item.embalagem || item['EMBALAGEM'] || ''),
          qtde_emb1: parseInt(String(item.qtde_emb1 || item['QTDE. EMB1'] || '0')) || 0,
          qtde_emb9: parseInt(String(item.qtde_emb9 || item['QTDE. EMB9'] || '0')) || 0,
          data_entrada: String(item.data_entrada || item['DATA ENTRADA'] || ''),
          qtde_ult_ent_emb1: parseInt(String(item.qtde_ult_ent_emb1 || item['QTDE. ÚLT. ENTR. EMB1'] || '0')) || 0,
          qtde_ult_ent_emb9: parseInt(String(item.qtde_ult_ent_emb9 || item['QTDE. ÚLT. ENTR. EMB9'] || '0')) || 0,
          data_ult_entrada: String(item.data_ult_entrada || item['DATA ÚLT. ENTRADA'] || ''),
          est_liq_emb1: parseInt(String(item.est_liq_emb1 || item['EST. LÍQ. EMB1'] || '0')) || 0,
          est_liq_emb9: parseInt(String(item.est_liq_emb9 || item['EST. LÍQ. EMB9'] || '0')) || 0,
          est_bruto_emb1: parseInt(String(item.est_bruto_emb1 || item['EST. BRUTO EMB1'] || '0')) || 0,
          est_bruto_emb9: parseInt(String(item.est_bruto_emb9 || item['EST. BRUTO EMB9'] || '0')) || 0,
          vnd_30_dias_emb1_novo: parseInt(String(item.vnd_30_dias_emb1_novo || item['VND. 30 DIAS EMB1'] || '0')) || 0,
          vnd_30_dias_emb9_novo: parseInt(String(item.vnd_30_dias_emb9_novo || item['VND. 30 DIAS EMB9'] || '0')) || 0,
          dias_sem_venda_novo: parseInt(String(item.dias_sem_venda_novo || item['DIAS SEM VENDA'] || '0')) || 0,
          setor_fisico: String(item.setor_fisico || item['SETOR FÍSICO'] || ''),
          setor_balanco: String(item.setor_balanco || item['SETOR BALANÇO'] || ''),
          comprador: String(item.comprador || item['COMPRADOR'] || ''),
          comprador_matriz: String(item.comprador_matriz || item['COMPRADOR MATRIZ'] || ''),
          idade_novo: parseInt(String(item.idade_novo || item.IDADE || '0')) || 0,
          tempo_de_vida: parseInt(String(item.tempo_de_vida || item['TEMPO DE VIDA'] || '0')) || 0,
          perc_uso_t_vida: parseFloat(String(item.perc_uso_t_vida || item['% USO T. VIDA'] || '0').replace(',', '.')) || 0,
          rentabilidade: parseFloat(String(item.rentabilidade || item.RENTABILIDADE || '0').replace(',', '.')) || 0,
          valor_vencimento: parseFloat(String(item.valor_vencimento || item['VALOR VENCIMENTO'] || '0').replace(',', '.')) || 0,
          origem: String(item.origem || item.ORIGEM || '')
        } as ValidadeItem))

        setValidadeData(processados)
        setIsProcessing(false)
      } catch (error) {
        console.error('Erro ao processar arquivo:', error)
        setIsProcessing(false)
      }
    }

    reader.onerror = () => {
      console.error('Erro ao ler arquivo')
      setIsProcessing(false)
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const calcularDiasRestantesAuditoria = useCallback((dataVencimento: string): number => {
    // Função para auditoria que usa a data atual do sistema como referência
    if (!dataVencimento) return 999
    
    const hoje = new Date() // Data atual do sistema
    const vencimento = new Date(dataVencimento)
    
    if (isNaN(vencimento.getTime())) {
      // Tentar formatos brasileiros
      const partes = dataVencimento.split('/')
      if (partes.length === 3) {
        const dia = parseInt(partes[0])
        const mes = parseInt(partes[1]) - 1
        const ano = parseInt(partes[2]) < 100 ? 2000 + parseInt(partes[2]) : parseInt(partes[2])
        const dataParseada = new Date(ano, mes, dia)
        if (!isNaN(dataParseada.getTime())) {
          const diffTime = dataParseada.getTime() - hoje.getTime()
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
      }
      return 999
    }
    
    const diffTime = vencimento.getTime() - hoje.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [])

  const processarAuditoria = useCallback((dados: AuditoriaValidadeItem[]): AuditoriaValidadeItem[] => {
    // Processar auditoria corrigindo cálculos e status - Fixed initialization order and compilation issue
    const processados = dados.map(item => {
      // Calcular dias restantes corretos usando data atual do sistema
      const diasRestantesCorrigido = calcularDiasRestantesAuditoria(item.dataVencimento)
      
      // Determinar status corrigido
      let statusCorrigido: 'Vencido' | 'Urgente' | 'Atenção' | 'Normal'
      if (diasRestantesCorrigido < 0) {
        statusCorrigido = 'Vencido'
      } else if (diasRestantesCorrigido <= 5) {
        statusCorrigido = 'Urgente'
      } else if (diasRestantesCorrigido <= 15) {
        statusCorrigido = 'Atenção'
      } else {
        statusCorrigido = 'Normal'
      }
      
      return {
        ...item,
        diasRestantesCorrigido,
        statusCorrigido
      }
    })

    // Ordenar por FIFO (primeiro a vencer, primeiro a ser vendido)
    const ordenados = processados
      .sort((a, b) => {
        // Ordenar por dias restantes corrigidos (menos dias primeiro)
        return (a.diasRestantesCorrigido || 999) - (b.diasRestantesCorrigido || 999)
      })
      .map((item, index) => ({
        ...item,
        ordem: index + 1,
        prioridadeCorrigida: index + 1
      }))

    return ordenados
  }, [calcularDiasRestantesAuditoria])

  const handleAuditoriaFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        // Processar dados de auditoria
        const processados = jsonData.map(item => ({
          lote: String(item.lote || item.LOTE || item.recnum || ''),
          dataVencimento: String(item.dataVencimento || item['DATA VENCIMENTO'] || item['Data Vencimento'] || ''),
          quantidade: parseInt(String(item.quantidade || item['QUANTIDADE'] || item['Quantidade'] || '0')) || 0,
          diasRestantes: parseInt(String(item.diasRestantes || item['DIAS RESTANTES'] || item['Dias Restantes'] || '0')) || 0,
          prioridade: String(item.prioridade || item['PRIORIDADE'] || item['Prioridade'] || ''),
          status: String(item.status || item['STATUS'] || item['Status'] || ''),
          codigo: String(item.codigo || item['CÓDIGO'] || item['Código'] || ''),
          descricao: String(item.descricao || item['DESCRIÇÃO'] || item['Descrição'] || '')
        } as AuditoriaValidadeItem))

        setAuditoriaData(processados)
        
        // Processar auditoria automaticamente
        const auditoriaProcessada = processarAuditoria(processados)
        setAuditoriaProcessada(auditoriaProcessada)
        
        setIsProcessing(false)
      } catch (error) {
        console.error('Erro ao processar arquivo de auditoria:', error)
        setIsProcessing(false)
      }
    }

    reader.onerror = () => {
      console.error('Erro ao ler arquivo de auditoria')
      setIsProcessing(false)
    }

    reader.readAsArrayBuffer(file)
  }, [processarAuditoria])

  const calcularDiasParaVencimento = useCallback((dataVencimento: string): number => {
    // Função principal que calcula dias para vencimento baseada na coluna DATA VENCIMENTO do Excel
    // Data de referência: sempre o dia atual
    if (!dataVencimento) return 999
    
    const hoje = new Date() // Sempre o dia atual
    
    // Primeiro tentar parsear como formato brasileiro DD/MM/YYYY
    const partes = dataVencimento.split('/')
    if (partes.length === 3) {
      const dia = parseInt(partes[0])
      const mes = parseInt(partes[1]) - 1
      const ano = parseInt(partes[2]) < 100 ? 2000 + parseInt(partes[2]) : parseInt(partes[2])
      const dataParseada = new Date(ano, mes, dia)
      if (!isNaN(dataParseada.getTime())) {
        const diffTime = dataParseada.getTime() - hoje.getTime()
        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return dias
      }
    }
    
    // Se não funcionar, tentar como formato ISO
    const vencimento = new Date(dataVencimento)
    if (isNaN(vencimento.getTime())) {
      return 999
    }
    
    const diffTime = vencimento.getTime() - hoje.getTime()
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return dias
  }, [])

  // Cached version for better performance
  const cachedCalcularDiasParaVencimento = useCache(
    calcularDiasParaVencimento,
    (dataVencimento: string) => `dias_${dataVencimento}_${new Date().toDateString()}`
  )

  const analisarFIFO = useCallback((lotes: ValidadeItem[]): FIFOLote[] => {
    return lotes
      .map(lote => ({
        codigo: lote.código,
        lote: lote.recnum,
        dataVencimento: lote.dtaVencimento,
        dataEntrada: lote.dtaEntrada,
        quantidade: lote.quantidade,
        diasParaVencimento: cachedCalcularDiasParaVencimento(lote.dtaVencimento),
        deveSerVendidoPrimeiro: false,
        ordemRecomendada: 0
      }))
      .sort((a, b) => a.diasParaVencimento - b.diasParaVencimento)
      .map((lote, index) => ({
        ...lote,
        deveSerVendidoPrimeiro: index === 0,
        ordemRecomendada: index + 1
      }))
  }, [calcularDiasParaVencimento])

  const determinarRiscoValidade = useCallback((diasParaVencimento: number): 'Vencido' | 'Crítico' | 'Alto' | 'Normal' => {
    if (diasParaVencimento < 0) return 'Vencido'
    if (diasParaVencimento <= 7) return 'Crítico'
    if (diasParaVencimento <= 30) return 'Alto'
    return 'Normal'
  }, [])

  // Cached version for better performance
  const cachedDeterminarRiscoValidade = useCache(
    determinarRiscoValidade,
    (diasParaVencimento: number) => `risco_${diasParaVencimento}`
  )

  const determinarStatusFIFO = useCallback((lotes: ValidadeItem[]): 'ok' | 'alerta' | 'erro' => {
    if (lotes.length <= 1) return 'ok'
    
    const lotesOrdenados = [...lotes].sort((a, b) => 
      cachedCalcularDiasParaVencimento(a.dtaVencimento) - cachedCalcularDiasParaVencimento(b.dtaVencimento)
    )
    
    // Calcular valor total em risco
    const valorTotalEmRisco = lotes.reduce((total, lote) => {
      const diasParaVencimento = cachedCalcularDiasParaVencimento(lote.dtaVencimento)
      if (diasParaVencimento <= 30) {
        return total + (lote.valor_vencimento || 0) * lote.quantidade
      }
      return total
    }, 0)
    
    // Verificar se há produtos vencidos no estoque
    const produtosVencidos = lotes.filter(lote => cachedCalcularDiasParaVencimento(lote.dtaVencimento) < 0)
    const valorVencidos = produtosVencidos.reduce((total, lote) => 
      total + (lote.valor_vencimento || 0) * lote.quantidade, 0
    )
    
    if (produtosVencidos.length > 0) {
      // Erro crítico se houver valor significativo vencido
      if (valorVencidos > 1000) { // Mais de R$ 1.000 em produtos vencidos
        return 'erro'
      }
      return 'erro' // Mesmo valores pequenos são erro
    }
    
    // Verificar produtos de alto valor próximos ao vencimento
    const produtosAltoValorProximosVencimento = lotes.filter(lote => {
      const diasParaVencimento = cachedCalcularDiasParaVencimento(lote.dtaVencimento)
      const valorUnitario = lote.valor_vencimento || 0
      const valorTotal = valorUnitario * lote.quantidade
      return diasParaVencimento <= 15 && valorTotal > 500 // Mais de R$ 500 e vence em 15 dias
    })
    
    if (produtosAltoValorProximosVencimento.length > 0) {
      return 'erro'
    }
    
    // Verificar se há produtos próximos do vencimento sem saída recente
    const produtosProximosVencimento = lotes.filter(lote => {
      const diasParaVencimento = cachedCalcularDiasParaVencimento(lote.dtaVencimento)
      return diasParaVencimento <= 30 && lote.dias_sem_venda > 15
    })
    
    if (produtosProximosVencimento.length > 0) {
      // Alerta se valor total em risco for significativo
      if (valorTotalEmRisco > 2000) { // Mais de R$ 2.000 em risco
        return 'erro'
      }
      return 'alerta'
    }
    
    // Verificar concentração de valor em lotes antigos
    const loteMaisAntigo = lotesOrdenados[0]
    const valorLoteMaisAntigo = (loteMaisAntigo.valor_vencimento || 0) * loteMaisAntigo.quantidade
    const valorTotalEstoque = lotes.reduce((total, lote) => 
      total + (lote.valor_vencimento || 0) * lote.quantidade, 0
    )
    
    if (valorTotalEstoque > 0 && (valorLoteMaisAntigo / valorTotalEstoque) > 0.6) {
      // Mais de 60% do valor concentrado no lote mais antigo
      const diasLoteMaisAntigo = calcularDiasParaVencimento(loteMaisAntigo.dtaVencimento)
      if (diasLoteMaisAntigo <= 45) {
        return 'alerta'
      }
    }
    
    // Verificar rentabilidade negativa em produtos próximos ao vencimento
    const produtosRentabilidadeNegativa = lotes.filter(lote => {
      const diasParaVencimento = calcularDiasParaVencimento(lote.dtaVencimento)
      return diasParaVencimento <= 60 && (lote.rentabilidade || 0) < 0
    })
    
    if (produtosRentabilidadeNegativa.length > 0) {
      return 'alerta'
    }
    
    return 'ok'
  }, [calcularDiasParaVencimento])

  const calcularPVPSRecomendado = useCallback((lotes: ValidadeItem[]): string => {
    if (lotes.length === 0) return ''
    
    const lotesOrdenados = lotes
      .sort((a, b) => calcularDiasParaVencimento(a.dtaVencimento) - calcularDiasParaVencimento(b.dtaVencimento))
    
    const lotePVPS = lotesOrdenados[0]
    const diasParaVencimento = calcularDiasParaVencimento(lotePVPS.dtaVencimento)
    const valorTotal = (lotePVPS.valor_vencimento || 0) * lotePVPS.quantidade
    const rentabilidade = lotePVPS.rentabilidade || 0
    
    // Calcular valor total em risco para todos os lotes
    const valorTotalEmRisco = lotes.reduce((total, lote) => {
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      if (dias <= 30) {
        return total + (lote.valor_vencimento || 0) * lote.quantidade
      }
      return total
    }, 0)
    
    if (diasParaVencimento < 0) {
      if (valorTotal > 1000) {
        return `🚨 VENCIDO - Perda de R$ ${valorTotal.toFixed(2)} - RETIRAR IMEDIATAMENTE`
      }
      return 'VENCIDO - Retirar imediatamente'
    } else if (diasParaVencimento <= 7) {
      if (valorTotal > 500) {
        return `🔥 URGENTE - R$ ${valorTotal.toFixed(2)} em risco - ${diasParaVencimento} dias`
      }
      return `URGENTE - ${diasParaVencimento} dias para vencer`
    } else if (diasParaVencimento <= 30) {
      if (valorTotal > 1000) {
        return `⚠️ ALTO VALOR - R$ ${valorTotal.toFixed(2)} - ${diasParaVencimento} dias`
      }
      return `Prioridade - ${diasParaVencimento} dias (${lotePVPS.dtaVencimento})`
    } else if (diasParaVencimento <= 60) {
      if (rentabilidade < 0) {
        return `📉 PREJUÍZO - Rentabilidade negativa - ${diasParaVencimento} dias`
      }
      return `${lotePVPS.dtaVencimento} (${diasParaVencimento} dias)`
    } else {
      return `${lotePVPS.dtaVencimento} (${diasParaVencimento} dias)`
    }
  }, [calcularDiasParaVencimento])

  const gerarRecomendacoes = useCallback((analise: AnaliseValidade): string[] => {
    const recomendacoes: string[] = []
    
    // Análise de produtos vencidos com valor financeiro
    if (analise.produtosVencidos > 0) {
      const valorVencidos = analise.lotes
        .filter(lote => calcularDiasParaVencimento(lote.dtaVencimento) < 0)
        .reduce((total, lote) => total + (lote.valor_vencimento || 0) * lote.quantidade, 0)
      
      if (valorVencidos > 5000) {
        recomendacoes.push(`🚨🚨 EMERGÊNCIA FINANCEIRA - R$ ${valorVencidos.toFixed(2)} em perdas - AÇÃO IMEDIATA`)
      } else if (valorVencidos > 1000) {
        recomendacoes.push(`🚨 PERDA FINANCEIRA CRÍTICA - R$ ${valorVencidos.toFixed(2)} em produtos vencidos - REMOVER IMEDIATAMENTE`)
      } else {
        recomendacoes.push(`🚨 ${analise.produtosVencidos} produto(s) vencido(s) - REMOVER IMEDIATAMENTE`)
      }
    }
    
    // Análise de estoque parado
    if (analise.estoqueParado > 0) {
      const valorParado = analise.lotes
        .filter(lote => lote.dias_sem_venda > 30)
        .reduce((total, lote) => total + (lote.valor_vencimento || 0) * lote.quantidade, 0)
      
      if (valorParado > 2000) {
        recomendacoes.push(`💸 ESTOQUE PARADO CRÍTICO - R$ ${valorParado.toFixed(2)} imobilizado há +30 dias`)
      } else {
        recomendacoes.push(`⚠️ ${analise.estoqueParado} produto(s) parado(s) há mais de 30 dias sem venda`)
      }
    }
    
    // Análise de problemas FIFO
    if (analise.statusFIFO === 'erro') {
      recomendacoes.push('❌ ERRO FIFO - Ordem de venda incorreta pode causar perdas')
    } else if (analise.statusFIFO === 'alerta') {
      recomendacoes.push('⚡ ALERTA FIFO - Risco de vencimento por ordem incorreta')
    }
    
    // Análise de risco de validade
    if (analise.riscoValidade === 'Vencido') {
      recomendacoes.push('🔥 PRODUTO VENCIDO - Remoção imediata obrigatória')
    } else if (analise.riscoValidade === 'Crítico') {
      recomendacoes.push('🔥 Risco crítico de perda - ação imediata necessária')
    } else if (analise.riscoValidade === 'Alto') {
      recomendacoes.push('📅 Alta prioridade para venda - vencimento próximo')
    } else if (analise.riscoValidade === 'Normal') {
      recomendacoes.push('📊 Risco normal - manter monitoramento')
    }
    
    // Adicionar recomendações financeiras
    const valorTotalEstoque = analise.lotes.reduce((total, lote) => 
      total + (lote.valor_vencimento || 0) * lote.quantidade, 0
    )
    
    const valorEmRisco = analise.lotes.reduce((total, lote) => {
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      if (dias <= 30) {
        return total + (lote.valor_vencimento || 0) * lote.quantidade
      }
      return total
    }, 0)
    
    if (valorEmRisco > 5000) {
      recomendacoes.push(`💰 ALTO RISCO FINANCEIRO - R$ ${valorEmRisco.toFixed(2)} em risco de vencimento nos próximos 30 dias`)
    } else if (valorEmRisco > 1000) {
      recomendacoes.push(`⚠️ Risco financeiro moderado - R$ ${valorEmRisco.toFixed(2)} em produtos próximos ao vencimento`)
    }
    
    // Verificar produtos de alto valor
    const produtosAltoValor = analise.lotes.filter(lote => {
      const valorTotal = (lote.valor_vencimento || 0) * lote.quantidade
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      return valorTotal > 1000 && dias <= 15
    })
    
    if (produtosAltoValor.length > 0) {
      const valorTotalAltoValor = produtosAltoValor.reduce((total, lote) => 
        total + (lote.valor_vencimento || 0) * lote.quantidade, 0
      )
      recomendacoes.push(`🎯 PRIORIDADE MÁXIMA - R$ ${valorTotalAltoValor.toFixed(2)} em produtos de alto valor vencendo em até 15 dias`)
    }
    
    // Verificar rentabilidade negativa
    const produtosRentabilidadeNegativa = analise.lotes.filter(lote => 
      (lote.rentabilidade || 0) < 0 && calcularDiasParaVencimento(lote.dtaVencimento) <= 60
    )
    
    if (produtosRentabilidadeNegativa.length > 0) {
      recomendacoes.push(`📉 ATENÇÃO - ${produtosRentabilidadeNegativa.length} lote(s) com rentabilidade negativa próximos ao vencimento`)
    }
    
    // Recomendação para concentração de valor
    if (analise.lotes.length > 1) {
      const loteMaisAntigo = analise.lotes.reduce((maisAntigo, lote) => 
        calcularDiasParaVencimento(lote.dtaVencimento) < calcularDiasParaVencimento(maisAntigo.dtaVencimento) ? lote : maisAntigo
      )
      
      const valorLoteMaisAntigo = (loteMaisAntigo.valor_vencimento || 0) * loteMaisAntigo.quantidade
      const concentracao = valorTotalEstoque > 0 ? (valorLoteMaisAntigo / valorTotalEstoque) * 100 : 0
      
      if (concentracao > 60) {
        recomendacoes.push(`📊 ALTA CONCENTRAÇÃO - ${concentracao.toFixed(1)}% do valor concentrado no lote mais antigo`)
      }
    }
    
    if (analise.diasParaVencimento > 0 && analise.diasParaVencimento <= 60) {
      recomendacoes.push(`🎯 Considerar promoção em ${analise.diasParaVencimento} dias`)
    }
    
    // Análise de sazonalidade e padrões
    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    const produtosEstacao = analise.lotes.filter(lote => {
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      // Verificar se vence em meses de alta demanda (fim de ano, festas, etc.)
      return dias > 0 && dias <= 90
    })
    
    if (produtosEstacao.length > 0 && (mesAtual === 10 || mesAtual === 11)) {
      recomendacoes.push(`🎄 OPORTUNIDADE DE FIM DE ANO - ${produtosEstacao.length} lote(s) podem ter alta demanda sazonal`)
    }
    
    // Análise de idade do estoque
    const produtosIdosos = analise.lotes.filter(lote => lote.idade > 180) // Mais de 6 meses
    if (produtosIdosos.length > 0) {
      const valorIdosos = produtosIdosos.reduce((total, lote) => 
        total + (lote.valor_vencimento || 0) * lote.quantidade, 0
      )
      recomendacoes.push(`⏳ ESTOQUE ENVELHECIDO - R$ ${valorIdosos.toFixed(2)} em produtos com +180 dias de armazenagem`)
    }
    
    // Análise de turnover
    const produtosBaixoTurnover = analise.lotes.filter(lote => lote.dias_sem_venda > 60)
    if (produtosBaixoTurnover.length > 0) {
      recomendacoes.push(`🐌 BAIXO TURNOVER - ${produtosBaixoTurnover.length} lote(s) sem venda há +60 dias - revisar necessidade`)
    }
    
    // Alerta para produtos com validade muito curta
    const produtosValidadeCurta = analise.lotes.filter(lote => {
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      return dias > 0 && dias <= 7 && lote.quantidade > 10
    })
    
    if (produtosValidadeCurta.length > 0) {
      recomendacoes.push(`⚡ VALIDADE URGENTE - ${produtosValidadeCurta.length} lote(s) vencendo em até 7 dias com quantidade elevada`)
    }
    
    return recomendacoes
  }, [calcularDiasParaVencimento])

  const calcularScoreRisco = useCallback((analise: AnaliseValidade): number => {
    let score = 0
    
    // Produtos vencidos (máximo gravidade)
    if (analise.produtosVencidos > 0) {
      score += 50
      // Aumentar score baseado no valor financeiro dos produtos vencidos
      const valorVencidos = analise.lotes
        .filter(lote => calcularDiasParaVencimento(lote.dtaVencimento) < 0)
        .reduce((total, lote) => total + (lote.valor_vencimento || 0) * lote.quantidade, 0)
      if (valorVencidos > 5000) score += 20
      else if (valorVencidos > 1000) score += 10
    }
    
    // Risco de validade
    switch (analise.riscoValidade) {
      case 'Vencido': score += 50; break
      case 'Crítico': score += 40; break
      case 'Alto': score += 25; break
      case 'Normal': score += 0; break
    }
    
    // Status FIFO
    switch (analise.statusFIFO) {
      case 'erro': score += 30; break
      case 'alerta': score += 15; break
      case 'ok': score += 0; break
    }
    
    // Estoque parado
    if (analise.estoqueParado > 0) score += Math.min(analise.estoqueParado * 2, 20)
    
    // Dias para vencimento
    if (analise.diasParaVencimento < 0) score += 20
    else if (analise.diasParaVencimento <= 7) score += 15
    else if (analise.diasParaVencimento <= 30) score += 10
    
    // Fatores financeiros adicionais
    const valorTotalEstoque = analise.lotes.reduce((total, lote) => 
      total + (lote.valor_vencimento || 0) * lote.quantidade, 0
    )
    
    // Valor em risco nos próximos 30 dias
    const valorEmRisco = analise.lotes.reduce((total, lote) => {
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      if (dias <= 30) {
        return total + (lote.valor_vencimento || 0) * lote.quantidade
      }
      return total
    }, 0)
    
    // Risco financeiro baseado no valor em risco
    if (valorEmRisco > 10000) score += 25
    else if (valorEmRisco > 5000) score += 20
    else if (valorEmRisco > 1000) score += 15
    else if (valorEmRisco > 500) score += 10
    
    // Produtos de alto valor próximo ao vencimento
    const produtosAltoValor = analise.lotes.filter(lote => {
      const valorTotal = (lote.valor_vencimento || 0) * lote.quantidade
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      return valorTotal > 1000 && dias <= 15
    })
    
    if (produtosAltoValor.length > 0) score += 15
    
    // Rentabilidade negativa
    const produtosRentabilidadeNegativa = analise.lotes.filter(lote => 
      (lote.rentabilidade || 0) < 0 && calcularDiasParaVencimento(lote.dtaVencimento) <= 60
    )
    
    if (produtosRentabilidadeNegativa.length > 0) score += 10
    
    // Concentração de valor
    if (analise.lotes.length > 1) {
      const loteMaisAntigo = analise.lotes.reduce((maisAntigo, lote) => 
        calcularDiasParaVencimento(lote.dtaVencimento) < calcularDiasParaVencimento(maisAntigo.dtaVencimento) ? lote : maisAntigo
      )
      
      const valorLoteMaisAntigo = (loteMaisAntigo.valor_vencimento || 0) * loteMaisAntigo.quantidade
      const concentracao = valorTotalEstoque > 0 ? (valorLoteMaisAntigo / valorTotalEstoque) * 100 : 0
      
      if (concentracao > 80) score += 15
      else if (concentracao > 60) score += 10
      else if (concentracao > 40) score += 5
    }
    
    // Critérios adicionais de risco
    
    // Idade do estoque (mais de 6 meses = risco)
    const produtosIdosos = analise.lotes.filter(lote => lote.idade > 180)
    if (produtosIdosos.length > 0) {
      const percentualIdosos = (produtosIdosos.length / analise.lotes.length) * 100
      if (percentualIdosos > 50) score += 20
      else if (percentualIdosos > 25) score += 15
      else if (percentualIdosos > 10) score += 10
    }
    
    // Baixo turnover (sem venda há +60 dias)
    const produtosBaixoTurnover = analise.lotes.filter(lote => lote.dias_sem_venda > 60)
    if (produtosBaixoTurnover.length > 0) {
      const percentualBaixoTurnover = (produtosBaixoTurnover.length / analise.lotes.length) * 100
      if (percentualBaixoTurnover > 30) score += 15
      else if (percentualBaixoTurnover > 15) score += 10
      else if (percentualBaixoTurnover > 5) score += 5
    }
    
    // Validade muito curta com quantidade elevada
    const produtosValidadeCurta = analise.lotes.filter(lote => {
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      return dias > 0 && dias <= 7 && lote.quantidade > 10
    })
    
    if (produtosValidadeCurta.length > 0) score += 10
    
    // Risco de sazonalidade inversa (produtos vencendo em baixa temporada)
    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    const produtosForaEstacao = analise.lotes.filter(lote => {
      const dias = calcularDiasParaVencimento(lote.dtaVencimento)
      // Considerar risco se vencer em meses de baixa demanda (janeiro-fevereiro)
      return dias > 0 && dias <= 60 && (mesAtual === 1 || mesAtual === 2)
    })
    
    if (produtosForaEstacao.length > 0) score += 8
    
    // Diversificação de risco (muitos lotes pequenos vs poucos lotes grandes)
    if (analise.lotes.length > 5) {
      const tamanhosLotes = analise.lotes.map(lote => lote.quantidade)
      const mediaLotes = tamanhosLotes.reduce((a, b) => a + b, 0) / tamanhosLotes.length
      const desvioPadrao = Math.sqrt(tamanhosLotes.reduce((sum, size) => sum + Math.pow(size - mediaLotes, 2), 0) / tamanhosLotes.length)
      const coeficienteVariacao = desvioPadrao / mediaLotes
      
      // Alta variação nos tamanhos dos lotes indica risco de gestão
      if (coeficienteVariacao > 1.5) score += 5
    }
    
    return Math.min(score, 100)
  }, [calcularDiasParaVencimento])

  // Cached version for better performance - cache based on analysis key properties
  const cachedCalcularScoreRisco = useCache(
    calcularScoreRisco,
    (analise: AnaliseValidade) => `score_${analise.codigo}_${analise.estoqueTotal}_${analise.produtosVencidos}_${analise.riscoValidade}`
  )

  const gerarTabelaValidade = useCallback((dados: ValidadeItem[]): TabelaValidadeItem[] => {
    // Gerar tabela final com cada lote tratado separadamente
    const tabela = dados.map((item, index) => {
      const diasParaVencer = cachedCalcularDiasParaVencimento(item.dtaVencimento)
      const risco = cachedDeterminarRiscoValidade(diasParaVencer)
      
      return {
        codigo: item.código,
        descricao: item.descricao || 'Sem descrição',
        embalagem: item.embalagem,
        dataVencimento: item.dtaVencimento,
        diasParaVencer,
        risco,
        quantidade: item.quantidade,
        recnum: `${item.recnum}-${item.código}-${item.dtaVencimento}-${index}`
      }
    })

    // Ordenar pelo maior risco primeiro (Vencido > Crítico > Alto > Normal)
    const ordemRisco = { 'Vencido': 0, 'Crítico': 1, 'Alto': 2, 'Normal': 3 }
    return tabela.sort((a, b) => {
      const ordemA = ordemRisco[a.risco]
      const ordemB = ordemRisco[b.risco]
      
      if (ordemA !== ordemB) {
        return ordemA - ordemB
      }
      
      // Se mesmo risco, ordenar por dias para vencer (mais urgente primeiro)
      return a.diasParaVencer - b.diasParaVencer
    })
  }, [calcularDiasParaVencimento, determinarRiscoValidade])

  // Função para filtrar itens HF (exceto ovos)
  const filtrarItensHF = useCallback((dados: ValidadeItem[]): ValidadeItem[] => {
    if (!filtroHabilitaFiltroHF) return dados
    
    return dados.filter(item => {
      const descricao = (item.descricao || '').toLowerCase()
      // Remover itens que começam com 'hf' exceto se contiver 'ovos'
      if (descricao.startsWith('hf')) {
        return descricao.includes('ovos')
      }
      return true
    })
  }, [filtroHabilitaFiltroHF])

  const processarDados = useCallback(() => {
    // Aplicar filtro HF primeiro nos dados brutos
    const dadosFiltrados = filtrarItensHF(validadeData)
    
    // Agrupar por código
    const agrupados = dadosFiltrados.reduce((acc, item) => {
      if (!item.código) return acc
      
      if (!acc[item.código]) {
        acc[item.código] = []
      }
      acc[item.código].push(item)
      return acc
    }, {} as Record<string, ValidadeItem[]>)

    // Gerar análises
    const novasAnalises: AnaliseValidade[] = Object.entries(agrupados).map(([codigo, lotes]) => {
      const estoqueTotal = lotes.reduce((total, lote) => total + lote.quantidade, 0)
      const diasParaVencimento = Math.min(...lotes.map(lote => cachedCalcularDiasParaVencimento(lote.dtaVencimento)))
      const produtosVencidos = lotes.filter(lote => cachedCalcularDiasParaVencimento(lote.dtaVencimento) < 0).length
      const estoqueParado = lotes.filter(lote => lote.dias_sem_venda > 30).length
      
      const riscoValidade = cachedDeterminarRiscoValidade(diasParaVencimento)
      const statusFIFO = determinarStatusFIFO(lotes)
      const pvpsRecomendado = calcularPVPSRecomendado(lotes)
      
      const analise: AnaliseValidade = {
        codigo,
        descricao: lotes[0]?.descricao || 'Sem descrição',
        lotes,
        estoqueTotal,
        riscoValidade,
        statusFIFO,
        diasParaVencimento,
        produtosVencidos,
        estoqueParado,
        pvpsRecomendado,
        recomendacoes: [],
        scoreRisco: 0
      }
      
      analise.recomendacoes = gerarRecomendacoes(analise)
      analise.scoreRisco = cachedCalcularScoreRisco(analise)
      
      return analise
    })

    setAnalises(novasAnalises)
    
    // Gerar tabela final com todos os lotes tratados separadamente
    const novaTabelaValidade = gerarTabelaValidade(dadosFiltrados)
    setTabelaValidade(novaTabelaValidade)
  }, [validadeData, filtrarItensHF, determinarStatusFIFO, calcularPVPSRecomendado, gerarRecomendacoes, gerarTabelaValidade]) // Removed cached functions from dependencies

  // Função para gerar relatório de impressão
  const gerarRelatorioImpressao = useCallback((tipo: 'completo' | 'criticos' | 'vencidos' | 'resumo' = 'completo') => {
    if (filteredData.length === 0) {
      alert('Não há dados para gerar relatório.')
      return
    }

    let dadosRelatorio = filteredData

    // Aplicar filtros específicos do tipo de relatório
    switch (tipo) {
      case 'criticos':
        dadosRelatorio = filteredData.filter(item => 
          item.riscoValidade === 'Crítico' || item.riscoValidade === 'Vencido'
        )
        break
      case 'vencidos':
        dadosRelatorio = filteredData.filter(item => 
          item.riscoValidade === 'Vencido'
        )
        break
      case 'resumo':
        // Para resumo, vamos incluir estatísticas
        break
    }

    const totalItens = dadosRelatorio.length
    const totalEstoque = dadosRelatorio.reduce((sum, item) => sum + item.estoqueTotal, 0)
    const totalVencidos = dadosRelatorio.filter(item => item.produtosVencidos > 0).length
    const totalErrosFIFO = dadosRelatorio.filter(item => item.statusFIFO === 'erro').length

    // Calcular valor financeiro em risco
    const valorEmRisco = dadosRelatorio.reduce((total, item) => {
      return total + item.lotes.reduce((somaLote, lote) => {
        const diasParaVencimento = calcularDiasParaVencimento(lote.dtaVencimento)
        if (diasParaVencimento <= 30) {
          return somaLote + ((lote.valor_vencimento || 0) * lote.quantidade)
        }
        return somaLote
      }, 0)
    }, 0)

    const conteudoRelatorio = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Análise de Validade - ${new Date().toLocaleDateString('pt-BR')}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
            background-color: #ffffff;
          }
          h1 { 
            color: #006633; 
            text-align: center; 
            margin-bottom: 20px;
            font-size: 18px;
          }
          h2 { 
            color: #006633; 
            font-size: 14px;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          .header-info {
            text-align: center;
            margin-bottom: 20px;
            font-size: 11px;
            color: #666;
          }
          .estatisticas {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .estatistica-card {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
            background-color: #f9f9f9;
          }
          .estatistica-valor {
            font-size: 16px;
            font-weight: bold;
            color: #006633;
          }
          .estatistica-label {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            font-size: 10px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px; 
            text-align: left;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
            position: sticky;
            top: 0;
          }
          .risco-vencido { background-color: #ffebee; color: #c62828; }
          .risco-critico { background-color: #fff3e0; color: #ef6c00; }
          .risco-alto { background-color: #fff8e1; color: #f57f17; }
          .risco-normal { background-color: #e8f5e8; color: #2e7d32; }
          .status-erro { background-color: #ffebee; color: #c62828; }
          .status-alerta { background-color: #fff3e0; color: #ef6c00; }
          .status-ok { background-color: #e8f5e8; color: #2e7d32; }
          .quebra-pagina { page-break-before: always; }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Relatório de Análise de Validade e Controle FIFO</h1>
        <div class="header-info">
          Gerado em: ${new Date().toLocaleString('pt-BR')}<br>
          Tipo: ${tipo === 'completo' ? 'Completo' : tipo === 'criticos' ? 'Críticos e Vencidos' : tipo === 'vencidos' ? 'Vencidos' : 'Resumo'}
        </div>

        ${tipo === 'resumo' ? `
        <div class="estatisticas">
          <div class="estatistica-card">
            <div class="estatistica-valor">${totalItens}</div>
            <div class="estatistica-label">Total de Itens</div>
          </div>
          <div class="estatistica-card">
            <div class="estatistica-valor">${totalEstoque}</div>
            <div class="estatistica-label">Estoque Total</div>
          </div>
          <div class="estatistica-card">
            <div class="estatistica-valor">${totalVencidos}</div>
            <div class="estatistica-label">Itens Vencidos</div>
          </div>
          <div class="estatistica-card">
            <div class="estatistica-valor">R$ ${valorEmRisco.toFixed(2)}</div>
            <div class="estatistica-label">Valor em Risco</div>
          </div>
        </div>
        ` : ''}

        ${tipo !== 'resumo' ? `
        <h2>Detalhe dos Produtos</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Embalagem</th>
              <th>Estoque</th>
              <th>Risco</th>
              <th>Status FIFO</th>
              <th>Dias Venc.</th>
              <th>Vencidos</th>
              <th>Score Risco</th>
              <th>PVPS Recomendado</th>
            </tr>
          </thead>
          <tbody>
            ${dadosRelatorio.map(item => `
              <tr>
                <td>${item.codigo}</td>
                <td>${item.descricao || 'Sem descrição'}</td>
                <td>${item.lotes?.[0]?.embalagem || 'N/A'}</td>
                <td>${item.estoqueTotal}</td>
                <td class="risco-${item.riscoValidade.toLowerCase()}">${item.riscoValidade}</td>
                <td class="status-${item.statusFIFO}">${item.statusFIFO}</td>
                <td>${item.diasParaVencimento}</td>
                <td>${item.produtosVencidos}</td>
                <td>${item.scoreRisco}/100</td>
                <td>${item.pvpsRecomendado}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </body>
      </html>
    `

    // Abrir em nova janela para impressão
    const novaJanela = window.open('', '_blank')
    if (novaJanela) {
      novaJanela.document.write(conteudoRelatorio)
      novaJanela.document.close()
      novaJanela.print()
    }
  }, [filteredData, calcularDiasParaVencimento])

  // Export data memoized for performance
  const exportData = useMemo(() => analises.map(item => ({
    'Código': item.codigo,
    'Descrição': item.descricao,
    'Estoque Total': item.estoqueTotal,
    'Risco Validade': item.riscoValidade,
    'Status FIFO': item.statusFIFO,
    'Dias para Vencimento': item.diasParaVencimento,
    'Produtos Vencidos': item.produtosVencidos,
    'Estoque Parado': item.estoqueParado,
    'PVPS Recomendado': item.pvpsRecomendado,
    'Score Risco': item.scoreRisco,
    'Recomendações': item.recomendacoes.join('; '),
    'Total Lotes': item.lotes.length
  })), [analises])

  const exportToExcel = useCallback(() => {

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AnaliseValidade')

    const fileName = `analise_validade_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }, [analises])

  const exportarAuditoria = useCallback(() => {
    const exportData = auditoriaProcessada.map(item => ({
      'Ordem': item.ordem,
      'Lote': item.lote,
      'Data Vencimento': item.dataVencimento,
      'Dias Restantes (Corrigido)': item.diasRestantesCorrigido,
      'Quantidade': item.quantidade,
      'Prioridade (Corrigida)': item.prioridadeCorrigida,
      'Status (Corrigido)': item.statusCorrigido,
      'Código': item.codigo || '',
      'Descrição': item.descricao || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AuditoriaValidade')
    const fileName = `auditoria_validade_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }, [auditoriaProcessada])

  // useEffects depois das definições das funções
  useEffect(() => {
    if (validadeData.length > 0) {
      processarDados()
    }
  }, [validadeData]) // Removed processarDados from dependencies to prevent infinite loop

  useEffect(() => {
    // Show searching state when user is typing
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchTerm, debouncedSearchTerm])

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'Vencido': return 'bg-red-100 text-red-800 border-red-200'
      case 'Crítico': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Alto': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Normal': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusFIFOColor = (status: string) => {
    switch (status) {
      case 'erro': return 'bg-red-100 text-red-800 border-red-200'
      case 'alerta': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ok': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAuditoriaStatusColor = (status: string) => {
    switch (status) {
      case 'Vencido': return 'bg-red-100 text-red-800 border-red-200'
      case 'Urgente': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Atenção': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Normal': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreRiscoColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Componente para o input de arquivo
  const FileInput = () => {
    const [isClient, setIsClient] = useState(false)
    
    useEffect(() => {
      setIsClient(true)
    }, [])
    
    if (!isClient) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-100 rounded-md border border-gray-300 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-100 rounded-md border border-gray-300 animate-pulse"></div>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <Tabs defaultValue="analise" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analise">Análise de Validade</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria de Validade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analise" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="file-upload-validade" className="sr-only">
                Upload de arquivo de Validade
              </Label>
              <Input
                id="file-upload-validade"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
                disabled={isProcessing}
              />
            </div>
            {validadeData.length > 0 && (
              <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Download className="h-4 w-4" />
                Exportar Análise
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="auditoria" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="file-upload-auditoria" className="sr-only">
                Upload de arquivo de Auditoria
              </Label>
              <Input
                id="file-upload-auditoria"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleAuditoriaFileUpload}
                className="cursor-pointer"
                disabled={isProcessing}
              />
            </div>
            {auditoriaProcessada.length > 0 && (
              <Button onClick={exportarAuditoria} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Download className="h-4 w-4" />
                Exportar Auditoria
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    )
  }

  // Estatísticas otimizadas com useMemo
  const totalProdutos = analises.length
  const produtosCriticos = useMemo(() => analises.filter(a => a.riscoValidade === 'Crítico').length, [analises])
  const produtosAltoRisco = useMemo(() => analises.filter(a => a.riscoValidade === 'Alto').length, [analises])
  const produtosComErroFIFO = useMemo(() => analises.filter(a => a.statusFIFO === 'erro').length, [analises])
  const totalVencidos = useMemo(() => analises.reduce((total, a) => total + a.produtosVencidos, 0), [analises])

  // Memoização para dados de tabela para melhor performance de renderização
  // Ordenar por risco (Crítico > Vencido > Alto > Normal) e depois por dias para vencer
  const tabelaValidadeMemoized = useMemo(() => {
    const riscoOrder = { 'Crítico': 0, 'Vencido': 1, 'Alto': 2, 'Normal': 3 }
    return [...tabelaValidade].sort((a, b) => {
      const riscoA = riscoOrder[a.risco] || 4
      const riscoB = riscoOrder[b.risco] || 4
      if (riscoA !== riscoB) {
        return riscoA - riscoB
      }
      return a.diasParaVencer - b.diasParaVencer
    })
  }, [tabelaValidade])
  const auditoriaProcessadaMemoized = useMemo(() => auditoriaProcessada, [auditoriaProcessada])

  // Memoização para funções de renderização custosas
  const renderTabelaValidade = useMemo(() => {
    return tabelaValidadeMemoized.map((item, index) => (
      <tr key={`${item.recnum}-${item.codigo}-${index}`} className="hover:bg-gray-50">
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
          {item.codigo}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
          <div className="truncate" title={item.descricao}>
            {item.descricao}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
          <div className="truncate" title={item.embalagem || ''}>
            {item.embalagem || 'N/A'}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
          {item.dataVencimento}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
          <span className={item.diasParaVencer < 0 ? 'text-red-600 font-bold' : ''}>
            {item.diasParaVencer < 0 ? `Vencido há ${Math.abs(item.diasParaVencer)} dias` : 
             item.diasParaVencer === 0 ? 'Vence hoje' :
             `${item.diasParaVencer} dias`}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
          <Badge className={getRiscoColor(item.risco)}>
            {item.risco}
          </Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
          {item.quantidade}
        </td>
      </tr>
    ))
  }, [tabelaValidadeMemoized, getRiscoColor])

  const renderAuditoriaProcessada = useMemo(() => {
    return auditoriaProcessadaMemoized.map((item, index) => (
      <tr key={`${item.lote}-${item.ordem}-${item.codigo}-${index}`} className="hover:bg-gray-50">
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
          <Badge className="bg-gray-100 text-gray-800">
            #{item.ordem}
          </Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
          {item.lote}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
          {item.dataVencimento}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
          <span className={(item.diasRestantesCorrigido || 0) < 0 ? 'text-red-600 font-bold' : ''}>
            {(item.diasRestantesCorrigido || 0) < 0 ? `Vencido há ${Math.abs(item.diasRestantesCorrigido || 0)} dias` : 
             (item.diasRestantesCorrigido || 0) === 0 ? 'Vence hoje' :
             `${item.diasRestantesCorrigido} dias`}
          </span>
          {item.diasRestantes !== item.diasRestantesCorrigido && (
            <div className="text-xs text-orange-600">
              (Original: {item.diasRestantes})
            </div>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
          {item.quantidade}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
          <Badge className="bg-blue-100 text-blue-800">
            {item.prioridadeCorrigida}
          </Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
          <Badge className={getAuditoriaStatusColor(item.statusCorrigido || '')}>
            {item.statusCorrigido}
          </Badge>
          {item.status !== item.statusCorrigido && (
            <div className="text-xs text-orange-600 mt-1">
              (Original: {item.status})
            </div>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedAuditoria(item)}
            className="gap-1"
          >
            <Eye className="h-3 w-3" />
            Ver
          </Button>
        </td>
      </tr>
    ))
  }, [auditoriaProcessadaMemoized, getAuditoriaStatusColor])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Análise de Validade e Controle FIFO
          </CardTitle>
          <CardDescription>
            Análise inteligente de validade de produtos com detecção de inconsistências e recomendações PVPS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileInput />
        </CardContent>
      </Card>

      {isProcessing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processando arquivo e analisando dados de validade...
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="analise" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analise">Análise de Validade</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria de Validade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analise">
          {validadeData.length > 0 && (
            <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-green-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalProdutos}</div>
                  <div className="text-sm font-medium text-gray-600">Produtos Analisados</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{produtosCriticos}</div>
                  <div className="text-sm font-medium text-gray-600">Risco Crítico</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{produtosAltoRisco}</div>
                  <div className="text-sm font-medium text-gray-600">Alto Risco</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{produtosComErroFIFO}</div>
                  <div className="text-sm font-medium text-gray-600">Erro FIFO</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-800">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-800">{totalVencidos}</div>
                  <div className="text-sm font-medium text-gray-600">Produtos Vencidos</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="riscoFilter">Risco de Validade</Label>
                  <Select value={filtroRisco} onValueChange={setFiltroRisco}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                      <SelectItem value="Crítico">Crítico</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusFilter">Status FIFO</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ok">OK</SelectItem>
                      <SelectItem value="alerta">Alerta</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Código ou descrição"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="filtroHF">Filtro HF</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <input
                      type="checkbox"
                      id="filtroHF"
                      checked={filtroHabilitaFiltroHF}
                      onChange={(e) => setFiltroHabilitaFiltroHF(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600">Excluir HF (exceto ovos)</span>
                  </div>
                </div>
                <div>
                  <Label>Relatórios</Label>
                  <Select value={relatorioTipo} onValueChange={(value: any) => setRelatorioTipo(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completo">Completo</SelectItem>
                      <SelectItem value="criticos">Críticos</SelectItem>
                      <SelectItem value="vencidos">Vencidos</SelectItem>
                      <SelectItem value="resumo">Resumo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={() => gerarRelatorioImpressao(relatorioTipo)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Análise de Validade e Controle FIFO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Análise de Validade e Controle FIFO</CardTitle>
              <CardDescription>
                Visão consolidada da análise de validade e controle FIFO por produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto optimized-scrollbar">
                <table className="w-full min-w-full table-auto">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Embalagem</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risco</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FIFO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dias Venc.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencidos</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Uso Vida</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rentabilidade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PVPS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr key={`${item.codigo}-${item.recnum}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={item.descricao}>
                            {item.descricao}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={item.lotes?.[0]?.embalagem || ''}>
                            {item.lotes?.[0]?.embalagem || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {item.estoqueTotal}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <Badge className={`text-xs ${getRiscoColor(item.riscoValidade)}`}>
                            {item.riscoValidade}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <Badge className={`text-xs ${getStatusFIFOColor(item.statusFIFO)}`}>
                            {item.statusFIFO}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          <span className={item.diasParaVencimento < 0 ? 'text-red-600' : item.diasParaVencimento <= 30 ? 'text-orange-600' : 'text-gray-600'}>
                            {item.diasParaVencimento}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {item.produtosVencidos > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {item.produtosVencidos}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {Math.max(...item.lotes.map(lote => lote.idade), 0)} dias
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {item.lotes.length > 0 && (
                            <span className={item.lotes[0].perc_uso > 80 ? 'text-red-600' : item.lotes[0].perc_uso > 60 ? 'text-orange-600' : 'text-gray-600'}>
                              {item.lotes[0].perc_uso}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                          {item.lotes.length > 0 && (
                            <span className={(item.lotes[0].rentabilidade || 0) < 0 ? 'text-red-600' : (item.lotes[0].rentabilidade || 0) > 0 ? 'text-green-600' : 'text-gray-600'}>
                              {(item.lotes[0].rentabilidade || 0).toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center font-bold">
                          <span className={getScoreRiscoColor(item.scoreRisco)}>
                            {item.scoreRisco}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={item.pvpsRecomendado}>
                            {item.pvpsRecomendado}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAnalise(item)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

  
        {/* Tabela Final de Validade - Estilo Simplificado */}
          {tabelaValidade.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800">Relatório de Análise de Validade</CardTitle>
                <CardDescription>
                  Tabela final com todos os lotes ordenados por risco (Data de referência: 11/08/2025)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto optimized-scrollbar">
                  <table className="w-full min-w-full table-auto">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Embalagem</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Vencimento</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dias Restantes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível de Risco</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tabelaValidadeMemoized.map((item, index) => (
                        <tr key={`${item.recnum}-${item.codigo}-${item.dataVencimento}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={item.descricao}>
                              {item.descricao}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={item.embalagem || ''}>
                              {item.embalagem || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.dataVencimento}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <Badge className={`text-xs ${
                              item.diasParaVencer < 0 
                                ? 'bg-red-100 text-red-800' 
                                : item.diasParaVencer === 0 
                                ? 'bg-orange-100 text-orange-800' 
                                : item.diasParaVencer <= 30 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.diasParaVencer < 0 ? `Vencido há ${Math.abs(item.diasParaVencer)} dias` : 
                               item.diasParaVencer === 0 ? 'Vence hoje' :
                               `${item.diasParaVencer} dias`}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <Badge className={`text-xs ${
                              item.risco === 'Crítico' 
                                ? 'bg-red-100 text-red-800' 
                                : item.risco === 'Vencido' 
                                ? 'bg-red-100 text-red-800' 
                                : item.risco === 'Alto' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.risco}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            {item.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
        </TabsContent>
        
        <TabsContent value="auditoria">
          {auditoriaProcessada.length > 0 && (
            <>
              {/* Estatísticas de Auditoria */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-red-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {auditoriaProcessada.filter(a => a.statusCorrigido === 'Vencido').length}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Produtos Vencidos</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {auditoriaProcessada.filter(a => a.statusCorrigido === 'Urgente').length}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Urgentes</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {auditoriaProcessada.filter(a => a.statusCorrigido === 'Atenção').length}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Requerem Atenção</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {auditoriaProcessada.filter(a => a.statusCorrigido === 'Normal').length}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Normais</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Auditoria Corrigida - Otimizada com Paginação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-800">Tabela de Auditoria de Validade</CardTitle>
                  <CardDescription>
                    Tabela corrigida e ordenada com base na data atual do sistema - Otimizada com paginação para melhor performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaginatedTable
                    data={auditoriaProcessadaMemoized}
                    columns={[
                      {
                        key: 'ordem' as keyof AuditoriaValidadeItem,
                        header: 'Ordem',
                        render: (value: number) => (
                          <Badge className="bg-gray-100 text-gray-800">
                            #{value}
                          </Badge>
                        )
                      },
                      {
                        key: 'lote' as keyof AuditoriaValidadeItem,
                        header: 'Lote',
                        className: 'font-medium text-gray-900'
                      },
                      {
                        key: 'dataVencimento' as keyof AuditoriaValidadeItem,
                        header: 'Data Vencimento'
                      },
                      {
                        key: 'diasRestantesCorrigido' as keyof AuditoriaValidadeItem,
                        header: 'Dias Restantes (corrigido)',
                        render: (value: number, item: AuditoriaValidadeItem) => (
                          <div>
                            <span className={(value || 0) < 0 ? 'text-red-600 font-bold' : ''}>
                              {(value || 0) < 0 ? `Vencido há ${Math.abs(value || 0)} dias` : 
                               (value || 0) === 0 ? 'Vence hoje' :
                               `${value} dias`}
                            </span>
                            {item.diasRestantes !== value && (
                              <div className="text-xs text-orange-600">
                                (Original: {item.diasRestantes})
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'quantidade' as keyof AuditoriaValidadeItem,
                        header: 'Quantidade'
                      },
                      {
                        key: 'prioridadeCorrigida' as keyof AuditoriaValidadeItem,
                        header: 'Prioridade (corrigida)',
                        render: (value: number) => (
                          <Badge className="bg-blue-100 text-blue-800">
                            {value}
                          </Badge>
                        )
                      },
                      {
                        key: 'statusCorrigido' as keyof AuditoriaValidadeItem,
                        header: 'Status (corrigido)',
                        render: (value: string, item: AuditoriaValidadeItem) => (
                          <div>
                            <Badge className={getAuditoriaStatusColor(value || '')}>
                              {value}
                            </Badge>
                            {item.status !== value && (
                              <div className="text-xs text-orange-600 mt-1">
                                (Original: {item.status})
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'lote' as keyof AuditoriaValidadeItem,
                        header: 'Ações',
                        render: (value: any, item: AuditoriaValidadeItem) => (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAuditoria(item)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                        )
                      }
                    ]}
                    itemsPerPage={30}
                    className="border rounded-lg"
                    getKey={(item) => `${item.lote}-${item.ordem}-${item.dataVencimento}`}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Análise */}
      <Dialog open={!!selectedAnalise} onOpenChange={() => setSelectedAnalise(null)}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-hidden p-0" style={{ '--container-lg': '120rem' } as React.CSSProperties}>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-bold text-green-900">
              Análise Detalhada - {selectedAnalise?.codigo}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Análise completa de validade e controle FIFO para este produto
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnalise && (
            <div className="flex flex-col h-[calc(85vh-80px)] overflow-hidden">
              {/* Conteúdo com scroll interno */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="space-y-4">
                  {/* Informações Principais - Grid Responsivo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg border min-w-0">
                      <div className="text-lg font-bold text-green-800 truncate">{selectedAnalise.codigo}</div>
                      <div className="text-xs text-gray-600">Código</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border min-w-0">
                      <div className="text-lg font-bold text-blue-800">{selectedAnalise.estoqueTotal}</div>
                      <div className="text-xs text-gray-600">Estoque Total</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg border min-w-0">
                      <div className={`text-lg font-bold ${getScoreRiscoColor(selectedAnalise.scoreRisco).replace('text-', 'bg-').replace('600', '100')}`}>
                        {selectedAnalise.scoreRisco}
                      </div>
                      <div className="text-xs text-gray-600">Score Risco</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg border min-w-0">
                      <Badge className={`text-xs ${getRiscoColor(selectedAnalise.riscoValidade)}`}>
                        {selectedAnalise.riscoValidade}
                      </Badge>
                      <div className="text-xs text-gray-600 mt-1">Risco</div>
                    </div>
                  </div>

                  {/* PVPS Recomendado */}
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="text-sm font-medium text-indigo-800 mb-1">PVPS Recomendado</div>
                    <p className="text-base font-bold text-indigo-900 text-sm">{selectedAnalise.pvpsRecomendado}</p>
                  </div>

                  {/* Recomendações */}
                  {selectedAnalise.recomendacoes.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800 mb-2">Recomendações</div>
                      <ul className="space-y-1">
                        {selectedAnalise.recomendacoes.map((rec, index) => (
                          <li key={`${rec}-${index}`} className="text-xs text-yellow-700">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Análise FIFO - Tabela Responsiva */}
                  <div className="border rounded-lg">
                    <div className="p-3 bg-gray-50 border-b">
                      <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Análise FIFO - Ordem Recomendada de Venda
                      </div>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
                      <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase w-[10%]">Ordem</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase w-[15%]">Lote</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase w-[20%]">Vencimento</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase w-[15%]">Dias Rest.</th>
                            <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 uppercase w-[15%]">Quantidade</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase w-[12%]">Prioridade</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase w-[13%]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analisarFIFO(selectedAnalise.lotes).map((lote, index) => (
                            <tr key={`${lote.codigo}-${lote.lote}-${index}`} className="hover:bg-gray-50">
                              <td className="px-2 py-2 text-center font-medium">
                                <Badge className={lote.ordemRecomendada === 1 ? "bg-red-100 text-red-800 text-xs" : "bg-gray-100 text-gray-800 text-xs"}>
                                  #{lote.ordemRecomendada}
                                </Badge>
                              </td>
                              <td className="px-2 py-2 text-gray-900 font-mono text-xs truncate">{lote.lote}</td>
                              <td className="px-2 py-2 text-gray-900 font-medium text-xs">{lote.dataVencimento}</td>
                              <td className="px-2 py-2 text-center">
                                <span className={`inline-block px-1 py-0.5 rounded text-xs font-bold ${lote.diasParaVencimento < 0 ? 'bg-red-100 text-red-800' : lote.diasParaVencimento <= 30 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                  {lote.diasParaVencimento}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right font-medium text-xs">{lote.quantidade.toLocaleString()}</td>
                              <td className="px-2 py-2 text-center">
                                {lote.deveSerVendidoPrimeiro ? (
                                  <Badge className="bg-red-100 text-red-800 text-xs">URGENTE</Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">Normal</Badge>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {lote.diasParaVencimento < 0 ? (
                                  <Badge className="bg-red-100 text-red-800 text-xs">Vencido</Badge>
                                ) : lote.diasParaVencimento <= 7 ? (
                                  <Badge className="bg-orange-100 text-orange-800 text-xs">Urgente</Badge>
                                ) : lote.diasParaVencimento <= 30 ? (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Atenção</Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 text-xs">OK</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Auditoria */}
      <Dialog open={!!selectedAuditoria} onOpenChange={() => setSelectedAuditoria(null)}>
        <DialogContent className="w-[95vw] max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              Detalhes da Auditoria - Lote {selectedAuditoria?.lote}
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas da auditoria de validade para este lote
            </DialogDescription>
          </DialogHeader>
          
          {selectedAuditoria && (
            <div className="space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-800">{selectedAuditoria.lote}</div>
                  <div className="text-sm text-gray-600">Lote</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-800">{selectedAuditoria.dataVencimento}</div>
                  <div className="text-sm text-gray-600">Data de Vencimento</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-800">{selectedAuditoria.quantidade}</div>
                  <div className="text-sm text-gray-600">Quantidade</div>
                </div>
              </div>

              {/* Análise de Dias Restantes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800">Análise de Dias Restantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor Original:</span>
                        <span className="font-medium">{selectedAuditoria.diasRestantes} dias</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor Corrigido:</span>
                        <span className={`font-bold ${(selectedAuditoria.diasRestantesCorrigido || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {(selectedAuditoria.diasRestantesCorrigido || 0) < 0 ? `Vencido há ${Math.abs(selectedAuditoria.diasRestantesCorrigido || 0)} dias` : 
                           (selectedAuditoria.diasRestantesCorrigido || 0) === 0 ? 'Vence hoje' :
                           `${selectedAuditoria.diasRestantesCorrigido} dias`}
                        </span>
                      </div>
                      {selectedAuditoria.diasRestantes !== selectedAuditoria.diasRestantesCorrigido && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          ⚠️ Cálculo corrigido pelo auditor
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Status e Prioridade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status Original:</span>
                        <Badge className="bg-gray-100 text-gray-800">{selectedAuditoria.status}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status Corrigido:</span>
                        <Badge className={getAuditoriaStatusColor(selectedAuditoria.statusCorrigido || '')}>
                          {selectedAuditoria.statusCorrigido}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Prioridade Corrigida:</span>
                        <Badge className="bg-blue-100 text-blue-800">#{selectedAuditoria.prioridadeCorrigida}</Badge>
                      </div>
                      {selectedAuditoria.status !== selectedAuditoria.statusCorrigido && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          ⚠️ Status atualizado pelo auditor
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Informações Adicionais */}
              {(selectedAuditoria.codigo || selectedAuditoria.descricao) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-800">Informações Adicionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedAuditoria.codigo && (
                        <div>
                          <span className="text-sm text-gray-600">Código:</span>
                          <div className="font-medium">{selectedAuditoria.codigo}</div>
                        </div>
                      )}
                      {selectedAuditoria.descricao && (
                        <div>
                          <span className="text-sm text-gray-600">Descrição:</span>
                          <div className="font-medium">{selectedAuditoria.descricao}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recomendações do Auditor */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Recomendações do Auditor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(selectedAuditoria.statusCorrigido === 'Vencido') && (
                      <div className="p-3 bg-red-50 border-l-4 border-red-500">
                        <p className="text-sm text-red-800">
                          🚨 <strong>PRODUTO VENCIDO</strong> - Remover imediatamente do estoque. 
                          Produto fora do prazo de validade há {Math.abs(selectedAuditoria.diasRestantesCorrigido || 0)} dias.
                        </p>
                      </div>
                    )}
                    
                    {(selectedAuditoria.statusCorrigido === 'Urgente') && (
                      <div className="p-3 bg-orange-50 border-l-4 border-orange-500">
                        <p className="text-sm text-orange-800">
                          ⚡ <strong>URGENTE</strong> - Produto vence em {(selectedAuditoria.diasRestantesCorrigido || 0)} dias. 
                          Prioridade máxima para venda ou remoção.
                        </p>
                      </div>
                    )}
                    
                    {(selectedAuditoria.statusCorrigido === 'Atenção') && (
                      <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500">
                        <p className="text-sm text-yellow-800">
                          ⚠️ <strong>REQUER ATENÇÃO</strong> - Produto vence em {(selectedAuditoria.diasRestantesCorrigido || 0)} dias. 
                          Monitorar e planejar ação preventiva.
                        </p>
                      </div>
                    )}
                    
                    {(selectedAuditoria.statusCorrigido === 'Normal') && (
                      <div className="p-3 bg-green-50 border-l-4 border-green-500">
                        <p className="text-sm text-green-800">
                          ✅ <strong>NORMAL</strong> - Produto com prazo de validade adequado. 
                          Manter monitoramento regular.
                        </p>
                      </div>
                    )}

                    {selectedAuditoria.diasRestantes !== selectedAuditoria.diasRestantesCorrigido && (
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-500">
                        <p className="text-sm text-blue-800">
                          🔍 <strong>CORREÇÃO REALIZADA</strong> - O cálculo original de dias restantes 
                          ({selectedAuditoria.diasRestantes} dias) foi corrigido para 
                          {(selectedAuditoria.diasRestantesCorrigido || 0)} dias com base na data atual do sistema.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}