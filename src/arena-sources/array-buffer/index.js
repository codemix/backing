/* @flow */

import {Arena} from "../../arena";

import type {Backing} from "../../";
import type {ArenaSourceConfig, CallbackList} from ".."

/**
 * Arena Source is responsible for locating, loading and creating arenas.
 */
export default class ArrayBufferArenaSource {
  /**
   * The backing store the arena source is for.
   */
  backing: Backing;

  /**
   * The name for this collection of arenas, which will be used as a name prefix.
   */
  name: string;

  /**
   * The arenas which are being managed.
   */
  arenas: Arena[];

  /**
   * The size of each arena.
   */
  arenaSize: uint32;

  /**
   * The number of arenas to preallocate.
   */
  preallocateArenas: uint32;

  /**
   * The array buffers for the source.
   */
  buffers: ArrayBuffer[];

  /**
   * Keeps track of the number of arenas allocated
   */
  internalSequence: uint32;

  /**
   * The number of garbage collection cycles an object with no references should live for.
   */
  lifetime: int32;

  /**
   * The dictionary of callbacks which will be invoked when type-tagged blocks are freed.
   */
  gcCallbacks: CallbackList;

  /**
   * Initialize the arena source.
   */
  constructor (backing: Backing, config: ArenaSourceConfig) {
    if (typeof config.dirname === 'string' && config.dirname.length) {
      throw new TypeError('ArrayBufferArenaSource does not support "dirname".');
    }
    this.backing = backing;
    this.name = backing.name;
    this.arenas = backing.arenas;
    this.arenaSize = backing.arenaSize;
    this.buffers = config.buffers || [];
    this.preallocateArenas = config.preallocateArenas || 1;
    this.lifetime = config.lifetime;
    this.internalSequence = 0;
    this.gcCallbacks = Object.create(null);
  }

  /**
   * Initialize the arena source and load any existing arenas in order.
   */
  async init (): Promise<ArrayBufferArenaSource> {

    trace: `Loading existing arenas from ${this.buffers.length} buffers(s).`;

    const backing = this.backing;

    for (const type of backing.registry) {
      if (typeof type.cleanup === 'function') {
        this.gcCallbacks[type.id] = (address: float64): void => {
          type.cleanup(backing, address);
        };
      }
    }

    backing.registry.on('add', type => {
      if (typeof type.cleanup === 'function') {
        this.gcCallbacks[type.id] = (address: float64): void => {
          type.cleanup(backing, address);
        };
      }
    });

    for (let buffer of this.buffers) {
      this.arenas.push(await this.load(buffer));
    }

    trace: `Loaded ${this.arenas.length} arena(s).`;

    if (this.arenas.length === 0) {
      await this.create();
    }

    trace: `Initialization complete.`;
    return this;
  }

  /**
   * Load an arena from the given array buffer.
   */
  async load (buffer: ArrayBuffer): Promise<Arena> {

    const counter = this.internalSequence;
    this.internalSequence++;

    trace: `Loading an arena from an array buffer of length ${buffer.byteLength} into slot ${counter}`;

    return new Arena({
      name: `${this.name}_${counter}`,
      sequenceNumber: counter,
      buffer: buffer,
      backing: this.backing,
      gc: {
        callbacks: this.gcCallbacks,
        lifetime: this.lifetime
      }
    });
  }

  /**
   * Synchronously load an arena from the given array buffer.
   */
  loadSync (buffer: ArrayBuffer): Arena {

    const counter = this.internalSequence;
    this.internalSequence++;

    trace: `Loading an arena from an array buffer of length ${buffer.byteLength} into slot ${counter}`;

    return new Arena({
      name: `${this.name}_${counter}`,
      sequenceNumber: counter,
      buffer: buffer,
      backing: this.backing,
      gc: {
        callbacks: this.gcCallbacks,
        lifetime: this.lifetime
      }
    });
  }

  /**
   * Create a new arena and append it to the list.
   */
  async create (): Promise<Arena> {
    trace: `Creating ${this.preallocateArenas} arena(s) of ${this.arenaSize} bytes.`;

    const startIndex: number = this.arenas.length;
    for (let i = 0; i < this.preallocateArenas; i++) {
      const buffer: ArrayBuffer = new ArrayBuffer(this.arenaSize);
      this.buffers.push(buffer);
      trace: `Created arena: ${buffer.byteLength} at slot ${this.internalSequence}.`;
      this.arenas.push(this.loadSync(buffer));
    }
    trace: `Created ${this.arenas.length - startIndex} arena(s).`;
    return this.arenas[startIndex];
  }

  /**
   * Synchronously create a new arena and append it to the list.
   */
  createSync (): Arena {
    trace: `Creating ${this.preallocateArenas} arena(s) of ${this.arenaSize} bytes.`;

    const startIndex: number = this.arenas.length;
    for (let i = 0; i < this.preallocateArenas; i++) {
      const buffer: ArrayBuffer = new ArrayBuffer(this.arenaSize);
      this.buffers.push(buffer);
      trace: `Created arena: ${buffer.byteLength} at slot ${this.internalSequence}.`;
      this.arenas.push(this.loadSync(buffer));
    }
    trace: `Created ${this.arenas.length - startIndex} arena(s).`;
    return this.arenas[startIndex];
  }
}