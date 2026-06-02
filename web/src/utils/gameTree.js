/**
 * 경량 게임 수형도(tree). KaTrain의 GameNode 설계를 참고했다:
 *  - 각 노드는 parent(단일) + children(배열), children[0]가 메인라인.
 *  - play(move): 같은 수의 자식이 있으면 재사용, 없으면 새 분기 생성. (KaTrain SGFNode.play)
 *  - 판 모양은 노드마다 캐시하지 않고 루트→현재 경로를 replay로 재생(따냄 적용). (KaTrain _calculate_groups)
 *  - node.analysis: KataGo 분석 결과를 노드에 저장하는 자리(향후 Task 7). (KaTrain GameNode.analysis)
 *
 * move 표현은 프로젝트 공통 규약을 따른다:
 *   { color: 'black'|'white', col, row }  또는 패스 { color, pass: true }, 루트는 null.
 */

let _seq = 0;
const nextId = () => `n${++_seq}`;

const sameMove = (a, b) => {
  if (!a || !b) return false;
  if (a.pass || b.pass) return !!a.pass && !!b.pass && a.color === b.color;
  return a.color === b.color && a.col === b.col && a.row === b.row;
};

export const createNode = (move = null, parent = null) => ({
  id: nextId(),
  move,
  parent,
  children: [],
  analysis: null, // KataGo 분석 결과 (Task 7에서 채움)
});

export const createTree = () => {
  const root = createNode(null, null);
  return { root, current: root };
};

/** 루트 → node 경로의 노드 배열 (루트 포함) */
export const nodesFromRoot = (node) => {
  const out = [];
  for (let n = node; n; n = n.parent) out.unshift(n);
  return out;
};

/** 루트 → node 경로의 수 배열 (루트의 null 제외) */
export const movesFromRoot = (node) =>
  nodesFromRoot(node)
    .map((n) => n.move)
    .filter(Boolean);

/** 다음에 둘 색: 루트=흑, 그 외엔 직전 수의 반대색 */
export const nextColor = (node) => {
  if (!node || !node.move) return 'black';
  return node.move.color === 'black' ? 'white' : 'black';
};

/** 현재 노드에서 move를 둠: 동일한 자식이 있으면 그쪽으로 이동, 없으면 새 분기 생성 */
export const play = (tree, move) => {
  const existing = tree.current.children.find((c) => sameMove(c.move, move));
  if (existing) {
    tree.current = existing;
    return existing;
  }
  const child = createNode(move, tree.current);
  tree.current.children.push(child);
  tree.current = child;
  return child;
};

/** 한 수 뒤로 (부모로) */
export const undo = (tree) => {
  if (tree.current.parent) tree.current = tree.current.parent;
  return tree.current;
};

/** 한 수 앞으로 (메인라인 자식으로) */
export const redo = (tree) => {
  const next = tree.current.children[0];
  if (next) tree.current = next;
  return tree.current;
};

/** 처음으로 (루트) */
export const toStart = (tree) => {
  tree.current = tree.root;
  return tree.current;
};

/** 끝으로 (현재 라인을 메인라인 자식 따라 끝까지) */
export const toEnd = (tree) => {
  let n = tree.current;
  while (n.children[0]) n = n.children[0];
  tree.current = n;
  return n;
};

/** 임의의 노드로 이동 */
export const goTo = (tree, node) => {
  if (node) tree.current = node;
  return tree.current;
};

/** 수 배열(SGF 파싱 결과)로 메인라인 트리 구성. current는 루트로 둔다. */
export const treeFromMoves = (moves = []) => {
  const tree = createTree();
  let n = tree.root;
  for (const m of moves) {
    const child = createNode(m, n);
    n.children.push(child);
    n = child;
  }
  tree.current = tree.root;
  return tree;
};
