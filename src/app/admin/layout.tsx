import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="bg-slate-50 min-h-screen">{children}</div>;
}
