import { cn } from '@/shared/lib/utils';
import { Home, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: '홈', to: '/', icon: Home, end: true },
  { label: '검색', to: '/search', icon: Search, end: false },
  { label: '알림', icon: null, imgSrc: '/Icon/Line/Bell.svg', to: '/notifications', end: false },
  { label: '마이', icon: null, imgSrc: '/Icon/Line/Mypage.svg', to: '/mypage', end: false },
] as const;

const BottomNav = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-(--border-normal)">
      <div className="flex items-center justify-between px-2 max-w-[750px] mx-auto">
        {navItems.map(({ label, to, end, ...item }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 h-16 w-[94px]',
                isActive ? 'text-primary' : 'text-[#6a7282]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {'icon' in item && item.icon ? (
                  <item.icon
                    className={cn('size-6', isActive ? 'text-primary' : 'text-[#6a7282]')}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                ) : (
                  <img src={('imgSrc' in item && item.imgSrc) || ''} alt={label} className="size-6" />
                )}
                <span
                  className={cn(
                    'text-[12px] leading-[1.5]',
                    isActive ? 'font-bold text-primary' : 'font-medium text-[#6a7282]',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
