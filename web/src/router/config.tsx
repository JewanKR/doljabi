
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Omok pages
const OmokSinglePlay = lazy(() => import('../pages/omok/single-play/page'));
const OmokQuickMatch = lazy(() => import('../pages/omok/quick-match/page'));
const OmokCreateRoom = lazy(() => import('../pages/omok/create-room/page'));
const OmokJoinRoom = lazy(() => import('../pages/omok/join-room/page'));

// Baduk pages
const BadukSinglePlay = lazy(() => import('../pages/baduk/single-play/page'));
const BadukQuickMatch = lazy(() => import('../pages/baduk/quick-match/page'));
const BadukCreateRoom = lazy(() => import('../pages/baduk/create-room/page'));
const BadukJoinRoom = lazy(() => import('../pages/baduk/join-room/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  // Omok routes
  {
    path: '/omok/single-play',
    element: <OmokSinglePlay />,
  },
  {
    path: '/omok/quick-match',
    element: <OmokQuickMatch />,
  },
  {
    path: '/omok/create-room',
    element: <OmokCreateRoom />,
  },
  {
    path: '/omok/join-room',
    element: <OmokJoinRoom />,
  },
  // Baduk routes
  {
    path: '/baduk/single-play',
    element: <BadukSinglePlay />,
  },
  {
    path: '/baduk/quick-match',
    element: <BadukQuickMatch />,
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
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
