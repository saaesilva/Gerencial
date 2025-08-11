'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DataItem {
  MERC?: string
  DIGITO?: string
  DESCRICAO?: string
  EMBALAGEM?: string
  FORNECEDOR?: string
  SETOR_LOJA?: string
  'ESTOQ EMB1'?: string
  'ESTOQ EMB9'?: string
  'CUSTO MEDIO'?: string
  'PRECO VENDA'?: string
  'QTD VENDA EMB1'?: string
  'PERC RENT'?: string
  IDADE?: string
  'DIAS S/VND'?: string
  'DT ULT ENT'?: string
}

interface DataContextType {
  allData: DataItem[]
  filteredData: DataItem[]
  setAllData: (data: DataItem[]) => void
  setFilteredData: (data: DataItem[]) => void
  fileName: string
  setFileName: (name: string) => void
  clearData: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Storage keys
const STORAGE_KEYS = {
  ALL_DATA: 'ataccao_all_data',
  FILTERED_DATA: 'ataccao_filtered_data',
  FILE_NAME: 'ataccao_file_name'
}

// Helper functions to handle localStorage
const saveToStorage = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Error saving to localStorage:`, error)
    }
  }
}

const loadFromStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error loading from localStorage:`, error)
      return null
    }
  }
  return null
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [allData, setAllDataState] = useState<DataItem[]>([])
  const [filteredData, setFilteredDataState] = useState<DataItem[]>([])
  const [fileName, setFileNameState] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAllData = loadFromStorage(STORAGE_KEYS.ALL_DATA)
    const savedFilteredData = loadFromStorage(STORAGE_KEYS.FILTERED_DATA)
    const savedFileName = loadFromStorage(STORAGE_KEYS.FILE_NAME)

    if (savedAllData) {
      setAllDataState(savedAllData)
    }
    if (savedFilteredData) {
      setFilteredDataState(savedFilteredData)
    }
    if (savedFileName) {
      setFileNameState(savedFileName)
    }

    setIsInitialized(true)
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.ALL_DATA, allData)
    }
  }, [allData, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.FILTERED_DATA, filteredData)
    }
  }, [filteredData, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.FILE_NAME, fileName)
    }
  }, [fileName, isInitialized])

  const setAllData = (data: DataItem[]) => {
    setAllDataState(data)
  }

  const setFilteredData = (data: DataItem[]) => {
    setFilteredDataState(data)
  }

  const setFileName = (name: string) => {
    setFileNameState(name)
  }

  const clearData = () => {
    setAllDataState([])
    setFilteredDataState([])
    setFileNameState('')
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    }
  }

  return (
    <DataContext.Provider value={{
      allData,
      filteredData,
      setAllData,
      setFilteredData,
      fileName,
      setFileName,
      clearData
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}