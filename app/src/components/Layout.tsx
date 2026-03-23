import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useRouteUi } from '@/lib/routeUi';

export default function Layout() {
  const { mobileNavMode } = useRouteUi();
  const showMobileNav = mobileNavMode === 'shown';

  return (
    <div className="app-shell page-shell">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#dca27d]/25 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-96 w-96 rounded-full bg-[#8aa79c]/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-[#f1c4a0]/20 blur-3xl" />
      </div>

      <Sidebar />

      <main
        className={`app-main relative flex-1 lg:ml-[320px] lg:pb-8 lg:pt-8 ${
          showMobileNav ? 'app-main-with-dock' : 'app-main-focused'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {showMobileNav && <MobileNav />}
    </div>
  );
}
