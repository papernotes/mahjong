type RangeType = {
  [id: string]: number[]
}

const RANGES : RangeType = {
  'dot': [0, 35],
  'bamboo': [36, 71],
  'character': [72, 107],
  'wind': [108, 123],
  'dragon': [124, 135],
  'flower': [136, 143]
}

class TileUtils {
  static getRangeMin(type: string) : number {
    return RANGES[type][0];
  }

  static getRangeMax(type: string) : number {
    return RANGES[type][1];
  }

  static getTileName(tileId: number) : string {
    for (const key of Object.keys(RANGES)) {
      if ((TileUtils.getRangeMin(key) <= tileId) && (tileId <= TileUtils.getRangeMax(key))) {
        return TileUtils.getTileNumber(key, tileId).toString() + " - " + key;
      }
    }
    return '';
  }

  static getTileNumber(type: string, tileId: number) : number {
    const min = TileUtils.getRangeMin(type);
    const range = tileId - min;

    switch(type) {
      case 'wind':
        return (range % 4) + 1;
      case 'dragon':
        return (range % 3) + 1;
      case 'flower':
        return (range % 8) + 1;
      default:
        return (range % 9) + 1;
    }
  }
}

export default TileUtils;