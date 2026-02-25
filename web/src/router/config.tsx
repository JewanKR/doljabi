import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Home = lazy(() => import('../pages/home/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const UserProfile = lazy(() => import('../pages/user-profile/page'));

// Baduk pages
const BadukCreateRoom = lazy(() => import('../pages/baduk/create-room/page'));
const BadukJoinRoom = lazy(() => import('../pages/baduk/join-room/page'));

// Omok pages
const OmokCreateRoom = lazy(() => import('../pages/omok/create-room/page'));
const OmokJoinRoom = lazy(() => import('../pages/omok/join-room/page'));

// Game page (Unified)
const GameRoom = lazy(() => import('../pages/game/page'));

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
    path: '/baduk/create-room',
    element: <BadukCreateRoom />,
  },
  {
    path: '/baduk/join-room',
    element: <BadukJoinRoom />,
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
    path: '/game-room',
    element: <GameRoom />,
  },
  {
    path: '/baduk/game-room',
    element: <GameRoom />,
  },
  {
    path: '/omok/game-room',
    element: <GameRoom />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
