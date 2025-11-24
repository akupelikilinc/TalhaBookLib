import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { LogOut, Plus, Edit, Trash2, X, BookOpen, Settings, Users } from 'lucide-react'

interface Book {
  id: number
  title: string
  author: string
  category: string
  level: string
  pages: number
  finished_date: string
  rating: number
  mood: string
  notes: string
  cover_url: string
}

export default function AdminDashboard() {
  const { logout, user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'books' | 'settings' | 'users'>('books')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  // Books
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ['admin-books'],
    queryFn: () => api.get('/books').then((res) => res.data),
    enabled: activeTab === 'books',
  })

  const createBookMutation = useMutation({
    mutationFn: (data: Partial<Book>) => api.post('/books', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      setShowModal(false)
      setEditingItem(null)
    },
  })

  const updateBookMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Book> }) =>
      api.put(`/books/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      setShowModal(false)
      setEditingItem(null)
    },
  })

  const deleteBookMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
    },
  })

  // Settings
  const { data: settings = {} } = useQuery<Record<string, any>>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
    enabled: activeTab === 'settings',
  })

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      api.put(`/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  // Users
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users').then((res) => res.data),
    enabled: activeTab === 'users',
  })

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowModal(false)
      setEditingItem(null)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/auth/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowModal(false)
      setEditingItem(null)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleAdd = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return

    if (activeTab === 'books') {
      deleteBookMutation.mutate(id)
    } else if (activeTab === 'users') {
      deleteUserMutation.mutate(id)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    if (activeTab === 'books') {
      const bookData = {
        title: data.title as string,
        author: data.author as string,
        category: data.category as string,
        level: data.level as string,
        pages: parseInt(data.pages as string) || 0,
        finished_date: data.finished_date as string,
        rating: parseFloat(data.rating as string) || 0,
        mood: data.mood as string,
        notes: data.notes as string,
        cover_url: data.cover_url as string,
      }
      if (editingItem) {
        updateBookMutation.mutate({ id: editingItem.id, data: bookData })
      } else {
        createBookMutation.mutate(bookData)
      }
    } else if (activeTab === 'users') {
      const userData = {
        name: data.name as string,
        email: data.email as string,
        password: data.password as string,
        role: data.role as string,
      }
      if (editingItem) {
        const updateData: any = {
          name: userData.name,
          email: userData.email,
          role: userData.role,
        }
        if (userData.password) {
          updateData.password = userData.password
        }
        updateUserMutation.mutate({ id: editingItem.id, data: updateData })
      } else {
        createUserMutation.mutate(userData)
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="glass-dark border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-primary-500" />
              Kütüphane Yönetimi
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Hoş geldiniz, {currentUser?.name || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut size={18} />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${activeTab === 'books'
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
          >
            <BookOpen size={18} />
            Kitaplar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${activeTab === 'settings'
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
          >
            <Settings size={18} />
            Ayarlar
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${activeTab === 'users'
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
          >
            <Users size={18} />
            Kullanıcılar
          </button>
        </div>

        <div className="glass-dark rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {activeTab === 'books' && 'Kitap Listesi'}
              {activeTab === 'settings' && 'Genel Ayarlar'}
              {activeTab === 'users' && 'Kullanıcı Yönetimi'}
            </h2>
            {activeTab !== 'settings' && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <Plus size={18} />
                Yeni Ekle
              </button>
            )}
          </div>

          {activeTab === 'books' && (
            <div className="space-y-4">
              {books.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Henüz kitap eklenmemiş.</p>
              ) : (
                <div className="grid gap-4">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className="glass rounded-lg p-4 flex items-center justify-between group hover:bg-white/5 transition"
                    >
                      <div className="flex gap-4 items-center">
                        {book.cover_url && (
                          <img src={book.cover_url} alt={book.title} className="w-12 h-16 object-cover rounded" />
                        )}
                        <div>
                          <h3 className="text-white font-semibold text-lg">{book.title}</h3>
                          <p className="text-gray-400 text-sm">{book.author}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                              {book.category}
                            </span>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                              {book.rating} ★
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {Object.entries(settings).map(([key, setting]: [string, any]) => (
                <div key={key} className="glass rounded-lg p-4">
                  <label className="block text-gray-300 mb-2 font-medium">
                    {setting.description || key}
                  </label>
                  <input
                    type="text"
                    value={setting.value || ''}
                    onChange={(e) => updateSettingMutation.mutate({ key, value: e.target.value })}
                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 transition outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="glass rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-white font-semibold">{user.name}</h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition"
                    >
                      <Edit size={18} />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingItem ? 'Düzenle' : 'Yeni Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingItem(null)
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'books' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-gray-300 mb-2 text-sm">Kitap Adı</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingItem?.title || ''}
                      required
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">Yazar</label>
                    <input
                      type="text"
                      name="author"
                      defaultValue={editingItem?.author || ''}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">Kategori</label>
                    <input
                      type="text"
                      name="category"
                      defaultValue={editingItem?.category || ''}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">Sayfa Sayısı</label>
                    <input
                      type="number"
                      name="pages"
                      defaultValue={editingItem?.pages || ''}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">Puan (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      name="rating"
                      defaultValue={editingItem?.rating || ''}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">Bitiş Tarihi</label>
                    <input
                      type="date"
                      name="finished_date"
                      defaultValue={editingItem?.finished_date ? new Date(editingItem.finished_date).toISOString().split('T')[0] : ''}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm">Ruh Hali</label>
                    <input
                      type="text"
                      name="mood"
                      defaultValue={editingItem?.mood || ''}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-300 mb-2 text-sm">Kapak Resmi URL</label>
                    <input
                      type="url"
                      name="cover_url"
                      defaultValue={editingItem?.cover_url || ''}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-300 mb-2 text-sm">Notlar</label>
                    <textarea
                      name="notes"
                      defaultValue={editingItem?.notes || ''}
                      rows={4}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">İsim</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingItem?.name || ''}
                      required
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">E-posta</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingItem?.email || ''}
                      required
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Şifre {editingItem && '(Değiştirmek için doldurun)'}</label>
                    <input
                      type="password"
                      name="password"
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Rol</label>
                    <select
                      name="role"
                      defaultValue={editingItem?.role || 'admin'}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editör</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
