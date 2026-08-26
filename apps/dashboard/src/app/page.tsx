'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DashboardView = dynamic(
  () => import('../components/DashboardView').then((mod) => mod.DashboardView),
  { ssr: false }
);

export default function DashboardPage() {
  return <DashboardView />;
}
