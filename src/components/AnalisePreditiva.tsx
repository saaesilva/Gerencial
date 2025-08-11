'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, Target, Calendar, BarChart3, DollarSign, Package, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { useData } from '@/contexts/DataContext'

interface Projecao {
  meta: string
  valorAtual: number
  valorMeta: number
  projecaoDia: number
  projecaoSemana: number
  projecaoMes: number
  tendencia: 'positiva' | 'negativa' | 'estavel'
    probabilidadeAlcance: number
    cenarioOtimista: number
    cenarioRealista: number
    cenarioPessimista: number
}

interface Oportunidade {
  id: string
  categoria: string
  descricao: string
  potencial: number
  esforco: 'baixo' | 'medio' | 'alto'
    impacto: 'imediato' | 'curto_prazo' | 'medio_prazo'
}

export default function AnalisePreditiva() {
  const { filteredData } = useData()
  const [projecoes, setProjecoes] = useState<Projecao[]>([])
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])

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

    const rentabilidadeMedia = filteredData.reduce((sum, item) => {
      return sum + parseFloat(String(item['PERC RENT'] || '0').replace(',', '.'))
    }, 0) / filteredData.length || 0

    const valorTotalEstoque = filteredData.reduce((sum, item) => {
      const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
      const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
      return sum + (estoq * custo)
    }, 0)

    return {
      vendaHF: totalVendaHF,
      percentualISV: percentualISV,
      rentabilidadeMedia: rentabilidadeMedia,
      valorTotalEstoque: valorTotalEstoque,
      totalItens: totalItens
    }
  }, [filteredData])

  // Gerar projeções
  useEffect(() => {
    const novasProjecoes: Projecao[] = [
      {
        meta: 'Venda Hortifrúti',
        valorAtual: metricasAtuais.vendaHF,
        valorMeta: 268963,
        projecaoDia: metricasAtuais.vendaHF * 1.02, // 2% crescimento diário
        projecaoSemana: metricasAtuais.vendaHF * 1.15, // 15% crescimento semanal
        projecaoMes: metricasAtuais.vendaHF * 1.35, // 35% crescimento mensal
        tendencia: metricasAtuais.vendaHF > 250000 ? 'positiva' : 'negativa',
        probabilidadeAlcance: Math.min(100, (metricasAtuais.vendaHF / 268963) * 100 + 15),
        cenarioOtimista: metricasAtuais.vendaHF * 1.4,
        cenarioRealista: metricasAtuais.vendaHF * 1.25,
        cenarioPessimista: metricasAtuais.vendaHF * 1.1
      },
      {
        meta: 'ISV Loja',
        valorAtual: metricasAtuais.percentualISV,
        valorMeta: 10,
        projecaoDia: metricasAtuais.percentualISV * 0.95, // 5% redução diária
        projecaoSemana: metricasAtuais.percentualISV * 0.8, // 20% redução semanal
        projecaoMes: metricasAtuais.percentualISV * 0.6, // 40% redução mensal
        tendencia: metricasAtuais.percentualISV < 15 ? 'positiva' : 'negativa',
        probabilidadeAlcance: Math.min(100, ((15 - metricasAtuais.percentualISV) / 15) * 100),
        cenarioOtimista: metricasAtuais.percentualISV * 0.5,
        cenarioRealista: metricasAtuais.percentualISV * 0.7,
        cenarioPessimista: metricasAtuais.percentualISV * 0.85
      },
      {
        meta: 'Rentabilidade Média',
        valorAtual: metricasAtuais.rentabilidadeMedia,
        valorMeta: 25,
        projecaoDia: metricasAtuais.rentabilidadeMedia * 1.01, // 1% crescimento diário
        projecaoSemana: metricasAtuais.rentabilidadeMedia * 1.05, // 5% crescimento semanal
        projecaoMes: metricasAtuais.rentabilidadeMedia * 1.15, // 15% crescimento mensal
        tendencia: metricasAtuais.rentabilidadeMedia > 20 ? 'positiva' : 'negativa',
        probabilidadeAlcance: Math.min(100, (metricasAtuais.rentabilidadeMedia / 25) * 100 + 10),
        cenarioOtimista: metricasAtuais.rentabilidadeMedia * 1.2,
        cenarioRealista: metricasAtuais.rentabilidadeMedia * 1.1,
        cenarioPessimista: metricasAtuais.rentabilidadeMedia * 1.05
      }
    ]
    setProjecoes(novasProjecoes)
  }, [metricasAtuais])

  // Gerar oportunidades
  useEffect(() => {
    const novasOportunidades: Oportunidade[] = [
      {
        id: 'oportunidade_1',
        categoria: 'Vendas',
        descricao: 'Produtos de alto valor com baixo giro - potencial de R$ 45.000',
        potencial: 45000,
        esforco: 'medio',
        impacto: 'curto_prazo'
      },
      {
        id: 'oportunidade_2',
        categoria: 'Estoque',
        descricao: 'Redução de perdas em hortifrúti - economia estimada de R$ 12.000',
        potencial: 12000,
        esforco: 'baixo',
        impacto: 'imediato'
      },
      {
        id: 'oportunidade_3',
        categoria: 'Rentabilidade',
        descricao: 'Reajuste de preços em produtos com margem abaixo de 15% - impacto de R$ 28.000',
        potencial: 28000,
        esforco: 'baixo',
        impacto: 'curto_prazo'
      },
      {
        id: 'oportunidade_4',
        categoria: 'Operação',
        descricao: 'Otimização de espaço e exposição - aumento estimado de 8% em vendas',
        potencial: 35000,
        esforco: 'alto',
        impacto: 'medio_prazo'
      },
      {
        id: 'oportunidade_5',
        categoria: 'Marketing',
        descricao: 'Campanha de produtos de estação - potencial adicional de R$ 22.000',
        potencial: 22000,
        esforco: 'medio',
        impacto: 'curto_prazo'
      }
    ]
    setOportunidades(novasOportunidades)
  }, [])

  // Dados para gráfico de projeção
  const dadosProjecao = useMemo(() => {
    const dias = ['Hoje', '+3 dias', '+7 dias', '+15 dias', '+30 dias']
    return dias.map((dia, index) => ({
      dia,
      'Venda HF': projecoes[0]?.valorMeta ? 
        Math.min(projecoes[0].valorMeta, projecoes[0].valorAtual * (1 + (index * 0.02))) : 0,
      'Meta Venda HF': 268963
    }))
  }, [projecoes])

  // Dados para gráfico de oportunidades
  const dadosOportunidades = useMemo(() => {
    return oportunidades.map(opp => ({
      categoria: opp.categoria,
      potencial: opp.potencial / 1000, // Converter para milhares
      esforco: opp.esforco === 'baixo' ? 1 : opp.esforco === 'medio' ? 2 : 3
    }))
  }, [oportunidades])

  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'positiva': return 'text-green-600'
      case 'negativa': return 'text-red-600'
      case 'estavel': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'positiva': return <TrendingUp className="h-4 w-4" />
      case 'negativa': return <TrendingDown className="h-4 w-4" />
      case 'estavel': return <Target className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getProbabilidadeColor = (probabilidade: number) => {
    if (probabilidade >= 80) return 'text-green-600 bg-green-100'
    if (probabilidade >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getEsforcoColor = (esforco: string) => {
    switch (esforco) {
      case 'baixo': return 'bg-green-100 text-green-800'
      case 'medio': return 'bg-yellow-100 text-yellow-800'
      case 'alto': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const potencialTotal = oportunidades.reduce((sum, opp) => sum + opp.potencial, 0)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-800 mb-2">Análise Preditiva</h2>
        <p className="text-gray-600">Projeções e oportunidades para atingir as metas</p>
      </div>

      {/* Resumo de Oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {(potencialTotal / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-gray-600">Potencial Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{oportunidades.length}</div>
                <div className="text-sm text-gray-600">Oportunidades</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {projecoes.length > 0 ? Math.round(projecoes.reduce((sum, p) => sum + p.probabilidadeAlcance, 0) / projecoes.length) : 0}%
                </div>
                <div className="text-sm text-gray-600">Probabilidade Média</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projecoes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
          <TabsTrigger value="cenarios">Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="projecoes" className="space-y-4">
          {/* Gráfico de Projeção */}
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Venda Hortifrúti</CardTitle>
              <CardDescription>Tendência de crescimento em relação à meta</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosProjecao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']} />
                  <Line type="monotone" dataKey="Venda HF" stroke="#006633" strokeWidth={3} />
                  <Line type="monotone" dataKey="Meta Venda HF" stroke="#FF6600" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Projeções Detalhadas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {projecoes.map((proj) => (
              <Card key={proj.meta} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{proj.meta}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getTendenciaIcon(proj.tendencia)}
                    <span className={`text-sm font-medium ${getTendenciaColor(proj.tendencia)}`}>
                      Tendência {proj.tendencia}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Atual:</span>
                      <span className="font-medium">
                        {proj.meta.includes('Venda') ? 'R$ ' : ''}
                        {proj.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {proj.meta.includes('ISV') || proj.meta.includes('Rentabilidade') ? '%' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Meta:</span>
                      <span className="font-medium">
                        {proj.meta.includes('Venda') ? 'R$ ' : ''}
                        {proj.valorMeta.toLocaleString('pt-BR')}
                        {proj.meta.includes('ISV') || proj.meta.includes('Rentabilidade') ? '%' : ''}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Prob. Alcance:</span>
                        <span className="font-medium">{proj.probabilidadeAlcance.toFixed(0)}%</span>
                      </div>
                      <Progress value={proj.probabilidadeAlcance} className="h-2" />
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Projeção 7 dias: {proj.meta.includes('Venda') ? 'R$ ' : ''}{proj.projecaoSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{proj.meta.includes('ISV') || proj.meta.includes('Rentabilidade') ? '%' : ''}</div>
                      <div>Projeção 30 dias: {proj.meta.includes('Venda') ? 'R$ ' : ''}{proj.projecaoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{proj.meta.includes('ISV') || proj.meta.includes('Rentabilidade') ? '%' : ''}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="oportunidades" className="space-y-4">
          {/* Gráfico de Oportunidades */}
          <Card>
            <CardHeader>
              <CardTitle>Potencial por Categoria</CardTitle>
              <CardDescription>Oportunidades identificadas por potencial de impacto</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosOportunidades}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}K`, 'Potencial']} />
                  <Bar dataKey="potencial" fill="#006633" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lista de Oportunidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {oportunidades.map((oportunidade) => (
              <Card key={oportunidade.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{oportunidade.categoria}</CardTitle>
                    <Badge className={getEsforcoColor(oportunidade.esforco)}>
                      Esforço: {oportunidade.esforco}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{oportunidade.descricao}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      R$ {oportunidade.potencial.toLocaleString('pt-BR')}
                    </span>
                    <Badge className={
                      oportunidade.impacto === 'imediato' ? 'bg-red-100 text-red-800' :
                      oportunidade.impacto === 'curto_prazo' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {oportunidade.impacto === 'imediato' ? 'Imediato' :
                       oportunidade.impacto === 'curto_prazo' ? 'Curto Prazo' : 'Médio Prazo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cenarios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {projecoes.map((proj) => (
              <Card key={proj.meta}>
                <CardHeader>
                  <CardTitle className="text-lg">{proj.meta}</CardTitle>
                  <CardDescription>Análise de cenários</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-green-800">Cenário Otimista</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {proj.meta.includes('Venda') ? 'R$ ' : ''}
                        {proj.cenarioOtimista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {proj.meta.includes('ISV') || proj.meta.includes('Rentabilidade') ? '%' : ''}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-blue-800">Cenário Realista</span>
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {proj.meta.includes('Venda') ? 'R$ ' : ''}
                        {proj.cenarioRealista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {proj.meta.includes('ISV') || proj.meta.includes('Rentabilidade') ? '%' : ''}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-orange-800">Cenário Pessimista</span>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        {proj.meta.includes('Venda') ? 'R$ ' : ''}
                        {proj.cenarioPessimista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {proj.meta.includes('ISV') || proj.meta.includes('Rentabilidade') ? '%' : ''}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recomendações Estratégicas */}
          <Card>
            <CardHeader>
              <CardTitle>Estratégias Recomendadas por Cenário</CardTitle>
              <CardDescription>Ações específicas para cada cenário projetado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-green-800 mb-3">Cenário Otimista</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Acelerar investimentos em marketing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Expandir mix de produtos premium</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Capacitar equipe para vendas consultivas</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-3">Cenário Realista</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Manter foco em operação eficiente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Otimizar gestão de estoque</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Monitorar indicadores diariamente</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-orange-800 mb-3">Cenário Pessimista</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>Reduzir custos operacionais</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>Renegociar contratos com fornecedores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>Focar em produtos de maior giro</span>
                    </li>
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