/* @flow */

import mmap from "mmap.js";
import Bluebird from "bluebird";
import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";

import {Arena} from "../../arena";

import type {Backing} from "../../";
import type {ArenaSourceConfig, CallbackList} from "../"

Bluebird.promisifyAll(fs);
const mkdirpAsync = Bluebird.promisify(mkdirp);

/**
 * Arena Source is responsible for locating, loading and creating arenas.
 */
export default class MMapArenaSource {
  /**
   * The backing store the arena source is for.
   */
  backing: Backing;

  /**
   * The name for this collection of arenas, which will be used as a filename prefix.
   * Defaults to the basename of the dirname if not specified.
   */
  name: string;

  /**
   * The name of the directory containing the arenas.
   */
  dirname: string;

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

  /**
   * Initialize the arena source.
   */
  constructor (backing: Backing, config: ArenaSourceConfig) {
    this.backing = backing;
    this.name = backing.name;
    this.arenas = backing.arenas;
    this.arenaSize = backing.arenaSize;
    const dirname = config.dirname;
    if (typeof dirname !== 'string' || !dirname.length) {
      throw new TypeError('Directory name must be specified.');
    }
    this.dirname = dirname;
    this.preallocateArenas = config.preallocateArenas || 1;
    this.lifetime = config.lifetime;
    this.gcCallbacks = Object.create(null);
  }

  /**
   * Initialize the arena source and load any existing arenas in order.
   */
  async init (): Promise<MMapArenaSource> {
    trace: `Ensuring that the directory exists.`;
    await mkdirpAsync(this.dirname);

    const filenames: string[] = await this.findFilenames();

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

    trace: `Loading existing arenas from ${filenames.length} file(s).`;
    this.arenas.push(...(await Bluebird.map(filenames, filename => this.load(filename))));

    trace: `Loaded ${this.arenas.length} arena(s).`;

    if (this.arenas.length === 0) {
      await this.create();
    }

    trace: `Initialization complete.`;
    return this;
  }

  /**
   * Load an arena from the given filename.
   */
  async load (filename: string): Promise<Arena> {
    trace: `Loading an arena from: ${path.basename(filename)}`;

    const fd: number = await fs.openAsync(filename, 'r+');
    const stats: fs.Stats = await fs.fstatAsync(fd);
    const buffer: Buffer = this.mmap(fd, stats.size);
    await fs.closeAsync(fd);
    const sequenceNumber = sequenceNumberForFilename(filename);

    return new Arena({
      name: filename,
      sequenceNumber: sequenceNumberForFilename(filename),
      buffer: buffer,
      backing: this.backing,
      gc: {
        callbacks: this.gcCallbacks,
        lifetime: this.lifetime
      }
    });
  }

  /**
   * Synchronously load an arena from the given filename.
   */
  loadSync (filename: string): Arena {
    trace: `Loading an arena from: ${path.basename(filename)}`;

    const fd: number = fs.openSync(filename, 'r+');
    const stats: fs.Stats = fs.fstatSync(fd);
    const buffer: Buffer = this.mmap(fd, stats.size);
    fs.closeSync(fd);
    const sequenceNumber = sequenceNumberForFilename(filename);

    return new Arena({
      name: filename,
      sequenceNumber: sequenceNumber,
      buffer: buffer,
      backing: this.backing,
      gc: {
        callbacks: this.gcCallbacks,
        lifetime: this.lifetime
      }
    });
  }

  /**
   * Find all the arena filenames in the directory and return them in order of sequence number.
   */
  async findFilenames (): Promise<string[]> {
    return (await fs.readdirAsync(this.dirname))
        .filter(item => new RegExp(`${this.name}_(\\d+)\\.arena$`).test(item))
        .map(filename => path.join(this.dirname, filename))
        .sort(byFileSequenceNumber);
  }


  /**
   * Create a new arena and append it to the list.
   */
  async create (): Promise<Arena> {
    trace: `Creating ${this.preallocateArenas} arena(s) of ${this.arenaSize} bytes.`;

    const startIndex: number = this.arenas.length;
    const arenas: Arena[] = [];
    for (let i = 0; i < this.preallocateArenas; i++) {
      const filename: string = path.join(this.dirname, `${this.name}_${startIndex + i}.arena`);
      await this.createEmptyArena(filename);
      trace: `Created arena: ${path.basename(filename)}.`;
      arenas.push(await this.load(filename));
    }
    this.arenas.push(...arenas);
    trace: `Created ${arenas.length} arena(s).`;
    return arenas[0];
  }

  /**
   * Synchronously create a new arena and append it to the list.
   */
  createSync (): Arena {
    trace: `Creating ${this.preallocateArenas} arena(s) of ${this.arenaSize} bytes.`;

    const startIndex: number = this.arenas.length;
    const arenas: Arena[] = [];
    for (let i = 0; i < this.preallocateArenas; i++) {
      const filename: string = path.join(this.dirname, `${this.name}_${startIndex + i}.arena`);
      this.createEmptyArenaSync(filename);
      trace: `Created arena: ${path.basename(filename)}.`;
      arenas.push(this.loadSync(filename));
    }
    this.arenas.push(...arenas);
    trace: `Created ${arenas.length} arena(s).`;

    return arenas[0];
  }

  /**
   * Create an empty arena.
   */
  async createEmptyArena (filename: string): Promise<uint32> {
    trace: `Creating empty arena: ${path.basename(filename)}`;
    const fd = await fs.openAsync(filename, 'w+');
    await fs.ftruncateAsync(fd, this.arenaSize);
    await fs.closeAsync(fd);
    return this.arenaSize;
  }

  /**
   * Synchronously create an empty arena.
   */
  createEmptyArenaSync (filename: string) {
    trace: `Creating empty arena: ${path.basename(filename)}`;
    const fd = fs.openSync(filename, 'w+');
    fs.ftruncateSync(fd, this.arenaSize);
    fs.closeSync(fd);
  }

  /**
   * MMap a given file descriptor and return the buffer.
   */
  mmap (fd: uint32, size: uint32): Buffer {
    trace: `Memory mapping ${size} bytes from file #${fd}.`;
    return mmap.alloc(
      size,
      mmap.PROT_READ | mmap.PROT_WRITE,
      mmap.MAP_SHARED,
      fd,
      0
    );
  }

}


/**
 * Get the arena sequence number for the given filename.
 */
function sequenceNumberForFilename (filename: string): uint32 {
  const matches = /_(\d+)\.arena/.exec(filename);
  if (matches === null) {
    throw new Error(`Invalid arena filename.`);
  }
  return +matches[1];
}

/**
 * Compare two filenames based on their sequence number.
 */
function byFileSequenceNumber (a: string, b: string): number {
  const aSeq: number = sequenceNumberForFilename(a);
  const bSeq: number = sequenceNumberForFilename(b);
  if (aSeq > bSeq) {
    return 1;
  }
  else if (aSeq < bSeq) {
    return -1;
  }
  else {
    return 0;
  }
}