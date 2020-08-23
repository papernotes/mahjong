type RangeType = {
  [id : string]: any[];
}
const RANGES : RangeType = {
  'wind': [0, 1, 2, 3],
  'dragon': [4, 5, 6],
  'character': [7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'],
  'bamboo': [0, 1, 2, 3, 4, 5, 6, 7, 8],
  'dot': [9, 'a', 'b', 'c', 'd', 'e', 'f', 0, 1]
}

class TileUnicode {
  static getDotRow(count : number) {
    if (count === 8 || count === 9) {
      return '2';
    }
    return '1';
  }

  static getBackTile() {
    return `\u{1f02b}`;
  }

  static getFlowerTile() {
    return `\u{1f025}`;
  }

  static getRow(type : string, count : number) {
    if (type === 'dot') {
      return TileUnicode.getDotRow(count);
    }
    if (type === 'wind' || type === 'dragon' || type === 'character') {
      return '0';
    }
    if (type === 'bamboo') {
      return '1';
    }
    return 2;
  }


  static getUnicodeString(count : number, type : string) {
    if (type === 'flower') {
      return TileUnicode.getFlowerTile();
    }

    let baseString : string = '1f0';
    const rowNumber = TileUnicode.getRow(type, count);
    const colNumber = RANGES[type][count-1]

    baseString = baseString + rowNumber + colNumber;

    return String.fromCodePoint(parseInt(baseString, 16));
  }
}

export default TileUnicode;