'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OptimizedLoading, TableLoading } from '@/components/ui/optimized-loading'
import { LazyTab } from '@/components/lazy-component'
import { useDebounce, useThrottle } from '@/hooks/use-debounce'
import { 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  BarChart3,
  Eye,
  Download,
  Clock,
  Shield,
  Zap,
  Target,
  AlertCircle,
  Database,
  Search,
  Filter
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface ProdutoValidade {
  recnum: number
  codigo: number
  descricao: string
  embalagem: string
  estoque_liq_1: number
  estoque_liq_9: number
  estoque_bru_1: number
  estoque_bru_9: number
  idade: number
  quantidade: number
  tempo_vida: number
  perc_uso: number
  dtaVencimento: string
  dtaEntrada: string
  dtaUltEntrada: string
  qtd_emb1: number
  qtd_emb9: number
  qtdUltEntrEmb1: number
  qtdUltEntrEmb9: number
  vnd_30_dias_emb1: number
  vnd_30_dias_emb9: number
  dias_sem_venda: number
  setor_fisico: string
  setor_balanco: string
  comprador_fil: string
  comprador_mtz: string
  vlr_vnd_30: number
  perc_rentab: number
  valor_vencto: number
  dias_para_vencer: number
  status_pvps: 'regular' | 'atencao' | 'critico' | 'vencido'
  risco_giro: 'baixo' | 'medio' | 'alto'
  indice_rotacao: number
  cobertura_estoque: number
  potencial_perda: number
  recomendacao_acao: string
  prioridade_acao: number
}

interface AnaliseCompleta {
  codigo: number
  descricao: string
  estoque_atual: number
  dias_para_vencer: number
  venda_media_diaria: number
  estoque_projetado: number
  status_pvps: 'regular' | 'atencao' | 'critico' | 'vencido'
  risco_giro: 'baixo' | 'medio' | 'alto'
  indice_rotacao: number
  cobertura_estoque: number
  potencial_perda: number
  recomendacao: string
  prioridade: number
  impacto_financeiro: number
  sugestao_acao: string
  prazo_acao: string
}

interface InsightsGerais {
  total_produtos: number
  valor_total_vencto: number
  produtos_vencidos: number
  produtos_criticos: number
  valor_em_risco: number
  indice_rotacao_medio: number
  cobertura_media: number
  setores_mais_criticos: string[]
  recomendacoes_estrategicas: string[]
}

export default function ControleValidadeFrios() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sky-800 flex items-center gap-2">
              <Thermometer className="h-6 w-6" />
              Controle de Validade - Frios
            </CardTitle>
            <CardDescription>
              Análise profissional de validade com PVPS e insights para evitar perdas
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
            Carregando sistema de controle de validade...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <ControleValidadeFriosContent />
}

function ControleValidadeFriosContent() {
  const [validadeData, setValidadeData] = useState<ProdutoValidade[]>([])
  const [analiseData, setAnaliseData] = useState<AnaliseCompleta[]>([])
  const [insights, setInsights] = useState<InsightsGerais | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedSetor, setSelectedSetor] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedRisco, setSelectedRisco] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isTabChanging, setIsTabChanging] = useState(false)

  // Otimizar filtros com debounce
  const debouncedSearchTerm = useDebounce({ value: searchTerm, delay: 300 })
  const debouncedSetor = useDebounce({ value: selectedSetor, delay: 200 })
  const debouncedStatus = useDebounce({ value: selectedStatus, delay: 200 })
  const debouncedRisco = useDebounce({ value: selectedRisco, delay: 200 })

  const pvpsParams = {
    diasCritico: 7,
    diasAtencao: 15,
    diasRegular: 30,
    estoqueMinimo: 10,
    vendaMediaDias: 30,
    rentabilidadeMinima: 15,
    indiceRotacaoMinimo: 2,
    coberturaMaxima: 90
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('Iniciando upload do arquivo:', file.name)
    setIsProcessing(true)
    setUploadStatus('idle')
    setUploadMessage('')
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        console.log('Arquivo lido, iniciando processamento...')
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        console.log('Dados brutos do Excel:', jsonData.length, 'linhas')
        console.log('Primeira linha:', jsonData[0])

        if (jsonData.length === 0) {
          throw new Error('Arquivo vazio ou sem dados')
        }

        const processados = jsonData.map((item, index) => {
          if (index === 0 && typeof item['dtaVencimento'] === 'undefined') return null

          const dtaVencimento = item['dtaVencimento'] || item['DTAVENCIMENTO'] || ''
          const diasParaVencer = calcularDiasParaVencer(dtaVencimento)
          
          const produto = {
            recnum: parseFloat(item['recnum']) || parseFloat(item['RECNUM']) || 0,
            codigo: parseFloat(item['codigo']) || parseFloat(item['CODIGO']) || 0,
            descricao: item['descricao'] || item['DESCRICAO'] || '',
            embalagem: item['embalagem'] || item['EMBALAGEM'] || '',
            estoque_liq_1: parseFloat(item['estoque_liq_1']) || parseFloat(item['ESTOQUE_LIQ_1']) || 0,
            estoque_liq_9: parseFloat(item['estoque_liq_9']) || parseFloat(item['ESTOQUE_LIQ_9']) || 0,
            estoque_bru_1: parseFloat(item['estoque_bru_1']) || parseFloat(item['ESTOQUE_BRU_1']) || 0,
            estoque_bru_9: parseFloat(item['estoque_bru_9']) || parseFloat(item['ESTOQUE_BRU_9']) || 0,
            idade: parseFloat(item['idade']) || parseFloat(item['IDADE']) || 0,
            quantidade: parseFloat(item['quantidade']) || parseFloat(item['QUANTIDADE']) || 0,
            tempo_vida: parseFloat(item['tempo_vida']) || parseFloat(item['TEMPO_VIDA']) || 0,
            perc_uso: parseFloat(item['perc_uso']) || parseFloat(item['PERC_USO']) || 0,
            dtaVencimento,
            dtaEntrada: item['dtaEntrada'] || item['DTAENTRADA'] || '',
            dtaUltEntrada: item['dtaUltEntrada'] || item['DTAULTENTRADA'] || '',
            qtd_emb1: parseFloat(item['qtd_emb1']) || parseFloat(item['QTD_EMB1']) || 0,
            qtd_emb9: parseFloat(item['qtd_emb9']) || parseFloat(item['QTD_EMB9']) || 0,
            qtdUltEntrEmb1: parseFloat(item['qtdUltEntrEmb1']) || parseFloat(item['QTDULTENTREMB1']) || 0,
            qtdUltEntrEmb9: parseFloat(item['qtdUltEntrEmb9']) || parseFloat(item['QTDULTENTREMB9']) || 0,
            vnd_30_dias_emb1: parseFloat(item['vnd_30_dias_emb1']) || parseFloat(item['VND_30_DIAS_EMB1']) || 0,
            vnd_30_dias_emb9: parseFloat(item['vnd_30_dias_emb9']) || parseFloat(item['VND_30_DIAS_EMB9']) || 0,
            dias_sem_venda: parseFloat(item['dias_sem_venda']) || parseFloat(item['DIAS_SEM_VENDA']) || 0,
            setor_fisico: item['setor_fisico'] || item['SETOR_FISICO'] || '',
            setor_balanco: item['setor_balanco'] || item['SETOR_BALANCO'] || '',
            comprador_fil: item['comprador_fil'] || item['COMPRADOR_FIL'] || '',
            comprador_mtz: item['comprador_mtz'] || item['COMPRADOR_MTZ'] || '',
            vlr_vnd_30: parseFloat(item['vlr_vnd_30']) || parseFloat(item['VLR_VND_30']) || 0,
            perc_rentab: parseFloat(item['perc_rentab']) || parseFloat(item['PERC_RENTAB']) || 0,
            valor_vencto: parseFloat(item['valor_vencto']) || parseFloat(item['VALOR_VENCTO']) || 0,
            dias_para_vencer,
            status_pvps: determinarStatusPVPS(dias_para_vencer),
            risco_giro: 'baixo' as 'baixo' | 'medio' | 'alto',
            indice_rotacao: 0,
            cobertura_estoque: 0,
            potencial_perda: 0,
            recomendacao_acao: '',
            prioridade_acao: 4
          } as ProdutoValidade

          produto.risco_giro = determinarRiscoGiro(produto)
          produto.indice_rotacao = calcularIndiceRotacao(produto)
          produto.cobertura_estoque = calcularCoberturaEstoque(produto)
          produto.potencial_perda = calcularPotencialPerda(produto)
          produto.recomendacao_acao = gerarRecomendacaoAcao(produto)
          produto.prioridade_acao = calcularPrioridadeAcao(produto)
          
          return produto
        }).filter(item => item !== null) as ProdutoValidade[]

        console.log('Produtos processados:', processados.length)
        console.log('Primeiro produto processado:', processados[0])

        if (processados.length === 0) {
          throw new Error('Nenhum dado válido encontrado no arquivo')
        }

        setValidadeData(processados)
        setUploadStatus('success')
        setUploadMessage(`Arquivo processado com sucesso! ${processados.length} produtos encontrados.`)
        setIsProcessing(false)
      } catch (error) {
        console.error('Erro ao processar arquivo:', error)
        setUploadStatus('error')
        setUploadMessage(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        setIsProcessing(false)
      }
    }

    reader.onerror = () => {
      console.error('Erro ao ler arquivo')
      setUploadStatus('error')
      setUploadMessage('Erro ao ler arquivo. Tente novamente.')
      setIsProcessing(false)
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const calcularDiasParaVencer = (dataVencimento: string): number => {
    if (!dataVencimento) return 999
    
    try {
      const [dia, mes, ano] = dataVencimento.split('/').map(Number)
      const dataVenc = new Date(ano, mes - 1, dia)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const diffTime = dataVenc.getTime() - hoje.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    } catch (error) {
      console.error('Erro ao calcular dias para vencer:', error)
      return 999
    }
  }

  const determinarStatusPVPS = (diasParaVencer: number): 'regular' | 'atencao' | 'critico' | 'vencido' => {
    if (diasParaVencer < 0) return 'vencido'
    if (diasParaVencer <= pvpsParams.diasCritico) return 'critico'
    if (diasParaVencer <= pvpsParams.diasAtencao) return 'atencao'
    return 'regular'
  }

  const determinarRiscoGiro = (item: ProdutoValidade): 'baixo' | 'medio' | 'alto' => {
    const estoqueAtual = item.estoque_liq_1
    const venda30dias = item.vnd_30_dias_emb1
    const diasSemVenda = item.dias_sem_venda
    
    if (estoqueAtual < pvpsParams.estoqueMinimo) return 'baixo'
    if (venda30dias === 0 || diasSemVenda > 7) return 'alto'
    
    const vendaMediaDiaria = venda30dias / 30
    const diasEstoque = estoqueAtual / vendaMediaDiaria
    
    if (diasEstoque > 60) return 'alto'
    if (diasEstoque > 30) return 'medio'
    return 'baixo'
  }

  const calcularIndiceRotacao = (item: ProdutoValidade): number => {
    const venda30dias = item.vnd_30_dias_emb1
    const estoqueMedio = (item.estoque_liq_1 + item.estoque_liq_9) / 2
    
    if (estoqueMedio === 0) return 0
    return (venda30dias / estoqueMedio) * 12
  }

  const calcularCoberturaEstoque = (item: ProdutoValidade): number => {
    const vendaMediaDiaria = item.vnd_30_dias_emb1 / 30
    if (vendaMediaDiaria === 0) return 999
    return item.estoque_liq_1 / vendaMediaDiaria
  }

  const calcularPotencialPerda = (item: ProdutoValidade): number => {
    if (item.status_pvps === 'vencido') return item.valor_vencto
    if (item.status_pvps === 'critico') return item.valor_vencto * 0.8
    if (item.status_pvps === 'atencao') return item.valor_vencto * 0.3
    return 0
  }

  const gerarRecomendacaoAcao = (item: ProdutoValidade): string => {
    if (item.status_pvps === 'vencido') {
      return 'RETIRAR IMEDIATAMENTE - Produto vencido, risco sanitário'
    }
    if (item.status_pvps === 'critico') {
      if (item.risco_giro === 'alto') {
        return 'PROMOÇÃO URGENTE - Baixar preço 30-50% + ação comercial'
      }
      return 'AÇÃO IMEDIATA - Acelerar vendas, evitar perda total'
    }
    if (item.status_pvps === 'atencao') {
      if (item.indice_rotacao < pvpsParams.indiceRotacaoMinimo) {
        return 'OTIMIZAR GIRO - Revisar política de compras e promoções'
      }
      return 'MONITORAR - Acompanhar vendas diariamente'
    }
    if (item.risco_giro === 'alto') {
      return 'REDUZIR ESTOQUE - Paralisar compras, liquidar excedente'
    }
    return 'MANTER - Estoque e validade adequados'
  }

  const calcularPrioridadeAcao = (item: ProdutoValidade): number => {
    if (item.status_pvps === 'vencido') return 1
    if (item.status_pvps === 'critico') return 2
    if (item.status_pvps === 'atencao' && item.risco_giro === 'alto') return 2
    if (item.status_pvps === 'atencao') return 3
    if (item.risco_giro === 'alto') return 3
    return 4
  }

  const gerarAnaliseCompleta = useCallback(() => {
    console.log('gerarAnaliseCompleta iniciado - validadeData length:', validadeData.length)
    const analises: AnaliseCompleta[] = validadeData.map(item => {
      const vendaMediaDiaria = item.vnd_30_dias_emb1 / pvpsParams.vendaMediaDias
      const estoqueProjetado = item.estoque_liq_1 - (vendaMediaDiaria * item.dias_para_vencer)
      const impactoFinanceiro = item.potencial_perda
      
      let recomendacao = ''
      let prioridade = 4
      let sugestaoAcao = ''
      let prazoAcao = ''
      
      if (item.status_pvps === 'vencido') {
        recomendacao = 'RETIRAR IMEDIATAMENTE'
        prioridade = 1
        sugestaoAcao = 'Descartar produto, verificar processo de compras'
        prazoAcao = 'Imediato'
      } else if (item.status_pvps === 'critico') {
        recomendacao = 'AÇÃO URGENTE'
        prioridade = 1
        sugestaoAcao = item.risco_giro === 'alto' ? 
          'Promoção agressiva 50% + bundle com outros produtos' : 
          'Promoção 30% + exposição especial'
        prazoAcao = '24-48 horas'
      } else if (item.status_pvps === 'atencao') {
        recomendacao = 'MONITORAR CRÍTICO'
        prioridade = 2
        sugestaoAcao = item.indice_rotacao < 1 ? 
          'Revisar política de compras, considerar cancelamento de pedidos' :
          'Acompanhar vendas diárias, preparar ação promocional'
        prazoAcao = '3-7 dias'
      } else if (item.risco_giro === 'alto') {
        recomendacao = 'OTIMIZAR ESTOQUE'
        prioridade = 3
        sugestaoAcao = 'Paralisar novas compras, promover liquidação gradual'
        prazoAcao = '7-15 dias'
      } else {
        recomendacao = 'MANTER'
        prioridade = 4
        sugestaoAcao = 'Continuar monitoramento regular'
        prazoAcao = '30 dias'
      }

      return {
        codigo: item.codigo,
        descricao: item.descricao,
        estoque_atual: item.estoque_liq_1,
        dias_para_vencer: item.dias_para_vencer,
        venda_media_diaria: vendaMediaDiaria,
        estoque_projetado: estoqueProjetado,
        status_pvps: item.status_pvps,
        risco_giro: item.risco_giro,
        indice_rotacao: item.indice_rotacao,
        cobertura_estoque: item.cobertura_estoque,
        potencial_perda: item.potencial_perda,
        recomendacao,
        prioridade,
        impacto_financeiro: impactoFinanceiro,
        sugestao_acao: sugestaoAcao,
        prazo_acao: prazoAcao
      }
    })

    analises.sort((a, b) => a.prioridade - b.prioridade)
    console.log('Análise gerada:', analises.length, 'itens')
    console.log('Primeiro item da análise:', analises[0])
    setAnaliseData(analises)
    gerarInsightsGerais(analises)
  }, [validadeData])

  const gerarInsightsGerais = useCallback((analises: AnaliseCompleta[]) => {
    const totalProdutos = analises.length
    const valorTotalVencto = analises.reduce((sum, item) => sum + item.impacto_financeiro, 0)
    const produtosVencidos = analises.filter(item => item.status_pvps === 'vencido').length
    const produtosCriticos = analises.filter(item => item.status_pvps === 'critico').length
    const valorEmRisco = analises
      .filter(item => item.status_pvps === 'vencido' || item.status_pvps === 'critico')
      .reduce((sum, item) => sum + item.impacto_financeiro, 0)
    
    const indiceRotacaoMedio = analises.reduce((sum, item) => sum + item.indice_rotacao, 0) / totalProdutos
    const coberturaMedia = analises.reduce((sum, item) => sum + item.cobertura_estoque, 0) / totalProdutos

    const setoresRisco = validadeData
      .filter(item => item.status_pvps === 'vencido' || item.status_pvps === 'critico')
      .reduce((acc, item) => {
        acc[item.setor_fisico] = (acc[item.setor_fisico] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const setoresMaisCriticos = Object.entries(setoresRisco)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([setor]) => setor)

    const recomendacoesEstrategicas = [
      valorEmRisco > 10000 ? '🚨 ALTO VALOR EM RISCO - Priorizar ações imediatas para reduzir perdas financeiras' : '',
      produtosVencidos > 0 ? '🗑️ PRODUTOS VENCIDOS - Revisar processo de controle de validade e treinamento de equipe' : '',
      produtosCriticos > totalProdutos * 0.1 ? '⚠️ ALTO PERCENTUAL CRÍTICO - Implementar gestão de validade proativa' : '',
      indiceRotacaoMedio < pvpsParams.indiceRotacaoMinimo ? '📉 BAIXO GIRO - Revisar política de compras e mix de produtos' : '',
      coberturaMedia > pvpsParams.coberturaMaxima ? '📦 EXCESSO DE ESTOQUE - Otimizar níveis de estoque e frequência de compras' : '',
      setoresMaisCriticos.length > 0 ? `🎯 SETORES CRÍTICOS - Focar ações em: ${setoresMaisCriticos.join(', ')}` : ''
    ].filter(Boolean)

    setInsights({
      total_produtos: totalProdutos,
      valor_total_vencto: valorTotalVencto,
      produtos_vencidos: produtosVencidos,
      produtos_criticos: produtosCriticos,
      valor_em_risco: valorEmRisco,
      indice_rotacao_medio: indiceRotacaoMedio,
      cobertura_media: coberturaMedia,
      setores_mais_criticos: setoresMaisCriticos,
      recomendacoes_estrategicas: recomendacoesEstrategicas
    })
  }, [validadeData])

  const aplicarFiltros = useCallback(() => {
    let filtered = validadeData

    if (debouncedSetor !== 'all') {
      filtered = filtered.filter(item => item.setor_fisico === debouncedSetor)
    }
    if (debouncedStatus !== 'all') {
      filtered = filtered.filter(item => item.status_pvps === debouncedStatus)
    }
    if (debouncedRisco !== 'all') {
      filtered = filtered.filter(item => item.risco_giro === debouncedRisco)
    }
    if (debouncedSearchTerm) {
      filtered = filtered.filter(item => 
        item.descricao.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.codigo.toString().includes(debouncedSearchTerm)
      )
    }

    return filtered
  }, [validadeData, debouncedSetor, debouncedStatus, debouncedRisco, debouncedSearchTerm])

  const exportToExcel = useCallback(() => {
    const exportData = analiseData.map(item => ({
      'Código': item.codigo,
      'Descrição': item.descricao,
      'Estoque Atual': item.estoque_atual,
      'Dias para Vencer': item.dias_para_vencer,
      'Venda Média Diária': item.venda_media_diaria.toFixed(2),
      'Estoque Projetado': item.estoque_projetado.toFixed(2),
      'Status PVPS': item.status_pvps,
      'Risco de Giro': item.risco_giro,
      'Índice Rotação': item.indice_rotacao.toFixed(2),
      'Cobertura Estoque': item.cobertura_estoque.toFixed(1),
      'Potencial Perda': item.potencial_perda.toFixed(2),
      'Recomendação': item.recomendacao,
      'Prioridade': item.prioridade,
      'Impacto Financeiro': item.impacto_financeiro.toFixed(2),
      'Sugestão Ação': item.sugestao_acao,
      'Prazo Ação': item.prazo_acao
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AnaliseValidade')

    const fileName = `analise_validade_frios_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }, [analiseData])

  useEffect(() => {
    console.log('useEffect triggered - validadeData length:', validadeData.length)
    if (validadeData.length > 0) {
      console.log('Chamando gerarAnaliseCompleta...')
      gerarAnaliseCompleta()
    }
  }, [validadeData, gerarAnaliseCompleta])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'regular': return 'bg-green-100 text-green-800 border-green-200'
      case 'atencao': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critico': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'vencido': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'baixo': return 'bg-green-100 text-green-800 border-green-200'
      case 'medio': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'alto': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPrioridadeColor = (prioridade: number) => {
    switch (prioridade) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200'
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 4: return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const setoresUnicos = Array.from(new Set(validadeData.map(item => item.setor_fisico).filter(setor => setor && setor.trim() !== '')))
  const filteredData = aplicarFiltros()
  const estatisticas = {
    total: filteredData.length,
    vencidos: filteredData.filter(item => item.status_pvps === 'vencido').length,
    criticos: filteredData.filter(item => item.status_pvps === 'critico').length,
    atencao: filteredData.filter(item => item.status_pvps === 'atencao').length,
    regulares: filteredData.filter(item => item.status_pvps === 'regular').length,
    riscoAlto: filteredData.filter(item => item.risco_giro === 'alto').length
  }

  // Otimizar manipulação de mudança de abas
  const handleTabChange = useThrottle((value: string) => {
    setIsTabChanging(true)
    setTimeout(() => setIsTabChanging(false), 100)
  }, 200)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sky-800 flex items-center gap-2">
            <Thermometer className="h-6 w-6" />
            Controle de Validade - Frios
          </CardTitle>
          <CardDescription>
            Análise profissional de validade com PVPS e insights para evitar perdas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="file-upload" className="sr-only">
                  Upload de arquivo SAEOU60
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                  disabled={isProcessing}
                />
              </div>
              {analiseData.length > 0 && (
                <Button onClick={exportToExcel} className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Análise
                </Button>
              )}
            </div>
            
            {uploadStatus !== 'idle' && (
              <Alert className={uploadStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {uploadStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {uploadMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {isProcessing && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Processando arquivo SAEOU60 e gerando análise profissional...
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {validadeData.length > 0 && (
        <div>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              📊 Dados carregados: {validadeData.length} produtos | 
              Análise gerada: {analiseData.length} itens | 
              Filtrados: {filteredData.length} produtos
            </p>
          </div>

          <Tabs defaultValue="validade" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="validade" 
                onClick={() => handleTabChange('validade')}
                className="data-[state=active]:bg-sky-600 data-[state=active]:text-white"
              >
                Análise PVPS
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                onClick={() => handleTabChange('insights')}
                className="data-[state=active]:bg-sky-600 data-[state=active]:text-white"
              >
                Insights Estratégicos
              </TabsTrigger>
              <TabsTrigger 
                value="detalhado" 
                onClick={() => handleTabChange('detalhado')}
                className="data-[state=active]:bg-sky-600 data-[state=active]:text-white"
              >
                Dados Detalhados
              </TabsTrigger>
            </TabsList>

            {/* Seção de Filtros Otimizada */}
            {validadeData.length > 0 && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Campo de Busca */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Search className="h-4 w-4" />
                        Buscar
                      </Label>
                      <Input
                        placeholder="Código ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    {/* Filtro Setor */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Setor</Label>
                      <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todos setores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos setores</SelectItem>
                          {setoresUnicos.map(setor => (
                            <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro Status */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status PVPS</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todos status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos status</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="atencao">Atenção</SelectItem>
                          <SelectItem value="critico">Crítico</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro Risco */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Risco Giro</Label>
                      <Select value={selectedRisco} onValueChange={setSelectedRisco}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todos riscos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos riscos</SelectItem>
                          <SelectItem value="baixo">Baixo</SelectItem>
                          <SelectItem value="medio">Médio</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Estatísticas */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Resultados</Label>
                      <div className="h-9 flex items-center px-3 py-2 bg-gray-50 rounded border text-sm">
                        <span className="font-medium">{filteredData.length}</span>
                        <span className="text-gray-500 ml-1">de {validadeData.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <TabsContent value="validade" className="space-y-4">
              <LazyTab isActive={true}>
                {(insights || validadeData.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-red-600">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="text-2xl font-bold text-red-600">{insights?.produtos_vencidos || 0}</div>
                            <div className="text-sm font-medium text-gray-600">Produtos Vencidos</div>
                            <div className="text-xs text-red-600">R$ {(insights?.valor_em_risco || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-600">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="text-2xl font-bold text-orange-600">{insights?.produtos_criticos || 0}</div>
                            <div className="text-sm font-medium text-gray-600">Produtos Críticos</div>
                            <div className="text-xs text-orange-600">Ação imediata</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-600">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{(insights?.indice_rotacao_medio || 0).toFixed(1)}</div>
                            <div className="text-sm font-medium text-gray-600">Índice Rotação</div>
                            <div className="text-xs text-blue-600">Média mensal</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-600">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="text-2xl font-bold text-green-600">{(insights?.cobertura_media || 0).toFixed(0)}</div>
                            <div className="text-sm font-medium text-gray-600">Cobertura Estoque</div>
                            <div className="text-xs text-green-600">Dias de venda</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {insights && insights.recomendacoes_estrategicas.length > 0 && (
                  <Card className="border-l-4 border-l-purple-600">
                    <CardHeader>
                      <CardTitle className="text-purple-800 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Recomendações Estratégicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {insights.recomendacoes_estrategicas.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                            <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-purple-800">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sky-800">Análise PVPS - Ações Prioritárias</CardTitle>
                    <CardDescription>
                      Produtos organizados por prioridade de ação para evitar perdas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Prioridade</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Estoque</TableHead>
                            <TableHead>Dias P/ Vencer</TableHead>
                            <TableHead>Status PVPS</TableHead>
                            <TableHead>Risco Giro</TableHead>
                            <TableHead>Impacto Financeiro</TableHead>
                            <TableHead>Ação Recomendada</TableHead>
                            <TableHead>Prazo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analiseData.length > 0 ? (
                            analiseData.slice(0, 20).map((item) => (
                              <TableRow key={item.codigo}>
                                <TableCell>
                                  <Badge className={getPrioridadeColor(item.prioridade)}>
                                    {item.prioridade}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{item.codigo}</TableCell>
                                <TableCell className="max-w-xs truncate">{item.descricao}</TableCell>
                                <TableCell>{item.estoque_atual}</TableCell>
                                <TableCell>{item.dias_para_vencer}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(item.status_pvps)}>
                                    {item.status_pvps}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRiscoColor(item.risco_giro)}>
                                    {item.risco_giro}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-red-600">
                                  R$ {item.impacto_financeiro.toFixed(2)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-sm">
                                  {item.sugestao_acao}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{item.prazo_acao}</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-8">
                                <div className="text-gray-500">
                                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>Nenhum dado de análise disponível</p>
                                  <p className="text-sm">Faça upload de um arquivo SAEOU60 para gerar a análise</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </LazyTab>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <LazyTab isActive={false}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sky-800 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Análise de Risco
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Produtos Vencidos</span>
                          <Badge className="bg-red-100 text-red-800">{estatisticas.vencidos}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Produtos Críticos</span>
                          <Badge className="bg-orange-100 text-orange-800">{estatisticas.criticos}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Produtos em Atenção</span>
                          <Badge className="bg-yellow-100 text-yellow-800">{estatisticas.atencao}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Alto Risco de Giro</span>
                          <Badge className="bg-red-100 text-red-800">{estatisticas.riscoAlto}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sky-800 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Setores Críticos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights?.setores_mais_criticos.map((setor, index) => (
                          <div key={setor} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="font-medium text-red-800">{setor}</span>
                            <Badge className="bg-red-100 text-red-800">#{index + 1}</Badge>
                          </div>
                        ))}
                        {(!insights || insights.setores_mais_criticos.length === 0) && (
                          <p className="text-sm text-gray-500">Nenhum setor crítico identificado</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sky-800">Top 20 Produtos com Maior Risco</CardTitle>
                    <CardDescription>
                      Produtos que requerem atenção imediata para evitar perdas financeiras
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor em Risco</TableHead>
                            <TableHead>Dias P/ Vencer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ação Necessária</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analiseData.length > 0 ? (
                            analiseData
                              .filter(item => item.impacto_financeiro > 0)
                              .sort((a, b) => b.impacto_financeiro - a.impacto_financeiro)
                              .slice(0, 20)
                              .map((item) => (
                              <TableRow key={item.codigo}>
                                <TableCell className="font-medium">{item.codigo}</TableCell>
                                <TableCell className="max-w-xs truncate">{item.descricao}</TableCell>
                                <TableCell className="font-bold text-red-600">
                                  R$ {item.impacto_financeiro.toFixed(2)}
                                </TableCell>
                                <TableCell>{item.dias_para_vencer}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(item.status_pvps)}>
                                    {item.status_pvps}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{item.sugestao_acao}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="text-gray-500">
                                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>Nenhum produto com risco identificado</p>
                                  <p className="text-sm">Faça upload de um arquivo SAEOU60 para análise</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </LazyTab>
            </TabsContent>

            <TabsContent value="detalhado" className="space-y-4">
              <LazyTab isActive={false}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sky-800">Dados Detalhados - SAEOU60</CardTitle>
                    <CardDescription>
                      Todos os campos do relatório de validade com análise completa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Embalagem</TableHead>
                            <TableHead>Estoque 1</TableHead>
                            <TableHead>Estoque 9</TableHead>
                            <TableHead>Idade</TableHead>
                            <TableHead>Tempo Vida</TableHead>
                            <TableHead>% Uso</TableHead>
                            <TableHead>Data Vencimento</TableHead>
                            <TableHead>Venda 30 dias</TableHead>
                            <TableHead>Dias sem Venda</TableHead>
                            <TableHead>Setor Físico</TableHead>
                            <TableHead>Comprador</TableHead>
                            <TableHead>Índice Rotação</TableHead>
                            <TableHead>Potencial Perda</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.length > 0 ? (
                            filteredData
                              .sort((a, b) => b.potencial_perda - a.potencial_perda)
                              .map((item) => (
                              <TableRow key={item.recnum}>
                                <TableCell className="font-medium">{item.codigo}</TableCell>
                                <TableCell>{item.descricao}</TableCell>
                                <TableCell>{item.embalagem}</TableCell>
                                <TableCell>{item.estoque_liq_1}</TableCell>
                                <TableCell>{item.estoque_liq_9}</TableCell>
                                <TableCell>{item.idade}</TableCell>
                                <TableCell>{item.tempo_vida}</TableCell>
                                <TableCell>{item.perc_uso}%</TableCell>
                                <TableCell>{item.dtaVencimento}</TableCell>
                                <TableCell>{item.vnd_30_dias_emb1}</TableCell>
                                <TableCell>{item.dias_sem_venda}</TableCell>
                                <TableCell>{item.setor_fisico}</TableCell>
                                <TableCell>{item.comprador_mtz}</TableCell>
                                <TableCell>
                                  <Badge className={item.indice_rotacao < 2 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                    {item.indice_rotacao.toFixed(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {item.potencial_perda > 0 ? (
                                    <span className="text-red-600">R$ {item.potencial_perda.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-green-600">R$ 0,00</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={15} className="text-center py-8">
                                <div className="text-gray-500">
                                  <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>Nenhum dado detalhado disponível</p>
                                  <p className="text-sm">Faça upload de um arquivo SAEOU60 para visualizar os dados</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </LazyTab>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}