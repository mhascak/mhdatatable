/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 * 
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, font) {
  // re-use canvas object for better performance
  var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'))
  var context = canvas.getContext('2d')
  context.font = font || 'bold 2rem arial'
  var metrics = context.measureText(text)
  return metrics.width + 20
}

/**
 * Find the largest font size (in pixels) that allows the string to fit in the given width.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold ?px verdana") -- note the use of ? in place of the font size.
 * @param {width} the width in pixels the string must fit in
 * @param {minFontPx} the smallest acceptable font size in pixels
 * @param {maxFontPx} the largest acceptable font size in pixels
**/
function getTextSizeForWidth(text, font, width, minFontPx, maxFontPx) {
  for (; ;) {
    var s = font.replace('?', maxFontPx)
    var w = getTextWidth(text, s)
    if (w <= width) {
      return maxFontPx
    }

    var g = (minFontPx + maxFontPx) / 2

    if (Math.round(g) == Math.round(minFontPx) || Math.round(g) == Math.round(maxFontPx)) {
      return g
    }

    s = font.replace('?', g)
    w = getTextWidth(text, s)
    if (w >= width) {
      maxFontPx = g
    } else {
      minFontPx = g
    }
  }
}

export default {
  getTextWidth,
  getTextSizeForWidth
}
