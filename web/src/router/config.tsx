import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Home = lazy(() => import('../pages/home/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const UserProfile = lazy(() => import('../pages/user-profile/page'));

// Baduk pages
const BadukQuickMatch = lazy(() => import('../pages/baduk/quick-match/page'));
const BadukRankedMatch = lazy(() => import('../pages/baduk/ranked-match/page'));
const BadukCreateRoom = lazy(() => import('../pages/baduk/create-room/page'));
const BadukJoinRoom = lazy(() => import('../pages/baduk/join-room/page'));
const BadukGameRoom = lazy(() => import('../pages/baduk/game-room/page'));
const BadukSinglePlay = lazy(() => import('../pages/baduk/single-play/page'));

// Omok pages
const OmokQuickMatch = lazy(() => import('../pages/omok/quick-match/page'));
const OmokRankedMatch = lazy(() => import('../pages/omok/ranked-match/page'));
const OmokCreateRoom = lazy(() => import('../pages/omok/create-room/page'));
const OmokJoinRoom = lazy(() => import('../pages/omok/join-room/page'));
const OmokGameRoom = lazy(() => import('../pages/omok/game-room/page'));
const OmokSinglePlay = lazy(() => import('../pages/omok/single-play/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
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
    path: '/user-profile',
    element: <UserProfile />,
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
    path: '/baduk/single-play',
    element: <BadukSinglePlay />,
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
    path: '/omok/join-room',
    element: <OmokJoinRoom />,
  },
  {
    path: '/omok/game-room',
    element: <OmokGameRoom />,
  },
  {
    path: '/omok/single-play',
    element: <OmokSinglePlay />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
