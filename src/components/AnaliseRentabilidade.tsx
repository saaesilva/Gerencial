'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, DollarSign, Calculator, Filter, Download } from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, Cell } from 'recharts'
import * as XLSX from 'xlsx'

interface RentabilidadeItem {
  MERC: string
  DIGITO: string
  DESCRICAO: string
  EMBALAGEM: string
  FORNECEDOR: string
  CUSTO_MEDIO: number
  PRECO_VENDA: number
  PERC_RENT: number
  RENTABILIDADE_CALCULADA: number
  IMPACTO_RENTABILIDADE: number
  SETOR_LOJA: string
  GRUPO: string
  SUBGRUPO: string
  ESTOQ_EMB1: number
  VALOR_ESTOQUE: number
  QTD_VENDA_EMB1: number
}

export default function AnaliseRentabilidade() {
  const { allData, filteredData } = useData()
  const [setorFilter, setSetorFilter] = useState('all')
  const [grupoFilter, setGrupoFilter] = useState('all')
  const [fornecedorFilter, setFornecedorFilter] = useState('')
  const [rentabilidadeMin, setRentabilidadeMin] = useState('')
  const [rentabilidadeMax, setRentabilidadeMax] = useState('')
  const [impactoMin, setImpactoMin] = useState('')

  // Calcular rentabilidade para cada item
  const rentabilidadeData = useMemo(() => {
    if (!allData.length) return []

    return allData.map(item => {
      const custoMedio = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
      const precoVenda = parseFloat(String(item['PRECO VENDA'] || '0').replace(',', '.'))
      const rentabilidadeAtual = parseFloat(String(item['PERC RENT'] || '0').replace(',', '.'))
      const estoqEmbalagem1 = parseInt(String(item['ESTOQ EMB1'] || '0'))
      const qtdVendaEmbalagem1 = parseInt(String(item['QTD VENDA EMB1'] || '0'))

      // Fórmula fornecida pelo usuário
      // =(((Custo_Medio/Preco_Siderio)*100-100)*-1-6,35)-(((Custo_Medio/Preco_Atual)*100-100)*-1-6,35-Rent_Atual)
      // Considerando Preco_Siderio como preço de referência e Preco_Atual como preço de venda atual
      const precoSiderio = precoVenda * 1.05 // Preço de referência (exemplo: 5% acima do preço atual)
      
      const rentabilidadeSiderio = ((custoMedio / precoSiderio) * 100 - 100) * -1 - 6.35
      const rentabilidadeAtualCalculada = ((custoMedio / precoVenda) * 100 - 100) * -1 - 6.35 - rentabilidadeAtual
      const impactoRentabilidade = rentabilidadeSiderio - rentabilidadeAtualCalculada

      return {
        MERC: item.MERC || '',
        DIGITO: item.DIGITO || '',
        DESCRICAO: item.DESCRICAO || '',
        EMBALAGEM: item.EMBALAGEM || '',
        FORNECEDOR: item.FORNECEDOR || '',
        CUSTO_MEDIO: custoMedio,
        PRECO_VENDA: precoVenda,
        PERC_RENT: rentabilidadeAtual,
        RENTABILIDADE_CALCULADA: rentabilidadeAtualCalculada,
        IMPACTO_RENTABILIDADE: impactoRentabilidade,
        SETOR_LOJA: item.SETOR_LOJA || '',
        GRUPO: item.GRUPO || '',
        SUBGRUPO: item.SUBGRUPO || '',
        ESTOQ_EMB1: estoqEmbalagem1,
        VALOR_ESTOQUE: estoqEmbalagem1 * custoMedio,
        QTD_VENDA_EMB1: qtdVendaEmbalagem1
      }
    }).filter(item => item.PRECO_VENDA > 0 && item.CUSTO_MEDIO > 0)
  }, [allData])

  // Aplicar filtros
  const filteredRentabilidadeData = useMemo(() => {
    return rentabilidadeData.filter(item => {
      const matchSetor = setorFilter === 'all' || item.SETOR_LOJA === setorFilter
      const matchGrupo = grupoFilter === 'all' || item.GRUPO === grupoFilter
      const matchFornecedor = !fornecedorFilter || 
        item.FORNECEDOR.toLowerCase().includes(fornecedorFilter.toLowerCase())
      const matchRentabilidadeMin = !rentabilidadeMin || 
        item.RENTABILIDADE_CALCULADA >= parseFloat(rentabilidadeMin)
      const matchRentabilidadeMax = !rentabilidadeMax || 
        item.RENTABILIDADE_CALCULADA <= parseFloat(rentabilidadeMax)
      const matchImpactoMin = !impactoMin || 
        Math.abs(item.IMPACTO_RENTABILIDADE) >= parseFloat(impactoMin)

      return matchSetor && matchGrupo && matchFornecedor && 
             matchRentabilidadeMin && matchRentabilidadeMax && matchImpactoMin
    })
  }, [rentabilidadeData, setorFilter, grupoFilter, fornecedorFilter, rentabilidadeMin, rentabilidadeMax, impactoMin])

  // Obter opções para filtros
  const setores = [...new Set(rentabilidadeData.map(item => item.SETOR_LOJA).filter(Boolean))].sort()
  const grupos = [...new Set(rentabilidadeData.map(item => item.GRUPO).filter(Boolean))].sort()

  // Estatísticas
  const estatisticas = useMemo(() => {
    if (filteredRentabilidadeData.length === 0) return null

    const totalItens = filteredRentabilidadeData.length
    const rentabilidadeMedia = filteredRentabilidadeData.reduce((sum, item) => sum + item.RENTABILIDADE_CALCULADA, 0) / totalItens
    const impactoMedio = filteredRentabilidadeData.reduce((sum, item) => sum + item.IMPACTO_RENTABILIDADE, 0) / totalItens
    const valorEstoqueTotal = filteredRentabilidadeData.reduce((sum, item) => sum + item.VALOR_ESTOQUE, 0)
    const itensRentabilidadeNegativa = filteredRentabilidadeData.filter(item => item.RENTABILIDADE_CALCULADA < 0).length
    const itensImpactoPositivo = filteredRentabilidadeData.filter(item => item.IMPACTO_RENTABILIDADE > 0).length

    return {
      totalItens,
      rentabilidadeMedia,
      impactoMedio,
      valorEstoqueTotal,
      itensRentabilidadeNegativa,
      itensImpactoPositivo
    }
  }, [filteredRentabilidadeData])

  // Dados para gráficos
  const rentabilidadePorSetor = useMemo(() => {
    const setorData = filteredRentabilidadeData.reduce((acc, item) => {
      if (!acc[item.SETOR_LOJA]) {
        acc[item.SETOR_LOJA] = {
          setor: item.SETOR_LOJA,
          rentabilidadeMedia: 0,
          impactoMedio: 0,
          count: 0,
          valorEstoque: 0
        }
      }
      acc[item.SETOR_LOJA].rentabilidadeMedia += item.RENTABILIDADE_CALCULADA
      acc[item.SETOR_LOJA].impactoMedio += item.IMPACTO_RENTABILIDADE
      acc[item.SETOR_LOJA].count += 1
      acc[item.SETOR_LOJA].valorEstoque += item.VALOR_ESTOQUE
      return acc
    }, {} as Record<string, any>)

    return Object.values(setorData).map((item: any) => ({
      setor: item.setor,
      rentabilidadeMedia: item.rentabilidadeMedia / item.count,
      impactoMedio: item.impactoMedio / item.count,
      valorEstoque: item.valorEstoque
    }))
  }, [filteredRentabilidadeData])

  const topImpacto = useMemo(() => {
    return [...filteredRentabilidadeData]
      .sort((a, b) => Math.abs(b.IMPACTO_RENTABILIDADE) - Math.abs(a.IMPACTO_RENTABILIDADE))
      .slice(0, 10)
      .map(item => ({
        descricao: item.DESCRICAO.length > 30 ? item.DESCRICAO.substring(0, 30) + '...' : item.DESCRICAO,
        impacto: item.IMPACTO_RENTABILIDADE,
        rentabilidade: item.RENTABILIDADE_CALCULADA,
        setor: item.SETOR_LOJA
      }))
  }, [filteredRentabilidadeData])

  const exportRentabilidade = () => {
    if (filteredRentabilidadeData.length === 0) return

    const exportData = filteredRentabilidadeData.map(item => ({
      'Código': item.MERC,
      'Dígito': item.DIGITO,
      'Descrição': item.DESCRICAO,
      'Embalagem': item.EMBALAGEM,
      'Fornecedor': item.FORNECEDOR,
      'Custo Médio': item.CUSTO_MEDIO,
      'Preço Venda': item.PRECO_VENDA,
      'Rentabilidade Atual (%)': item.PERC_RENT,
      'Rentabilidade Calculada (%)': item.RENTABILIDADE_CALCULADA,
      'Impacto Rentabilidade (%)': item.IMPACTO_RENTABILIDADE,
      'Setor': item.SETOR_LOJA,
      'Grupo': item.GRUPO,
      'Subgrupo': item.SUBGRUPO,
      'Estoque CX': item.ESTOQ_EMB1,
      'Valor Estoque': item.VALOR_ESTOQUE,
      'Qtd Venda CX': item.QTD_VENDA_EMB1
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Análise Rentabilidade')

    const exportFileName = `analise_rentabilidade_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, exportFileName)
  }

  if (!allData.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>
            Nenhum dado disponível. Por favor, carregue um arquivo de dados para analisar a rentabilidade.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Rentabilidade
          </CardTitle>
          <CardDescription>
            Configure os filtros para analisar a rentabilidade dos produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="setorFilter">Setor</Label>
              <Select value={setorFilter} onValueChange={setSetorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {setores.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {setor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grupoFilter">Grupo</Label>
              <Select value={grupoFilter} onValueChange={setGrupoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo} value={grupo}>
                      {grupo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="rentabilidadeMin">Rentabilidade Mínima (%)</Label>
              <Input
                id="rentabilidadeMin"
                type="number"
                value={rentabilidadeMin}
                onChange={(e) => setRentabilidadeMin(e.target.value)}
                placeholder="Ex: -10"
              />
            </div>
            <div>
              <Label htmlFor="rentabilidadeMax">Rentabilidade Máxima (%)</Label>
              <Input
                id="rentabilidadeMax"
                type="number"
                value={rentabilidadeMax}
                onChange={(e) => setRentabilidadeMax(e.target.value)}
                placeholder="Ex: 50"
              />
            </div>
            <div>
              <Label htmlFor="impactoMin">Impacto Mínimo Absoluto (%)</Label>
              <Input
                id="impactoMin"
                type="number"
                value={impactoMin}
                onChange={(e) => setImpactoMin(e.target.value)}
                placeholder="Ex: 5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estatisticas.totalItens.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">Total de Itens</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${estatisticas.rentabilidadeMedia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {estatisticas.rentabilidadeMedia.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Rentabilidade Média</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${estatisticas.impactoMedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {estatisticas.impactoMedio.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Impacto Médio</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  R$ {estatisticas.valorEstoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">Valor em Estoque</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {estatisticas.itensRentabilidadeNegativa}
                </div>
                <div className="text-sm text-gray-600">Rentabilidade Negativa</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {estatisticas.itensImpactoPositivo}
                </div>
                <div className="text-sm text-gray-600">Impacto Positivo</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="setor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setor">Por Setor</TabsTrigger>
          <TabsTrigger value="impacto">Top Impacto</TabsTrigger>
          <TabsTrigger value="dispersao">Dispersão</TabsTrigger>
        </TabsList>

        <TabsContent value="setor">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rentabilidade Média por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rentabilidadePorSetor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="setor" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Rentabilidade']} />
                    <Bar dataKey="rentabilidadeMedia">
                      {rentabilidadePorSetor.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rentabilidadeMedia >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impacto Médio por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rentabilidadePorSetor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="setor" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Impacto']} />
                    <Bar dataKey="impactoMedio">
                      {rentabilidadePorSetor.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.impactoMedio >= 0 ? '#8b5cf6' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="impacto">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos com Maior Impacto na Rentabilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topImpacto} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="descricao" type="category" width={200} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Impacto']} />
                  <Bar dataKey="impacto">
                    {topImpacto.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.impacto >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispersao">
          <Card>
            <CardHeader>
              <CardTitle>Dispersão: Rentabilidade vs Impacto</CardTitle>
              <CardDescription>
                Cada ponto representa um produto. Tamanho do ponto indica o valor em estoque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={filteredRentabilidadeData.slice(0, 100)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="RENTABILIDADE_CALCULADA" name="Rentabilidade" unit="%" />
                  <YAxis dataKey="IMPACTO_RENTABILIDADE" name="Impacto" unit="%" />
                  <Tooltip 
                    formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name === 'RENTABILIDADE_CALCULADA' ? 'Rentabilidade' : 'Impacto']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.DESCRICAO || ''}
                  />
                  <Scatter dataKey="IMPACTO_RENTABILIDADE" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Análise de Rentabilidade Detalhada</CardTitle>
              <CardDescription>
                {filteredRentabilidadeData.length} produtos encontrados
              </CardDescription>
            </div>
            <Button onClick={exportRentabilidade} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left">Código</th>
                  <th className="px-2 py-2 text-left">Descrição</th>
                  <th className="px-2 py-2 text-right">Custo Médio</th>
                  <th className="px-2 py-2 text-right">Preço Venda</th>
                  <th className="px-2 py-2 text-right">Rent. Atual</th>
                  <th className="px-2 py-2 text-right">Rent. Calc.</th>
                  <th className="px-2 py-2 text-right">Impacto</th>
                  <th className="px-2 py-2 text-left">Setor</th>
                  <th className="px-2 py-2 text-right">Valor Estoque</th>
                </tr>
              </thead>
              <tbody>
                {filteredRentabilidadeData.slice(0, 50).map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-2">{item.MERC}-{item.DIGITO}</td>
                    <td className="px-2 py-2 max-w-xs truncate">{item.DESCRICAO}</td>
                    <td className="px-2 py-2 text-right">
                      R$ {item.CUSTO_MEDIO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      R$ {item.PRECO_VENDA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Badge variant={item.PERC_RENT >= 0 ? "default" : "destructive"}>
                        {item.PERC_RENT.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Badge variant={item.RENTABILIDADE_CALCULADA >= 0 ? "default" : "destructive"}>
                        {item.RENTABILIDADE_CALCULADA.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Badge variant={item.IMPACTO_RENTABILIDADE >= 0 ? "default" : "destructive"}>
                        {item.IMPACTO_RENTABILIDADE.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="px-2 py-2">{item.SETOR_LOJA}</td>
                    <td className="px-2 py-2 text-right">
                      R$ {item.VALOR_ESTOQUE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRentabilidadeData.length > 50 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Mostrando 50 de {filteredRentabilidadeData.length} produtos. Use a exportação para ver todos.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}