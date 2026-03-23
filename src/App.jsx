import { useState, useRef, useCallback, useMemo } from 'react'
import './App.css'
import { createEngine } from './engine/core.js'

const TOTAL_ROWS = 50
const TOTAL_COLS = 50

export default function App() {
  const [engine] = useState(() => createEngine(TOTAL_ROWS, TOTAL_COLS))
  const [version, setVersion] = useState(0)
  const [selectedCell, setSelectedCell] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [cellStyles, setCellStyles] = useState({})

  // 🔥 NEW STATES (Task 1)
  const [sortConfig, setSortConfig] = useState({ col: null, direction: null })
  const [filters, setFilters] = useState({})

  const cellInputRef = useRef(null)
  const forceRerender = useCallback(() => setVersion(v => v + 1), [])

  // 🔥 SORT + FILTER LOGIC
  const processedRows = useMemo(() => {
    let rows = Array.from({ length: engine.rows }, (_, r) => r)

    // FILTER
    rows = rows.filter((rowIndex) => {
      return Object.keys(filters).every((col) => {
        if (!filters[col]) return true
        const cell = engine.getCell(rowIndex, col)
        const value = cell.computed ?? cell.raw
        return String(value).toLowerCase().includes(filters[col].toLowerCase())
      })
    })

    // SORT
    if (sortConfig.direction !== null) {
      rows.sort((a, b) => {
        const valA = engine.getCell(a, sortConfig.col).computed ?? engine.getCell(a, sortConfig.col).raw
        const valB = engine.getCell(b, sortConfig.col).computed ?? engine.getCell(b, sortConfig.col).raw

        if (sortConfig.direction === "asc") return valA > valB ? 1 : -1
        if (sortConfig.direction === "desc") return valA < valB ? 1 : -1
        return 0
      })
    }

    return rows
  }, [engine, version, sortConfig, filters])

  const startEditing = useCallback((row, col) => {
    setSelectedCell({ r: row, c: col })
    setEditingCell({ r: row, c: col })
    const cellData = engine.getCell(row, col)
    setEditValue(cellData.raw)
    setTimeout(() => cellInputRef.current?.focus(), 0)
  }, [engine])

  const commitEdit = useCallback((row, col) => {
    const currentCell = engine.getCell(row, col)
    if (currentCell.raw !== editValue) {
      engine.setCell(row, col, editValue)
      forceRerender()
    }
    setEditingCell(null)
  }, [engine, editValue, forceRerender])

  const getColumnLabel = (col) => {
    let label = ''
    let num = col + 1
    while (num > 0) {
      num--
      label = String.fromCharCode(65 + (num % 26)) + label
      num = Math.floor(num / 26)
    }
    return label
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Spreadsheet App</h2>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th></th>

            {Array.from({ length: engine.cols }, (_, colIndex) => (
              <th
                key={colIndex}
                onClick={() => {
                  setSortConfig(prev => {
                    if (prev.col === colIndex) {
                      if (prev.direction === "asc") return { col: colIndex, direction: "desc" }
                      if (prev.direction === "desc") return { col: null, direction: null }
                    }
                    return { col: colIndex, direction: "asc" }
                  })
                }}
              >
                {getColumnLabel(colIndex)}
                <br />

                {/* 🔽 FILTER */}
                <input
                  placeholder="filter"
                  style={{ width: "60px" }}
                  onChange={(e) => {
                    setFilters(prev => ({
                      ...prev,
                      [colIndex]: e.target.value
                    }))
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {processedRows.map((rowIndex) => (
            <tr key={rowIndex}>
              <td>{rowIndex + 1}</td>

              {Array.from({ length: engine.cols }, (_, colIndex) => {
                const cell = engine.getCell(rowIndex, colIndex)
                const value = cell.error
                  ? cell.error
                  : (cell.computed ?? cell.raw)

                return (
                  <td
                    key={colIndex}
                    onClick={() => startEditing(rowIndex, colIndex)}
                  >
                    {value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}