import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Home = lazy(() => import('../pages/home/Home'));
const NotFound = lazy(() => import('../pages/NotFound'));
const AdminPage = lazy(() => import('../pages/admin/page')); // 🔥 관리자 페이지

// Baduk pages
const BadukQuickMatch = lazy(() => import('../pages/baduk/quick-match/page'));
const BadukRankedMatch = lazy(() => import('../pages/baduk/ranked-match/page'));
const BadukCreateRoom = lazy(() => import('../pages/baduk/create-room/page'));
const BadukJoinRoom = lazy(() => import('../pages/baduk/join-room/page'));
const BadukGameRoom = lazy(() => import('../pages/baduk/game-room/page'));

// Omok pages
const OmokQuickMatch = lazy(() => import('../pages/omok/quick-match/page'));
const OmokCreateRoom = lazy(() => import('../pages/omok/create-room/CreateRoom'));
const OmokJoinRoom = lazy(() => import('../pages/omok/join-room/page'));

import OmokGameRoom from '../pages/omok/game-room/GameRoom';
import OmokRankedMatch from '../pages/omok/ranked-match/page';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/admin',        // 🔥 Home에서 navigate('/admin') 하는 경로
    element: <AdminPage />,
  },
  {
    path: '/login',
    element: <Home />,
  },
  {
    path: '/signup',
    element: <Home />,
  },
  {
    path: '/baduk/quick-match',
    element: <BadukQuickMatch />,
  },
  {
    path: '/baduk/ranked-match',
    element: <BadukRankedMatch />,
  },
  {
    path: '/baduk/create-room',
    element: <BadukCreateRoom />,
  },
  {
    path: '/baduk/join-room',
    element: <BadukJoinRoom />,
  },
  {
    path: '/baduk/game-room',
    element: <BadukGameRoom />,
  },
  {
    path: '/omok/quick-match',
    element: <OmokQuickMatch />,
  },
  {
    path: '/omok/ranked-match',
    element: <OmokRankedMatch />,
  },
  {
    path: '/omok/create-room',
    element: <OmokCreateRoom />,
  },
  {
    path: '/omok/waiting-room',
    element: <OmokCreateRoom />
  },
  {
    path: '/omok/join-room',
    element: <OmokJoinRoom />,
  },
  {
    path: '/omok/game-room',
    element: <OmokGameRoom />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
