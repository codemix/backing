/** @flow */

/**
 * Utility functions for dealing with UTF-8.
 * Mostly adapted from https://github.com/feross/buffer/blob/master/index.js
 */

/**
 * Return the number of utf8 bytes for a given input string.
 */
export function byteLength (input: string): number {
  const length = input.length;
  let result = 0;
  let codePoint;
  let leadSurrogate = null;

  for (let i = 0; i < length; i++) {
    codePoint = input.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          result += 3;
          continue;
        }
        else if (i + 1 === length) {
          // unpaired lead
          result += 3;
          continue;
        }

        // valid lead
        leadSurrogate = codePoint;

        continue;
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        result += 3;
        leadSurrogate = codePoint;
        continue;
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    }
    else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      result += 3;
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      result++;
    }
    else if (codePoint < 0x800) {
      result += 2;
    }
    else if (codePoint < 0x10000) {
      result += 3;
    }
    else if (codePoint < 0x110000) {
      result += 4;
    }
    else {
      throw new Error(`Invalid utf8 code point: ${codePoint}.`);
    }
  }

  return result;
}

/**
 * Read a utf8 string from the given `Uint8Array` at the given start offset.
 */
export function read (uint8Array: Uint8Array, start: number, end: number = uint8Array.length): string {
  end = Math.min(uint8Array.length, end);
  const res = new Array(Math.floor((end - start) / 4));
  let index = 0;
  let i = start;
  while (i < end) {
    const firstByte = uint8Array[i];
    let codePoint = null;
    let bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break;
        case 2:
          {
            const secondByte = uint8Array[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              const tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
          }
          break;
        case 3:
          {
            const secondByte = uint8Array[i + 1];
            const thirdByte = uint8Array[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              const tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
          }
          break;
        case 4:
          {
            const secondByte = uint8Array[i + 1];
            const thirdByte = uint8Array[i + 2];
            const fourthByte = uint8Array[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              const tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res[index++] = (codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res[index++] = (codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res);
}


// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  const length = codePoints.length;
  if (length <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode(...codePoints);
  }

  // Decode in chunks to avoid "call stack size exceeded".
  const res = [];
  let i = 0;
  while (i < length) {
    res.push(String.fromCharCode(...codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)));
  }
  return res.join('');
}

/**
 * Write the given utf8 compatible string to the given Uint8Array.
 */
export function write (uint8Array: Uint8Array, offset: number, input: string, units: number = uint8Array.length - offset): number {
  const length = input.length;
  let codePoint;
  let leadSurrogate = null;

  for (let i = 0; i < length; i++) {
    codePoint = input.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) {
            uint8Array[offset++] = 0xEF;
            uint8Array[offset++] = 0xBF;
            uint8Array[offset++] = 0xBD;
          }
          continue;
        }
        else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) {
            uint8Array[offset++] = 0xEF;
            uint8Array[offset++] = 0xBF;
            uint8Array[offset++] = 0xBD;
          }
          continue;
        }

        // valid lead
        leadSurrogate = codePoint;

        continue;
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) {
          uint8Array[offset++] = 0xEF;
          uint8Array[offset++] = 0xBF;
          uint8Array[offset++] = 0xBD;
        }
        leadSurrogate = codePoint;
        continue;
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    }
    else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) {
        uint8Array[offset++] = 0xEF;
        uint8Array[offset++] = 0xBF;
        uint8Array[offset++] = 0xBD;
      }
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) {
        break;
      }
      uint8Array[offset++] = codePoint;
    }
    else if (codePoint < 0x800) {
      if ((units -= 2) < 0) {
        break;
      }
      uint8Array[offset++] = codePoint >> 0x6 | 0xC0;
      uint8Array[offset++] = codePoint & 0x3F | 0x80;
    }
    else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) {
        break;
      }
      uint8Array[offset++] = codePoint >> 0xC | 0xE0;
      uint8Array[offset++] = codePoint >> 0x6 & 0x3F | 0x80;
      uint8Array[offset++] = codePoint & 0x3F | 0x80;
    }
    else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) {
        break;
      }
      uint8Array[offset++] = codePoint >> 0x12 | 0xF0;
      uint8Array[offset++] = codePoint >> 0xC & 0x3F | 0x80;
      uint8Array[offset++] = codePoint >> 0x6 & 0x3F | 0x80;
      uint8Array[offset++] = codePoint & 0x3F | 0x80;
    }
    else {
      throw new Error(`Invalid utf8 code point: ${codePoint}.`);
    }
  }

  return offset;
}