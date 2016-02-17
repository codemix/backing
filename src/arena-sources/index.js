/* @flow */

import ArrayBufferArenaSource from "./array-buffer";
import MMapArenaSource from "./mmap";

export {
  ArrayBufferArenaSource,
  MMapArenaSource
}

import type {Arena} from "../arena";

import type {Backing} from "../";


export type ArenaSourceConfig = {

  /**
   * The arena source type.
   */
  type?: "mmap"|"array-buffer"|string;

  /**
   * The name of the directory containing the arenas.
   */
  dirname?: string;

  /**
   * The number of arenas to preallocate.
   */
  preallocateArenas?: uint32;

  /**
   * The number of garbage collection cycles an object with no references should live for.
   */
  lifetime: int32;
};


export type Callback = (address: float64) => void;

export type CallbackList = {
  [type: uint32]: Callback;
};

export type ArenaSource = {
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
   * The number of garbage collection cycles an object with no references should live for.
   */
  lifetime: int32;

  /**
   * The dictionary of callbacks which will be invoked when type-tagged blocks are freed.
   */
  gcCallbacks: CallbackList;

  constructor (backing: Backing, config: ArenaSourceConfig): void;
  init (): Promise<any>;
  create (): Promise<Arena>;
  createSync (): Arena;
};