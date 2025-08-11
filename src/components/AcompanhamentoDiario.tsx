'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp, Target, Star, Award, Plus, Edit, Save } from 'lucide-react'
import { useData } from '@/contexts/DataContext'

interface CheckDiario {
  data: string
  vendaHF: number
  isvLoja: number
  ruptura: number
  rentabilidade: number
  observacoes: string
  status: 'pendente' | 'concluido' | 'atrasado'
}

interface MetaSemanal {
  id: string
  descricao: string
  responsavel: string
  prazo: string
  status: 'nao_iniciado' | 'em_andamento' | 'concluido' | 'atrasado'
  progresso: number
  prioridade: 'alta' | 'media' | 'baixa'
}

export default function AcompanhamentoDiario() {
  const { filteredData } = useData()
  const [checksDiarios, setChecksDiarios] = useState<CheckDiario[]>([])
  const [metasSemanais, setMetasSemanais] = useState<MetaSemanal[]>([])
  const [checkAtual, setCheckAtual] = useState<Partial<CheckDiario>>({})
  const [editando, setEditando] = useState(false)

  // Calcular métricas atuais
  const metricasAtuais = useMemo(() => {
    const totalVendaHF = filteredData.reduce((sum, item) => {
      if (item.SETOR_LOJA && (
          item.SETOR_LOJA.toLowerCase().includes('horti') || 
          item.SETOR_LOJA.toLowerCase().includes('fruti') ||
          item.SETOR_LOJA.toLowerCase().includes('verdura') ||
          item.SETOR_LOJA.toLowerCase().includes('fruta')
      )) {
        const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
        const preco = parseFloat(String(item['PRECO VENDA'] || '0').replace(',', '.'))
        return sum + (estoq * preco)
      }
      return sum
    }, 0)

    const itensSemVenda = filteredData.filter(item => parseInt(item['DIAS S/VND'] || '0') > 7).length
    const totalItens = filteredData.length
    const percentualISV = totalItens > 0 ? ((itensSemVenda / totalItens) * 100) : 0

    const rupturas = filteredData.filter(item => {
      const dias = parseInt(item['DIAS S/VND'] || '0')
      return dias > 7 && dias <= 15
    }).length

    const rentabilidadeMedia = filteredData.reduce((sum, item) => {
      return sum + parseFloat(String(item['PERC RENT'] || '0').replace(',', '.'))
    }, 0) / filteredData.length || 0

    return {
      vendaHF: totalVendaHF,
      percentualISV: percentualISV,
      rupturas: rupturas,
      rentabilidadeMedia: rentabilidadeMedia
    }
  }, [filteredData])

  // Inicializar dados
  useEffect(() => {
    // Carregar checks diários mockados
    const checksMock: CheckDiario[] = [
      {
        data: '2024-01-15',
        vendaHF: 265000,
        isvLoja: 9.5,
        ruptura: 2.1,
        rentabilidade: 22.5,
        observacoes: 'Bom desempenho em hortifrúti, mas ISV ainda acima do esperado',
        status: 'concluido'
      },
      {
        data: '2024-01-14',
        vendaHF: 258000,
        isvLoja: 10.2,
        ruptura: 2.3,
        rentabilidade: 21.8,
        observacoes: 'Dia com baixo movimento, necessário rever estratégias',
        status: 'concluido'
      }
    ]
    setChecksDiarios(checksMock)

    // Carregar metas semanais mockadas
    const metasMock: MetaSemanal[] = [
      {
        id: '1',
        descricao: 'Reduzir ISV para abaixo de 8%',
        responsavel: 'Gerente de Loja',
        prazo: '2024-01-20',
        status: 'em_andamento',
        progresso: 65,
        prioridade: 'alta'
      },
      {
        id: '2',
        descricao: 'Atingir meta de venda HF de R$ 268.963',
        responsavel: 'Equipe de Vendas',
        prazo: '2024-01-21',
        status: 'em_andamento',
        progresso: 85,
        prioridade: 'alta'
      },
      {
        id: '3',
        descricao: 'Implementar novo layout de hortifrúti',
        responsavel: 'Operações',
        prazo: '2024-01-25',
        status: 'nao_iniciado',
        progresso: 0,
        prioridade: 'media'
      },
      {
        id: '4',
        descricao: 'Treinar equipe em vendas consultivas',
        responsavel: 'RH',
        prazo: '2024-01-18',
        status: 'concluido',
        progresso: 100,
        prioridade: 'media'
      }
    ]
    setMetasSemanais(metasMock)

    // Inicializar check atual com dados de hoje
    const hoje = new Date().toISOString().split('T')[0]
    setCheckAtual({
      data: hoje,
      vendaHF: metricasAtuais.vendaHF,
      isvLoja: metricasAtuais.percentualISV,
      ruptura: metricasAtuais.rupturas,
      rentabilidade: metricasAtuais.rentabilidadeMedia,
      observacoes: '',
      status: 'pendente'
    })
  }, [metricasAtuais])

  const salvarCheckDiario = () => {
    if (checkAtual.data && checkAtual.vendaHF !== undefined) {
      const novoCheck: CheckDiario = {
        data: checkAtual.data || '',
        vendaHF: checkAtual.vendaHF || 0,
        isvLoja: checkAtual.isvLoja || 0,
        ruptura: checkAtual.ruptura || 0,
        rentabilidade: checkAtual.rentabilidade || 0,
        observacoes: checkAtual.observacoes || '',
        status: 'concluido'
      }
      
      setChecksDiarios(prev => [novoCheck, ...prev])
      setEditando(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'text-green-600 bg-green-100'
      case 'em_andamento': return 'text-blue-600 bg-blue-100'
      case 'nao_iniciado': return 'text-gray-600 bg-gray-100'
      case 'atrasado': return 'text-red-600 bg-red-100'
      case 'pendente': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'border-red-500'
      case 'media': return 'border-yellow-500'
      case 'baixa': return 'border-green-500'
      default: return 'border-gray-500'
    }
  }

  const calcularDesempenhoSemanal = () => {
    if (checksDiarios.length === 0) return 0
    
    const ultimaSemana = checksDiarios.slice(0, 7)
    const somaVendas = ultimaSemana.reduce((sum, check) => sum + check.vendaHF, 0)
    const mediaVendas = somaVendas / ultimaSemana.length
    
    return (mediaVendas / 268963) * 100 // Percentual da meta
  }

  const desempenhoSemanal = calcularDesempenhoSemanal()
  const metasConcluidas = metasSemanais.filter(meta => meta.status === 'concluido').length
  const metasEmAndamento = metasSemanais.filter(meta => meta.status === 'em_andamento').length

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-800 mb-2">Acompanhamento Diário</h2>
        <p className="text-gray-600">Monitoramento contínuo para atingir as metas</p>
      </div>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {(metricasAtuais.vendaHF / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-gray-600">Venda HF Hoje</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{metricasAtuais.percentualISV.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">ISV Hoje</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{desempenhoSemanal.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Desempenho Semanal</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{metasConcluidas}/{metasSemanais.length}</div>
                <div className="text-sm text-gray-600">Metas Concluídas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="check-diario" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="check-diario">Check Diário</TabsTrigger>
          <TabsTrigger value="metas-semanais">Metas Semanais</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="check-diario" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Check Diário de Metas</CardTitle>
                  <CardDescription>Acompanhamento diário para atingir as metas da diretoria</CardDescription>
                </div>
                <Button 
                  onClick={() => setEditando(!editando)}
                  variant={editando ? "outline" : "default"}
                  className="gap-2"
                >
                  {editando ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  {editando ? "Salvar" : "Editar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={checkAtual.data || ''}
                      onChange={(e) => setCheckAtual(prev => ({ ...prev, data: e.target.value }))}
                      disabled={!editando}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="vendaHF">Venda Hortifrúti (R$)</Label>
                    <Input
                      id="vendaHF"
                      type="number"
                      value={checkAtual.vendaHF || ''}
                      onChange={(e) => setCheckAtual(prev => ({ ...prev, vendaHF: parseFloat(e.target.value) }))}
                      disabled={!editando}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="isvLoja">ISV Loja (%)</Label>
                    <Input
                      id="isvLoja"
                      type="number"
                      step="0.1"
                      value={checkAtual.isvLoja || ''}
                      onChange={(e) => setCheckAtual(prev => ({ ...prev, isvLoja: parseFloat(e.target.value) }))}
                      disabled={!editando}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ruptura">Ruptura Operacional (%)</Label>
                    <Input
                      id="ruptura"
                      type="number"
                      step="0.1"
                      value={checkAtual.ruptura || ''}
                      onChange={(e) => setCheckAtual(prev => ({ ...prev, ruptura: parseFloat(e.target.value) }))}
                      disabled={!editando}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rentabilidade">Rentabilidade Média (%)</Label>
                    <Input
                      id="rentabilidade"
                      type="number"
                      step="0.1"
                      value={checkAtual.rentabilidade || ''}
                      onChange={(e) => setCheckAtual(prev => ({ ...prev, rentabilidade: parseFloat(e.target.value) }))}
                      disabled={!editando}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={checkAtual.observacoes || ''}
                      onChange={(e) => setCheckAtual(prev => ({ ...prev, observacoes: e.target.value }))}
                      disabled={!editando}
                      placeholder="Registre observações importantes do dia..."
                    />
                  </div>
                </div>
              </div>
              
              {editando && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={salvarCheckDiario} className="bg-green-600 hover:bg-green-700">
                    Salvar Check Diário
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status das Metas do Dia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {((checkAtual.vendaHF || 0) / 268963 * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Venda HF vs Meta</div>
                  <Progress value={(checkAtual.vendaHF || 0) / 268963 * 100} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.max(0, 100 - ((checkAtual.isvLoja || 0) / 10 * 100)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">ISV vs Meta (10%)</div>
                  <Progress value={Math.max(0, 100 - ((checkAtual.isvLoja || 0) / 10 * 100))} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(0, 100 - ((checkAtual.ruptura || 0) / 2 * 100)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Ruptura vs Meta (2%)</div>
                  <Progress value={Math.max(0, 100 - ((checkAtual.ruptura || 0) / 2 * 100))} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {((checkAtual.rentabilidade || 0) / 25 * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Rentabilidade vs Meta (25%)</div>
                  <Progress value={(checkAtual.rentabilidade || 0) / 25 * 100} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metas-semanais" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {metasSemanais.map((meta) => (
              <Card key={meta.id} className={`border-l-4 ${getPrioridadeColor(meta.prioridade)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{meta.descricao}</CardTitle>
                      <CardDescription>
                        Responsável: {meta.responsavel} | Prazo: {meta.prazo}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(meta.status)}>
                        {meta.status === 'concluido' ? 'Concluído' :
                         meta.status === 'em_andamento' ? 'Em Andamento' :
                         meta.status === 'nao_iniciado' ? 'Não Iniciado' : 'Atrasado'}
                      </Badge>
                      <Badge className={
                        meta.prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                        meta.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {meta.prioridade === 'alta' ? 'Alta' : meta.prioridade === 'media' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso:</span>
                      <span className="font-medium">{meta.progresso}%</span>
                    </div>
                    <Progress value={meta.progresso} className="h-2" />
                    <div className="text-xs text-gray-600">
                      {meta.status === 'concluido' ? '✓ Meta concluída com sucesso' :
                       meta.status === 'em_andamento' ? '⏳ Meta em andamento' :
                       meta.status === 'nao_iniciado' ? '⏸️ Meta não iniciada' : '⚠️ Meta atrasada'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Adicionar Nova Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Nova Meta Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Descrição da Meta</Label>
                  <Input placeholder="Descreva a meta..." />
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input placeholder="Nome do responsável..." />
                </div>
                <div>
                  <Label>Prazo</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Button className="bg-green-600 hover:bg-green-700">
                  Adicionar Meta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {checksDiarios.map((check, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Check Diário - {check.data}</CardTitle>
                      <CardDescription>
                        Status: <Badge className={getStatusColor(check.status)}>
                          {check.status === 'concluido' ? 'Concluído' :
                           check.status === 'pendente' ? 'Pendente' : 'Atrasado'}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        R$ {(check.vendaHF / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-gray-600">Venda HF</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {check.isvLoja.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">ISV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {check.ruptura.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Ruptura</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {check.rentabilidade.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Rentabilidade</div>
                    </div>
                  </div>
                  {check.observacoes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-1">Observações:</h4>
                      <p className="text-gray-700 text-sm">{check.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}