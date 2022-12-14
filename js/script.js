class MPCBody extends HTMLBodyElement {
    static i18n(string) {
        return MPCHelper.i18n(string, "mpc-body");
    }
    #shadowRoot = this.attachShadow({
        mode: "closed",
        delegatesFocus: true
    });
    #copyright;
    constructor() {
        super();
        this.lang = MPCHelper.lang;
        this.#populateShadowRoot();
        MPCHelper.addEventListener("langchange", () => this.#populateShadowRoot());
        const firstModified = MPCDocument.lastModified;
        document.addEventListener("readystatechange", event => {
            this.#copyright = document.getElementById("copyright");
        });
        addEventListener("beforeunload", event => {
            if (document.querySelectorAll("[edit]").length) {
                event.preventDefault();
                event.returnValue = MPCBody.i18n("Some sections have opened editors. Please close them before closing the window.");
            }
            if (firstModified != MPCDocument.lastModified) {
                event.preventDefault();
                event.returnValue = MPCBody.i18n("Changes have been made since the document was opened. Have you saved the changes?");
            }
        });
    }
    #populateShadowRoot() {
        this.#shadowRoot.innerHTML = "";
        this.#shadowRoot.append(document.getElementById("style-css").cloneNode(true), MPCHelper.createElement("slot", { className: "content" }), MPCHelper.createElement("p", { className: "end-of-document" }, MPCBody.i18n("End of document")), MPCHelper.createElement("slot", { className: "copyright", name: "copyright" }), MPCHelper.createElement("div", { className: "toolbar" }, MPCHelper.createElement("div", { className: "tool-group" }, [
            MPCHelper.createElement("button", {
                className: "tool tool-add",
                title: MPCBody.i18n("Add section above"),
                onclick: event => {
                    event.preventDefault();
                    this.insertBefore(new MPCEditor(), this.#copyright);
                    MPCDocument.lastModified = new Date();
                }
            }, MPCHelper.createElement("span", null, MPCBody.i18n("Add"))),
            MPCHelper.createElement("hr"),
            MPCHelper.createElement("button", {
                className: "tool tool-newDocument",
                title: MPCBody.i18n("New document"),
                onclick(event) {
                    event.preventDefault();
                    window.open("https://mpdieckmann.github.io/MPCEditor/index.html");
                }
            }, MPCHelper.createElement("span", null, MPCBody.i18n("New document"))),
            MPCHelper.createElement("button", {
                className: "tool tool-print",
                title: MPCBody.i18n("Print"),
                onclick(event) {
                    event.preventDefault();
                    print();
                }
            }, MPCHelper.createElement("span", null, MPCBody.i18n("Print"))),
            MPCHelper.createElement("hr"),
            MPCHelper.createElement("button", {
                className: "tool tool-documentInfo",
                title: MPCBody.i18n("Edit preferences"),
                onclick: event => {
                    event.preventDefault();
                    this.#showDocumentInformationDialog();
                }
            }, MPCHelper.createElement("span", null, MPCBody.i18n("Preferences"))),
            MPCHelper.createElement("button", {
                className: "tool tool-save",
                title: MPCBody.i18n("Save file"),
                onclick(event) {
                    event.preventDefault();
                    MPCHelper.createElement("a", {
                        download: `${document.title} [${MPCDate.date("Y-m-d H:i")}].html`,
                        href: URL.createObjectURL(new Blob([
                            "<!DOCTYPE html>",
                            document.documentElement.outerHTML
                        ], {
                            type: "text/html"
                        }))
                    }).click();
                }
            }, MPCHelper.createElement("span", null, MPCBody.i18n("Save file"))),
        ])), MPCHelper.createElement("slot", { className: "keyboard", name: "keyboard" }));
    }
    async #showDocumentInformationDialog() {
        const value = await MPCHelper.createDialog({
            headerText: MPCBody.i18n("Preferences"),
            okText: "Ok",
            cancelText: "Cancel"
        }, null, [
            MPCHelper.createElement("h4", null, MPCBody.i18n("Document properties"), { textAlign: "center" }),
            MPCHelper.createInput({
                type: "text",
                text: MPCBody.i18n("Author:"),
                name: "author",
                value: MPCDocument.author
            }, {
                list: [MPCDocument.author],
                autocomplete: "no"
            }),
            MPCHelper.createInput({
                type: "text",
                text: MPCBody.i18n("Title:"),
                name: "title",
                value: MPCDocument.title
            }, {
                list: [MPCDocument.title],
                autocomplete: "no"
            }),
            MPCHelper.createElement("label", {
                className: "label label-textarea"
            }, [
                MPCHelper.createElement("textarea", {
                    className: "label-textarea",
                    name: "description",
                    rows: 2,
                    value: MPCDocument.description
                }),
                MPCHelper.createElement("span", {
                    className: "label-text",
                    textContent: MPCBody.i18n("Description:")
                })
            ]),
            MPCHelper.createInput({
                type: "text",
                text: MPCBody.i18n("Document language:"),
                name: "lang",
                value: this.lang
            }, {
                list: Array.from(new Set(Array.from(document.querySelectorAll("mpc-editor"), (element) => element.langs).flat()), lang => new Option(MPCLangMap.get(lang), lang)),
                required: true,
                autocomplete: "no"
            }),
            MPCHelper.createElement("label", { className: "label label-output" }, [
                MPCHelper.createElement("span", {
                    className: "label-text",
                    textContent: MPCBody.i18n("Last modified:")
                }),
                MPCHelper.createElement("output", {
                    className: "label-output",
                    value: MPCDate.date("jS F Y / H:i:s", MPCDocument.lastModified || null)
                })
            ]),
            MPCHelper.createElement("h4", null, MPCBody.i18n("Global preferences"), { textAlign: "center" }),
            MPCHelper.createInput({
                type: "text",
                text: MPCBody.i18n("Global language:"),
                name: "global-lang",
                value: MPCHelper.lang
            }, {
                list: MPCHelper.langs.map(lang => new Option(MPCLangMap.get(lang), lang)),
                required: true,
                autocomplete: "no"
            }),
        ]).showModal(true);
        if (value) {
            let properties = new URLSearchParams(value);
            if (properties.get("global-lang") != MPCHelper.lang) {
                document.documentElement.classList.add("langchange");
                setTimeout(() => MPCHelper.lang = properties.get("global-lang"), 300);
            }
            document.title = properties.get("title");
            this.lang = properties.get("lang");
            this.querySelectorAll("mpc-editor,mpc-toc").forEach((element) => element.lang = document.body.lang);
        }
    }
}
customElements.define("mpc-body", MPCBody, {
    extends: "body"
});
class MPColor {
    static #regex_hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
    static #regex_hexa = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
    static #regex_short_hex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
    static #regex_short_hexa = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i;
    static #regex_rgb = /^rgb\(\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*\)$/i;
    static #regex_rgba = /^rgba\(\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)\s*,?\s*(-?[0-9]+(?:\.[0-9]+)\s*%?)[,\/]\s*([0-9]+(?:\.[0-9]+))\s*%?\s*\)$/i;
    static #regex_hsl = /^hsl\(\s*(-?[0-9]+(?:\.[0-9]+))\s*,?\s*(-?[0-9]+(?:\.[0-9]+))\s*%\s*,?\s*(-?[0-9]+(?:\.[0-9]+))\s*%\s*\)$/i;
    static #regex_hsla = /^hsla\(\s*(-?[0-9]+(?:\.[0-9]+))\s*,?\s*(-?[0-9]+(?:\.[0-9]+))\s*,?\s*(-?[0-9]+(?:\.[0-9]+))[,\/]\s*([0-9]+(?:\.[0-9]+))\s*%?\s*\)$/i;
    #red = 0;
    #green = 0;
    #blue = 0;
    #hue = 0;
    #lightness_saturation = 0;
    #lightness = 0;
    #value = 0;
    #value_saturation = 0;
    #intensity = 0;
    #intensity_saturation = 0;
    #alpha = 0;
    #maximum = 0;
    #minimum = 0;
    #chroma = 0;
    static isHEX(input) {
        return this.#regex_hex.test(input) || this.#regex_hexa.test(input) || this.#regex_short_hex.test(input) || this.#regex_short_hexa.test(input);
    }
    static isHEXA(input) {
        return this.#regex_hexa.test(input) || this.#regex_short_hexa.test(input);
    }
    static isShortHEX(input) {
        return this.#regex_short_hex.test(input) || this.#regex_short_hexa.test(input);
    }
    static isShortHEXA(input) {
        return this.#regex_short_hexa.test(input);
    }
    static isRGB(input) {
        return this.#regex_rgb.test(input);
    }
    static isRGBA(input) {
        return this.#regex_rgba.test(input);
    }
    static isHSL(input) {
        return this.#regex_hsl.test(input);
    }
    static isHSLA(input) {
        return this.#regex_hsla.test(input);
    }
    static RGBtoHSLIV({ red, green, blue, alpha = 1 }) {
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
        }
        else if (maximum == red) {
            hue = ((green - blue) / chroma) % 6;
        }
        else if (maximum == green) {
            hue = (blue - red) / chroma + 2;
        }
        else if (maximum == blue) {
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
    static HSItoRGBLV({ hue, intensity_saturation, intensity, alpha = 1 }) {
        while (hue > 360)
            hue -= 360;
        while (hue < 0)
            hue += 360;
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
        }
        else if (hue < 1) {
            red = chroma;
            green = x;
        }
        else if (hue < 2) {
            red = x;
            green = chroma;
        }
        else if (hue < 3) {
            green = chroma;
            blue = x;
        }
        else if (hue < 4) {
            green = x;
            blue = chroma;
        }
        else if (hue < 5) {
            red = x;
            blue = chroma;
        }
        else if (hue < 6) {
            red = chroma;
            blue = x;
        }
        else {
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
    static HSLtoRGBIV({ hue, lightness_saturation, lightness, alpha = 1 }) {
        while (hue > 360)
            hue -= 360;
        while (hue < 0)
            hue += 360;
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
        }
        else if (hue < 1) {
            red = chroma;
            green = x;
        }
        else if (hue < 2) {
            red = x;
            green = chroma;
        }
        else if (hue < 3) {
            green = chroma;
            blue = x;
        }
        else if (hue < 4) {
            green = x;
            blue = chroma;
        }
        else if (hue < 5) {
            red = x;
            blue = chroma;
        }
        else if (hue < 6) {
            red = chroma;
            blue = x;
        }
        else {
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
    static HSVtoRGBLI({ hue, value_saturation, value, alpha = 1 }) {
        while (hue > 360)
            hue -= 360;
        while (hue < 0)
            hue += 360;
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
        }
        else if (hue < 1) {
            red = chroma;
            green = x;
        }
        else if (hue < 2) {
            red = x;
            green = chroma;
        }
        else if (hue < 3) {
            green = chroma;
            blue = x;
        }
        else if (hue < 4) {
            green = x;
            blue = chroma;
        }
        else if (hue < 5) {
            red = x;
            blue = chroma;
        }
        else if (hue < 6) {
            red = chroma;
            blue = x;
        }
        else {
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
    #setValue({ red, green, blue, hue, intensity, intensity_saturation, lightness, lightness_saturation, value, value_saturation, alpha, maximum, minimum, chroma }) {
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
    constructor(input) {
        if (typeof input == "number") {
            input = "#" + input.toString(16);
        }
        if (input instanceof MPColor) {
            this.#setValue(input);
        }
        else if (MPColor.#regex_hex.test(input)) {
            let result = MPColor.#regex_hex.exec(input);
            this.#setValue(MPColor.RGBtoHSLIV({
                red: parseInt(result[1], 16),
                green: parseInt(result[2], 16),
                blue: parseInt(result[3], 16)
            }));
        }
        else if (MPColor.#regex_hexa.test(input)) {
            let result = MPColor.#regex_hexa.exec(input);
            this.#setValue(MPColor.RGBtoHSLIV({
                red: parseInt(result[1], 16),
                green: parseInt(result[2], 16),
                blue: parseInt(result[3], 16),
                alpha: parseInt(result[4], 16) / 255
            }));
        }
        else if (MPColor.#regex_short_hex.test(input)) {
            let result = MPColor.#regex_short_hex.exec(input);
            this.#setValue(MPColor.RGBtoHSLIV({
                red: parseInt(result[1] + result[1], 16),
                green: parseInt(result[2] + result[2], 16),
                blue: parseInt(result[3] + result[3], 16)
            }));
        }
        else if (MPColor.#regex_short_hexa.test(input)) {
            let result = MPColor.#regex_short_hexa.exec(input);
            this.#setValue(MPColor.RGBtoHSLIV({
                red: parseInt(result[1] + result[1], 16),
                green: parseInt(result[2] + result[2], 16),
                blue: parseInt(result[3] + result[3], 16),
                alpha: parseInt(result[4] + result[4], 16) / 255
            }));
        }
        else if (MPColor.#regex_rgb.test(input)) {
            let result = MPColor.#regex_rgb.exec(input);
            this.#setValue(MPColor.RGBtoHSLIV({
                red: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 2.56 : parseFloat(result[1]),
                green: result[2].indexOf("%") > 0 ? parseFloat(result[2]) * 2.56 : parseFloat(result[2]),
                blue: result[3].indexOf("%") > 0 ? parseFloat(result[3]) * 2.56 : parseFloat(result[3])
            }));
        }
        else if (MPColor.#regex_rgba.test(input)) {
            let result = MPColor.#regex_rgba.exec(input);
            this.#setValue(MPColor.RGBtoHSLIV({
                red: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 2.56 : parseFloat(result[1]),
                green: result[2].indexOf("%") > 0 ? parseFloat(result[2]) * 2.56 : parseFloat(result[2]),
                blue: result[3].indexOf("%") > 0 ? parseFloat(result[3]) * 2.56 : parseFloat(result[3]),
                alpha: result[4].indexOf("%") > 0 ? parseFloat(result[4]) / 100 : parseFloat(result[4])
            }));
        }
        else if (MPColor.#regex_hsl.test(input)) {
            let result = MPColor.#regex_hsl.exec(input);
            this.#setValue(MPColor.HSLtoRGBIV({
                hue: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 3.6 : parseFloat(result[1]),
                lightness_saturation: parseFloat(result[2]) / 100,
                lightness: parseFloat(result[3]) / 100
            }));
        }
        else if (MPColor.#regex_hsla.test(input)) {
            let result = MPColor.#regex_hsla.exec(input);
            this.#setValue(MPColor.HSLtoRGBIV({
                hue: result[1].indexOf("%") > 0 ? parseFloat(result[1]) * 3.6 : parseFloat(result[1]),
                lightness_saturation: parseFloat(result[2]) / 100,
                lightness: parseFloat(result[3]) / 100,
                alpha: result[4].indexOf("%") > 0 ? parseFloat(result[4]) / 100 : parseFloat(result[4])
            }));
        }
        else {
            throw "No valid input was given: " + input;
        }
    }
    get red() {
        return this.#red;
    }
    set red(value) {
        if (value < -255)
            value = -255;
        if (value < 0)
            value += 255;
        if (value > 255)
            value = 255;
        this.#setValue(MPColor.RGBtoHSLIV({ red: value, green: this.#green, blue: this.#blue }));
    }
    get green() {
        return this.#green;
    }
    set green(value) {
        if (value < -255)
            value = -255;
        if (value < 0)
            value += 255;
        if (value > 255)
            value = 255;
        this.#setValue(MPColor.RGBtoHSLIV({ red: this.#red, green: value, blue: this.#blue }));
    }
    get blue() {
        return this.#blue;
    }
    set blue(value) {
        if (value < -255)
            value = -255;
        if (value < 0)
            value += 255;
        if (value > 255)
            value = 255;
        this.#setValue(MPColor.RGBtoHSLIV({ red: this.#red, green: this.#green, blue: value }));
    }
    get hue() {
        return this.#hue;
    }
    set hue(value) {
        while (value < 0)
            value += 360;
        while (value > 360)
            value -= 360;
        this.#hue = value;
        this.#setValue(MPColor.HSLtoRGBIV({ hue: value, lightness: this.#lightness, lightness_saturation: this.#lightness_saturation }));
    }
    get intensity_saturation() {
        return this.#intensity_saturation;
    }
    set intensity_saturation(value) {
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.#setValue(MPColor.HSItoRGBLV({ hue: this.#hue, intensity: this.#intensity, intensity_saturation: value }));
    }
    get intensity() {
        return this.#intensity;
    }
    set intensity(value) {
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.#setValue(MPColor.HSItoRGBLV({ hue: this.#hue, intensity: value, intensity_saturation: this.#intensity_saturation }));
    }
    get lightness_saturation() {
        return this.#lightness_saturation;
    }
    set lightness_saturation(value) {
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.#setValue(MPColor.HSLtoRGBIV({ hue: this.#hue, lightness: this.#lightness, lightness_saturation: value }));
    }
    get lightness() {
        return this.#lightness;
    }
    set lightness(value) {
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.#setValue(MPColor.HSLtoRGBIV({ hue: this.#hue, lightness: value, lightness_saturation: this.#lightness_saturation }));
    }
    get value_saturation() {
        return this.#value_saturation;
    }
    set value_saturation(value) {
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.#setValue(MPColor.HSVtoRGBLI({ hue: this.#hue, value: this.#value, value_saturation: value }));
    }
    get value() {
        return this.#value;
    }
    set value(value) {
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.#setValue(MPColor.HSVtoRGBLI({ hue: this.#hue, value: value, value_saturation: this.#value_saturation }));
    }
    get alpha() {
        return this.#alpha;
    }
    set alpha(value) {
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
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
    toHEX(allowShort = false) {
        let r = Math.round(this.#red).toString(16);
        let g = Math.round(this.#green).toString(16);
        let b = Math.round(this.#blue).toString(16);
        r.length < 2 && (r = "0" + r);
        g.length < 2 && (g = "0" + g);
        b.length < 2 && (b = "0" + b);
        return allowShort && r[0] == r[1] && g[0] == g[1] && b[0] == b[1] ? `#${r[0]}${g[0]}${b[0]}` : `#${r}${g}${b}`;
    }
    toHEXA(allowShort = false) {
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
    toRGB(allowComma = true) {
        return allowComma ? `rgb(${Math.round(this.#red)},${Math.round(this.#green)},${Math.round(this.#blue)})` : `rgb(${Math.round(this.#red)} ${Math.round(this.#green)} ${Math.round(this.#blue)})`;
    }
    toRGBA(allowComma = true) {
        return allowComma ? `rgba(${Math.round(this.#red)},${Math.round(this.#green)},${Math.round(this.#blue)},${this.#alpha})` : `rgba(${Math.round(this.#red)} ${Math.round(this.#green)} ${Math.round(this.#blue)} / ${this.#alpha})`;
    }
    toHSL(allowComma = true) {
        return allowComma ? `hsl(${Math.round(this.#hue)},${this.#lightness_saturation * 100}%,${this.#lightness * 100}%)` : `hsl(${Math.round(this.#hue)} ${this.#lightness_saturation * 100}% ${this.#lightness * 100}%)`;
    }
    toHSLA(allowComma = true) {
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
    [Symbol.toPrimitive](hint) {
        if (hint == "default") {
            return this.#alpha == 1 ? this.toHEX(true) : this.toHEXA(true);
        }
        else if (hint == "string") {
            return this.toString();
        }
        else {
            return this.valueOf();
        }
    }
}
class MPCDate extends HTMLElement {
    static get observedAttributes() {
        return [
            "format",
            "timestamp"
        ];
    }
    static i18n(string) {
        return MPCHelper.i18n(string, "mpc-date");
    }
    /**
     * Diese Zeichenfolgen werden von `date()` benutzt um die Wochentage darzustellen
     *
     * Sie werden von `i18n(weekdays[i] )` ??bersetzt
     */
    static weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];
    /**
     * Diese Zeichenfolgen werden von `date()` benutzt um die Monate darzustellen
     *
     * Sie werden von `i18n(months[i] )` ??bersetzt
     */
    static months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    /**
     * Gibt die aktuelle Zeit und Datum in Millisekunden aus.
     * @param timestamp Zahl oder `Date`-Objekt/Zeichenfolge um nicht die aktuelle Zeit zu verwenden
     */
    static time(timestamp = new Date) {
        var d = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
        return d.getTime();
    }
    /**
     * Formatiert ein(e) angegebene(s) Ortszeit/Datum gem???? PHP 7
     * @param format die Zeichenfolge, die umgewandelt wird
     * @param timestamp der zu verwendende Zeitpunkt
     */
    static date(format, timestamp = new Date) {
        let date = timestamp === null ? new Date() : timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (date.toJSON() === null) {
            return this.i18n("Invalid date");
        }
        return this.formatTokenizer(format).map(token => token.type == "date" ? token.value.split("").map(string => this._functions[string](date)).join("") : token.value).join("");
    }
    static formatTokenizer(format) {
        let inputStream = format.split("");
        let inputStreamIndex = -1;
        let inputStreamLength = inputStream.length;
        let tokenStream = [];
        let currentToken = { type: "string", value: "" };
        while (++inputStreamIndex < inputStreamLength) {
            let current = inputStream[inputStreamIndex];
            if (current == "\\") {
                if (currentToken.type != "string") {
                    currentToken.value.length > 0 && tokenStream.push(currentToken);
                    currentToken = { type: "string", value: "" };
                }
                if (++inputStreamIndex < inputStreamLength) {
                    currentToken.value += inputStream[inputStreamIndex];
                }
            }
            else if (/[dDjlNSwzWFmMntLoYyaABgGhHisuveIOPTZcrU]/.test(current)) {
                if (currentToken.type != "date") {
                    currentToken.value.length > 0 && tokenStream.push(currentToken);
                    currentToken = { type: "date", value: "" };
                }
                currentToken.value += current;
            }
            else {
                if (currentToken.type != "string") {
                    currentToken.value.length > 0 && tokenStream.push(currentToken);
                    currentToken = { type: "string", value: "" };
                }
                currentToken.value += current;
            }
        }
        currentToken.value.length > 0 && tokenStream.push(currentToken);
        return tokenStream;
    }
    static getUpdateTimeout(format, timestamp = new Date) {
        let time = this.time(timestamp);
        return Math.min(...this.formatTokenizer(format).filter(a => a.type == "date").map(token => token.value.split("").map((a) => {
            if (/[eIOPTZLoYy]/.test(a)) {
                // calculate next year change
                return time % 31557600000 || 31557600000;
            }
            else if (/[FmMnt]/.test(a)) {
                // calculate next month change
                return time % 2629800000 || 2629800000;
            }
            else if (/[W]/.test(a)) {
                // calculate next week change
                return time % 604800000 || 604800000;
            }
            else if (/[dDjlNSwz]/.test(a)) {
                // calculate next day change
                return time % 86400000 || 86400000;
            }
            else if (/[aAgGhH]/.test(a)) {
                // calculate next hour change
                return time % 3600000 || 3600000;
            }
            else if (/[i]/.test(a)) {
                // calculate next minute change
                return time % 60000 || 60000;
            }
            else if (/[scr]/.test(a)) {
                // calculate next seconds change
                return 1000;
            }
            else if (/[B]/.test(a)) {
                return 100;
            }
            else {
                // on-milliseconds-change: uvU
                return 1;
            }
        })).flat());
    }
    /**
     * Die verwendeten Funktionen zur mwandlung der Buchstaben
     */
    static _functions = {
        // #region Tag [dDjlNSwz]
        /**
         * Tag des Monats, 2-stellig mit f??hrender Null
         * 01 bis 31
         */
        d(date) {
            return MPCDate._leadingZero(date.getDate());
        },
        /**
         * Wochentag, gek??rzt auf drei Buchstaben
         * Mon bis Sun
         */
        D(date) {
            return MPCDate.i18n(MPCDate.weekdays[date.getDay()]).substr(0, 3);
        },
        /**
         * Tag des Monats ohne f??hrende Nullen
         * 1 bis 31
         */
        j(date) {
            return date.getDate();
        },
        /**
         * Ausgeschriebener Wochentag
         * Sunday bis Saturday
         */
        l(date) {
            return MPCDate.i18n(MPCDate.weekdays[date.getDay()]);
        },
        /**
         * Numerische Repr??sentation des Wochentages gem???? ISO-8601 (in PHP 5.1.0 hinzugef??gt)
         * 1 (f??r Montag) bis 7 (f??r Sonntag)
         */
        N(date) {
            return date.getDay() == 0 ? 7 : date.getDay();
        },
        /**
         * Anhang der englischen Aufz??hlung f??r einen Monatstag, zwei Zeichen
         * st, nd, rd oder th
         * Zur Verwendung mit j empfohlen.
         */
        S(date) {
            switch (date.getDate()) {
                case 1:
                    return MPCDate.i18n("st");
                case 2:
                    return MPCDate.i18n("nd");
                case 3:
                    return MPCDate.i18n("rd");
                default:
                    return MPCDate.i18n("th");
            }
        },
        /**
         * Numerischer Tag einer Woche
         * 0 (f??r Sonntag) bis 6 (f??r Samstag)
         */
        w(date) {
            return 7 == date.getDay() ? 0 : date.getDay();
        },
        /**
         * Der Tag des Jahres (von 0 beginnend)
         * 0 bis 366
         */
        z(date) {
            return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 864e5);
        },
        // #endregion
        // #region Woche [W]
        /**
         * Der Tag des Jahres (von 0 beginnend)
         * Beispiel: 42 (die 42. Woche im Jahr)
         */
        W(date) {
            var tmp_date = new Date(date.getTime() + 864e5 * (3 - (date.getDay() + 6) % 7));
            return Math.floor(1.5 + (tmp_date.getTime() - new Date(new Date(tmp_date.getFullYear(), 0, 4).getTime() + 864e5 * (3 - (new Date(tmp_date.getFullYear(), 0, 4).getDay() + 6) % 7)).getTime()) / 864e5 / 7);
        },
        // #endregion
        // #region Monat [FmMnt]
        /**
         * Monat als ganzes Wort, wie January oder March
         * January bis December
         */
        F(date) {
            return MPCDate.i18n(MPCDate.months[date.getMonth()]);
        },
        /**
         * Monat als Zahl, mit f??hrenden Nullen
         * 01 bis 12
         */
        m(date) {
            return MPCDate._leadingZero(date.getMonth() + 1);
        },
        /**
         * Monatsname mit drei Buchstaben
         * Jan bis Dec
         */
        M(date) {
            return MPCDate.i18n(MPCDate.months[date.getMonth()]).substr(0, 3);
        },
        /**
         * Monatszahl, ohne f??hrende Nullen
         * 1 bis 12
         */
        n(date) {
            return date.getMonth() + 1;
        },
        /**
         * Anzahl der Tage des angegebenen Monats
         * 28 bis 31
         */
        t(date) {
            return 2 != date.getMonth() ? 9 == date.getMonth() || 4 == date.getMonth() || 6 == date.getMonth() || 11 == date.getMonth() ? "30" : "31" : date.getFullYear() % 4 == 0 && date.getFullYear() % 100 != 0 ? "29" : "28";
        },
        // #endregion
        // #region Jahr [LoYy]
        /**
         * Schaltjahr oder nicht
         * 1 f??r ein Schaltjahr, ansonsten 0
         */
        L(date) {
            return date.getFullYear() % 4 == 0 && date.getFullYear() % 100 != 0 ? 1 : 0;
        },
        /**
         * Jahreszahl der Kalenderwoche gem???? ISO-8601. Dies ergibt den gleichen Wert wie Y, au??er wenn die ISO-Kalenderwoche (W) zum vorhergehenden oder n??chsten Jahr geh??rt, wobei dann jenes Jahr verwendet wird (in PHP 5.1.0 hinzugef??gt).
         * Beispiele: 1999 oder 2003
         */
        o(date) {
            var tmp_d = new Date(date.toISOString());
            tmp_d.setDate(date.getDate() - (date.getDay() == 0 ? 7 : date.getDay()) + 1);
            return tmp_d.getFullYear();
        },
        /**
         * Vierstellige Jahreszahl
         * Beispiele: 1999 oder 2003
         */
        Y(date) {
            return date.getFullYear();
        },
        /**
         * Jahreszahl, zweistellig
         * Beispiele: 99 oder 03
         */
        y(date) {
            var year = date.getFullYear().toString();
            return year.substring(year.length - 2, 2);
        },
        // #endregion
        // #region Uhrzeit [aABgGhHisuv]
        /**
         * Kleingeschrieben: Ante meridiem (Vormittag) und Post meridiem (Nachmittag)
         * am oder pm
         */
        a(date) {
            if (date.getHours() > 12) {
                return MPCDate.i18n("pm");
            }
            return MPCDate.i18n("am");
        },
        /**
         * Gro??geschrieben: Ante meridiem (Vormittag) und Post meridiem (Nachmittag)
         * AM oder PM
         */
        A(date) {
            if (date.getHours() > 12) {
                return MPCDate.i18n("PM");
            }
            return MPCDate.i18n("AM");
        },
        /**
         * Swatch-Internet-Zeit
         * 000 - 999
         */
        B() {
            console.error("MPCDate.date(): B is currently not supported");
            return "B";
        },
        /**
         * Stunde im 12-Stunden-Format, ohne f??hrende Nullen
         * 1 bis 12
         */
        g(date) {
            return date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
        },
        /**
         * Stunde im 24-Stunden-Format, ohne f??hrende Nullen
         * 0 bis 23
         */
        G(date) {
            return date.getHours();
        },
        /**
         * Stunde im 12-Stunden-Format, mit f??hrenden Nullen
         * 01 bis 12
         */
        h(date) {
            return MPCDate._leadingZero(date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
        },
        /**
         * Stunde im 24-Stunden-Format, mit f??hrenden Nullen
         * 00 bis 23
         */
        H(date) {
            return MPCDate._leadingZero(date.getHours());
        },
        /**
         * Minuten, mit f??hrenden Nullen
         * 00 bis 59
         */
        i(date) {
            return MPCDate._leadingZero(date.getMinutes());
        },
        /**
         * Sekunden, mit f??hrenden Nullen
         * 00 bis 59
         */
        s(date) {
            return MPCDate._leadingZero(date.getSeconds());
        },
        /**
         * Mikrosekunden (hinzugef??gt in PHP 5.2.2). Beachten Sie, dass date() immer die Ausgabe 000000 erzeugen wird, da es einen Integer als Parameter erh??lt, wohingegen DateTime::format() Mikrosekunden unterst??tzt, wenn DateTime mit Mikrosekunden erzeugt wurde.
         * Beispiel: 654321
         */
        u(date) {
            return date.getMilliseconds();
        },
        /**
         * Millisekunden (hinzugef??gt in PHP 7.0.0). Es gelten die selben Anmerkungen wie f??r u.
         * Example: 654
         */
        v(date) {
            return date.getMilliseconds();
        },
        // #endregion
        // #region Zeitzone [eIOPTZ]
        /**
         * Zeitzonen Identifizierer
         * Beispiel: UTC, GMT, Atlantic/Azores
         */
        e() {
            console.error("MPCDate.date(): e is currently not supported");
            return "e";
        },
        /**
         * F??llt ein Datum in die Sommerzeit
         * 1 bei Sommerzeit, ansonsten 0.
         */
        I() {
            console.error("MPCDate.date(): I is currently not supported");
            return "I";
        },
        /**
         * Zeitunterschied zur Greenwich time (GMT) in Stunden
         * Beispiel: +0200
         */
        O() {
            console.error("MPCDate.date(): O is currently not supported");
            return "O";
        },
        /**
         * Zeitunterschied zur Greenwich time (GMT) in Stunden mit Doppelpunkt zwischen Stunden und Minuten (hinzugef??gt in PHP 5.1.3)
         * Beispiel: +02:00
         */
        P() {
            console.error("MPCDate.date(): P is currently not supported");
            return "P";
        },
        /**
         * Abk??rzung der Zeitzone
         * Beispiele: EST, MDT ...
         */
        T() {
            console.error("MPCDate.date(): T is currently not supported");
            return "T";
        },
        /**
         * Offset der Zeitzone in Sekunden. Der Offset f??r Zeitzonen westlich von UTC ist immer negativ und f??r Zeitzonen ??stlich von UTC immer positiv.
         * -43200 bis 50400
         */
        Z() {
            console.error("MPCDate.date(): Z is currently not supported");
            return "Z";
        },
        // #endregion
        // #region Vollst??ndige(s) Datum/Uhrzeit [crU]
        /**
         * ISO 8601 Datum (hinzugef??gt in PHP 5)
         * 2004-02-12T15:19:21+00:00
         */
        c() {
            console.error("MPCDate.date(): c is currently not supported");
            return "c";
        },
        /**
         * Gem???? ?? RFC 2822 formatiertes Datum
         * Beispiel: Thu, 21 Dec 2000 16:01:07 +0200
         */
        r() {
            console.error("MPCDate.date(): r is currently not supported");
            return "r";
        },
        /**
         * Sekunden seit Beginn der UNIX-Epoche (January 1 1970 00:00:00 GMT)
         * Siehe auch time()
         */
        U(date) {
            return date.getTime();
        }
        // #endregion
    };
    static _leadingZero(value) {
        return value < 10 ? "0" + value : value.toString();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "timestamp") {
            this.#update(this.format, newValue === null ? null : parseInt(newValue));
        }
        else if (name == "format") {
            this.#update(newValue, this.timestamp);
        }
    }
    get format() {
        return this.getAttribute("format");
    }
    set format(value) {
        if (value === null) {
            this.removeAttribute("format");
        }
        else {
            this.setAttribute("format", value);
        }
    }
    get timestamp() {
        if (this.hasAttribute("timestamp")) {
            return parseInt(this.getAttribute("timestamp"));
        }
        return null;
    }
    set timestamp(value) {
        if (value === null) {
            this.removeAttribute("timestamp");
        }
        else {
            this.setAttribute("timestamp", MPCDate.time(value));
        }
    }
    get value() {
        return MPCDate.date(this.format, this.timestamp);
    }
    #updateTimeout = null;
    #update(format, timestamp) {
        if (this.#updateTimeout !== null) {
            clearTimeout(this.#updateTimeout);
            this.#updateTimeout = null;
        }
        if (timestamp === null) {
            let time = MPCDate.time();
            this.textContent = MPCDate.date(format, time);
            let timeout = MPCDate.getUpdateTimeout(format, time);
            this.#updateTimeout = setTimeout(() => {
                this.#updateTimeout = null;
                this.#update(format, timestamp);
            }, timeout);
        }
        else {
            this.textContent = MPCDate.date(format, timestamp);
        }
    }
    constructor() {
        super();
        setTimeout(() => this.#update(this.format, this.timestamp));
        MPCHelper.addEventListener("langchange", () => this.#update(this.format, this.timestamp));
    }
}
customElements.define("mpc-date", MPCDate);
const MPCDocument = new class MPCDocument {
    #lastModifiedElement = document.querySelector('meta[http-equiv="last-modified"]');
    #authorElement = document.querySelector('meta[name="author"]');
    #descriptionElement = document.querySelector('meta[name="description"]');
    get title() {
        return document.title;
    }
    set title(value) {
        document.title = value;
    }
    get lastModified() {
        return this.#lastModifiedElement.content;
    }
    set lastModified(value) {
        this.#lastModifiedElement.content = new Date(value).toUTCString();
    }
    get author() {
        return this.#authorElement.content;
    }
    set author(value) {
        this.#authorElement.content = value || "";
    }
    get description() {
        return this.#descriptionElement.content;
    }
    set description(value) {
        this.#descriptionElement.content = value || "";
    }
};
class MPCEditor extends HTMLElement {
    static i18n(string) {
        return MPCHelper.i18n(string, "mpc-editor");
    }
    static get observedAttributes() {
        return [
            "edit",
            "lang",
            "lastModified",
            "inputmode",
        ];
    }
    #shadowRoot = this.attachShadow({
        mode: "closed",
        delegatesFocus: true
    });
    #styleElement = MPCHelper.createElement("style", {
        textContent: `.content > [lang]:not([lang="${this.lang}"]), :host(mpc-editor) ::slotted([lang]:not([lang="${this.lang}"])) { display: none; }`
    });
    #editableContent = MPCHelper.createElement("div", {
        className: "content editable",
        contentEditable: "true",
        oninput: () => this.#checkCurrentCaretPosition(),
        onkeyup: () => this.#checkCurrentCaretPosition(),
        onclick: () => this.#checkCurrentCaretPosition()
    });
    #createToolGroup({ tagName = "div", props = null, nodes = null, styles = null, callback = null, onCaretPosition = null, } = {}) {
        let toolGroup = MPCHelper.createElement(tagName, props, nodes, styles, callback);
        if (typeof onCaretPosition == "function") {
            this.#checkForContexts.push((node, element) => onCaretPosition(node, element, toolGroup));
        }
        return toolGroup;
    }
    #createTool({ tagName = "button", props = null, nodes = null, styles = null, callback = null, command = null, onCaretPosition = null, onClick = null, }) {
        let tool = MPCHelper.createElement(tagName, props, nodes, styles, callback);
        if (typeof onClick == "function") {
            tool.addEventListener("mousedown", event => {
                event.preventDefault();
                this.#editableContent.blur();
                this.#editableContent.focus();
                let selection = this.#shadowRoot.getSelection();
                let node = this.#editableContent;
                let element = this.#editableContent;
                if (selection.rangeCount > 0) {
                    node = selection.getRangeAt(0).commonAncestorContainer;
                    if (node instanceof HTMLElement) {
                        element = node;
                    }
                    else {
                        element = node.parentElement;
                    }
                }
                onClick(node, element, tool);
                this.#checkCurrentCaretPosition();
            });
        }
        else if (command) {
            tool.addEventListener("mousedown", event => {
                event.preventDefault();
                this.#editableContent.blur();
                this.#editableContent.focus();
                document.execCommand(command);
                this.#checkCurrentCaretPosition();
            });
        }
        if (typeof onCaretPosition == "function") {
            this.#checkForContexts.push((node, element) => onCaretPosition(node, element, tool));
        }
        return tool;
    }
    #checkCurrentCaretPosition() {
        let selection = this.#shadowRoot.getSelection();
        let node = this.#editableContent;
        let element = this.#editableContent;
        if (selection.rangeCount > 0) {
            node = selection.getRangeAt(0).commonAncestorContainer;
            if (node instanceof HTMLElement) {
                element = node;
            }
            else {
                element = node.parentElement;
            }
        }
        this.#checkForContexts.forEach(callback => callback(node, element));
    }
    #checkForContexts = [];
    constructor() {
        super();
        this.#populateShadowRoot();
        MPCHelper.addEventListener("langchange", () => this.#populateShadowRoot());
    }
    #populateShadowRoot() {
        this.#shadowRoot.innerHTML = "";
        this.#shadowRoot.append(document.getElementById("style-css").cloneNode(true), this.#styleElement, 
        // ToolGroup Edit
        this.#createToolGroup({
            props: {
                className: "tool-group tool-group-edit"
            },
            nodes: [
                // Tool Add
                this.#createTool({
                    props: { className: "tool tool-add", title: MPCEditor.i18n("Add section above") },
                    onClick: () => {
                        this.parentElement.insertBefore(new MPCEditor, this);
                        MPCDocument.lastModified = Date.now();
                    },
                    nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Add")),
                }),
                // Tool Remove
                this.#createTool({
                    props: { className: "tool tool-remove", title: MPCEditor.i18n("Remove this section") },
                    onClick: () => {
                        if (confirm(MPCEditor.i18n("Do you really want to remove this section?"))) {
                            this.remove();
                            MPCDocument.lastModified = Date.now();
                        }
                    },
                    nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Remove")),
                }),
                MPCHelper.createElement("hr"),
                // Tool Edit
                this.#createTool({
                    props: { className: "tool tool-edit", title: MPCEditor.i18n("Edit this section") },
                    onClick: () => {
                        if (innerWidth < 450 || innerHeight < 576) {
                            this.requestFullscreen({ navigationUI: "hide" });
                        }
                        this.edit = true;
                        this.#editableContent.focus();
                    },
                    nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Edit")),
                }),
                // Tool Translate
                this.#createTool({
                    props: { className: "tool tool-translate", title: MPCEditor.i18n("Translate this section") },
                    onClick: () => {
                        MPCHelper.createDialog({
                            headerText: MPCEditor.i18n("Select language"),
                            okText: MPCEditor.i18n("Show"),
                            cancelText: MPCEditor.i18n("Cancel"),
                        }, null, [
                            MPCHelper.createElement("p", { textContent: MPCEditor.i18n("Please select the language you want to see") }),
                            ...(this.langs.length == 0 ? [this.lang] : this.langs).map(code => MPCHelper.createInput({ type: "radio", name: "lang", value: code, text: `(${code}) ${MPCLangMap.get(code)}` }, { checked: this.lang == code })),
                            MPCHelper.createInput({ type: "radio", name: "lang", value: "new-lang", text: MPCEditor.i18n("Add new language") }),
                            MPCHelper.createElement("p", { textContent: MPCEditor.i18n("Adding a new language will create a copy of the current visible content as the base for the translation.") }),
                            MPCHelper.createInput({
                                type: "text",
                                name: "new-lang",
                                text: "",
                            }, {
                                list: "mpclanglist",
                                size: MPCEditor.i18n("Language code").length,
                                minLength: 3,
                                placeholder: MPCEditor.i18n("Language code"),
                            }, null, label => label.classList.add("label-icon", "label-icon-translate")),
                        ]).showModal(true).then(value => {
                            if (value) {
                                let params = new URLSearchParams(value);
                                if (params.get("lang") == "new-lang") {
                                    if (params.get("new-lang")) {
                                        if (this.langs.length == 0) {
                                            this.appendChild(MPCHelper.createElement("div", { lang: this.lang }, Array.from(this.children)));
                                        }
                                        let clone = this.querySelector(`:scope>:lang(${this.lang})`).cloneNode(true);
                                        clone.lang = params.get("new-lang").toLowerCase();
                                        this.appendChild(clone);
                                        this.lang = clone.lang;
                                        if (innerWidth < 450 || innerHeight < 576) {
                                            this.requestFullscreen({ navigationUI: "hide" });
                                        }
                                        this.edit = true;
                                        this.#editableContent.focus();
                                    }
                                }
                                else {
                                    this.lang = params.get("lang");
                                }
                            }
                        });
                    },
                    nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Translate")),
                }),
            ]
        }), 
        // ToolBar
        MPCHelper.createElement("div", {
            className: "toolbar"
        }, [
            // ToolGroupRow 1
            MPCHelper.createElement("div", {
                className: "tool-group-row"
            }, [
                // ToolGroup 1
                this.#createToolGroup({
                    props: {
                        className: "tool-group"
                    },
                    nodes: [
                        // Tool Save
                        this.#createTool({
                            props: { className: "tool tool-save", title: MPCEditor.i18n("Apply changes") },
                            onClick: () => {
                                if (document.fullscreenElement) {
                                    document.exitFullscreen();
                                }
                                this.#editableContent.querySelectorAll("p:empty").forEach(p => p.remove());
                                while (this.#editableContent.firstChild instanceof HTMLBRElement)
                                    this.#editableContent.firstChild.remove();
                                while (this.#editableContent.lastChild instanceof HTMLBRElement)
                                    this.#editableContent.lastChild.remove();
                                let orig = this.querySelector(`:scope>:lang(${this.#editableContent.lang})`);
                                if (this.#editableContent.innerHTML != orig.innerHTML) {
                                    orig.innerHTML = this.#editableContent.innerHTML;
                                    this.lastModified = Date.now();
                                    MPCDocument.lastModified = Date.now();
                                }
                                this.lang = this.#editableContent.lang;
                                this.edit = false;
                            },
                            nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Apply")),
                        }),
                        // Tool Close
                        this.#createTool({
                            props: { className: "tool tool-close", title: MPCEditor.i18n("Discard changes") },
                            onClick: () => {
                                if (document.fullscreenElement) {
                                    document.exitFullscreen();
                                }
                                this.edit = false;
                            },
                            nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Discard")),
                        }),
                    ],
                    styles: {
                        float: "right",
                        clear: "right",
                    }
                }),
                // ToolGroup 2
                this.#createToolGroup({
                    props: {
                        className: "tool-group"
                    },
                    nodes: [
                        // Tool Fullscreen / Tool ExitFullscreen
                        document.fullscreenEnabled ? this.#createTool({
                            props: { className: "tool tool-fullscreen", title: MPCEditor.i18n("Enter fullscreen") },
                            onClick: () => {
                                if (document.fullscreenElement) {
                                    document.exitFullscreen();
                                }
                                else {
                                    this.requestFullscreen({ navigationUI: "hide" });
                                }
                            },
                            callback: tool => {
                                document.addEventListener("fullscreenchange", () => {
                                    if (document.fullscreenElement) {
                                        tool.classList.add("active", "tool-exitFullscreen");
                                        tool.classList.remove("tool-fullscreen");
                                        tool.title = MPCEditor.i18n("Exit fullscreen");
                                    }
                                    else {
                                        tool.classList.remove("active", "tool-exitFullscreen");
                                        tool.classList.add("tool-fullscreen");
                                        tool.title = MPCEditor.i18n("Enter fullscreen");
                                    }
                                });
                            }
                        }) : null,
                        document.fullscreenEnabled ? MPCHelper.createElement("hr") : null,
                        // Tool Undo
                        this.#createTool({
                            command: "undo",
                            props: { className: "tool tool-undo", title: MPCEditor.i18n("Undo") },
                        }),
                        // Tool Redo
                        this.#createTool({
                            command: "redo",
                            props: { className: "tool tool-redo", title: MPCEditor.i18n("Redo") },
                        }),
                    ]
                }),
                // ToolGroup 3
                this.#createToolGroup({
                    props: {
                        className: "tool-group"
                    },
                    nodes: [
                        // Tool Cut
                        this.#createTool({
                            command: "cut",
                            props: { className: "tool tool-cut", title: MPCEditor.i18n("Cut") },
                        }),
                        // Tool Copy
                        this.#createTool({
                            command: "copy",
                            props: { className: "tool tool-copy", title: MPCEditor.i18n("Copy") },
                        }),
                        // Tool Paste
                        this.#createTool({
                            command: "paste",
                            props: { className: "tool tool-paste", title: MPCEditor.i18n("Paste") },
                        }),
                        MPCHelper.createElement("hr"),
                        // Tool RemoveFormat
                        this.#createTool({
                            command: "removeFormat",
                            props: { className: "tool tool-removeFormat", title: MPCEditor.i18n("Reset format") },
                        }),
                    ]
                })
            ]),
            // ToolGroupRow 2
            MPCHelper.createElement("div", {
                className: "tool-group-row"
            }, [
                // ToolGroup 4
                this.#createToolGroup({
                    props: {
                        className: "tool-group"
                    },
                    nodes: [
                        // Tool Bold
                        this.#createTool({
                            command: "bold",
                            props: { className: "tool tool-bold", title: MPCEditor.i18n("Bold") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", +getComputedStyle(element).fontWeight >= 600);
                            },
                        }),
                        // Tool Italic
                        this.#createTool({
                            command: "italic",
                            props: { className: "tool tool-italic", title: MPCEditor.i18n("Italic") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).fontStyle == "italic");
                            },
                        }),
                        // Tool Underline
                        this.#createTool({
                            command: "underline",
                            props: { className: "tool tool-underline", title: MPCEditor.i18n("Underline") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).textDecoration.indexOf("underline") >= 0);
                            },
                        }),
                        // Tool StrikeThrough
                        this.#createTool({
                            command: "strikeThrough",
                            props: { className: "tool tool-strikeThrough", title: MPCEditor.i18n("Strike through") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).textDecoration.indexOf("line-through") >= 0);
                            },
                        }),
                        // Tool Subscript
                        this.#createTool({
                            command: "subscript",
                            props: { className: "tool tool-subscript", title: MPCEditor.i18n("Subscript") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).verticalAlign == "sub");
                            },
                        }),
                        // Tool Superscript
                        this.#createTool({
                            command: "superscript",
                            props: { className: "tool tool-superscript", title: MPCEditor.i18n("Superscript") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).verticalAlign == "super");
                            },
                        }),
                    ]
                }),
                // ToolGroup 5
                this.#createToolGroup({
                    props: {
                        className: "tool-group"
                    },
                    nodes: [
                        // Tool JustifyLeft
                        this.#createTool({
                            command: "justifyLeft",
                            props: { className: "tool tool-justifyLeft", title: MPCEditor.i18n("Align left") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).textAlign == "left" || getComputedStyle(element).textAlign == "start");
                            },
                        }),
                        // Tool JustifyCenter
                        this.#createTool({
                            command: "justifyCenter",
                            props: { className: "tool tool-justifyCenter", title: MPCEditor.i18n("Align center") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).textAlign == "center");
                            },
                        }),
                        // Tool JustifyRight
                        this.#createTool({
                            command: "justifyRight",
                            props: { className: "tool tool-justifyRight", title: MPCEditor.i18n("Align right") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).textAlign == "right" || getComputedStyle(element).textAlign == "end");
                            },
                        }),
                        // Tool JustifyFull
                        this.#createTool({
                            command: "justifyFull",
                            props: { className: "tool tool-justifyFull", title: MPCEditor.i18n("Justify") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", getComputedStyle(element).textAlign == "Align justify");
                            },
                        }),
                    ]
                }),
                // ToolGroup 6
                this.#createToolGroup({
                    props: {
                        className: "tool-group"
                    },
                    nodes: [
                        // Tool InsertUnorderedList
                        this.#createTool({
                            command: "insertUnorderedList",
                            props: { className: "tool tool-insertUnorderedList", title: MPCEditor.i18n("Unordered list") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("ul"));
                            },
                        }),
                        // Tool InsertOrderedList
                        this.#createTool({
                            command: "insertOrderedList",
                            props: { className: "tool tool-insertOrderedList", title: MPCEditor.i18n("Ordered list") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("ol"));
                            },
                        }),
                        // Tool Outdent
                        this.#createTool({
                            command: "outdent",
                            props: { className: "tool tool-outdent", title: MPCEditor.i18n("Outdent") },
                        }),
                        // Tool Indent
                        this.#createTool({
                            command: "indent",
                            props: { className: "tool tool-indent", title: MPCEditor.i18n("Indent") },
                        }),
                    ]
                }),
                // ToolGroup 7
                this.#createToolGroup({
                    props: {
                        className: "tool-group"
                    },
                    nodes: [
                        // Tool Heading 1
                        this.#createTool({
                            props: { className: "tool tool-heading1", title: MPCEditor.i18n("Heading 1") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("h1"));
                            },
                            onClick() {
                                document.execCommand("formatBlock", false, "h1");
                            },
                        }),
                        // Tool Heading 2
                        this.#createTool({
                            props: { className: "tool tool-heading2", title: MPCEditor.i18n("Heading 2") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("h2"));
                            },
                            onClick() {
                                document.execCommand("formatBlock", false, "h2");
                            },
                        }),
                        // Tool Heading 3
                        this.#createTool({
                            props: { className: "tool tool-heading3", title: MPCEditor.i18n("Heading 3") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("h3"));
                            },
                            onClick() {
                                document.execCommand("formatBlock", false, "h3");
                            },
                        }),
                        // Tool Heading 4
                        this.#createTool({
                            props: { className: "tool tool-heading4", title: MPCEditor.i18n("Heading 4") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("h4"));
                            },
                            onClick() {
                                document.execCommand("formatBlock", false, "h4");
                            },
                        }),
                        // Tool Heading 5
                        this.#createTool({
                            props: { className: "tool tool-heading5", title: MPCEditor.i18n("Heading 5") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("h5"));
                            },
                            onClick() {
                                document.execCommand("formatBlock", false, "h5");
                            },
                        }),
                        // Tool Heading 6
                        this.#createTool({
                            props: { className: "tool tool-heading6", title: MPCEditor.i18n("Heading 6") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("h6"));
                            },
                            onClick() {
                                document.execCommand("formatBlock", false, "h6");
                            },
                        }),
                        // Tool Paragraph
                        this.#createTool({
                            props: { className: "tool tool-paragraph", title: MPCEditor.i18n("Paragraph") },
                            onCaretPosition(node, element, button) {
                                button.classList.toggle("active", !!element.closest("p"));
                            },
                            onClick() {
                                document.execCommand("formatBlock", false, "p");
                            },
                        }),
                        MPCHelper.createElement("hr"),
                        // Tool Note
                        this.#createTool({
                            props: { className: "tool tool-note", title: MPCEditor.i18n("Insert note") },
                            onCaretPosition: (node, element, button) => {
                                button.disabled = !!element.closest("section.card,h1,h2,h3,h4,ul,ol,blockquote");
                                button.classList.toggle("active", !!element.closest("section.card"));
                            },
                            onClick() {
                                document.execCommand("insertHTML", false, `<br /><section class="card"><h4><br /></h4><p><br /></p></section><br />`);
                            },
                        }),
                    ]
                }),
                // ToolGroup 8
                this.#createToolGroup({
                    props: {
                        className: "tool-group disabled"
                    },
                    nodes: [
                        // Tool BackColor
                        this.#createTool({
                            tagName: "label",
                            props: { className: "tool tool-backColor", title: MPCEditor.i18n("Note color") },
                            nodes: [
                                this.#createTool({
                                    tagName: "input",
                                    props: { type: "color" },
                                    onCaretPosition: (node, element, tool) => {
                                        let card = element.closest("section.card");
                                        if (card) {
                                            tool.value = tool.parentElement.style.borderColor = getComputedStyle(card).backgroundColor;
                                        }
                                    },
                                    callback: input => {
                                        input.setAttribute("list", "datalist-noteColor");
                                        input.addEventListener("input", () => {
                                            input.parentElement.style.borderColor = input.value;
                                            let element = this.#shadowRoot.getSelection().getRangeAt(0).commonAncestorContainer;
                                            if (element && (element instanceof HTMLElement || (element = element.parentElement))) {
                                                let card = element.closest("section.card");
                                                let color = new MPColor(input.value);
                                                card.style.setProperty("--backColor", color.toRGB());
                                                if (color.lightness > 0.5) {
                                                    color.lightness -= 0.7;
                                                    card.style.color = "#000";
                                                }
                                                else {
                                                    color.lightness += 0.7;
                                                    card.style.color = "#fff";
                                                }
                                                card.style.setProperty("--color", color.toRGB());
                                                color.alpha = 136 / 255;
                                                card.style.setProperty("--shadowColor", color.toRGBA());
                                            }
                                        });
                                    }
                                }),
                                MPCHelper.createElement("datalist", { id: "datalist-noteColor" }, [
                                    new Option("weiss", "#ffffff"),
                                    new Option("grau", "#eeeeee"),
                                    new Option("rot", "#ffeeee"),
                                    new Option("gelb", "#ffffee"),
                                    new Option("gr??n", "#eeffee"),
                                    new Option("t??rkis", "#eeffff"),
                                    new Option("blau", "#eeeeff"),
                                    new Option("pink", "#ffeeff"),
                                ])
                            ],
                        }),
                        // Tool AlingLeft
                        this.#createTool({
                            props: { className: "tool tool-alignLeft", title: MPCEditor.i18n("Align left") },
                            onCaretPosition(node, element, tool) {
                                tool.classList.toggle("active", !!element.closest("section.card.alignLeft"));
                            },
                            onClick(node, element) {
                                let card = element.closest("section.card");
                                if (card) {
                                    card.classList.remove("alignCenter", "alignRight");
                                    card.classList.add("alignLeft");
                                }
                            },
                        }),
                        // Tool AlignCenter
                        this.#createTool({
                            props: { className: "tool tool-alignCenter", title: MPCEditor.i18n("Align center") },
                            onCaretPosition(node, element, tool) {
                                tool.classList.toggle("active", !!element.closest("section.card.alignCenter"));
                            },
                            onClick(node, element) {
                                let card = element.closest("section.card");
                                if (card) {
                                    card.classList.remove("alignLeft", "alignRight");
                                    card.classList.add("alignCenter");
                                }
                            },
                        }),
                        // Tool AlignRight
                        this.#createTool({
                            props: { className: "tool tool-alignRight", title: MPCEditor.i18n("Align right") },
                            onCaretPosition(node, element, tool) {
                                tool.classList.toggle("active", !!element.closest("section.card.alignRight"));
                            },
                            onClick(node, element) {
                                let card = element.closest("section.card");
                                if (card) {
                                    card.classList.remove("alignLeft", "alignCenter");
                                    card.classList.add("alignRight");
                                }
                            },
                        }),
                        // Tool AlignNone
                        this.#createTool({
                            props: { className: "tool tool-alignNone", title: MPCEditor.i18n("Align none") },
                            onCaretPosition(node, element, tool) {
                                tool.classList.toggle("active", !!element.closest("section.card:not(.alignLeft,.alignCenter,.alignRight)"));
                            },
                            onClick(node, element) {
                                let card = element.closest("section.card");
                                if (card) {
                                    card.classList.remove("alignLeft", "alignCenter", "alignRight");
                                }
                            },
                        }),
                    ],
                    onCaretPosition: (node, element, div) => {
                        let card = element.closest("section.card");
                        div.classList.toggle("disabled", !card);
                    }
                }),
            ])
        ]), 
        // Content
        MPCHelper.createElement("slot", { className: "content static" }), 
        // EditableContent
        this.#editableContent, 
        // Keyboard Support
        MPCHelper.createElement("slot", { className: "keyboard", name: "keyboard" }));
    }
    set lang(value) {
        if (this.langs.includes(value)) {
            if (value) {
                this.setAttribute("lang", value);
            }
            else {
                this.removeAttribute("lang");
            }
        }
    }
    get lang() {
        if (this.hasAttribute("lang")) {
            return this.getAttribute("lang");
        }
        let parent = this;
        while (parent = parent.parentElement) {
            if (parent.lang) {
                return parent.lang;
            }
        }
        return "";
    }
    get lastModified() {
        if (this.getAttribute("last-modified")) {
            return new Date(this.getAttribute("last-modified"));
        }
        return null;
    }
    set lastModified(value) {
        if (value) {
            this.setAttribute("last-modified", new Date(value).toUTCString());
        }
        else {
            this.removeAttribute("last-modified");
        }
    }
    get langs() {
        return Array.from(this.children, (element) => element.lang).filter(a => a);
    }
    get edit() {
        return this.hasAttribute("edit");
    }
    set edit(value) {
        if (value === "true" || value === true) {
            this.setAttribute("edit", "");
        }
        else {
            this.removeAttribute("edit");
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "edit":
                if (newValue != null) {
                    if (this.langs.length == 0) {
                        this.appendChild(MPCHelper.createElement("div", { lang: this.lang }, Array.from(this.children)));
                    }
                    this.#editableContent.innerHTML = "<br/>" + this.querySelector(`:scope>:lang(${this.lang})`).innerHTML + "<br/>";
                    this.#editableContent.lang = this.lang;
                }
                break;
            case "lang":
                if (newValue) {
                    this.#styleElement.textContent = `.content > [lang]:not(:lang(${newValue})), :host(mpc-editor) ::slotted([lang]:not(:lang(${newValue}))) { display: none; }`;
                }
                break;
            case "inputmode":
                this.#editableContent.inputMode = newValue;
                break;
        }
    }
}
customElements.define("mpc-editor", MPCEditor);
// const MPCEditorPlugin = MPCEditor.MPCEditorPlugin;
// type MPCEditorPlugin = typeof MPCEditor.MPCEditorPlugin["prototype"];
// class MPCEditorNotePlugin extends MPCEditorPlugin {
//   constructor() {
//     super();
//   }
// }
const MPCHelper = new class MPCHelper extends EventTarget {
    createElement(tagName, props = null, nodes = null, styles = null, callback = null) {
        let elm = document.createElement(tagName);
        if (props) {
            Object.keys(props).forEach(propertyName => elm[propertyName] = props[propertyName]);
        }
        if (nodes) {
            if (typeof nodes == "string" || nodes instanceof Node) {
                elm.append(nodes);
            }
            else {
                elm.append(...nodes.filter(node => node));
            }
        }
        if (styles) {
            Object.keys(styles).forEach(propertyName => elm.style[propertyName] = styles[propertyName]);
        }
        if (typeof callback == "function") {
            callback(elm);
        }
        return elm;
    }
    createInput(options, props = {}, styles = null, callback = null) {
        if (props === null) {
            props = {};
        }
        let type = options.type;
        delete options.type;
        if (type == "hidden") {
            return this.createElement("input", { type, ...options, ...props });
        }
        let form = options.form;
        delete options.form;
        let list = props["list"];
        delete props["list"];
        let listId = (options.id || options.name) ? (options.id || options.name) + "-list" : "list-" + (Date.now() + Math.random()).toString().replace(".", "-");
        let label = this.createElement("label", {
            className: "label label-input label-" + type
        }, [
            this.createElement("input", {
                className: "label-input",
                type,
                ...options,
                ...props
            }, null, null, input => {
                if (form) {
                    input.setAttribute("form", form);
                }
                if (list) {
                    if (typeof list == "string") {
                        input.setAttribute("list", list);
                    }
                    else {
                        input.setAttribute("list", listId);
                    }
                }
            }),
            this.createElement("span", {
                className: "label-text",
                textContent: options.text
            }),
        ], styles, callback);
        if (list && typeof list != "string") {
            label.appendChild(this.createElement("datalist", {
                id: listId
            }, list.map(opt => {
                if (typeof opt == "string") {
                    return new Option(opt, opt);
                }
                return opt;
            })));
        }
        return label;
    }
    createButton(options, props = null, styles = null, callback = null) {
        return this.createElement("button", {
            className: "label label-button" + (options.icon ? " label-icon label-icon-" + options.icon : ""),
            ...props
        }, this.createElement("span", {
            className: "label-text",
            textContent: options.text
        }), styles, button => {
            if (options.form) {
                button.setAttribute("form", options.form);
            }
            if (typeof callback == "function") {
                callback(button);
            }
        });
    }
    createDialog(options = {
        headerText: "MPCHelper Dialog",
        okText: "Ok",
        cancelText: "Cancel",
        closeCallback: () => null
    }, props = null, nodes = null, styles = null, callback = null) {
        return this.createElement("dialog", Object.assign({
            className: "dialog"
        }, props), this.createElement("form", { className: "dialog-form", method: "dialog" }, [
            this.createElement("header", { className: "dialog-header" }, [
                this.createElement("h3", null, options.headerText, { textAlign: "center" })
            ]),
            ...(nodes instanceof Array ? nodes : [nodes]),
            this.createElement("footer", { className: "dialog-footer" }, this.createElement("div", { className: "label-group" }, [
                this.createButton({ icon: "check", text: options.okText }, { type: "submit", title: options.okText }),
                this.createButton({ icon: "close", text: options.cancelText }, { type: "reset", title: options.cancelText }),
            ]))
        ], null, form => {
            form.addEventListener("submit", () => {
                let dialog = form.parentElement;
                if (dialog instanceof HTMLDialogElement) {
                    dialog.returnValue = Array.from(new FormData(form), a => a.map(b => encodeURIComponent(b instanceof File ? URL.createObjectURL(b) : b)).join("=")).join("&");
                    dialog.close();
                }
            });
            form.addEventListener("reset", () => {
                let dialog = form.parentElement;
                if (dialog instanceof HTMLDialogElement) {
                    dialog.returnValue = "";
                    dialog.close();
                }
            });
        }), Object.assign({}, styles), dialog => {
            dialog.addEventListener("click", (event) => {
                if (!document.activeElement ||
                    event.target instanceof HTMLInputElement ||
                    event.target instanceof HTMLTextAreaElement ||
                    event.target instanceof HTMLSelectElement ||
                    event.target instanceof HTMLButtonElement ||
                    event.target.isContentEditable) {
                }
                else {
                    document.activeElement.blur();
                }
            });
            if (typeof callback == "function") {
                callback(dialog);
            }
        });
    }
    registerI18n(lang, context, strings) {
        let _lang = this.#i18nLangs.get(lang) || new Map();
        let _context = _lang.get(context) || new Map();
        if (strings instanceof Map) {
            strings.forEach((value, key) => {
                _context.set(key, value);
            });
        }
        else {
            for (let a in strings) {
                _context.set(a, strings[a]);
            }
        }
        _lang.set(context, _context);
        this.#i18nLangs.set(lang, _lang);
    }
    #i18nLangs = new Map([["eng", new Map()]]);
    #i18nCurrentLang = null;
    #i18nLang = null;
    get lang() {
        return this.#i18nLang;
    }
    set lang(value) {
        if (value != this.#i18nLang) {
            if (document.body) {
                document.documentElement.classList.add("langchange");
            }
            document.documentElement.lang = value;
            this.#i18nLang = value;
            if (!this.#i18nLangs.has(value)) {
                this.#i18nLangs.set(value, new Map());
            }
            this.#i18nCurrentLang = this.#i18nLangs.get(value);
            this.dispatchEvent(new Event("langchange", { cancelable: false }));
            if (document.body) {
                requestAnimationFrame(() => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
                    document.documentElement.classList.remove("langchange");
                })))), navigator.userAgent.toLowerCase().includes("mobile") ? 1200 : 0));
            }
        }
    }
    get langs() {
        return Array.from(this.#i18nLangs.keys());
    }
    i18n(string, context) {
        if (this.#i18nCurrentLang.has(context) &&
            this.#i18nCurrentLang.get(context).has(string)) {
            return this.#i18nCurrentLang.get(context).get(string);
        }
        return string ? string.toString() : Object.prototype.toString.call(string);
    }
    constructor() {
        super();
        let properties = new URLSearchParams(location.search);
        this.lang = properties.get("lang") || document.documentElement.lang;
    }
};
let InputText;
(() => {
    let _show = HTMLDialogElement.prototype.show;
    function show(promise = false) {
        if (promise) {
            return new Promise(resolve => {
                let removeDialog = false;
                if (!this.parentElement) {
                    document.body.appendChild(this);
                    removeDialog = true;
                }
                this.addEventListener("close", event => {
                    resolve(this.returnValue);
                    if (removeDialog) {
                        this.remove();
                    }
                }, {
                    once: true
                });
                _show.call(this);
            });
        }
        else {
            _show.call(this);
        }
    }
    HTMLDialogElement.prototype.show = show;
    let _showModal = HTMLDialogElement.prototype.showModal;
    function showModal(promise = false) {
        if (promise) {
            return new Promise(resolve => {
                let removeDialog = false;
                if (!this.parentElement) {
                    document.body.appendChild(this);
                    removeDialog = true;
                }
                this.addEventListener("close", event => {
                    resolve(this.returnValue);
                    if (removeDialog) {
                        this.remove();
                    }
                }, {
                    once: true
                });
                _showModal.call(this);
            });
        }
        else {
            _showModal.call(this);
        }
    }
    HTMLDialogElement.prototype.showModal = showModal;
})();
const MPCLangMap = new Map(
// Data from https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Languages/List_of_ISO_639-3_language_codes_(2019)
`
[aaa] Ghotuo, [aab] Alumu-Tesu, [aac] Ari, [aad] Amal language, [aae] Arb??resh?? Albanian, [aaf] Aranadan, [aag] Ambrak, [aah] Abu' Arapesh, [aai] Arifama-Miniafia, [aak] Ankave, [aal] Afade, [aan] Anamb??, [aao] Algerian Saharan Arabic, [aap] Par?? Ar??ra, [aaq] Eastern Abnaki, [aar] Afar, [aas] Aas??x, [aat] Arvanitika Albanian, [aau] Abau, [aaw] Solong, [aax] Mandobo Atas, [aaz] Amarasi, [aba] Ab??, [abb] Bankon, [abc] Ambala Ayta, [abd] Manide, [abe] Western Abnaki, [abf] Abai Sungai, [abg] Abaga, [abh] Tajiki Arabic, [abi] Abidji, [abj] Aka-Bea, [abk] Abkhazian, [abl] Lampung Nyo, [abm] Abanyom, [abn] Abua, [abo] Abon, [abp] Abellen Ayta, [abq] Abaza, [abr] Abron, [abs] Ambonese Malay, [abt] Ambulas, [abu] Abure, [abv] Baharna Arabic, [abw] Pal, [abx] Inabaknon, [aby] Aneme Wake, [abz] Abui, [aca] Achagua, [acb] ??nc??, [acd] Gikyode, [ace] Achinese, [acf] Saint Lucian Creole French, [ach] Acholi, [aci] Aka-Cari, [ack] Aka-Kora, [acl] Akar-Bale, [acm] Mesopotamian Arabic, [acn] Achang, [acp] Eastern Acipa, [acq] Ta'izzi-Adeni Arabic, [acr] Achi, [acs] Acro??, [act] Achterhoeks, [acu] Achuar-Shiwiar, [acv] Achumawi, [acw] Hijazi Arabic, [acx] Omani Arabic, [acy] Cypriot Arabic, [acz] Acheron, [ada] Adangme, [adb] Adabe, [add] Dzodinka, [add] Lidzonka, [ade] Adele, [adf] Dhofari Arabic, [adg] Andegerebinha, [adh] Adhola, [adi] Adi, [adj] Adioukrou, [adl] Galo, [adn] Adang, [ado] Abu, [adq] Adangbe, [adr] Adonara, [ads] Adamorobe Sign Language, [adt] Adnyamathanha, [adu] Aduge, [adw] Amundava, [adx] Amdo Tibetan, [ady] Adygei, [ady] Adyghe, [adz] Adzera, [aea] Areba, [aeb] Tunisian Arabic, [aec] Saidi Arabic, [aed] Argentine Sign Language, [aee] Northeast Pashai, [aee] Northeast Pashayi, [aek] Haeke, [ael] Ambele, [aem] Arem, [aen] Armenian Sign Language, [aeq] Aer, [aer] Eastern Arrernte, [aes] Alsea, [aeu] Akeu, [aew] Ambakich, [aey] Amele, [aez] Aeka, [afb] Gulf Arabic, [afd] Andai, [afe] Putukwam, [afg] Afghan Sign Language, [afh] Afrihili, [afi] Akrukay, [afi] Chini, [afk] Nanubae, [afn] Defaka, [afo] Eloyi, [afp] Tapei, [afr] Afrikaans, [afs] Afro-Seminole Creole, [aft] Afitti, [afu] Awutu, [afz] Obokuitai, [aga] Aguano, [agb] Legbo, [agc] Agatu, [agd] Agarabi, [age] Angal, [agf] Arguni, [agg] Angor, [agh] Ngelima, [agi] Agariya, [agj] Argobba, [agk] Isarog Agta, [agl] Fembe, [agm] Angaataha, [agn] Agutaynen, [ago] Tainae, [agq] Aghem, [agr] Aguaruna, [ags] Esimbi, [agt] Central Cagayan Agta, [agu] Aguacateco, [agv] Remontado Dumagat, [agw] Kahua, [agx] Aghul, [agy] Southern Alta, [agz] Mt. Iriga Agta, [aha] Ahanta, [ahb] Axamb, [ahg] Qimant, [ahh] Aghu, [ahi] Tiagbamrin Aizi, [ahk] Akha, [ahl] Igo, [ahm] Mobumrin Aizi, [ahn] ??h??n, [aho] Ahom, [ahp] Aproumu Aizi, [ahr] Ahirani, [ahs] Ashe, [aht] Ahtena, [aia] Arosi, [aib] Ainu (China), [aic] Ainbai, [aid] Alngith, [aie] Amara, [aif] Agi, [aig] Antigua and Barbuda Creole English, [aih] Ai-Cham, [aii] Assyrian Neo-Aramaic, [aij] Lishanid Noshan, [aik] Ake, [ail] Aimele, [aim] Aimol, [ain] Ainu (Japan), [aio] Aiton, [aip] Burumakok, [aiq] Aimaq, [air] Airoran, [ais] Nataoran Amis, [ait] Arikem, [aiw] Aari, [aix] Aighon, [aiy] Ali, [aja] Aja (South Sudan), [ajg] Aja (Benin), [aji] Aji??, [ajn] Andajin, [ajp] South Levantine Arabic, [ajt] Judeo-Tunisian Arabic, [aju] Judeo-Moroccan Arabic, [ajw] Ajawa, [ajz] Amri Karbi, [aka] Akan, [akb] Batak Angkola, [akc] Mpur, [akd] Ukpet-Ehom, [ake] Akawaio, [akf] Akpa, [akg] Anakalangu, [akh] Angal Heneng, [aki] Aiome, [akj] Aka-Jeru, [akk] Akkadian, [akl] Aklanon, [akm] Aka-Bo, [ako] Akurio, [akp] Siwu, [akq] Ak, [akr] Araki, [aks] Akaselem, [akt] Akolet, [aku] Akum, [akv] Akhvakh, [akw] Akwa, [akx] Aka-Kede, [aky] Aka-Kol, [akz] Alabama, [ala] Alago, [alc] Qawasqar, [ald] Alladian, [ale] Aleut, [alf] Alege, [alh] Alawa, [ali] Amaimon, [alj] Alangan, [alk] Alak, [all] Allar, [alm] Amblong, [aln] Gheg Albanian, [alo] Larike-Wakasihu, [alp] Alune, [alq] Algonquin, [alr] Alutor, [als] Tosk Albanian, [alt] Southern Altai, [alu] 'Are'are, [alw] Alaba-K???abeena, [alw] Wanbasana, [alx] Amol, [aly] Alyawarr, [alz] Alur, [ama] Amanay??, [amb] Ambo, [amc] Amahuaca, [ame] Yanesha', [amf] Hamer-Banna, [amg] Amurdak, [amh] Amharic, [ami] Amis, [amj] Amdang, [amk] Ambai, [aml] War-Jaintia, [amm] Ama (Papua New Guinea), [amn] Amanab, [amo] Amo, [amp] Alamblak, [amq] Amahai, [amr] Amarakaeri, [ams] Southern Amami-Oshima, [amt] Amto, [amu] Guerrero Amuzgo, [amv] Ambelau, [amw] Western Neo-Aramaic, [amx] Anmatyerre, [amy] Ami, [amz] Atampaya, [ana] Andaqui, [anb] Andoa, [anc] Ngas, [and] Ansus, [ane] X??r??c????, [anf] Animere, [ang] Old English (ca. 450-1100), [anh] Nend, [ani] Andi, [anj] Anor, [ank] Goemai, [anl] Anu-Hkongso Chin, [anm] Anal, [ann] Obolo, [ano] Andoque, [anp] Angika, [anq] Jarawa (India), [anr] Andh, [ans] Anserma, [ant] Antakarinya, [anu] Anuak, [anv] Denya, [anw] Anaang, [anx] Andra-Hus, [any] Anyin, [anz] Anem, [aoa] Angolar, [aob] Abom, [aoc] Pemon, [aod] Andarum, [aoe] Angal Enen, [aof] Bragat, [aog] Angoram, [aoh] Arma, [aoi] Anindilyakwa, [aoj] Mufian, [aok] Arh??, [aol] Alor, [aom] ??mie, [aon] Bumbita Arapesh, [aor] Aore, [aos] Taikat, [aot] A'tong, [aot] Atong (India), [aou] A'ou, [aox] Atorada, [aoz] Uab Meto, [apb] Sa'a, [apc] North Levantine Arabic, [apd] Sudanese Arabic, [ape] Bukiyip, [apf] Pahanan Agta, [apg] Ampanang, [aph] Athpariya, [api] Apiak??, [apj] Jicarilla Apache, [apk] Kiowa Apache, [apl] Lipan Apache, [apm] Mescalero-Chiricahua Apache, [apn] Apinay??, [apo] Ambul, [app] Apma, [apq] A-Pucikwar, [apr] Arop-Lokep, [aps] Arop-Sissano, [apt] Apatani, [apu] Apurin??, [apv] Alapmunte, [apw] Western Apache, [apx] Aputai, [apy] Apala??, [apz] Safeyoka, [aqc] Archi, [aqd] Ampari Dogon, [aqg] Arigidi, [aqm] Atohwaim, [aqn] Northern Alta, [aqp] Atakapa, [aqr] Arh??, [aqt] Angait??, [aqz] Akuntsu, [ara] Arabic, [arb] Standard Arabic, [arc] Imperial Aramaic (700-300 BCE), [arc] Official Aramaic (700-300 BCE), [ard] Arabana, [are] Western Arrarnta, [arg] Aragonese, [arh] Arhuaco, [ari] Arikara, [arj] Arapaso, [ark] Arikap??, [arl] Arabela, [arn] Mapuche, [arn] Mapudungun, [aro] Araona, [arp] Arapaho, [arq] Algerian Arabic, [arr] Karo (Brazil), [ars] Najdi Arabic, [aru] Araw??, [aru] Aru?? (Amazonas State), [arv] Arbore, [arw] Arawak, [arx] Aru?? (Rodonia State), [ary] Moroccan Arabic, [arz] Egyptian Arabic, [asa] Asu (Tanzania), [asb] Assiniboine, [asc] Casuarina Coast Asmat, [asd] Asas, [ase] American Sign Language, [asf] Auslan, [asf] Australian Sign Language, [asg] Cishingini, [ash] Abishira, [asi] Buruwai, [asj] Sari, [ask] Ashkun, [asl] Asilulu, [asm] Assamese, [asn] Xing?? Asurin??, [aso] Dano, [asp] Algerian Sign Language, [asq] Austrian Sign Language, [asr] Asuri, [ass] Ipulo, [ast] Asturian, [ast] Asturleonese, [ast] Bable, [ast] Leonese, [asu] Tocantins Asurini, [asv] Asoa, [asw] Australian Aborigines Sign Language, [asx] Muratayak, [asy] Yaosakor Asmat, [asz] As, [ata] Pele-Ata, [atb] Zaiwa, [atc] Atsahuaca, [atd] Ata Manobo, [ate] Atemble, [atg] Ivbie North-Okpela-Arhe, [ati] Atti??, [atj] Atikamekw, [atk] Ati, [atl] Mt. Iraya Agta, [atm] Ata, [atn] Ashtiani, [ato] Atong (Cameroon), [atp] Pudtol Atta, [atq] Aralle-Tabulahan, [atr] Waimiri-Atroari, [ats] Gros Ventre, [att] Pamplona Atta, [atu] Reel, [atv] Northern Altai, [atw] Atsugewi, [atx] Arutani, [aty] Aneityum, [atz] Arta, [aua] Asumboa, [aub] Alugu, [auc] Waorani, [aud] Anuta, [aug] Aguna, [auh] Aushi, [aui] Anuki, [auj] Awjilah, [auk] Heyo, [aul] Aulua, [aum] Asu (Nigeria), [aun] Molmo One, [auo] Auyokawa, [aup] Makayam, [auq] Anus, [auq] Korur, [aur] Aruek, [aut] Austral, [auu] Auye, [auw] Awyi, [aux] Aur??, [auy] Awiyaana, [auz] Uzbeki Arabic, [ava] Avaric, [avb] Avau, [avd] Alviri-Vidari, [ave] Avestan, [avi] Avikam, [avk] Kotava, [avl] Eastern Egyptian Bedawi Arabic, [avm] Angkamuthi, [avn] Avatime, [avo] Agavotaguerra, [avs] Aushiri, [avt] Au, [avu] Avokaya, [avv] Av??-Canoeiro, [awa] Awadhi, [awb] Awa (Papua New Guinea), [awc] Cicipu, [awe] Awet??, [awg] Anguthimri, [awh] Awbono, [awi] Aekyom, [awk] Awabakal, [awm] Arawum, [awn] Awngi, [awo] Awak, [awr] Awera, [aws] South Awyu, [awt] Arawet??, [awu] Central Awyu, [awv] Jair Awyu, [aww] Awun, [awx] Awara, [awy] Edera Awyu, [axb] Abipon, [axe] Ayerrerenge, [axg] Mato Grosso Ar??ra, [axk] Yaka (Central African Republic), [axl] Lower Southern Aranda, [axm] Middle Armenian, [axx] X??r??gur??, [aya] Awar, [ayb] Ayizo Gbe, [ayc] Southern Aymara, [ayd] Ayabadhu, [aye] Ayere, [ayg] Ginyanga, [ayh] Hadrami Arabic, [ayi] Leyigha, [ayk] Akuku, [ayl] Libyan Arabic, [aym] Aymara, [ayn] Sanaani Arabic, [ayo] Ayoreo, [ayp] North Mesopotamian Arabic, [ayq] Ayi (Papua New Guinea), [ayr] Central Aymara, [ays] Sorsogon Ayta, [ayt] Magbukun Ayta, [ayu] Ayu, [ayy] Tayabas Ayta, [ayz] Mai Brat, [aza] Azha, [azb] South Azerbaijani, [azd] Eastern Durango Nahuatl, [aze] Azerbaijani, [azg] San Pedro Amuzgos Amuzgo, [azj] North Azerbaijani, [azm] Ipalapa Amuzgo, [azn] Western Durango Nahuatl, [azo] Awing, [azt] Faire Atta, [azz] Highland Puebla Nahuatl
[baa] Babatana, [bab] Bainouk-Gunyu??o, [bac] Badui, [bae] Bar??, [baf] Nubaca, [bag] Tuki, [bah] Bahamas Creole English, [baj] Barakai, [bak] Bashkir, [bal] Baluchi, [bam] Bambara, [ban] Balinese, [bao] Waimaha, [bap] Bantawa, [bar] Bavarian, [bas] Basa (Cameroon), [bau] Bada (Nigeria), [bav] Vengo, [baw] Bambili-Bambui, [bax] Bamun, [bay] Batuley, [bba] Baatonum, [bbb] Barai, [bbc] Batak Toba, [bbd] Bau, [bbe] Bangba, [bbf] Baibai, [bbg] Barama, [bbh] Bugan, [bbi] Barombi, [bbj] Ghom??l??', [bbk] Babanki, [bbl] Bats, [bbm] Babango, [bbn] Uneapa, [bbo] Konab??r??, [bbo] Northern Bobo Madar??, [bbp] West Central Banda, [bbq] Bamali, [bbr] Girawa, [bbs] Bakpinka, [bbt] Mburku, [bbu] Kulung (Nigeria), [bbv] Karnai, [bbw] Baba, [bbx] Bubia, [bby] Befang, [bbz] Babalia Creole Arabic, [bca] Central Bai, [bcb] Bainouk-Samik, [bcc] Southern Balochi, [bcd] North Babar, [bce] Bamenyam, [bcf] Bamu, [bcg] Baga Pokur, [bch] Bariai, [bci] Baoul??, [bcj] Bardi, [bck] Bunaba, [bcl] Central Bikol, [bcm] Bannoni, [bcn] Bali (Nigeria), [bco] Kaluli, [bcp] Bali (Democratic Republic of Congo), [bcq] Bench, [bcr] Babine, [bcs] Kohumono, [bct] Bendi, [bcu] Awad Bing, [bcv] Shoo-Minda-Nye, [bcw] Bana, [bcy] Bacama, [bcz] Bainouk-Gunyaamolo, [bda] Bayot, [bdb] Basap, [bdc] Ember??-Baud??, [bdd] Bunama, [bde] Bade, [bdf] Biage, [bdg] Bonggi, [bdh] Baka (South Sudan), [bdi] Burun, [bdj] Bai, [bdj] Bai (South Sudan), [bdk] Budukh, [bdl] Indonesian Bajau, [bdm] Buduma, [bdn] Baldemu, [bdo] Morom, [bdp] Bende, [bdq] Bahnar, [bdr] West Coast Bajau, [bds] Burunge, [bdt] Bokoto, [bdu] Oroko, [bdv] Bodo Parja, [bdw] Baham, [bdx] Budong-Budong, [bdy] Bandjalang, [bdz] Badeshi, [bea] Beaver, [beb] Bebele, [bec] Iceve-Maci, [bed] Bedoanas, [bee] Byangsi, [bef] Benabena, [beg] Belait, [beh] Biali, [bei] Bekati', [bej] Bedawiyet, [bej] Beja, [bek] Bebeli, [bel] Belarusian, [bem] Bemba (Zambia), [ben] Bengali, [beo] Beami, [bep] Besoa, [beq] Beembe, [bes] Besme, [bet] Guiberoua B??te, [beu] Blagar, [bev] Daloa B??t??, [bew] Betawi, [bex] Jur Modo, [bey] Beli (Papua New Guinea), [bez] Bena (Tanzania), [bfa] Bari, [bfb] Pauri Bareli, [bfc] Northern Bai, [bfc] Panyi Bai, [bfd] Bafut, [bfe] Betaf, [bfe] Tena, [bff] Bofi, [bfg] Busang Kayan, [bfh] Blafe, [bfi] British Sign Language, [bfj] Bafanji, [bfk] Ban Khor Sign Language, [bfl] Banda-Nd??l??, [bfm] Mmen, [bfn] Bunak, [bfo] Malba Birifor, [bfp] Beba, [bfq] Badaga, [bfr] Bazigar, [bfs] Southern Bai, [bft] Balti, [bfu] Gahri, [bfw] Bondo, [bfx] Bantayanon, [bfy] Bagheli, [bfz] Mahasu Pahari, [bga] Gwamhi-Wuri, [bgb] Bobongko, [bgc] Haryanvi, [bgd] Rathwi Bareli, [bge] Bauria, [bgf] Bangandu, [bgg] Bugun, [bgi] Giangan, [bgj] Bangolan, [bgk] Bit, [bgk] Buxinhua, [bgl] Bo (Laos), [bgn] Western Balochi, [bgo] Baga Koga, [bgp] Eastern Balochi, [bgq] Bagri, [bgr] Bawm Chin, [bgs] Tagabawa, [bgt] Bughotu, [bgu] Mbongno, [bgv] Warkay-Bipim, [bgw] Bhatri, [bgx] Balkan Gagauz Turkish, [bgy] Benggoi, [bgz] Banggai, [bha] Bharia, [bhb] Bhili, [bhc] Biga, [bhd] Bhadrawahi, [bhe] Bhaya, [bhf] Odiai, [bhg] Binandere, [bhh] Bukharic, [bhi] Bhilali, [bhj] Bahing, [bhl] Bimin, [bhm] Bathari, [bhn] Bohtan Neo-Aramaic, [bho] Bhojpuri, [bhp] Bima, [bhq] Tukang Besi South, [bhr] Bara Malagasy, [bhs] Buwal, [bht] Bhattiyali, [bhu] Bhunjia, [bhv] Bahau, [bhw] Biak, [bhx] Bhalay, [bhy] Bhele, [bhz] Bada (Indonesia), [bia] Badimaya, [bib] Bisa, [bib] Bissa, [bic] Bikaru, [bid] Bidiyo, [bie] Bepour, [bif] Biafada, [big] Biangai, [bij] Vaghat-Ya-Bijim-Legeri, [bik] Bikol, [bil] Bile, [bim] Bimoba, [bin] Bini, [bin] Edo, [bio] Nai, [bip] Bila, [biq] Bipi, [bir] Bisorio, [bis] Bislama, [bit] Berinomo, [biu] Biete, [biv] Southern Birifor, [biw] Kol (Cameroon), [bix] Bijori, [biy] Birhor, [biz] Baloi, [bja] Budza, [bjb] Banggarla, [bjc] Bariji, [bje] Biao-Jiao Mien, [bjf] Barzani Jewish Neo-Aramaic, [bjg] Bidyogo, [bjh] Bahinemo, [bji] Burji, [bjj] Kanauji, [bjk] Barok, [bjl] Bulu (Papua New Guinea), [bjm] Bajelani, [bjn] Banjar, [bjo] Mid-Southern Banda, [bjp] Fanamaket, [bjr] Binumarien, [bjs] Bajan, [bjt] Balanta-Ganja, [bju] Busuu, [bjv] Bedjond, [bjw] Bakw??, [bjx] Banao Itneg, [bjy] Bayali, [bjz] Baruga, [bka] Kyak, [bkc] Baka (Cameroon), [bkd] Binukid, [bkd] Talaandig, [bkf] Beeke, [bkg] Buraka, [bkh] Bakoko, [bki] Baki, [bkj] Pande, [bkk] Brokskat, [bkl] Berik, [bkm] Kom (Cameroon), [bkn] Bukitan, [bko] Kwa', [bkp] Boko (Democratic Republic of Congo), [bkq] Bakair??, [bkr] Bakumpai, [bks] Northern Sorsoganon, [bkt] Boloki, [bku] Buhid, [bkv] Bekwarra, [bkw] Bekwel, [bkx] Baikeno, [bky] Bokyi, [bkz] Bungku, [bla] Siksika, [blb] Bilua, [blc] Bella Coola, [bld] Bolango, [ble] Balanta-Kentohe, [blf] Buol, [blg] Balau, [blh] Kuwaa, [bli] Bolia, [blj] Bolongan, [blk] Pa'O, [blk] Pa'o Karen, [bll] Biloxi, [blm] Beli (South Sudan), [bln] Southern Catanduanes Bikol, [blo] Anii, [blp] Blablanga, [blq] Baluan-Pam, [blr] Blang, [bls] Balaesang, [blt] Tai Dam, [blv] Bolo, [blv] Kibala, [blw] Balangao, [blx] Mag-Indi Ayta, [bly] Notre, [blz] Balantak, [bma] Lame, [bmb] Bembe, [bmc] Biem, [bmd] Baga Manduri, [bme] Limassa, [bmf] Bom-Kim, [bmg] Bamwe, [bmh] Kein, [bmi] Bagirmi, [bmj] Bote-Majhi, [bmk] Ghayavi, [bml] Bomboli, [bmm] Northern Betsimisaraka Malagasy, [bmn] Bina (Papua New Guinea), [bmo] Bambalang, [bmp] Bulgebi, [bmq] Bomu, [bmr] Muinane, [bms] Bilma Kanuri, [bmt] Biao Mon, [bmu] Somba-Siawari, [bmv] Bum, [bmw] Bomwali, [bmx] Baimak, [bmz] Baramu, [bna] Bonerate, [bnb] Bookan, [bnc] Bontok, [bnd] Banda (Indonesia), [bne] Bintauna, [bnf] Masiwang, [bng] Benga, [bni] Bangi, [bnj] Eastern Tawbuid, [bnk] Bierebo, [bnl] Boon, [bnm] Batanga, [bnn] Bunun, [bno] Bantoanon, [bnp] Bola, [bnq] Bantik, [bnr] Butmas-Tur, [bns] Bundeli, [bnu] Bentong, [bnv] Beneraf, [bnv] Bonerif, [bnv] Edwas, [bnw] Bisis, [bnx] Bangubangu, [bny] Bintulu, [bnz] Beezen, [boa] Bora, [bob] Aweer, [bod] Tibetan, [boe] Mundabli, [bof] Bolon, [bog] Bamako Sign Language, [boh] Boma, [boi] Barbare??o, [boj] Anjam, [bok] Bonjo, [bol] Bole, [bom] Berom, [bon] Bine, [boo] Tiemac??w?? Bozo, [bop] Bonkiman, [boq] Bogaya, [bor] Bor??ro, [bos] Bosnian, [bot] Bongo, [bou] Bondei, [bov] Tuwuli, [bow] Rema, [box] Buamu, [boy] Bodo (Central African Republic), [boz] Ti??yaxo Bozo, [bpa] Daakaka, [bpb] Barbacoas, [bpd] Banda-Banda, [bpg] Bonggo, [bph] Botlikh, [bpi] Bagupi, [bpj] Binji, [bpk] '??r????, [bpk] Orowe, [bpl] Broome Pearling Lugger Pidgin, [bpm] Biyom, [bpn] Dzao Min, [bpo] Anasi, [bpp] Kaure, [bpq] Banda Malay, [bpr] Koronadal Blaan, [bps] Sarangani Blaan, [bpt] Barrow Point, [bpu] Bongu, [bpv] Bian Marind, [bpw] Bo (Papua New Guinea), [bpx] Palya Bareli, [bpy] Bishnupriya, [bpz] Bilba, [bqa] Tchumbuli, [bqb] Bagusa, [bqc] Boko (Benin), [bqc] Boo, [bqd] Bung, [bqf] Baga Kaloum, [bqg] Bago-Kusuntu, [bqh] Baima, [bqi] Bakhtiari, [bqj] Bandial, [bqk] Banda-Mbr??s, [bql] Bilakura, [bqm] Wumboko, [bqn] Bulgarian Sign Language, [bqo] Balo, [bqp] Busa, [bqq] Biritai, [bqr] Burusu, [bqs] Bosngun, [bqt] Bamukumbit, [bqu] Boguru, [bqv] Begbere-Ejar, [bqv] Koro Wachi, [bqw] Buru (Nigeria), [bqx] Baangi, [bqy] Bengkala Sign Language, [bqz] Bakaka, [bra] Braj, [brb] Lave, [brc] Berbice Creole Dutch, [brd] Baraamu, [bre] Breton, [brf] Bera, [brg] Baure, [brh] Brahui, [bri] Mokpwe, [brj] Bieria, [brk] Birked, [brl] Birwa, [brm] Barambu, [brn] Boruca, [bro] Brokkat, [brp] Barapasi, [brq] Breri, [brr] Birao, [brs] Baras, [brt] Bitare, [bru] Eastern Bru, [brv] Western Bru, [brw] Bellari, [brx] Bodo (India), [bry] Burui, [brz] Bilbil, [bsa] Abinomn, [bsb] Brunei Bisaya, [bsc] Bassari, [bsc] Oniyan, [bse] Wushi, [bsf] Bauchi, [bsg] Bashkardi, [bsh] Kati, [bsi] Bassossi, [bsj] Bangwinji, [bsk] Burushaski, [bsl] Basa-Gumna, [bsm] Busami, [bsn] Barasana-Eduria, [bso] Buso, [bsp] Baga Sitemu, [bsq] Bassa, [bsr] Bassa-Kontagora, [bss] Akoose, [bst] Basketo, [bsu] Bahonsuai, [bsv] Baga Soban??, [bsw] Baiso, [bsx] Yangkam, [bsy] Sabah Bisaya, [bta] Bata, [btc] Bati (Cameroon), [btd] Batak Dairi, [bte] Gamo-Ningi, [btf] Birgit, [btg] Gagnoa B??t??, [bth] Biatah Bidayuh, [bti] Burate, [btj] Bacanese Malay, [btm] Batak Mandailing, [btn] Ratagnon, [bto] Rinconada Bikol, [btp] Budibud, [btq] Batek, [btr] Baetora, [bts] Batak Simalungun, [btt] Bete-Bendi, [btu] Batu, [btv] Bateri, [btw] Butuanon, [btx] Batak Karo, [bty] Bobot, [btz] Batak Alas-Kluet, [bua] Buriat, [bub] Bua, [buc] Bushi, [bud] Ntcham, [bue] Beothuk, [buf] Bushoong, [bug] Buginese, [buh] Younuo Bunu, [bui] Bongili, [buj] Basa-Gurmana, [buk] Bugawac, [bul] Bulgarian, [bum] Bulu (Cameroon), [bun] Sherbro, [buo] Terei, [bup] Busoa, [buq] Brem, [bus] Bokobaru, [but] Bungain, [buu] Budu, [buv] Bun, [buw] Bubi, [bux] Boghom, [buy] Bullom So, [buz] Bukwen, [bva] Barein, [bvb] Bube, [bvc] Baelelea, [bvd] Baeggu, [bve] Berau Malay, [bvf] Boor, [bvg] Bonkeng, [bvh] Bure, [bvi] Belanda Viri, [bvj] Baan, [bvk] Bukat, [bvl] Bolivian Sign Language, [bvm] Bamunka, [bvn] Buna, [bvo] Bolgo, [bvp] Bumang, [bvq] Birri, [bvr] Burarra, [bvt] Bati (Indonesia), [bvu] Bukit Malay, [bvv] Baniva, [bvw] Boga, [bvx] Dibole, [bvy] Baybayanon, [bvz] Bauzi, [bwa] Bwatoo, [bwb] Namosi-Naitasiri-Serua, [bwc] Bwile, [bwd] Bwaidoka, [bwe] Bwe Karen, [bwf] Boselewa, [bwg] Barwe, [bwh] Bishuo, [bwi] Baniwa, [bwj] L???? L???? Bwamu, [bwk] Bauwaki, [bwl] Bwela, [bwm] Biwat, [bwn] Wunai Bunu, [bwo] Borna (Ethiopia), [bwo] Boro (Ethiopia), [bwp] Mandobo Bawah, [bwq] Southern Bobo Madar??, [bwr] Bura-Pabir, [bws] Bomboma, [bwt] Bafaw-Balong, [bwu] Buli (Ghana), [bww] Bwa, [bwx] Bu-Nao Bunu, [bwy] Cwi Bwamu, [bwz] Bwisi, [bxa] Tairaha, [bxb] Belanda Bor, [bxc] Molengue, [bxd] Pela, [bxe] Birale, [bxf] Bilur, [bxf] Minigir, [bxg] Bangala, [bxh] Buhutu, [bxi] Pirlatapa, [bxj] Bayungu, [bxk] Bukusu, [bxk] Lubukusu, [bxl] Jalkunan, [bxm] Mongolia Buriat, [bxn] Burduna, [bxo] Barikanchi, [bxp] Bebil, [bxq] Beele, [bxr] Russia Buriat, [bxs] Busam, [bxu] China Buriat, [bxv] Berakou, [bxw] Bankagooma, [bxz] Binahari, [bya] Batak, [byb] Bikya, [byc] Ubaghara, [byd] Benyadu', [bye] Pouye, [byf] Bete, [byg] Baygo, [byh] Bhujel, [byi] Buyu, [byj] Bina (Nigeria), [byk] Biao, [byl] Bayono, [bym] Bidyara, [byn] Bilin, [byn] Blin, [byo] Biyo, [byp] Bumaji, [byq] Basay, [byr] Baruya, [byr] Yipma, [bys] Burak, [byt] Berti, [byv] Medumba, [byw] Belhariya, [byx] Qaqet, [byz] Banaro, [bza] Bandi, [bzb] Andio, [bzc] Southern Betsimisaraka Malagasy, [bzd] Bribri, [bze] Jenaama Bozo, [bzf] Boikin, [bzg] Babuza, [bzh] Mapos Buang, [bzi] Bisu, [bzj] Belize Kriol English, [bzk] Nicaragua Creole English, [bzl] Boano (Sulawesi), [bzm] Bolondo, [bzn] Boano (Maluku), [bzo] Bozaba, [bzp] Kemberano, [bzq] Buli (Indonesia), [bzr] Biri, [bzs] Brazilian Sign Language, [bzt] Brithenig, [bzu] Burmeso, [bzv] Naami, [bzw] Basa (Nigeria), [bzx] K??l??ngaxo Bozo, [bzy] Obanliku, [bzz] Evant
[caa] Chort??, [cab] Garifuna, [cac] Chuj, [cad] Caddo, [cae] Laalaa, [cae] Lehar, [caf] Southern Carrier, [cag] Nivacl??, [cah] Cahuarano, [caj] Chan??, [cak] Cakchiquel, [cak] Kaqchikel, [cal] Carolinian, [cam] Cemuh??, [can] Chambri, [cao] Ch??cobo, [cap] Chipaya, [caq] Car Nicobarese, [car] Galibi Carib, [cas] Tsiman??, [cat] Catalan, [cat] Valencian, [cav] Cavine??a, [caw] Callawalla, [cax] Chiquitano, [cay] Cayuga, [caz] Canichana, [cbb] Cabiyar??, [cbc] Carapana, [cbd] Carijona, [cbg] Chimila, [cbi] Chachi, [cbj] Ede Cabe, [cbk] Chavacano, [cbl] Bualkhaw Chin, [cbn] Nyahkur, [cbo] Izora, [cbq] Cuba, [cbq] Tsucuba, [cbr] Cashibo-Cacataibo, [cbs] Cashinahua, [cbt] Chayahuita, [cbu] Candoshi-Shapra, [cbv] Cacua, [cbw] Kinabalian, [cby] Carabayo, [cca] Cauca, [ccc] Chamicuro, [ccd] Cafundo Creole, [cce] Chopi, [ccg] Samba Daka, [cch] Atsam, [ccj] Kasanga, [ccl] Cutchi-Swahili, [ccm] Malaccan Creole Malay, [cco] Comaltepec Chinantec, [ccp] Chakma, [ccr] Cacaopera, [cda] Choni, [cde] Chenchu, [cdf] Chiru, [cdg] Chamari, [cdh] Chambeali, [cdi] Chodri, [cdj] Churahi, [cdm] Chepang, [cdn] Chaudangsi, [cdo] Min Dong Chinese, [cdr] Cinda-Regi-Tiyal, [cds] Chadian Sign Language, [cdy] Chadong, [cdz] Koda, [cea] Lower Chehalis, [ceb] Cebuano, [ceg] Chamacoco, [cek] Eastern Khumi Chin, [cen] Cen, [ces] Czech, [cet] Cent????m, [cfa] Dijim-Bwilim, [cfd] Cara, [cfg] Como Karim, [cfm] Falam Chin, [cga] Changriwa, [cgc] Kagayanen, [cgg] Chiga, [cgk] Chocangacakha, [cha] Chamorro, [chb] Chibcha, [chc] Catawba, [chd] Highland Oaxaca Chontal, [che] Chechen, [chf] Tabasco Chontal, [chg] Chagatai, [chh] Chinook, [chj] Ojitl??n Chinantec, [chk] Chuukese, [chl] Cahuilla, [chm] Mari (Russia), [chn] Chinook jargon, [cho] Choctaw, [chp] Chipewyan, [chp] Dene Suline, [chq] Quiotepec Chinantec, [chr] Cherokee, [cht] Chol??n, [chu] Church Slavic, [chu] Church Slavonic, [chu] Old Bulgarian, [chu] Old Church Slavonic, [chu] Old Slavonic, [chv] Chuvash, [chw] Chuwabu, [chx] Chantyal, [chy] Cheyenne, [chz] Ozumac??n Chinantec, [cia] Cia-Cia, [cib] Ci Gbe, [cic] Chickasaw, [cid] Chimariko, [cie] Cineni, [cih] Chinali, [cik] Chitkuli Kinnauri, [cim] Cimbrian, [cin] Cinta Larga, [cip] Chiapanec, [cir] Ham??a, [cir] M??a, [cir] Tiri, [ciw] Chippewa, [ciy] Chaima, [cja] Western Cham, [cje] Chru, [cjh] Upper Chehalis, [cji] Chamalal, [cjk] Chokwe, [cjm] Eastern Cham, [cjn] Chenapian, [cjo] Ash??ninka Pajonal, [cjp] Cab??car, [cjs] Shor, [cjv] Chuave, [cjy] Jinyu Chinese, [ckb] Central Kurdish, [ckh] Chak, [ckl] Cibak, [ckn] Kaang Chin, [cko] Anufo, [ckq] Kajakse, [ckr] Kairak, [cks] Tayo, [ckt] Chukot, [cku] Koasati, [ckv] Kavalan, [ckx] Caka, [cky] Cakfem-Mushere, [ckz] Cakchiquel-Quich?? Mixed Language, [cla] Ron, [clc] Chilcotin, [cld] Chaldean Neo-Aramaic, [cle] Lealao Chinantec, [clh] Chilisso, [cli] Chakali, [clj] Laitu Chin, [clk] Idu-Mishmi, [cll] Chala, [clm] Clallam, [clo] Lowland Oaxaca Chontal, [clt] Lautu Chin, [clu] Caluyanun, [clw] Chulym, [cly] Eastern Highland Chatino, [cma] Maa, [cme] Cerma, [cmg] Classical Mongolian, [cmi] Ember??-Cham??, [cml] Campalagian, [cmm] Michigamea, [cmn] Mandarin Chinese, [cmo] Central Mnong, [cmr] Mro-Khimi Chin, [cms] Messapic, [cmt] Camtho, [cna] Changthang, [cnb] Chinbon Chin, [cnc] C????ng, [cng] Northern Qiang, [cnh] Haka Chin, [cnh] Hakha Chin, [cni] Ash??ninka, [cnk] Khumi Chin, [cnl] Lalana Chinantec, [cno] Con, [cnr] Montenegrin, [cns] Central Asmat, [cnt] Tepetotutla Chinantec, [cnu] Chenoua, [cnw] Ngawn Chin, [cnx] Middle Cornish, [coa] Cocos Islands Malay, [cob] Chicomuceltec, [coc] Cocopa, [cod] Cocama-Cocamilla, [coe] Koreguaje, [cof] Colorado, [cog] Chong, [coh] Chichonyi-Chidzihana-Chikauma, [coh] Chonyi-Dzihana-Kauma, [coj] Cochimi, [cok] Santa Teresa Cora, [col] Columbia-Wenatchi, [com] Comanche, [con] Cof??n, [coo] Comox, [cop] Coptic, [coq] Coquille, [cor] Cornish, [cos] Corsican, [cot] Caquinte, [cou] Wamey, [cov] Cao Miao, [cow] Cowlitz, [cox] Nanti, [coz] Chochotec, [cpa] Palantla Chinantec, [cpb] Ucayali-Yur??a Ash??ninka, [cpc] Ajy??ninka Apurucayali, [cpg] Cappadocian Greek, [cpi] Chinese Pidgin English, [cpn] Cherepon, [cpo] Kpeego, [cps] Capiznon, [cpu] Pichis Ash??ninka, [cpx] Pu-Xian Chinese, [cpy] South Ucayali Ash??ninka, [cqd] Chuanqiandian Cluster Miao, [cra] Chara, [crb] Island Carib, [crc] Lonwolwol, [crd] Coeur d'Alene, [cre] Cree, [crf] Caramanta, [crg] Michif, [crh] Crimean Tatar, [crh] Crimean Turkish, [cri] S??otomense, [crj] Southern East Cree, [crk] Plains Cree, [crl] Northern East Cree, [crm] Moose Cree, [crn] El Nayar Cora, [cro] Crow, [crq] Iyo'wujwa Chorote, [crr] Carolina Algonquian, [crs] Seselwa Creole French, [crt] Iyojwa'ja Chorote, [crv] Chaura, [crw] Chrau, [crx] Carrier, [cry] Cori, [crz] Cruze??o, [csa] Chiltepec Chinantec, [csb] Kashubian, [csc] Catalan Sign Language, [csc] Lengua de se??as catalana, [csc] Llengua de Signes Catalana, [csd] Chiangmai Sign Language, [cse] Czech Sign Language, [csf] Cuba Sign Language, [csg] Chilean Sign Language, [csh] Asho Chin, [csi] Coast Miwok, [csj] Songlai Chin, [csk] Jola-Kasa, [csl] Chinese Sign Language, [csm] Central Sierra Miwok, [csn] Colombian Sign Language, [cso] Sochiapam Chinantec, [cso] Sochiapan Chinantec, [csq] Croatia Sign Language, [csr] Costa Rican Sign Language, [css] Southern Ohlone, [cst] Northern Ohlone, [csv] Sumtu Chin, [csw] Swampy Cree, [csy] Siyin Chin, [csz] Coos, [cta] Tataltepec Chatino, [ctc] Chetco, [ctd] Tedim Chin, [cte] Tepinapa Chinantec, [ctg] Chittagonian, [cth] Thaiphum Chin, [ctl] Tlacoatzintepec Chinantec, [ctm] Chitimacha, [ctn] Chhintange, [cto] Ember??-Cat??o, [ctp] Western Highland Chatino, [cts] Northern Catanduanes Bikol, [ctt] Wayanad Chetti, [ctu] Chol, [ctz] Zacatepec Chatino, [cua] Cua, [cub] Cubeo, [cuc] Usila Chinantec, [cug] Chungmboko, [cug] Cung, [cuh] Chuka, [cuh] Gichuka, [cui] Cuiba, [cuj] Mashco Piro, [cuk] San Blas Kuna, [cul] Culina, [cul] Kulina, [cuo] Cumanagoto, [cup] Cupe??o, [cuq] Cun, [cur] Chhulung, [cut] Teutila Cuicatec, [cuu] Tai Ya, [cuv] Cuvok, [cuw] Chukwa, [cux] Tepeuxila Cuicatec, [cuy] Cuitlatec, [cvg] Chug, [cvn] Valle Nacional Chinantec, [cwa] Kabwa, [cwb] Maindo, [cwd] Woods Cree, [cwe] Kwere, [cwg] Cheq Wong, [cwg] Chewong, [cwt] Kuwaataay, [cya] Nopala Chatino, [cyb] Cayubaba, [cym] Welsh, [cyo] Cuyonon, [czh] Huizhou Chinese, [czk] Knaanic, [czn] Zenzontepec Chatino, [czo] Min Zhong Chinese, [czt] Zotung Chin
[daa] Dangal??at, [dac] Dambi, [dad] Marik, [dae] Duupa, [dag] Dagbani, [dah] Gwahatike, [dai] Day, [daj] Dar Fur Daju, [dak] Dakota, [dal] Dahalo, [dam] Damakawa, [dan] Danish, [dao] Daai Chin, [daq] Dandami Maria, [dar] Dargwa, [das] Daho-Doo, [dau] Dar Sila Daju, [dav] Dawida, [dav] Taita, [daw] Davawenyo, [dax] Dayi, [daz] Dao, [dba] Bangime, [dbb] Deno, [dbd] Dadiya, [dbe] Dabe, [dbf] Edopi, [dbg] Dogul Dom Dogon, [dbi] Doka, [dbj] Ida'an, [dbl] Dyirbal, [dbm] Duguri, [dbn] Duriankere, [dbo] Dulbu, [dbp] Duwai, [dbq] Daba, [dbr] Dabarre, [dbt] Ben Tey Dogon, [dbu] Bondum Dom Dogon, [dbv] Dungu, [dbw] Bankan Tey Dogon, [dby] Dibiyaso, [dcc] Deccan, [dcr] Negerhollands, [dda] Dadi Dadi, [ddd] Dongotono, [dde] Doondo, [ddg] Fataluku, [ddi] West Goodenough, [ddj] Jaru, [ddn] Dendi (Benin), [ddo] Dido, [ddr] Dhudhuroa, [dds] Donno So Dogon, [ddw] Dawera-Daweloor, [dec] Dagik, [ded] Dedua, [dee] Dewoin, [def] Dezfuli, [deg] Degema, [deh] Dehwari, [dei] Demisa, [dek] Dek, [del] Delaware, [dem] Dem, [den] Slave (Athapascan), [dep] Pidgin Delaware, [deq] Dendi (Central African Republic), [der] Deori, [des] Desano, [deu] German, [dev] Domung, [dez] Dengese, [dga] Southern Dagaare, [dgb] Bunoge Dogon, [dgc] Casiguran Dumagat Agta, [dgd] Dagaari Dioula, [dge] Degenan, [dgg] Doga, [dgh] Dghwede, [dgi] Northern Dagara, [dgk] Dagba, [dgl] Andaandi, [dgl] Dongolawi, [dgn] Dagoman, [dgo] Dogri (individual language), [dgr] Dogrib, [dgs] Dogoso, [dgt] Ndra'ngith, [dgu] Degaru, [dgw] Daungwurrung, [dgx] Doghoro, [dgz] Daga, [dhd] Dhundari, [dhg] Dhangu, [dhg] Dhangu-Djangu, [dhg] Djangu, [dhi] Dhimal, [dhl] Dhalandji, [dhm] Zemba, [dhn] Dhanki, [dho] Dhodia, [dhr] Dhargari, [dhs] Dhaiso, [dhu] Dhurga, [dhv] Dehu, [dhv] Drehu, [dhw] Dhanwar (Nepal), [dhx] Dhungaloo, [dia] Dia, [dib] South Central Dinka, [dic] Lakota Dida, [did] Didinga, [dif] Dieri, [dig] Chidigo, [dig] Digo, [dih] Kumiai, [dii] Dimbong, [dij] Dai, [dik] Southwestern Dinka, [dil] Dilling, [dim] Dime, [din] Dinka, [dio] Dibo, [dip] Northeastern Dinka, [diq] Dimli (individual language), [dir] Dirim, [dis] Dimasa, [dit] Dirari, [diu] Diriku, [div] Dhivehi, [div] Divehi, [div] Maldivian, [diw] Northwestern Dinka, [dix] Dixon Reef, [diy] Diuwe, [diz] Ding, [dja] Djadjawurrung, [djb] Djinba, [djc] Dar Daju Daju, [djd] Djamindjung, [dje] Zarma, [djf] Djangun, [dji] Djinang, [djj] Djeebbana, [djk] Businenge Tongo, [djk] Eastern Maroon Creole, [djk] Nenge, [djm] Jamsay Dogon, [djn] Djauan, [djo] Jangkang, [djr] Djambarrpuyngu, [dju] Kapriman, [djw] Djawi, [dka] Dakpakha, [dkk] Dakka, [dkr] Kuijau, [dks] Southeastern Dinka, [dkx] Mazagway, [dlg] Dolgan, [dlk] Dahalik, [dlm] Dalmatian, [dln] Darlong, [dma] Duma, [dmb] Mombo Dogon, [dmc] Gavak, [dmd] Madhi Madhi, [dme] Dugwor, [dmg] Upper Kinabatangan, [dmk] Domaaki, [dml] Dameli, [dmm] Dama, [dmo] Kemedzung, [dmr] East Damar, [dms] Dampelas, [dmu] Dubu, [dmu] Tebi, [dmv] Dumpas, [dmw] Mudburra, [dmx] Dema, [dmy] Demta, [dmy] Sowari, [dna] Upper Grand Valley Dani, [dnd] Daonda, [dne] Ndendeule, [dng] Dungan, [dni] Lower Grand Valley Dani, [dnj] Dan, [dnk] Dengka, [dnn] Dz????ngoo, [dno] Ndrulo, [dno] Northern Lendu, [dnr] Danaru, [dnt] Mid Grand Valley Dani, [dnu] Danau, [dnv] Danu, [dnw] Western Dani, [dny] Den??, [doa] Dom, [dob] Dobu, [doc] Northern Dong, [doe] Doe, [dof] Domu, [doh] Dong, [doi] Dogri (macrolanguage), [dok] Dondo, [dol] Doso, [don] Toura (Papua New Guinea), [doo] Dongo, [dop] Lukpa, [doq] Dominican Sign Language, [dor] Dori'o, [dos] Dogos??, [dot] Dass, [dov] Dombe, [dow] Doyayo, [dox] Bussa, [doy] Dompo, [doz] Dorze, [dpp] Papar, [drb] Dair, [drc] Minderico, [drd] Darmiya, [dre] Dolpo, [drg] Rungus, [dri] C'Lela, [drl] Paakantyi, [drn] West Damar, [dro] Daro-Matu Melanau, [drq] Dura, [drr] Dororo, [drs] Gedeo, [drt] Drents, [dru] Rukai, [dry] Darai, [dsb] Lower Sorbian, [dse] Dutch Sign Language, [dsh] Daasanach, [dsi] Disa, [dsl] Danish Sign Language, [dsn] Dusner, [dso] Desiya, [dsq] Tadaksahak, [dta] Daur, [dtb] Labuk-Kinabatangan Kadazan, [dtd] Ditidaht, [dth] Adithinngithigh, [dti] Ana Tinga Dogon, [dtk] Tene Kan Dogon, [dtm] Tomo Kan Dogon, [dtn] Daats????in, [dto] Tommo So Dogon, [dtp] Central Dusun, [dtp] Kadazan Dusun, [dtr] Lotud, [dts] Toro So Dogon, [dtt] Toro Tegu Dogon, [dtu] Tebul Ure Dogon, [dty] Dotyali, [dua] Duala, [dub] Dubli, [duc] Duna, [dud] Hun-Saare, [due] Umiray Dumaget Agta, [duf] Drubea, [duf] Dumbea, [dug] Chiduruma, [dug] Duruma, [duh] Dungra Bhil, [dui] Dumun, [duk] Uyajitaya, [dul] Alabat Island Agta, [dum] Middle Dutch (ca. 1050-1350), [dun] Dusun Deyah, [duo] Dupaninan Agta, [dup] Duano, [duq] Dusun Malang, [dur] Dii, [dus] Dumi, [duu] Drung, [duv] Duvle, [duw] Dusun Witu, [dux] Duungooma, [duy] Dicamay Agta, [duz] Duli-Gey, [dva] Duau, [dwa] Diri, [dwr] Dawro, [dws] Dutton World Speedwords, [dwu] Dhuwal, [dww] Dawawa, [dwy] Dhuwaya, [dwz] Dewas Rai, [dya] Dyan, [dyb] Dyaberdyaber, [dyd] Dyugun, [dyg] Villa Viciosa Agta, [dyi] Djimini Senoufo, [dym] Yanda Dom Dogon, [dyn] Dyangadi, [dyo] Jola-Fonyi, [dyu] Dyula, [dyy] Dyaabugay, [dza] Tunzu, [dze] Djiwarli, [dzg] Dazaga, [dzl] Dzalakha, [dzn] Dzando, [dzo] Dzongkha
[eaa] Karenggapa, [ebg] Ebughu, [ebk] Eastern Bontok, [ebo] Teke-Ebo, [ebr] Ebri??, [ebu] Embu, [ebu] Kiembu, [ecr] Eteocretan, [ecs] Ecuadorian Sign Language, [ecy] Eteocypriot, [eee] E, [efa] Efai, [efe] Efe, [efi] Efik, [ega] Ega, [egl] Emilian, [ego] Eggon, [egy] Egyptian (Ancient), [ehu] Ehueun, [eip] Eipomek, [eit] Eitiep, [eiv] Askopan, [eja] Ejamat, [eka] Ekajuk, [ekc] Eastern Karnic, [eke] Ekit, [ekg] Ekari, [eki] Eki, [ekk] Standard Estonian, [ekl] Kol, [ekl] Kol (Bangladesh), [ekm] Elip, [eko] Koti, [ekp] Ekpeye, [ekr] Yace, [eky] Eastern Kayah, [ele] Elepi, [elh] El Hugeirat, [eli] Nding, [elk] Elkei, [ell] Modern Greek (1453-), [elm] Eleme, [elo] El Molo, [elu] Elu, [elx] Elamite, [ema] Emai-Iuleha-Ora, [emb] Embaloh, [eme] Emerillon, [emg] Eastern Meohang, [emi] Mussau-Emira, [emk] Eastern Maninkakan, [emm] Mamulique, [emn] Eman, [emp] Northern Ember??, [ems] Pacific Gulf Yupik, [emu] Eastern Muria, [emw] Emplawas, [emx] Erromintxela, [emy] Epigraphic Mayan, [ena] Apali, [enb] Markweeta, [enc] En, [end] Ende, [enf] Forest Enets, [eng] English, [enh] Tundra Enets, [enl] Enlhet, [enm] Middle English (1100-1500), [enn] Engenni, [eno] Enggano, [enq] Enga, [enr] Emem, [enr] Emumu, [enu] Enu, [env] Enwan (Edu State), [enw] Enwan (Akwa Ibom State), [enx] Enxet, [eot] Beti (C??te d'Ivoire), [epi] Epie, [epo] Esperanto, [era] Eravallan, [erg] Sie, [erh] Eruwa, [eri] Ogea, [erk] South Efate, [ero] Horpa, [err] Erre, [ers] Ersu, [ert] Eritai, [erw] Erokwanas, [ese] Ese Ejja, [esg] Aheri Gondi, [esh] Eshtehardi, [esi] North Alaskan Inupiatun, [esk] Northwest Alaska Inupiatun, [esl] Egypt Sign Language, [esm] Esuma, [esn] Salvadoran Sign Language, [eso] Estonian Sign Language, [esq] Esselen, [ess] Central Siberian Yupik, [est] Estonian, [esu] Central Yupik, [esy] Eskayan, [etb] Etebi, [etc] Etchemin, [eth] Ethiopian Sign Language, [etn] Eton (Vanuatu), [eto] Eton (Cameroon), [etr] Edolo, [ets] Yekhee, [ett] Etruscan, [etu] Ejagham, [etx] Eten, [etz] Semimi, [eus] Basque, [eve] Even, [evh] Uvbie, [evn] Evenki, [ewe] Ewe, [ewo] Ewondo, [ext] Extremaduran, [eya] Eyak, [eyo] Keiyo, [eza] Ezaa, [eze] Uzekwe
[faa] Fasu, [fab] Fa d'Ambu, [fad] Wagi, [faf] Fagani, [fag] Finongan, [fah] Baissa Fali, [fai] Faiwol, [faj] Faita, [fak] Fang (Cameroon), [fal] South Fali, [fam] Fam, [fan] Fang (Equatorial Guinea), [fao] Faroese, [fap] Paloor, [far] Fataleka, [fas] Persian, [fat] Fanti, [fau] Fayu, [fax] Fala, [fay] Southwestern Fars, [faz] Northwestern Fars, [fbl] West Albay Bikol, [fcs] Quebec Sign Language, [fer] Feroge, [ffi] Foia Foia, [ffm] Maasina Fulfulde, [fgr] Fongoro, [fia] Nobiin, [fie] Fyer, [fij] Fijian, [fil] Filipino, [fil] Pilipino, [fin] Finnish, [fip] Fipa, [fir] Firan, [fit] Tornedalen Finnish, [fiw] Fiwaga, [fkk] Kirya-Konz??l, [fkv] Kven Finnish, [fla] Kalispel-Pend d'Oreille, [flh] Foau, [fli] Fali, [fll] North Fali, [fln] Flinders Island, [flr] Fuliiru, [fly] Flaaitaal, [fly] Tsotsitaal, [fmp] Fe'fe', [fmu] Far Western Muria, [fnb] Fanbak, [fng] Fanagalo, [fni] Fania, [fod] Foodo, [foi] Foi, [fom] Foma, [fon] Fon, [for] Fore, [fos] Siraya, [fpe] Fernando Po Creole English, [fqs] Fas, [fra] French, [frc] Cajun French, [frd] Fordata, [frk] Frankish, [frm] Middle French (ca. 1400-1600), [fro] Old French (842-ca. 1400), [frp] Arpitan, [frp] Francoproven??al, [frq] Forak, [frr] Northern Frisian, [frs] Eastern Frisian, [frt] Fortsenal, [fry] Western Frisian, [fse] Finnish Sign Language, [fsl] French Sign Language, [fss] finlandssvenskt teckenspr??k, [fss] Finland-Swedish Sign Language, [fss] suomenruotsalainen viittomakieli, [fub] Adamawa Fulfulde, [fuc] Pulaar, [fud] East Futuna, [fue] Borgu Fulfulde, [fuf] Pular, [fuh] Western Niger Fulfulde, [fui] Bagirmi Fulfulde, [fuj] Ko, [ful] Fulah, [fum] Fum, [fun] Fulni??, [fuq] Central-Eastern Niger Fulfulde, [fur] Friulian, [fut] Futuna-Aniwa, [fuu] Furu, [fuv] Nigerian Fulfulde, [fuy] Fuyug, [fvr] Fur, [fwa] Fw??i, [fwe] Fwe
[gaa] Ga, [gab] Gabri, [gac] Mixed Great Andamanese, [gad] Gaddang, [gae] Guarequena, [gaf] Gende, [gag] Gagauz, [gah] Alekano, [gai] Borei, [gaj] Gadsup, [gak] Gamkonora, [gal] Galolen, [gam] Kandawo, [gan] Gan Chinese, [gao] Gants, [gap] Gal, [gaq] Gata', [gar] Galeya, [gas] Adiwasi Garasia, [gat] Kenati, [gau] Mudhili Gadaba, [gaw] Nobonob, [gax] Borana-Arsi-Guji Oromo, [gay] Gayo, [gaz] West Central Oromo, [gba] Gbaya (Central African Republic), [gbb] Kaytetye, [gbd] Karadjeri, [gbe] Niksek, [gbf] Gaikundi, [gbg] Gbanziri, [gbh] Defi Gbe, [gbi] Galela, [gbj] Bodo Gadaba, [gbk] Gaddi, [gbl] Gamit, [gbm] Garhwali, [gbn] Mo'da, [gbo] Northern Grebo, [gbp] Gbaya-Bossangoa, [gbq] Gbaya-Bozoum, [gbr] Gbagyi, [gbs] Gbesi Gbe, [gbu] Gagadu, [gbv] Gbanu, [gbw] Gabi-Gabi, [gbx] Eastern Xwla Gbe, [gby] Gbari, [gbz] Zoroastrian Dari, [gcc] Mali, [gcd] Ganggalida, [gce] Galice, [gcf] Guadeloupean Creole French, [gcl] Grenadian Creole English, [gcn] Gaina, [gcr] Guianese Creole French, [gct] Colonia Tovar German, [gda] Gade Lohar, [gdb] Pottangi Ollar Gadaba, [gdc] Gugu Badhun, [gdd] Gedaged, [gde] Gude, [gdf] Guduf-Gava, [gdg] Ga'dang, [gdh] Gadjerawang, [gdi] Gundi, [gdj] Gurdjar, [gdk] Gadang, [gdl] Dirasha, [gdm] Laal, [gdn] Umanakaina, [gdo] Ghodoberi, [gdq] Mehri, [gdr] Wipi, [gds] Ghandruk Sign Language, [gdt] Kungardutyi, [gdu] Gudu, [gdx] Godwari, [gea] Geruma, [geb] Kire, [gec] Gboloo Grebo, [ged] Gade, [geg] Gengle, [geh] Hutterisch, [geh] Hutterite German, [gei] Gebe, [gej] Gen, [gek] Ywom, [gel] ut-Ma'in, [geq] Geme, [ges] Geser-Gorom, [gev] Eviya, [gew] Gera, [gex] Garre, [gey] Enya, [gez] Geez, [gfk] Patpatar, [gft] Gafat, [gga] Gao, [ggb] Gbii, [ggd] Gugadj, [gge] Guragone, [ggg] Gurgula, [ggk] Kungarakany, [ggl] Ganglau, [ggt] Gitua, [ggu] Gagu, [ggu] Gban, [ggw] Gogodala, [gha] Ghadam??s, [ghc] Hiberno-Scottish Gaelic, [ghe] Southern Ghale, [ghh] Northern Ghale, [ghk] Geko Karen, [ghl] Ghulfan, [ghn] Ghanongga, [gho] Ghomara, [ghr] Ghera, [ghs] Guhu-Samane, [ght] Kuke, [ght] Kutang Ghale, [gia] Kitja, [gib] Gibanawa, [gic] Gail, [gid] Gidar, [gie] Ga??ogbo, [gie] Gu??bie, [gig] Goaria, [gih] Githabul, [gil] Gilbertese, [gim] Gimi (Eastern Highlands), [gin] Hinukh, [gip] Gimi (West New Britain), [giq] Green Gelao, [gir] Red Gelao, [gis] North Giziga, [git] Gitxsan, [giu] Mulao, [giw] White Gelao, [gix] Gilima, [giy] Giyug, [giz] South Giziga, [gji] Geji, [gjk] Kachi Koli, [gjm] Gunditjmara, [gjn] Gonja, [gjr] Gurindji Kriol, [gju] Gujari, [gka] Guya, [gkd] Mag?? (Madang Province), [gke] Ndai, [gkn] Gokana, [gko] Kok-Nar, [gkp] Guinea Kpelle, [gku] ??Ungkue, [gla] Gaelic, [gla] Scottish Gaelic, [glc] Bon Gula, [gld] Nanai, [gle] Irish, [glg] Galician, [glh] Northwest Pashai, [glh] Northwest Pashayi, [gli] Guliguli, [glj] Gula Iro, [glk] Gilaki, [gll] Garlali, [glo] Galambu, [glr] Glaro-Twabo, [glu] Gula (Chad), [glv] Manx, [glw] Glavda, [gly] Gule, [gma] Gambera, [gmb] Gula'alaa, [gmd] M??ghd??, [gmg] Mag??yi, [gmh] Middle High German (ca. 1050-1500), [gml] Middle Low German, [gmm] Gbaya-Mbodomo, [gmn] Gimnime, [gmu] Gumalu, [gmv] Gamo, [gmx] Magoma, [gmy] Mycenaean Greek, [gmz] Mgbolizhia, [gna] Kaansa, [gnb] Gangte, [gnc] Guanche, [gnd] Zulgo-Gemzek, [gne] Ganang, [gng] Ngangam, [gnh] Lere, [gni] Gooniyandi, [gnj] Ngen, [gnk] ??Gana, [gnl] Gangulu, [gnm] Ginuman, [gnn] Gumatj, [gno] Northern Gondi, [gnq] Gana, [gnr] Gureng Gureng, [gnt] Guntai, [gnu] Gnau, [gnw] Western Bolivian Guaran??, [gnz] Ganzi, [goa] Guro, [gob] Playero, [goc] Gorakor, [god] Godi??, [goe] Gongduk, [gof] Gofa, [gog] Gogo, [goh] Old High German (ca. 750-1050), [goi] Gobasi, [goj] Gowlan, [gok] Gowli, [gol] Gola, [gom] Goan Konkani, [gon] Gondi, [goo] Gone Dau, [gop] Yeretuar, [goq] Gorap, [gor] Gorontalo, [gos] Gronings, [got] Gothic, [gou] Gavar, [gow] Gorowa, [gox] Gobu, [goy] Goundo, [goz] Gozarkhani, [gpa] Gupa-Abawa, [gpe] Ghanaian Pidgin English, [gpn] Taiap, [gqa] Ga'anda, [gqi] Guiqiong, [gqn] Guana (Brazil), [gqr] Gor, [gqu] Qau, [gra] Rajput Garasia, [grb] Grebo, [grc] Ancient Greek (to 1453), [grd] Guruntum-Mbaaru, [grg] Madi, [grh] Gbiri-Niragu, [gri] Ghari, [grj] Southern Grebo, [grm] Kota Marudu Talantang, [grn] Guarani, [gro] Groma, [grq] Gorovu, [grr] Taznatit, [grs] Gresi, [grt] Garo, [gru] Kistane, [grv] Central Grebo, [grw] Gweda, [grx] Guriaso, [gry] Barclayville Grebo, [grz] Guramalum, [gse] Ghanaian Sign Language, [gsg] German Sign Language, [gsl] Gusilay, [gsm] Guatemalan Sign Language, [gsn] Gusan, [gsn] Nema, [gso] Southwest Gbaya, [gsp] Wasembo, [gss] Greek Sign Language, [gsw] Alemannic, [gsw] Alsatian, [gsw] Swiss German, [gta] Guat??, [gtu] Aghu-Tharnggala, [gua] Shiki, [gub] Guajaj??ra, [guc] Wayuu, [gud] Yocobou?? Dida, [gue] Gurinji, [guf] Gupapuyngu, [gug] Paraguayan Guaran??, [guh] Guahibo, [gui] Eastern Bolivian Guaran??, [guj] Gujarati, [guk] Gumuz, [gul] Sea Island Creole English, [gum] Guambiano, [gun] Mby?? Guaran??, [guo] Guayabero, [gup] Gunwinggu, [guq] Ach??, [gur] Farefare, [gus] Guinean Sign Language, [gut] Mal??ku Ja??ka, [guu] Yanomam??, [guw] Gun, [gux] Gourmanch??ma, [guz] Ekegusii, [guz] Gusii, [gva] Guana (Paraguay), [gvc] Guanano, [gve] Duwet, [gvf] Golin, [gvj] Guaj??, [gvl] Gulay, [gvm] Gurmana, [gvn] Kuku-Yalanji, [gvo] Gavi??o Do Jiparan??, [gvp] Par?? Gavi??o, [gvr] Gurung, [gvs] Gumawana, [gvy] Guyani, [gwa] Mbato, [gwb] Gwa, [gwc] Kalami, [gwd] Gawwada, [gwe] Gweno, [gwf] Gowro, [gwg] Moo, [gwi] Gwich??in, [gwj] ??Gwi, [gwm] Awngthim, [gwn] Gwandara, [gwr] Gwere, [gwt] Gawar-Bati, [gwu] Guwamu, [gww] Kwini, [gwx] Gua, [gxx] W?? Southern, [gya] Northwest Gbaya, [gyb] Garus, [gyd] Kayardild, [gye] Gyem, [gyf] Gungabula, [gyg] Gbayi, [gyi] Gyele, [gyl] Gayil, [gym] Ng??bere, [gyn] Guyanese Creole English, [gyo] Gyalsumdo, [gyr] Guarayu, [gyy] Gunya, [gza] Ganza, [gzi] Gazi, [gzn] Gane
[haa] Han, [hab] Hanoi Sign Language, [hac] Gurani, [had] Hatam, [hae] Eastern Oromo, [haf] Haiphong Sign Language, [hag] Hanga, [hah] Hahon, [hai] Haida, [haj] Hajong, [hak] Hakka Chinese, [hal] Halang, [ham] Hewa, [han] Hangaza, [hao] Hak??, [hap] Hupla, [haq] Ha, [har] Harari, [has] Haisla, [hat] Haitian, [hat] Haitian Creole, [hau] Hausa, [hav] Havu, [haw] Hawaiian, [hax] Southern Haida, [hay] Haya, [haz] Hazaragi, [hba] Hamba, [hbb] Huba, [hbn] Heiban, [hbo] Ancient Hebrew, [hbs] Serbo-Croatian, [hbu] Habu, [hca] Andaman Creole Hindi, [hch] Huichol, [hdn] Northern Haida, [hds] Honduras Sign Language, [hdy] Hadiyya, [hea] Northern Qiandong Miao, [heb] Hebrew, [hed] Herd??, [heg] Helong, [heh] Hehe, [hei] Heiltsuk, [hem] Hemba, [her] Herero, [hgm] Hai??om, [hgw] Haigwai, [hhi] Hoia Hoia, [hhr] Kerak, [hhy] Hoyahoya, [hia] Lamang, [hib] Hibito, [hid] Hidatsa, [hif] Fiji Hindi, [hig] Kamwe, [hih] Pamosu, [hii] Hinduri, [hij] Hijuk, [hik] Seit-Kaitetu, [hil] Hiligaynon, [hin] Hindi, [hio] Tsoa, [hir] Himarim??, [hit] Hittite, [hiw] Hiw, [hix] Hixkary??na, [hji] Haji, [hka] Kahe, [hke] Hunde, [hkk] Hunjara-Kaina Ke, [hkn] Mel-Khaonh, [hks] Heung Kong Sau Yue, [hks] Hong Kong Sign Language, [hla] Halia, [hlb] Halbi, [hld] Halang Doan, [hle] Hlersu, [hlt] Matu Chin, [hlu] Hieroglyphic Luwian, [hma] Southern Mashan Hmong, [hma] Southern Mashan Miao, [hmb] Humburi Senni Songhay, [hmc] Central Huishui Hmong, [hmc] Central Huishui Miao, [hmd] A-hmaos, [hmd] Da-Hua Miao, [hmd] Large Flowery Miao, [hme] Eastern Huishui Hmong, [hme] Eastern Huishui Miao, [hmf] Hmong Don, [hmg] Southwestern Guiyang Hmong, [hmh] Southwestern Huishui Hmong, [hmh] Southwestern Huishui Miao, [hmi] Northern Huishui Hmong, [hmi] Northern Huishui Miao, [hmj] Ge, [hmj] Gejia, [hmk] Maek, [hml] Luopohe Hmong, [hml] Luopohe Miao, [hmm] Central Mashan Hmong, [hmm] Central Mashan Miao, [hmn] Hmong, [hmn] Mong, [hmo] Hiri Motu, [hmp] Northern Mashan Hmong, [hmp] Northern Mashan Miao, [hmq] Eastern Qiandong Miao, [hmr] Hmar, [hms] Southern Qiandong Miao, [hmt] Hamtai, [hmu] Hamap, [hmv] Hmong D??, [hmw] Western Mashan Hmong, [hmw] Western Mashan Miao, [hmy] Southern Guiyang Hmong, [hmy] Southern Guiyang Miao, [hmz] Hmong Shua, [hmz] Sinicized Miao, [hna] Mina (Cameroon), [hnd] Southern Hindko, [hne] Chhattisgarhi, [hnh] ??Ani, [hni] Hani, [hnj] Hmong Njua, [hnj] Mong Leng, [hnj] Mong Njua, [hnn] Hanunoo, [hno] Northern Hindko, [hns] Caribbean Hindustani, [hnu] Hung, [hoa] Hoava, [hob] Mari (Madang Province), [hoc] Ho, [hod] Holma, [hoe] Horom, [hoh] Hoby??t, [hoi] Holikachuk, [hoj] Hadothi, [hoj] Haroti, [hol] Holu, [hom] Homa, [hoo] Holoholo, [hop] Hopi, [hor] Horo, [hos] Ho Chi Minh City Sign Language, [hot] Hote, [hot] Mal??, [hov] Hovongan, [how] Honi, [hoy] Holiya, [hoz] Hozo, [hpo] Hpon, [hps] Hawai'i Pidgin Sign Language, [hps] Hawai'i Sign Language (HSL), [hra] Hrangkhol, [hrc] Niwer Mil, [hre] Hre, [hrk] Haruku, [hrm] Horned Miao, [hro] Haroi, [hrp] Nhirrpi, [hrt] H??rtevin, [hru] Hruso, [hrv] Croatian, [hrw] Warwar Feni, [hrx] Hunsrik, [hrz] Harzani, [hsb] Upper Sorbian, [hsh] Hungarian Sign Language, [hsl] Hausa Sign Language, [hsn] Xiang Chinese, [hss] Harsusi, [hti] Hoti, [hto] Minica Huitoto, [hts] Hadza, [htu] Hitu, [htx] Middle Hittite, [hub] Huambisa, [huc] ??Hua, [hud] Huaulu, [hue] San Francisco Del Mar Huave, [huf] Humene, [hug] Huachipaeri, [huh] Huilliche, [hui] Huli, [huj] Northern Guiyang Hmong, [huj] Northern Guiyang Miao, [huk] Hulung, [hul] Hula, [hum] Hungana, [hun] Hungarian, [huo] Hu, [hup] Hupa, [huq] Tsat, [hur] Halkomelem, [hus] Huastec, [hut] Humla, [huu] Murui Huitoto, [huv] San Mateo Del Mar Huave, [huw] Hukumina, [hux] N??pode Huitoto, [huy] Hulaul??, [huz] Hunzib, [hvc] Haitian Vodoun Culture Language, [hve] San Dionisio Del Mar Huave, [hvk] Haveke, [hvn] Sabu, [hvv] Santa Mar??a Del Mar Huave, [hwa] Wan??, [hwc] Hawai'i Creole English, [hwc] Hawai'i Pidgin, [hwo] Hwana, [hya] Hya, [hye] Armenian, [hyw] Western Armenian
[iai] Iaai, [ian] Iatmul, [iar] Purari, [iba] Iban, [ibb] Ibibio, [ibd] Iwaidja, [ibe] Akpes, [ibg] Ibanag, [ibh] Bih, [ibl] Ibaloi, [ibm] Agoi, [ibn] Ibino, [ibo] Igbo, [ibr] Ibuoro, [ibu] Ibu, [iby] Ibani, [ica] Ede Ica, [ich] Etkywan, [icl] Icelandic Sign Language, [icr] Islander Creole English, [ida] Idakho-Isukha-Tiriki, [ida] Luidakho-Luisukha-Lutirichi, [idb] Indo-Portuguese, [idc] Ajiya, [idc] Idon, [idd] Ede Idaca, [ide] Idere, [idi] Idi, [ido] Ido, [idr] Indri, [ids] Idesa, [idt] Idat??, [idu] Idoma, [ifa] Amganad Ifugao, [ifb] Ayangan Ifugao, [ifb] Batad Ifugao, [ife] If??, [iff] Ifo, [ifk] Tuwali Ifugao, [ifm] Teke-Fuumu, [ifu] Mayoyao Ifugao, [ify] Keley-I Kallahan, [igb] Ebira, [ige] Igede, [igg] Igana, [igl] Igala, [igm] Kanggape, [ign] Ignaciano, [igo] Isebe, [igs] Interglossa, [igw] Igwe, [ihb] Iha Based Pidgin, [ihi] Ihievbe, [ihp] Iha, [ihw] Bidhawal, [iii] Nuosu, [iii] Sichuan Yi, [iin] Thiin, [ijc] Izon, [ije] Biseni, [ijj] Ede Ije, [ijn] Kalabari, [ijs] Southeast Ijo, [ike] Eastern Canadian Inuktitut, [iki] Iko, [ikk] Ika, [ikl] Ikulu, [iko] Olulumo-Ikom, [ikp] Ikpeshi, [ikr] Ikaranggal, [iks] Inuit Sign Language, [ikt] Inuinnaqtun, [ikt] Western Canadian Inuktitut, [iku] Inuktitut, [ikv] Iku-Gora-Ankwa, [ikw] Ikwere, [ikx] Ik, [ikz] Ikizu, [ila] Ile Ape, [ilb] Ila, [ile] Interlingue, [ile] Occidental, [ilg] Garig-Ilgar, [ili] Ili Turki, [ilk] Ilongot, [ilm] Iranun (Malaysia), [ilo] Iloko, [ilp] Iranun (Philippines), [ils] International Sign, [ilu] Ili'uun, [ilv] Ilue, [ima] Mala Malasar, [imi] Anamgura, [iml] Miluk, [imn] Imonda, [imo] Imbongu, [imr] Imroing, [ims] Marsian, [imy] Milyan, [ina] Interlingua (International Auxiliary Language Association), [inb] Inga, [ind] Indonesian, [ing] Degexit'an, [inh] Ingush, [inj] Jungle Inga, [inl] Indonesian Sign Language, [inm] Minaean, [inn] Isinai, [ino] Inoke-Yate, [inp] I??apari, [ins] Indian Sign Language, [int] Intha, [inz] Inese??o, [ior] Inor, [iou] Tuma-Irumu, [iow] Iowa-Oto, [ipi] Ipili, [ipk] Inupiaq, [ipo] Ipiko, [iqu] Iquito, [iqw] Ikwo, [ire] Iresim, [irh] Irarutu, [iri] Irigwe, [iri] Rigwe, [irk] Iraqw, [irn] Ir??ntxe, [irr] Ir, [iru] Irula, [irx] Kamberau, [iry] Iraya, [isa] Isabi, [isc] Isconahua, [isd] Isnag, [ise] Italian Sign Language, [isg] Irish Sign Language, [ish] Esan, [isi] Nkem-Nkum, [isk] Ishkashimi, [isl] Icelandic, [ism] Masimasi, [isn] Isanzu, [iso] Isoko, [isr] Israeli Sign Language, [ist] Istriot, [isu] Isu (Menchum Division), [ita] Italian, [itb] Binongan Itneg, [itd] Southern Tidung, [ite] Itene, [iti] Inlaod Itneg, [itk] Judeo-Italian, [itl] Itelmen, [itm] Itu Mbon Uzo, [ito] Itonama, [itr] Iteri, [its] Isekiri, [itt] Maeng Itneg, [itv] Itawit, [itw] Ito, [itx] Itik, [ity] Moyadan Itneg, [itz] Itz??, [ium] Iu Mien, [ivb] Ibatan, [ivv] Ivatan, [iwk] I-Wak, [iwm] Iwam, [iwo] Iwur, [iws] Sepik Iwam, [ixc] Ixcatec, [ixl] Ixil, [iya] Iyayu, [iyo] Mesaka, [iyx] Yaka (Congo), [izh] Ingrian, [izr] Izere, [izz] Izii
[jaa] Jamamad??, [jab] Hyam, [jac] Jakalteko, [jac] Popti', [jad] Jahanka, [jae] Yabem, [jaf] Jara, [jah] Jah Hut, [jaj] Zazao, [jak] Jakun, [jal] Yalahatan, [jam] Jamaican Creole English, [jan] Jandai, [jao] Yanyuwa, [jaq] Yaqay, [jas] New Caledonian Javanese, [jat] Jakati, [jau] Yaur, [jav] Javanese, [jax] Jambi Malay, [jay] Yan-nhangu, [jaz] Jawe, [jbe] Judeo-Berber, [jbi] Badjiri, [jbj] Arandai, [jbk] Barikewa, [jbn] Nafusi, [jbo] Lojban, [jbr] Jofotek-Bromnya, [jbt] Jabut??, [jbu] Jukun Takum, [jbw] Yawijibaya, [jcs] Jamaican Country Sign Language, [jct] Krymchak, [jda] Jad, [jdg] Jadgali, [jdt] Judeo-Tat, [jeb] Jebero, [jee] Jerung, [jeh] Jeh, [jei] Yei, [jek] Jeri Kuo, [jel] Yelmek, [jen] Dza, [jer] Jere, [jet] Manem, [jeu] Jonkor Bourmataguil, [jgb] Ngbee, [jge] Judeo-Georgian, [jgk] Gwak, [jgo] Ngomba, [jhi] Jehai, [jhs] Jhankot Sign Language, [jia] Jina, [jib] Jibu, [jic] Tol, [jid] Bu, [jie] Jilbe, [jig] Djingili, [jih] Shangzhai, [jih] sTodsde, [jii] Jiiddu, [jil] Jilim, [jim] Jimi (Cameroon), [jio] Jiamao, [jiq] Guanyinqiao, [jiq] Lavrung, [jit] Jita, [jiu] Youle Jinuo, [jiv] Shuar, [jiy] Buyuan Jinuo, [jje] Jejueo, [jjr] Bankal, [jka] Kaera, [jkm] Mobwa Karen, [jko] Kubo, [jkp] Paku Karen, [jkr] Koro (India), [jku] Labir, [jle] Ngile, [jls] Jamaican Sign Language, [jma] Dima, [jmb] Zumbun, [jmc] Machame, [jmd] Yamdena, [jmi] Jimi (Nigeria), [jml] Jumli, [jmn] Makuri Naga, [jmr] Kamara, [jms] Mashi (Nigeria), [jmw] Mouwase, [jmx] Western Juxtlahuaca Mixtec, [jna] Jangshung, [jnd] Jandavra, [jng] Yangman, [jni] Janji, [jnj] Yemsa, [jnl] Rawat, [jns] Jaunsari, [job] Joba, [jod] Wojenaka, [jog] Jogi, [jor] Jor??, [jos] Jordanian Sign Language, [jow] Jowulu, [jpa] Jewish Palestinian Aramaic, [jpn] Japanese, [jpr] Judeo-Persian, [jqr] Jaqaru, [jra] Jarai, [jrb] Judeo-Arabic, [jrr] Jiru, [jrt] Jorto, [jru] Japrer??a, [jsl] Japanese Sign Language, [jua] J??ma, [jub] Wannu, [juc] Jurchen, [jud] Worodougou, [juh] H??ne, [jui] Ngadjuri, [juk] Wapan, [jul] Jirel, [jum] Jumjum, [jun] Juang, [juo] Jiba, [jup] Hupd??, [jur] Jur??na, [jus] Jumla Sign Language, [jut] Jutish, [juu] Ju, [juw] W??pha, [juy] Juray, [jvd] Javindo, [jvn] Caribbean Javanese, [jwi] Jwira-Pepesa, [jya] Jiarong, [jye] Judeo-Yemeni Arabic, [jyy] Jaya
[kaa] Kara-Kalpak, [kab] Kabyle, [kac] Jingpho, [kac] Kachin, [kad] Adara, [kae] Ketangalan, [kaf] Katso, [kag] Kajaman, [kah] Kara (Central African Republic), [kai] Karekare, [kaj] Jju, [kak] Kalanguya, [kak] Kayapa Kallahan, [kal] Greenlandic, [kal] Kalaallisut, [kam] Kamba (Kenya), [kan] Kannada, [kao] Xaasongaxango, [kap] Bezhta, [kaq] Capanahua, [kas] Kashmiri, [kat] Georgian, [kau] Kanuri, [kav] Katuk??na, [kaw] Kawi, [kax] Kao, [kay] Kamayur??, [kaz] Kazakh, [kba] Kalarko, [kbb] Kaxui??na, [kbc] Kadiw??u, [kbd] Kabardian, [kbe] Kanju, [kbg] Khamba, [kbh] Cams??, [kbi] Kaptiau, [kbj] Kari, [kbk] Grass Koiari, [kbl] Kanembu, [kbm] Iwal, [kbn] Kare (Central African Republic), [kbo] Keliko, [kbp] Kabiy??, [kbq] Kamano, [kbr] Kafa, [kbs] Kande, [kbt] Abadi, [kbu] Kabutra, [kbv] Dera (Indonesia), [kbw] Kaiep, [kbx] Ap Ma, [kby] Manga Kanuri, [kbz] Duhwa, [kca] Khanty, [kcb] Kawacha, [kcc] Lubila, [kcd] Ngk??lmpw Kanum, [kce] Kaivi, [kcf] Ukaan, [kcg] Tyap, [kch] Vono, [kci] Kamantan, [kcj] Kobiana, [kck] Kalanga, [kcl] Kala, [kcl] [[Kala (Papua New Guinea)]], [kcm] Gula (Central African Republic), [kcn] Nubi, [kco] Kinalakna, [kcp] Kanga, [kcq] Kamo, [kcr] Katla, [kcs] Koenoem, [kct] Kaian, [kcu] Kami (Tanzania), [kcv] Kete, [kcw] Kabwari, [kcx] Kachama-Ganjule, [kcy] Korandje, [kcz] Konongo, [kda] Worimi, [kdc] Kutu, [kdd] Yankunytjatjara, [kde] Makonde, [kdf] Mamusi, [kdg] Seba, [kdh] Tem, [kdi] Kumam, [kdj] Karamojong, [kdk] Kw??nyi, [kdk] Num????, [kdl] Tsikimba, [kdm] Kagoma, [kdn] Kunda, [kdp] Kaningdon-Nindem, [kdq] Koch, [kdr] Karaim, [kdt] Kuy, [kdu] Kadaru, [kdw] Koneraw, [kdx] Kam, [kdy] Keder, [kdy] Keijar, [kdz] Kwaja, [kea] Kabuverdianu, [keb] K??l??, [kec] Keiga, [ked] Kerewe, [kee] Eastern Keres, [kef] Kpessi, [keg] Tese, [keh] Keak, [kei] Kei, [kej] Kadar, [kek] Kekch??, [kel] Kela (Democratic Republic of Congo), [kem] Kemak, [ken] Kenyang, [keo] Kakwa, [kep] Kaikadi, [keq] Kamar, [ker] Kera, [kes] Kugbo, [ket] Ket, [keu] Akebu, [kev] Kanikkaran, [kew] West Kewa, [kex] Kukna, [key] Kupia, [kez] Kukele, [kfa] Kodava, [kfb] Northwestern Kolami, [kfc] Konda-Dora, [kfd] Korra Koraga, [kfe] Kota (India), [kff] Koya, [kfg] Kudiya, [kfh] Kurichiya, [kfi] Kannada Kurumba, [kfj] Kemiehua, [kfk] Kinnauri, [kfl] Kung, [kfm] Khunsari, [kfn] Kuk, [kfo] Koro (C??te d'Ivoire), [kfp] Korwa, [kfq] Korku, [kfr] Kachhi, [kfr] Kutchi, [kfs] Bilaspuri, [kft] Kanjari, [kfu] Katkari, [kfv] Kurmukar, [kfw] Kharam Naga, [kfx] Kullu Pahari, [kfy] Kumaoni, [kfz] Koromf??, [kga] Koyaga, [kgb] Kawe, [kge] Komering, [kgf] Kube, [kgg] Kusunda, [kgi] Selangor Sign Language, [kgj] Gamale Kham, [kgk] Kaiw??, [kgl] Kunggari, [kgm] Karip??na, [kgn] Karingani, [kgo] Krongo, [kgp] Kaingang, [kgq] Kamoro, [kgr] Abun, [kgs] Kumbainggar, [kgt] Somyev, [kgu] Kobol, [kgv] Karas, [kgw] Karon Dori, [kgx] Kamaru, [kgy] Kyerung, [kha] Khasi, [khb] L??, [khc] Tukang Besi North, [khd] B??di Kanum, [khe] Korowai, [khf] Khuen, [khg] Khams Tibetan, [khh] Kehu, [khj] Kuturmi, [khk] Halh Mongolian, [khl] Lusi, [khm] Central Khmer, [khm] Khmer, [khn] Khandesi, [kho] Khotanese, [kho] Sakan, [khp] Kapauri, [khp] Kapori, [khq] Koyra Chiini Songhay, [khr] Kharia, [khs] Kasua, [kht] Khamti, [khu] Nkhumbi, [khv] Khvarshi, [khw] Khowar, [khx] Kanu, [khy] Kele (Democratic Republic of Congo), [khz] Keapara, [kia] Kim, [kib] Koalib, [kic] Kickapoo, [kid] Koshin, [kie] Kibet, [kif] Eastern Parbate Kham, [kig] Kimaama, [kig] Kimaghima, [kih] Kilmeri, [kii] Kitsai, [kij] Kilivila, [kik] Gikuyu, [kik] Kikuyu, [kil] Kariya, [kim] Karagas, [kin] Kinyarwanda, [kio] Kiowa, [kip] Sheshi Kham, [kiq] Kosadle, [kiq] Kosare, [kir] Kirghiz, [kir] Kyrgyz, [kis] Kis, [kit] Agob, [kiu] Kirmanjki (individual language), [kiv] Kimbu, [kiw] Northeast Kiwai, [kix] Khiamniungan Naga, [kiy] Kirikiri, [kiz] Kisi, [kja] Mlap, [kjb] Kanjobal, [kjb] Q'anjob'al, [kjc] Coastal Konjo, [kjd] Southern Kiwai, [kje] Kisar, [kjf] Khalaj, [kjg] Khmu, [kjh] Khakas, [kji] Zabana, [kjj] Khinalugh, [kjk] Highland Konjo, [kjl] Western Parbate Kham, [kjm] Kh??ng, [kjn] Kunjen, [kjo] Harijan Kinnauri, [kjp] Pwo Eastern Karen, [kjq] Western Keres, [kjr] Kurudu, [kjs] East Kewa, [kjt] Phrae Pwo Karen, [kju] Kashaya, [kjv] Kaikavian Literary Language, [kjx] Ramopa, [kjy] Erave, [kjz] Bumthangkha, [kka] Kakanda, [kkb] Kwerisa, [kkc] Odoodee, [kkd] Kinuku, [kke] Kakabe, [kkf] Kalaktang Monpa, [kkg] Mabaka Valley Kalinga, [kkh] Kh??n, [kki] Kagulu, [kkj] Kako, [kkk] Kokota, [kkl] Kosarek Yale, [kkm] Kiong, [kkn] Kon Keu, [kko] Karko, [kkp] Gugubera, [kkq] Kaiku, [kkr] Kir-Balar, [kks] Giiwo, [kkt] Koi, [kku] Tumi, [kkv] Kangean, [kkw] Teke-Kukuya, [kkx] Kohin, [kky] Guguyimidjir, [kkz] Kaska, [kla] Klamath-Modoc, [klb] Kiliwa, [klc] Kolbila, [kld] Gamilaraay, [kle] Kulung (Nepal), [klf] Kendeje, [klg] Tagakaulo, [klh] Weliki, [kli] Kalumpang, [klj] Turkic Khalaj, [klk] Kono (Nigeria), [kll] Kagan Kalagan, [klm] Migum, [kln] Kalenjin, [klo] Kapya, [klp] Kamasa, [klq] Rumu, [klr] Khaling, [kls] Kalasha, [klt] Nukna, [klu] Klao, [klv] Maskelynes, [klw] Lindu, [klw] Tado, [klx] Koluwawa, [kly] Kalao, [klz] Kabola, [kma] Konni, [kmb] Kimbundu, [kmc] Southern Dong, [kmd] Majukayang Kalinga, [kme] Bakole, [kmf] Kare (Papua New Guinea), [kmg] K??te, [kmh] Kalam, [kmi] Kami (Nigeria), [kmj] Kumarbhag Paharia, [kmk] Limos Kalinga, [kml] Tanudan Kalinga, [kmm] Kom (India), [kmn] Awtuw, [kmo] Kwoma, [kmp] Gimme, [kmq] Kwama, [kmr] Northern Kurdish, [kms] Kamasau, [kmt] Kemtuik, [kmu] Kanite, [kmv] Karip??na Creole French, [kmw] Komo (Democratic Republic of Congo), [kmx] Waboda, [kmy] Koma, [kmz] Khorasani Turkish, [kna] Dera (Nigeria), [knb] Lubuagan Kalinga, [knc] Central Kanuri, [knd] Konda, [kne] Kankanaey, [knf] Mankanya, [kng] Koongo, [kni] Kanufi, [knj] Western Kanjobal, [knk] Kuranko, [knl] Keninjal, [knm] Kanamar??, [knn] Konkani (individual language), [kno] Kono (Sierra Leone), [knp] Kwanja, [knq] Kintaq, [knr] Kaningra, [kns] Kensiu, [knt] Panoan Katuk??na, [knu] Kono (Guinea), [knv] Tabo, [knw] Kung-Ekoka, [knx] Kendayan, [knx] Salako, [kny] Kanyok, [knz] Kalams??, [koa] Konomala, [koc] Kpati, [kod] Kodi, [koe] Kacipo-Balesi, [kof] Kubi, [kog] Cogui, [kog] Kogi, [koh] Koyo, [koi] Komi-Permyak, [kok] Konkani (macrolanguage), [kol] Kol (Papua New Guinea), [kom] Komi, [kon] Kongo, [koo] Konzo, [kop] Waube, [koq] Kota (Gabon), [kor] Korean, [kos] Kosraean, [kot] Lagwan, [kou] Koke, [kov] Kudu-Camo, [kow] Kugama, [koy] Koyukon, [koz] Korak, [kpa] Kutto, [kpb] Mullu Kurumba, [kpc] Curripaco, [kpd] Koba, [kpe] Kpelle, [kpf] Komba, [kpg] Kapingamarangi, [kph] Kplang, [kpi] Kofei, [kpj] Karaj??, [kpk] Kpan, [kpl] Kpala, [kpm] Koho, [kpn] Kepkiriw??t, [kpo] Ikposo, [kpq] Korupun-Sela, [kpr] Korafe-Yegha, [kps] Tehit, [kpt] Karata, [kpu] Kafoa, [kpv] Komi-Zyrian, [kpw] Kobon, [kpx] Mountain Koiali, [kpy] Koryak, [kpz] Kupsabiny, [kqa] Mum, [kqb] Kovai, [kqc] Doromu-Koki, [kqd] Koy Sanjaq Surat, [kqe] Kalagan, [kqf] Kakabai, [kqg] Khe, [kqh] Kisankasa, [kqi] Koitabu, [kqj] Koromira, [kqk] Kotafon Gbe, [kql] Kyenele, [kqm] Khisa, [kqn] Kaonde, [kqo] Eastern Krahn, [kqp] Kimr??, [kqq] Krenak, [kqr] Kimaragang, [kqs] Northern Kissi, [kqt] Klias River Kadazan, [kqu] Seroa, [kqv] Okolod, [kqw] Kandas, [kqx] Mser, [kqy] Koorete, [kqz] Korana, [kra] Kumhali, [krb] Karkin, [krc] Karachay-Balkar, [krd] Kairui-Midiki, [kre] Panar??, [krf] Koro (Vanuatu), [krh] Kurama, [kri] Krio, [krj] Kinaray-A, [krk] Kerek, [krl] Karelian, [krn] Sapo, [krp] Korop, [krr] Krung, [krs] Gbaya (Sudan), [krt] Tumari Kanuri, [kru] Kurukh, [krv] Kavet, [krw] Western Krahn, [krx] Karon, [kry] Kryts, [krz] Sota Kanum, [ksa] Shuwa-Zamani, [ksb] Shambala, [ksc] Southern Kalinga, [ksd] Kuanua, [kse] Kuni, [ksf] Bafia, [ksg] Kusaghe, [ksh] K??lsch, [ksi] I'saka, [ksi] Krisa, [ksj] Uare, [ksk] Kansa, [ksl] Kumalu, [ksm] Kumba, [ksn] Kasiguranin, [kso] Kofa, [ksp] Kaba, [ksq] Kwaami, [ksr] Borong, [kss] Southern Kisi, [kst] Winy??, [ksu] Khamyang, [ksv] Kusu, [ksw] S'gaw Karen, [ksx] Kedang, [ksy] Kharia Thar, [ksz] Kodaku, [kta] Katua, [ktb] Kambaata, [ktc] Kholok, [ktd] Kokata, [kte] Nubri, [ktf] Kwami, [ktg] Kalkutung, [kth] Karanga, [kti] North Muyu, [ktj] Plapo Krumen, [ktk] Kaniet, [ktl] Koroshi, [ktm] Kurti, [ktn] Kariti??na, [kto] Kuot, [ktp] Kaduo, [ktq] Katabaga, [kts] South Muyu, [ktt] Ketum, [ktu] Kituba (Democratic Republic of Congo), [ktv] Eastern Katu, [ktw] Kato, [ktx] Kaxarar??, [kty] Kango (Bas-U??l?? District), [ktz] Ju????hoan, [ktz] Ju????hoansi, [kua] Kuanyama, [kua] Kwanyama, [kub] Kutep, [kuc] Kwinsu, [kud] 'Auhelawa, [kue] Kuman (Papua New Guinea), [kuf] Western Katu, [kug] Kupa, [kuh] Kushi, [kui] Kuik??ro-Kalap??lo, [kuj] Kuria, [kuk] Kepo', [kul] Kulere, [kum] Kumyk, [kun] Kunama, [kuo] Kumukio, [kup] Kunimaipa, [kuq] Karipuna, [kur] Kurdish, [kus] Kusaal, [kut] Kutenai, [kuu] Upper Kuskokwim, [kuv] Kur, [kuw] Kpagua, [kux] Kukatja, [kuy] Kuuku-Ya'u, [kuz] Kunza, [kva] Bagvalal, [kvb] Kubu, [kvc] Kove, [kvd] Kui (Indonesia), [kve] Kalabakan, [kvf] Kabalai, [kvg] Kuni-Boazi, [kvh] Komodo, [kvi] Kwang, [kvj] Psikye, [kvk] Korean Sign Language, [kvl] Kayaw, [kvm] Kendem, [kvn] Border Kuna, [kvo] Dobel, [kvp] Kompane, [kvq] Geba Karen, [kvr] Kerinci, [kvt] Lahta, [kvt] Lahta Karen, [kvu] Yinbaw Karen, [kvv] Kola, [kvw] Wersing, [kvx] Parkari Koli, [kvy] Yintale, [kvy] Yintale Karen, [kvz] Tsakwambo, [kvz] Tsaukambo, [kwa] D??w, [kwb] Kwa, [kwc] Likwala, [kwd] Kwaio, [kwe] Kwerba, [kwf] Kwara'ae, [kwg] Sara Kaba Deme, [kwh] Kowiai, [kwi] Awa-Cuaiquer, [kwj] Kwanga, [kwk] Kwakiutl, [kwl] Kofyar, [kwm] Kwambi, [kwn] Kwangali, [kwo] Kwomtari, [kwp] Kodia, [kwr] Kwer, [kws] Kwese, [kwt] Kwesten, [kwu] Kwakum, [kwv] Sara Kaba N????, [kww] Kwinti, [kwx] Khirwar, [kwy] San Salvador Kongo, [kwz] Kwadi, [kxa] Kairiru, [kxb] Krobu, [kxc] Khonso, [kxc] Konso, [kxd] Brunei, [kxf] Manumanaw, [kxf] Manumanaw Karen, [kxh] Karo (Ethiopia), [kxi] Keningau Murut, [kxj] Kulfa, [kxk] Zayein Karen, [kxl] Nepali Kurux, [kxm] Northern Khmer, [kxn] Kanowit-Tanjong Melanau, [kxo] Kano??, [kxp] Wadiyara Koli, [kxq] Sm??rky Kanum, [kxr] Koro (Papua New Guinea), [kxs] Kangjia, [kxt] Koiwat, [kxu] Kui (India), [kxv] Kuvi, [kxw] Konai, [kxx] Likuba, [kxy] Kayong, [kxz] Kerewo, [kya] Kwaya, [kyb] Butbut Kalinga, [kyc] Kyaka, [kyd] Karey, [kye] Krache, [kyf] Kouya, [kyg] Keyagana, [kyh] Karok, [kyi] Kiput, [kyj] Karao, [kyk] Kamayo, [kyl] Kalapuya, [kym] Kpatili, [kyn] Northern Binukidnon, [kyo] Kelon, [kyp] Kang, [kyq] Kenga, [kyr] Kuru??ya, [kys] Baram Kayan, [kyt] Kayagar, [kyu] Western Kayah, [kyv] Kayort, [kyw] Kudmali, [kyx] Rapoisi, [kyy] Kambaira, [kyz] Kayab??, [kza] Western Karaboro, [kzb] Kaibobo, [kzc] Bondoukou Kulango, [kzd] Kadai, [kze] Kosena, [kzf] Da'a Kaili, [kzg] Kikai, [kzi] Kelabit, [kzk] Kazukuru, [kzl] Kayeli, [kzm] Kais, [kzn] Kokola, [kzo] Kaningi, [kzp] Kaidipang, [kzq] Kaike, [kzr] Karang, [kzs] Sugut Dusun, [kzu] Kayupulau, [kzv] Komyandaret, [kzw] Karir??-Xoc??, [kzx] Kamarian, [kzy] Kango (Tshopo District), [kzz] Kalabra
[laa] Southern Subanen, [lab] Linear A, [lac] Lacandon, [lad] Ladino, [lae] Pattani, [laf] Lafofa, [lag] Langi, [lah] Lahnda, [lai] Lambya, [laj] Lango (Uganda), [lak] Laka (Nigeria), [lal] Lalia, [lam] Lamba, [lan] Laru, [lao] Lao, [lap] Laka (Chad), [laq] Qabiao, [lar] Larteh, [las] Lama (Togo), [lat] Latin, [lau] Laba, [lav] Latvian, [law] Lauje, [lax] Tiwa, [lay] Lama Bai, [laz] Aribwatsa, [lba] Lui, [lbb] Label, [lbc] Lakkia, [lbe] Lak, [lbf] Tinani, [lbg] Laopang, [lbi] La'bi, [lbj] Ladakhi, [lbk] Central Bontok, [lbl] Libon Bikol, [lbm] Lodhi, [lbn] Lamet, [lbo] Laven, [lbq] Wampar, [lbr] Lohorung, [lbs] Libyan Sign Language, [lbt] Lachi, [lbu] Labu, [lbv] Lavatbura-Lamusong, [lbw] Tolaki, [lbx] Lawangan, [lby] Lamu-Lamu, [lbz] Lardil, [lcc] Legenyem, [lcd] Lola, [lce] Loncong, [lce] Sekak, [lcf] Lubu, [lch] Luchazi, [lcl] Lisela, [lcm] Tungag, [lcp] Western Lawa, [lcq] Luhu, [lcs] Lisabata-Nuniali, [lda] Kla-Dan, [ldb] D??ya, [ldd] Luri, [ldg] Lenyima, [ldh] Lamja-Dengsa-Tola, [ldi] Laari, [ldj] Lemoro, [ldk] Leelau, [ldl] Kaan, [ldm] Landoma, [ldn] L??adan, [ldo] Loo, [ldp] Tso, [ldq] Lufu, [lea] Lega-Shabunda, [leb] Lala-Bisa, [lec] Leco, [led] Lendu, [lee] Ly??l??, [lef] Lelemi, [leh] Lenje, [lei] Lemio, [lej] Lengola, [lek] Leipon, [lel] Lele (Democratic Republic of Congo), [lem] Nomaande, [len] Lenca, [leo] Leti (Cameroon), [lep] Lepcha, [leq] Lembena, [ler] Lenkau, [les] Lese, [let] Amio-Gelimi, [let] Lesing-Gelimi, [leu] Kara (Papua New Guinea), [lev] Lamma, [lew] Ledo Kaili, [lex] Luang, [ley] Lemolang, [lez] Lezghian, [lfa] Lefa, [lfn] Lingua Franca Nova, [lga] Lungga, [lgb] Laghu, [lgg] Lugbara, [lgh] Laghuu, [lgi] Lengilu, [lgk] Lingarak, [lgk] Neverver, [lgl] Wala, [lgm] Lega-Mwenga, [lgn] Opuuo, [lgn] T'apo, [lgq] Logba, [lgr] Lengo, [lgt] Pahi, [lgu] Longgu, [lgz] Ligenza, [lha] Laha (Viet Nam), [lhh] Laha (Indonesia), [lhi] Lahu Shi, [lhl] Lahul Lohar, [lhm] Lhomi, [lhn] Lahanan, [lhp] Lhokpu, [lhs] Mlahs??, [lht] Lo-Toga, [lhu] Lahu, [lia] West-Central Limba, [lib] Likum, [lic] Hlai, [lid] Nyindrou, [lie] Likila, [lif] Limbu, [lig] Ligbi, [lih] Lihir, [lij] Ligurian, [lik] Lika, [lil] Lillooet, [lim] Limburgan, [lim] Limburger, [lim] Limburgish, [lin] Lingala, [lio] Liki, [lip] Sekpele, [liq] Libido, [lir] Liberian English, [lis] Lisu, [lit] Lithuanian, [liu] Logorik, [liv] Liv, [liw] Col, [lix] Liabuku, [liy] Banda-Bambari, [liz] Libinza, [lja] Golpa, [lje] Rampi, [lji] Laiyolo, [ljl] Li'o, [ljp] Lampung Api, [ljw] Yirandali, [ljx] Yuru, [lka] Lakalei, [lkb] Kabras, [lkb] Lukabaras, [lkc] Kucong, [lkd] Lakond??, [lke] Kenyi, [lkh] Lakha, [lki] Laki, [lkj] Remun, [lkl] Laeko-Libuat, [lkm] Kalaamaya, [lkn] Lakon, [lkn] Vure, [lko] Khayo, [lko] Olukhayo, [lkr] P??ri, [lks] Kisa, [lks] Olushisa, [lkt] Lakota, [lku] Kungkari, [lky] Lokoya, [lla] Lala-Roba, [llb] Lolo, [llc] Lele (Guinea), [lld] Ladin, [lle] Lele (Papua New Guinea), [llf] Hermit, [llg] Lole, [llh] Lamu, [lli] Teke-Laali, [llj] Ladji Ladji, [llk] Lelak, [lll] Lilau, [llm] Lasalimu, [lln] Lele (Chad), [llo] Khlor, [llp] North Efate, [llq] Lolak, [lls] Lithuanian Sign Language, [llu] Lau, [llx] Lauan, [lma] East Limba, [lmb] Merei, [lmc] Limilngan, [lmd] Lumun, [lme] P??v??, [lmf] South Lembata, [lmg] Lamogai, [lmh] Lambichhong, [lmi] Lombi, [lmj] West Lembata, [lmk] Lamkang, [lml] Hano, [lmn] Lambadi, [lmo] Lombard, [lmp] Limbum, [lmq] Lamatuka, [lmr] Lamalera, [lmu] Lamenu, [lmv] Lomaiviti, [lmw] Lake Miwok, [lmx] Laimbue, [lmy] Lamboya, [lmz] Lumbee, [lna] Langbashe, [lnb] Mbalanhu, [lnd] Lun Bawang, [lnd] Lundayeh, [lng] Langobardic, [lnh] Lanoh, [lni] Daantanai', [lnj] Leningitij, [lnl] South Central Banda, [lnm] Langam, [lnn] Lorediakarkar, [lno] Lango (South Sudan), [lns] Lamnso', [lnu] Longuda, [lnw] Lanima, [lnz] Lonzo, [loa] Loloda, [lob] Lobi, [loc] Inonhan, [loe] Saluan, [lof] Logol, [log] Logo, [loh] Narim, [loi] Loma (C??te d'Ivoire), [loj] Lou, [lok] Loko, [lol] Mongo, [lom] Loma (Liberia), [lon] Malawi Lomwe, [loo] Lombo, [lop] Lopa, [loq] Lobala, [lor] T????n, [los] Loniu, [lot] Otuho, [lou] Louisiana Creole, [lov] Lopi, [low] Tampias Lobu, [lox] Loun, [loy] Loke, [loz] Lozi, [lpa] Lelepa, [lpe] Lepki, [lpn] Long Phuri Naga, [lpo] Lipo, [lpx] Lopit, [lra] Rara Bakati', [lrc] Northern Luri, [lre] Laurentian, [lrg] Laragia, [lri] Marachi, [lri] Olumarachi, [lrk] Loarki, [lrl] Lari, [lrm] Marama, [lrm] Olumarama, [lrn] Lorang, [lro] Laro, [lrr] Southern Yamphu, [lrt] Larantuka Malay, [lrv] Larevat, [lrz] Lemerig, [lsa] Lasgerdi, [lsd] Lishana Deni, [lse] Lusengo, [lsh] Lish, [lsi] Lashi, [lsl] Latvian Sign Language, [lsm] Olusamia, [lsm] Saamia, [lso] Laos Sign Language, [lsp] Lengua de Se??as Paname??as, [lsp] Panamanian Sign Language, [lsr] Aruop, [lss] Lasi, [lst] Trinidad and Tobago Sign Language, [lsy] Mauritian Sign Language, [ltc] Late Middle Chinese, [ltg] Latgalian, [lth] Thur, [lti] Leti (Indonesia), [ltn] Latund??, [lto] Olutsotso, [lto] Tsotso, [lts] Lutachoni, [lts] Tachoni, [ltu] Latu, [ltz] Letzeburgesch, [ltz] Luxembourgish, [lua] Luba-Lulua, [lub] Luba-Katanga, [luc] Aringa, [lud] Ludian, [lue] Luvale, [luf] Laua, [lug] Ganda, [lui] Luiseno, [luj] Luna, [luk] Lunanakha, [lul] Olu'bo, [lum] Luimbi, [lun] Lunda, [luo] Dholuo, [luo] Luo (Kenya and Tanzania), [lup] Lumbu, [luq] Lucumi, [lur] Laura, [lus] Lushai, [lut] Lushootseed, [luu] Lumba-Yakkha, [luv] Luwati, [luw] Luo (Cameroon), [luy] Luyia, [luy] Oluluyia, [luz] Southern Luri, [lva] Maku'a, [lvk] Lavukaleve, [lvs] Standard Latvian, [lvu] Levuka, [lwa] Lwalu, [lwe] Lewo Eleng, [lwg] Oluwanga, [lwg] Wanga, [lwh] White Lachi, [lwl] Eastern Lawa, [lwm] Laomian, [lwo] Luwo, [lws] Malawian Sign Language, [lwt] Lewotobi, [lwu] Lawu, [lww] Lewo, [lya] Layakha, [lyg] Lyngngam, [lyn] Luyana, [lzh] Literary Chinese, [lzl] Litzlitz, [lzn] Leinong Naga, [lzz] Laz
[maa] San Jer??nimo Tec??atl Mazatec, [mab] Yutanduchi Mixtec, [mad] Madurese, [mae] Bo-Rukul, [maf] Mafa, [mag] Magahi, [mah] Marshallese, [mai] Maithili, [maj] Jalapa De D??az Mazatec, [mak] Makasar, [mal] Malayalam, [mam] Mam, [man] Manding, [man] Mandingo, [maq] Chiquihuitl??n Mazatec, [mar] Marathi, [mas] Masai, [mat] San Francisco Matlatzinca, [mau] Huautla Mazatec, [mav] Sater??-Maw??, [maw] Mampruli, [max] North Moluccan Malay, [maz] Central Mazahua, [mba] Higaonon, [mbb] Western Bukidnon Manobo, [mbc] Macushi, [mbd] Dibabawon Manobo, [mbe] Molale, [mbf] Baba Malay, [mbh] Mangseng, [mbi] Ilianen Manobo, [mbj] Nad??b, [mbk] Malol, [mbl] Maxakal??, [mbm] Ombamba, [mbn] Macagu??n, [mbo] Mbo (Cameroon), [mbp] Malayo, [mbq] Maisin, [mbr] Nukak Mak??, [mbs] Sarangani Manobo, [mbt] Matigsalug Manobo, [mbu] Mbula-Bwazza, [mbv] Mbulungish, [mbw] Maring, [mbx] Mari (East Sepik Province), [mby] Memoni, [mbz] Amoltepec Mixtec, [mca] Maca, [mcb] Machiguenga, [mcc] Bitur, [mcd] Sharanahua, [mce] Itundujia Mixtec, [mcf] Mats??s, [mcg] Mapoyo, [mch] Maquiritari, [mci] Mese, [mcj] Mvanip, [mck] Mbunda, [mcl] Macaguaje, [mcm] Malaccan Creole Portuguese, [mcn] Masana, [mco] Coatl??n Mixe, [mcp] Makaa, [mcq] Ese, [mcr] Menya, [mcs] Mambai, [mct] Mengisa, [mcu] Cameroon Mambila, [mcv] Minanibai, [mcw] Mawa (Chad), [mcx] Mpiemo, [mcy] South Watut, [mcz] Mawan, [mda] Mada (Nigeria), [mdb] Morigi, [mdc] Male (Papua New Guinea), [mdd] Mbum, [mde] Maba (Chad), [mdf] Moksha language, [mdg] Massalat, [mdh] Maguindanaon, [mdi] Mamvu, [mdj] Mangbetu, [mdk] Mangbutu, [mdl] Maltese Sign Language, [mdm] Mayogo, [mdn] Mbati, [mdp] Mbala, [mdq] Mbole, [mdr] Mandar, [mds] Maria (Papua New Guinea), [mdt] Mbere, [mdu] Mboko, [mdv] Santa Luc??a Monteverde Mixtec, [mdw] Mbosi, [mdx] Dizin, [mdy] Male (Ethiopia), [mdz] Suru?? Do Par??, [mea] Menka, [meb] Ikobi, [mec] Mara, [med] Melpa, [mee] Mengen, [mef] Megam, [meh] Southwestern Tlaxiaco Mixtec, [mei] Midob, [mej] Meyah, [mek] Mekeo, [mel] Central Melanau, [mem] Mangala, [men] Mende (Sierra Leone), [meo] Kedah Malay, [mep] Miriwung, [meq] Merey, [mer] Meru, [mes] Masmaje, [met] Mato, [meu] Motu, [mev] Mano, [mew] Maaka, [mey] Hassaniyya, [mez] Menominee, [mfa] Pattani Malay, [mfb] Bangka, [mfc] Mba, [mfd] Mendankwe-Nkwen, [mfe] Morisyen, [mff] Naki, [mfg] Mogofin, [mfh] Matal, [mfi] Wandala, [mfj] Mefele, [mfk] North Mofu, [mfl] Putai, [mfm] Marghi South, [mfn] Cross River Mbembe, [mfo] Mbe, [mfp] Makassar Malay, [mfq] Moba, [mfr] Marithiel, [mfs] Mexican Sign Language, [mft] Mokerang, [mfu] Mbwela, [mfv] Mandjak, [mfw] Mulaha, [mfx] Melo, [mfy] Mayo, [mfz] Mabaan, [mga] Middle Irish (900-1200), [mgb] Mararit, [mgc] Morokodo, [mgd] Moru, [mge] Mango, [mgf] Maklew, [mgg] Mpumpong, [mgh] Makhuwa-Meetto, [mgi] Lijili, [mgj] Abureni, [mgk] Mawes, [mgl] Maleu-Kilenge, [mgm] Mambae, [mgn] Mbangi, [mgo] Meta', [mgp] Eastern Magar, [mgq] Malila, [mgr] Mambwe-Lungu, [mgs] Manda (Tanzania), [mgt] Mongol, [mgu] Mailu, [mgv] Matengo, [mgw] Matumbi, [mgy] Mbunga, [mgz] Mbugwe, [mha] Manda (India), [mhb] Mahongwe, [mhc] Mocho, [mhd] Mbugu, [mhe] Besisi, [mhe] Mah Meri, [mhf] Mamaa, [mhg] Margu, [mhi] Ma'di, [mhj] Mogholi, [mhk] Mungaka, [mhl] Mauwake, [mhm] Makhuwa-Moniga, [mhn] M??cheno, [mho] Mashi (Zambia), [mhp] Balinese Malay, [mhq] Mandan, [mhr] Eastern Mari, [mhs] Buru (Indonesia), [mht] Mandahuaca, [mhu] Darang Deng, [mhu] Digaro-Mishmi, [mhw] Mbukushu, [mhx] Lhaovo, [mhx] Maru, [mhy] Ma'anyan, [mhz] Mor (Mor Islands), [mia] Miami, [mib] Atatl??huca Mixtec, [mic] Micmac, [mic] Mi'kmaq, [mid] Mandaic, [mie] Ocotepec Mixtec, [mif] Mofu-Gudur, [mig] San Miguel El Grande Mixtec, [mih] Chayuco Mixtec, [mii] Chigmecatitl??n Mixtec, [mij] Abar, [mij] Mungbam, [mik] Mikasuki, [mil] Pe??oles Mixtec, [mim] Alacatlatzala Mixtec, [min] Minangkabau, [mio] Pinotepa Nacional Mixtec, [mip] Apasco-Apoala Mixtec, [miq] M??skito, [mir] Isthmus Mixe, [mis] Uncoded languages, [mit] Southern Puebla Mixtec, [miu] Cacaloxtepec Mixtec, [miw] Akoye, [mix] Mixtepec Mixtec, [miy] Ayutla Mixtec, [miz] Coatzospan Mixtec, [mjb] Makalero, [mjc] San Juan Colorado Mixtec, [mjd] Northwest Maidu, [mje] Muskum, [mjg] Tu, [mjh] Mwera (Nyasa), [mji] Kim Mun, [mjj] Mawak, [mjk] Matukar, [mjl] Mandeali, [mjm] Medebur, [mjn] Ma (Papua New Guinea), [mjo] Malankuravan, [mjp] Malapandaram, [mjq] Malaryan, [mjr] Malavedan, [mjs] Miship, [mjt] Sauria Paharia, [mju] Manna-Dora, [mjv] Mannan, [mjw] Karbi, [mjx] Mahali, [mjy] Mahican, [mjz] Majhi, [mka] Mbre, [mkb] Mal Paharia, [mkc] Siliput, [mkd] Macedonian, [mke] Mawchi, [mkf] Miya, [mkg] Mak (China), [mki] Dhatki, [mkj] Mokilese, [mkk] Byep, [mkl] Mokole, [mkm] Moklen, [mkn] Kupang Malay, [mko] Mingang Doso, [mkp] Moikodi, [mkq] Bay Miwok, [mkr] Malas, [mks] Silacayoapan Mixtec, [mkt] Vamale, [mku] Konyanka Maninka, [mkv] Mafea, [mkw] Kituba (Congo), [mkx] Kinamiging Manobo, [mky] East Makian, [mkz] Makasae, [mla] Malo, [mlb] Mbule, [mlc] Cao Lan, [mle] Manambu, [mlf] Mal, [mlg] Malagasy, [mlh] Mape, [mli] Malimpung, [mlj] Miltu, [mlk] Ilwana, [mlk] Kiwilwana, [mll] Malua Bay, [mlm] Mulam, [mln] Malango, [mlo] Mlomp, [mlp] Bargam, [mlq] Western Maninkakan, [mlr] Vame, [mls] Masalit, [mlt] Maltese, [mlu] To'abaita, [mlv] Motlav, [mlv] Mwotlap, [mlw] Moloko, [mlx] Malfaxal, [mlx] Naha'ai, [mlz] Malaynon, [mma] Mama, [mmb] Momina, [mmc] Michoac??n Mazahua, [mmd] Maonan, [mme] Mae, [mmf] Mundat, [mmg] North Ambrym, [mmh] Mehin??ku, [mmi] Musar, [mmj] Majhwar, [mmk] Mukha-Dora, [mml] Man Met, [mmm] Maii, [mmn] Mamanwa, [mmo] Mangga Buang, [mmp] Siawi, [mmq] Musak, [mmr] Western Xiangxi Miao, [mmt] Malalamai, [mmu] Mmaala, [mmv] Miriti, [mmw] Emae, [mmx] Madak, [mmy] Migaama, [mmz] Mabaale, [mna] Mbula, [mnb] Muna, [mnc] Manchu, [mnd] Mond??, [mne] Naba, [mnf] Mundani, [mng] Eastern Mnong, [mnh] Mono (Democratic Republic of Congo), [mni] Manipuri, [mnj] Munji, [mnk] Mandinka, [mnl] Tiale, [mnm] Mapena, [mnn] Southern Mnong, [mnp] Min Bei Chinese, [mnq] Minriq, [mnr] Mono (USA), [mns] Mansi, [mnu] Mer, [mnv] Rennell-Bellona, [mnw] Mon, [mnx] Manikion, [mny] Manyawa, [mnz] Moni, [moa] Mwan, [moc] Mocov??, [mod] Mobilian, [moe] Montagnais, [mog] Mongondow, [moh] Mohawk, [moi] Mboi, [moj] Monzombo, [mok] Morori, [mom] Mangue, [mon] Mongolian, [moo] Monom, [mop] Mop??n Maya, [moq] Mor (Bomberai Peninsula), [mor] Moro, [mos] Mossi, [mot] Bar??, [mou] Mogum, [mov] Mohave, [mow] Moi (Congo), [mox] Molima, [moy] Shekkacho, [moz] Gergiko, [moz] Mukulu, [mpa] Mpoto, [mpb] Mullukmulluk, [mpc] Mangarayi, [mpd] Machinere, [mpe] Majang, [mpg] Marba, [mph] Maung, [mpi] Mpade, [mpj] Martu Wangka, [mpk] Mbara (Chad), [mpl] Middle Watut, [mpm] Yosond??a Mixtec, [mpn] Mindiri, [mpo] Miu, [mpp] Migabac, [mpq] Mat??s, [mpr] Vangunu, [mps] Dadibi, [mpt] Mian, [mpu] Makur??p, [mpv] Mungkip, [mpw] Mapidian, [mpx] Misima-Panaeati, [mpy] Mapia, [mpz] Mpi, [mqa] Maba (Indonesia), [mqb] Mbuko, [mqc] Mangole, [mqe] Matepi, [mqf] Momuna, [mqg] Kota Bangun Kutai Malay, [mqh] Tlazoyaltepec Mixtec, [mqi] Mariri, [mqj] Mamasa, [mqk] Rajah Kabunsuwan Manobo, [mql] Mbelime, [mqm] South Marquesan, [mqn] Moronene, [mqo] Modole, [mqp] Manipa, [mqq] Minokok, [mqr] Mander, [mqs] West Makian, [mqt] Mok, [mqu] Mandari, [mqv] Mosimo, [mqw] Murupi, [mqx] Mamuju, [mqy] Manggarai, [mqz] Pano, [mra] Mlabri, [mrb] Marino, [mrc] Maricopa, [mrd] Western Magar, [mre] Martha's Vineyard Sign Language, [mrf] Elseng, [mrg] Mising, [mrh] Mara Chin, [mri] Maori, [mrj] Western Mari, [mrk] Hmwaveke, [mrl] Mortlockese, [mrm] Merlav, [mrm] Mwerlap, [mrn] Cheke Holo, [mro] Mru, [mrp] Morouas, [mrq] North Marquesan, [mrr] Maria (India), [mrs] Maragus, [mrt] Marghi Central, [mru] Mono (Cameroon), [mrv] Mangareva, [mrw] Maranao, [mrx] Dineor, [mrx] Maremgi, [mry] Mandaya, [mrz] Marind, [msa] Malay (macrolanguage), [msb] Masbatenyo, [msc] Sankaran Maninka, [msd] Yucatec Maya Sign Language, [mse] Musey, [msf] Mekwei, [msg] Moraid, [msh] Masikoro Malagasy, [msi] Sabah Malay, [msj] Ma (Democratic Republic of Congo), [msk] Mansaka, [msl] Molof, [msl] Poule, [msm] Agusan Manobo, [msn] Vur??s, [mso] Mombum, [msp] Maritsau??, [msq] Caac, [msr] Mongolian Sign Language, [mss] West Masela, [msu] Musom, [msv] Maslam, [msw] Mansoanka, [msx] Moresada, [msy] Aruamu, [msz] Momare, [mta] Cotabato Manobo, [mtb] Anyin Morofo, [mtc] Munit, [mtd] Mualang, [mte] Mono (Solomon Islands), [mtf] Murik (Papua New Guinea), [mtg] Una, [mth] Munggui, [mti] Maiwa (Papua New Guinea), [mtj] Moskona, [mtk] Mbe', [mtl] Montol, [mtm] Mator, [mtn] Matagalpa, [mto] Totontepec Mixe, [mtp] Wich?? Lhamt??s Nocten, [mtq] Muong, [mtr] Mewari, [mts] Yora, [mtt] Mota, [mtu] Tututepec Mixtec, [mtv] Asaro'o, [mtw] Southern Binukidnon, [mtx] Tida?? Mixtec, [mty] Nabi, [mua] Mundang, [mub] Mubi, [muc] Ajumbu, [mud] Mednyj Aleut, [mue] Media Lengua, [mug] Musgu, [muh] M??nd??, [mui] Musi, [muj] Mabire, [muk] Mugom, [mul] Multiple languages, [mum] Maiwala, [muo] Nyong, [mup] Malvi, [muq] Eastern Xiangxi Miao, [mur] Murle, [mus] Creek, [mut] Western Muria, [muu] Yaaku, [muv] Muthuvan, [mux] Bo-Ung, [muy] Muyang, [muz] Mursi, [mva] Manam, [mvb] Mattole, [mvd] Mamboru, [mve] Marwari (Pakistan), [mvf] Peripheral Mongolian, [mvg] Yucua??e Mixtec, [mvh] Mulgi, [mvi] Miyako, [mvk] Mekmek, [mvl] Mbara (Australia), [mvm] Muya, [mvn] Minaveha, [mvo] Marovo, [mvp] Duri, [mvq] Moere, [mvr] Marau, [mvs] Massep, [mvt] Mpotovoro, [mvu] Marfa, [mvv] Tagal Murut, [mvw] Machinga, [mvx] Meoswar, [mvy] Indus Kohistani, [mvz] Mesqan, [mwa] Mwatebu, [mwb] Juwal, [mwc] Are, [mwe] Mwera (Chimwera), [mwf] Murrinh-Patha, [mwg] Aiklep, [mwh] Mouk-Aria, [mwi] Labo, [mwi] Ninde, [mwk] Kita Maninkakan, [mwl] Mirandese, [mwm] Sar, [mwn] Nyamwanga, [mwo] Central Maewo, [mwp] Kala Lagaw Ya, [mwq] M??n Chin, [mwr] Marwari, [mws] Mwimbi-Muthambi, [mwt] Moken, [mwu] Mittu, [mwv] Mentawai, [mww] Hmong Daw, [mwz] Moingi, [mxa] Northwest Oaxaca Mixtec, [mxb] Tezoatl??n Mixtec, [mxc] Manyika, [mxd] Modang, [mxe] Mele-Fila, [mxf] Malgbe, [mxg] Mbangala, [mxh] Mvuba, [mxi] Mozarabic, [mxj] Geman Deng, [mxj] Miju-Mishmi, [mxk] Monumbo, [mxl] Maxi Gbe, [mxm] Meramera, [mxn] Moi (Indonesia), [mxo] Mbowe, [mxp] Tlahuitoltepec Mixe, [mxq] Juquila Mixe, [mxr] Murik (Malaysia), [mxs] Huitepec Mixtec, [mxt] Jamiltepec Mixtec, [mxu] Mada (Cameroon), [mxv] Metlat??noc Mixtec, [mxw] Namo, [mxx] Mahou, [mxx] Mawukakan, [mxy] Southeastern Nochixtl??n Mixtec, [mxz] Central Masela, [mya] Burmese, [myb] Mbay, [myc] Mayeka, [myd] Maramba, [mye] Myene, [myf] Bambassi, [myg] Manta, [myh] Makah, [myi] Mina (India), [myj] Mangayat, [myk] Mamara Senoufo, [myl] Moma, [mym] Me'en, [myo] Anfillo, [myp] Pirah??, [myr] Muniche, [mys] Mesmes, [myu] Munduruk??, [myv] Erzya, [myw] Muyuw, [myx] Masaaba, [myy] Macuna, [myz] Classical Mandaic, [mza] Santa Mar??a Zacatepec Mixtec, [mzb] Tumzabt, [mzc] Madagascar Sign Language, [mzd] Malimba, [mze] Morawa, [mzg] Monastic Sign Language, [mzh] Wich?? Lhamt??s G??isnay, [mzi] Ixcatl??n Mazatec, [mzj] Manya, [mzk] Nigeria Mambila, [mzl] Mazatl??n Mixe, [mzm] Mumuye, [mzn] Mazanderani, [mzo] Matipuhy, [mzp] Movima, [mzq] Mori Atas, [mzr] Mar??bo, [mzs] Macanese, [mzt] Mintil, [mzu] Inapang, [mzv] Manza, [mzw] Deg, [mzx] Mawayana, [mzy] Mozambican Sign Language, [mzz] Maiadomu
[naa] Namla, [nab] Southern Nambiku??ra, [nac] Narak, [nae] Naka'ela, [naf] Nabak, [nag] Naga Pidgin, [naj] Nalu, [nak] Nakanai, [nal] Nalik, [nam] Ngan'gityemerri, [nan] Min Nan Chinese, [nao] Naaba, [nap] Neapolitan, [naq] Khoekhoe, [naq] Nama (Namibia), [nar] Iguta, [nas] Naasioi, [nat] Ca??hungwa??rya??, [nat] Hungworo, [nau] Nauru, [nav] Navaho, [nav] Navajo, [naw] Nawuri, [nax] Nakwi, [nay] Narrinyeri, [naz] Coatepec Nahuatl, [nba] Nyemba, [nbb] Ndoe, [nbc] Chang Naga, [nbd] Ngbinda, [nbe] Konyak Naga, [nbg] Nagarchal, [nbh] Ngamo, [nbi] Mao Naga, [nbj] Ngarinman, [nbk] Nake, [nbl] South Ndebele, [nbm] Ngbaka Ma'bo, [nbn] Kuri, [nbo] Nkukoli, [nbp] Nnam, [nbq] Nggem, [nbr] Numana-Nunku-Gbantu-Numbu, [nbs] Namibian Sign Language, [nbt] Na, [nbu] Rongmei Naga, [nbv] Ngamambo, [nbw] Southern Ngbandi, [nby] Ningera, [nca] Iyo, [ncb] Central Nicobarese, [ncc] Ponam, [ncd] Nachering, [nce] Yale, [ncf] Notsi, [ncg] Nisga'a, [nch] Central Huasteca Nahuatl, [nci] Classical Nahuatl, [ncj] Northern Puebla Nahuatl, [nck] Nakara, [ncl] Michoac??n Nahuatl, [ncm] Nambo, [ncn] Nauna, [nco] Sibe, [ncq] Northern Katang, [ncr] Ncane, [ncs] Nicaraguan Sign Language, [nct] Chothe Naga, [ncu] Chumburung, [ncx] Central Puebla Nahuatl, [ncz] Natchez, [nda] Ndasa, [ndb] Kenswei Nsei, [ndc] Ndau, [ndd] Nde-Nsele-Nta, [nde] North Ndebele, [ndf] Nadruvian, [ndg] Ndengereko, [ndh] Ndali, [ndi] Samba Leko, [ndj] Ndamba, [ndk] Ndaka, [ndl] Ndolo, [ndm] Ndam, [ndn] Ngundi, [ndo] Ndonga, [ndp] Ndo, [ndq] Ndombe, [ndr] Ndoola, [nds] Low German, [nds] Low Saxon, [ndt] Ndunga, [ndu] Dugun, [ndv] Ndut, [ndw] Ndobo, [ndx] Nduga, [ndy] Lutos, [ndz] Ndogo, [nea] Eastern Ngad'a, [neb] Toura (C??te d'Ivoire), [nec] Nedebang, [ned] Nde-Gbite, [nee] N??l??mwa-Nixumwak, [nef] Nefamese, [neg] Negidal, [neh] Nyenkha, [nei] Neo-Hittite, [nej] Neko, [nek] Neku, [nem] Nemi, [nen] Nengone, [neo] N??-Meo, [nep] Nepali (macrolanguage), [neq] North Central Mixe, [ner] Yahadian, [nes] Bhoti Kinnauri, [net] Nete, [neu] Neo, [nev] Nyaheun, [new] Nepal Bhasa, [new] Newari, [nex] Neme, [ney] Neyo, [nez] Nez Perce, [nfa] Dhao, [nfd] Ahwai, [nfl] ??iwoo, [nfl] Ayiwo, [nfr] Nafaanra, [nfu] Mfumte, [nga] Ngbaka, [ngb] Northern Ngbandi, [ngc] Ngombe (Democratic Republic of Congo), [ngd] Ngando (Central African Republic), [nge] Ngemba, [ngg] Ngbaka Manza, [ngh] N??u, [ngi] Ngizim, [ngj] Ngie, [ngk] Dalabon, [ngl] Lomwe, [ngm] Ngatik Men's Creole, [ngn] Ngwo, [ngo] Ngoni, [ngp] Ngulu, [ngq] Ngoreme, [ngq] Ngurimi, [ngr] Engdewu, [ngs] Gvoko, [ngt] Kriang, [ngt] Ngeq, [ngu] Guerrero Nahuatl, [ngv] Nagumi, [ngw] Ngwaba, [ngx] Nggwahyi, [ngy] Tibea, [ngz] Ngungwel, [nha] Nhanda, [nhb] Beng, [nhc] Tabasco Nahuatl, [nhd] Ava Guaran??, [nhd] Chirip??, [nhe] Eastern Huasteca Nahuatl, [nhf] Nhuwala, [nhg] Tetelcingo Nahuatl, [nhh] Nahari language, [nhi] Zacatl??n-Ahuacatl??n-Tepetzintla Nahuatl, [nhk] Isthmus-Cosoleacaque Nahuatl, [nhm] Morelos Nahuatl, [nhn] Central Nahuatl, [nho] Takuu, [nhp] Isthmus-Pajapan Nahuatl, [nhq] Huaxcaleca Nahuatl, [nhr] Naro, [nht] Ometepec Nahuatl, [nhu] Noone, [nhv] Temascaltepec Nahuatl, [nhw] Western Huasteca Nahuatl, [nhx] Isthmus-Mecayapan Nahuatl, [nhy] Northern Oaxaca Nahuatl, [nhz] Santa Mar??a La Alta Nahuatl, [nia] Nias, [nib] Nakame, [nid] Ngandi, [nie] Niellim, [nif] Nek, [nig] Ngalakan, [nih] Nyiha (Tanzania), [nii] Nii, [nij] Ngaju, [nik] Southern Nicobarese, [nil] Nila, [nim] Nilamba, [nin] Ninzo, [nio] Nganasan, [niq] Nandi, [nir] Nimboran, [nis] Nimi, [nit] Southeastern Kolami, [niu] Niuean, [niv] Gilyak, [niw] Nimo, [nix] Hema, [niy] Ngiti, [niz] Ningil, [nja] Nzanyi, [njb] Nocte Naga, [njd] Ndonde Hamba, [njh] Lotha Naga, [nji] Gudanji, [njj] Njen, [njl] Njalgulgule, [njm] Angami Naga, [njn] Liangmai Naga, [njo] Ao Naga, [njr] Njerep, [njs] Nisa, [njt] Ndyuka-Trio Pidgin, [nju] Ngadjunmaya, [njx] Kunyi, [njy] Njyem, [njz] Nyishi, [nka] Nkoya, [nkb] Khoibu Naga, [nkc] Nkongho, [nkd] Koireng, [nke] Duke, [nkf] Inpui Naga, [nkg] Nekgini, [nkh] Khezha Naga, [nki] Thangal Naga, [nkj] Nakai, [nkk] Nokuku, [nkm] Namat, [nkn] Nkangala, [nko] Nkonya, [nkp] Niuatoputapu, [nkq] Nkami, [nkr] Nukuoro, [nks] North Asmat, [nkt] Nyika (Tanzania), [nku] Bouna Kulango, [nkv] Nyika (Malawi and Zambia), [nkw] Nkutu, [nkx] Nkoroo, [nkz] Nkari, [nla] Ngombale, [nlc] Nalca, [nld] Dutch, [nld] Flemish, [nle] East Nyala, [nlg] Gela, [nli] Grangali, [nlj] Nyali, [nlk] Ninia Yali, [nll] Nihali, [nlm] Mankiyali, [nlo] Ngul, [nlq] Lao Naga, [nlu] Nchumbulu, [nlv] Orizaba Nahuatl, [nlw] Walangama, [nlx] Nahali, [nly] Nyamal, [nlz] Nal??go, [nma] Maram Naga, [nmb] Big Nambas, [nmb] V'??nen Taut, [nmc] Ngam, [nmd] Ndumu, [nme] Mzieme Naga, [nmf] Tangkhul Naga (India), [nmg] Kwasio, [nmh] Monsang Naga, [nmi] Nyam, [nmj] Ngombe (Central African Republic), [nmk] Namakura, [nml] Ndemli, [nmm] Manangba, [nmn] ??X????, [nmo] Moyon Naga, [nmp] Nimanbur, [nmq] Nambya, [nmr] Nimbari, [nms] Letemboi, [nmt] Namonuito, [nmu] Northeast Maidu, [nmv] Ngamini, [nmw] Nimoa, [nmw] Rifao, [nmx] Nama (Papua New Guinea), [nmy] Namuyi, [nmz] Nawdm, [nna] Nyangumarta, [nnb] Nande, [nnc] Nancere, [nnd] West Ambae, [nne] Ngandyera, [nnf] Ngaing, [nng] Maring Naga, [nnh] Ngiemboon, [nni] North Nuaulu, [nnj] Nyangatom, [nnk] Nankina, [nnl] Northern Rengma Naga, [nnm] Namia, [nnn] Ngete, [nno] Norwegian Nynorsk, [nnp] Wancho Naga, [nnq] Ngindo, [nnr] Narungga, [nns] Ningye, [nnt] Nanticoke, [nnu] Dwang, [nnv] Nugunu (Australia), [nnw] Southern Nuni, [nny] Nyangga, [nnz] Nda'nda', [noa] Woun Meu, [nob] Norwegian Bokm??l, [noc] Nuk, [nod] Northern Thai, [noe] Nimadi, [nof] Nomane, [nog] Nogai, [noh] Nomu, [noi] Noiri, [noj] Nonuya, [nok] Nooksack, [nol] Nomlaki, [nom] Nocam??n, [non] Old Norse, [nop] Numanggang, [noq] Ngongo, [nor] Norwegian, [nos] Eastern Nisu, [not] Nomatsiguenga, [nou] Ewage-Notu, [nov] Novial, [now] Nyambo, [noy] Noy, [noz] Nayi, [npa] Nar Phu, [npb] Nupbikha, [npg] Ponyo-Gongwang Naga, [nph] Phom Naga, [npi] Nepali (individual language), [npl] Southeastern Puebla Nahuatl, [npn] Mondropolon, [npo] Pochuri Naga, [nps] Nipsan, [npu] Puimei Naga, [npx] Noipx, [npy] Napu, [nqg] Southern Nago, [nqk] Kura Ede Nago, [nql] Ngendelengo, [nqm] Ndom, [nqn] Nen, [nqo] N'Ko, [nqq] Kyan-Karyaw Naga, [nqy] Akyaung Ari Naga, [nra] Ngom, [nrb] Nara, [nrc] Noric, [nre] Southern Rengma Naga, [nrf] Guern??siais, [nrf] J??rriais, [nrg] Narango, [nri] Chokri Naga, [nrk] Ngarla, [nrl] Ngarluma, [nrm] Narom, [nrn] Norn, [nrp] North Picene, [nrr] Nora, [nrr] Norra, [nrt] Northern Kalapuya, [nru] Narua, [nrx] Ngurmbur, [nrz] Lala, [nsa] Sangtam Naga, [nsc] Nshi, [nsd] Southern Nisu, [nse] Nsenga, [nsf] Northwestern Nisu, [nsg] Ngasa, [nsh] Ngoshie, [nsi] Nigerian Sign Language, [nsk] Naskapi, [nsl] Norwegian Sign Language, [nsm] Sumi Naga, [nsn] Nehan, [nso] Northern Sotho, [nso] Pedi, [nso] Sepedi, [nsp] Nepalese Sign Language, [nsq] Northern Sierra Miwok, [nsr] Maritime Sign Language, [nss] Nali, [nst] Tase Naga, [nsu] Sierra Negra Nahuatl, [nsv] Southwestern Nisu, [nsw] Navut, [nsx] Nsongo, [nsy] Nasal, [nsz] Nisenan, [ntd] Northern Tidung, [nte] Nathembo, [ntg] Ngantangarra, [nti] Natioro, [ntj] Ngaanyatjarra, [ntk] Ikoma-Nata-Isenye, [ntm] Nateni, [nto] Ntomba, [ntp] Northern Tepehuan, [ntr] Delo, [ntu] Nat??gu, [ntw] Nottoway, [ntx] Tangkhul Naga (Myanmar), [nty] Mantsi, [ntz] Natanzi, [nua] Yuanga, [nuc] Nukuini, [nud] Ngala, [nue] Ngundu, [nuf] Nusu, [nug] Nungali, [nuh] Ndunda, [nui] Ngumbi, [nuj] Nyole, [nuk] Nuuchahnulth, [nuk] Nuu-chah-nulth, [nul] Nusa Laut, [num] Niuafo'ou, [nun] Anong, [nuo] Ngu??n, [nup] Nupe-Nupe-Tako, [nuq] Nukumanu, [nur] Nukuria, [nus] Nuer, [nut] Nung (Viet Nam), [nuu] Ngbundu, [nuv] Northern Nuni, [nuw] Nguluwan, [nux] Mehek, [nuy] Nunggubuyu, [nuz] Tlamacazapa Nahuatl, [nvh] Nasarian, [nvm] Namiae, [nvo] Nyokon, [nwa] Nawathinehena, [nwb] Nyabwa, [nwc] Classical Nepal Bhasa, [nwc] Classical Newari, [nwc] Old Newari, [nwe] Ngwe, [nwg] Ngayawung, [nwi] Southwest Tanna, [nwm] Nyamusa-Molo, [nwo] Nauo, [nwr] Nawaru, [nwx] Middle Newar, [nwy] Nottoway-Meherrin, [nxa] Nauete, [nxd] Ngando (Democratic Republic of Congo), [nxe] Nage, [nxg] Ngad'a, [nxi] Nindi, [nxk] Koki Naga, [nxl] South Nuaulu, [nxm] Numidian, [nxn] Ngawun, [nxo] Ndambomo, [nxq] Naxi, [nxr] Ninggerum, [nxu] Narau, [nxx] Nafri, [nya] Chewa, [nya] Chichewa, [nya] Nyanja, [nyb] Nyangbo, [nyc] Nyanga-li, [nyd] Nyore, [nyd] Olunyole, [nye] Nyengo, [nyf] Giryama, [nyf] Kigiryama, [nyg] Nyindu, [nyh] Nyigina, [nyi] Ama (Sudan), [nyj] Nyanga, [nyk] Nyaneka, [nyl] Nyeu, [nym] Nyamwezi, [nyn] Nyankole, [nyo] Nyoro, [nyp] Nyang'i, [nyq] Nayini, [nyr] Nyiha (Malawi), [nys] Nyunga, [nyt] Nyawaygi, [nyu] Nyungwe, [nyv] Nyulnyul, [nyw] Nyaw, [nyx] Nganyaywana, [nyy] Nyakyusa-Ngonde, [nza] Tigon Mbembe, [nzb] Njebi, [nzd] Nzadi, [nzi] Nzima, [nzk] Nzakara, [nzm] Zeme Naga, [nzs] New Zealand Sign Language, [nzu] Teke-Nzikou, [nzy] Nzakambay, [nzz] Nanga Dama Dogon
[oaa] Orok, [oac] Oroch, [oar] Ancient Aramaic (up to 700 BCE), [oar] Old Aramaic (up to 700 BCE), [oav] Old Avar, [obi] Obispe??o, [obk] Southern Bontok, [obl] Oblo, [obm] Moabite, [obo] Obo Manobo, [obr] Old Burmese, [obt] Old Breton, [obu] Obulom, [oca] Ocaina, [och] Old Chinese, [oci] Occitan (post 1500), [oco] Old Cornish, [ocu] Atzingo Matlatzinca, [oda] Odut, [odk] Od, [odt] Old Dutch, [odu] Odual, [ofo] Ofo, [ofs] Old Frisian, [ofu] Efutop, [ogb] Ogbia, [ogc] Ogbah, [oge] Old Georgian, [ogg] Ogbogolo, [ogo] Khana, [ogu] Ogbronuagum, [oht] Old Hittite, [ohu] Old Hungarian, [oia] Oirata, [oin] Inebu One, [ojb] Northwestern Ojibwa, [ojc] Central Ojibwa, [ojg] Eastern Ojibwa, [oji] Ojibwa, [ojp] Old Japanese, [ojs] Severn Ojibwa, [ojv] Ontong Java, [ojw] Western Ojibwa, [oka] Okanagan, [okb] Okobo, [okd] Okodia, [oke] Okpe (Southwestern Edo), [okg] Koko Babangk, [okh] Koresh-e Rostam, [oki] Okiek, [okj] Oko-Juwoi, [okk] Kwamtim One, [okl] Old Kentish Sign Language, [okm] Middle Korean (10th-16th cent.), [okn] Oki-No-Erabu, [oko] Old Korean (3rd-9th cent.), [okr] Kirike, [oks] Oko-Eni-Osayen, [oku] Oku, [okv] Orokaiva, [okx] Okpe (Northwestern Edo), [ola] Walungge, [old] Mochi, [ole] Olekha, [olk] Olkol, [olm] Oloma, [olo] Livvi, [olr] Olrat, [olt] Old Lithuanian, [olu] Kuvale, [oma] Omaha-Ponca, [omb] East Ambae, [omc] Mochica, [omg] Omagua, [omi] Omi, [omk] Omok, [oml] Ombo, [omn] Minoan, [omo] Utarmbung, [omp] Old Manipuri, [omr] Old Marathi, [omt] Omotik, [omu] Omurano, [omw] South Tairora, [omx] Old Mon, [ona] Ona, [onb] Lingao, [one] Oneida, [ong] Olo, [oni] Onin, [onj] Onjob, [onk] Kabore One, [onn] Onobasulu, [ono] Onondaga, [onp] Sartang, [onr] Northern One, [ons] Ono, [ont] Ontenu, [onu] Unua, [onw] Old Nubian, [onx] Onin Based Pidgin, [ood] Tohono O'odham, [oog] Ong, [oon] ??nge, [oor] Oorlams, [oos] Old Ossetic, [opa] Okpamheri, [opk] Kopkaka, [opm] Oksapmin, [opo] Opao, [opt] Opata, [opy] Ofay??, [ora] Oroha, [orc] Orma, [ore] Orej??n, [org] Oring, [orh] Oroqen, [ori] Oriya (macrolanguage), [orm] Oromo, [orn] Orang Kanaq, [oro] Orokolo, [orr] Oruma, [ors] Orang Seletar, [ort] Adivasi Oriya, [oru] Ormuri, [orv] Old Russian, [orw] Oro Win, [orx] Oro, [ory] Odia, [ory] Oriya (individual language), [orz] Ormu, [osa] Osage, [osc] Oscan, [osi] Osing, [oso] Ososo, [osp] Old Spanish, [oss] Ossetian, [oss] Ossetic, [ost] Osatu, [osu] Southern One, [osx] Old Saxon, [ota] Ottoman Turkish (1500-1928), [otb] Old Tibetan, [otd] Ot Danum, [ote] Mezquital Otomi, [oti] Oti, [otk] Old Turkish, [otl] Tilapa Otomi, [otm] Eastern Highland Otomi, [otn] Tenango Otomi, [otq] Quer??taro Otomi, [otr] Otoro, [ots] Estado de M??xico Otomi, [ott] Temoaya Otomi, [otu] Otuke, [otw] Ottawa, [otx] Texcatepec Otomi, [oty] Old Tamil, [otz] Ixtenco Otomi, [oua] Tagargrent, [oub] Glio-Oubi, [oue] Oune, [oui] Old Uighur, [oum] Ouma, [ovd] Elfdalian, [ovd] ??vdalian, [owi] Owiniga, [owl] Old Welsh, [oyb] Oy, [oyd] Oyda, [oym] Wayampi, [oyy] Oya'oya, [ozm] Koonzime
[pab] Parec??s, [pac] Pacoh, [pad] Paumar??, [pae] Pagibete, [paf] Paranaw??t, [pag] Pangasinan language, [pah] Tenharim, [pai] Pe, [pak] Parakan??, [pal] Pahlavi, [pam] Kapampangan, [pam] Pampanga, [pan] Panjabi, [pan] Punjabi, [pao] Northern Paiute, [pap] Papiamento, [paq] Parya, [par] Panamint, [par] Timbisha, [pas] Papasena, [pat] Papitalai, [pau] Palauan, [pav] Paka??snovos, [paw] Pawnee, [pax] Pankarar??, [pay] Pech, [paz] Pankarar??, [pbb] P??ez, [pbc] Patamona, [pbe] Mezontla Popoloca, [pbf] Coyotepec Popoloca, [pbg] Paraujano, [pbh] E'??apa Woromaipu, [pbi] Parkwa, [pbl] Mak (Nigeria), [pbm] Puebla Mazatec, [pbn] Kpasam, [pbo] Papel, [pbp] Badyara, [pbr] Pangwa, [pbs] Central Pame, [pbt] Southern Pashto, [pbu] Northern Pashto, [pbv] Pnar, [pby] Pyu (Papua New Guinea), [pca] Santa In??s Ahuatempan Popoloca, [pcb] Pear, [pcc] Bouyei, [pcd] Picard, [pce] Ruching Palaung, [pcf] Paliyan, [pcg] Paniya, [pch] Pardhan, [pci] Duruwa, [pcj] Parenga, [pck] Paite Chin, [pcl] Pardhi, [pcm] Nigerian Pidgin, [pcn] Piti, [pcp] Pacahuara, [pcw] Pyapun, [pda] Anam, [pdc] Pennsylvania German, [pdi] Pa Di, [pdn] Fedan, [pdn] Podena, [pdo] Padoe, [pdt] Plautdietsch, [pdu] Kayan, [pea] Peranakan Indonesian, [peb] Eastern Pomo, [ped] Mala (Papua New Guinea), [pee] Taje, [pef] Northeastern Pomo, [peg] Pengo, [peh] Bonan, [pei] Chichimeca-Jonaz, [pej] Northern Pomo, [pek] Penchal, [pel] Pekal, [pem] Phende, [peo] Old Persian (ca. 600-400 B.C.), [pep] Kunja, [peq] Southern Pomo, [pes] Iranian Persian, [pev] P??mono, [pex] Petats, [pey] Petjo, [pez] Eastern Penan, [pfa] P????fang, [pfe] Peere, [pfl] Pfaelzisch, [pga] Sudanese Creole Arabic, [pgd] G??ndh??r??, [pgg] Pangwali, [pgi] Pagi, [pgk] Rerep, [pgl] Primitive Irish, [pgn] Paelignian, [pgs] Pangseng, [pgu] Pagu, [pgz] Papua New Guinean Sign Language, [pha] Pa-Hng, [phd] Phudagi, [phg] Phuong, [phh] Phukha, [phk] Phake, [phl] Palula, [phl] Phalura, [phm] Phimbi, [phn] Phoenician, [pho] Phunoi, [phq] Phana', [phr] Pahari-Potwari, [pht] Phu Thai, [phu] Phuan, [phv] Pahlavani, [phw] Phangduwali, [pia] Pima Bajo, [pib] Yine, [pic] Pinji, [pid] Piaroa, [pie] Piro, [pif] Pingelapese, [pig] Pisabo, [pih] Pitcairn-Norfolk, [pii] Pini, [pij] Pijao, [pil] Yom, [pim] Powhatan, [pin] Piame, [pio] Piapoco, [pip] Pero, [pir] Piratapuyo, [pis] Pijin, [pit] Pitta Pitta, [piu] Pintupi-Luritja, [piv] Pileni, [piv] Vaeakau-Taumako, [piw] Pimbwe, [pix] Piu, [piy] Piya-Kwonci, [piz] Pije, [pjt] Pitjantjatjara, [pka] Ardham??gadh?? Pr??krit, [pkb] Kipfokomo, [pkb] Pokomo, [pkc] Paekche, [pkg] Pak-Tong, [pkh] Pankhu, [pkn] Pakanha, [pko] P??koot, [pkp] Pukapuka, [pkr] Attapady Kurumba, [pks] Pakistan Sign Language, [pkt] Maleng, [pku] Paku, [pla] Miani, [plb] Polonombauk, [plc] Central Palawano, [pld] Polari, [ple] Palu'e, [plg] Pilag??, [plh] Paulohi, [pli] Pali, [plj] Polci, [plk] Kohistani Shina, [pll] Shwe Palaung, [pln] Palenquero, [plo] Oluta Popoluca, [plp] Palpa, [plq] Palaic, [plr] Palaka Senoufo, [pls] San Marcos Tlacoyalco Popoloca, [pls] San Marcos Tlalcoyalco Popoloca, [plt] Plateau Malagasy, [plu] Palik??r, [plv] Southwest Palawano, [plw] Brooke's Point Palawano, [ply] Bolyu, [plz] Paluan, [pma] Paama, [pmb] Pambia, [pmd] Pallanganmiddang, [pme] Pwaamei, [pmf] Pamona, [pmh] M??h??r????????ri Pr??krit, [pmi] Northern Pumi, [pmj] Southern Pumi, [pmk] Pamlico, [pml] Lingua Franca, [pmm] Pomo, [pmn] Pam, [pmo] Pom, [pmq] Northern Pame, [pmr] Paynamar, [pms] Piemontese, [pmt] Tuamotuan, [pmw] Plains Miwok, [pmx] Poumei Naga, [pmy] Papuan Malay, [pmz] Southern Pame, [pna] Punan Bah-Biau, [pnb] Western Panjabi, [pnc] Pannei, [pne] Western Penan, [png] Pongu, [pnh] Penrhyn, [pni] Aoheng, [pnj] Pinjarup, [pnk] Paunaka, [pnl] Paleni, [pnm] Punan Batu 1, [pnn] Pinai-Hagahai, [pno] Panobo, [pnp] Pancana, [pnq] Pana (Burkina Faso), [pnr] Panim, [pns] Ponosakan, [pnt] Pontic, [pnu] Jiongnai Bunu, [pnv] Pinigura, [pnw] Panytyima, [pnx] Phong-Kniang, [pny] Pinyin, [pnz] Pana (Central African Republic), [poc] Poqomam, [poe] San Juan Atzingo Popoloca, [pof] Poke, [pog] Potigu??ra, [poh] Poqomchi', [poi] Highland Popoluca, [pok] Pokang??, [pol] Polish, [pom] Southeastern Pomo, [pon] Pohnpeian, [poo] Central Pomo, [pop] Pwapw??, [poq] Texistepec Popoluca, [por] Portuguese, [pos] Sayula Popoluca, [pot] Potawatomi, [pov] Upper Guinea Crioulo, [pow] San Felipe Otlaltepec Popoloca, [pox] Polabian, [poy] Pogolo, [ppe] Papi, [ppi] Paipai, [ppk] Uma, [ppl] Nicarao, [ppl] Pipil, [ppm] Papuma, [ppn] Papapana, [ppo] Folopa, [ppp] Pelende, [ppq] Pei, [pps] San Lu??s Temalacayuca Popoloca, [ppt] Pare, [ppu] Papora, [pqa] Pa'a, [pqm] Malecite-Passamaquoddy, [prc] Parachi, [prd] Parsi-Dari, [pre] Principense, [prf] Paranan, [prg] Prussian, [prh] Porohanon, [pri] Paic??, [prk] Parauk, [prl] Peruvian Sign Language, [prm] Kibiri, [prn] Prasuni, [pro] Old Occitan (to 1500), [pro] Old Proven??al (to 1500), [prp] Parsi, [prq] Ash??ninka Peren??, [prr] Puri, [prs] Afghan Persian, [prs] Dari, [prt] Phai, [pru] Puragi, [prw] Parawen, [prx] Purik, [prz] Providencia Sign Language, [psa] Asue Awyu, [psc] Persian Sign Language, [psd] Plains Indian Sign Language, [pse] Central Malay, [psg] Penang Sign Language, [psh] Southwest Pashai, [psh] Southwest Pashayi, [psi] Southeast Pashai, [psi] Southeast Pashayi, [psl] Puerto Rican Sign Language, [psm] Pauserna, [psn] Panasuan, [pso] Polish Sign Language, [psp] Philippine Sign Language, [psq] Pasi, [psr] Portuguese Sign Language, [pss] Kaulong, [pst] Central Pashto, [psu] Sauraseni Pr??krit, [psw] Port Sandwich, [psy] Piscataway, [pta] Pai Tavytera, [pth] Patax?? H??-Ha-H??e, [pti] Pintiini, [ptn] Patani, [pto] Zo'??, [ptp] Patep, [ptq] Pattapu, [ptr] Piamatsina, [ptt] Enrekang, [ptu] Bambam, [ptv] Port Vato, [ptw] Pentlatch, [pty] Pathiya, [pua] Western Highland Purepecha, [pub] Purum, [puc] Punan Merap, [pud] Punan Aput, [pue] Puelche, [puf] Punan Merah, [pug] Phuie, [pui] Puinave, [puj] Punan Tubu, [pum] Puma, [puo] Puoc, [pup] Pulabu, [puq] Puquina, [pur] Purubor??, [pus] Pashto, [pus] Pushto, [put] Putoh, [puu] Punu, [puw] Puluwatese, [pux] Puare, [puy] Purisime??o, [pwa] Pawaia, [pwb] Panawa, [pwg] Gapapaiwa, [pwi] Patwin, [pwm] Molbog, [pwn] Paiwan, [pwo] Pwo Western Karen, [pwr] Powari, [pww] Pwo Northern Karen, [pxm] Quetzaltepec Mixe, [pye] Pye Krumen, [pym] Fyam, [pyn] Poyan??wa, [pys] Lengua de Se??as del Paraguay, [pys] Paraguayan Sign Language, [pyu] Puyuma, [pyx] Pyu (Myanmar), [pyy] Pyen, [pzn] Para Naga
[qua] Quapaw, [qub] Huallaga Hu??nuco Quechua, [quc] K'iche', [quc] Quich??, [qud] Calder??n Highland Quichua, [que] Quechua, [quf] Lambayeque Quechua, [qug] Chimborazo Highland Quichua, [quh] South Bolivian Quechua, [qui] Quileute, [quk] Chachapoyas Quechua, [qul] North Bolivian Quechua, [qum] Sipacapense, [qun] Quinault, [qup] Southern Pastaza Quechua, [quq] Quinqui, [qur] Yanahuanca Pasco Quechua, [qus] Santiago del Estero Quichua, [quv] Sacapulteco, [quw] Tena Lowland Quichua, [qux] Yauyos Quechua, [quy] Ayacucho Quechua, [quz] Cusco Quechua, [qva] Ambo-Pasco Quechua, [qvc] Cajamarca Quechua, [qve] Eastern Apur??mac Quechua, [qvh] Huamal??es-Dos de Mayo Hu??nuco Quechua, [qvi] Imbabura Highland Quichua, [qvj] Loja Highland Quichua, [qvl] Cajatambo North Lima Quechua, [qvm] Margos-Yarowilca-Lauricocha Quechua, [qvn] North Jun??n Quechua, [qvo] Napo Lowland Quechua, [qvp] Pacaraos Quechua, [qvs] San Mart??n Quechua, [qvw] Huaylla Wanca Quechua, [qvy] Queyu, [qvz] Northern Pastaza Quichua, [qwa] Corongo Ancash Quechua, [qwc] Classical Quechua, [qwh] Huaylas Ancash Quechua, [qwm] Kuman (Russia), [qws] Sihuas Ancash Quechua, [qwt] Kwalhioqua-Tlatskanai, [qxa] Chiqui??n Ancash Quechua, [qxc] Chincha Quechua, [qxh] Panao Hu??nuco Quechua, [qxl] Salasaca Highland Quichua, [qxn] Northern Conchucos Ancash Quechua, [qxo] Southern Conchucos Ancash Quechua, [qxp] Puno Quechua, [qxq] Qashqa'i, [qxr] Ca??ar Highland Quichua, [qxs] Southern Qiang, [qxt] Santa Ana de Tusi Pasco Quechua, [qxu] Arequipa-La Uni??n Quechua, [qxw] Jauja Wanca Quechua, [qya] Quenya, [qyp] Quiripi
[raa] Dungmali, [rab] Camling, [rac] Rasawa, [rad] Rade, [raf] Western Meohang, [rag] Logooli, [rag] Lulogooli, [rah] Rabha, [rai] Ramoaaina, [raj] Rajasthani, [rak] Tulu-Bohuai, [ral] Ralte, [ram] Canela, [ran] Riantana, [rao] Rao, [rap] Rapanui, [raq] Saam, [rar] Cook Islands Maori, [rar] Rarotongan, [ras] Tegali, [rat] Razajerdi, [rau] Raute, [rav] Sampang, [raw] Rawang, [rax] Rang, [ray] Rapa, [raz] Rahambuu, [rbb] Rumai Palaung, [rbk] Northern Bontok, [rbl] Miraya Bikol, [rbp] Barababaraba, [rcf] R??union Creole French, [rdb] Rudbari, [rea] Rerau, [reb] Rembong, [ree] Rejang Kayan, [reg] Kara (Tanzania), [rei] Reli, [rej] Rejang, [rel] Rendille, [rem] Remo, [ren] Rengao, [rer] Rer Bare, [res] Reshe, [ret] Retta, [rey] Reyesano, [rga] Roria, [rge] Romano-Greek, [rgk] Rangkas, [rgn] Romagnol, [rgr] Res??garo, [rgs] Southern Roglai, [rgu] Ringgou, [rhg] Rohingya, [rhp] Yahang, [ria] Riang (India), [rif] Tarifit, [ril] Riang (Myanmar), [rim] Nyaturu, [rin] Nungu, [rir] Ribun, [rit] Ritarungo, [riu] Riung, [rjg] Rajong, [rji] Raji, [rjs] Rajbanshi, [rka] Kraol, [rkb] Rikbaktsa, [rkh] Rakahanga-Manihiki, [rki] Rakhine, [rkm] Marka, [rkt] Kamta, [rkt] Rangpuri, [rkw] Arakwal, [rma] Rama, [rmb] Rembarunga, [rmc] Carpathian Romani, [rmd] Traveller Danish, [rme] Angloromani, [rmf] Kalo Finnish Romani, [rmg] Traveller Norwegian, [rmh] Murkim, [rmi] Lomavren, [rmk] Romkun, [rml] Baltic Romani, [rmm] Roma, [rmn] Balkan Romani, [rmo] Sinte Romani, [rmp] Rempi, [rmq] Cal??, [rms] Romanian Sign Language, [rmt] Domari, [rmu] Tavringer Romani, [rmv] Romanova, [rmw] Welsh Romani, [rmx] Romam, [rmy] Vlax Romani, [rmz] Marma, [rnd] Ruund, [rng] Ronga, [rnl] Ranglong, [rnn] Roon, [rnp] Rongpo, [rnr] Nari Nari, [rnw] Rungwa, [rob] Tae', [roc] Cacgia Roglai, [rod] Rogo, [roe] Ronji, [rof] Rombo, [rog] Northern Roglai, [roh] Romansh, [rol] Romblomanon, [rom] Romany, [ron] Moldavian, [ron] Moldovan, [ron] Romanian, [roo] Rotokas, [rop] Kriol, [ror] Rongga, [rou] Runga, [row] Dela-Oenale, [rpn] Repanbitip, [rpt] Rapting, [rri] Ririo, [rro] Waima, [rrt] Arritinngithigh, [rsb] Romano-Serbian, [rsl] Russian Sign Language, [rsm] Miriwoong Sign Language, [rtc] Rungtu Chin, [rth] Ratahan, [rtm] Rotuman, [rts] Yurats, [rtw] Rathawi, [rub] Gungu, [ruc] Ruuli, [rue] Rusyn, [ruf] Luguru, [rug] Roviana, [ruh] Ruga, [rui] Rufiji, [ruk] Che, [run] Rundi, [ruo] Istro Romanian, [rup] Aromanian, [rup] Arumanian, [rup] Macedo-Romanian, [ruq] Megleno Romanian, [rus] Russian, [rut] Rutul, [ruu] Lanas Lobu, [ruy] Mala (Nigeria), [ruz] Ruma, [rwa] Rawo, [rwk] Rwa, [rwm] Amba (Uganda), [rwo] Rawa, [rwr] Marwari (India), [rxd] Ngardi, [rxw] Karuwali, [ryn] Northern Amami-Oshima, [rys] Yaeyama, [ryu] Central Okinawan, [rzh] R??zi?????
[saa] Saba, [sab] Buglere, [sac] Meskwaki, [sad] Sandawe, [sae] Saban??, [saf] Safaliba, [sag] Sango, [sah] Yakut, [saj] Sahu, [sak] Sake, [sam] Samaritan Aramaic, [san] Sanskrit, [sao] Sause, [saq] Samburu, [sar] Saraveca, [sas] Sasak, [sat] Santali, [sau] Saleman, [sav] Saafi-Saafi, [saw] Sawi, [sax] Sa, [say] Saya, [saz] Saurashtra, [sba] Ngambay, [sbb] Simbo, [sbc] Kele (Papua New Guinea), [sbd] Southern Samo, [sbe] Saliba, [sbf] Chabu, [sbf] Shabo, [sbg] Seget, [sbh] Sori-Harengan, [sbi] Seti, [sbj] Surbakhal, [sbk] Safwa, [sbl] Botolan Sambal, [sbm] Sagala, [sbn] Sindhi Bhil, [sbo] Sab??m, [sbp] Sangu (Tanzania), [sbq] Sileibi, [sbr] Sembakung Murut, [sbs] Subiya, [sbt] Kimki, [sbu] Stod Bhoti, [sbv] Sabine, [sbw] Simba, [sbx] Seberuang, [sby] Soli, [sbz] Sara Kaba, [scb] Chut, [sce] Dongxiang, [scf] San Miguel Creole French, [scg] Sanggau, [sch] Sakachep, [sci] Sri Lankan Creole Malay, [sck] Sadri, [scl] Shina, [scn] Sicilian, [sco] Scots, [scp] Helambu Sherpa, [scp] Hyolmo, [scq] Sa'och, [scs] North Slavey, [sct] Southern Katang, [scu] Shumcho, [scv] Sheni, [scw] Sha, [scx] Sicel, [sda] Toraja-Sa'dan, [sdb] Shabak, [sdc] Sassarese Sardinian, [sde] Surubu, [sdf] Sarli, [sdg] Savi, [sdh] Southern Kurdish, [sdj] Suundi, [sdk] Sos Kundi, [sdl] Saudi Arabian Sign Language, [sdm] Semandang, [sdn] Gallurese Sardinian, [sdo] Bukar-Sadung Bidayuh, [sdp] Sherdukpen, [sdr] Oraon Sadri, [sds] Sened, [sdt] Shuadit, [sdu] Sarudu, [sdx] Sibu Melanau, [sdz] Sallands, [sea] Semai, [seb] Shempire Senoufo, [sec] Sechelt, [sed] Sedang, [see] Seneca, [sef] Cebaara Senoufo, [seg] Segeju, [seh] Sena, [sei] Seri, [sej] Sene, [sek] Sekani, [sel] Selkup, [sen] Nanerig?? S??noufo, [seo] Suarmin, [sep] S??c??t?? S??noufo, [seq] Senara S??noufo, [ser] Serrano, [ses] Koyraboro Senni Songhai, [set] Sentani, [seu] Serui-Laut, [sev] Nyarafolo Senoufo, [sew] Sewa Bay, [sey] Secoya, [sez] Senthang Chin, [sfb] French Belgian Sign Language, [sfb] Langue des signes de Belgique Francophone, [sfe] Eastern Subanen, [sfm] Small Flowery Miao, [sfs] South African Sign Language, [sfw] Sehwi, [sga] Old Irish (to 900), [sgb] Mag-antsi Ayta, [sgc] Kipsigis, [sgd] Surigaonon, [sge] Segai, [sgg] Swiss-German Sign Language, [sgh] Shughni, [sgi] Suga, [sgj] Surgujia, [sgk] Sangkong, [sgm] Singa, [sgp] Singpho, [sgr] Sangisari, [sgs] Samogitian, [sgt] Brokpake, [sgu] Salas, [sgw] Sebat Bet Gurage, [sgx] Sierra Leone Sign Language, [sgy] Sanglechi, [sgz] Sursurunga, [sha] Shall-Zwall, [shb] Ninam, [shc] Sonde, [shd] Kundal Shahi, [she] Sheko, [shg] Shua, [shh] Shoshoni, [shi] Tachelhit, [shj] Shatt, [shk] Shilluk, [shl] Shendu, [shm] Shahrudi, [shn] Shan, [sho] Shanga, [shp] Shipibo-Conibo, [shq] Sala, [shr] Shi, [shs] Shuswap, [sht] Shasta, [shu] Chadian Arabic, [shv] Shehri, [shw] Shwai, [shx] She, [shy] Tachawit, [shz] Syenara Senoufo, [sia] Akkala Sami, [sib] Sebop, [sid] Sidamo, [sie] Simaa, [sif] Siamou, [sig] Paasaal, [sih] S??sh????, [sih] Zire, [sii] Shom Peng, [sij] Numbami, [sik] Sikiana, [sil] Tumulung Sisaala, [sim] Mende (Papua New Guinea), [sin] Sinhala, [sin] Sinhalese, [sip] Sikkimese, [siq] Sonia, [sir] Siri, [sis] Siuslaw, [siu] Sinagen, [siv] Sumariup, [siw] Siwai, [six] Sumau, [siy] Sivandi, [siz] Siwi, [sja] Epena, [sjb] Sajau Basap, [sjd] Kildin Sami, [sje] Pite Sami, [sjg] Assangori, [sjk] Kemi Sami, [sjl] Miji, [sjl] Sajalong, [sjm] Mapun, [sjn] Sindarin, [sjo] Xibe, [sjp] Surjapuri, [sjr] Siar-Lak, [sjs] Senhaja De Srair, [sjt] Ter Sami, [sju] Ume Sami, [sjw] Shawnee, [ska] Skagit, [skb] Saek, [skc] Ma Manda, [skd] Southern Sierra Miwok, [ske] Seke (Vanuatu), [skf] Sakirabi??, [skg] Sakalava Malagasy, [skh] Sikule, [ski] Sika, [skj] Seke (Nepal), [skm] Kutong, [skn] Kolibugan Subanon, [sko] Seko Tengah, [skp] Sekapan, [skq] Sininkere, [skr] Saraiki, [skr] Seraiki, [sks] Maia, [skt] Sakata, [sku] Sakao, [skv] Skou, [skw] Skepi Creole Dutch, [skx] Seko Padang, [sky] Sikaiana, [skz] Sekar, [slc] S??liba, [sld] Sissala, [sle] Sholaga, [slf] Swiss-Italian Sign Language, [slg] Selungai Murut, [slh] Southern Puget Sound Salish, [sli] Lower Silesian, [slj] Salum??, [slk] Slovak, [sll] Salt-Yui, [slm] Pangutaran Sama, [sln] Salinan, [slp] Lamaholot, [slq] Salchuq, [slr] Salar, [sls] Singapore Sign Language, [slt] Sila, [slu] Selaru, [slv] Slovenian, [slw] Sialum, [slx] Salampasu, [sly] Selayar, [slz] Ma'ya, [sma] Southern Sami, [smb] Simbari, [smc] Som, [smd] Sama, [sme] Northern Sami, [smf] Auwe, [smg] Simbali, [smh] Samei, [smj] Lule Sami, [smk] Bolinao, [sml] Central Sama, [smm] Musasa, [smn] Inari Sami, [smo] Samoan, [smp] Samaritan, [smq] Samo, [smr] Simeulue, [sms] Skolt Sami, [smt] Simte, [smu] Somray, [smv] Samvedi, [smw] Sumbawa, [smx] Samba, [smy] Semnani, [smz] Simeku, [sna] Shona, [snb] Sebuyau, [snc] Sinaugoro, [snd] Sindhi, [sne] Bau Bidayuh, [snf] Noon, [sng] Sanga (Democratic Republic of Congo), [sni] Sensi, [snj] Riverain Sango, [snk] Soninke, [snl] Sangil, [snm] Southern Ma'di, [snn] Siona, [sno] Snohomish, [snp] Siane, [snq] Sangu (Gabon), [snr] Sihan, [sns] Nahavaq, [sns] South West Bay, [snu] Senggi, [snu] Viid, [snv] Sa'ban, [snw] Selee, [snx] Sam, [sny] Saniyo-Hiyewe, [snz] Sinsauru, [soa] Thai Song, [sob] Sobei, [soc] So (Democratic Republic of Congo), [sod] Songoora, [soe] Songomeno, [sog] Sogdian, [soh] Aka, [soi] Sonha, [soj] Soi, [sok] Sokoro, [sol] Solos, [som] Somali, [soo] Songo, [sop] Songe, [soq] Kanasi, [sor] Somrai, [sos] Seeku, [sot] Southern Sotho, [sou] Southern Thai, [sov] Sonsorol, [sow] Sowanda, [sox] Swo, [soy] Miyobe, [soz] Temi, [spa] Castilian, [spa] Spanish, [spb] Sepa (Indonesia), [spc] Sap??, [spd] Saep, [spe] Sepa (Papua New Guinea), [spg] Sian, [spi] Saponi, [spk] Sengo, [spl] Selepet, [spm] Akukem, [spn] Sanapan??, [spo] Spokane, [spp] Supyire Senoufo, [spq] Loreto-Ucayali Spanish, [spr] Saparua, [sps] Saposa, [spt] Spiti Bhoti, [spu] Sapuan, [spv] Kosli, [spv] Sambalpuri, [spx] South Picene, [spy] Sabaot, [sqa] Shama-Sambuga, [sqh] Shau, [sqi] Albanian, [sqk] Albanian Sign Language, [sqm] Suma, [sqn] Susquehannock, [sqo] Sorkhei, [sqq] Sou, [sqr] Siculo Arabic, [sqs] Sri Lankan Sign Language, [sqt] Soqotri, [squ] Squamish, [sra] Saruga, [srb] Sora, [src] Logudorese Sardinian, [srd] Sardinian, [sre] Sara, [srf] Nafi, [srg] Sulod, [srh] Sarikoli, [sri] Siriano, [srk] Serudung Murut, [srl] Isirawa, [srm] Saramaccan, [srn] Sranan Tongo, [sro] Campidanese Sardinian, [srp] Serbian, [srq] Sirion??, [srr] Serer, [srs] Sarsi, [srt] Sauri, [sru] Suru??, [srv] Southern Sorsoganon, [srw] Serua, [srx] Sirmauri, [sry] Sera, [srz] Shahmirzadi, [ssb] Southern Sama, [ssc] Suba-Simbiti, [ssd] Siroi, [sse] Balangingi, [sse] Bangingih Sama, [ssf] Thao, [ssg] Seimat, [ssh] Shihhi Arabic, [ssi] Sansi, [ssj] Sausi, [ssk] Sunam, [ssl] Western Sisaala, [ssm] Semnam, [ssn] Waata, [sso] Sissano, [ssp] Spanish Sign Language, [ssq] So'a, [ssr] Swiss-French Sign Language, [sss] S??, [sst] Sinasina, [ssu] Susuami, [ssv] Shark Bay, [ssw] Swati, [ssx] Samberigi, [ssy] Saho, [ssz] Sengseng, [sta] Settla, [stb] Northern Subanen, [std] Sentinel, [ste] Liana-Seti, [stf] Seta, [stg] Trieng, [sth] Shelta, [sti] Bulo Stieng, [stj] Matya Samo, [stk] Arammba, [stl] Stellingwerfs, [stm] Setaman, [stn] Owa, [sto] Stoney, [stp] Southeastern Tepehuan, [stq] Saterfriesisch, [str] Straits Salish, [sts] Shumashti, [stt] Budeh Stieng, [stu] Samtao, [stv] Silt'e, [stw] Satawalese, [sty] Siberian Tatar, [sua] Sulka, [sub] Suku, [suc] Western Subanon, [sue] Suena, [sug] Suganga, [sui] Suki, [suj] Shubi, [suk] Sukuma, [sun] Sundanese, [suq] Suri, [sur] Mwaghavul, [sus] Susu, [sut] Subtiaba, [suv] Puroik, [suw] Sumbwa, [sux] Sumerian, [suy] Suy??, [suz] Sunwar, [sva] Svan, [svb] Ulau-Suain, [svc] Vincentian Creole English, [sve] Serili, [svk] Slovakian Sign Language, [svm] Slavomolisano, [svs] Savosavo, [svx] Skalvian, [swa] Swahili (macrolanguage), [swb] Maore Comorian, [swc] Congo Swahili, [swe] Swedish, [swf] Sere, [swg] Swabian, [swh] Kiswahili, [swh] Swahili (individual language), [swi] Sui, [swj] Sira, [swk] Malawi Sena, [swl] Swedish Sign Language, [swm] Samosa, [swn] Sawknah, [swo] Shanenawa, [swp] Suau, [swq] Sharwa, [swr] Saweru, [sws] Seluwasan, [swt] Sawila, [swu] Suwawa, [swv] Shekhawati, [sww] Sowa, [swx] Suruah??, [swy] Sarua, [sxb] Suba, [sxc] Sicanian, [sxe] Sighu, [sxg] Shixing, [sxg] Shuhi, [sxk] Southern Kalapuya, [sxl] Selian, [sxm] Samre, [sxn] Sangir, [sxo] Sorothaptic, [sxr] Saaroa, [sxs] Sasaru, [sxu] Upper Saxon, [sxw] Saxwe Gbe, [sya] Siang, [syb] Central Subanen, [syc] Classical Syriac, [syi] Seki, [syk] Sukur, [syl] Sylheti, [sym] Maya Samo, [syn] Senaya, [syo] Suoy, [syr] Syriac, [sys] Sinyar, [syw] Kagate, [syx] Samay, [syy] Al-Sayyid Bedouin Sign Language, [sza] Semelai, [szb] Ngalum, [szc] Semaq Beri, [szd] Seru, [sze] Seze, [szg] Sengele, [szl] Silesian, [szn] Sula, [szp] Suabo, [szs] Solomon Islands Sign Language, [szv] Isu (Fako Division), [szw] Sawai
[taa] Lower Tanana, [tab] Tabassaran, [tac] Lowland Tarahumara, [tad] Tause, [tae] Tariana, [taf] Tapirap??, [tag] Tagoi, [tah] Tahitian, [taj] Eastern Tamang, [tak] Tala, [tal] Tal, [tam] Tamil, [tan] Tangale, [tao] Yami, [tap] Taabwa, [taq] Tamasheq, [tar] Central Tarahumara, [tas] Tay Boi, [tat] Tatar, [tau] Upper Tanana, [tav] Tatuyo, [taw] Tai, [tax] Tamki, [tay] Atayal, [taz] Tocho, [tba] Aikan??, [tbb] Tapeba, [tbc] Takia, [tbd] Kaki Ae, [tbe] Tanimbili, [tbf] Mandara, [tbg] North Tairora, [tbh] Thurawal, [tbi] Gaam, [tbj] Tiang, [tbk] Calamian Tagbanwa, [tbl] Tboli, [tbm] Tagbu, [tbn] Barro Negro Tunebo, [tbo] Tawala, [tbp] Diebroud, [tbp] Taworta, [tbr] Tumtum, [tbs] Tanguat, [tbt] Tembo (Kitembo), [tbu] Tubar, [tbv] Tobo, [tbw] Tagbanwa, [tbx] Kapin, [tby] Tabaru, [tbz] Ditammari, [tca] Ticuna, [tcb] Tanacross, [tcc] Datooga, [tcd] Tafi, [tce] Southern Tutchone, [tcf] Malinaltepec Me'phaa, [tcf] Malinaltepec Tlapanec, [tcg] Tamagario, [tch] Turks And Caicos Creole English, [tci] W??ra, [tck] Tchitchege, [tcl] Taman (Myanmar), [tcm] Tanahmerah, [tcn] Tichurong, [tco] Taungyo, [tcp] Tawr Chin, [tcq] Kaiy, [tcs] Torres Strait Creole, [tct] T'en, [tcu] Southeastern Tarahumara, [tcw] Tecpatl??n Totonac, [tcx] Toda, [tcy] Tulu, [tcz] Thado Chin, [tda] Tagdal, [tdb] Panchpargania, [tdc] Ember??-Tad??, [tdd] Tai N??a, [tde] Tiranige Diga Dogon, [tdf] Talieng, [tdg] Western Tamang, [tdh] Thulung, [tdi] Tomadino, [tdj] Tajio, [tdk] Tambas, [tdl] Sur, [tdm] Taruma, [tdn] Tondano, [tdo] Teme, [tdq] Tita, [tdr] Todrah, [tds] Doutai, [tdt] Tetun Dili, [tdv] Toro, [tdx] Tandroy-Mahafaly Malagasy, [tdy] Tadyawan, [tea] Temiar, [teb] Tetete, [tec] Terik, [ted] Tepo Krumen, [tee] Huehuetla Tepehua, [tef] Teressa, [teg] Teke-Tege, [teh] Tehuelche, [tei] Torricelli, [tek] Ibali Teke, [tel] Telugu, [tem] Timne, [ten] Tama (Colombia), [teo] Teso, [tep] Tepecano, [teq] Temein, [ter] Tereno, [tes] Tengger, [tet] Tetum, [teu] Soo, [tev] Teor, [tew] Tewa (USA), [tex] Tennet, [tey] Tulishi, [tez] Tetserret, [tfi] Tofin Gbe, [tfn] Tanaina, [tfo] Tefaro, [tfr] Teribe, [tft] Ternate, [tga] Sagalla, [tgb] Tobilung, [tgc] Tigak, [tgd] Ciwogai, [tge] Eastern Gorkha Tamang, [tgf] Chalikha, [tgh] Tobagonian Creole English, [tgi] Lawunuia, [tgj] Tagin, [tgk] Tajik, [tgl] Tagalog, [tgn] Tandaganon, [tgo] Sudest, [tgp] Tangoa, [tgq] Tring, [tgr] Tareng, [tgs] Nume, [tgt] Central Tagbanwa, [tgu] Tanggu, [tgv] Tingui-Boto, [tgw] Tagwana Senoufo, [tgx] Tagish, [tgy] Togoyo, [tgz] Tagalaka, [tha] Thai, [thd] Thayore, [the] Chitwania Tharu, [thf] Thangmi, [thh] Northern Tarahumara, [thi] Tai Long, [thk] Kitharaka, [thk] Tharaka, [thl] Dangaura Tharu, [thm] Aheu, [thn] Thachanadan, [thp] Thompson, [thq] Kochila Tharu, [thr] Rana Tharu, [ths] Thakali, [tht] Tahltan, [thu] Thuri, [thv] Tahaggart Tamahaq, [thw] Thudam, [thy] Tha, [thz] Tayart Tamajeq, [tia] Tidikelt Tamazight, [tic] Tira, [tif] Tifal, [tig] Tigre, [tih] Timugon Murut, [tii] Tiene, [tij] Tilung, [tik] Tikar, [til] Tillamook, [tim] Timbe, [tin] Tindi, [tio] Teop, [tip] Trimuris, [tiq] Ti??fo, [tir] Tigrinya, [tis] Masadiit Itneg, [tit] Tinigua, [tiu] Adasen, [tiv] Tiv, [tiw] Tiwi, [tix] Southern Tiwa, [tiy] Tiruray, [tiz] Tai Hongjin, [tja] Tajuasohn, [tjg] Tunjung, [tji] Northern Tujia, [tjl] Tai Laing, [tjm] Timucua, [tjn] Tonjon, [tjo] Temacine Tamazight, [tjs] Southern Tujia, [tju] Tjurruru, [tjw] Djabwurrung, [tka] Truk??, [tkb] Buksa, [tkd] Tukudede, [tke] Takwane, [tkf] Tukumanf??d, [tkg] Tesaka Malagasy, [tkl] Tokelau, [tkm] Takelma, [tkn] Toku-No-Shima, [tkp] Tikopia, [tkq] Tee, [tkr] Tsakhur, [tks] Takestani, [tkt] Kathoriya Tharu, [tku] Upper Necaxa Totonac, [tkv] Mur Pano, [tkw] Teanu, [tkx] Tangko, [tkz] Takua, [tla] Southwestern Tepehuan, [tlb] Tobelo, [tlc] Yecuatla Totonac, [tld] Talaud, [tlf] Telefol, [tlg] Tofanma, [tlh] Klingon, [tlh] tlhIngan Hol, [tli] Tlingit, [tlj] Talinga-Bwisi, [tlk] Taloki, [tll] Tetela, [tlm] Tolomako, [tln] Talondo', [tlo] Talodi, [tlp] Filomena Mata-Coahuitl??n Totonac, [tlq] Tai Loi, [tlr] Talise, [tls] Tambotalo, [tlt] Sou Nama, [tlt] Teluti, [tlu] Tulehu, [tlv] Taliabu, [tlx] Khehek, [tly] Talysh, [tma] Tama (Chad), [tmb] Avava, [tmb] Katbol, [tmc] Tumak, [tmd] Haruai, [tme] Trememb??, [tmf] Toba-Maskoy, [tmg] Ternate??o, [tmh] Tamashek, [tmi] Tutuba, [tmj] Samarokena, [tmk] Northwestern Tamang, [tml] Tamnim Citak, [tmm] Tai Thanh, [tmn] Taman (Indonesia), [tmo] Temoq, [tmq] Tumleo, [tmr] Jewish Babylonian Aramaic (ca. 200-1200 CE), [tms] Tima, [tmt] Tasmate, [tmu] Iau, [tmv] Tembo (Motembo), [tmw] Temuan, [tmy] Tami, [tmz] Tamanaku, [tna] Tacana, [tnb] Western Tunebo, [tnc] Tanimuca-Retuar??, [tnd] Angosturas Tunebo, [tng] Tobanga, [tnh] Maiani, [tni] Tandia, [tnk] Kwamera, [tnl] Lenakel, [tnm] Tabla, [tnn] North Tanna, [tno] Toromono, [tnp] Whitesands, [tnq] Taino, [tnr] M??nik, [tns] Tenis, [tnt] Tontemboan, [tnu] Tay Khang, [tnv] Tangchangya, [tnw] Tonsawang, [tnx] Tanema, [tny] Tongwe, [tnz] Ten'edn, [tob] Toba, [toc] Coyutla Totonac, [tod] Toma, [tof] Gizrra, [tog] Tonga (Nyasa), [toh] Gitonga, [toi] Tonga (Zambia), [toj] Tojolabal, [tol] Tolowa, [tom] Tombulu, [ton] Tonga (Tonga Islands), [too] Xicotepec De Ju??rez Totonac, [top] Papantla Totonac, [toq] Toposa, [tor] Togbo-Vara Banda, [tos] Highland Totonac, [tou] Tho, [tov] Upper Taromi, [tow] Jemez, [tox] Tobian, [toy] Topoiyo, [toz] To, [tpa] Taupota, [tpc] Azoy?? Me'phaa, [tpc] Azoy?? Tlapanec, [tpe] Tippera, [tpf] Tarpia, [tpg] Kula, [tpi] Tok Pisin, [tpj] Tapiet??, [tpk] Tupinikin, [tpl] Tlacoapa Me'phaa, [tpl] Tlacoapa Tlapanec, [tpm] Tampulma, [tpn] Tupinamb??, [tpo] Tai Pao, [tpp] Pisaflores Tepehua, [tpq] Tukpa, [tpr] Tupar??, [tpt] Tlachichilco Tepehua, [tpu] Tampuan, [tpv] Tanapag, [tpw] Tup??, [tpx] Acatepec Me'phaa, [tpx] Acatepec Tlapanec, [tpy] Trumai, [tpz] Tinputz, [tqb] Temb??, [tql] Lehali, [tqm] Turumsa, [tqn] Tenino, [tqo] Toaripi, [tqp] Tomoip, [tqq] Tunni, [tqr] Torona, [tqt] Western Totonac, [tqu] Touo, [tqw] Tonkawa, [tra] Tirahi, [trb] Terebu, [trc] Copala Triqui, [trd] Turi, [tre] East Tarangan, [trf] Trinidadian Creole English, [trg] Lish??n Did??n, [trh] Turaka, [tri] Tri??, [trj] Toram, [trl] Traveller Scottish, [trm] Tregami, [trn] Trinitario, [tro] Tarao Naga, [trp] Kok Borok, [trq] San Mart??n Itunyoso Triqui, [trr] Taushiro, [trs] Chicahuaxtla Triqui, [trt] Tunggare, [tru] Surayt, [tru] Turoyo, [trv] Taroko, [trw] Torwali, [trx] Tringgus-Sembaan Bidayuh, [try] Turung, [trz] Tor??, [tsa] Tsaangi, [tsb] Tsamai, [tsc] Tswa, [tsd] Tsakonian, [tse] Tunisian Sign Language, [tsg] Tausug, [tsh] Tsuvan, [tsi] Tsimshian, [tsj] Tshangla, [tsk] Tseku, [tsl] Ts'??n-Lao, [tsm] T??rk ????aret Dili, [tsm] Turkish Sign Language, [tsn] Tswana, [tso] Tsonga, [tsp] Northern Toussian, [tsq] Thai Sign Language, [tsr] Akei, [tss] Taiwan Sign Language, [tst] Tondi Songway Kiini, [tsu] Tsou, [tsv] Tsogo, [tsw] Tsishingini, [tsx] Mubami, [tsy] Tebul Sign Language, [tsz] Purepecha, [tta] Tutelo, [ttb] Gaa, [ttc] Tektiteko, [ttd] Tauade, [tte] Bwanabwana, [ttf] Tuotomb, [ttg] Tutong, [tth] Upper Ta'oih, [tti] Tobati, [ttj] Tooro, [ttk] Totoro, [ttl] Totela, [ttm] Northern Tutchone, [ttn] Towei, [tto] Lower Ta'oih, [ttp] Tombelala, [ttq] Tawallammat Tamajaq, [ttr] Tera, [tts] Northeastern Thai, [ttt] Muslim Tat, [ttu] Torau, [ttv] Titan, [ttw] Long Wat, [tty] Sikaritai, [ttz] Tsum, [tua] Wiarumus, [tub] T??batulabal, [tuc] Mutu, [tud] Tux??, [tue] Tuyuca, [tuf] Central Tunebo, [tug] Tunia, [tuh] Taulil, [tui] Tupuri, [tuj] Tugutil, [tuk] Turkmen, [tul] Tula, [tum] Tumbuka, [tun] Tunica, [tuo] Tucano, [tuq] Tedaga, [tur] Turkish, [tus] Tuscarora, [tuu] Tututni, [tuv] Turkana, [tux] Tuxin??wa, [tuy] Tugen, [tuz] Turka, [tva] Vaghua, [tvd] Tsuvadi, [tve] Te'un, [tvk] Southeast Ambrym, [tvl] Tuvalu, [tvm] Tela-Masbuar, [tvn] Tavoyan, [tvo] Tidore, [tvs] Taveta, [tvt] Tutsa Naga, [tvu] Tunen, [tvw] Sedoa, [tvy] Timor Pidgin, [twa] Twana, [twb] Western Tawbuid, [twc] Teshenawa, [twd] Twents, [twe] Tewa (Indonesia), [twf] Northern Tiwa, [twg] Tereweng, [twh] Tai D??n, [twi] Twi, [twl] Tawara, [twm] Tawang Monpa, [twn] Twendi, [two] Tswapong, [twp] Ere, [twq] Tasawaq, [twr] Southwestern Tarahumara, [twt] Turiw??ra, [twu] Termanu, [tww] Tuwari, [twx] Tewe, [twy] Tawoyan, [txa] Tombonuo, [txb] Tokharian B, [txc] Tsetsaut, [txe] Totoli, [txg] Tangut, [txh] Thracian, [txi] Ikpeng, [txj] Tarjumo, [txm] Tomini, [txn] West Tarangan, [txo] Toto, [txq] Tii, [txr] Tartessian, [txs] Tonsea, [txt] Citak, [txu] Kayap??, [txx] Tatana, [txy] Tanosy Malagasy, [tya] Tauya, [tye] Kyanga, [tyh] O'du, [tyi] Teke-Tsaayi, [tyj] Tai Do, [tyj] Tai Yo, [tyl] Thu Lao, [tyn] Kombai, [typ] Thaypan, [tyr] Tai Daeng, [tys] T??y Sa Pa, [tyt] T??y Tac, [tyu] Kua, [tyv] Tuvinian, [tyx] Teke-Tyee, [tyz] T??y, [tza] Tanzanian Sign Language, [tzh] Tzeltal, [tzj] Tz'utujil, [tzl] Talossan, [tzm] Central Atlas Tamazight, [tzn] Tugun, [tzo] Tzotzil, [tzx] Tabriak
[uam] Uamu??, [uan] Kuan, [uar] Tairuma, [uba] Ubang, [ubi] Ubi, [ubl] Buhi'non Bikol, [ubr] Ubir, [ubu] Umbu-Ungu, [uby] Ubykh, [uda] Uda, [ude] Udihe, [udg] Muduga, [udi] Udi, [udj] Ujir, [udl] Wuzlam, [udm] Udmurt, [udu] Uduk, [ues] Kioko, [ufi] Ufim, [uga] Ugaritic, [ugb] Kuku-Ugbanh, [uge] Ughele, [ugn] Ugandan Sign Language, [ugo] Ugong, [ugy] Uruguayan Sign Language, [uha] Uhami, [uhn] Damal, [uig] Uighur, [uig] Uyghur, [uis] Uisai, [uiv] Iyive, [uji] Tanjijili, [uka] Kaburi, [ukg] Ukuriguma, [ukh] Ukhwejo, [ukk] Muak Sa-aak, [ukl] Ukrainian Sign Language, [ukp] Ukpe-Bayobiri, [ukq] Ukwa, [ukr] Ukrainian, [uks] Kaapor Sign Language, [uks] Urub??-Kaapor Sign Language, [uku] Ukue, [ukw] Ukwuani-Aboh-Ndoni, [uky] Kuuk-Yak, [ula] Fungwa, [ulb] Ulukwumi, [ulc] Ulch, [ule] Lule, [ulf] Afra, [ulf] Usku, [uli] Ulithian, [ulk] Meriam, [ull] Ullatan, [ulm] Ulumanda', [uln] Unserdeutsch, [ulu] Uma' Lung, [ulw] Ulwa, [uma] Umatilla, [umb] Umbundu, [umc] Marrucinian, [umd] Umbindhamu, [umg] Umbuygamu, [umi] Ukit, [umm] Umon, [umn] Makyan Naga, [umo] Umot??na, [ump] Umpila, [umr] Umbugarla, [ums] Pendau, [umu] Munsee, [una] North Watut, [und] Undetermined, [une] Uneme, [ung] Ngarinyin, [unk] Enawen??-Naw??, [unm] Unami, [unn] Kurnai, [unr] Mundari, [unu] Unubahe, [unx] Munda, [unz] Unde Kaili, [upi] Umeda, [upv] Uripiv-Wala-Rano-Atchin, [ura] Urarina, [urb] Kaapor, [urb] Urub??-Kaapor, [urc] Urningangg, [urd] Urdu, [ure] Uru, [urf] Uradhi, [urg] Urigina, [urh] Urhobo, [uri] Urim, [urk] Urak Lawoi', [url] Urali, [urm] Urapmin, [urn] Uruangnirin, [uro] Ura (Papua New Guinea), [urp] Uru-Pa-In, [urr] Lehalurup, [urr] L??y??p, [urt] Urat, [uru] Urumi, [urv] Uruava, [urw] Sop, [urx] Urimo, [ury] Orya, [urz] Uru-Eu-Wau-Wau, [usa] Usarufa, [ush] Ushojo, [usi] Usui, [usk] Usaghade, [usp] Uspanteco, [usu] Uya, [uta] Otank, [ute] Ute-Southern Paiute, [utp] Amba (Solomon Islands), [utr] Etulo, [utu] Utu, [uum] Urum, [uun] Kulon-Pazeh, [uur] Ura (Vanuatu), [uuu] U, [uve] Fagauvea, [uve] West Uvean, [uvh] Uri, [uvl] Lote, [uwa] Kuku-Uwanh, [uya] Doko-Uyanga, [uzb] Uzbek, [uzn] Northern Uzbek, [uzs] Southern Uzbek
[vaa] Vaagri Booli, [vae] Vale, [vaf] Vafsi, [vag] Vagla, [vah] Varhadi-Nagpuri, [vai] Vai, [vaj] Northwestern ??Kung, [vaj] Sekele, [vaj] Vasekele, [val] Vehes, [vam] Vanimo, [van] Valman, [vao] Vao, [vap] Vaiphei, [var] Huarijio, [vas] Vasavi, [vau] Vanuma, [vav] Varli, [vay] Wayu, [vbb] Southeast Babar, [vbk] Southwestern Bontok, [vec] Venetian, [ved] Veddah, [vel] Veluws, [vem] Vemgo-Mabas, [ven] Venda, [veo] Venture??o, [vep] Veps, [ver] Mom Jango, [vgr] Vaghri, [vgt] Flemish Sign Language, [vgt] Vlaamse Gebarentaal, [vic] Virgin Islands Creole English, [vid] Vidunda, [vie] Vietnamese, [vif] Vili, [vig] Viemo, [vil] Vilela, [vin] Vinza, [vis] Vishavan, [vit] Viti, [viv] Iduna, [vka] Kariyarra, [vki] Ija-Zuba, [vkj] Kujarge, [vkk] Kaur, [vkl] Kulisusu, [vkm] Kamakan, [vko] Kodeoha, [vkp] Korlai Creole Portuguese, [vkt] Tenggarong Kutai Malay, [vku] Kurrama, [vlp] Valpei, [vls] Vlaams, [vma] Martuyhunira, [vmb] Barbaram, [vmc] Juxtlahuaca Mixtec, [vmd] Mudu Koraga, [vme] East Masela, [vmf] Mainfr??nkisch, [vmg] Lungalunga, [vmh] Maraghei, [vmi] Miwa, [vmj] Ixtayutla Mixtec, [vmk] Makhuwa-Shirima, [vml] Malgana, [vmm] Mitlatongo Mixtec, [vmp] Soyaltepec Mazatec, [vmq] Soyaltepec Mixtec, [vmr] Marenje, [vms] Moksela, [vmu] Muluridyi, [vmv] Valley Maidu, [vmw] Makhuwa, [vmx] Tamazola Mixtec, [vmy] Ayautla Mazatec, [vmz] Mazatl??n Mazatec, [vnk] Lovono, [vnk] Vano, [vnm] Neve'ei, [vnm] Vinmavis, [vnp] Vunapu, [vol] Volap??k, [vor] Voro, [vot] Votic, [vra] Vera'a, [vro] V??ro, [vrs] Varisi, [vrt] Banam Bay, [vrt] Burmbar, [vsi] Moldova Sign Language, [vsl] Venezuelan Sign Language, [vsv] Llengua de signes valenciana, [vsv] Valencian Sign Language, [vto] Vitou, [vum] Vumbu, [vun] Vunjo, [vut] Vute, [vwa] Awa (China)
[waa] Walla Walla, [wab] Wab, [wac] Wasco-Wishram, [wad] Wandamen, [wae] Walser, [waf] Wakon??, [wag] Wa'ema, [wah] Watubela, [wai] Wares, [waj] Waffa, [wal] Wolaitta, [wal] Wolaytta, [wam] Wampanoag, [wan] Wan, [wao] Wappo, [wap] Wapishana, [waq] Wageman, [war] Waray (Philippines), [was] Washo, [wat] Kaninuwa, [wau] Waur??, [wav] Waka, [waw] Waiwai, [wax] Marangis, [wax] Watam, [way] Wayana, [waz] Wampur, [wba] Warao, [wbb] Wabo, [wbe] Waritai, [wbf] Wara, [wbh] Wanda, [wbi] Vwanji, [wbj] Alagwa, [wbk] Waigali, [wbl] Wakhi, [wbm] Wa, [wbp] Warlpiri, [wbq] Waddar, [wbr] Wagdi, [wbs] West Bengal Sign Language, [wbt] Wanman, [wbv] Wajarri, [wbw] Woi, [wca] Yanom??mi, [wci] Waci Gbe, [wdd] Wandji, [wdg] Wadaginam, [wdj] Wadjiginy, [wdk] Wadikali, [wdu] Wadjigu, [wdy] Wadjabangayi, [wea] Wewaw, [wec] W?? Western, [wed] Wedau, [weg] Wergaia, [weh] Weh, [wei] Kiunum, [wem] Weme Gbe, [weo] Wemale, [wep] Westphalien, [wer] Weri, [wes] Cameroon Pidgin, [wet] Perai, [weu] Rawngtu Chin, [wew] Wejewa, [wfg] Yafi, [wfg] Zorop, [wga] Wagaya, [wgb] Wagawaga, [wgg] Wangganguru, [wgi] Wahgi, [wgo] Waigeo, [wgu] Wirangu, [wgy] Warrgamay, [wha] Manusela, [wha] Sou Upaa, [whg] North Wahgi, [whk] Wahau Kenyah, [whu] Wahau Kayan, [wib] Southern Toussian, [wic] Wichita, [wie] Wik-Epa, [wif] Wik-Keyangan, [wig] Wik-Ngathana, [wih] Wik-Me'anha, [wii] Minidien, [wij] Wik-Iiyanh, [wik] Wikalkan, [wil] Wilawila, [wim] Wik-Mungkan, [win] Ho-Chunk, [wir] Wiraf??d, [wiu] Wiru, [wiv] Vitu, [wiy] Wiyot, [wja] Waja, [wji] Warji, [wka] Kw'adza, [wkb] Kumbaran, [wkd] Mo, [wkd] Wakde, [wkl] Kalanadi, [wku] Kunduvadi, [wkw] Wakawaka, [wky] Wangkayutyuru, [wla] Walio, [wlc] Mwali Comorian, [wle] Wolane, [wlg] Kunbarlang, [wli] Waioli, [wlk] Wailaki, [wll] Wali (Sudan), [wlm] Middle Welsh, [wln] Walloon, [wlo] Wolio, [wlr] Wailapa, [wls] Wallisian, [wlu] Wuliwuli, [wlv] Wich?? Lhamt??s Vejoz, [wlw] Walak, [wlx] Wali (Ghana), [wly] Waling, [wma] Mawa (Nigeria), [wmb] Wambaya, [wmc] Wamas, [wmd] Mamaind??, [wme] Wambule, [wmh] Waima'a, [wmi] Wamin, [wmm] Maiwa (Indonesia), [wmn] Waamwang, [wmo] Wom (Papua New Guinea), [wms] Wambon, [wmt] Walmajarri, [wmw] Mwani, [wmx] Womo, [wnb] Wanambre, [wnc] Wantoat, [wnd] Wandarang, [wne] Waneci, [wng] Wanggom, [wni] Ndzwani Comorian, [wnk] Wanukaka, [wnm] Wanggamala, [wnn] Wunumara, [wno] Wano, [wnp] Wanap, [wnu] Usan, [wnw] Wintu, [wny] Wanyi, [woa] Tyaraity, [wob] W?? Northern, [woc] Wogeo, [wod] Wolani, [woe] Woleaian, [wof] Gambian Wolof, [wog] Wogamusin, [woi] Kamang, [wok] Longto, [wol] Wolof, [wom] Wom (Nigeria), [won] Wongo, [woo] Manombai, [wor] Woria, [wos] Hanga Hundi, [wow] Wawonii, [woy] Weyto, [wpc] Maco, [wra] Warapu, [wrb] Warluwara, [wrd] Warduji, [wrg] Warungu, [wrh] Wiradhuri, [wri] Wariyangga, [wrk] Garrwa, [wrl] Warlmanpa, [wrm] Warumungu, [wrn] Warnang, [wro] Worrorra, [wrp] Waropen, [wrr] Wardaman, [wrs] Waris, [wru] Waru, [wrv] Waruna, [wrw] Gugu Warra, [wrx] Wae Rana, [wry] Merwari, [wrz] Waray (Australia), [wsa] Warembori, [wsg] Adilabad Gondi, [wsi] Wusi, [wsk] Waskia, [wsr] Owenia, [wss] Wasa, [wsu] Wasu, [wsv] Wotapuri-Katarqalai, [wtf] Watiwa, [wth] Wathawurrung, [wti] Berta, [wtk] Watakataui, [wtm] Mewati, [wtw] Wotu, [wua] Wikngenchera, [wub] Wunambal, [wud] Wudu, [wuh] Wutunhua, [wul] Silimo, [wum] Wumbvu, [wun] Bungu, [wur] Wurrugu, [wut] Wutung, [wuu] Wu Chinese, [wuv] Wuvulu-Aua, [wux] Wulna, [wuy] Wauyai, [wwa] Waama, [wwb] Wakabunga, [wwo] Dorig, [wwo] Wetamut, [wwr] Warrwa, [www] Wawa, [wxa] Waxianghua, [wxw] Wardandi, [wya] Wyandot, [wyb] Wangaaybuwan-Ngiyambaa, [wyi] Woiwurrung, [wym] Wymysorys, [wyr] Wayor??, [wyy] Western Fijian
[xaa] Andalusian Arabic, [xab] Sambe, [xac] Kachari, [xad] Adai, [xae] Aequian, [xag] Aghwan, [xai] Kaimb??, [xaj] Ararandew??ra, [xak] M??ku, [xal] Kalmyk, [xal] Oirat, [xam] ??Xam, [xan] Xamtanga, [xao] Khao, [xap] Apalachee, [xaq] Aquitanian, [xar] Karami, [xas] Kamas, [xat] Katawixi, [xau] Kauwera, [xav] Xav??nte, [xaw] Kawaiisu, [xay] Kayan Mahakam, [xbb] Lower Burdekin, [xbc] Bactrian, [xbd] Bindal, [xbe] Bigambal, [xbg] Bunganditj, [xbi] Kombio, [xbj] Birrpayi, [xbm] Middle Breton, [xbn] Kenaboi, [xbo] Bolgarian, [xbp] Bibbulman, [xbr] Kambera, [xbw] Kambiw??, [xby] Batyala, [xcb] Cumbric, [xcc] Camunic, [xce] Celtiberian, [xcg] Cisalpine Gaulish, [xch] Chemakum, [xch] Chimakum, [xcl] Classical Armenian, [xcm] Comecrudo, [xcn] Cotoname, [xco] Chorasmian, [xcr] Carian, [xct] Classical Tibetan, [xcu] Curonian, [xcv] Chuvantsy, [xcw] Coahuilteco, [xcy] Cayuse, [xda] Darkinyung, [xdc] Dacian, [xdk] Dharuk, [xdm] Edomite, [xdo] Kwandu, [xdy] Malayic Dayak, [xeb] Eblan, [xed] Hdi, [xeg] ??Xegwi, [xel] Kelo, [xem] Kembayan, [xep] Epi-Olmec, [xer] Xer??nte, [xes] Kesawai, [xet] Xet??, [xeu] Keoru-Ahia, [xfa] Faliscan, [xga] Galatian, [xgb] Gbin, [xgd] Gudang, [xgf] Gabrielino-Fernande??o, [xgg] Goreng, [xgi] Garingbal, [xgl] Galindan, [xgm] Dharumbal, [xgm] Guwinmal, [xgr] Garza, [xgu] Unggumi, [xgw] Guwa, [xha] Harami, [xhc] Hunnic, [xhd] Hadrami, [xhe] Khetrani, [xho] Xhosa, [xhr] Hernican, [xht] Hattic, [xhu] Hurrian, [xhv] Khua, [xib] Iberian, [xii] Xiri, [xil] Illyrian, [xin] Xinca, [xir] Xiri??na, [xis] Kisan, [xiv] Indus Valley Language, [xiy] Xipaya, [xjb] Minjungbal, [xjt] Jaitmatang, [xka] Kalkoti, [xkb] Northern Nago, [xkc] Kho'ini, [xkd] Mendalam Kayan, [xke] Kereho, [xkf] Khengkha, [xkg] Kagoro, [xki] Kenyan Sign Language, [xkj] Kajali, [xkk] Kaco', [xkl] Mainstream Kenyah, [xkn] Kayan River Kayan, [xko] Kiorr, [xkp] Kabatei, [xkq] Koroni, [xkr] Xakriab??, [xks] Kumbewaha, [xkt] Kantosi, [xku] Kaamba, [xkv] Kgalagadi, [xkw] Kembra, [xkx] Karore, [xky] Uma' Lasan, [xkz] Kurtokha, [xla] Kamula, [xlb] Loup B, [xlc] Lycian, [xld] Lydian, [xle] Lemnian, [xlg] Ligurian (Ancient), [xli] Liburnian, [xln] Alanic, [xlo] Loup A, [xlp] Lepontic, [xls] Lusitanian, [xlu] Cuneiform Luwian, [xly] Elymian, [xma] Mushungulu, [xmb] Mbonga, [xmc] Makhuwa-Marrevone, [xmd] Mbudum, [xme] Median, [xmf] Mingrelian, [xmg] Mengaka, [xmh] Kuku-Muminh, [xmj] Majera, [xmk] Ancient Macedonian, [xml] Malaysian Sign Language, [xmm] Manado Malay, [xmn] Manichaean Middle Persian, [xmo] Morerebi, [xmp] Kuku-Mu'inh, [xmq] Kuku-Mangk, [xmr] Meroitic, [xms] Moroccan Sign Language, [xmt] Matbat, [xmu] Kamu, [xmv] Antankarana Malagasy, [xmv] Tankarana Malagasy, [xmw] Tsimihety Malagasy, [xmx] Maden, [xmy] Mayaguduna, [xmz] Mori Bawah, [xna] Ancient North Arabian, [xnb] Kanakanabu, [xng] Middle Mongolian, [xnh] Kuanhua, [xni] Ngarigu, [xnk] Nganakarti, [xnn] Northern Kankanay, [xno] Anglo-Norman, [xnr] Kangri, [xns] Kanashi, [xnt] Narragansett, [xnu] Nukunul, [xny] Nyiyaparli, [xnz] Kenzi, [xnz] Mattoki, [xoc] O'chi'chi', [xod] Kokoda, [xog] Soga, [xoi] Kominimung, [xok] Xokleng, [xom] Komo (Sudan), [xon] Konkomba, [xoo] Xukur??, [xop] Kopar, [xor] Korubo, [xow] Kowaki, [xpa] Pirriya, [xpc] Pecheneg, [xpe] Liberia Kpelle, [xpg] Phrygian, [xpi] Pictish, [xpj] Mpalitjanh, [xpk] Kulina Pano, [xpm] Pumpokol, [xpn] Kapinaw??, [xpo] Pochutec, [xpp] Puyo-Paekche, [xpq] Mohegan-Pequot, [xpr] Parthian, [xps] Pisidian, [xpt] Punthamara, [xpu] Punic, [xpy] Puyo, [xqa] Karakhanid, [xqt] Qatabanian, [xra] Krah??, [xrb] Eastern Karaboro, [xrd] Gundungurra, [xre] Kreye, [xrg] Minang, [xri] Krikati-Timbira, [xrm] Armazic, [xrn] Arin, [xrq] Karranga, [xrr] Raetic, [xrt] Aranama-Tamique, [xru] Marriammu, [xrw] Karawa, [xsa] Sabaean, [xsb] Sambal, [xsc] Scythian, [xsd] Sidetic, [xse] Sempan, [xsh] Shamang, [xsi] Sio, [xsl] South Slavey, [xsm] Kasem, [xsn] Sanga (Nigeria), [xso] Solano, [xsp] Silopi, [xsq] Makhuwa-Saka, [xsr] Sherpa, [xss] Assan, [xsu] Sanum??, [xsv] Sudovian, [xsy] Saisiyat, [xta] Alcozauca Mixtec, [xtb] Chazumba Mixtec, [xtc] Katcha-Kadugli-Miri, [xtd] Diuxi-Tilantongo Mixtec, [xte] Ketengban, [xtg] Transalpine Gaulish, [xth] Yitha Yitha, [xti] Sinicahua Mixtec, [xtj] San Juan Teita Mixtec, [xtl] Tijaltepec Mixtec, [xtm] Magdalena Pe??asco Mixtec, [xtn] Northern Tlaxiaco Mixtec, [xto] Tokharian A, [xtp] San Miguel Piedras Mixtec, [xtq] Tumshuqese, [xtr] Early Tripuri, [xts] Sindihui Mixtec, [xtt] Tacahua Mixtec, [xtu] Cuyamecalco Mixtec, [xtv] Thawa, [xtw] Tawand??, [xty] Yoloxochitl Mixtec, [xtz] Tasmanian, [xua] Alu Kurumba, [xub] Betta Kurumba, [xud] Umiida, [xug] Kunigami, [xuj] Jennu Kurumba, [xul] Ngunawal, [xum] Umbrian, [xun] Unggaranggu, [xuo] Kuo, [xup] Upper Umpqua, [xur] Urartian, [xut] Kuthant, [xuu] Khwedam, [xuu] Kxoe, [xve] Venetic, [xvi] Kamviri, [xvn] Vandalic, [xvo] Volscian, [xvs] Vestinian, [xwa] Kwaza, [xwc] Woccon, [xwd] Wadi Wadi, [xwe] Xwela Gbe, [xwg] Kwegu, [xwj] Wajuk, [xwk] Wangkumara, [xwl] Western Xwla Gbe, [xwo] Written Oirat, [xwr] Kwerba Mamberamo, [xwt] Wotjobaluk, [xww] Wemba Wemba, [xxb] Boro (Ghana), [xxk] Ke'o, [xxm] Minkin, [xxr] Korop??, [xxt] Tambora, [xya] Yaygir, [xyb] Yandjibara, [xyj] Mayi-Yapi, [xyk] Mayi-Kulan, [xyl] Yalakalore, [xyt] Mayi-Thakurti, [xyy] Yorta Yorta, [xzh] Zhang-Zhung, [xzm] Zemgalian, [xzp] Ancient Zapotec
[yaa] Yaminahua, [yab] Yuhup, [yac] Pass Valley Yali, [yad] Yagua, [yae] Pum??, [yaf] Yaka (Democratic Republic of Congo), [yag] Y??mana, [yah] Yazgulyam, [yai] Yagnobi, [yaj] Banda-Yangere, [yak] Yakama, [yal] Yalunka, [yam] Yamba, [yan] Mayangna, [yao] Yao, [yap] Yapese, [yaq] Yaqui, [yar] Yabarana, [yas] Nugunu (Cameroon), [yat] Yambeta, [yau] Yuwana, [yav] Yangben, [yaw] Yawalapit??, [yax] Yauma, [yay] Agwagwune, [yaz] Lokaa, [yba] Yala, [ybb] Yemba, [ybe] West Yugur, [ybh] Yakha, [ybi] Yamphu, [ybj] Hasha, [ybk] Bokha, [ybl] Yukuben, [ybm] Yaben, [ybn] Yaba??na, [ybo] Yabong, [ybx] Yawiyo, [yby] Yaweyuha, [ych] Chesu, [ycl] Lolopo, [ycn] Yucuna, [ycp] Chepya, [yda] Yanda, [ydd] Eastern Yiddish, [yde] Yangum Dey, [ydg] Yidgha, [ydk] Yoidik, [yea] Ravula, [yec] Yeniche, [yee] Yimas, [yei] Yeni, [yej] Yevanic, [yel] Yela, [yer] Tarok, [yes] Nyankpa, [yet] Yetfa, [yeu] Yerukula, [yev] Yapunda, [yey] Yeyi, [yga] Malyangapa, [ygi] Yiningayi, [ygl] Yangum Gel, [ygm] Yagomi, [ygp] Gepo, [ygr] Yagaria, [ygs] Yol??u Sign Language, [ygu] Yugul, [ygw] Yagwoia, [yha] Baha Buyang, [yhd] Judeo-Iraqi Arabic, [yhl] Hlepho Phowa, [yhs] Yan-nha??u Sign Language, [yia] Yinggarda, [yid] Yiddish, [yif] Ache, [yig] Wusa Nasu, [yih] Western Yiddish, [yii] Yidiny, [yij] Yindjibarndi, [yik] Dongshanba Lalo, [yil] Yindjilandji, [yim] Yimchungru Naga, [yin] Yinchia, [yip] Pholo, [yiq] Miqie, [yir] North Awyu, [yis] Yis, [yit] Eastern Lalu, [yiu] Awu, [yiv] Northern Nisu, [yix] Axi Yi, [yiz] Azhe, [yka] Yakan, [ykg] Northern Yukaghir, [yki] Yoke, [ykk] Yakaikeke, [ykl] Khlula, [ykm] Kap, [ykn] Kua-nsi, [yko] Yasa, [ykr] Yekora, [ykt] Kathu, [yku] Kuamasi, [yky] Yakoma, [yla] Yaul, [ylb] Yaleba, [yle] Yele, [ylg] Yelogu, [yli] Angguruk Yali, [yll] Yil, [ylm] Limi, [yln] Langnian Buyang, [ylo] Naluo Yi, [ylr] Yalarnnga, [ylu] Aribwaung, [yly] Ny??layu, [yly] Nyel??yu, [ymb] Yambes, [ymc] Southern Muji, [ymd] Muda, [yme] Yameo, [ymg] Yamongeri, [ymh] Mili, [ymi] Moji, [ymk] Makwe, [yml] Iamalele, [ymm] Maay, [ymn] Sunum, [ymn] Yamna, [ymo] Yangum Mon, [ymp] Yamap, [ymq] Qila Muji, [ymr] Malasar, [yms] Mysian, [ymx] Northern Muji, [ymz] Muzi, [yna] Aluo, [ynd] Yandruwandha, [yne] Lang'e, [yng] Yango, [ynk] Naukan Yupik, [ynl] Yangulam, [ynn] Yana, [yno] Yong, [ynq] Yendang, [yns] Yansi, [ynu] Yahuna, [yob] Yoba, [yog] Yogad, [yoi] Yonaguni, [yok] Yokuts, [yol] Yola, [yom] Yombe, [yon] Yongkom, [yor] Yoruba, [yot] Yotti, [yox] Yoron, [yoy] Yoy, [ypa] Phala, [ypb] Labo Phowa, [ypg] Phola, [yph] Phupha, [ypm] Phuma, [ypn] Ani Phowa, [ypo] Alo Phola, [ypp] Phupa, [ypz] Phuza, [yra] Yerakai, [yrb] Yareba, [yre] Yaour??, [yrk] Nenets, [yrl] Nhengatu, [yrm] Yirrk-Mel, [yrn] Yerong, [yro] Yaroam??, [yrs] Yarsun, [yrw] Yarawata, [yry] Yarluyandi, [ysc] Yassic, [ysd] Samatao, [ysg] Sonaga, [ysl] Yugoslavian Sign Language, [ysn] Sani, [yso] Nisi (China), [ysp] Southern Lolopo, [ysr] Sirenik Yupik, [yss] Yessan-Mayo, [ysy] Sanie, [yta] Talu, [ytl] Tanglang, [ytp] Thopho, [ytw] Yout Wam, [yty] Yatay, [yua] Yucatec Maya, [yua] Yucateco, [yub] Yugambal, [yuc] Yuchi, [yud] Judeo-Tripolitanian Arabic, [yue] Yue Chinese, [yuf] Havasupai-Walapai-Yavapai, [yug] Yug, [yui] Yurut??, [yuj] Karkar-Yuri, [yuk] Yuki, [yul] Yulu, [yum] Quechan, [yun] Bena (Nigeria), [yup] Yukpa, [yuq] Yuqui, [yur] Yurok, [yut] Yopno, [yuw] Yau (Morobe Province), [yux] Southern Yukaghir, [yuy] East Yugur, [yuz] Yuracare, [yva] Yawa, [yvt] Yavitero, [ywa] Kalou, [ywg] Yinhawangka, [ywl] Western Lalu, [ywn] Yawanawa, [ywq] Wuding-Luquan Yi, [ywr] Yawuru, [ywt] Central Lalo, [ywt] Xishanba Lalo, [ywu] Wumeng Nasu, [yww] Yawarawarga, [yxa] Mayawali, [yxg] Yagara, [yxl] Yardliyawarra, [yxm] Yinwum, [yxu] Yuyu, [yxy] Yabula Yabula, [yyr] Yir Yoront, [yyu] Yau (Sandaun Province), [yyz] Ayizi, [yzg] E'ma Buyang, [yzk] Zokhuo
[zaa] Sierra de Ju??rez Zapotec, [zab] San Juan Guelav??a Zapotec, [zab] Western Tlacolula Valley Zapotec, [zac] Ocotl??n Zapotec, [zad] Cajonos Zapotec, [zae] Yareni Zapotec, [zaf] Ayoquesco Zapotec, [zag] Zaghawa, [zah] Zangwal, [zai] Isthmus Zapotec, [zaj] Zaramo, [zak] Zanaki, [zal] Zauzou, [zam] Miahuatl??n Zapotec, [zao] Ozolotepec Zapotec, [zap] Zapotec, [zaq] Alo??pam Zapotec, [zar] Rinc??n Zapotec, [zas] Santo Domingo Albarradas Zapotec, [zat] Tabaa Zapotec, [zau] Zangskari, [zav] Yatzachi Zapotec, [zaw] Mitla Zapotec, [zax] Xadani Zapotec, [zay] Zaysete, [zay] Zayse-Zergulla, [zaz] Zari, [zbc] Central Berawan, [zbe] East Berawan, [zbl] Bliss, [zbl] Blissymbolics, [zbl] Blissymbols, [zbt] Batui, [zbw] West Berawan, [zca] Coatecas Altas Zapotec, [zch] Central Hongshuihe Zhuang, [zdj] Ngazidja Comorian, [zea] Zeeuws, [zeg] Zenag, [zeh] Eastern Hongshuihe Zhuang, [zen] Zenaga, [zga] Kinga, [zgb] Guibei Zhuang, [zgh] Standard Moroccan Tamazight, [zgm] Minz Zhuang, [zgn] Guibian Zhuang, [zgr] Magori, [zha] Chuang, [zha] Zhuang, [zhb] Zhaba, [zhd] Dai Zhuang, [zhi] Zhire, [zhn] Nong Zhuang, [zho] Chinese, [zhw] Zhoa, [zia] Zia, [zib] Zimbabwe Sign Language, [zik] Zimakani, [zil] Zialo, [zim] Mesme, [zin] Zinza, [zir] Ziriya, [ziw] Zigula, [ziz] Zizilivakan, [zka] Kaimbulawa, [zkb] Koibal, [zkd] Kadu, [zkg] Koguryo, [zkh] Khorezmian, [zkk] Karankawa, [zkn] Kanan, [zko] Kott, [zkp] S??o Paulo Kaing??ng, [zkr] Zakhring, [zkt] Kitan, [zku] Kaurna, [zkv] Krevinian, [zkz] Khazar, [zlj] Liujiang Zhuang, [zlm] Malay (individual language), [zln] Lianshan Zhuang, [zlq] Liuqian Zhuang, [zma] Manda (Australia), [zmb] Zimba, [zmc] Margany, [zmd] Maridan, [zme] Mangerr, [zmf] Mfinu, [zmg] Marti Ke, [zmh] Makolkol, [zmi] Negeri Sembilan Malay, [zmj] Maridjabin, [zmk] Mandandanyi, [zml] Madngele, [zmm] Marimanindji, [zmn] Mbangwe, [zmo] Molo, [zmp] Mpuono, [zmq] Mituku, [zmr] Maranunggu, [zms] Mbesa, [zmt] Maringarr, [zmu] Muruwari, [zmv] Mbariman-Gudhinma, [zmw] Mbo (Democratic Republic of Congo), [zmx] Bomitaba, [zmy] Mariyedi, [zmz] Mbandja, [zna] Zan Gula, [zne] Zande (individual language), [zng] Mang, [znk] Manangkari, [zns] Mangas, [zoc] Copainal?? Zoque, [zoh] Chimalapa Zoque, [zom] Zou, [zoo] Asunci??n Mixtepec Zapotec, [zoq] Tabasco Zoque, [zor] Ray??n Zoque, [zos] Francisco Le??n Zoque, [zpa] Lachiguiri Zapotec, [zpb] Yautepec Zapotec, [zpc] Choapan Zapotec, [zpd] Southeastern Ixtl??n Zapotec, [zpe] Petapa Zapotec, [zpf] San Pedro Quiatoni Zapotec, [zpg] Guevea De Humboldt Zapotec, [zph] Totomachapan Zapotec, [zpi] Santa Mar??a Quiegolani Zapotec, [zpj] Quiavicuzas Zapotec, [zpk] Tlacolulita Zapotec, [zpl] Lachix??o Zapotec, [zpm] Mixtepec Zapotec, [zpn] Santa In??s Yatzechi Zapotec, [zpo] Amatl??n Zapotec, [zpp] El Alto Zapotec, [zpq] Zoogocho Zapotec, [zpr] Santiago Xanica Zapotec, [zps] Coatl??n Zapotec, [zpt] San Vicente Coatl??n Zapotec, [zpu] Yal??lag Zapotec, [zpv] Chichicapan Zapotec, [zpw] Zaniza Zapotec, [zpx] San Baltazar Loxicha Zapotec, [zpy] Mazaltepec Zapotec, [zpz] Texmelucan Zapotec, [zqe] Qiubei Zhuang, [zra] Kara (Korea), [zrg] Mirgan, [zrn] Zerenkel, [zro] Z??paro, [zrp] Zarphatic, [zrs] Mairasi, [zsa] Sarasira, [zsk] Kaskean, [zsl] Zambian Sign Language, [zsm] Standard Malay, [zsr] Southern Rincon Zapotec, [zsu] Sukurum, [zte] Elotepec Zapotec, [ztg] Xanagu??a Zapotec, [ztl] Lapagu??a-Guivini Zapotec, [ztm] San Agust??n Mixtepec Zapotec, [ztn] Santa Catarina Albarradas Zapotec, [ztp] Loxicha Zapotec, [ztq] Quioquitani-Quier?? Zapotec, [zts] Tilquiapan Zapotec, [ztt] Tejalapan Zapotec, [ztu] G??il?? Zapotec, [ztx] Zaachila Zapotec, [zty] Yatee Zapotec, [zua] Zeem, [zuh] Tokano, [zul] Zulu, [zum] Kumzari, [zun] Zuni, [zuy] Zumaya, [zwa] Zay, [zxx] No linguistic content, [zxx] Not applicable, [zyb] Yongbei Zhuang, [zyg] Yang Zhuang, [zyj] Youjiang Zhuang, [zyn] Yongnan Zhuang, [zyp] Zyphe Chin, [zza] Dimili, [zza] Dimli (macrolanguage), [zza] Kirdki, [zza] Kirmanjki (macrolanguage), [zza] Zaza, [zza] Zazaki, [zzj] Zuojiang Zhuang
    `.trim().replace(/\n/g, ", ").split(", ").map(a => [
    a.replace(/^\[([a-z]{3})\] (.*)$/, "$1"),
    a.replace(/^\[([a-z]{3})\] (.*)$/, "$2"),
]));
const MPCLangOptionList = MPCHelper.createElement("datalist", { id: "mpclanglist" }, Array.from(MPCLangMap, ([value, text]) => new Option(text, value)));
document.head.appendChild(MPCLangOptionList);
class MPCTableOfContents extends HTMLElement {
    static i18n(string) {
        return MPCHelper.i18n(string, "mpc-toc");
    }
    static get observedAttributes() {
        return [
            "lang",
            "edit",
            "selectors"
        ];
    }
    #shadowRoot = this.attachShadow({
        mode: "closed",
        delegatesFocus: true
    });
    #createToolGroup({ tagName = "div", props = null, nodes = null, styles = null, callback = null, } = {}) {
        let toolGroup = MPCHelper.createElement(tagName, props, nodes, styles, callback);
        return toolGroup;
    }
    #createTool({ tagName = "button", props = null, nodes = null, styles = null, callback = null, onClick = null, }) {
        let tool = MPCHelper.createElement(tagName, props, nodes, styles, callback);
        if (typeof onClick == "function") {
            tool.addEventListener("mousedown", event => {
                event.preventDefault();
                let selection = this.#shadowRoot.getSelection();
                onClick(tool);
            });
        }
        return tool;
    }
    constructor() {
        super();
        this.#populateShadowRoot();
        MPCHelper.addEventListener("langchange", () => this.#populateShadowRoot());
    }
    #populateShadowRoot() {
        this.#shadowRoot.innerHTML = "";
        this.#shadowRoot.append(document.getElementById("style-css").cloneNode(true), 
        // ToolGroup Edit
        this.#createToolGroup({
            props: {
                className: "tool-group tool-group-edit"
            },
            nodes: [
                // Tool Add
                this.#createTool({
                    props: { className: "tool tool-add", title: MPCEditor.i18n("Add section above") },
                    onClick: () => {
                        this.parentElement.insertBefore(new MPCEditor, this);
                        MPCDocument.lastModified = new Date();
                    },
                    nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Add")),
                }),
                MPCHelper.createElement("hr"),
                // Tool Refresh
                this.#createTool({
                    props: { className: "tool tool-refresh", title: MPCEditor.i18n("Refresh table of contents") },
                    onClick: () => this.refresh(),
                    nodes: MPCHelper.createElement("span", null, MPCEditor.i18n("Refresh")),
                }),
            ]
        }), MPCHelper.createElement("slot", { className: "content" }));
    }
    refresh() {
        let selectors = this.selectors.split(";");
        this.innerHTML = "";
        let currentList = this;
        let currentListDepth = -1;
        document.querySelectorAll(".mpc-toc-id").forEach(item => item.remove());
        document.querySelectorAll(selectors.join(",")).forEach(heading => {
            let itemDepth = selectors.indexOf(selectors.filter(selector => heading.matches(selector))[0]);
            while (itemDepth > currentListDepth) {
                let newList = document.createElement("ol");
                currentList.appendChild(newList);
                currentList = newList;
                currentListDepth++;
            }
            while (itemDepth < currentListDepth) {
                currentList = currentList.parentElement;
                currentListDepth--;
            }
            let li = document.createElement("li");
            currentList.appendChild(li);
            let id = Date.now() + "--" + heading.textContent.normalize("NFKD").replace(/[^a-z0-9\-]+/gi, "");
            let a = document.createElement("a");
            a.classList.add("mpc-toc-id");
            a.id = id;
            a.name = id;
            heading.firstChild ? heading.insertBefore(a, heading.firstChild) : heading.appendChild(a);
            let liText = document.createElement("a");
            liText.text = heading.textContent;
            liText.href = "#" + id;
            li.appendChild(liText);
        });
    }
    get edit() {
        return this.hasAttribute("edit");
    }
    set edit(value) {
        if (value === "true" || value === true) {
            this.setAttribute("edit", "");
        }
        else {
            this.removeAttribute("edit");
        }
    }
    get selectors() {
        if (this.hasAttribute("selectors")) {
            return this.getAttribute("selectors");
        }
        else {
            return "h1;h2;h3;h4;h5;h6";
        }
    }
    set selectors(value) {
        if (value != null) {
            this.setAttribute("selectors", value);
        }
        else {
            this.removeAttribute("selectors");
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "edit":
                break;
            case "selectors":
                this.refresh();
                break;
        }
    }
}
customElements.define("mpc-toc", MPCTableOfContents);
MPCHelper.registerI18n("deu", "mpc-body", {
    "Add section above": "Abschnitt oberhalb Hinzuf??gen",
    "Add": "Hinzuf??gen",
    "Edit preferences": "Einstellungen bearbeiten",
    "Preferences": "Einstellungen",
    "Save file": "Datei speichern",
    "Document properties": "Dokumenteigenschaften",
    "Author:": "Autor:",
    "Title:": "Titel:",
    "Description:": "Beschreibung:",
    "Document language:": "Dokumentsprache:",
    "Last modified:": "Zuletzt bearbeitet:",
    "Global preferences": "Einstellungen",
    "Global language:": "Globale Sprache:",
    "New document": "Neues Dokument",
    "End of document": "Ende des Dokumentes",
    "Print": "Drucken",
});
MPCHelper.registerI18n("deu", "mpc-date", {
    "Sunday": "Sonntag",
    "Monday": "Montag",
    "Tuesday": "Dienstag",
    "Wednesday": "Mittwoch",
    "Thursday": "Donnerstag",
    "Friday": "Freitag",
    "Saturday": "Samstag",
    "January": "Januar",
    "February": "Februar",
    "March": "M??rz",
    "April": "April",
    "May": "Mai",
    "June": "Juni",
    "July": "Juli",
    "August": "August",
    "September": "September",
    "October": "Oktober",
    "November": "November",
    "December": "Dezember",
    "Invalid date": "Ung??ltiges Datum",
    "st": ".",
    "nd": ".",
    "rd": ".",
    "th": ".",
    "pm": "abends",
    "am": "morgens",
    "PM": "abends",
    "AM": "morgens"
});
MPCHelper.registerI18n("deu", "mpc-editor", {
    "Add section above": "Abschnitt oberhalb hinzuf??gen",
    "Add": "Hinzuf??gen",
    "Remove this section": "Diesen Abschnitt l??schen",
    "Do you really want to remove this section?": "M??chtest Du den Abschnitt wirklich l??schen?",
    "Remove": "L??schen",
    "Edit this section": "Diesen Abschnitt bearbeiten",
    "Edit": "Bearbeiten",
    "Translate this section": "Diesen Abschnitt ??bersetzen",
    "Select language": "Sprache ausw??hlen",
    "Show": "Anzeigen",
    "Cancel": "Abbrechen",
    "Please select the language you want to see": "Bitte w??hle eine Anzeigesprache",
    "Add new language": "Anzeigesprache hinzuf??gen",
    "Adding a new language will create a copy of the current visible content as the base for the translation.": "Das Hinzuf??gen einer Anzeigesprache wird den aktuell angezeigten Inhalt als Grundlage f??r die ??bersetzung kopieren.",
    "Language code": "Sprachcode",
    "Translate": "??bersetzen",
    "Apply changes": "??nderungen annehmen",
    "Apply": "Annehmen",
    "Discard changes": "??nderungen verwerfen",
    "Discard": "Verwerfen",
    "Enter fullscreen": "Vollbildmodus anzeigen",
    "Exit fullscreen": "Vollbildmodus beenden",
    "Undo": "R??ckg??ngig",
    "Redo": "Wiederholen",
    "Cut": "Ausschneiden",
    "Copy": "Kopieren",
    "Paste": "Einf??gen",
    "Reset format": "Formatierung zur??cksetzen",
    "Bold": "Fett",
    "Italic": "Kursiv",
    "Underline": "Unterstrichen",
    "Strike through": "Durchgestrichen",
    "Subscript": "Tiefgestellt",
    "Superscript": "Hochgestellt",
    "Align left": "Linksb??ndig",
    "Align center": "Zentriert",
    "Align right": "Rechtsb??ndig",
    "Justify": "Blocksatz",
    "Unordered list": "Liste",
    "Ordered list": "Aufz??hlung",
    "Outdent": "Ausr??cken",
    "Indent": "Einr??cken",
    "Heading 1": "??berschrift 1",
    "Heading 2": "??berschrift 2",
    "Heading 3": "??berschrift 3",
    "Heading 4": "??berschrift 4",
    "Paragraph": "Absatz",
    "Insert note": "Notiz einf??gen",
    "Note color": "Notizfarbe ??ndern",
    "Align none": "Unausgerichtet"
});
MPCHelper.registerI18n("deu", "mpc-toc", {
    "Add section above": "Abschnitt oberhalb hinzuf??gen",
    "Add": "Hinzuf??gen",
    "Refresh table of contents": "Inhaltsverzeichnis aktualisieren",
    "Refresh": "Aktualisieren"
});
