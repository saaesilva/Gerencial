import { useState, useEffect, useRef, useCallback } from 'react'

interface WorkerMessage {
  type: string
  data?: any
  error?: string
}

export function useDataWorker() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)

  // Inicializar worker
  useEffect(() => {
    try {
      // Criar worker a partir de blob para evitar problemas com caminhos
      const workerCode = `
        self.addEventListener('message', function(event) {
          try {
            const { type, data } = event.data
            
            switch (type) {
              case 'PROCESSAR_DADOS':
                const resultado = processarDadosPesados(data)
                self.postMessage({ type: 'PROCESSAR_DADOS_RESULTADO', data: resultado })
                break
                
              case 'CALCULAR_CONSOLIDACOES':
                const consolidacoes = calcularConsolidacoes(data)
                self.postMessage({ type: 'CALCULAR_CONSOLIDACOES_RESULTADO', data: consolidacoes })
                break
                
              case 'APLICAR_FILTROS':
                const filtrados = aplicarFiltros(data)
                self.postMessage({ type: 'APLICAR_FILTROS_RESULTADO', data: filtrados })
                break
                
              default:
                self.postMessage({ type: 'ERRO', error: 'Tipo de operação desconhecido' })
            }
          } catch (error) {
            self.postMessage({ type: 'ERRO', error: error.message })
          }
        })

        function processarDadosPesados(jsonData) {
          return jsonData.map(item => {
            const mercadoria = item['MERCADORIA'] || ''
            const partes = mercadoria.split('-')
            const codigoPrincipal = partes[0]?.trim() || ''
            const digito = partes[1]?.trim() || ''

            return {
              ...item,
              codigoPrincipal,
              digito,
              quantidade: parseInt(item['EMB1'] || '0') || 0
            }
          })
        }

        function calcularConsolidacoes(ajustesData) {
          const agrupados = ajustesData.reduce((acc, item) => {
            if (!item.codigoPrincipal) return acc
            
            if (!acc[item.codigoPrincipal]) {
              acc[item.codigoPrincipal] = []
            }
            acc[item.codigoPrincipal].push(item)
            return acc
          }, {})

          return Object.entries(agrupados).map(([codigo, eventos]) => {
            const saldoFinal = eventos.reduce((saldo, evento) => {
              const qtd = evento.quantidade || 0
              const eventoTipo = evento.EVENTO || ''
              
              switch (eventoTipo) {
                case 'INV.PERIODICO ESTOQUE AUTOM.':
                case 'AJ. SOBRA CONTAGEM PREVENTIVA':
                case 'AJUSTE ESTOQUE - SOBRA':
                case 'AJ. FALTA CONTAGEM PREVENTIVA':
                case 'AJUSTE AUTOMATICO NEGATIVO':
                case 'AJUSTE ESTOQUE - FALTA':
                  return saldo + qtd
                default:
                  return saldo
              }
            }, 0)

            const valorFinanceiro = eventos.reduce((total, evento) => {
              const valor = parseFloat(String(evento['VLR.TOTAL'] || '0').replace(',', '.')) || 0
              return total + valor
            }, 0)

            const justificativa = gerarJustificativa(eventos, saldoFinal)
            const status = determinarStatus(eventos, saldoFinal)

            return {
              codigoPrincipal: codigo,
              descricao: eventos[0]?.DESCRICAO || 'Sem descrição',
              eventos,
              saldoFinal,
              valorFinanceiro,
              justificativa,
              status
            }
          })
        }

        function gerarJustificativa(eventos, saldoFinal) {
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

        function determinarStatus(eventos, saldoFinal) {
          if (saldoFinal === 0) return 'regular'
          
          const temInventario = eventos.some(e => e.EVENTO && e.EVENTO === 'INV.PERIODICO ESTOQUE AUTOM.')
          const temAjusteNegativo = eventos.some(e => e.EVENTO && e.EVENTO === 'AJUSTE AUTOMATICO NEGATIVO')
          
          if (temInventario && temAjusteNegativo && Math.abs(saldoFinal) <= 5) {
            return 'regular'
          }
          
          return Math.abs(saldoFinal) > 10 ? 'inconsistente' : 'pendente'
        }

        function aplicarFiltros({ data, selectedEvento, selectedStatus, selectedSetor, searchTerm }) {
          let filtered = data

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

          return filtered
        }
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)
      workerRef.current = new Worker(workerUrl)

      // Cleanup
      return () => {
        if (workerRef.current) {
          workerRef.current.terminate()
          URL.revokeObjectURL(workerUrl)
        }
      }
    } catch (err) {
      console.error('Erro ao criar worker:', err)
      setError('Não foi possível inicializar o processamento otimizado')
    }
  }, [])

  const processarDados = useCallback(async (jsonData: any[]) => {
    if (!workerRef.current) {
      throw new Error('Worker não disponível')
    }

    return new Promise<any[]>((resolve, reject) => {
      setIsProcessing(true)
      setError(null)

      const handler = (event: MessageEvent) => {
        const message: WorkerMessage = event.data

        if (message.type === 'PROCESSAR_DADOS_RESULTADO') {
          resolve(message.data)
        } else if (message.type === 'ERRO') {
          reject(new Error(message.error))
        }

        workerRef.current?.removeEventListener('message', handler)
        setIsProcessing(false)
      }

      workerRef.current.addEventListener('message', handler)
      workerRef.current.postMessage({ type: 'PROCESSAR_DADOS', data: jsonData })
    })
  }, [])

  const calcularConsolidacoes = useCallback(async (ajustesData: any[]) => {
    if (!workerRef.current) {
      throw new Error('Worker não disponível')
    }

    return new Promise<any[]>((resolve, reject) => {
      setIsProcessing(true)
      setError(null)

      const handler = (event: MessageEvent) => {
        const message: WorkerMessage = event.data

        if (message.type === 'CALCULAR_CONSOLIDACOES_RESULTADO') {
          resolve(message.data)
        } else if (message.type === 'ERRO') {
          reject(new Error(message.error))
        }

        workerRef.current?.removeEventListener('message', handler)
        setIsProcessing(false)
      }

      workerRef.current.addEventListener('message', handler)
      workerRef.current.postMessage({ type: 'CALCULAR_CONSOLIDACOES', data: ajustesData })
    })
  }, [])

  const aplicarFiltros = useCallback(async (params: {
    data: any[]
    selectedEvento: string
    selectedStatus: string
    selectedSetor: string
    searchTerm: string
  }) => {
    if (!workerRef.current) {
      throw new Error('Worker não disponível')
    }

    return new Promise<any[]>((resolve, reject) => {
      setIsProcessing(true)
      setError(null)

      const handler = (event: MessageEvent) => {
        const message: WorkerMessage = event.data

        if (message.type === 'APLICAR_FILTROS_RESULTADO') {
          resolve(message.data)
        } else if (message.type === 'ERRO') {
          reject(new Error(message.error))
        }

        workerRef.current?.removeEventListener('message', handler)
        setIsProcessing(false)
      }

      workerRef.current.addEventListener('message', handler)
      workerRef.current.postMessage({ type: 'APLICAR_FILTROS', data: params })
    })
  }, [])

  return {
    isProcessing,
    error,
    processarDados,
    calcularConsolidacoes,
    aplicarFiltros
  }
}