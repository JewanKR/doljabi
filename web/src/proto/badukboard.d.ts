import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace badukboardproto. */
export namespace badukboardproto {

    /** Properties of a BadukBoardState. */
    interface IBadukBoardState {

        /** BadukBoardState black */
        black?: ((number|Long)[]|null);

        /** BadukBoardState white */
        white?: ((number|Long)[]|null);
    }

    /** Represents a BadukBoardState. */
    class BadukBoardState implements IBadukBoardState {

        /**
         * Constructs a new BadukBoardState.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IBadukBoardState);

        /** BadukBoardState black. */
        public black: (number|Long)[];

        /** BadukBoardState white. */
        public white: (number|Long)[];

        /**
         * Creates a new BadukBoardState instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BadukBoardState instance
         */
        public static create(properties?: badukboardproto.IBadukBoardState): badukboardproto.BadukBoardState;

        /**
         * Encodes the specified BadukBoardState message. Does not implicitly {@link badukboardproto.BadukBoardState.verify|verify} messages.
         * @param message BadukBoardState message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IBadukBoardState, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BadukBoardState message, length delimited. Does not implicitly {@link badukboardproto.BadukBoardState.verify|verify} messages.
         * @param message BadukBoardState message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IBadukBoardState, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BadukBoardState message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BadukBoardState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.BadukBoardState;

        /**
         * Decodes a BadukBoardState message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BadukBoardState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.BadukBoardState;

        /**
         * Verifies a BadukBoardState message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BadukBoardState message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BadukBoardState
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.BadukBoardState;

        /**
         * Creates a plain object from a BadukBoardState message. Also converts values to other types if specified.
         * @param message BadukBoardState
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.BadukBoardState, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BadukBoardState to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for BadukBoardState
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PlayerTimeInfo. */
    interface IPlayerTimeInfo {

        /** PlayerTimeInfo mainTime */
        mainTime?: (number|Long|null);

        /** PlayerTimeInfo fischerTime */
        fischerTime?: (number|Long|null);

        /** PlayerTimeInfo remainingOvertime */
        remainingOvertime?: (number|null);

        /** PlayerTimeInfo overtime */
        overtime?: (number|Long|null);
    }

    /** 플레이어 시간 정보 */
    class PlayerTimeInfo implements IPlayerTimeInfo {

        /**
         * Constructs a new PlayerTimeInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IPlayerTimeInfo);

        /** PlayerTimeInfo mainTime. */
        public mainTime: (number|Long);

        /** PlayerTimeInfo fischerTime. */
        public fischerTime: (number|Long);

        /** PlayerTimeInfo remainingOvertime. */
        public remainingOvertime: number;

        /** PlayerTimeInfo overtime. */
        public overtime: (number|Long);

        /**
         * Creates a new PlayerTimeInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PlayerTimeInfo instance
         */
        public static create(properties?: badukboardproto.IPlayerTimeInfo): badukboardproto.PlayerTimeInfo;

        /**
         * Encodes the specified PlayerTimeInfo message. Does not implicitly {@link badukboardproto.PlayerTimeInfo.verify|verify} messages.
         * @param message PlayerTimeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IPlayerTimeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PlayerTimeInfo message, length delimited. Does not implicitly {@link badukboardproto.PlayerTimeInfo.verify|verify} messages.
         * @param message PlayerTimeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IPlayerTimeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PlayerTimeInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PlayerTimeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.PlayerTimeInfo;

        /**
         * Decodes a PlayerTimeInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PlayerTimeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.PlayerTimeInfo;

        /**
         * Verifies a PlayerTimeInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PlayerTimeInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PlayerTimeInfo
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.PlayerTimeInfo;

        /**
         * Creates a plain object from a PlayerTimeInfo message. Also converts values to other types if specified.
         * @param message PlayerTimeInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.PlayerTimeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PlayerTimeInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PlayerTimeInfo
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** 바둑판 턴 정보 */
    enum Color {
        COLOR_BLACK = 0,
        COLOR_WHITE = 1,
        COLOR_FREE = 2,
        COLOR_ERROR = 3
    }

    /** Properties of a GameState. */
    interface IGameState {

        /** GameState board */
        board?: (badukboardproto.IBadukBoardState|null);

        /** GameState blackTime */
        blackTime?: (badukboardproto.IPlayerTimeInfo|null);

        /** GameState whiteTime */
        whiteTime?: (badukboardproto.IPlayerTimeInfo|null);

        /** GameState turn */
        turn?: (badukboardproto.Color|null);
    }

    /** 보드 시간 턴 정보 */
    class GameState implements IGameState {

        /**
         * Constructs a new GameState.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IGameState);

        /** GameState board. */
        public board?: (badukboardproto.IBadukBoardState|null);

        /** GameState blackTime. */
        public blackTime?: (badukboardproto.IPlayerTimeInfo|null);

        /** GameState whiteTime. */
        public whiteTime?: (badukboardproto.IPlayerTimeInfo|null);

        /** GameState turn. */
        public turn: badukboardproto.Color;

        /** GameState _blackTime. */
        public _blackTime?: "blackTime";

        /** GameState _whiteTime. */
        public _whiteTime?: "whiteTime";

        /**
         * Creates a new GameState instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GameState instance
         */
        public static create(properties?: badukboardproto.IGameState): badukboardproto.GameState;

        /**
         * Encodes the specified GameState message. Does not implicitly {@link badukboardproto.GameState.verify|verify} messages.
         * @param message GameState message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IGameState, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GameState message, length delimited. Does not implicitly {@link badukboardproto.GameState.verify|verify} messages.
         * @param message GameState message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IGameState, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GameState message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GameState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.GameState;

        /**
         * Decodes a GameState message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GameState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.GameState;

        /**
         * Verifies a GameState message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GameState message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GameState
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.GameState;

        /**
         * Creates a plain object from a GameState message. Also converts values to other types if specified.
         * @param message GameState
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.GameState, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GameState to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GameState
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ChaksuRequest. */
    interface IChaksuRequest {

        /** ChaksuRequest coordinate */
        coordinate?: (number|null);
    }

    /** Represents a ChaksuRequest. */
    class ChaksuRequest implements IChaksuRequest {

        /**
         * Constructs a new ChaksuRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IChaksuRequest);

        /** ChaksuRequest coordinate. */
        public coordinate: number;

        /**
         * Creates a new ChaksuRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChaksuRequest instance
         */
        public static create(properties?: badukboardproto.IChaksuRequest): badukboardproto.ChaksuRequest;

        /**
         * Encodes the specified ChaksuRequest message. Does not implicitly {@link badukboardproto.ChaksuRequest.verify|verify} messages.
         * @param message ChaksuRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IChaksuRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChaksuRequest message, length delimited. Does not implicitly {@link badukboardproto.ChaksuRequest.verify|verify} messages.
         * @param message ChaksuRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IChaksuRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChaksuRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChaksuRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.ChaksuRequest;

        /**
         * Decodes a ChaksuRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChaksuRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.ChaksuRequest;

        /**
         * Verifies a ChaksuRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChaksuRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChaksuRequest
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.ChaksuRequest;

        /**
         * Creates a plain object from a ChaksuRequest message. Also converts values to other types if specified.
         * @param message ChaksuRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.ChaksuRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChaksuRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ChaksuRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a DrawOfferRequest. */
    interface IDrawOfferRequest {
    }

    /** Represents a DrawOfferRequest. */
    class DrawOfferRequest implements IDrawOfferRequest {

        /**
         * Constructs a new DrawOfferRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IDrawOfferRequest);

        /**
         * Creates a new DrawOfferRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DrawOfferRequest instance
         */
        public static create(properties?: badukboardproto.IDrawOfferRequest): badukboardproto.DrawOfferRequest;

        /**
         * Encodes the specified DrawOfferRequest message. Does not implicitly {@link badukboardproto.DrawOfferRequest.verify|verify} messages.
         * @param message DrawOfferRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IDrawOfferRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DrawOfferRequest message, length delimited. Does not implicitly {@link badukboardproto.DrawOfferRequest.verify|verify} messages.
         * @param message DrawOfferRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IDrawOfferRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DrawOfferRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DrawOfferRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.DrawOfferRequest;

        /**
         * Decodes a DrawOfferRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DrawOfferRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.DrawOfferRequest;

        /**
         * Verifies a DrawOfferRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DrawOfferRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DrawOfferRequest
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.DrawOfferRequest;

        /**
         * Creates a plain object from a DrawOfferRequest message. Also converts values to other types if specified.
         * @param message DrawOfferRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.DrawOfferRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DrawOfferRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for DrawOfferRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ResignRequest. */
    interface IResignRequest {
    }

    /** Represents a ResignRequest. */
    class ResignRequest implements IResignRequest {

        /**
         * Constructs a new ResignRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IResignRequest);

        /**
         * Creates a new ResignRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ResignRequest instance
         */
        public static create(properties?: badukboardproto.IResignRequest): badukboardproto.ResignRequest;

        /**
         * Encodes the specified ResignRequest message. Does not implicitly {@link badukboardproto.ResignRequest.verify|verify} messages.
         * @param message ResignRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IResignRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ResignRequest message, length delimited. Does not implicitly {@link badukboardproto.ResignRequest.verify|verify} messages.
         * @param message ResignRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IResignRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ResignRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ResignRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.ResignRequest;

        /**
         * Decodes a ResignRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ResignRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.ResignRequest;

        /**
         * Verifies a ResignRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ResignRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ResignRequest
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.ResignRequest;

        /**
         * Creates a plain object from a ResignRequest message. Also converts values to other types if specified.
         * @param message ResignRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.ResignRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ResignRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ResignRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PassTurnRequest. */
    interface IPassTurnRequest {
    }

    /** Represents a PassTurnRequest. */
    class PassTurnRequest implements IPassTurnRequest {

        /**
         * Constructs a new PassTurnRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IPassTurnRequest);

        /**
         * Creates a new PassTurnRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PassTurnRequest instance
         */
        public static create(properties?: badukboardproto.IPassTurnRequest): badukboardproto.PassTurnRequest;

        /**
         * Encodes the specified PassTurnRequest message. Does not implicitly {@link badukboardproto.PassTurnRequest.verify|verify} messages.
         * @param message PassTurnRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IPassTurnRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PassTurnRequest message, length delimited. Does not implicitly {@link badukboardproto.PassTurnRequest.verify|verify} messages.
         * @param message PassTurnRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IPassTurnRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PassTurnRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PassTurnRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.PassTurnRequest;

        /**
         * Decodes a PassTurnRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PassTurnRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.PassTurnRequest;

        /**
         * Verifies a PassTurnRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PassTurnRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PassTurnRequest
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.PassTurnRequest;

        /**
         * Creates a plain object from a PassTurnRequest message. Also converts values to other types if specified.
         * @param message PassTurnRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.PassTurnRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PassTurnRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PassTurnRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ClientToServerRequest. */
    interface IClientToServerRequest {

        /** ClientToServerRequest sessionKey */
        sessionKey?: (string|null);

        /** ClientToServerRequest coordinate */
        coordinate?: (badukboardproto.IChaksuRequest|null);

        /** ClientToServerRequest resign */
        resign?: (badukboardproto.IResignRequest|null);

        /** ClientToServerRequest drawOffer */
        drawOffer?: (badukboardproto.IDrawOfferRequest|null);

        /** ClientToServerRequest passTurn */
        passTurn?: (badukboardproto.IPassTurnRequest|null);
    }

    /** Represents a ClientToServerRequest. */
    class ClientToServerRequest implements IClientToServerRequest {

        /**
         * Constructs a new ClientToServerRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IClientToServerRequest);

        /** ClientToServerRequest sessionKey. */
        public sessionKey: string;

        /** ClientToServerRequest coordinate. */
        public coordinate?: (badukboardproto.IChaksuRequest|null);

        /** ClientToServerRequest resign. */
        public resign?: (badukboardproto.IResignRequest|null);

        /** ClientToServerRequest drawOffer. */
        public drawOffer?: (badukboardproto.IDrawOfferRequest|null);

        /** ClientToServerRequest passTurn. */
        public passTurn?: (badukboardproto.IPassTurnRequest|null);

        /** ClientToServerRequest payload. */
        public payload?: ("coordinate"|"resign"|"drawOffer"|"passTurn");

        /**
         * Creates a new ClientToServerRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ClientToServerRequest instance
         */
        public static create(properties?: badukboardproto.IClientToServerRequest): badukboardproto.ClientToServerRequest;

        /**
         * Encodes the specified ClientToServerRequest message. Does not implicitly {@link badukboardproto.ClientToServerRequest.verify|verify} messages.
         * @param message ClientToServerRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IClientToServerRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ClientToServerRequest message, length delimited. Does not implicitly {@link badukboardproto.ClientToServerRequest.verify|verify} messages.
         * @param message ClientToServerRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IClientToServerRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ClientToServerRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ClientToServerRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.ClientToServerRequest;

        /**
         * Decodes a ClientToServerRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ClientToServerRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.ClientToServerRequest;

        /**
         * Verifies a ClientToServerRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ClientToServerRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ClientToServerRequest
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.ClientToServerRequest;

        /**
         * Creates a plain object from a ClientToServerRequest message. Also converts values to other types if specified.
         * @param message ClientToServerRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.ClientToServerRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ClientToServerRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ClientToServerRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ChaksuResponse. */
    interface IChaksuResponse {

        /** ChaksuResponse success */
        success?: (boolean|null);

        /** ChaksuResponse gameState */
        gameState?: (badukboardproto.IGameState|null);
    }

    /** Represents a ChaksuResponse. */
    class ChaksuResponse implements IChaksuResponse {

        /**
         * Constructs a new ChaksuResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IChaksuResponse);

        /** ChaksuResponse success. */
        public success: boolean;

        /** ChaksuResponse gameState. */
        public gameState?: (badukboardproto.IGameState|null);

        /**
         * Creates a new ChaksuResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChaksuResponse instance
         */
        public static create(properties?: badukboardproto.IChaksuResponse): badukboardproto.ChaksuResponse;

        /**
         * Encodes the specified ChaksuResponse message. Does not implicitly {@link badukboardproto.ChaksuResponse.verify|verify} messages.
         * @param message ChaksuResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IChaksuResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChaksuResponse message, length delimited. Does not implicitly {@link badukboardproto.ChaksuResponse.verify|verify} messages.
         * @param message ChaksuResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IChaksuResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChaksuResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChaksuResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.ChaksuResponse;

        /**
         * Decodes a ChaksuResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChaksuResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.ChaksuResponse;

        /**
         * Verifies a ChaksuResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChaksuResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChaksuResponse
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.ChaksuResponse;

        /**
         * Creates a plain object from a ChaksuResponse message. Also converts values to other types if specified.
         * @param message ChaksuResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.ChaksuResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChaksuResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ChaksuResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ResignResponse. */
    interface IResignResponse {
    }

    /** Represents a ResignResponse. */
    class ResignResponse implements IResignResponse {

        /**
         * Constructs a new ResignResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IResignResponse);

        /**
         * Creates a new ResignResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ResignResponse instance
         */
        public static create(properties?: badukboardproto.IResignResponse): badukboardproto.ResignResponse;

        /**
         * Encodes the specified ResignResponse message. Does not implicitly {@link badukboardproto.ResignResponse.verify|verify} messages.
         * @param message ResignResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IResignResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ResignResponse message, length delimited. Does not implicitly {@link badukboardproto.ResignResponse.verify|verify} messages.
         * @param message ResignResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IResignResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ResignResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ResignResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.ResignResponse;

        /**
         * Decodes a ResignResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ResignResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.ResignResponse;

        /**
         * Verifies a ResignResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ResignResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ResignResponse
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.ResignResponse;

        /**
         * Creates a plain object from a ResignResponse message. Also converts values to other types if specified.
         * @param message ResignResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.ResignResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ResignResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ResignResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a DrawOfferResponse. */
    interface IDrawOfferResponse {

        /** DrawOfferResponse accepted */
        accepted?: (boolean|null);
    }

    /** Represents a DrawOfferResponse. */
    class DrawOfferResponse implements IDrawOfferResponse {

        /**
         * Constructs a new DrawOfferResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IDrawOfferResponse);

        /** DrawOfferResponse accepted. */
        public accepted: boolean;

        /**
         * Creates a new DrawOfferResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DrawOfferResponse instance
         */
        public static create(properties?: badukboardproto.IDrawOfferResponse): badukboardproto.DrawOfferResponse;

        /**
         * Encodes the specified DrawOfferResponse message. Does not implicitly {@link badukboardproto.DrawOfferResponse.verify|verify} messages.
         * @param message DrawOfferResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IDrawOfferResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DrawOfferResponse message, length delimited. Does not implicitly {@link badukboardproto.DrawOfferResponse.verify|verify} messages.
         * @param message DrawOfferResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IDrawOfferResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DrawOfferResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DrawOfferResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.DrawOfferResponse;

        /**
         * Decodes a DrawOfferResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DrawOfferResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.DrawOfferResponse;

        /**
         * Verifies a DrawOfferResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DrawOfferResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DrawOfferResponse
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.DrawOfferResponse;

        /**
         * Creates a plain object from a DrawOfferResponse message. Also converts values to other types if specified.
         * @param message DrawOfferResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.DrawOfferResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DrawOfferResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for DrawOfferResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PassTurnResponse. */
    interface IPassTurnResponse {

        /** PassTurnResponse gameState */
        gameState?: (badukboardproto.IGameState|null);
    }

    /** Represents a PassTurnResponse. */
    class PassTurnResponse implements IPassTurnResponse {

        /**
         * Constructs a new PassTurnResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IPassTurnResponse);

        /** PassTurnResponse gameState. */
        public gameState?: (badukboardproto.IGameState|null);

        /**
         * Creates a new PassTurnResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PassTurnResponse instance
         */
        public static create(properties?: badukboardproto.IPassTurnResponse): badukboardproto.PassTurnResponse;

        /**
         * Encodes the specified PassTurnResponse message. Does not implicitly {@link badukboardproto.PassTurnResponse.verify|verify} messages.
         * @param message PassTurnResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IPassTurnResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PassTurnResponse message, length delimited. Does not implicitly {@link badukboardproto.PassTurnResponse.verify|verify} messages.
         * @param message PassTurnResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IPassTurnResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PassTurnResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PassTurnResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.PassTurnResponse;

        /**
         * Decodes a PassTurnResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PassTurnResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.PassTurnResponse;

        /**
         * Verifies a PassTurnResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PassTurnResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PassTurnResponse
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.PassTurnResponse;

        /**
         * Creates a plain object from a PassTurnResponse message. Also converts values to other types if specified.
         * @param message PassTurnResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.PassTurnResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PassTurnResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PassTurnResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ServerToClientResponse. */
    interface IServerToClientResponse {

        /** ServerToClientResponse responseType */
        responseType?: (boolean|null);

        /** ServerToClientResponse coordinate */
        coordinate?: (badukboardproto.IChaksuResponse|null);

        /** ServerToClientResponse resign */
        resign?: (badukboardproto.IResignResponse|null);

        /** ServerToClientResponse drawOffer */
        drawOffer?: (badukboardproto.IDrawOfferResponse|null);

        /** ServerToClientResponse passTurn */
        passTurn?: (badukboardproto.IPassTurnResponse|null);
    }

    /** Represents a ServerToClientResponse. */
    class ServerToClientResponse implements IServerToClientResponse {

        /**
         * Constructs a new ServerToClientResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: badukboardproto.IServerToClientResponse);

        /** ServerToClientResponse responseType. */
        public responseType: boolean;

        /** ServerToClientResponse coordinate. */
        public coordinate?: (badukboardproto.IChaksuResponse|null);

        /** ServerToClientResponse resign. */
        public resign?: (badukboardproto.IResignResponse|null);

        /** ServerToClientResponse drawOffer. */
        public drawOffer?: (badukboardproto.IDrawOfferResponse|null);

        /** ServerToClientResponse passTurn. */
        public passTurn?: (badukboardproto.IPassTurnResponse|null);

        /** ServerToClientResponse payload. */
        public payload?: ("coordinate"|"resign"|"drawOffer"|"passTurn");

        /**
         * Creates a new ServerToClientResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ServerToClientResponse instance
         */
        public static create(properties?: badukboardproto.IServerToClientResponse): badukboardproto.ServerToClientResponse;

        /**
         * Encodes the specified ServerToClientResponse message. Does not implicitly {@link badukboardproto.ServerToClientResponse.verify|verify} messages.
         * @param message ServerToClientResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: badukboardproto.IServerToClientResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ServerToClientResponse message, length delimited. Does not implicitly {@link badukboardproto.ServerToClientResponse.verify|verify} messages.
         * @param message ServerToClientResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: badukboardproto.IServerToClientResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ServerToClientResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ServerToClientResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): badukboardproto.ServerToClientResponse;

        /**
         * Decodes a ServerToClientResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ServerToClientResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): badukboardproto.ServerToClientResponse;

        /**
         * Verifies a ServerToClientResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ServerToClientResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ServerToClientResponse
         */
        public static fromObject(object: { [k: string]: any }): badukboardproto.ServerToClientResponse;

        /**
         * Creates a plain object from a ServerToClientResponse message. Also converts values to other types if specified.
         * @param message ServerToClientResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: badukboardproto.ServerToClientResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ServerToClientResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ServerToClientResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
