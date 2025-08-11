'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { VirtualizedTable, PaginatedTable } from '@/components/ui/virtualized-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import '@/styles/optimized-styles.css'
import { useDataWorker } from '@/hooks/useDataWorker'
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
  RefreshCw
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface AjusteMercadoria {
  FILIAL: string
  EVENTO: string
  'DESCR.EVENTO': string
  MERCADORIA: string
  STATUS: string
  DESCRICAO: string
  EMBALAGEM: string
  EMB1: string
  EMB9: string
  'VLR.TOTAL': string
  'DT.ULT.EV.': string
  'DIREITO DEVOLUCAO': string
  'P.A.R.': string
  OPERACAO: string
  'COD.GRUPO': string
  'COD.SUB-GRUPO': string
  'COD.CLASSE': string
  GRUPO: string
  'SUB-GRUPO': string
  CLASSE: string
  COMPRADOR: string
  SETOR: string
  'SETOR BALANCO': string
  codigoPrincipal?: string
  digito?: string
  quantidade?: number
}

interface Consolidacao {
  codigoPrincipal: string
  descricao: string
  eventos: AjusteMercadoria[]
  saldoFinal: number
  valorFinanceiro: number
  justificativa: string
  status: 'regular' | 'inconsistente' | 'pendente'
}

export default function AjustesMercadoriaDashboard() {
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
              <FileSpreadsheet className="h-6 w-6" />
              Análise de Ajustes de Mercadoria
            </CardTitle>
            <CardDescription>
              Análise inteligente de ajustes de estoque com consolidação de eventos e identificação de padrões
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
            Carregando análise de ajustes...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <AjustesMercadoriaDashboardContent />
}

// Componente principal que só renderiza no cliente
function AjustesMercadoriaDashboardContent() {
  const [ajustesData, setAjustesData] = useState<AjusteMercadoria[]>([])
  const [filteredData, setFilteredData] = useState<AjusteMercadoria[]>([])
  const [consolidacoes, setConsolidacoes] = useState<Consolidacao[]>([])
  const [selectedEvento, setSelectedEvento] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSetor, setSelectedSetor] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConsolidacao, setSelectedConsolidacao] = useState<Consolidacao | null>(null)
  
  // Usar Web Worker para processamento pesado
  const { 
    isProcessing: workerProcessing, 
    error: workerError, 
    processarDados, 
    calcularConsolidacoes,
    aplicarFiltros: aplicarFiltrosWorker
  } = useDataWorker()

  // Combinar estados de processamento
  const isProcessing = workerProcessing

  // Eventos relevantes para análise
  const eventosRelevantes = [
    'INV.PERIODICO ESTOQUE AUTOM.',
    'AJ. SOBRA CONTAGEM PREVENTIVA',
    'AJ. FALTA CONTAGEM PREVENTIVA',
    'AJUSTE AUTOMATICO NEGATIVO',
    'AJUSTE ESTOQUE - FALTA',
    'AJUSTE ESTOQUE - SOBRA'
  ]

  // Definição das funções antes dos useEffect
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

          // Processar dados usando Web Worker
          const processados = await processarDados(jsonData)
          setAjustesData(processados)
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
        }
      }

      reader.onerror = () => {
        console.error('Erro ao ler arquivo')
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
    }
  }, [processarDados])

  // Processar dados usando Web Worker
  useEffect(() => {
    if (ajustesData.length > 0) {
      const processarConsolidacoes = async () => {
        try {
          const novasConsolidacoes = await calcularConsolidacoes(ajustesData)
          setConsolidacoes(novasConsolidacoes)
        } catch (error) {
          console.error('Erro ao calcular consolidações:', error)
        }
      }
      
      processarConsolidacoes()
    }
  }, [ajustesData, calcularConsolidacoes])

  const gerarJustificativa = (eventos: AjusteMercadoria[], saldoFinal: number): string => {
    const temInventario = eventos.some(e => e.EVENTO && e.EVENTO === 'INV.PERIODICO ESTOQUE AUTOM.')
    const temAjusteNegativo = eventos.some(e => e.EVENTO && e.EVENTO === 'AJUSTE AUTOMATICO NEGATIVO')
    const temFalta = eventos.some(e => e.EVENTO && String(e.EVENTO).includes('FALTA'))
    const temSobra = eventos.some(e => e.EVENTO && String(e.EVENTO).includes('SOBRA'))

    if (saldoFinal === 0) {
      return 'Saldo regularizado - ajustes compensados'
    }

    if (temInventario && temAjusteNegativo) {
      return 'Inventário com ajustes automáticos - possível venda com estoque zero'
    }

    if (temFalta && temSobra) {
      return 'Ajustes de falta e sobra - correção de divergências'
    }

    if (saldoFinal > 0) {
      return 'Sobra não justificada - requer investigação'
    }

    if (saldoFinal < 0) {
      return 'Falta não justificada - requer investigação'
    }

    return 'Aguardando análise manual'
  }

  const determinarStatus = (eventos: AjusteMercadoria[], saldoFinal: number): 'regular' | 'inconsistente' | 'pendente' => {
    if (saldoFinal === 0) return 'regular'
    
    const temInventario = eventos.some(e => e.EVENTO && e.EVENTO === 'INV.PERIODICO ESTOQUE AUTOM.')
    const temAjusteNegativo = eventos.some(e => e.EVENTO && e.EVENTO === 'AJUSTE AUTOMATICO NEGATIVO')
    
    if (temInventario && temAjusteNegativo && Math.abs(saldoFinal) <= 5) {
      return 'regular'
    }
    
    return Math.abs(saldoFinal) > 10 ? 'inconsistente' : 'pendente'
  }

  // Aplicar filtros usando Web Worker
  useEffect(() => {
    const aplicarFiltrosAsync = async () => {
      try {
        const filtrados = await aplicarFiltrosWorker({
          data: ajustesData,
          selectedEvento,
          selectedStatus,
          selectedSetor,
          searchTerm
        })
        setFilteredData(filtrados)
      } catch (error) {
        console.error('Erro ao aplicar filtros:', error)
        // Fallback para processamento síncrono
        let filtered = ajustesData

        if (selectedEvento !== 'all') {
          filtered = filtered.filter(item => item.EVENTO && item.EVENTO === selectedEvento)
        }

        if (selectedStatus !== 'all') {
          filtered = filtered.filter(item => item.STATUS && item.STATUS === selectedStatus)
        }

        if (selectedSetor !== 'all') {
          filtered = filtered.filter(item => item.SETOR && item.SETOR === selectedSetor)
        }

        if (searchTerm) {
          filtered = filtered.filter(item => 
            (item.DESCRICAO && item.DESCRICAO.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.MERCADORIA && item.MERCADORIA.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.codigoPrincipal && item.codigoPrincipal.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        }

        setFilteredData(filtered)
      }
    }
    
    if (ajustesData.length > 0) {
      aplicarFiltrosAsync()
    }
  }, [ajustesData, selectedEvento, selectedStatus, selectedSetor, searchTerm, aplicarFiltrosWorker])

  const exportToExcel = useCallback(() => {
    const exportData = consolidacoes.map(item => ({
      'Código': item.codigoPrincipal,
      'Descrição': item.descricao,
      'Saldo Final': item.saldoFinal,
      'Valor Financeiro': item.valorFinanceiro,
      'Status': item.status,
      'Justificativa': item.justificativa,
      'Total Eventos': item.eventos.length,
      'Eventos': item.eventos.map(e => e.EVENTO).join(', ')
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidacao')

    const fileName = `analise_ajustes_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }, [consolidacoes])

  // useEffects depois das definições das funções
  // Nota: O processamento de dados é feito pelo useEffect acima que usa calcularConsolidacoes

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'regular': return 'bg-green-100 text-green-800 border-green-200'
      case 'inconsistente': return 'bg-red-100 text-red-800 border-red-200'
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEventoColor = useCallback((evento: string | null | undefined) => {
    if (!evento) return 'bg-gray-100 text-gray-800'
    const eventoStr = String(evento)
    if (eventoStr.includes('FALTA')) return 'bg-red-100 text-red-800'
    if (eventoStr.includes('SOBRA')) return 'bg-green-100 text-green-800'
    if (eventoStr.includes('INV.PERIODICO')) return 'bg-blue-100 text-blue-800'
    if (eventoStr.includes('AUTOMATICO')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }, [])

  // Componente para o input de arquivo (client-side only)
  const FileInput = () => {
    const [isClient, setIsClient] = useState(false)
    
    useEffect(() => {
      setIsClient(true)
    }, [])
    
    if (!isClient) {
      return (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-100 rounded-md border border-gray-300 animate-pulse"></div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="file-upload" className="sr-only">
            Upload de arquivo XLS
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
        {ajustesData.length > 0 && (
          <Button onClick={exportToExcel} className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
            <Download className="h-4 w-4" />
            Exportar Análise
          </Button>
        )}
      </div>
    )
  }

  const setoresUnicos = Array.from(new Set(ajustesData.map(item => item.SETOR).filter(setor => setor && setor.trim() !== '')))

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sky-800 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Análise de Ajustes de Mercadoria
          </CardTitle>
          <CardDescription>
            Análise inteligente de ajustes de estoque com consolidação de eventos e identificação de padrões
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
            Processando arquivo e analisando dados...
          </AlertDescription>
        </Alert>
      )}

      {workerError && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {workerError}
          </AlertDescription>
        </Alert>
      )}

      {ajustesData.length > 0 && (
        <Tabs defaultValue="consolidado" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consolidado">Visão Consolidada</TabsTrigger>
            <TabsTrigger value="detalhado">Eventos Detalhados</TabsTrigger>
          </TabsList>

          <TabsContent value="consolidado" className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-sky-800">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sky-800">{consolidacoes.length}</div>
                    <div className="text-sm font-medium text-gray-600">Produtos Analisados</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-600">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {consolidacoes.filter(c => c.status === 'regular').length}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Regulares</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-yellow-600">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {consolidacoes.filter(c => c.status === 'pendente').length}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Pendentes</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-red-600">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {consolidacoes.filter(c => c.status === 'inconsistente').length}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Inconsistentes</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela Consolidada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sky-800">Consolidação de Ajustes</CardTitle>
                <CardDescription>
                  Análise consolidada por produto com justificativas automáticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VirtualizedTable
                  data={consolidacoes}
                  columns={[
                    {
                      key: 'codigoPrincipal',
                      header: 'Código',
                      className: 'font-medium text-gray-900',
                      width: '100px'
                    },
                    {
                      key: 'descricao',
                      header: 'Descrição',
                      className: 'text-gray-900',
                      width: '200px'
                    },
                    {
                      key: 'saldoFinal',
                      header: 'Saldo Final',
                      render: (value: number) => (
                        <span className={`font-bold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {value > 0 ? '+' : ''}{value}
                        </span>
                      ),
                      className: 'text-center',
                      width: '120px'
                    },
                    {
                      key: 'valorFinanceiro',
                      header: 'Valor Financeiro',
                      render: (value: number) => (
                        <span className={`font-semibold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      ),
                      className: 'text-right',
                      width: '150px'
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (value: string, item: any) => (
                        <Badge className={`text-xs ${getStatusColor(value)}`}>
                          {value}
                        </Badge>
                      ),
                      className: 'text-center',
                      width: '120px'
                    },
                    {
                      key: 'justificativa',
                      header: 'Justificativa',
                      render: (value: string) => (
                        <div className="truncate" title={value}>
                          {value}
                        </div>
                      ),
                      className: 'text-gray-900',
                      width: '300px'
                    },
                    {
                      key: 'eventos',
                      header: 'Eventos',
                      render: (value: any[]) => (
                        <span className="text-center block">{value.length}</span>
                      ),
                      className: 'text-center',
                      width: '80px'
                    },
                    {
                      key: 'acoes',
                      header: 'Ações',
                      render: (_: any, item: any) => (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedConsolidacao(item)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                      ),
                      className: 'text-center',
                      width: '100px'
                    }
                  ]}
                  containerHeight={500}
                  rowHeight={60}
                  className="border rounded-lg"
                  getKey={(item) => item.codigoPrincipal}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detalhado" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sky-800">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="eventoFilter">Evento</Label>
                    <Select value={selectedEvento} onValueChange={setSelectedEvento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {eventosRelevantes.map(evento => (
                          <SelectItem key={evento} value={evento}>{evento}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="statusFilter">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="A">Ativo</SelectItem>
                        <SelectItem value="I">Inativo</SelectItem>
                        <SelectItem value="P">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="setorFilter">Setor</Label>
                    <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {setoresUnicos.map(setor => (
                          <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                        ))}
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
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sky-800">Eventos Detalhados</CardTitle>
                <CardDescription>
                  Todos os eventos de ajuste com informações completas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaginatedTable
                  data={filteredData}
                  columns={[
                    {
                      key: 'DT.ULT.EV.',
                      header: 'Data',
                      className: 'text-gray-900 whitespace-nowrap',
                      width: '120px'
                    },
                    {
                      key: 'EVENTO',
                      header: 'Evento',
                      render: (value: string) => (
                        <Badge className={`text-xs ${getEventoColor(value)}`}>
                          {value}
                        </Badge>
                      ),
                      className: 'whitespace-nowrap',
                      width: '200px'
                    },
                    {
                      key: 'codigoPrincipal',
                      header: 'Código',
                      className: 'font-medium text-gray-900 whitespace-nowrap',
                      width: '100px'
                    },
                    {
                      key: 'DESCRICAO',
                      header: 'Descrição',
                      render: (value: string) => (
                        <div className="truncate" title={value}>
                          {value}
                        </div>
                      ),
                      className: 'text-gray-900',
                      width: '250px'
                    },
                    {
                      key: 'quantidade',
                      header: 'Quantidade',
                      render: (value: number) => (
                        <span className={`font-medium ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {value > 0 ? '+' : ''}{value}
                        </span>
                      ),
                      className: 'text-right whitespace-nowrap',
                      width: '120px'
                    },
                    {
                      key: 'SETOR',
                      header: 'Setor',
                      className: 'text-gray-900 whitespace-nowrap',
                      width: '150px'
                    },
                    {
                      key: 'STATUS',
                      header: 'Status',
                      render: (value: string) => (
                        <Badge variant="outline">{value}</Badge>
                      ),
                      className: 'whitespace-nowrap',
                      width: '100px'
                    }
                  ]}
                  itemsPerPage={25}
                  className="border rounded-lg"
                  getKey={(item, index) => `${item.codigoPrincipal}-${index}`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Detalhes da Consolidação - Otimizado */}
      <Dialog open={!!selectedConsolidacao} onOpenChange={() => setSelectedConsolidacao(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-sky-900">
              Detalhes da Consolidação - {selectedConsolidacao?.codigoPrincipal}
            </DialogTitle>
            <DialogDescription>
              Análise completa dos eventos para este produto
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsolidacao && (
            <div className="space-y-4">
              {/* Informações Principais - Layout Original Otimizado */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-sky-50 rounded-lg">
                  <div className="text-lg font-bold text-sky-800">{selectedConsolidacao.codigoPrincipal}</div>
                  <div className="text-xs text-gray-600">Código</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-lg font-bold ${
                    selectedConsolidacao.saldoFinal > 0 ? 'text-green-600' : 
                    selectedConsolidacao.saldoFinal < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {selectedConsolidacao.saldoFinal > 0 ? '+' : ''}{selectedConsolidacao.saldoFinal}
                  </div>
                  <div className="text-xs text-gray-600">Saldo Final</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className={`text-lg font-bold ${
                    selectedConsolidacao.valorFinanceiro > 0 ? 'text-green-600' : 
                    selectedConsolidacao.valorFinanceiro < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    R$ {selectedConsolidacao.valorFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-600">Valor Financeiro</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Badge className={`text-sm ${getStatusColor(selectedConsolidacao.status)}`}>
                    {selectedConsolidacao.status}
                  </Badge>
                  <div className="text-xs text-gray-600 mt-1">Status</div>
                </div>
              </div>

              {/* Justificativa */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Justificativa Automática</div>
                <p className="text-sm text-gray-700">{selectedConsolidacao.justificativa}</p>
              </div>

              {/* Eventos Detalhados - Layout Original com Performance */}
              <div className="border rounded-lg">
                <div className="p-3 bg-gray-50 border-b">
                  <div className="text-sm font-medium text-gray-800">
                    Eventos Detalhados ({selectedConsolidacao.eventos.length})
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[40vh] overflow-y-auto optimized-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Data</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Evento</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qtd</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Setor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedConsolidacao.eventos.map((evento, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">
                            {evento['DT.ULT.EV.']}
                          </td>
                          <td className="px-3 py-2">
                            <Badge className={`text-xs ${getEventoColor(evento.EVENTO)}`}>
                              {evento.EVENTO}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            <span className={evento.quantidade > 0 ? 'text-green-600' : evento.quantidade < 0 ? 'text-red-600' : 'text-gray-600'}>
                              {evento.quantidade > 0 ? '+' : ''}{evento.quantidade}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-900 text-xs">
                            {evento.SETOR}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}