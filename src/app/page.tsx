'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Download, FileText, BarChart3, PieChart, RotateCcw, FileUp, Printer, Trash2, Target, TrendingUp, Calendar, Database, Table, DollarSign, Leaf, Snowflake, Search, FileSpreadsheet, Shield } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { useData } from '@/contexts/DataContext'
import ChartsModal from '@/components/ChartsModal'
import MetasDashboard from '@/components/MetasDashboard'
import AnalisePreditiva from '@/components/AnalisePreditiva'
import AcompanhamentoDiario from '@/components/AcompanhamentoDiario'
import AnaliseRentabilidade from '@/components/AnaliseRentabilidade'
import HortifrutiDashboard from '@/components/HortifrutiDashboard'
import FriosDashboard from '@/components/FriosDashboard'
import AjustesMercadoriaDashboard from '@/components/AjustesMercadoriaDashboard'

import AnaliseValidadeDashboard from '@/components/AnaliseValidadeDashboard'

import { OptimizedSearchInput } from '@/components/ui/optimized-search'
import { useDebounce } from '@/hooks/useOptimizedSearch'

export default function Dashboard() {
  const { allData, filteredData, setAllData, setFilteredData, fileName, setFileName, clearData } = useData()
  const [loading, setLoading] = useState(false)
  const [recordCount, setRecordCount] = useState(0)
  const [showFileInfo, setShowFileInfo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter states
  const [cnpjFilter, setCnpjFilter] = useState('')
  const [descricaoFilter, setDescricaoFilter] = useState('')
  const [mercFilter, setMercFilter] = useState('')
  const [setorFilter, setSetorFilter] = useState('all')
  
  // Debounced filter states para melhor performance
  const debouncedCnpjFilter = useDebounce(cnpjFilter, 300)
  const debouncedDescricaoFilter = useDebounce(descricaoFilter, 300)
  const debouncedMercFilter = useDebounce(mercFilter, 300)
  
  // Optimized data indexes
  const [searchIndex, setSearchIndex] = useState<{
    fornecedores: Map<string, number[]>
    descricoes: Map<string, number[]>
    mercadorias: Map<string, number[]>
    setores: Map<string, number[]>
  }>({ fornecedores: new Map(), descricoes: new Map(), mercadorias: new Map(), setores: new Map() })
  
  // Modal states
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChartsModalOpen, setIsChartsModalOpen] = useState(false)

  // Calculate summary statistics
  const totalItems = filteredData.length
  const totalStock = filteredData.reduce((sum, item) => sum + parseInt(item['ESTOQ EMB1'] || '0'), 0)
  const totalValue = filteredData.reduce((sum, item) => {
    const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
    const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
    return sum + (estoq * custo)
  }, 0)
  const rupturas = filteredData.filter(item => parseInt(item['DIAS S/VND'] || '0') > 7).length

  // Get unique sectors for filter
  const sectors = [...new Set(allData.map(item => item.SETOR_LOJA).filter(Boolean))].sort()

  // Build search index for optimized filtering
  useEffect(() => {
    if (allData.length === 0) return
    
    const fornecedoresMap = new Map<string, number[]>()
    const descricoesMap = new Map<string, number[]>()
    const mercadoriasMap = new Map<string, number[]>()
    const setoresMap = new Map<string, number[]>()
    
    allData.forEach((item, index) => {
      // Index fornecedores
      const fornecedor = String(item.FORNECEDOR || '').toLowerCase()
      if (fornecedor) {
        if (!fornecedoresMap.has(fornecedor)) {
          fornecedoresMap.set(fornecedor, [])
        }
        fornecedoresMap.get(fornecedor)!.push(index)
      }
      
      // Index descricoes
      const descricao = String(item.DESCRICAO || '').toLowerCase()
      if (descricao) {
        if (!descricoesMap.has(descricao)) {
          descricoesMap.set(descricao, [])
        }
        descricoesMap.get(descricao)!.push(index)
      }
      
      // Index mercadorias
      const mercadoria = String(item.MERC || '').toLowerCase()
      if (mercadoria) {
        if (!mercadoriasMap.has(mercadoria)) {
          mercadoriasMap.set(mercadoria, [])
        }
        mercadoriasMap.get(mercadoria)!.push(index)
      }
      
      // Index setores
      const setor = String(item.SETOR_LOJA || '')
      if (setor) {
        if (!setoresMap.has(setor)) {
          setoresMap.set(setor, [])
        }
        setoresMap.get(setor)!.push(index)
      }
    })
    
    setSearchIndex({
      fornecedores: fornecedoresMap,
      descricoes: descricoesMap,
      mercadorias: mercadoriasMap,
      setores: setoresMap
    })
  }, [allData])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = async (file: File) => {
    const fileName = file.name
    const isCSV = fileName.toLowerCase().endsWith('.csv')
    const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')

    if (!isCSV && !isExcel) {
      alert('Por favor, selecione um arquivo CSV ou Excel válido.')
      return
    }

    setLoading(true)
    try {
      let data: DataItem[] = []
      
      if (isCSV) {
        const text = await file.text()
        data = parseCSV(text)
      } else {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)
      }

      setAllData(data)
      setFilteredData(data)
      setFileName(fileName)
      setRecordCount(data.length)
      setShowFileInfo(true)
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Erro ao processar arquivo: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV deve ter pelo menos um cabeçalho e uma linha de dados')
    }

    const delimiter = detectDelimiter(csvText)
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/["']/g, ''))

    const data: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter)
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }
    return data
  }

  const detectDelimiter = (csvText: string): string => {
    const lines = csvText.split('\n').slice(0, 5)
    const delimiters = [',', ';', '\t', '|']
    let scores: Record<string, number> = {}

    delimiters.forEach(d => scores[d] = 0)

    lines.forEach(line => {
      delimiters.forEach(d => {
        const count = (line.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        scores[d] += count
      })
    })

    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b)
  }

  // Optimized filter application - triggered by Enter key
  const applyFilters = useCallback(() => {
    if (allData.length === 0) {
      setFilteredData([])
      return
    }
    
    const cnpjLower = debouncedCnpjFilter.toLowerCase()
    const descricaoLower = debouncedDescricaoFilter.toLowerCase()
    const mercLower = debouncedMercFilter.toLowerCase()
    
    // Early return if no filters
    if (!debouncedCnpjFilter && !debouncedDescricaoFilter && !debouncedMercFilter && setorFilter === 'all') {
      setFilteredData(allData)
      return
    }
    
    let resultIndices: Set<number> = new Set()
    
    // Optimized filtering using pre-built indexes
    if (debouncedCnpjFilter) {
      const matchingIndices = new Set<number>()
      searchIndex.fornecedores.forEach((indices, fornecedor) => {
        if (fornecedor.includes(cnpjLower)) {
          indices.forEach(index => matchingIndices.add(index))
        }
      })
      resultIndices = matchingIndices
    }
    
    if (debouncedDescricaoFilter) {
      const matchingIndices = new Set<number>()
      searchIndex.descricoes.forEach((indices, descricao) => {
        if (descricao.includes(descricaoLower)) {
          indices.forEach(index => matchingIndices.add(index))
        }
      })
      resultIndices = resultIndices.size === 0 ? matchingIndices : new Set([...resultIndices].filter(x => matchingIndices.has(x)))
    }
    
    if (debouncedMercFilter) {
      const matchingIndices = new Set<number>()
      searchIndex.mercadorias.forEach((indices, mercadoria) => {
        if (mercadoria.includes(mercLower)) {
          indices.forEach(index => matchingIndices.add(index))
        }
      })
      resultIndices = resultIndices.size === 0 ? matchingIndices : new Set([...resultIndices].filter(x => matchingIndices.has(x)))
    }
    
    if (setorFilter !== 'all') {
      const matchingIndices = new Set(searchIndex.setores.get(setorFilter) || [])
      resultIndices = resultIndices.size === 0 ? matchingIndices : new Set([...resultIndices].filter(x => matchingIndices.has(x)))
    }
    
    // If no specific filters matched, use traditional filtering as fallback
    if (resultIndices.size === 0 && (debouncedCnpjFilter || debouncedDescricaoFilter || debouncedMercFilter)) {
      const filtered = allData.filter(item => {
        const matchCnpj = !debouncedCnpjFilter || String(item.FORNECEDOR || '').toLowerCase().includes(cnpjLower)
        const matchDescricao = !debouncedDescricaoFilter || String(item.DESCRICAO || '').toLowerCase().includes(descricaoLower)
        const matchMerc = !debouncedMercFilter || String(item.MERC || '').toLowerCase().includes(mercLower)
        const matchSetor = setorFilter === 'all' || !setorFilter || String(item.SETOR_LOJA || '') === setorFilter
        return matchCnpj && matchDescricao && matchMerc && matchSetor
      })
      setFilteredData(filtered)
    } else {
      // Convert indices back to data
      const filtered = Array.from(resultIndices).map(index => allData[index])
      setFilteredData(filtered)
    }
  }, [debouncedCnpjFilter, debouncedDescricaoFilter, debouncedMercFilter, setorFilter, allData, searchIndex])
  
  // Clear all filters
  const clearFilters = () => {
    setCnpjFilter('')
    setDescricaoFilter('')
    setMercFilter('')
    setSetorFilter('all')
    setFilteredData(allData)
  }
  
  // Handle Enter key press for search
  const handleKeyPress = (event: React.KeyboardEvent, field: string) => {
    if (event.key === 'Enter') {
      applyFilters()
    }
  }

  const exportData = () => {
    if (filteredData.length === 0) {
      alert('Não há dados para exportar.')
      return
    }

    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')

    const exportFileName = `dashboard_ataccao_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, exportFileName)
  }

  const exportSupplierReport = () => {
    if (!cnpjFilter || filteredData.length === 0) {
      alert('Selecione um CNPJ para gerar o relatório do fornecedor.')
      return
    }

    const supplierData = filteredData.filter(item => 
      String(item.FORNECEDOR || '').toLowerCase().includes(cnpjFilter.toLowerCase())
    )

    if (supplierData.length === 0) {
      alert('Não foram encontrados dados para o CNPJ informado.')
      return
    }

    const ws = XLSX.utils.json_to_sheet(supplierData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório Fornecedor')

    const supplierName = supplierData[0].FORNECEDOR || 'Fornecedor'
    const exportFileName = `relatorio_${supplierName}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, exportFileName)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('border-orange-600')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-orange-600')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-orange-600')
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleSupplierClick = (supplier: string) => {
    setSelectedSupplier(supplier)
    setIsModalOpen(true)
  }

  const getSupplierData = (supplier: string) => {
    return allData.filter(item => item.FORNECEDOR === supplier)
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    
    // Try to parse different date formats
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // If direct parsing fails, try common Brazilian formats
      const parts = dateString.split('/')
      if (parts.length === 3) {
        // dd/mm/yyyy or dd/mm/yy format
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1 // JavaScript months are 0-based
        const year = parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])
        const parsedDate = new Date(year, month, day)
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
        }
      }
      return dateString // Return original if can't parse
    }
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const printSupplierList = (onlyWithStock: boolean = false, hideValues: boolean = false) => {
    if (!selectedSupplier) return
    
    let supplierData = getSupplierData(selectedSupplier)
    
    // Filter items with stock if requested
    if (onlyWithStock) {
      supplierData = supplierData.filter(item => parseInt(item['ESTOQ EMB1'] || '0') > 0)
    }
    
    const totalItems = supplierData.length
    const totalStock = supplierData.reduce((sum, item) => sum + parseInt(item['ESTOQ EMB1'] || '0'), 0)
    const itemsWithoutSales = supplierData.filter(item => parseInt(item['DIAS S/VND'] || '0') > 7).length
    const totalValue = hideValues ? 0 : supplierData.reduce((sum, item) => {
      const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
      const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
      return sum + (estoq * custo)
    }, 0)
    
    const printContent = `
      <html>
        <head>
          <title>Relatório do Fornecedor - ${selectedSupplier}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f9fafb; }
            h1 { color: #006633; text-align: center; margin-bottom: 10px; font-size: 24px; }
            h2 { color: #FF6600; margin-top: 30px; text-align: center; font-size: 18px; margin-bottom: 20px; }
            .header { text-align: center; margin-bottom: 30px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .supplier-info { font-size: 16px; color: #374151; margin-bottom: 20px; }
            .report-type { font-size: 14px; color: #6B7280; font-style: italic; margin-bottom: 15px; }
            .hidden-value { color: #6B7280; font-style: italic; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { background-color: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid; }
            .stat-card.total { border-left-color: #006633; }
            .stat-card.stock { border-left-color: #FF6600; }
            .stat-card.nosales { border-left-color: #DC2626; }
            .stat-card.value { border-left-color: #7C3AED; }
            .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .stat-number.total { color: #006633; }
            .stat-number.stock { color: #FF6600; }
            .stat-number.nosales { color: #DC2626; }
            .stat-number.value { color: #7C3AED; }
            .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            th { background-color: #f0fdf4; color: #006633; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #006633; }
            td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr:hover { background-color: #f3f4f6; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #6B7280; padding: 10px; background-color: white; border-radius: 8px; }
            .hidden-value { color: #6B7280; font-style: italic; }
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
            <h1>Detalhes do Fornecedor</h1>
            <div class="supplier-info">
              <strong>Lista de mercadorias do fornecedor:</strong> ${selectedSupplier}
            </div>
            <div class="report-type">
              ${onlyWithStock ? 'Relatório filtrado: Apenas itens com estoque' : 'Relatório completo: Todos os itens'}${hideValues ? ' - Valores Ocultos' : ''}
            </div>
            
            <div class="stats-grid">
              <div class="stat-card total">
                <div class="stat-number total">${totalItems.toLocaleString('pt-BR')}</div>
                <div class="stat-label">Total de Itens</div>
              </div>
              <div class="stat-card stock">
                <div class="stat-number stock">${totalStock.toLocaleString('pt-BR')}</div>
                <div class="stat-label">Estoque Total CX</div>
              </div>
              <div class="stat-card nosales">
                <div class="stat-number nosales">${itemsWithoutSales}</div>
                <div class="stat-label">Itens sem venda</div>
              </div>
              <div class="stat-card value">
                <div class="stat-number value">${hideValues ? '***' : totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div class="stat-label">Valor em Estoque</div>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Dígito</th>
                <th>Descrição</th>
                <th>Embalagem</th>
                <th>Estoque CX</th>
                <th>Unidade</th>
                ${!hideValues ? '<th>Valor Estoque</th>' : ''}
                <th>Última Compra</th>
                <th>Dias S/Vnd</th>
                <th>Idade</th>
                <th>Setor</th>
              </tr>
            </thead>
            <tbody>
              ${supplierData.map(item => `
                <tr>
                  <td>${item.MERC || ''}</td>
                  <td style="text-align: center">${item.DIGITO || ''}</td>
                  <td>${item.DESCRICAO || ''}</td>
                  <td>${item.EMBALAGEM || ''}</td>
                  <td style="text-align: right">${item['ESTOQ EMB1'] || ''}</td>
                  <td style="text-align: right">${item['ESTOQ EMB9'] || ''}</td>
                  ${!hideValues ? `<td style="text-align: right">R$ ${(parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.')) * parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>` : '<td class="hidden-value">***</td>'}
                  <td style="text-align: center">${formatDate(item['DT ULT ENT'] || '')}</td>
                  <td style="text-align: center">${item['DIAS S/VND'] || '0'}</td>
                  <td style="text-align: center">${item.IDADE || ''}</td>
                  <td>${item.SETOR_LOJA || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Relatório gerado pelo Dashboard Atacadão - ${new Date().toLocaleString('pt-BR')}
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

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [cnpjFilter, descricaoFilter, mercFilter, setorFilter, allData])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/a.png" alt="Gerencial Alfa Logo" className="h-12 w-auto mr-4" />
              <h1 className="text-2xl font-bold text-green-800">Dashboard Atacadão</h1>
              <span className="ml-4 text-sm text-gray-500">Análise de Dados</span>
            </div>
            <div className="flex items-center space-x-2">
              {/* File Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <FileUp className="h-4 w-4" />
                  Arquivo
                </Button>
              </div>
              
              <Button onClick={() => setIsChartsModalOpen(true)} variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Gráficos
              </Button>
              
              <Button onClick={exportSupplierReport} size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black gap-2">
                <Download className="h-4 w-4" />
                Relatório
              </Button>
              
              <Button onClick={exportData} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              
              {(cnpjFilter || descricaoFilter || mercFilter || setorFilter !== 'all') && (
                <Button onClick={clearFilters} size="sm" variant="outline" className="gap-2 text-blue-600 hover:text-blue-700">
                  <RotateCcw className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
              
              {allData.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                      Limpar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Limpeza de Dados</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita e removerá todos os dados carregados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={clearData} className="bg-red-600 hover:bg-red-700">
                        Limpar Dados
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <Tabs defaultValue="dados" className="w-full">
          <div className="tabs-container pb-2 overflow-x-auto -webkit-overflow-scrolling:touch scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300">
            <TabsList className="grid w-full grid-cols-12 min-w-max h-auto p-1 bg-gray-100 rounded-lg">
            <TabsTrigger value="dados" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Database className="h-3 w-3" />
              <span className="leading-none">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="metas" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Target className="h-3 w-3" />
              <span className="leading-none">Metas</span>
            </TabsTrigger>
            <TabsTrigger value="analise" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <TrendingUp className="h-3 w-3" />
              <span className="leading-none">Análise</span>
            </TabsTrigger>
            <TabsTrigger value="acompanhamento" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Calendar className="h-3 w-3" />
              <span className="leading-none">Acomp.</span>
            </TabsTrigger>
            <TabsTrigger value="tabela" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Table className="h-3 w-3" />
              <span className="leading-none">Tabela</span>
            </TabsTrigger>
            <TabsTrigger value="rentabilidade" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <DollarSign className="h-3 w-3" />
              <span className="leading-none">Rent.</span>
            </TabsTrigger>
            <TabsTrigger value="hortifruti" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Leaf className="h-3 w-3" />
              <span className="leading-none">Hortifruti</span>
            </TabsTrigger>
            <TabsTrigger value="frios" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Snowflake className="h-3 w-3" />
              <span className="leading-none">Frios</span>
            </TabsTrigger>

            <TabsTrigger value="validade-analise" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <Shield className="h-3 w-3" />
              <span className="leading-none">Análise</span>
            </TabsTrigger>

            <TabsTrigger value="ajustes" className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
              <FileSpreadsheet className="h-3 w-3" />
              <span className="leading-none">Ajustes</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="dados" className="space-y-6">


        {/* Filters Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-green-800">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Label htmlFor="cnpjFilter">CNPJ</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="cnpjFilter"
                    value={cnpjFilter}
                    onChange={(e) => setCnpjFilter(e.target.value)}
                    placeholder="Digite o CNPJ..."
                    className="pl-10 focus:border-orange-600 focus:ring-orange-600"
                  />
                </div>
              </div>
              <div className="relative">
                <Label htmlFor="descricaoFilter">Descrição</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="descricaoFilter"
                    value={descricaoFilter}
                    onChange={(e) => setDescricaoFilter(e.target.value)}
                    placeholder="Digite a descrição..."
                    className="pl-10 focus:border-orange-600 focus:ring-orange-600"
                  />
                </div>
              </div>
              <div className="relative">
                <Label htmlFor="mercFilter">Mercadoria</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="mercFilter"
                    value={mercFilter}
                    onChange={(e) => setMercFilter(e.target.value)}
                    placeholder="Digite a mercadoria..."
                    className="pl-10 focus:border-orange-600 focus:ring-orange-600"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="setorFilter">Setor</Label>
                <Select value={setorFilter} onValueChange={setSetorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {sectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-800">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-800">{totalItems.toLocaleString('pt-BR')}</div>
                <div className="text-base font-medium mt-2 text-gray-600">Total de Itens</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-600">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{totalStock.toLocaleString('pt-BR')}</div>
                <div className="text-base font-medium mt-2 text-gray-600">Estoque Total</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-600">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-base font-medium mt-2 text-gray-600">Valor em Estoque</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-600">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600">{rupturas.toLocaleString('pt-BR')}</div>
                <div className="text-base font-medium mt-2 text-gray-600">Itens +7 dias s/venda</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="w-full min-w-full table-auto">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Código</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">Dígito</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] max-w-[300px]">Descrição</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Embalagem</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] max-w-[200px]">Fornecedor</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Estoque CX</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Estoque UN</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Valor Estoque</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Última Compra</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Preço</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Dias S/Vnd</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">Idade</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Setor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.slice(0, 1000).map((item, index) => {
                    const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
                    const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
                    const valorEstoque = estoq * custo

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.MERC || ''}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.DIGITO || ''}</td>
                        <td className="px-2 py-2 text-sm text-gray-900 truncate" title={item.DESCRICAO || ''}>{item.DESCRICAO || ''}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{item.EMBALAGEM || ''}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleSupplierClick(item.FORNECEDOR || '')}
                            className="text-orange-600 hover:text-orange-800 hover:underline font-medium truncate block w-full text-left"
                            title={item.FORNECEDOR || ''}
                          >
                            {item.FORNECEDOR || ''}
                          </button>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{item['ESTOQ EMB1'] || ''}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{item['ESTOQ EMB9'] || ''}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          R$ {valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          {formatDate(item['DT ULT ENT'] || '')}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          R$ {parseFloat(String(item['PRECO VENDA'] || '0').replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          <Badge variant={parseInt(item['DIAS S/VND'] || '0') > 30 ? "destructive" : "default"}>
                            {item['DIAS S/VND'] || '0'}
                          </Badge>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.IDADE || ''}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{item.SETOR_LOJA || ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[--container-lg] max-h-[90vh] overflow-y-auto" style={{ '--container-lg': '100rem' } as React.CSSProperties}>
            <DialogHeader>
              <DialogTitle className="text-green-800 text-xl">Detalhes do Fornecedor</DialogTitle>
              <DialogDescription>
                Lista completa de mercadorias do fornecedor: <span className="font-semibold text-orange-600">{selectedSupplier}</span>
              </DialogDescription>
            </DialogHeader>
            
            {selectedSupplier && (
              <div className="space-y-4">
                {/* Supplier Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">
                      {getSupplierData(selectedSupplier).length}
                    </div>
                    <div className="text-sm text-gray-600">Total de Itens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {getSupplierData(selectedSupplier).reduce((sum, item) => sum + parseInt(item['ESTOQ EMB1'] || '0'), 0).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-600">Estoque Total CX</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {getSupplierData(selectedSupplier).filter(item => parseInt(item['DIAS S/VND'] || '0') > 7).length}
                    </div>
                    <div className="text-sm text-gray-600">Itens +7 dias s/venda</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {getSupplierData(selectedSupplier).reduce((sum, item) => {
                        const estoq = parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.'))
                        const custo = parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))
                        return sum + (estoq * custo)
                      }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-sm text-gray-600">Valor em Estoque</div>
                  </div>
                </div>

                {/* Supplier Products Table */}
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg">
                  <table className="w-full min-w-max table-auto border-collapse">
                    <thead className="bg-green-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-1 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[80px]">Código</th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[60px]">Dígito</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[250px]">Descrição</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[100px]">Embalagem</th>
                        <th className="px-1 py-2 text-right text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[80px]">Estoque CX</th>
                        <th className="px-1 py-2 text-right text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[80px]">Unidade</th>
                        <th className="px-1 py-2 text-right text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[100px]">Valor Estoque</th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[90px]">Última Compra</th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[70px]">Dias S/Vnd</th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[50px]">Idade</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b min-w-[80px]">Setor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSupplierData(selectedSupplier).map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-1 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.MERC || ''}</td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.DIGITO || ''}</td>
                          <td className="px-1 py-2 text-sm text-gray-900" title={item.DESCRICAO || ''}>
                            <div className="truncate">{item.DESCRICAO || ''}</div>
                          </td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900">{item.EMBALAGEM || ''}</td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{item['ESTOQ EMB1'] || ''}</td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{item['ESTOQ EMB9'] || ''}</td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                            R$ {(parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.')) * parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                            {formatDate(item['DT ULT ENT'] || '')}
                          </td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                            <Badge variant={parseInt(item['DIAS S/VND'] || '0') > 30 ? "destructive" : "default"}>
                              {item['DIAS S/VND'] || '0'}
                            </Badge>
                          </td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.IDADE || ''}</td>
                          <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900">{item.SETOR_LOJA || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Fechar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir Lista
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg">Tipo de Relatório</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Escolha o tipo de relatório que deseja gerar:
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid grid-cols-1 gap-2 py-4">
                        <AlertDialogCancel onClick={() => printSupplierList(false, false)} className="justify-start text-sm h-9">
                          📋 Todos os Itens
                        </AlertDialogCancel>
                        <AlertDialogCancel onClick={() => printSupplierList(true, false)} className="justify-start text-sm h-9">
                          📦 Apenas com Estoque
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => printSupplierList(false, true)} className="justify-start text-sm h-9">
                          📋 Todos os Itens (Sem Valores)
                        </AlertDialogAction>
                        <AlertDialogAction onClick={() => printSupplierList(true, true)} className="justify-start text-sm h-9">
                          📦 Apenas com Estoque (Sem Valores)
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
          </TabsContent>

          <TabsContent value="metas">
            <MetasDashboard />
          </TabsContent>

          <TabsContent value="analise">
            <AnalisePreditiva />
          </TabsContent>

          <TabsContent value="acompanhamento">
            <AcompanhamentoDiario />
          </TabsContent>

          <TabsContent value="tabela" className="space-y-6">
            {/* Filters Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-green-800">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Label htmlFor="cnpjFilter">CNPJ</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="cnpjFilter"
                        value={cnpjFilter}
                        onChange={(e) => setCnpjFilter(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'cnpj')}
                        placeholder="Digite o CNPJ e pressione Enter"
                        className="pl-10 focus:border-orange-600 focus:ring-orange-600"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Label htmlFor="descricaoFilter">Descrição</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="descricaoFilter"
                        value={descricaoFilter}
                        onChange={(e) => setDescricaoFilter(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'descricao')}
                        placeholder="Digite a descrição e pressione Enter"
                        className="pl-10 focus:border-orange-600 focus:ring-orange-600"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Label htmlFor="mercFilter">Mercadoria</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="mercFilter"
                        value={mercFilter}
                        onChange={(e) => setMercFilter(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'merc')}
                        placeholder="Digite a mercadoria e pressione Enter"
                        className="pl-10 focus:border-orange-600 focus:ring-orange-600"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="setorFilter">Setor</Label>
                    <Select value={setorFilter} onValueChange={setSetorFilter}>
                      <SelectTrigger className="focus:border-orange-600 focus:ring-orange-600">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Setores</SelectItem>
                        {sectors.map(sector => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={applyFilters} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
                      <Search className="h-4 w-4" />
                      Buscar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-green-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-800">{totalItems.toLocaleString('pt-BR')}</div>
                    <div className="text-base font-medium mt-2 text-gray-600">Total de Itens</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-600">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600">{totalStock.toLocaleString('pt-BR')}</div>
                    <div className="text-base font-medium mt-2 text-gray-600">Estoque Total</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-600">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-base font-medium mt-2 text-gray-600">Valor em Estoque</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-600">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">{rupturas.toLocaleString('pt-BR')}</div>
                    <div className="text-base font-medium mt-2 text-gray-600">Itens +7 dias s/venda</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800">Dados de Estoque e Vendas</CardTitle>
                <CardDescription>
                  {filteredData.length} registros encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Código
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Dígito
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Descrição
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Embalagem
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Fornecedor
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Estoque CX
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Estoque UN
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Valor Estoque
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Preço
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Dias S/Vnd
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Idade
                        </th>
                        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Setor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((item, index) => (
                        <tr 
                          key={index} 
                          className={`hover:bg-gray-50 ${
                            parseInt(item['DIAS S/VND'] || '0') > 7 ? 'bg-red-50 hover:bg-red-100' : ''
                          } ${
                            parseInt(item['ESTOQ EMB1'] || '0') === 0 ? 'bg-yellow-50 hover:bg-yellow-100' : ''
                          }`}
                        >
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.MERC || ''}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            {item.DIGITO || ''}
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {item.DESCRICAO || ''}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.EMBALAGEM || ''}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => handleSupplierClick(item.FORNECEDOR || '')}
                              className="text-orange-600 hover:text-orange-800 underline font-medium"
                            >
                              {item.FORNECEDOR || ''}
                            </button>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {parseInt(item['ESTOQ EMB1'] || '0').toLocaleString('pt-BR')}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {parseInt(item['ESTOQ EMB9'] || '0').toLocaleString('pt-BR')}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            R$ {(parseFloat(String(item['ESTOQ EMB1'] || '0').replace(',', '.')) * parseFloat(String(item['CUSTO MEDIO'] || '0').replace(',', '.'))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            R$ {parseFloat(String(item['PRECO VENDA'] || '0').replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              parseInt(item['DIAS S/VND'] || '0') > 7 
                                ? 'bg-red-100 text-red-800' 
                                : parseInt(item['DIAS S/VND'] || '0') > 3 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {item['DIAS S/VND'] || '0'}
                            </span>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              parseInt(item.IDADE || '0') > 270 
                                ? 'bg-red-100 text-red-800' 
                                : parseInt(item.IDADE || '0') > 90 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {item.IDADE || ''}
                            </span>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.SETOR_LOJA || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rentabilidade">
            <AnaliseRentabilidade />
          </TabsContent>

          <TabsContent value="hortifruti">
            <HortifrutiDashboard />
          </TabsContent>

          <TabsContent value="frios">
            <FriosDashboard />
          </TabsContent>

          <TabsContent value="validade-analise">
            <AnaliseValidadeDashboard />
          </TabsContent>


          <TabsContent value="ajustes">
            <AjustesMercadoriaDashboard />
          </TabsContent>
        </Tabs>
      </main>

      {/* Charts Modal */}
      <ChartsModal 
        isOpen={isChartsModalOpen} 
        onClose={() => setIsChartsModalOpen(false)} 
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-700">Carregando...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}