import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import ProfileSection from '../components/sections/ProfileSection'
import { BookOpen, Star, Calendar } from 'lucide-react'

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

export default function Home() {
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: () => api.get('/books').then((res) => res.data),
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <ProfileSection />

        <div className="glass-dark rounded-3xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <BookOpen className="text-primary-500" />
            Kütüphanem
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div key={book.id} className="glass rounded-xl overflow-hidden group hover:scale-[1.02] transition duration-300 border border-white/5 hover:border-primary-500/50">
                <div className="aspect-[2/3] relative overflow-hidden">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <BookOpen size={48} className="text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-4">
                    <p className="text-sm text-gray-300 line-clamp-4 italic">"{book.notes}"</p>
                    {book.mood && (
                      <p className="text-xs text-primary-400 mt-2">Ruh Hali: {book.mood}</p>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-400">
                      {book.category || 'Genel'}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-medium">{book.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-1 line-clamp-1 text-white" title={book.title}>{book.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{book.author}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {book.finished_date ? new Date(book.finished_date).toLocaleDateString('tr-TR') : '-'}
                    </div>
                    <div>{book.pages} sayfa</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {books.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>Henüz kitap eklenmemiş.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
