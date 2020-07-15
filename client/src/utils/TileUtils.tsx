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
    // Dots work around
    if (min === 0) {
      return (tileId % 9) + 1;
    }
    return (tileId % min) - (tileId - min) + 1;
  }
}

export default TileUtils;