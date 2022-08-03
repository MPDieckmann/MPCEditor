class MPColor {
  static #regex_hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
  static #regex_hexa = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
  static #regex_short_hex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
  static #regex_short_hexa = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i;
  static #regex_rgb = /^rgb\(\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*\)$/i;
  static #regex_rgba = /^rgba\(\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)[,\/]\s*([0-9]+(?:\.[0-9]+))\s*%?\s*\)$/i;
  static #regex_hsl = /^hsl\(\s*(-?[0-9]+(?:\.[0-9]+))\s*,?\s*(-?[0-9]+(?:\.[0-9]+))\s*%\s*,?\s*(-?[0-9]+(?:\.[0-9]+))\s*%\s*\)$/i;
  static #regex_hsla = /^hsla\(\s*(-?[0-9]+(?:\.[0-9]+))\s*,?\s*(-?[0-9]+(?:\.[0-9]+))\s*,?\s*(-?[0-9]+(?:\.[0-9]+))[,\/]\s*([0-9]+(?:\.[0-9]+))\s*%?\s*\)$/i;
  #red: number = 0;
  #green: number = 0;
  #blue: number = 0;
  #hue: number = 0;
  #lightness_saturation: number = 0;
  #lightness: number = 0;
  #value: number = 0;
  #value_saturation: number = 0;
  #intensity: number = 0;
  #intensity_saturation: number = 0;
  #alpha: number = 0;
  #maximum: number = 0;
  #minimum: number = 0;
  #chroma: number = 0;

  static isHEX(input: string) {
    return this.#regex_hex.test(input) || this.#regex_hexa.test(input) || this.#regex_short_hex.test(input) || this.#regex_short_hexa.test(input);
  }
  static isHEXA(input: string) {
    return this.#regex_hexa.test(input) || this.#regex_short_hexa.test(input);
  }
  static isShortHEX(input: string) {
    return this.#regex_short_hex.test(input) || this.#regex_short_hexa.test(input);
  }
  static isShortHEXA(input: string) {
    return this.#regex_short_hexa.test(input);
  }
  static isRGB(input: string) {
    return this.#regex_rgb.test(input);
  }
  static isRGBA(input: string) {
    return this.#regex_rgba.test(input);
  }
  static isHSL(input: string) {
    return this.#regex_hsl.test(input);
  }
  static isHSLA(input: string) {
    return this.#regex_hsla.test(input);
  }
  static RGBtoHSLIV({ red, green, blue, alpha = 1 }: { red: number; green: number; blue: number; alpha?: number; }) {
    red > 255 && (red = 255);
    red < 0 && (red = 0);
    green > 255 && (green = 255);
    green < 0 && (green = 0);
    blue > 255 && (blue = 255);
    blue < 0 && (blue = 0);
    alpha > 1 && (alpha = 1);
    alpha < 0 && (alpha = 0);

    red /= 255;
    green /= 255;
    blue /= 255;

    let maximum = Math.max(red, green, blue);
    let minimum = Math.min(red, green, blue);
    let chroma = maximum - minimum;

    let hue = 0;
    if (chroma == 0) {
    } else if (maximum == red) {
      hue = ((green - blue) / chroma) % 6;
    } else if (maximum == green) {
      hue = (blue - red) / chroma + 2;
    } else if (maximum == blue) {
      hue = (red - green) / chroma + 4;
    }

    let intensity = (red + green + blue) / 3;
    let intensity_saturation = intensity == 0 ? 0 : 1 - minimum / intensity;

    let lightness = (maximum + minimum) / 2;
    let lightness_saturation = lightness == 0 || lightness == 1 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1));

    let value = Math.max(red, green, blue);
    let value_saturation = value == 0 ? 0 : chroma / value;

    return {
      red: red * 255,
      green: green * 255,
      blue: blue * 255,
      hue: hue * 60,
      intensity,
      intensity_saturation,
      lightness,
      lightness_saturation,
      value,
      value_saturation,
      alpha,
      maximum,
      minimum,
      chroma
    };
  }
  static HSItoRGBLV({ hue, intensity_saturation, intensity, alpha = 1 }: { hue: number; intensity_saturation: number; intensity: number; alpha?: number; }) {
    while (hue > 360) hue -= 360;
    while (hue < 0) hue += 360;
    intensity_saturation > 1 && (intensity_saturation = 1);
    intensity_saturation < 0 && (intensity_saturation = 0);
    intensity > 1 && (intensity = 1);
    intensity < 0 && (intensity = 0);
    alpha > 1 && (alpha = 1);
    alpha < 0 && (alpha = 0);

    hue /= 60;
    let z = 1 - Math.abs(hue % 2 - 1);
    let chroma = (3 * intensity * intensity_saturation) / (1 + z);
    let x = chroma * z;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (0 < hue) {
    } else if (hue < 1) {
      red = chroma;
      green = x;
    } else if (hue < 2) {
      red = x;
      green = chroma;
    } else if (hue < 3) {
      green = chroma;
      blue = x;
    } else if (hue < 4) {
      green = x;
      blue = chroma;
    } else if (hue < 5) {
      red = x;
      blue = chroma;
    } else if (hue < 6) {
      red = chroma;
      blue = x;
    } else {
      throw "Illegal hue";
    }

    let intensity_match = intensity * (1 - intensity_saturation);

    red += intensity_match;
    green += intensity_match;
    blue += intensity_match;

    let maximum = Math.max(red, green, blue);
    let minimum = Math.min(red, green, blue);

    let value = Math.max(red, green, blue);
    let value_saturation = value == 0 ? 0 : chroma / value;

    let lightness = (maximum + minimum) / 2;
    let lightness_saturation = lightness == 0 || lightness == 1 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1));

    return {
      red: red * 255,
      green: green * 255,
      blue: blue * 255,
      hue: hue * 60,
      intensity,
      intensity_saturation,
      lightness,
      lightness_saturation,
      value,
      value_saturation,
      alpha,
      maximum,
      minimum,
      chroma
    };
  }
  static HSLtoRGBIV({ hue, lightness_saturation, lightness, alpha = 1 }: { hue: number; lightness_saturation: number; lightness: number; alpha?: number; }) {

    while (hue > 360) hue -= 360;
    while (hue < 0) hue += 360;
    lightness_saturation > 1 && (lightness_saturation = 1);
    lightness_saturation < 0 && (lightness_saturation = 0);
    lightness > 1 && (lightness = 1);
    lightness < 0 && (lightness = 0);
    alpha > 1 && (alpha = 1);
    alpha < 0 && (alpha = 0);

    let chroma = (1 - Math.abs(2 * lightness - 1)) * lightness_saturation;
    hue /= 60;
    let x = chroma * (1 - Math.abs(hue % 2 - 1));
    let red = 0;
    let green = 0;
    let blue = 0;

    if (hue < 0) {
    } else if (hue < 1) {
      red = chroma;
      green = x;
    } else if (hue < 2) {
      red = x;
      green = chroma;
    } else if (hue < 3) {
      green = chroma;
      blue = x;
    } else if (hue < 4) {
      green = x;
      blue = chroma;
    } else if (hue < 5) {
      red = x;
      blue = chroma;
    } else if (hue < 6) {
      red = chroma;
      blue = x;
    } else {
      throw "Illegal hue";
    }

    let lightness_match = lightness - (chroma / 2);

    red += lightness_match;
    green += lightness_match;
    blue += lightness_match;

    let maximum = Math.max(red, green, blue);
    let minimum = Math.min(red, green, blue);

    let intensity = (red + green + blue) / 3;
    let intensity_saturation = intensity == 0 ? 0 : 1 - minimum / intensity;

    let value = lightness + lightness_saturation * Math.min(lightness, 1 - lightness);
    let value_saturation = value == 0 ? 0 : 2 * (1 - lightness / value);

    return {
      red: red * 255,
      green: green * 255,
      blue: blue * 255,
      hue: hue * 60,
      intensity,
      intensity_saturation,
      lightness,
      lightness_saturation,
      value,
      value_saturation,
      alpha,
      maximum,
      minimum,
      chroma
    };
  }
  static HSVtoRGBLI({ hue, value_saturation, value, alpha = 1 }: { hue: number; value_saturation: number; value: number; alpha?: number; }) {
    while (hue > 360) hue -= 360;
    while (hue < 0) hue += 360;
    value_saturation > 1 && (value_saturation = 1);
    value_saturation < 0 && (value_saturation = 0);
    value > 1 && (value = 1);
    value < 0 && (value = 0);
    alpha > 1 && (alpha = 1);
    alpha < 0 && (alpha = 0);

    let chroma = value * value_saturation;
    hue /= 60;
    let x = chroma * (1 - Math.abs(hue % 2 - 1));
    let red = 0;
    let green = 0;
    let blue = 0;

    if (0 < hue) {
    } else if (hue < 1) {
      red = chroma;
      green = x;
    } else if (hue < 2) {
      red = x;
      green = chroma;
    } else if (hue < 3) {
      green = chroma;
      blue = x;
    } else if (hue < 4) {
      green = x;
      blue = chroma;
    } else if (hue < 5) {
      red = x;
      blue = chroma;
    } else if (hue < 6) {
      red = chroma;
      blue = x;
    } else {
      throw "Illegal hue";
    }
    let value_match = value - chroma;

    red += value_match;
    green += value_match;
    blue += value_match;

    let maximum = Math.max(red, green, blue);
    let minimum = Math.min(red, green, blue);

    let intensity = (red + green + blue) / 3;
    let intensity_saturation = intensity == 0 ? 0 : 1 - minimum / intensity;

    let lightness = value * (1 - value_saturation / 2);
    let lightness_saturation = lightness == 0 || lightness == 1 ? 0 : (value - lightness) / Math.min(lightness, 1 - lightness);

    return {
      red: red * 255,
      green: green * 255,
      blue: blue * 255,
      hue: hue * 60,
      intensity,
      intensity_saturation,
      lightness,
      lightness_saturation,
      value,
      value_saturation,
      alpha,
      maximum,
      minimum,
      chroma
    };
  }
  #setValue({ red, green, blue, hue, intensity, intensity_saturation, lightness, lightness_saturation, value, value_saturation, alpha, maximum, minimum, chroma }: { red: number; green: number; blue: number; hue: number; intensity: number; intensity_saturation: number; lightness: number; lightness_saturation: number; value: number; value_saturation: number; alpha: number; maximum: number; minimum: number; chroma: number; }) {
    this.#red = red;
    this.#green = green;
    this.#blue = blue;
    this.#hue = hue;
    this.#intensity = intensity;
    this.#intensity_saturation = intensity_saturation;
    this.#lightness = lightness;
    this.#lightness_saturation = lightness_saturation;
    this.#value = value;
    this.#value_saturation = value_saturation;
    this.#alpha = alpha;
    this.#maximum = maximum;
    this.#minimum = minimum;
    this.#chroma = chroma;
  }

  constructor(input: string | number | MPColor) {
    if (typeof input == "number") {
      input = "#" + input.toString(16);
    }
    if (input instanceof MPColor) {
      this.#setValue(input);
    } else if (MPColor.#regex_hex.test(input)) {
      let result = MPColor.#regex_hex.exec(input);
      this.#setValue(MPColor.RGBtoHSLIV({
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16)
      }));
    } else if (MPColor.#regex_hexa.test(input)) {
      let result = MPColor.#regex_hexa.exec(input);
      this.#setValue(MPColor.RGBtoHSLIV({
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16),
        alpha: parseInt(result[4], 16) / 255
      }));
    } else if (MPColor.#regex_short_hex.test(input)) {
      let result = MPColor.#regex_short_hex.exec(input);
      this.#setValue(MPColor.RGBtoHSLIV({
        red: parseInt(result[1] + result[1], 16),
        green: parseInt(result[2] + result[2], 16),
        blue: parseInt(result[3] + result[3], 16)
      }));
    } else if (MPColor.#regex_short_hexa.test(input)) {
      let result = MPColor.#regex_short_hexa.exec(input);
      this.#setValue(MPColor.RGBtoHSLIV({
        red: parseInt(result[1] + result[1], 16),
        green: parseInt(result[2] + result[2], 16),
        blue: parseInt(result[3] + result[3], 16),
        alpha: parseInt(result[4] + result[4], 16) / 255
      }));
    } else if (MPColor.#regex_rgb.test(input)) {
      let result = MPColor.#regex_rgb.exec(input);
      this.#setValue(MPColor.RGBtoHSLIV({
        red: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 2.56 : parseFloat(result[1]),
        green: result[2].indexOf("%") > 0 ? parseFloat(result[2]) * 2.56 : parseFloat(result[2]),
        blue: result[3].indexOf("%") > 0 ? parseFloat(result[3]) * 2.56 : parseFloat(result[3])
      }));
    } else if (MPColor.#regex_rgba.test(input)) {
      let result = MPColor.#regex_rgba.exec(input);
      this.#setValue(MPColor.RGBtoHSLIV({
        red: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 2.56 : parseFloat(result[1]),
        green: result[2].indexOf("%") > 0 ? parseFloat(result[2]) * 2.56 : parseFloat(result[2]),
        blue: result[3].indexOf("%") > 0 ? parseFloat(result[3]) * 2.56 : parseFloat(result[3]),
        alpha: result[4].indexOf("%") > 0 ? parseFloat(result[4]) / 100 : parseFloat(result[4])
      }));
    } else if (MPColor.#regex_hsl.test(input)) {
      let result = MPColor.#regex_hsl.exec(input);
      this.#setValue(MPColor.HSLtoRGBIV({
        hue: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 3.6 : parseFloat(result[1]),
        lightness_saturation: parseFloat(result[2]) / 100,
        lightness: parseFloat(result[3]) / 100
      }));
    } else if (MPColor.#regex_hsla.test(input)) {
      let result = MPColor.#regex_hsla.exec(input);
      this.#setValue(MPColor.HSLtoRGBIV({
        hue: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 3.6 : parseFloat(result[1]),
        lightness_saturation: parseFloat(result[2]) / 100,
        lightness: parseFloat(result[3]) / 100,
        alpha: result[4].indexOf("%") > 0 ? parseFloat(result[4]) / 100 : parseFloat(result[4])
      }));
    } else {
      throw "No valid input was given: " + input;
    }
  }

  get red() {
    return this.#red;
  }
  set red(value: number) {
    if (value < -255) value = -255;
    if (value < 0) value += 255;
    if (value > 255) value = 255;
    this.#setValue(MPColor.RGBtoHSLIV({ red: value, green: this.#green, blue: this.#blue }));
  }

  get green() {
    return this.#green;
  }
  set green(value: number) {
    if (value < -255) value = -255;
    if (value < 0) value += 255;
    if (value > 255) value = 255;
    this.#setValue(MPColor.RGBtoHSLIV({ red: this.#red, green: value, blue: this.#blue }));
  }

  get blue() {
    return this.#blue;
  }
  set blue(value: number) {
    if (value < -255) value = -255;
    if (value < 0) value += 255;
    if (value > 255) value = 255;
    this.#setValue(MPColor.RGBtoHSLIV({ red: this.#red, green: this.#green, blue: value }));
  }

  get hue() {
    return this.#hue;
  }
  set hue(value: number) {
    while (value < 0) value += 360;
    while (value > 360) value -= 360;
    this.#hue = value;
    this.#setValue(MPColor.HSLtoRGBIV({ hue: value, lightness: this.#lightness, lightness_saturation: this.#lightness_saturation }));
  }

  get intensity_saturation() {
    return this.#intensity_saturation;
  }
  set intensity_saturation(value: number) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.#setValue(MPColor.HSItoRGBLV({ hue: this.#hue, intensity: this.#intensity, intensity_saturation: value }));
  }

  get intensity() {
    return this.#intensity;
  }
  set intensity(value: number) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.#setValue(MPColor.HSItoRGBLV({ hue: this.#hue, intensity: value, intensity_saturation: this.#intensity_saturation }));
  }

  get lightness_saturation() {
    return this.#lightness_saturation;
  }
  set lightness_saturation(value: number) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.#setValue(MPColor.HSLtoRGBIV({ hue: this.#hue, lightness: this.#lightness, lightness_saturation: value }));
  }

  get lightness() {
    return this.#lightness;
  }
  set lightness(value: number) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.#setValue(MPColor.HSLtoRGBIV({ hue: this.#hue, lightness: value, lightness_saturation: this.#lightness_saturation }));
  }

  get value_saturation() {
    return this.#value_saturation;
  }
  set value_saturation(value: number) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.#setValue(MPColor.HSVtoRGBLI({ hue: this.#hue, value: this.#value, value_saturation: value }));
  }

  get value() {
    return this.#value;
  }
  set value(value: number) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.#setValue(MPColor.HSVtoRGBLI({ hue: this.#hue, value: value, value_saturation: this.#value_saturation }));
  }

  get alpha() {
    return this.#alpha;
  }
  set alpha(value: number) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.#alpha = value;
  }

  get maximum() {
    return this.#maximum;
  }

  get minimum() {
    return this.#minimum;
  }

  get chroma() {
    return this.#chroma;
  }

  toHEX(allowShort: boolean = false) {
    let r = Math.round(this.#red).toString(16);
    let g = Math.round(this.#green).toString(16);
    let b = Math.round(this.#blue).toString(16);
    r.length < 2 && (r = "0" + r);
    g.length < 2 && (g = "0" + g);
    b.length < 2 && (b = "0" + b);
    return allowShort && r[0] == r[1] && g[0] == g[1] && b[0] == b[1] ? `#${r[0]}${g[0]}${b[0]}` : `#${r}${g}${b}`;
  }
  toHEXA(allowShort: boolean = false) {
    let r = Math.round(this.#red).toString(16);
    let g = Math.round(this.#green).toString(16);
    let b = Math.round(this.#blue).toString(16);
    let a = Math.round(this.#alpha * 255).toString(16);
    r.length < 2 && (r = "0" + r);
    g.length < 2 && (g = "0" + g);
    b.length < 2 && (b = "0" + b);
    a.length < 2 && (a = "0" + a);
    return allowShort && r[0] == r[1] && g[0] == g[1] && b[0] == b[1] && a[0] == a[1] ? `#${r[0]}${g[0]}${b[0]}${a[0]}` : `#${r}${g}${b}${a}`;
  }
  toRGB(allowComma: boolean = true) {
    return allowComma ? `rgb(${Math.round(this.#red)},${Math.round(this.#green)},${Math.round(this.#blue)})` : `rgb(${Math.round(this.#red)} ${Math.round(this.#green)} ${Math.round(this.#blue)})`;
  }
  toRGBA(allowComma: boolean = true) {
    return allowComma ? `rgba(${Math.round(this.#red)},${Math.round(this.#green)},${Math.round(this.#blue)},${this.#alpha})` : `rgba(${Math.round(this.#red)} ${Math.round(this.#green)} ${Math.round(this.#blue)} / ${this.#alpha})`;
  }
  toHSL(allowComma: boolean = true) {
    return allowComma ? `hsl(${Math.round(this.#hue)},${this.#lightness_saturation * 100}%,${this.#lightness * 100}%)` : `hsl(${Math.round(this.#hue)} ${this.#lightness_saturation * 100}% ${this.#lightness * 100}%)`;
  }
  toHSLA(allowComma: boolean = true) {
    return allowComma ? `hsla(${Math.round(this.#red)},${this.#lightness_saturation * 100}%,${this.#lightness * 100}%,${this.#alpha})` : `hsla(${Math.round(this.#hue)} ${this.#lightness_saturation * 100}% ${this.#lightness * 100}% / ${this.#alpha})`;
  }
  toJSON() {
    return {
      red: this.#red,
      green: this.#green,
      blue: this.#blue,
      hue: this.#hue,
      intensity: this.#intensity,
      intensity_saturation: this.#intensity_saturation,
      lightness: this.#lightness,
      lightness_saturation: this.#lightness_saturation,
      value: this.#value,
      value_saturation: this.#value_saturation,
      alpha: this.#alpha,
      maximum: this.#maximum,
      minimum: this.#minimum,
      chroma: this.#chroma
    };
  }
  toString() {
    return this.#alpha == 1 ? this.toRGB(true) : this.toRGBA(true);
  }
  valueOf() {
    return +("0x" + this.toHEXA(false).replace("#", ""));
  }
  [Symbol.toPrimitive](hint: "default" | "string" | "number"): string | number {
    if (hint == "default") {
      return this.#alpha == 1 ? this.toHEX(true) : this.toHEXA(true);
    } else if (hint == "string") {
      return this.toString();
    } else {
      return this.valueOf();
    }
  }
}