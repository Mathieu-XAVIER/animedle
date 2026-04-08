import Link from 'next/link'

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/import', label: 'Import Jikan' },
  { href: '/admin/staging', label: 'Staging' },
  { href: '/admin/defis', label: 'Défis quotidiens' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-1 shrink-0">
        <p className="text-indigo-400 font-bold text-sm mb-4 uppercase tracking-widest">Animedle Admin</p>
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
