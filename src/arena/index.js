/* @flow */

import Allocator from "malloc";
import GarbageCollector from "garbage-collector";

import type {CallbackList} from "../arena-sources";


export type ArenaConfig = {
  /**
   * The fixed sequence number for the arena.
   */
  sequenceNumber: uint32;

  /**
   * The name or unique id of the arena.
   */
  name: string;

  /**
   * The buffer for the arena.
   */
  buffer: ArrayBuffer | Buffer;

  /**
   * The byte offset for the buffer.
   */
  byteOffset?: uint32;

  /**
   * The garbage collector configuration.
   */
  gc: {
    lifetime: int32;
    callbacks: CallbackList;
  };
};


/**
 * Arenas represent the large, contiguous backing buffers which get persisted to disk.
 * Each arena can contain many blocks, but no block may be larger than the arena size.
 */
export class Arena {

  name: string;
  sequenceNumber: uint32;
  buffer: ArrayBuffer;
  byteOffset: uint32;
  byteLength: uint32;

  allocator: Allocator;
  startAddress: float64;
  gc: GarbageCollector;

  dataView: DataView;
  int8Array: Int8Array;
  uint8Array: Uint8Array;
  int16Array: Int16Array;
  uint16Array: Uint16Array;
  int32Array: Int32Array;
  uint32Array: Uint32Array;
  float32Array: Float32Array;
  float64Array: Float64Array;
  doubleArray: Float64Array;

  /**
   * Initialize the arena.
   */
  constructor (config: ArenaConfig) {
    this.name = config.name;
    this.sequenceNumber = config.sequenceNumber;
    if (config.buffer instanceof Buffer) {
      const buffer: Buffer = config.buffer;
      this.buffer = buffer.buffer;
      this.byteOffset = buffer.byteOffset;
      this.byteLength = buffer.length;
    }
    else if (config.buffer instanceof ArrayBuffer) {
      const buffer: ArrayBuffer = config.buffer;
      this.buffer = buffer;
      this.byteOffset = config.byteOffset || 0;
      this.byteLength = buffer.byteLength - this.byteOffset;
    }
    else {
      throw new TypeError(`Arena buffer must be an instance of Buffer or ArrayBuffer.`);
    }
    this.allocator = new Allocator(this.buffer, this.byteOffset);

    this.startAddress = this.sequenceNumber * this.byteLength;
    this.gc = new GarbageCollector(this.allocator, {
      lifetime: config.gc.lifetime,
      callbacks: config.gc.callbacks,
      callbackOffset: this.startAddress
    });
    this.dataView = new DataView(this.buffer, this.byteOffset);

    // create array types.
    this.int8Array = new Int8Array(this.buffer, this.byteOffset);
    this.uint8Array = new Uint8Array(this.buffer, this.byteOffset);
    this.int16Array = new Int16Array(this.buffer, this.byteOffset);
    this.uint16Array = new Uint16Array(this.buffer, this.byteOffset);
    this.int32Array = new Int32Array(this.buffer, this.byteOffset);
    this.uint32Array = new Uint32Array(this.buffer, this.byteOffset);
    this.float32Array = new Float32Array(this.buffer, this.byteOffset);
    this.float64Array = new Float64Array(this.buffer, this.byteOffset);
    this.doubleArray = new Float64Array(this.buffer, this.byteOffset);

  }

  /**
   * Allocate the given number of bytes from this arena and return the relative start offset,
   * or 0 if there is not enough space in the arena.
   */
  alloc (numberOfBytes: uint32): uint32 {
    trace: `Attempting to allocate ${numberOfBytes} bytes from arena ${this.sequenceNumber} (${this.startAddress}).`;
    return this.allocator.alloc(numberOfBytes);
  }

  /**
   * Allocate and clear the given number of bytes from this arena and return the relative start offset,
   * or 0 if there is not enough space in the arena.
   */
  calloc (numberOfBytes: uint32): uint32 {
    trace: `Attempting to allocate and clear ${numberOfBytes} bytes from arena ${this.sequenceNumber} (${this.startAddress}).`;
    return this.allocator.calloc(numberOfBytes);
  }

  /**
   * Free a number of bytes from the given offset.
   */
  free (offset: uint32): uint32 {
    trace: `Freeing offset ${offset} from arena ${this.sequenceNumber}.`;
    return this.allocator.free(offset);
  }

  /**
   * Determine the size of the block at the given offset.
   */
  sizeOf (offset: uint32): uint32 {
    trace: `Reading size of offset ${offset} from arena ${this.sequenceNumber}.`;
    return this.allocator.sizeOf(offset);
  }
}
