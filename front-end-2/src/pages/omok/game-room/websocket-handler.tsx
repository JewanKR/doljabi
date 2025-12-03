import {
    ClientToServerRequest,
    ServerToClientResponse,
    GameState,
    Color,
    UsersInfo
} from '../../../ts-proto/badukboard';

type MessageHandler = (response: ServerToClientResponse) => void;
type GameStateListener = (board: (null | 'black' | 'white')[][], turn: 'black' | 'white', blackTime?: any, whiteTime?: any) => void;
type GameStartListener = () => void;
type PlayerInfoListener = (usersInfo: UsersInfo) => void;
type GameEndListener = (winner: 'black' | 'white' | 'draw') => void;

export class WebSocketHandler {
    private ws: WebSocket | null = null;
    private messageHandlers: MessageHandler[] = [];
    private pingInterval: NodeJS.Timeout | null = null;
    private url: string;

    // Listeners
    private gameStateListeners: GameStateListener[] = [];
    private gameStartListeners: GameStartListener[] = [];
    private playerInfoListeners: PlayerInfoListener[] = [];
    private gameEndListeners: GameEndListener[] = [];

    // Game State
    private boardSize = 15;
    private board: (null | 'black' | 'white')[][] = Array(15).fill(null).map(() => Array(15).fill(null));
    private currentTurn: 'black' | 'white' = 'black';

    constructor(url: string) {
        this.url = url;
    }

    public connect(): void {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
            console.log('WebSocket Connected');
            this.startPing();
        };

        this.ws.onmessage = (event: MessageEvent) => {
            try {
                const buffer = new Uint8Array(event.data);
                const response = ServerToClientResponse.decode(buffer);
                this.handleMessage(response);
                this.notifyHandlers(response);
            } catch (error) {
                console.error('Failed to decode message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket Disconnected');
            this.stopPing();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.stopPing();
    }

    public send(request: ClientToServerRequest): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const buffer = ClientToServerRequest.encode(request).finish();
            this.ws.send(buffer);
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
    }

    public sendGameStart(sessionKey: string): void {
        const request: ClientToServerRequest = {
            sessionKey,
            gamestart: {}
        };
        this.send(request);
    }

    public sendPlaceStone(sessionKey: string, coordinate: number): void {
        const request: ClientToServerRequest = {
            sessionKey,
            coordinate: {
                coordinate
            }
        };
        this.send(request);
    }

    public sendPass(sessionKey: string): void {
        const request: ClientToServerRequest = {
            sessionKey,
            passTurn: {}
        };
        this.send(request);
    }

    public addMessageHandler(handler: MessageHandler): void {
        this.messageHandlers.push(handler);
    }

    public removeMessageHandler(handler: MessageHandler): void {
        this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    }

    // Subscription methods
    public onGameStateChange(listener: GameStateListener): void {
        this.gameStateListeners.push(listener);
    }

    public onGameStart(listener: GameStartListener): void {
        this.gameStartListeners.push(listener);
    }

    public onPlayerInfoUpdate(listener: PlayerInfoListener): void {
        this.playerInfoListeners.push(listener);
    }

    public onGameEnd(listener: GameEndListener): void {
        this.gameEndListeners.push(listener);
    }

    private notifyHandlers(response: ServerToClientResponse): void {
        this.messageHandlers.forEach(handler => handler(response));
    }

    private handleMessage(response: ServerToClientResponse): void {
        // Handle Game State
        if (response.gameState) {
            this.updateGameState(response.gameState);
        }
        // Note: coordinate and passTurn responses do not contain gameState directly in the current proto definition
        // If the server sends gameState updates, it should be in the top-level gameState field or we need to check if the proto definition is outdated.
        // Based on previous errors, coordinate and passTurn do not have gameState.
        // Assuming the server sends a separate gameState update message or the proto needs update.
        // For now, we rely on the top-level gameState check above.

        // Handle Turn
        const turnColor = this.colorEnumToString(response.turn);
        if (turnColor) {
            this.currentTurn = turnColor;
            this.notifyGameState();
        }

        // Handle Game Start
        if (response.gameStart) {
            this.gameStartListeners.forEach(listener => listener());
        }

        // Handle Users Info
        if (response.usersInfo) {
            this.playerInfoListeners.forEach(listener => listener(response.usersInfo!));
        }

        // Handle Game End
        if (response.theWinner !== undefined) {
            const winner = this.colorEnumToString(response.theWinner);
            if (winner) {
                this.gameEndListeners.forEach(listener => listener(winner));
            } else if (response.theWinner === Color.COLOR_FREE) { // Assuming FREE means draw or similar, need to check proto
                // If draw is represented differently, adjust here.
                // For now, let's assume draw might be a specific color or handled via drawOffer.
                // If theWinner is set, it usually means someone won.
            }
        }
    }

    private updateGameState(gameState: GameState): void {
        if (gameState.board) {
            this.board = this.bitboardToBoardArray(gameState.board.black, gameState.board.white);
        }
        // Pass time info if available
        this.notifyGameState(gameState.blackTime, gameState.whiteTime);
    }

    private notifyGameState(blackTime?: any, whiteTime?: any): void {
        this.gameStateListeners.forEach(listener => listener(this.board, this.currentTurn, blackTime, whiteTime));
    }

    private bitboardToBoardArray(
        blackBitboard: number[] | null | undefined,
        whiteBitboard: number[] | null | undefined
    ): (null | 'black' | 'white')[][] {
        const board: (null | 'black' | 'white')[][] = Array(this.boardSize)
            .fill(null)
            .map(() => Array(this.boardSize).fill(null));

        const parseU64 = (value: number): bigint => BigInt(value);

        const processBitboard = (bitboard: number[], color: 'black' | 'white') => {
            if (Array.isArray(bitboard)) {
                bitboard.forEach((u64, arrayIndex) => {
                    const bits = parseU64(u64);
                    for (let bitIndex = 0; bitIndex < 64; bitIndex++) {
                        if ((bits & (1n << BigInt(bitIndex))) !== 0n) {
                            const coordinate = arrayIndex * 64 + bitIndex;
                            if (coordinate < this.boardSize * this.boardSize) {
                                const row = Math.floor(coordinate / this.boardSize);
                                const col = coordinate % this.boardSize;
                                if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                                    board[row][col] = color;
                                }
                            }
                        }
                    }
                });
            }
        };

        if (blackBitboard) processBitboard(blackBitboard, 'black');
        if (whiteBitboard) processBitboard(whiteBitboard, 'white');

        return board;
    }

    private colorEnumToString(color: Color): 'black' | 'white' | null {
        switch (color) {
            case Color.COLOR_BLACK:
                return 'black';
            case Color.COLOR_WHITE:
                return 'white';
            default:
                return null;
        }
    }

    private startPing(): void {
        // Implement ping logic if required by server protocol
        // For now, keeping it empty or basic keep-alive
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}
