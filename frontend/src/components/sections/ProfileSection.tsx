import { Github, Linkedin, Youtube, Twitter, Instagram } from 'lucide-react'

export default function ProfileSection() {
  return (
    <section className="glass-dark rounded-3xl p-8 mb-8 border border-white/10">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <img
            src="/akupelikilinc.jpg"
            alt="Talha KÜPELİKILINÇ"
            className="w-48 h-48 rounded-full border-4 border-primary-500 object-cover shadow-lg shadow-primary-500/20"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-bold text-white mb-2">Talha KÜPELİKILINÇ</h1>
          <p className="text-xl text-gray-300 mb-4">Kitap Tutkunu & Okur</p>
          <p className="text-gray-400 mb-6 leading-relaxed max-w-2xl">
            "Okumak, başka hayatları yaşamaktır." Bu dijital kütüphanede okuduğum kitapları,
            aldığım notları ve kitaplar hakkındaki düşüncelerimi paylaşıyorum.
            Her kitap yeni bir dünya, her sayfa yeni bir macera.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <a
              href="https://github.com/akupelikilinc"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center hover:bg-primary-600 hover:border-primary-500 transition group"
            >
              <Github size={20} className="text-gray-400 group-hover:text-white" />
            </a>
            <a
              href="https://linkedin.com/in/akupelikilinc"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center hover:bg-primary-600 hover:border-primary-500 transition group"
            >
              <Linkedin size={20} className="text-gray-400 group-hover:text-white" />
            </a>
            <a
              href="https://www.instagram.com/akupelikilinc/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center hover:bg-primary-600 hover:border-primary-500 transition group"
            >
              <Instagram size={20} className="text-gray-400 group-hover:text-white" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

