/* @flow */

import {Arena} from "../arena";
import type {Type} from "type-registry";
import type {Backing} from "../";

export class AggregateGarbageCollector {

  backing: Backing;

  /**
   * The index of the last arena which received an incremental garbage collection cycle.
   */
  lastCycledIndex: int32;

  /**
   * Initialize the garbage collector.
   */
  constructor (backing: Backing) {
    this.backing = backing;
    this.lastCycledIndex = -1;
  }


  /**
   * Align the given value to 8 bytes.
   */
  align (value: int32): int32 {
    return (value + 7) & ~7;
  }

  /**
   * Allocate the given number of bytes from the first arena which has enough space.
   * If no arenas have the capacity, a new arena will be created.
   */
  alloc (numberOfBytes: uint32, typeId: uint32 = 0, refCount: uint32 = 0): float64 {
    trace: `Allocating ${numberOfBytes} bytes.`;
    const backing = this.backing;

    if (numberOfBytes < backing.MIN_ALLOCATION_SIZE) {
      numberOfBytes = backing.MIN_ALLOCATION_SIZE;
    }
    else if (numberOfBytes > backing.MAX_ALLOCATION_SIZE) {
      throw new RangeError(`Cannot allocate ${numberOfBytes} bytes.`);
    }
    else {
      numberOfBytes = this.align(numberOfBytes);
    }

    const arenas: Arena[] = backing.arenas;

    for (let i = 0; i < arenas.length; i++) {
      const offset: uint32 = arenas[i].gc.alloc(numberOfBytes, typeId, refCount);
      if (offset !== 0) {
        return arenas[i].startAddress + offset;
      }
    }

    const arena: Arena = backing.arenaSource.createSync();

    const offset: uint32 = arena.gc.alloc(numberOfBytes);
    /* istanbul ignore if  */
    if (offset === 0) {
      throw new Error(`Could not allocate ${numberOfBytes} within new arena ${arena.sequenceNumber}`);
    }
    return arena.startAddress + offset;
  }

  /**
   * Allocate and clear the given number of bytes and return the address.
   */
  calloc (numberOfBytes: uint32, typeId: uint32 = 0, refCount: uint32 = 0): float64 {
    trace: `Allocating and clearing ${numberOfBytes} bytes.`;
    const backing = this.backing;

    if (numberOfBytes < backing.MIN_ALLOCATION_SIZE) {
      numberOfBytes = backing.MIN_ALLOCATION_SIZE;
    }
    else if (numberOfBytes > backing.MAX_ALLOCATION_SIZE) {
      throw new RangeError(`Cannot allocate ${numberOfBytes} bytes.`);
    }
    else {
      numberOfBytes = this.align(numberOfBytes);
    }

    const arenas: Arena[] = backing.arenas;

    for (let i = 0; i < arenas.length; i++) {
      const offset: uint32 = arenas[i].gc.calloc(numberOfBytes, typeId, refCount);
      if (offset !== 0) {
        return arenas[i].startAddress + offset;
      }
    }

    const arena: Arena = backing.arenaSource.createSync();

    const offset: uint32 = arena.gc.calloc(numberOfBytes);
    /* istanbul ignore if */
    if (offset === 0) {
      throw new Error(`Could not allocate ${numberOfBytes} within new arena ${arena.sequenceNumber}.`);
    }
    return arena.startAddress + offset;
  }

  /**
   * Return the reference count of the block at the given address.
   */
  refCount (address: float64): uint32 {
    const backing = this.backing;

    const arena: Arena = backing.arenaFor(address);
    const offset: uint32 = backing.offsetFor(address);
    return arena.gc.refCount(offset);
  }


  /**
   * Return the size of the block at the given address.
   */
  sizeOf (address: float64): uint32 {
    const backing = this.backing;

    const arena: Arena = backing.arenaFor(address);
    const offset: uint32 = backing.offsetFor(address);
    return arena.gc.sizeOf(offset);
  }

  /**
   * Returns the type of the block at the given address.
   */
  typeOf (address: float64): ?Type {
    const backing = this.backing;

    const arena: Arena = backing.arenaFor(address);
    const offset: uint32 = backing.offsetFor(address);
    const typeId = arena.gc.typeOf(offset);
    if (typeId === 0) {
      return undefined;
    }
    else {
      return backing.registry.I[typeId];
    }
  }

  /**
   * Increment the reference count at the given address.
   */
  ref (address: float64): uint32 {
    const backing = this.backing;

    const arena: Arena = backing.arenaFor(address);
    const offset: uint32 = backing.offsetFor(address);
    return arena.gc.ref(offset);
  }

  /**
   * Decrement the reference count at the given address.
   */
  unref (address: float64): uint32 {
    const backing = this.backing;

    const arena: Arena = backing.arenaFor(address);
    const offset: uint32 = backing.offsetFor(address);
    return arena.gc.unref(offset);
  }

  /**
   * Free the block at the given address (assuming its reference count is zero)
   * and return the number of bytes which were freed.
   */
  free (address: float64): uint32 {
    trace: `Freeing address: ${address}.`;
    const backing = this.backing;

    const arena: Arena = backing.arenaFor(address);
    const offset: uint32 = backing.offsetFor(address);

    return arena.gc.free(offset);
  }

  /**
   * Perform a full garbage collection cycle across all arenas, returning
   * the total number of bytes which were freed.
   *
   * Note: This is a blocking operation and can take a long time - GC rarely.
   */
  cycle (): float64 {
    const backing = this.backing;
    const arenas = backing.arenas;
    let total = 0;
    for (let i = 0 ; i < arenas.length; i++) {
      total += arenas[i].gc.cycle();
    }
    this.lastCycledIndex = arenas.length - 1;
    return total;
  }

  /**
   * Perform an incremental garbage collection cycle across a single arena, returning
   * the total number of bytes which were freed.
   *
   * Note: This is a blocking operation and can take a long time - GC rarely.
   */
  incremental (): float64 {
    const backing = this.backing;
    const arenas = backing.arenas;
    this.lastCycledIndex++;
    if (this.lastCycledIndex >= arenas.length) {
      this.lastCycledIndex = 0;
    }
    return arenas[this.lastCycledIndex].gc.cycle();
  }

  /**
   * Inspect all of the garbage collectors.
   */
  inspect (): Object[] {
    return this.backing.arenas.map(arena => arena.gc.inspect());
  }
}