import { SidebarFilters } from "./components/sidebar-filters-panel";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-80 shrink-0 border-r border-gray-700 p-4">
        <span className="text-xl font-semibold">CDID Car Database (Unofficial)</span>

        {/* search bar */}
        <div className="mt-6">
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-md bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <SidebarFilters />
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-gray-700 px-6"></header>
      </main>
    </div>
  );
}