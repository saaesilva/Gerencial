'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, TrendingUp, AlertTriangle, CheckCircle, Clock, Lightbulb, BarChart3, Users, Package, DollarSign, Star, Award } from 'lucide-react'
import { useData } from '@/contexts/DataContext'

interface Meta {
  id: string
  nome: string
  valorMeta: number
  valorRealizado: number
  unidade: string
  percentualAlcance: number
  status: 'acima' | 'dentro' | 'abaixo' | 'critico'
  prioridade: 'alta' | 'media' | 'baixa'
}

interface Recomendacao {
  id: string
  meta: string
  titulo: string
  descricao: string
  impacto: 'alto' | 'medio' | 'baixo'
  urgencia: 'imediata' | 'curto_prazo' | 'medio_prazo'
  acao: string
}

export default function MetasDashboard() {
  const { filteredData } = useData()
  const [metas, setMetas] = useState<Meta[]>([])
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([])

  // Calcular métricas atuais
  const metricasAtuais = useMemo(() => {
    const totalVendaHF = filteredData.reduce((sum, item) => {
      // Considerando que itens de hortifruti têm setor específico
      if (item.SETOR_LOJA && item.SETOR_LOJA.toLowerCase().includes('horti') || 
          item.SETOR_LOJA.toLowerCase().includes('fruti') ||
          item.SETOR_LOJA.toLowerCase().includes('verdura') ||
          item.SETOR_LOJA.toLowerCase().includes('fruta')) {
        const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
        const preco = parseFloat(String(item['PRECO VENDA'] || '0').replace(',', '.'))
        return sum + (estoq * preco)
      }
      return sum
    }, 0)

    const totalPerdaHF = filteredData.reduce((sum, item) => {
      if (item.SETOR_LOJA && item.SETOR_LOJA.toLowerCase().includes('horti') || 
          item.SETOR_LOJA.toLowerCase().includes('fruti')) {
        const perda = parseFloat(String(item['PERDA'] || '0').replace(',', '.'))
        return sum + perda
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
      perdaHF: totalPerdaHF,
      percentualISV: percentualISV,
      rupturas: rupturas,
      rentabilidadeMedia: rentabilidadeMedia,
      totalItens: totalItens
    }
  }, [filteredData])

  // Definir metas com base no documento
  useEffect(() => {
    const metasCalculadas: Meta[] = [
      {
        id: 'venda_hf',
        nome: 'Venda Hortifrúti',
        valorMeta: 268963,
        valorRealizado: metricasAtuais.vendaHF,
        unidade: 'R$',
        percentualAlcance: (metricasAtuais.vendaHF / 268963) * 100,
        status: metricasAtuais.vendaHF >= 268963 ? 'acima' : metricasAtuais.vendaHF >= 260000 ? 'dentro' : 'abaixo',
        prioridade: 'alta'
      },
      {
        id: 'perda_hf',
        nome: 'Perda Hortifrúti',
        valorMeta: 15,
        valorRealizado: 0, // Dado do documento
        unidade: '%',
        percentualAlcance: 100, // 0% de perda = 100% de alcance da meta
        status: 'acima',
        prioridade: 'media'
      },
      {
        id: 'isv_loja',
        nome: 'ISV Loja',
        valorMeta: 100,
        valorRealizado: 90, // Dado do documento
        unidade: '%',
        percentualAlcance: 90,
        status: 'dentro',
        prioridade: 'alta'
      },
      {
        id: 'ruptura_op',
        nome: 'Ruptura Operacional',
        valorMeta: 2,
        valorRealizado: 2, // Dado do documento
        unidade: '%',
        percentualAlcance: 100,
        status: 'acima',
        prioridade: 'media'
      },
      {
        id: 'rentabilidade',
        nome: 'Rentabilidade Média',
        valorMeta: 25,
        valorRealizado: metricasAtuais.rentabilidadeMedia,
        unidade: '%',
        percentualAlcance: (metricasAtuais.rentabilidadeMedia / 25) * 100,
        status: metricasAtuais.rentabilidadeMedia >= 25 ? 'acima' : metricasAtuais.rentabilidadeMedia >= 20 ? 'dentro' : 'abaixo',
        prioridade: 'alta'
      }
    ]
    setMetas(metasCalculadas)
  }, [metricasAtuais])

  // Gerar recomendações baseadas nas metas
  useEffect(() => {
    const novasRecomendacoes: Recomendacao[] = []

    // Recomendações para Venda HF
    if (metricasAtuais.vendaHF < 260000) {
      novasRecomendacoes.push({
        id: 'venda_hf_1',
        meta: 'Venda Hortifrúti',
        titulo: 'Aumentar Vendas de Hortifrúti',
        descricao: 'Faltam R$ ' + (268963 - metricasAtuais.vendaHF).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' para atingir a meta',
        impacto: 'alto',
        urgencia: 'imediata',
        acao: 'Promover campanha de frutas e verduras da estação com descontos progressivos'
      })
    }

    // Recomendações para ISV
    if (metricasAtuais.percentualISV > 10) {
      novasRecomendacoes.push({
        id: 'isv_1',
        meta: 'ISV Loja',
        titulo: 'Reduzir Itens Sem Venda',
        descricao: 'Atualmente ' + metricasAtuais.percentualISV.toFixed(1) + '% dos itens estão sem venda há mais de 7 dias',
        impacto: 'alto',
        urgencia: 'curto_prazo',
        acao: 'Realizar ação de queima de estoque para itens com mais de 15 dias sem venda'
      })
    }

    // Recomendações para Rentabilidade
    if (metricasAtuais.rentabilidadeMedia < 20) {
      novasRecomendacoes.push({
        id: 'rent_1',
        meta: 'Rentabilidade',
        titulo: 'Melhorar Margem de Lucro',
        descricao: 'Rentabilidade média atual de ' + metricasAtuais.rentabilidadeMedia.toFixed(1) + '% está abaixo da meta',
        impacto: 'alto',
        urgencia: 'curto_prazo',
        acao: 'Revisar preços de produtos com rentabilidade abaixo de 15%'
      })
    }

    // Recomendações gerais
    novasRecomendacoes.push({
      id: 'geral_1',
      meta: 'Geral',
      titulo: 'Otimizar Gestão de Estoque',
      descricao: 'Identificar oportunidades de melhoria na gestão de produtos',
      impacto: 'medio',
      urgencia: 'medio_prazo',
      acao: 'Implementar análise semanal de curva ABC e giro de estoque'
    })

    setRecomendacoes(novasRecomendacoes)
  }, [metricasAtuais])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acima': return 'text-green-600 bg-green-100'
      case 'dentro': return 'text-yellow-600 bg-yellow-100'
      case 'abaixo': return 'text-orange-600 bg-orange-100'
      case 'critico': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactoColor = (impacto: string) => {
    switch (impacto) {
      case 'alto': return 'border-red-500'
      case 'medio': return 'border-yellow-500'
      case 'baixo': return 'border-green-500'
      default: return 'border-gray-500'
    }
  }

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'imediata': return 'bg-red-100 text-red-800'
      case 'curto_prazo': return 'bg-orange-100 text-orange-800'
      case 'medio_prazo': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const metasCriticas = metas.filter(meta => meta.status === 'abaixo' || meta.status === 'critico')
  const metasAlcancadas = metas.filter(meta => meta.status === 'acima')

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-800 mb-2">Painel de Metas Estratégicas</h2>
        <p className="text-gray-600">Acompanhamento em tempo real para atingir as metas da diretoria</p>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-600">{metas.length}</div>
                <div className="text-sm text-gray-600">Total de Metas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-red-600">{metasCriticas.length}</div>
                <div className="text-sm text-gray-600">Metas Críticas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{metasAlcancadas.length}</div>
                <div className="text-sm text-gray-600">Metas Alcancadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {metasCriticas.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção!</strong> Existem {metasCriticas.length} meta(s) crítica(s) que precisam de ação imediata.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="metas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metas">Acompanhamento de Metas</TabsTrigger>
          <TabsTrigger value="recomendacoes">Recomendações</TabsTrigger>
          <TabsTrigger value="acoes">Plano de Ação</TabsTrigger>
        </TabsList>

        <TabsContent value="metas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metas.map((meta) => (
              <Card key={meta.id} className={`border-l-4 ${
                meta.prioridade === 'alta' ? 'border-l-red-500' : 
                meta.prioridade === 'media' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{meta.nome}</CardTitle>
                    <Badge className={getStatusColor(meta.status)}>
                      {meta.status === 'acima' ? 'Acima' : 
                       meta.status === 'dentro' ? 'Dentro' : 
                       meta.status === 'abaixo' ? 'Abaixo' : 'Crítico'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Prioridade: {meta.prioridade === 'alta' ? 'Alta' : meta.prioridade === 'media' ? 'Média' : 'Baixa'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Meta:</span>
                      <span className="font-medium">
                        {meta.unidade === 'R$' ? 'R$ ' : ''}{meta.valorMeta.toLocaleString('pt-BR')}{meta.unidade}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Realizado:</span>
                      <span className="font-medium">
                        {meta.unidade === 'R$' ? 'R$ ' : ''}{meta.valorRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{meta.unidade}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Alcance:</span>
                        <span className="font-medium">{meta.percentualAlcance.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={meta.percentualAlcance} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recomendacoes" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {recomendacoes.map((rec) => (
              <Card key={rec.id} className={`border-l-4 ${getImpactoColor(rec.impacto)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        {rec.titulo}
                      </CardTitle>
                      <CardDescription>Meta: {rec.meta}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getImpactoColor(rec.impacto).replace('border-', 'bg-').replace('-500', '-100 text-').replace('-500', '-800')}>
                        Impacto: {rec.impacto}
                      </Badge>
                      <Badge className={getUrgenciaColor(rec.urgencia)}>
                        {rec.urgencia === 'imediata' ? 'Imediata' : 
                         rec.urgencia === 'curto_prazo' ? 'Curto Prazo' : 'Médio Prazo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{rec.descricao}</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Ação Recomendada:</h4>
                    <p className="text-blue-700">{rec.acao}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="acoes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ações Imediatas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  Ações Imediatas (Hoje/Amanhã)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800">Queima de Estoque</h4>
                  <p className="text-sm text-red-700">Identificar itens com +15 dias sem venda e criar promoções relâmpago</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800">Revisão de Preços</h4>
                  <p className="text-sm text-orange-700">Ajustar preços de produtos com rentabilidade abaixo de 15%</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800">Campanha Hortifrúti</h4>
                  <p className="text-sm text-yellow-700">Lançar promoção de frutas e verduras com desconto de 10%</p>
                </div>
              </CardContent>
            </Card>

            {/* Ações de Curto Prazo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Ações de Curto Prazo (Esta Semana)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Análise de Giro</h4>
                  <p className="text-sm text-blue-700">Realizar análise ABC dos produtos por giro de estoque</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Negociação com Fornecedores</h4>
                  <p className="text-sm text-green-700">Renegociar prazos e condições com fornecedores críticos</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">Treinamento de Equipe</h4>
                  <p className="text-sm text-purple-700">Capacitar equipe sobre técnicas de venda e gestão de estoque</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plano Semanal */}
          <Card>
            <CardHeader>
              <CardTitle>Plano de Ação Semanal</CardTitle>
              <CardDescription>Checklist para atingir as metas da diretoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-800">Segunda-Terça</h4>
                  <ul className="text-sm space-y-1">
                    <li>✓ Analisar itens críticos</li>
                    <li>✓ Definir promoções</li>
                    <li>✓ Ajustar preços</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-blue-800">Quarta-Quinta</h4>
                  <ul className="text-sm space-y-1">
                    <li>✓ Implementar ações</li>
                    <li>✓ Monitorar resultados</li>
                    <li>✓ Ajustar estratégias</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-purple-800">Sexta-Sábado</h4>
                  <ul className="text-sm space-y-1">
                    <li>✓ Avaliar resultados</li>
                    <li>✓ Planejar próxima semana</li>
                    <li>✓ Relatório para diretoria</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}