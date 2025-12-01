/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const badukboardproto = $root.badukboardproto = (() => {

    /**
     * Namespace badukboardproto.
     * @exports badukboardproto
     * @namespace
     */
    const badukboardproto = {};

    badukboardproto.BadukBoardState = (function() {

        /**
         * Properties of a BadukBoardState.
         * @memberof badukboardproto
         * @interface IBadukBoardState
         * @property {Array.<number|Long>|null} [black] BadukBoardState black
         * @property {Array.<number|Long>|null} [white] BadukBoardState white
         */

        /**
         * Constructs a new BadukBoardState.
         * @memberof badukboardproto
         * @classdesc Represents a BadukBoardState.
         * @implements IBadukBoardState
         * @constructor
         * @param {badukboardproto.IBadukBoardState=} [properties] Properties to set
         */
        function BadukBoardState(properties) {
            this.black = [];
            this.white = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BadukBoardState black.
         * @member {Array.<number|Long>} black
         * @memberof badukboardproto.BadukBoardState
         * @instance
         */
        BadukBoardState.prototype.black = $util.emptyArray;

        /**
         * BadukBoardState white.
         * @member {Array.<number|Long>} white
         * @memberof badukboardproto.BadukBoardState
         * @instance
         */
        BadukBoardState.prototype.white = $util.emptyArray;

        /**
         * Creates a new BadukBoardState instance using the specified properties.
         * @function create
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {badukboardproto.IBadukBoardState=} [properties] Properties to set
         * @returns {badukboardproto.BadukBoardState} BadukBoardState instance
         */
        BadukBoardState.create = function create(properties) {
            return new BadukBoardState(properties);
        };

        /**
         * Encodes the specified BadukBoardState message. Does not implicitly {@link badukboardproto.BadukBoardState.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {badukboardproto.IBadukBoardState} message BadukBoardState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BadukBoardState.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.black != null && message.black.length) {
                writer.uint32(/* id 1, wireType 2 =*/10).fork();
                for (let i = 0; i < message.black.length; ++i)
                    writer.fixed64(message.black[i]);
                writer.ldelim();
            }
            if (message.white != null && message.white.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (let i = 0; i < message.white.length; ++i)
                    writer.fixed64(message.white[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified BadukBoardState message, length delimited. Does not implicitly {@link badukboardproto.BadukBoardState.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {badukboardproto.IBadukBoardState} message BadukBoardState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BadukBoardState.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BadukBoardState message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.BadukBoardState} BadukBoardState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BadukBoardState.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.BadukBoardState();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.black && message.black.length))
                            message.black = [];
                        if ((tag & 7) === 2) {
                            let end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.black.push(reader.fixed64());
                        } else
                            message.black.push(reader.fixed64());
                        break;
                    }
                case 2: {
                        if (!(message.white && message.white.length))
                            message.white = [];
                        if ((tag & 7) === 2) {
                            let end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.white.push(reader.fixed64());
                        } else
                            message.white.push(reader.fixed64());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BadukBoardState message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.BadukBoardState} BadukBoardState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BadukBoardState.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BadukBoardState message.
         * @function verify
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BadukBoardState.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.black != null && message.hasOwnProperty("black")) {
                if (!Array.isArray(message.black))
                    return "black: array expected";
                for (let i = 0; i < message.black.length; ++i)
                    if (!$util.isInteger(message.black[i]) && !(message.black[i] && $util.isInteger(message.black[i].low) && $util.isInteger(message.black[i].high)))
                        return "black: integer|Long[] expected";
            }
            if (message.white != null && message.hasOwnProperty("white")) {
                if (!Array.isArray(message.white))
                    return "white: array expected";
                for (let i = 0; i < message.white.length; ++i)
                    if (!$util.isInteger(message.white[i]) && !(message.white[i] && $util.isInteger(message.white[i].low) && $util.isInteger(message.white[i].high)))
                        return "white: integer|Long[] expected";
            }
            return null;
        };

        /**
         * Creates a BadukBoardState message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.BadukBoardState} BadukBoardState
         */
        BadukBoardState.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.BadukBoardState)
                return object;
            let message = new $root.badukboardproto.BadukBoardState();
            if (object.black) {
                if (!Array.isArray(object.black))
                    throw TypeError(".badukboardproto.BadukBoardState.black: array expected");
                message.black = [];
                for (let i = 0; i < object.black.length; ++i)
                    if ($util.Long)
                        (message.black[i] = $util.Long.fromValue(object.black[i])).unsigned = false;
                    else if (typeof object.black[i] === "string")
                        message.black[i] = parseInt(object.black[i], 10);
                    else if (typeof object.black[i] === "number")
                        message.black[i] = object.black[i];
                    else if (typeof object.black[i] === "object")
                        message.black[i] = new $util.LongBits(object.black[i].low >>> 0, object.black[i].high >>> 0).toNumber();
            }
            if (object.white) {
                if (!Array.isArray(object.white))
                    throw TypeError(".badukboardproto.BadukBoardState.white: array expected");
                message.white = [];
                for (let i = 0; i < object.white.length; ++i)
                    if ($util.Long)
                        (message.white[i] = $util.Long.fromValue(object.white[i])).unsigned = false;
                    else if (typeof object.white[i] === "string")
                        message.white[i] = parseInt(object.white[i], 10);
                    else if (typeof object.white[i] === "number")
                        message.white[i] = object.white[i];
                    else if (typeof object.white[i] === "object")
                        message.white[i] = new $util.LongBits(object.white[i].low >>> 0, object.white[i].high >>> 0).toNumber();
            }
            return message;
        };

        /**
         * Creates a plain object from a BadukBoardState message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {badukboardproto.BadukBoardState} message BadukBoardState
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BadukBoardState.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults) {
                object.black = [];
                object.white = [];
            }
            if (message.black && message.black.length) {
                object.black = [];
                for (let j = 0; j < message.black.length; ++j)
                    if (typeof message.black[j] === "number")
                        object.black[j] = options.longs === String ? String(message.black[j]) : message.black[j];
                    else
                        object.black[j] = options.longs === String ? $util.Long.prototype.toString.call(message.black[j]) : options.longs === Number ? new $util.LongBits(message.black[j].low >>> 0, message.black[j].high >>> 0).toNumber() : message.black[j];
            }
            if (message.white && message.white.length) {
                object.white = [];
                for (let j = 0; j < message.white.length; ++j)
                    if (typeof message.white[j] === "number")
                        object.white[j] = options.longs === String ? String(message.white[j]) : message.white[j];
                    else
                        object.white[j] = options.longs === String ? $util.Long.prototype.toString.call(message.white[j]) : options.longs === Number ? new $util.LongBits(message.white[j].low >>> 0, message.white[j].high >>> 0).toNumber() : message.white[j];
            }
            return object;
        };

        /**
         * Converts this BadukBoardState to JSON.
         * @function toJSON
         * @memberof badukboardproto.BadukBoardState
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BadukBoardState.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for BadukBoardState
         * @function getTypeUrl
         * @memberof badukboardproto.BadukBoardState
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        BadukBoardState.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.BadukBoardState";
        };

        return BadukBoardState;
    })();

    badukboardproto.PlayerTimeInfo = (function() {

        /**
         * Properties of a PlayerTimeInfo.
         * @memberof badukboardproto
         * @interface IPlayerTimeInfo
         * @property {number|Long|null} [mainTime] PlayerTimeInfo mainTime
         * @property {number|Long|null} [fischerTime] PlayerTimeInfo fischerTime
         * @property {number|null} [remainingOvertime] PlayerTimeInfo remainingOvertime
         * @property {number|Long|null} [overtime] PlayerTimeInfo overtime
         */

        /**
         * Constructs a new PlayerTimeInfo.
         * @memberof badukboardproto
         * @classdesc 플레이어 시간 정보
         * @implements IPlayerTimeInfo
         * @constructor
         * @param {badukboardproto.IPlayerTimeInfo=} [properties] Properties to set
         */
        function PlayerTimeInfo(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PlayerTimeInfo mainTime.
         * @member {number|Long} mainTime
         * @memberof badukboardproto.PlayerTimeInfo
         * @instance
         */
        PlayerTimeInfo.prototype.mainTime = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * PlayerTimeInfo fischerTime.
         * @member {number|Long} fischerTime
         * @memberof badukboardproto.PlayerTimeInfo
         * @instance
         */
        PlayerTimeInfo.prototype.fischerTime = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * PlayerTimeInfo remainingOvertime.
         * @member {number} remainingOvertime
         * @memberof badukboardproto.PlayerTimeInfo
         * @instance
         */
        PlayerTimeInfo.prototype.remainingOvertime = 0;

        /**
         * PlayerTimeInfo overtime.
         * @member {number|Long} overtime
         * @memberof badukboardproto.PlayerTimeInfo
         * @instance
         */
        PlayerTimeInfo.prototype.overtime = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new PlayerTimeInfo instance using the specified properties.
         * @function create
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {badukboardproto.IPlayerTimeInfo=} [properties] Properties to set
         * @returns {badukboardproto.PlayerTimeInfo} PlayerTimeInfo instance
         */
        PlayerTimeInfo.create = function create(properties) {
            return new PlayerTimeInfo(properties);
        };

        /**
         * Encodes the specified PlayerTimeInfo message. Does not implicitly {@link badukboardproto.PlayerTimeInfo.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {badukboardproto.IPlayerTimeInfo} message PlayerTimeInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerTimeInfo.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.mainTime != null && Object.hasOwnProperty.call(message, "mainTime"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.mainTime);
            if (message.fischerTime != null && Object.hasOwnProperty.call(message, "fischerTime"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.fischerTime);
            if (message.remainingOvertime != null && Object.hasOwnProperty.call(message, "remainingOvertime"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.remainingOvertime);
            if (message.overtime != null && Object.hasOwnProperty.call(message, "overtime"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.overtime);
            return writer;
        };

        /**
         * Encodes the specified PlayerTimeInfo message, length delimited. Does not implicitly {@link badukboardproto.PlayerTimeInfo.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {badukboardproto.IPlayerTimeInfo} message PlayerTimeInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerTimeInfo.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PlayerTimeInfo message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.PlayerTimeInfo} PlayerTimeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerTimeInfo.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.PlayerTimeInfo();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.mainTime = reader.uint64();
                        break;
                    }
                case 2: {
                        message.fischerTime = reader.uint64();
                        break;
                    }
                case 3: {
                        message.remainingOvertime = reader.uint32();
                        break;
                    }
                case 4: {
                        message.overtime = reader.uint64();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PlayerTimeInfo message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.PlayerTimeInfo} PlayerTimeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerTimeInfo.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PlayerTimeInfo message.
         * @function verify
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PlayerTimeInfo.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.mainTime != null && message.hasOwnProperty("mainTime"))
                if (!$util.isInteger(message.mainTime) && !(message.mainTime && $util.isInteger(message.mainTime.low) && $util.isInteger(message.mainTime.high)))
                    return "mainTime: integer|Long expected";
            if (message.fischerTime != null && message.hasOwnProperty("fischerTime"))
                if (!$util.isInteger(message.fischerTime) && !(message.fischerTime && $util.isInteger(message.fischerTime.low) && $util.isInteger(message.fischerTime.high)))
                    return "fischerTime: integer|Long expected";
            if (message.remainingOvertime != null && message.hasOwnProperty("remainingOvertime"))
                if (!$util.isInteger(message.remainingOvertime))
                    return "remainingOvertime: integer expected";
            if (message.overtime != null && message.hasOwnProperty("overtime"))
                if (!$util.isInteger(message.overtime) && !(message.overtime && $util.isInteger(message.overtime.low) && $util.isInteger(message.overtime.high)))
                    return "overtime: integer|Long expected";
            return null;
        };

        /**
         * Creates a PlayerTimeInfo message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.PlayerTimeInfo} PlayerTimeInfo
         */
        PlayerTimeInfo.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.PlayerTimeInfo)
                return object;
            let message = new $root.badukboardproto.PlayerTimeInfo();
            if (object.mainTime != null)
                if ($util.Long)
                    (message.mainTime = $util.Long.fromValue(object.mainTime)).unsigned = true;
                else if (typeof object.mainTime === "string")
                    message.mainTime = parseInt(object.mainTime, 10);
                else if (typeof object.mainTime === "number")
                    message.mainTime = object.mainTime;
                else if (typeof object.mainTime === "object")
                    message.mainTime = new $util.LongBits(object.mainTime.low >>> 0, object.mainTime.high >>> 0).toNumber(true);
            if (object.fischerTime != null)
                if ($util.Long)
                    (message.fischerTime = $util.Long.fromValue(object.fischerTime)).unsigned = true;
                else if (typeof object.fischerTime === "string")
                    message.fischerTime = parseInt(object.fischerTime, 10);
                else if (typeof object.fischerTime === "number")
                    message.fischerTime = object.fischerTime;
                else if (typeof object.fischerTime === "object")
                    message.fischerTime = new $util.LongBits(object.fischerTime.low >>> 0, object.fischerTime.high >>> 0).toNumber(true);
            if (object.remainingOvertime != null)
                message.remainingOvertime = object.remainingOvertime >>> 0;
            if (object.overtime != null)
                if ($util.Long)
                    (message.overtime = $util.Long.fromValue(object.overtime)).unsigned = true;
                else if (typeof object.overtime === "string")
                    message.overtime = parseInt(object.overtime, 10);
                else if (typeof object.overtime === "number")
                    message.overtime = object.overtime;
                else if (typeof object.overtime === "object")
                    message.overtime = new $util.LongBits(object.overtime.low >>> 0, object.overtime.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a PlayerTimeInfo message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {badukboardproto.PlayerTimeInfo} message PlayerTimeInfo
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PlayerTimeInfo.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.mainTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.mainTime = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.fischerTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.fischerTime = options.longs === String ? "0" : 0;
                object.remainingOvertime = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.overtime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.overtime = options.longs === String ? "0" : 0;
            }
            if (message.mainTime != null && message.hasOwnProperty("mainTime"))
                if (typeof message.mainTime === "number")
                    object.mainTime = options.longs === String ? String(message.mainTime) : message.mainTime;
                else
                    object.mainTime = options.longs === String ? $util.Long.prototype.toString.call(message.mainTime) : options.longs === Number ? new $util.LongBits(message.mainTime.low >>> 0, message.mainTime.high >>> 0).toNumber(true) : message.mainTime;
            if (message.fischerTime != null && message.hasOwnProperty("fischerTime"))
                if (typeof message.fischerTime === "number")
                    object.fischerTime = options.longs === String ? String(message.fischerTime) : message.fischerTime;
                else
                    object.fischerTime = options.longs === String ? $util.Long.prototype.toString.call(message.fischerTime) : options.longs === Number ? new $util.LongBits(message.fischerTime.low >>> 0, message.fischerTime.high >>> 0).toNumber(true) : message.fischerTime;
            if (message.remainingOvertime != null && message.hasOwnProperty("remainingOvertime"))
                object.remainingOvertime = message.remainingOvertime;
            if (message.overtime != null && message.hasOwnProperty("overtime"))
                if (typeof message.overtime === "number")
                    object.overtime = options.longs === String ? String(message.overtime) : message.overtime;
                else
                    object.overtime = options.longs === String ? $util.Long.prototype.toString.call(message.overtime) : options.longs === Number ? new $util.LongBits(message.overtime.low >>> 0, message.overtime.high >>> 0).toNumber(true) : message.overtime;
            return object;
        };

        /**
         * Converts this PlayerTimeInfo to JSON.
         * @function toJSON
         * @memberof badukboardproto.PlayerTimeInfo
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PlayerTimeInfo.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for PlayerTimeInfo
         * @function getTypeUrl
         * @memberof badukboardproto.PlayerTimeInfo
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PlayerTimeInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.PlayerTimeInfo";
        };

        return PlayerTimeInfo;
    })();

    /**
     * 바둑판 턴 정보
     * @name badukboardproto.Color
     * @enum {number}
     * @property {number} COLOR_BLACK=0 COLOR_BLACK value
     * @property {number} COLOR_WHITE=1 COLOR_WHITE value
     * @property {number} COLOR_FREE=2 COLOR_FREE value
     * @property {number} COLOR_ERROR=3 COLOR_ERROR value
     */
    badukboardproto.Color = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "COLOR_BLACK"] = 0;
        values[valuesById[1] = "COLOR_WHITE"] = 1;
        values[valuesById[2] = "COLOR_FREE"] = 2;
        values[valuesById[3] = "COLOR_ERROR"] = 3;
        return values;
    })();

    badukboardproto.GameState = (function() {

        /**
         * Properties of a GameState.
         * @memberof badukboardproto
         * @interface IGameState
         * @property {badukboardproto.IBadukBoardState|null} [board] GameState board
         * @property {badukboardproto.IPlayerTimeInfo|null} [blackTime] GameState blackTime
         * @property {badukboardproto.IPlayerTimeInfo|null} [whiteTime] GameState whiteTime
         * @property {badukboardproto.Color|null} [turn] GameState turn
         */

        /**
         * Constructs a new GameState.
         * @memberof badukboardproto
         * @classdesc 보드 시간 턴 정보
         * @implements IGameState
         * @constructor
         * @param {badukboardproto.IGameState=} [properties] Properties to set
         */
        function GameState(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GameState board.
         * @member {badukboardproto.IBadukBoardState|null|undefined} board
         * @memberof badukboardproto.GameState
         * @instance
         */
        GameState.prototype.board = null;

        /**
         * GameState blackTime.
         * @member {badukboardproto.IPlayerTimeInfo|null|undefined} blackTime
         * @memberof badukboardproto.GameState
         * @instance
         */
        GameState.prototype.blackTime = null;

        /**
         * GameState whiteTime.
         * @member {badukboardproto.IPlayerTimeInfo|null|undefined} whiteTime
         * @memberof badukboardproto.GameState
         * @instance
         */
        GameState.prototype.whiteTime = null;

        /**
         * GameState turn.
         * @member {badukboardproto.Color} turn
         * @memberof badukboardproto.GameState
         * @instance
         */
        GameState.prototype.turn = 0;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * GameState _blackTime.
         * @member {"blackTime"|undefined} _blackTime
         * @memberof badukboardproto.GameState
         * @instance
         */
        Object.defineProperty(GameState.prototype, "_blackTime", {
            get: $util.oneOfGetter($oneOfFields = ["blackTime"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * GameState _whiteTime.
         * @member {"whiteTime"|undefined} _whiteTime
         * @memberof badukboardproto.GameState
         * @instance
         */
        Object.defineProperty(GameState.prototype, "_whiteTime", {
            get: $util.oneOfGetter($oneOfFields = ["whiteTime"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new GameState instance using the specified properties.
         * @function create
         * @memberof badukboardproto.GameState
         * @static
         * @param {badukboardproto.IGameState=} [properties] Properties to set
         * @returns {badukboardproto.GameState} GameState instance
         */
        GameState.create = function create(properties) {
            return new GameState(properties);
        };

        /**
         * Encodes the specified GameState message. Does not implicitly {@link badukboardproto.GameState.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.GameState
         * @static
         * @param {badukboardproto.IGameState} message GameState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GameState.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.board != null && Object.hasOwnProperty.call(message, "board"))
                $root.badukboardproto.BadukBoardState.encode(message.board, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.blackTime != null && Object.hasOwnProperty.call(message, "blackTime"))
                $root.badukboardproto.PlayerTimeInfo.encode(message.blackTime, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.whiteTime != null && Object.hasOwnProperty.call(message, "whiteTime"))
                $root.badukboardproto.PlayerTimeInfo.encode(message.whiteTime, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.turn != null && Object.hasOwnProperty.call(message, "turn"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.turn);
            return writer;
        };

        /**
         * Encodes the specified GameState message, length delimited. Does not implicitly {@link badukboardproto.GameState.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.GameState
         * @static
         * @param {badukboardproto.IGameState} message GameState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GameState.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GameState message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.GameState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.GameState} GameState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GameState.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.GameState();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.board = $root.badukboardproto.BadukBoardState.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.blackTime = $root.badukboardproto.PlayerTimeInfo.decode(reader, reader.uint32());
                        break;
                    }
                case 3: {
                        message.whiteTime = $root.badukboardproto.PlayerTimeInfo.decode(reader, reader.uint32());
                        break;
                    }
                case 4: {
                        message.turn = reader.int32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GameState message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.GameState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.GameState} GameState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GameState.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GameState message.
         * @function verify
         * @memberof badukboardproto.GameState
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GameState.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.board != null && message.hasOwnProperty("board")) {
                let error = $root.badukboardproto.BadukBoardState.verify(message.board);
                if (error)
                    return "board." + error;
            }
            if (message.blackTime != null && message.hasOwnProperty("blackTime")) {
                properties._blackTime = 1;
                {
                    let error = $root.badukboardproto.PlayerTimeInfo.verify(message.blackTime);
                    if (error)
                        return "blackTime." + error;
                }
            }
            if (message.whiteTime != null && message.hasOwnProperty("whiteTime")) {
                properties._whiteTime = 1;
                {
                    let error = $root.badukboardproto.PlayerTimeInfo.verify(message.whiteTime);
                    if (error)
                        return "whiteTime." + error;
                }
            }
            if (message.turn != null && message.hasOwnProperty("turn"))
                switch (message.turn) {
                default:
                    return "turn: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                    break;
                }
            return null;
        };

        /**
         * Creates a GameState message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.GameState
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.GameState} GameState
         */
        GameState.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.GameState)
                return object;
            let message = new $root.badukboardproto.GameState();
            if (object.board != null) {
                if (typeof object.board !== "object")
                    throw TypeError(".badukboardproto.GameState.board: object expected");
                message.board = $root.badukboardproto.BadukBoardState.fromObject(object.board);
            }
            if (object.blackTime != null) {
                if (typeof object.blackTime !== "object")
                    throw TypeError(".badukboardproto.GameState.blackTime: object expected");
                message.blackTime = $root.badukboardproto.PlayerTimeInfo.fromObject(object.blackTime);
            }
            if (object.whiteTime != null) {
                if (typeof object.whiteTime !== "object")
                    throw TypeError(".badukboardproto.GameState.whiteTime: object expected");
                message.whiteTime = $root.badukboardproto.PlayerTimeInfo.fromObject(object.whiteTime);
            }
            switch (object.turn) {
            default:
                if (typeof object.turn === "number") {
                    message.turn = object.turn;
                    break;
                }
                break;
            case "COLOR_BLACK":
            case 0:
                message.turn = 0;
                break;
            case "COLOR_WHITE":
            case 1:
                message.turn = 1;
                break;
            case "COLOR_FREE":
            case 2:
                message.turn = 2;
                break;
            case "COLOR_ERROR":
            case 3:
                message.turn = 3;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from a GameState message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.GameState
         * @static
         * @param {badukboardproto.GameState} message GameState
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GameState.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.board = null;
                object.turn = options.enums === String ? "COLOR_BLACK" : 0;
            }
            if (message.board != null && message.hasOwnProperty("board"))
                object.board = $root.badukboardproto.BadukBoardState.toObject(message.board, options);
            if (message.blackTime != null && message.hasOwnProperty("blackTime")) {
                object.blackTime = $root.badukboardproto.PlayerTimeInfo.toObject(message.blackTime, options);
                if (options.oneofs)
                    object._blackTime = "blackTime";
            }
            if (message.whiteTime != null && message.hasOwnProperty("whiteTime")) {
                object.whiteTime = $root.badukboardproto.PlayerTimeInfo.toObject(message.whiteTime, options);
                if (options.oneofs)
                    object._whiteTime = "whiteTime";
            }
            if (message.turn != null && message.hasOwnProperty("turn"))
                object.turn = options.enums === String ? $root.badukboardproto.Color[message.turn] === undefined ? message.turn : $root.badukboardproto.Color[message.turn] : message.turn;
            return object;
        };

        /**
         * Converts this GameState to JSON.
         * @function toJSON
         * @memberof badukboardproto.GameState
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GameState.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GameState
         * @function getTypeUrl
         * @memberof badukboardproto.GameState
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GameState.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.GameState";
        };

        return GameState;
    })();

    badukboardproto.ChaksuRequest = (function() {

        /**
         * Properties of a ChaksuRequest.
         * @memberof badukboardproto
         * @interface IChaksuRequest
         * @property {number|null} [coordinate] ChaksuRequest coordinate
         */

        /**
         * Constructs a new ChaksuRequest.
         * @memberof badukboardproto
         * @classdesc Represents a ChaksuRequest.
         * @implements IChaksuRequest
         * @constructor
         * @param {badukboardproto.IChaksuRequest=} [properties] Properties to set
         */
        function ChaksuRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChaksuRequest coordinate.
         * @member {number} coordinate
         * @memberof badukboardproto.ChaksuRequest
         * @instance
         */
        ChaksuRequest.prototype.coordinate = 0;

        /**
         * Creates a new ChaksuRequest instance using the specified properties.
         * @function create
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {badukboardproto.IChaksuRequest=} [properties] Properties to set
         * @returns {badukboardproto.ChaksuRequest} ChaksuRequest instance
         */
        ChaksuRequest.create = function create(properties) {
            return new ChaksuRequest(properties);
        };

        /**
         * Encodes the specified ChaksuRequest message. Does not implicitly {@link badukboardproto.ChaksuRequest.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {badukboardproto.IChaksuRequest} message ChaksuRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChaksuRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.coordinate != null && Object.hasOwnProperty.call(message, "coordinate"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.coordinate);
            return writer;
        };

        /**
         * Encodes the specified ChaksuRequest message, length delimited. Does not implicitly {@link badukboardproto.ChaksuRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {badukboardproto.IChaksuRequest} message ChaksuRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChaksuRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChaksuRequest message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.ChaksuRequest} ChaksuRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChaksuRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.ChaksuRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.coordinate = reader.uint32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChaksuRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.ChaksuRequest} ChaksuRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChaksuRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChaksuRequest message.
         * @function verify
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChaksuRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.coordinate != null && message.hasOwnProperty("coordinate"))
                if (!$util.isInteger(message.coordinate))
                    return "coordinate: integer expected";
            return null;
        };

        /**
         * Creates a ChaksuRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.ChaksuRequest} ChaksuRequest
         */
        ChaksuRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.ChaksuRequest)
                return object;
            let message = new $root.badukboardproto.ChaksuRequest();
            if (object.coordinate != null)
                message.coordinate = object.coordinate >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a ChaksuRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {badukboardproto.ChaksuRequest} message ChaksuRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChaksuRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.coordinate = 0;
            if (message.coordinate != null && message.hasOwnProperty("coordinate"))
                object.coordinate = message.coordinate;
            return object;
        };

        /**
         * Converts this ChaksuRequest to JSON.
         * @function toJSON
         * @memberof badukboardproto.ChaksuRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChaksuRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ChaksuRequest
         * @function getTypeUrl
         * @memberof badukboardproto.ChaksuRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ChaksuRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.ChaksuRequest";
        };

        return ChaksuRequest;
    })();

    badukboardproto.DrawOfferRequest = (function() {

        /**
         * Properties of a DrawOfferRequest.
         * @memberof badukboardproto
         * @interface IDrawOfferRequest
         */

        /**
         * Constructs a new DrawOfferRequest.
         * @memberof badukboardproto
         * @classdesc Represents a DrawOfferRequest.
         * @implements IDrawOfferRequest
         * @constructor
         * @param {badukboardproto.IDrawOfferRequest=} [properties] Properties to set
         */
        function DrawOfferRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new DrawOfferRequest instance using the specified properties.
         * @function create
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {badukboardproto.IDrawOfferRequest=} [properties] Properties to set
         * @returns {badukboardproto.DrawOfferRequest} DrawOfferRequest instance
         */
        DrawOfferRequest.create = function create(properties) {
            return new DrawOfferRequest(properties);
        };

        /**
         * Encodes the specified DrawOfferRequest message. Does not implicitly {@link badukboardproto.DrawOfferRequest.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {badukboardproto.IDrawOfferRequest} message DrawOfferRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DrawOfferRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified DrawOfferRequest message, length delimited. Does not implicitly {@link badukboardproto.DrawOfferRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {badukboardproto.IDrawOfferRequest} message DrawOfferRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DrawOfferRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DrawOfferRequest message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.DrawOfferRequest} DrawOfferRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DrawOfferRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.DrawOfferRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a DrawOfferRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.DrawOfferRequest} DrawOfferRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DrawOfferRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DrawOfferRequest message.
         * @function verify
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DrawOfferRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a DrawOfferRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.DrawOfferRequest} DrawOfferRequest
         */
        DrawOfferRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.DrawOfferRequest)
                return object;
            return new $root.badukboardproto.DrawOfferRequest();
        };

        /**
         * Creates a plain object from a DrawOfferRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {badukboardproto.DrawOfferRequest} message DrawOfferRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DrawOfferRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this DrawOfferRequest to JSON.
         * @function toJSON
         * @memberof badukboardproto.DrawOfferRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DrawOfferRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for DrawOfferRequest
         * @function getTypeUrl
         * @memberof badukboardproto.DrawOfferRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        DrawOfferRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.DrawOfferRequest";
        };

        return DrawOfferRequest;
    })();

    badukboardproto.ResignRequest = (function() {

        /**
         * Properties of a ResignRequest.
         * @memberof badukboardproto
         * @interface IResignRequest
         */

        /**
         * Constructs a new ResignRequest.
         * @memberof badukboardproto
         * @classdesc Represents a ResignRequest.
         * @implements IResignRequest
         * @constructor
         * @param {badukboardproto.IResignRequest=} [properties] Properties to set
         */
        function ResignRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new ResignRequest instance using the specified properties.
         * @function create
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {badukboardproto.IResignRequest=} [properties] Properties to set
         * @returns {badukboardproto.ResignRequest} ResignRequest instance
         */
        ResignRequest.create = function create(properties) {
            return new ResignRequest(properties);
        };

        /**
         * Encodes the specified ResignRequest message. Does not implicitly {@link badukboardproto.ResignRequest.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {badukboardproto.IResignRequest} message ResignRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ResignRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified ResignRequest message, length delimited. Does not implicitly {@link badukboardproto.ResignRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {badukboardproto.IResignRequest} message ResignRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ResignRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ResignRequest message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.ResignRequest} ResignRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ResignRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.ResignRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ResignRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.ResignRequest} ResignRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ResignRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ResignRequest message.
         * @function verify
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ResignRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a ResignRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.ResignRequest} ResignRequest
         */
        ResignRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.ResignRequest)
                return object;
            return new $root.badukboardproto.ResignRequest();
        };

        /**
         * Creates a plain object from a ResignRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {badukboardproto.ResignRequest} message ResignRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ResignRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this ResignRequest to JSON.
         * @function toJSON
         * @memberof badukboardproto.ResignRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ResignRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ResignRequest
         * @function getTypeUrl
         * @memberof badukboardproto.ResignRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ResignRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.ResignRequest";
        };

        return ResignRequest;
    })();

    badukboardproto.PassTurnRequest = (function() {

        /**
         * Properties of a PassTurnRequest.
         * @memberof badukboardproto
         * @interface IPassTurnRequest
         */

        /**
         * Constructs a new PassTurnRequest.
         * @memberof badukboardproto
         * @classdesc Represents a PassTurnRequest.
         * @implements IPassTurnRequest
         * @constructor
         * @param {badukboardproto.IPassTurnRequest=} [properties] Properties to set
         */
        function PassTurnRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new PassTurnRequest instance using the specified properties.
         * @function create
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {badukboardproto.IPassTurnRequest=} [properties] Properties to set
         * @returns {badukboardproto.PassTurnRequest} PassTurnRequest instance
         */
        PassTurnRequest.create = function create(properties) {
            return new PassTurnRequest(properties);
        };

        /**
         * Encodes the specified PassTurnRequest message. Does not implicitly {@link badukboardproto.PassTurnRequest.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {badukboardproto.IPassTurnRequest} message PassTurnRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PassTurnRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified PassTurnRequest message, length delimited. Does not implicitly {@link badukboardproto.PassTurnRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {badukboardproto.IPassTurnRequest} message PassTurnRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PassTurnRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PassTurnRequest message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.PassTurnRequest} PassTurnRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PassTurnRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.PassTurnRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PassTurnRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.PassTurnRequest} PassTurnRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PassTurnRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PassTurnRequest message.
         * @function verify
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PassTurnRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a PassTurnRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.PassTurnRequest} PassTurnRequest
         */
        PassTurnRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.PassTurnRequest)
                return object;
            return new $root.badukboardproto.PassTurnRequest();
        };

        /**
         * Creates a plain object from a PassTurnRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {badukboardproto.PassTurnRequest} message PassTurnRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PassTurnRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this PassTurnRequest to JSON.
         * @function toJSON
         * @memberof badukboardproto.PassTurnRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PassTurnRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for PassTurnRequest
         * @function getTypeUrl
         * @memberof badukboardproto.PassTurnRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PassTurnRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.PassTurnRequest";
        };

        return PassTurnRequest;
    })();

    badukboardproto.ClientToServerRequest = (function() {

        /**
         * Properties of a ClientToServerRequest.
         * @memberof badukboardproto
         * @interface IClientToServerRequest
         * @property {string|null} [sessionKey] ClientToServerRequest sessionKey
         * @property {badukboardproto.IChaksuRequest|null} [coordinate] ClientToServerRequest coordinate
         * @property {badukboardproto.IResignRequest|null} [resign] ClientToServerRequest resign
         * @property {badukboardproto.IDrawOfferRequest|null} [drawOffer] ClientToServerRequest drawOffer
         * @property {badukboardproto.IPassTurnRequest|null} [passTurn] ClientToServerRequest passTurn
         */

        /**
         * Constructs a new ClientToServerRequest.
         * @memberof badukboardproto
         * @classdesc Represents a ClientToServerRequest.
         * @implements IClientToServerRequest
         * @constructor
         * @param {badukboardproto.IClientToServerRequest=} [properties] Properties to set
         */
        function ClientToServerRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ClientToServerRequest sessionKey.
         * @member {string} sessionKey
         * @memberof badukboardproto.ClientToServerRequest
         * @instance
         */
        ClientToServerRequest.prototype.sessionKey = "";

        /**
         * ClientToServerRequest coordinate.
         * @member {badukboardproto.IChaksuRequest|null|undefined} coordinate
         * @memberof badukboardproto.ClientToServerRequest
         * @instance
         */
        ClientToServerRequest.prototype.coordinate = null;

        /**
         * ClientToServerRequest resign.
         * @member {badukboardproto.IResignRequest|null|undefined} resign
         * @memberof badukboardproto.ClientToServerRequest
         * @instance
         */
        ClientToServerRequest.prototype.resign = null;

        /**
         * ClientToServerRequest drawOffer.
         * @member {badukboardproto.IDrawOfferRequest|null|undefined} drawOffer
         * @memberof badukboardproto.ClientToServerRequest
         * @instance
         */
        ClientToServerRequest.prototype.drawOffer = null;

        /**
         * ClientToServerRequest passTurn.
         * @member {badukboardproto.IPassTurnRequest|null|undefined} passTurn
         * @memberof badukboardproto.ClientToServerRequest
         * @instance
         */
        ClientToServerRequest.prototype.passTurn = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * ClientToServerRequest payload.
         * @member {"coordinate"|"resign"|"drawOffer"|"passTurn"|undefined} payload
         * @memberof badukboardproto.ClientToServerRequest
         * @instance
         */
        Object.defineProperty(ClientToServerRequest.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["coordinate", "resign", "drawOffer", "passTurn"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ClientToServerRequest instance using the specified properties.
         * @function create
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {badukboardproto.IClientToServerRequest=} [properties] Properties to set
         * @returns {badukboardproto.ClientToServerRequest} ClientToServerRequest instance
         */
        ClientToServerRequest.create = function create(properties) {
            return new ClientToServerRequest(properties);
        };

        /**
         * Encodes the specified ClientToServerRequest message. Does not implicitly {@link badukboardproto.ClientToServerRequest.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {badukboardproto.IClientToServerRequest} message ClientToServerRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientToServerRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.sessionKey != null && Object.hasOwnProperty.call(message, "sessionKey"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.sessionKey);
            if (message.coordinate != null && Object.hasOwnProperty.call(message, "coordinate"))
                $root.badukboardproto.ChaksuRequest.encode(message.coordinate, writer.uint32(/* id 100, wireType 2 =*/802).fork()).ldelim();
            if (message.resign != null && Object.hasOwnProperty.call(message, "resign"))
                $root.badukboardproto.ResignRequest.encode(message.resign, writer.uint32(/* id 101, wireType 2 =*/810).fork()).ldelim();
            if (message.drawOffer != null && Object.hasOwnProperty.call(message, "drawOffer"))
                $root.badukboardproto.DrawOfferRequest.encode(message.drawOffer, writer.uint32(/* id 102, wireType 2 =*/818).fork()).ldelim();
            if (message.passTurn != null && Object.hasOwnProperty.call(message, "passTurn"))
                $root.badukboardproto.PassTurnRequest.encode(message.passTurn, writer.uint32(/* id 103, wireType 2 =*/826).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ClientToServerRequest message, length delimited. Does not implicitly {@link badukboardproto.ClientToServerRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {badukboardproto.IClientToServerRequest} message ClientToServerRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientToServerRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ClientToServerRequest message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.ClientToServerRequest} ClientToServerRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientToServerRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.ClientToServerRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.sessionKey = reader.string();
                        break;
                    }
                case 100: {
                        message.coordinate = $root.badukboardproto.ChaksuRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 101: {
                        message.resign = $root.badukboardproto.ResignRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 102: {
                        message.drawOffer = $root.badukboardproto.DrawOfferRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 103: {
                        message.passTurn = $root.badukboardproto.PassTurnRequest.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ClientToServerRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.ClientToServerRequest} ClientToServerRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientToServerRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ClientToServerRequest message.
         * @function verify
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ClientToServerRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.sessionKey != null && message.hasOwnProperty("sessionKey"))
                if (!$util.isString(message.sessionKey))
                    return "sessionKey: string expected";
            if (message.coordinate != null && message.hasOwnProperty("coordinate")) {
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.ChaksuRequest.verify(message.coordinate);
                    if (error)
                        return "coordinate." + error;
                }
            }
            if (message.resign != null && message.hasOwnProperty("resign")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.ResignRequest.verify(message.resign);
                    if (error)
                        return "resign." + error;
                }
            }
            if (message.drawOffer != null && message.hasOwnProperty("drawOffer")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.DrawOfferRequest.verify(message.drawOffer);
                    if (error)
                        return "drawOffer." + error;
                }
            }
            if (message.passTurn != null && message.hasOwnProperty("passTurn")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.PassTurnRequest.verify(message.passTurn);
                    if (error)
                        return "passTurn." + error;
                }
            }
            return null;
        };

        /**
         * Creates a ClientToServerRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.ClientToServerRequest} ClientToServerRequest
         */
        ClientToServerRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.ClientToServerRequest)
                return object;
            let message = new $root.badukboardproto.ClientToServerRequest();
            if (object.sessionKey != null)
                message.sessionKey = String(object.sessionKey);
            if (object.coordinate != null) {
                if (typeof object.coordinate !== "object")
                    throw TypeError(".badukboardproto.ClientToServerRequest.coordinate: object expected");
                message.coordinate = $root.badukboardproto.ChaksuRequest.fromObject(object.coordinate);
            }
            if (object.resign != null) {
                if (typeof object.resign !== "object")
                    throw TypeError(".badukboardproto.ClientToServerRequest.resign: object expected");
                message.resign = $root.badukboardproto.ResignRequest.fromObject(object.resign);
            }
            if (object.drawOffer != null) {
                if (typeof object.drawOffer !== "object")
                    throw TypeError(".badukboardproto.ClientToServerRequest.drawOffer: object expected");
                message.drawOffer = $root.badukboardproto.DrawOfferRequest.fromObject(object.drawOffer);
            }
            if (object.passTurn != null) {
                if (typeof object.passTurn !== "object")
                    throw TypeError(".badukboardproto.ClientToServerRequest.passTurn: object expected");
                message.passTurn = $root.badukboardproto.PassTurnRequest.fromObject(object.passTurn);
            }
            return message;
        };

        /**
         * Creates a plain object from a ClientToServerRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {badukboardproto.ClientToServerRequest} message ClientToServerRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ClientToServerRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.sessionKey = "";
            if (message.sessionKey != null && message.hasOwnProperty("sessionKey"))
                object.sessionKey = message.sessionKey;
            if (message.coordinate != null && message.hasOwnProperty("coordinate")) {
                object.coordinate = $root.badukboardproto.ChaksuRequest.toObject(message.coordinate, options);
                if (options.oneofs)
                    object.payload = "coordinate";
            }
            if (message.resign != null && message.hasOwnProperty("resign")) {
                object.resign = $root.badukboardproto.ResignRequest.toObject(message.resign, options);
                if (options.oneofs)
                    object.payload = "resign";
            }
            if (message.drawOffer != null && message.hasOwnProperty("drawOffer")) {
                object.drawOffer = $root.badukboardproto.DrawOfferRequest.toObject(message.drawOffer, options);
                if (options.oneofs)
                    object.payload = "drawOffer";
            }
            if (message.passTurn != null && message.hasOwnProperty("passTurn")) {
                object.passTurn = $root.badukboardproto.PassTurnRequest.toObject(message.passTurn, options);
                if (options.oneofs)
                    object.payload = "passTurn";
            }
            return object;
        };

        /**
         * Converts this ClientToServerRequest to JSON.
         * @function toJSON
         * @memberof badukboardproto.ClientToServerRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ClientToServerRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ClientToServerRequest
         * @function getTypeUrl
         * @memberof badukboardproto.ClientToServerRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ClientToServerRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.ClientToServerRequest";
        };

        return ClientToServerRequest;
    })();

    badukboardproto.ChaksuResponse = (function() {

        /**
         * Properties of a ChaksuResponse.
         * @memberof badukboardproto
         * @interface IChaksuResponse
         * @property {boolean|null} [success] ChaksuResponse success
         * @property {badukboardproto.IGameState|null} [gameState] ChaksuResponse gameState
         */

        /**
         * Constructs a new ChaksuResponse.
         * @memberof badukboardproto
         * @classdesc Represents a ChaksuResponse.
         * @implements IChaksuResponse
         * @constructor
         * @param {badukboardproto.IChaksuResponse=} [properties] Properties to set
         */
        function ChaksuResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChaksuResponse success.
         * @member {boolean} success
         * @memberof badukboardproto.ChaksuResponse
         * @instance
         */
        ChaksuResponse.prototype.success = false;

        /**
         * ChaksuResponse gameState.
         * @member {badukboardproto.IGameState|null|undefined} gameState
         * @memberof badukboardproto.ChaksuResponse
         * @instance
         */
        ChaksuResponse.prototype.gameState = null;

        /**
         * Creates a new ChaksuResponse instance using the specified properties.
         * @function create
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {badukboardproto.IChaksuResponse=} [properties] Properties to set
         * @returns {badukboardproto.ChaksuResponse} ChaksuResponse instance
         */
        ChaksuResponse.create = function create(properties) {
            return new ChaksuResponse(properties);
        };

        /**
         * Encodes the specified ChaksuResponse message. Does not implicitly {@link badukboardproto.ChaksuResponse.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {badukboardproto.IChaksuResponse} message ChaksuResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChaksuResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
            if (message.gameState != null && Object.hasOwnProperty.call(message, "gameState"))
                $root.badukboardproto.GameState.encode(message.gameState, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ChaksuResponse message, length delimited. Does not implicitly {@link badukboardproto.ChaksuResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {badukboardproto.IChaksuResponse} message ChaksuResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChaksuResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChaksuResponse message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.ChaksuResponse} ChaksuResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChaksuResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.ChaksuResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.success = reader.bool();
                        break;
                    }
                case 2: {
                        message.gameState = $root.badukboardproto.GameState.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChaksuResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.ChaksuResponse} ChaksuResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChaksuResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChaksuResponse message.
         * @function verify
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChaksuResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.success != null && message.hasOwnProperty("success"))
                if (typeof message.success !== "boolean")
                    return "success: boolean expected";
            if (message.gameState != null && message.hasOwnProperty("gameState")) {
                let error = $root.badukboardproto.GameState.verify(message.gameState);
                if (error)
                    return "gameState." + error;
            }
            return null;
        };

        /**
         * Creates a ChaksuResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.ChaksuResponse} ChaksuResponse
         */
        ChaksuResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.ChaksuResponse)
                return object;
            let message = new $root.badukboardproto.ChaksuResponse();
            if (object.success != null)
                message.success = Boolean(object.success);
            if (object.gameState != null) {
                if (typeof object.gameState !== "object")
                    throw TypeError(".badukboardproto.ChaksuResponse.gameState: object expected");
                message.gameState = $root.badukboardproto.GameState.fromObject(object.gameState);
            }
            return message;
        };

        /**
         * Creates a plain object from a ChaksuResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {badukboardproto.ChaksuResponse} message ChaksuResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChaksuResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.success = false;
                object.gameState = null;
            }
            if (message.success != null && message.hasOwnProperty("success"))
                object.success = message.success;
            if (message.gameState != null && message.hasOwnProperty("gameState"))
                object.gameState = $root.badukboardproto.GameState.toObject(message.gameState, options);
            return object;
        };

        /**
         * Converts this ChaksuResponse to JSON.
         * @function toJSON
         * @memberof badukboardproto.ChaksuResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChaksuResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ChaksuResponse
         * @function getTypeUrl
         * @memberof badukboardproto.ChaksuResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ChaksuResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.ChaksuResponse";
        };

        return ChaksuResponse;
    })();

    badukboardproto.ResignResponse = (function() {

        /**
         * Properties of a ResignResponse.
         * @memberof badukboardproto
         * @interface IResignResponse
         */

        /**
         * Constructs a new ResignResponse.
         * @memberof badukboardproto
         * @classdesc Represents a ResignResponse.
         * @implements IResignResponse
         * @constructor
         * @param {badukboardproto.IResignResponse=} [properties] Properties to set
         */
        function ResignResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new ResignResponse instance using the specified properties.
         * @function create
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {badukboardproto.IResignResponse=} [properties] Properties to set
         * @returns {badukboardproto.ResignResponse} ResignResponse instance
         */
        ResignResponse.create = function create(properties) {
            return new ResignResponse(properties);
        };

        /**
         * Encodes the specified ResignResponse message. Does not implicitly {@link badukboardproto.ResignResponse.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {badukboardproto.IResignResponse} message ResignResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ResignResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified ResignResponse message, length delimited. Does not implicitly {@link badukboardproto.ResignResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {badukboardproto.IResignResponse} message ResignResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ResignResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ResignResponse message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.ResignResponse} ResignResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ResignResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.ResignResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ResignResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.ResignResponse} ResignResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ResignResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ResignResponse message.
         * @function verify
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ResignResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a ResignResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.ResignResponse} ResignResponse
         */
        ResignResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.ResignResponse)
                return object;
            return new $root.badukboardproto.ResignResponse();
        };

        /**
         * Creates a plain object from a ResignResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {badukboardproto.ResignResponse} message ResignResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ResignResponse.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this ResignResponse to JSON.
         * @function toJSON
         * @memberof badukboardproto.ResignResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ResignResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ResignResponse
         * @function getTypeUrl
         * @memberof badukboardproto.ResignResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ResignResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.ResignResponse";
        };

        return ResignResponse;
    })();

    badukboardproto.DrawOfferResponse = (function() {

        /**
         * Properties of a DrawOfferResponse.
         * @memberof badukboardproto
         * @interface IDrawOfferResponse
         * @property {boolean|null} [accepted] DrawOfferResponse accepted
         */

        /**
         * Constructs a new DrawOfferResponse.
         * @memberof badukboardproto
         * @classdesc Represents a DrawOfferResponse.
         * @implements IDrawOfferResponse
         * @constructor
         * @param {badukboardproto.IDrawOfferResponse=} [properties] Properties to set
         */
        function DrawOfferResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * DrawOfferResponse accepted.
         * @member {boolean} accepted
         * @memberof badukboardproto.DrawOfferResponse
         * @instance
         */
        DrawOfferResponse.prototype.accepted = false;

        /**
         * Creates a new DrawOfferResponse instance using the specified properties.
         * @function create
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {badukboardproto.IDrawOfferResponse=} [properties] Properties to set
         * @returns {badukboardproto.DrawOfferResponse} DrawOfferResponse instance
         */
        DrawOfferResponse.create = function create(properties) {
            return new DrawOfferResponse(properties);
        };

        /**
         * Encodes the specified DrawOfferResponse message. Does not implicitly {@link badukboardproto.DrawOfferResponse.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {badukboardproto.IDrawOfferResponse} message DrawOfferResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DrawOfferResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.accepted != null && Object.hasOwnProperty.call(message, "accepted"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.accepted);
            return writer;
        };

        /**
         * Encodes the specified DrawOfferResponse message, length delimited. Does not implicitly {@link badukboardproto.DrawOfferResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {badukboardproto.IDrawOfferResponse} message DrawOfferResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DrawOfferResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DrawOfferResponse message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.DrawOfferResponse} DrawOfferResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DrawOfferResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.DrawOfferResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.accepted = reader.bool();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a DrawOfferResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.DrawOfferResponse} DrawOfferResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DrawOfferResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DrawOfferResponse message.
         * @function verify
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DrawOfferResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.accepted != null && message.hasOwnProperty("accepted"))
                if (typeof message.accepted !== "boolean")
                    return "accepted: boolean expected";
            return null;
        };

        /**
         * Creates a DrawOfferResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.DrawOfferResponse} DrawOfferResponse
         */
        DrawOfferResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.DrawOfferResponse)
                return object;
            let message = new $root.badukboardproto.DrawOfferResponse();
            if (object.accepted != null)
                message.accepted = Boolean(object.accepted);
            return message;
        };

        /**
         * Creates a plain object from a DrawOfferResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {badukboardproto.DrawOfferResponse} message DrawOfferResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DrawOfferResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.accepted = false;
            if (message.accepted != null && message.hasOwnProperty("accepted"))
                object.accepted = message.accepted;
            return object;
        };

        /**
         * Converts this DrawOfferResponse to JSON.
         * @function toJSON
         * @memberof badukboardproto.DrawOfferResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DrawOfferResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for DrawOfferResponse
         * @function getTypeUrl
         * @memberof badukboardproto.DrawOfferResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        DrawOfferResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.DrawOfferResponse";
        };

        return DrawOfferResponse;
    })();

    badukboardproto.PassTurnResponse = (function() {

        /**
         * Properties of a PassTurnResponse.
         * @memberof badukboardproto
         * @interface IPassTurnResponse
         * @property {badukboardproto.IGameState|null} [gameState] PassTurnResponse gameState
         */

        /**
         * Constructs a new PassTurnResponse.
         * @memberof badukboardproto
         * @classdesc Represents a PassTurnResponse.
         * @implements IPassTurnResponse
         * @constructor
         * @param {badukboardproto.IPassTurnResponse=} [properties] Properties to set
         */
        function PassTurnResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PassTurnResponse gameState.
         * @member {badukboardproto.IGameState|null|undefined} gameState
         * @memberof badukboardproto.PassTurnResponse
         * @instance
         */
        PassTurnResponse.prototype.gameState = null;

        /**
         * Creates a new PassTurnResponse instance using the specified properties.
         * @function create
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {badukboardproto.IPassTurnResponse=} [properties] Properties to set
         * @returns {badukboardproto.PassTurnResponse} PassTurnResponse instance
         */
        PassTurnResponse.create = function create(properties) {
            return new PassTurnResponse(properties);
        };

        /**
         * Encodes the specified PassTurnResponse message. Does not implicitly {@link badukboardproto.PassTurnResponse.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {badukboardproto.IPassTurnResponse} message PassTurnResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PassTurnResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.gameState != null && Object.hasOwnProperty.call(message, "gameState"))
                $root.badukboardproto.GameState.encode(message.gameState, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified PassTurnResponse message, length delimited. Does not implicitly {@link badukboardproto.PassTurnResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {badukboardproto.IPassTurnResponse} message PassTurnResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PassTurnResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PassTurnResponse message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.PassTurnResponse} PassTurnResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PassTurnResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.PassTurnResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.gameState = $root.badukboardproto.GameState.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PassTurnResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.PassTurnResponse} PassTurnResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PassTurnResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PassTurnResponse message.
         * @function verify
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PassTurnResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.gameState != null && message.hasOwnProperty("gameState")) {
                let error = $root.badukboardproto.GameState.verify(message.gameState);
                if (error)
                    return "gameState." + error;
            }
            return null;
        };

        /**
         * Creates a PassTurnResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.PassTurnResponse} PassTurnResponse
         */
        PassTurnResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.PassTurnResponse)
                return object;
            let message = new $root.badukboardproto.PassTurnResponse();
            if (object.gameState != null) {
                if (typeof object.gameState !== "object")
                    throw TypeError(".badukboardproto.PassTurnResponse.gameState: object expected");
                message.gameState = $root.badukboardproto.GameState.fromObject(object.gameState);
            }
            return message;
        };

        /**
         * Creates a plain object from a PassTurnResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {badukboardproto.PassTurnResponse} message PassTurnResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PassTurnResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.gameState = null;
            if (message.gameState != null && message.hasOwnProperty("gameState"))
                object.gameState = $root.badukboardproto.GameState.toObject(message.gameState, options);
            return object;
        };

        /**
         * Converts this PassTurnResponse to JSON.
         * @function toJSON
         * @memberof badukboardproto.PassTurnResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PassTurnResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for PassTurnResponse
         * @function getTypeUrl
         * @memberof badukboardproto.PassTurnResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PassTurnResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.PassTurnResponse";
        };

        return PassTurnResponse;
    })();

    badukboardproto.ServerToClientResponse = (function() {

        /**
         * Properties of a ServerToClientResponse.
         * @memberof badukboardproto
         * @interface IServerToClientResponse
         * @property {boolean|null} [responseType] ServerToClientResponse responseType
         * @property {badukboardproto.IChaksuResponse|null} [coordinate] ServerToClientResponse coordinate
         * @property {badukboardproto.IResignResponse|null} [resign] ServerToClientResponse resign
         * @property {badukboardproto.IDrawOfferResponse|null} [drawOffer] ServerToClientResponse drawOffer
         * @property {badukboardproto.IPassTurnResponse|null} [passTurn] ServerToClientResponse passTurn
         */

        /**
         * Constructs a new ServerToClientResponse.
         * @memberof badukboardproto
         * @classdesc Represents a ServerToClientResponse.
         * @implements IServerToClientResponse
         * @constructor
         * @param {badukboardproto.IServerToClientResponse=} [properties] Properties to set
         */
        function ServerToClientResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ServerToClientResponse responseType.
         * @member {boolean} responseType
         * @memberof badukboardproto.ServerToClientResponse
         * @instance
         */
        ServerToClientResponse.prototype.responseType = false;

        /**
         * ServerToClientResponse coordinate.
         * @member {badukboardproto.IChaksuResponse|null|undefined} coordinate
         * @memberof badukboardproto.ServerToClientResponse
         * @instance
         */
        ServerToClientResponse.prototype.coordinate = null;

        /**
         * ServerToClientResponse resign.
         * @member {badukboardproto.IResignResponse|null|undefined} resign
         * @memberof badukboardproto.ServerToClientResponse
         * @instance
         */
        ServerToClientResponse.prototype.resign = null;

        /**
         * ServerToClientResponse drawOffer.
         * @member {badukboardproto.IDrawOfferResponse|null|undefined} drawOffer
         * @memberof badukboardproto.ServerToClientResponse
         * @instance
         */
        ServerToClientResponse.prototype.drawOffer = null;

        /**
         * ServerToClientResponse passTurn.
         * @member {badukboardproto.IPassTurnResponse|null|undefined} passTurn
         * @memberof badukboardproto.ServerToClientResponse
         * @instance
         */
        ServerToClientResponse.prototype.passTurn = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * ServerToClientResponse payload.
         * @member {"coordinate"|"resign"|"drawOffer"|"passTurn"|undefined} payload
         * @memberof badukboardproto.ServerToClientResponse
         * @instance
         */
        Object.defineProperty(ServerToClientResponse.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["coordinate", "resign", "drawOffer", "passTurn"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ServerToClientResponse instance using the specified properties.
         * @function create
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {badukboardproto.IServerToClientResponse=} [properties] Properties to set
         * @returns {badukboardproto.ServerToClientResponse} ServerToClientResponse instance
         */
        ServerToClientResponse.create = function create(properties) {
            return new ServerToClientResponse(properties);
        };

        /**
         * Encodes the specified ServerToClientResponse message. Does not implicitly {@link badukboardproto.ServerToClientResponse.verify|verify} messages.
         * @function encode
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {badukboardproto.IServerToClientResponse} message ServerToClientResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ServerToClientResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.responseType != null && Object.hasOwnProperty.call(message, "responseType"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.responseType);
            if (message.coordinate != null && Object.hasOwnProperty.call(message, "coordinate"))
                $root.badukboardproto.ChaksuResponse.encode(message.coordinate, writer.uint32(/* id 100, wireType 2 =*/802).fork()).ldelim();
            if (message.resign != null && Object.hasOwnProperty.call(message, "resign"))
                $root.badukboardproto.ResignResponse.encode(message.resign, writer.uint32(/* id 101, wireType 2 =*/810).fork()).ldelim();
            if (message.drawOffer != null && Object.hasOwnProperty.call(message, "drawOffer"))
                $root.badukboardproto.DrawOfferResponse.encode(message.drawOffer, writer.uint32(/* id 102, wireType 2 =*/818).fork()).ldelim();
            if (message.passTurn != null && Object.hasOwnProperty.call(message, "passTurn"))
                $root.badukboardproto.PassTurnResponse.encode(message.passTurn, writer.uint32(/* id 103, wireType 2 =*/826).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ServerToClientResponse message, length delimited. Does not implicitly {@link badukboardproto.ServerToClientResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {badukboardproto.IServerToClientResponse} message ServerToClientResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ServerToClientResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ServerToClientResponse message from the specified reader or buffer.
         * @function decode
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {badukboardproto.ServerToClientResponse} ServerToClientResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ServerToClientResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.badukboardproto.ServerToClientResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.responseType = reader.bool();
                        break;
                    }
                case 100: {
                        message.coordinate = $root.badukboardproto.ChaksuResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 101: {
                        message.resign = $root.badukboardproto.ResignResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 102: {
                        message.drawOffer = $root.badukboardproto.DrawOfferResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 103: {
                        message.passTurn = $root.badukboardproto.PassTurnResponse.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ServerToClientResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {badukboardproto.ServerToClientResponse} ServerToClientResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ServerToClientResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ServerToClientResponse message.
         * @function verify
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ServerToClientResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.responseType != null && message.hasOwnProperty("responseType"))
                if (typeof message.responseType !== "boolean")
                    return "responseType: boolean expected";
            if (message.coordinate != null && message.hasOwnProperty("coordinate")) {
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.ChaksuResponse.verify(message.coordinate);
                    if (error)
                        return "coordinate." + error;
                }
            }
            if (message.resign != null && message.hasOwnProperty("resign")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.ResignResponse.verify(message.resign);
                    if (error)
                        return "resign." + error;
                }
            }
            if (message.drawOffer != null && message.hasOwnProperty("drawOffer")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.DrawOfferResponse.verify(message.drawOffer);
                    if (error)
                        return "drawOffer." + error;
                }
            }
            if (message.passTurn != null && message.hasOwnProperty("passTurn")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.badukboardproto.PassTurnResponse.verify(message.passTurn);
                    if (error)
                        return "passTurn." + error;
                }
            }
            return null;
        };

        /**
         * Creates a ServerToClientResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {badukboardproto.ServerToClientResponse} ServerToClientResponse
         */
        ServerToClientResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.badukboardproto.ServerToClientResponse)
                return object;
            let message = new $root.badukboardproto.ServerToClientResponse();
            if (object.responseType != null)
                message.responseType = Boolean(object.responseType);
            if (object.coordinate != null) {
                if (typeof object.coordinate !== "object")
                    throw TypeError(".badukboardproto.ServerToClientResponse.coordinate: object expected");
                message.coordinate = $root.badukboardproto.ChaksuResponse.fromObject(object.coordinate);
            }
            if (object.resign != null) {
                if (typeof object.resign !== "object")
                    throw TypeError(".badukboardproto.ServerToClientResponse.resign: object expected");
                message.resign = $root.badukboardproto.ResignResponse.fromObject(object.resign);
            }
            if (object.drawOffer != null) {
                if (typeof object.drawOffer !== "object")
                    throw TypeError(".badukboardproto.ServerToClientResponse.drawOffer: object expected");
                message.drawOffer = $root.badukboardproto.DrawOfferResponse.fromObject(object.drawOffer);
            }
            if (object.passTurn != null) {
                if (typeof object.passTurn !== "object")
                    throw TypeError(".badukboardproto.ServerToClientResponse.passTurn: object expected");
                message.passTurn = $root.badukboardproto.PassTurnResponse.fromObject(object.passTurn);
            }
            return message;
        };

        /**
         * Creates a plain object from a ServerToClientResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {badukboardproto.ServerToClientResponse} message ServerToClientResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ServerToClientResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.responseType = false;
            if (message.responseType != null && message.hasOwnProperty("responseType"))
                object.responseType = message.responseType;
            if (message.coordinate != null && message.hasOwnProperty("coordinate")) {
                object.coordinate = $root.badukboardproto.ChaksuResponse.toObject(message.coordinate, options);
                if (options.oneofs)
                    object.payload = "coordinate";
            }
            if (message.resign != null && message.hasOwnProperty("resign")) {
                object.resign = $root.badukboardproto.ResignResponse.toObject(message.resign, options);
                if (options.oneofs)
                    object.payload = "resign";
            }
            if (message.drawOffer != null && message.hasOwnProperty("drawOffer")) {
                object.drawOffer = $root.badukboardproto.DrawOfferResponse.toObject(message.drawOffer, options);
                if (options.oneofs)
                    object.payload = "drawOffer";
            }
            if (message.passTurn != null && message.hasOwnProperty("passTurn")) {
                object.passTurn = $root.badukboardproto.PassTurnResponse.toObject(message.passTurn, options);
                if (options.oneofs)
                    object.payload = "passTurn";
            }
            return object;
        };

        /**
         * Converts this ServerToClientResponse to JSON.
         * @function toJSON
         * @memberof badukboardproto.ServerToClientResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ServerToClientResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ServerToClientResponse
         * @function getTypeUrl
         * @memberof badukboardproto.ServerToClientResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ServerToClientResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/badukboardproto.ServerToClientResponse";
        };

        return ServerToClientResponse;
    })();

    return badukboardproto;
})();

export { $root as default };
