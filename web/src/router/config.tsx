
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Home = lazy(() => import('../pages/home/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Baduk pages
const BadukQuickMatch = lazy(() => import('../pages/baduk/quick-match/page'));
const BadukRankedMatch = lazy(() => import('../pages/baduk/ranked-match/page'));
const BadukCreateRoom = lazy(() => import('../pages/baduk/create-room/page'));
const BadukJoinRoom = lazy(() => import('../pages/baduk/join-room/page'));
const BadukSinglePlay = lazy(() => import('../pages/baduk/single-play/page'));
const BadukWaitingRoom = lazy(() => import('../pages/baduk/waiting-room/page'));
const BadukGameRoom = lazy(() => import('../pages/baduk/game-room/page'));
const OpenApiDocs = lazy(() => import('../pages/openapi/page'));


// Omok pages
const OmokQuickMatch = lazy(() => import('../pages/omok/quick-match/page'));
const OmokCreateRoom = lazy(() => import('../pages/omok/create-room/page'));
const OmokJoinRoom = lazy(() => import('../pages/omok/join-room/page'));
const OmokSinglePlay = lazy(() => import('../pages/omok/single-play/page'));

import OmokWaitingRoom from '../pages/omok/waiting-room/page';
import OmokGameRoom from '../pages/omok/game-room/page';
import OmokRankedMatch from '../pages/omok/ranked-match/page';

const routes: RouteObject[] = [
  {
    path: '/',
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
    path: '/baduk/single-play',
    element: <BadukSinglePlay />,
  },
  {
    path: '/baduk/waiting-room',
    element: <BadukWaitingRoom />,
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
    path: '/omok/join-room',
    element: <OmokJoinRoom />,
  },
  {
    path: '/omok/single-play',
    element: <OmokSinglePlay />,
  },
  {
    path: '/omok/waiting-room',
    element: <OmokWaitingRoom />,
  },
  {
    path: '/omok/game-room',
    element: <OmokGameRoom />,
  },
  {
    path: '/openapi',
    element: <OpenApiDocs />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
