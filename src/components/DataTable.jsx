import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Filter, 
  Database,
  RefreshCw
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function DataTable({
  data = [],
  columns = [],
  searchKeys = [],
  searchPlaceholder = 'Search records by name, ID, status...',
  filters = [],
  onAddNew,
  addNewLabel = 'Add Record',
  onEdit,
  onDelete,
  onView,
  exportFilename = 'Shivshakti_ERP_Export.xlsx',
  exportSheetName = 'Data',
  initialPageSize = 10,
  isLoading = false,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no records matching your current search or filter criteria in the database.',
  actionsHeader = 'Actions'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Handle Filter Change
  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1);
  };

  // 1. Filtered Data (Search + Dropdown Filters)
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Apply Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        let matchesSearch = false;

        if (searchKeys.length > 0) {
          matchesSearch = searchKeys.some(key => {
            const val = item[key];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
          });
        } else {
          // Search across all string/number fields
          matchesSearch = Object.values(item).some(val => 
            val !== undefined && val !== null && String(val).toLowerCase().includes(query)
          );
        }

        if (!matchesSearch) return false;
      }

      // Apply Dropdown Filters
      for (const [key, filterVal] of Object.entries(activeFilters)) {
        if (filterVal && filterVal !== 'ALL') {
          const itemVal = item[key];
          if (String(itemVal).toLowerCase() !== String(filterVal).toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchTerm, searchKeys, activeFilters]);

  // 2. Sorted Data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // 3. Paginated Data
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  // Sorting toggle
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Excel Export Handler
  const handleExport = () => {
    if (filteredData.length === 0) {
      alert('No records available to export.');
      return;
    }
    const cleanRows = filteredData.map(item => {
      const row = {};
      columns.forEach(col => {
        row[col.header] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '';
      });
      return row;
    });
    exportToExcel(cleanRows, exportFilename, exportSheetName);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden space-y-0">
      {/* Controls Bar: Search, Filters, Add & Export */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
          />
        </div>

        {/* Filters and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {filters.map(filter => (
            <div key={filter.key} className="flex items-center space-x-1.5">
              <select
                value={activeFilters[filter.key] || 'ALL'}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Export to Excel */}
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary px-3 py-2 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
            title="Export filtered records to Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Add New Record CTA */}
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="btn-primary px-3.5 py-2 text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addNewLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[220px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading PostgreSQL records...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-1">
              <Database className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">{emptyTitle}</h4>
            <p className="text-xs text-slate-500 max-w-sm">{emptyDescription}</p>
            {(searchTerm || Object.values(activeFilters).some(v => v !== 'ALL')) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilters({});
                  setCurrentPage(1);
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Clear all filters and search query
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold select-none">
                {columns.map(col => {
                  const isSorted = sortConfig.key === col.key;
                  const isSortable = col.sortable !== false;

                  return (
                    <th 
                      key={col.key} 
                      className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {isSortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={`inline-flex items-center space-x-1.5 font-semibold text-xs transition-colors hover:text-slate-900 ${
                            isSorted ? 'text-blue-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          <span>{col.header}</span>
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </button>
                      ) : (
                        <span>{col.header}</span>
                      )}
                    </th>
                  );
                })}
                {(onEdit || onDelete || onView) && (
                  <th className="py-3 px-4 text-center font-semibold text-slate-600">
                    {actionsHeader}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row, idx) => (
                <tr 
                  key={row.id || idx} 
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map(col => (
                    <td 
                      key={col.key} 
                      className={`py-3 px-4 text-slate-700 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '—')}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(row)}
                            title="View Record Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            title="Edit Record"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 select-none">
        {/* Record count info */}
        <div className="flex items-center space-x-4">
          <span>
            Showing <strong className="font-semibold text-slate-900">{totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}</strong> to <strong className="font-semibold text-slate-900">{Math.min(safeCurrentPage * pageSize, totalRecords)}</strong> of <strong className="font-semibold text-slate-900">{totalRecords}</strong> entries
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2.5 py-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs">
            {safeCurrentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
