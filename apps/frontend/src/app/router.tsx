import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/shared/components/Layout';
import AnalyzePage from '@/pages/AnalyzePage';
import BatchPage from '@/pages/BatchPage';
import ComparePage from '@/pages/ComparePage';
import HistoryPage from '@/pages/HistoryPage';
import HomePage from '@/pages/HomePage';
import SharePage from '@/pages/SharePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'analyze', element: <AnalyzePage /> },
      { path: 'batch', element: <BatchPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'compare', element: <ComparePage /> },
    ],
  },
  { path: '/share', element: <SharePage /> },
]);
