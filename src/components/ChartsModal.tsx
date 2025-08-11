'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bar, Pie, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { RefreshCw, BarChart3, PieChart as PieChartIcon, TrendingUp, AlertTriangle, DollarSign, Package, Target, X } from 'lucide-react'
import { useData } from '@/contexts/DataContext'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface ChartsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChartsModal({ isOpen, onClose }: ChartsModalProps) {
  const { allData, filteredData } = useData()
  const [loading, setLoading] = useState(false)

  // Calculate summary statistics
  const totalItems = filteredData.length
  const totalStock = filteredData.reduce((sum, item) => sum + parseInt(item['ESTOQ EMB1'] || '0'), 0)
  const totalValue = filteredData.reduce((sum, item) => {
    const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
    const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
    return sum + (estoq * custo)
  }, 0)
  const rupturas = filteredData.filter(item => parseInt(item['DIAS S/VND'] || '0') > 7).length

  // Performance insights
  const insights = useMemo(() => {
    const itemsWithSales = filteredData.filter(item => parseInt(item['QTD VENDA EMB1'] || '0') > 0)
    const itemsWithoutStock = filteredData.filter(item => parseInt(item['ESTOQ EMB1'] || '0') === 0)
    const highValueItems = filteredData.filter(item => {
      const valor = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.')) * parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
      return valor > 10000
    })
    const lowRotationItems = filteredData.filter(item => parseInt(item['DIAS S/VND'] || '0') > 30)
    
    const avgProfit = filteredData.reduce((sum, item) => {
      return sum + parseFloat(String(item['PERC RENT'] || '0').replace(',', '.'))
    }, 0) / filteredData.length || 0

    return {
      salesRate: ((itemsWithSales.length / filteredData.length) * 100).toFixed(1),
      stockOutRate: ((itemsWithoutStock.length / filteredData.length) * 100).toFixed(1),
      highValueCount: highValueItems.length,
      lowRotationRate: ((lowRotationItems.length / filteredData.length) * 100).toFixed(1),
      avgProfit: avgProfit.toFixed(1)
    }
  }, [filteredData])

  // Chart data calculations
  const getSuppliersChartData = () => {
    const supplierCounts: Record<string, number> = {}
    filteredData.forEach(item => {
      const supplier = item.FORNECEDOR || 'Sem Fornecedor'
      supplierCounts[supplier] = (supplierCounts[supplier] || 0) + 1
    })
    
    const topSuppliers = Object.entries(supplierCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    return {
      labels: topSuppliers.map(([supplier]) => supplier.length > 15 ? supplier.substring(0, 15) + '...' : supplier),
      datasets: [{
        label: 'Quantidade de Itens',
        data: topSuppliers.map(([, count]) => count),
        backgroundColor: '#006633',
        borderColor: '#004d26',
        borderWidth: 1
      }]
    }
  }

  const getSectorsChartData = () => {
    const sectorCounts: Record<string, number> = {}
    filteredData.forEach(item => {
      const sector = item.SETOR_LOJA || 'Sem Setor'
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
    })

    const sortedSectors = Object.entries(sectorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)

    return {
      labels: sortedSectors.map(([sector]) => sector),
      datasets: [{
        data: sortedSectors.map(([, count]) => count),
        backgroundColor: [
          '#006633', '#FF6600', '#7C3AED', '#DC2626', '#059669',
          '#0891b2', '#7c3aed', '#db2777'
        ]
      }]
    }
  }

  const getStockChartData = () => {
    const supplierStock: Record<string, number> = {}
    filteredData.forEach(item => {
      const supplier = item.FORNECEDOR || 'Sem Fornecedor'
      const stock = parseInt(item['ESTOQ EMB1'] || '0')
      supplierStock[supplier] = (supplierStock[supplier] || 0) + stock
    })
    
    const topSuppliers = Object.entries(supplierStock)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    return {
      labels: topSuppliers.map(([supplier]) => supplier.length > 15 ? supplier.substring(0, 15) + '...' : supplier),
      datasets: [{
        label: 'Estoque Total (CX)',
        data: topSuppliers.map(([, stock]) => stock),
        backgroundColor: '#FF6600',
        borderColor: '#e55a00',
        borderWidth: 1
      }]
    }
  }

  const getValueChartData = () => {
    const sectorValue: Record<string, number> = {}
    filteredData.forEach(item => {
      const sector = item.SETOR_LOJA || 'Sem Setor'
      const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
      const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
      const value = estoq * custo
      sectorValue[sector] = (sectorValue[sector] || 0) + value
    })

    const sortedSectors = Object.entries(sectorValue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)

    return {
      labels: sortedSectors.map(([sector]) => sector),
      datasets: [{
        data: sortedSectors.map(([, value]) => value),
        backgroundColor: [
          '#006633', '#FF6600', '#7C3AED', '#DC2626', '#059669',
          '#0891b2', '#7c3aed', '#db2777'
        ]
      }]
    }
  }

  const getProfitabilityChartData = () => {
    const sectors = [...new Set(filteredData.map(item => item.SETOR_LOJA).filter(Boolean))]
    
    const sectorProfitability = sectors.map(sector => {
      const sectorItems = filteredData.filter(item => item.SETOR_LOJA === sector)
      const avgProfit = sectorItems.reduce((sum, item) => {
        return sum + parseFloat(String(item['PERC RENT'] || '0').replace(',', '.'))
      }, 0) / sectorItems.length
      
      return {
        sector,
        avgProfit: avgProfit.toFixed(1)
      }
    }).sort((a, b) => parseFloat(b.avgProfit) - parseFloat(a.avgProfit))

    return {
      labels: sectorProfitability.map(item => item.sector),
      datasets: [{
        label: 'Rentabilidade Média (%)',
        data: sectorProfitability.map(item => parseFloat(item.avgProfit)),
        backgroundColor: '#7C3AED',
        borderColor: '#6D28D9',
        borderWidth: 1
      }]
    }
  }

  const getInventoryHealthChartData = () => {
    const healthCategories = {
      'Saudável': filteredData.filter(item => parseInt(item['DIAS S/VND'] || '0') <= 15).length,
      'Atenção': filteredData.filter(item => {
        const dias = parseInt(item['DIAS S/VND'] || '0')
        return dias > 15 && dias <= 30
      }).length,
      'Crítico': filteredData.filter(item => parseInt(item['DIAS S/VND'] || '0') > 30).length
    }

    return {
      labels: Object.keys(healthCategories),
      datasets: [{
        data: Object.values(healthCategories),
        backgroundColor: ['#006633', '#FF6600', '#DC2626']
      }]
    }
  }

  const loadData = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    if (filteredData.length === 0) {
      loadData()
    }
  }, [filteredData])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const horizontalBarChartOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true
      }
    }
  }

  const valueChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.label + ': R$ ' + context.parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          }
        }
      }
    }
  }

  if (!isOpen) return null

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-green-800">Gráficos - Dashboard Atacadão</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum dado disponível</h3>
            <p className="text-gray-600 mb-4">Por favor, carregue um arquivo de dados para visualizar os gráficos.</p>
            <Button onClick={onClose} className="bg-green-800 hover:bg-green-900 text-white">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-green-800">Gráficos - Dashboard Atacadão</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Performance Insights */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights de Desempenho</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="border-l-4 border-l-green-600">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <Target className="h-6 w-6 text-green-600 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-green-600">{insights.salesRate}%</div>
                      <div className="text-xs text-gray-600">Taxa de Vendas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-red-600">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-red-600">{insights.stockOutRate}%</div>
                      <div className="text-xs text-gray-600">Sem Estoque</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-600">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <DollarSign className="h-6 w-6 text-purple-600 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-purple-600">{insights.highValueCount}</div>
                      <div className="text-xs text-gray-600">Itens {'>'} R$10K</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-orange-600">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <Package className="h-6 w-6 text-orange-600 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-orange-600">{insights.lowRotationRate}%</div>
                      <div className="text-xs text-gray-600">Baixa Rotação</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-600">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-blue-600">{insights.avgProfit}%</div>
                      <div className="text-xs text-gray-600">Rentabilidade Média</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-green-800">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">{totalItems.toLocaleString('pt-BR')}</div>
                  <div className="text-sm font-medium mt-1 text-gray-600">Total de Itens</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{totalStock.toLocaleString('pt-BR')}</div>
                  <div className="text-sm font-medium mt-1 text-gray-600">Estoque Total</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm font-medium mt-1 text-gray-600">Valor em Estoque</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{rupturas.toLocaleString('pt-BR')}</div>
                  <div className="text-sm font-medium mt-1 text-gray-600">Itens +7 dias s/venda</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Top 10 Fornecedores por Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={getSuppliersChartData()} options={barChartOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Distribuição por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Pie data={getSectorsChartData()} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Estoque por Fornecedor (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={getStockChartData()} options={horizontalBarChartOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Valor por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut data={getValueChartData()} options={valueChartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Rentabilidade por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={getProfitabilityChartData()} options={barChartOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">Saúde do Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut data={getInventoryHealthChartData()} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}