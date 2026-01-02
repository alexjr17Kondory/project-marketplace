import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  User,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api.service';

interface ReviewUser {
  id: number;
  name: string;
  email: string;
}

interface ReviewProduct {
  id: number;
  name: string;
}

interface AdminReview {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  product: ReviewProduct;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  verifiedPurchases: number;
}

export default function ReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, [statusFilter, ratingFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (ratingFilter) params.rating = ratingFilter;

      const response = await api.get('/reviews/admin/all', params);
      const reviewsData = (response as any).data || [];
      setReviews(reviewsData);

      // Calcular stats
      const total = reviewsData.length;
      const avgRating = total > 0
        ? reviewsData.reduce((acc: number, r: AdminReview) => acc + r.rating, 0) / total
        : 0;
      const pending = reviewsData.filter((r: AdminReview) => r.status === 'PENDING').length;
      const verified = reviewsData.filter((r: AdminReview) => r.verifiedPurchase).length;

      setStats({
        totalReviews: total,
        averageRating: avgRating,
        pendingReviews: pending,
        verifiedPurchases: verified,
      });
    } catch (error) {
      console.error('Error loading reviews:', error);
      showToast('Error al cargar reseñas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Columnas de la tabla
  const columns = useMemo<ColumnDef<AdminReview>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{new Date(row.original.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">
              {new Date(row.original.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'product',
        header: 'Producto',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm">{row.original.product?.name || '-'}</p>
            <p className="text-xs text-gray-500">ID: {row.original.productId}</p>
          </div>
        ),
      },
      {
        accessorKey: 'user',
        header: 'Usuario',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-sm">{row.original.user?.name || '-'}</p>
              <p className="text-xs text-gray-500">{row.original.user?.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Calificación',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < row.original.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
            <span className="ml-1 text-sm font-medium">{row.original.rating}</span>
          </div>
        ),
      },
      {
        accessorKey: 'comment',
        header: 'Comentario',
        cell: ({ row }) => (
          <div className="max-w-[250px]">
            {row.original.title && (
              <p className="font-medium text-sm truncate">{row.original.title}</p>
            )}
            <p className="text-sm text-gray-600 line-clamp-2">{row.original.comment}</p>
          </div>
        ),
      },
      {
        accessorKey: 'verifiedPurchase',
        header: 'Verificado',
        cell: ({ row }) => (
          row.original.verifiedPurchase ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              Verificado
            </span>
          ) : (
            <span className="text-xs text-gray-400">No verificado</span>
          )
        ),
      },
      {
        accessorKey: 'helpfulCount',
        header: 'Útil',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm">
            <ThumbsUp className="w-4 h-4 text-gray-400" />
            <span>{row.original.helpfulCount}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.original.status;
          const colors = {
            PENDING: 'bg-yellow-100 text-yellow-700',
            APPROVED: 'bg-green-100 text-green-700',
            REJECTED: 'bg-red-100 text-red-700',
          };
          const labels = {
            PENDING: 'Pendiente',
            APPROVED: 'Aprobado',
            REJECTED: 'Rechazado',
          };
          return (
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
              {labels[status]}
            </span>
          );
        },
      },
    ],
    []
  );

  // Filtrar datos
  const filteredData = useMemo(() => {
    if (!searchTerm) return reviews;
    const term = searchTerm.toLowerCase();
    return reviews.filter(
      (r) =>
        r.product?.name?.toLowerCase().includes(term) ||
        r.user?.name?.toLowerCase().includes(term) ||
        r.user?.email?.toLowerCase().includes(term) ||
        r.comment?.toLowerCase().includes(term) ||
        r.title?.toLowerCase().includes(term)
    );
  }, [reviews, searchTerm]);

  // Instancia de la tabla
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reseñas de Productos</h1>
            <p className="text-sm text-gray-500">Historial de valoraciones de clientes</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Reseñas</p>
                <p className="text-xl font-bold">{stats.totalReviews}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Promedio</p>
                <p className="text-xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Loader2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pendientes</p>
                <p className="text-xl font-bold text-orange-600">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Verificadas</p>
                <p className="text-xl font-bold text-green-600">{stats.verifiedPurchases}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, usuario, comentario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobado</option>
            <option value="REJECTED">Rechazado</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todas las calificaciones</option>
            <option value="5">5 estrellas</option>
            <option value="4">4 estrellas</option>
            <option value="3">3 estrellas</option>
            <option value="2">2 estrellas</option>
            <option value="1">1 estrella</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay reseñas</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getRowModel().rows.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> reseñas
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(table.getPageCount(), 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      table.getState().pagination.pageIndex === page - 1
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {table.getPageCount() > 10 && (
                  <span className="px-2 py-1 text-gray-500">...</span>
                )}
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
