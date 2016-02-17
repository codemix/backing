/* @flow */

import path from "path";

import {Arena} from "./arena";
import {AggregateGarbageCollector} from "./gc";
import ArrayBufferArenaSource from "./arena-sources/array-buffer";
import MMapArenaSource from "./arena-sources/mmap";
import TypeRegistry from "type-registry";

import type {ArenaSource, ArenaSourceConfig} from "./arena-sources";


export type BackingConfig = {
  /**
   * The name for this collection of arenas, which will be used as a filename prefix.
   */
  name: string;

  /**
   * The type registry for the backing store.
   */
  registry?: TypeRegistry;

  /**
   * The size of each arena.
   */
  arenaSize: uint32;

  /**
   * The arena source creator or config.
   */
  arenaSource: ArenaSourceConfig | (backing: Backing) => ArenaSource;

};



const HEADER_ADDRESS = 296;
const VERSION_ADDRESS = HEADER_ADDRESS;
const GC_BASE_ADDRESS = VERSION_ADDRESS + 8;
const HEADER_CHECKSUM_ADDRESS = GC_BASE_ADDRESS + 16;
const HEADER_SIZE = (HEADER_CHECKSUM_ADDRESS + 8) - HEADER_ADDRESS;
const FIRST_ADDRESS = HEADER_ADDRESS + HEADER_SIZE;

export class Backing {

  name: string;
  registry: TypeRegistry;
  arenas: Arena[];
  arenaSize: uint32;
  arenaSource: ArenaSource;
  gc: AggregateGarbageCollector;
  isInitialized: boolean;
  MIN_ALLOCATION_SIZE: uint32;
  MAX_ALLOCATION_SIZE: uint32;


  constructor (options: BackingConfig) {
    trace: `Creating backing`;
    this.name = options.name;
    this.arenas = [];
    this.arenaSize = options.arenaSize;
    this.registry = options.registry instanceof TypeRegistry ? options.registry : new TypeRegistry(options.registry);
    this.isInitialized = false;
    this.MIN_ALLOCATION_SIZE = 16;
    this.MAX_ALLOCATION_SIZE = this.arenaSize - (FIRST_ADDRESS + 16);
    this.arenaSource = this.createArenaSource(options.arenaSource);
  }

  /**
   * Get the maximum address in the store.
   */
  get maxAddress (): float64 {
    return this.arenas.length * this.arenaSize;
  }

  /**
   * Initialize the backing store.
   */
  async init (): Promise<Backing> {
    trace: `Initializing backing: ${this.name}.`;
    if (this.isInitialized) {
      throw new Error('Backing cannot be initialized twice.');
    }

    await this.arenaSource.init();
    verifyHeader(this);
    this.gc = new AggregateGarbageCollector(this);

    this.isInitialized = true;

    trace: `Finished initializing backing.`;
    return this;
  }

  /**
   * Create the arena source for this backing store.
   */
  createArenaSource (config: ArenaSourceConfig|Function): ArenaSource {
    if (typeof config === 'function') {
      return config(this);
    }
    else if (config.type === 'mmap') {
      return new MMapArenaSource(this, config);
    }
    else {
      return new ArrayBufferArenaSource(this, config);
    }
  }

  /**
   * Compute the offset of the given address relative to its containing arena.
   */
  offsetFor (address: float64): uint32 {
    if (address > this.arenaSize) {
      return address % this.arenaSize;
    }
    else {
      return address;
    }
  }

  /**
   * Get the arena for the given address, or `undefined` if it does not exist.
   */
  arenaFor (address: float64): Arena {
    if (address < 0 || address > this.maxAddress) {
      throw new RangeError(`Cannot retreive arena at ${address}, address is out of bounds.`);
    }
    if (address < this.arenaSize) {
      return this.arenas[0];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0];
    }
  }

  /**
   * Read an int8 at the given address.
   */
  getInt8 (address: float64): int8 {
    if (address < this.arenaSize) {
      return this.arenas[0].int8Array[address];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].int8Array[(address % this.arenaSize)];
    }
  }

  /**
   * Write an int8 at the given address.
   */
  setInt8 (address: float64, value: int8): void {
    if (address < this.arenaSize) {
      this.arenas[0].int8Array[address] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].int8Array[(address % this.arenaSize)] = value;
    }
  }

  /**
   * Read a uint8 at the given address.
   */
  getUint8 (address: float64): uint8 {
    if (address < this.arenaSize) {
      return this.arenas[0].uint8Array[address];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].uint8Array[(address % this.arenaSize)];
    }
  }

  /**
   * Write a uint8 at the given address.
   */
  setUint8 (address: float64, value: uint8): void {
    if (address < this.arenaSize) {
      this.arenas[0].uint8Array[address] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].uint8Array[(address % this.arenaSize)] = value;
    }
  }

  /**
   * Read an int16 at the given address.
   */
  getInt16 (address: float64): int16 {
    if (address < this.arenaSize) {
      return this.arenas[0].int16Array[address >> 1];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].int16Array[(address % this.arenaSize) >> 1];
    }
  }

  /**
   * Write an int16 at the given address.
   */
  setInt16 (address: float64, value: int16): void {
    if (address < this.arenaSize) {
      this.arenas[0].int16Array[address >> 1] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].int16Array[(address % this.arenaSize) >> 1] = value;
    }
  }

  /**
   * Read a uint16 at the given address.
   */
  getUint16 (address: float64): uint16 {
    if (address < this.arenaSize) {
      return this.arenas[0].uint16Array[address >> 1];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].uint16Array[(address % this.arenaSize) >> 1];
    }
  }

  /**
   * Write a uint16 at the given address.
   */
  setUint16 (address: float64, value: uint16): void {
    if (address < this.arenaSize) {
      this.arenas[0].uint16Array[address >> 1] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].uint16Array[(address % this.arenaSize) >> 1] = value;
    }
  }

  /**
   * Read an int32 at the given address.
   */
  getInt32 (address: float64): int32 {
    if (address < this.arenaSize) {
      return this.arenas[0].int32Array[address >> 2];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].int32Array[(address % this.arenaSize) >> 2];
    }
  }

  /**
   * Write an int32 at the given address.
   */
  setInt32 (address: float64, value: int32): void {
    if (address < this.arenaSize) {
      this.arenas[0].int32Array[address >> 2] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].int32Array[(address % this.arenaSize) >> 2] = value;
    }
  }

  /**
   * Read a uint32 at the given address.
   */
  getUint32 (address: float64): uint32 {
    if (address < this.arenaSize) {
      return this.arenas[0].uint32Array[address >> 2];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].uint32Array[(address % this.arenaSize) >> 2];
    }
  }

  /**
   * Write a uint32 at the given address.
   */
  setUint32 (address: float64, value: uint32): void {
    if (address < this.arenaSize) {
      this.arenas[0].uint32Array[address >> 2] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].uint32Array[(address % this.arenaSize) >> 2] = value;
    }
  }

  /**
   * Read a float32 at the given address.
   */
  getFloat32 (address: float64): float32 {
    if (address < this.arenaSize) {
      return this.arenas[0].float32Array[address >> 2];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].float32Array[(address % this.arenaSize) >> 2];
    }
  }

  /**
   * Write a float32 at the given address.
   */
  setFloat32 (address: float64, value: float32): void {
    if (address < this.arenaSize) {
      this.arenas[0].float32Array[address >> 2] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].float32Array[(address % this.arenaSize) >> 2] = value;
    }
  }

  /**
   * Read a float64 at the given address.
   */
  getFloat64 (address: float64): float64 {
    if (address < this.arenaSize) {
      return this.arenas[0].float64Array[address >> 3];
    }
    else {
      return this.arenas[(address / this.arenaSize) >> 0].float64Array[(address % this.arenaSize) >> 3];
    }
  }

  /**
   * Write a float64 at the given address.
   */
  setFloat64 (address: float64, value: float64): void {
    if (address < this.arenaSize) {
      this.arenas[0].float64Array[address >> 3] = value;
    }
    else {
      this.arenas[(address / this.arenaSize) >> 0].float64Array[(address % this.arenaSize) >> 3] = value;
    }
  }

  /**
   * Align the given value to 8 bytes.
   */
  align (value: float64): float64 {
    return (value + 7) & ~7;
  }

  /**
   * Allocate the given number of bytes from the first arena which has enough space.
   * If no arenas have the capacity, a new arena will be created.
   */
  alloc (numberOfBytes: uint32): float64 {
    trace: `Allocating ${numberOfBytes} bytes.`;

    if (numberOfBytes < this.MIN_ALLOCATION_SIZE) {
      numberOfBytes = this.MIN_ALLOCATION_SIZE;
    }
    else if (numberOfBytes > this.MAX_ALLOCATION_SIZE) {
      throw new RangeError(`Cannot allocate ${numberOfBytes} bytes.`);
    }
    else {
      numberOfBytes = this.align(numberOfBytes);
    }

    const arenas: Arena[] = this.arenas;

    for (let i = 0; i < arenas.length; i++) {
      const offset: uint32 = arenas[i].alloc(numberOfBytes);
      if (offset !== 0) {
        return arenas[i].startAddress + offset;
      }
    }

    const arena: Arena = this.arenaSource.createSync();

    const offset: uint32 = arena.alloc(numberOfBytes);
    if (offset === 0) {
      throw new Error(`Could not allocate ${numberOfBytes} within new arena ${arena.sequenceNumber}`);
    }
    return arena.startAddress + offset;
  }

  /**
   * Allocate and clear the given number of bytes and return the address.
   */
  calloc (numberOfBytes: uint32): float64 {
    const address: float64 = this.alloc(numberOfBytes);
    if (address === 0) {
      return 0;
    }
    const arena: Arena = this.arenaFor(address);
    const uint32Array: Uint32Array = arena.uint32Array;
    const offset = (address - arena.startAddress) >> 2;
    const max = Math.ceil(numberOfBytes >> 2);
    for (let i = 0; i < max; i++) {
      uint32Array[offset + i] = 0;
    }
    return address;
  }

  /**
   * Return the size of the block at the given address.
   */
  sizeOf (address: float64): uint32 {
    const arena: ?Arena = this.arenaFor(address);
    if (!arena) {
      return 0;
    }
    const offset: uint32 = this.offsetFor(address);
    return arena.allocator.sizeOf(offset);
  }

  /**
   * Free the block at the given address and return the number of bytes which were freed.
   */
  free (address: float64): uint32 {
    trace: `Freeing address: ${address}.`;

    const arena: ?Arena = this.arenaFor(address);
    if (!arena) {
      throw new Error(`Cannot free address ${address}, no such arena.`);
    }

    const offset: uint32 = this.offsetFor(address);

    return arena.free(offset);
  }

  /**
   * Copy the given number of bytes from the source address to the given target address.
   */
  copy (targetAddress: float64, sourceAddress: float64, numberOfBytes: uint32): uint32 {
    const targetOffset: uint32 = this.offsetFor(targetAddress);
    const targetArray: Uint8Array = this.arenaFor(targetAddress).uint8Array;

    const sourceOffset: uint32 = this.offsetFor(sourceAddress);
    const sourceArray: Uint8Array = this.arenaFor(sourceAddress).uint8Array;

    for (let i = 0; i < numberOfBytes; i++) {
      targetArray[targetOffset + i] = sourceArray[sourceOffset + i];
    }

    return numberOfBytes;
  }
}


function verifyHeader (backing: Backing) {
  const arena = backing.arenaFor(HEADER_ADDRESS);
  if (
    backing.getUint32(HEADER_ADDRESS) !== HEADER_ADDRESS ||
    backing.getUint32(HEADER_CHECKSUM_ADDRESS) !== HEADER_CHECKSUM_ADDRESS
  ) {
    const address = backing.calloc(HEADER_SIZE);
    if (address !== HEADER_ADDRESS) {
      throw new TypeError(`Allocator returned an invalid backing header address.`);
    }
    backing.setUint32(HEADER_ADDRESS, HEADER_ADDRESS);
    backing.setUint32(HEADER_CHECKSUM_ADDRESS, HEADER_CHECKSUM_ADDRESS);
  }
}

