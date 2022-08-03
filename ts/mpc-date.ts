class MPCDate extends HTMLElement {
  static get observedAttributes() {
    return [
      "format",
      "timestamp"
    ];
  }

  static i18n(string: string) {
    return MPCHelper.i18n(string, "mpc-date");
  }

  /**
   * Diese Zeichenfolgen werden von `date()` benutzt um die Wochentage darzustellen
   * 
   * Sie werden von `i18n(weekdays[i] )` übersetzt
   */
  static readonly weekdays: readonly string[] = [
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
   * Sie werden von `i18n(months[i] )` übersetzt
   */
  static readonly months: readonly string[] = [
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
  static time(timestamp: number | string | Date = new Date): number {
    var d = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    return d.getTime();
  }

  /**
   * Formatiert ein(e) angegebene(s) Ortszeit/Datum gemäß PHP 7
   * @param format die Zeichenfolge, die umgewandelt wird
   * @param timestamp der zu verwendende Zeitpunkt
   */
  static date(format: string, timestamp: number | string | Date | null = new Date): string {
    let date = timestamp === null ? new Date() : timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (date.toJSON() === null) {
      return this.i18n("Invalid date");
    }
    return this.formatTokenizer(format).map(token => token.type == "date" ? token.value.split("").map(string => this._functions[string](date)).join("") : token.value).join("");
  }

  static formatTokenizer(format: string) {
    let inputStream = format.split("");
    let inputStreamIndex = -1;
    let inputStreamLength = inputStream.length;
    let tokenStream: { type: "string" | "date"; value: string; }[] = [];
    let currentToken: { type: "string" | "date"; value: string; } = { type: "string", value: "" };
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
      } else if (/[dDjlNSwzWFmMntLoYyaABgGhHisuveIOPTZcrU]/.test(current)) {
        if (currentToken.type != "date") {
          currentToken.value.length > 0 && tokenStream.push(currentToken);
          currentToken = { type: "date", value: "" };
        }
        currentToken.value += current;
      } else {
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

  static getUpdateTimeout(format: string, timestamp: number | string | Date = new Date) {
    let time = this.time(timestamp);
    return Math.min(
      ...this.formatTokenizer(format).filter(a => a.type == "date").map(
        token => token.value.split("").map((a): number => {
          if (/[eIOPTZLoYy]/.test(a)) {
            // calculate next year change
            return time % 31557600000 || 31557600000;
          } else if (/[FmMnt]/.test(a)) {
            // calculate next month change
            return time % 2629800000 || 2629800000;
          } else if (/[W]/.test(a)) {
            // calculate next week change
            return time % 604800000 || 604800000;
          } else if (/[dDjlNSwz]/.test(a)) {
            // calculate next day change
            return time % 86400000 || 86400000;
          } else if (/[aAgGhH]/.test(a)) {
            // calculate next hour change
            return time % 3600000 || 3600000;
          } else if (/[i]/.test(a)) {
            // calculate next minute change
            return time % 60000 || 60000;
          } else if (/[scr]/.test(a)) {
            // calculate next seconds change
            return 1000;
          } else if (/[B]/.test(a)) {
            return 100;
          } else {
            // on-milliseconds-change: uvU
            return 1;
          }
        })
      ).flat()
    );
  }

  /**
   * Die verwendeten Funktionen zur mwandlung der Buchstaben
   */
  protected static readonly _functions: {
    [s: string]: (d: Date) => string | number;
  } = {
      // #region Tag [dDjlNSwz]
      /**
       * Tag des Monats, 2-stellig mit führender Null
       * 01 bis 31
       */
      d(date) {
        return MPCDate._leadingZero(date.getDate());
      },
      /**
       * Wochentag, gekürzt auf drei Buchstaben
       * Mon bis Sun
       */
      D(date) {
        return MPCDate.i18n(MPCDate.weekdays[date.getDay()]).substr(0, 3);
      },
      /**
       * Tag des Monats ohne führende Nullen
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
       * Numerische Repräsentation des Wochentages gemäß ISO-8601 (in PHP 5.1.0 hinzugefügt)
       * 1 (für Montag) bis 7 (für Sonntag)
       */
      N(date) {
        return date.getDay() == 0 ? 7 : date.getDay();
      },
      /**
       * Anhang der englischen Aufzählung für einen Monatstag, zwei Zeichen
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
       * 0 (für Sonntag) bis 6 (für Samstag)
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
       * Monat als Zahl, mit führenden Nullen
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
       * Monatszahl, ohne führende Nullen
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
       * 1 für ein Schaltjahr, ansonsten 0
       */
      L(date) {
        return date.getFullYear() % 4 == 0 && date.getFullYear() % 100 != 0 ? 1 : 0;
      },
      /**
       * Jahreszahl der Kalenderwoche gemäß ISO-8601. Dies ergibt den gleichen Wert wie Y, außer wenn die ISO-Kalenderwoche (W) zum vorhergehenden oder nächsten Jahr gehört, wobei dann jenes Jahr verwendet wird (in PHP 5.1.0 hinzugefügt).
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
       * Großgeschrieben: Ante meridiem (Vormittag) und Post meridiem (Nachmittag)
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
       * Stunde im 12-Stunden-Format, ohne führende Nullen
       * 1 bis 12
       */
      g(date) {
        return date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
      },
      /**
       * Stunde im 24-Stunden-Format, ohne führende Nullen
       * 0 bis 23
       */
      G(date) {
        return date.getHours();
      },
      /**
       * Stunde im 12-Stunden-Format, mit führenden Nullen
       * 01 bis 12
       */
      h(date) {
        return MPCDate._leadingZero(date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
      },
      /**
       * Stunde im 24-Stunden-Format, mit führenden Nullen
       * 00 bis 23
       */
      H(date) {
        return MPCDate._leadingZero(date.getHours());
      },
      /**
       * Minuten, mit führenden Nullen
       * 00 bis 59
       */
      i(date) {
        return MPCDate._leadingZero(date.getMinutes());
      },
      /**
       * Sekunden, mit führenden Nullen
       * 00 bis 59
       */
      s(date) {
        return MPCDate._leadingZero(date.getSeconds());
      },
      /**
       * Mikrosekunden (hinzugefügt in PHP 5.2.2). Beachten Sie, dass date() immer die Ausgabe 000000 erzeugen wird, da es einen Integer als Parameter erhält, wohingegen DateTime::format() Mikrosekunden unterstützt, wenn DateTime mit Mikrosekunden erzeugt wurde.
       * Beispiel: 654321
       */
      u(date) {
        return date.getMilliseconds();
      },
      /**
       * Millisekunden (hinzugefügt in PHP 7.0.0). Es gelten die selben Anmerkungen wie für u.
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
       * Fällt ein Datum in die Sommerzeit
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
       * Zeitunterschied zur Greenwich time (GMT) in Stunden mit Doppelpunkt zwischen Stunden und Minuten (hinzugefügt in PHP 5.1.3)
       * Beispiel: +02:00
       */
      P() {
        console.error("MPCDate.date(): P is currently not supported");
        return "P";
      },
      /**
       * Abkürzung der Zeitzone
       * Beispiele: EST, MDT ...
       */
      T() {
        console.error("MPCDate.date(): T is currently not supported");
        return "T";
      },
      /**
       * Offset der Zeitzone in Sekunden. Der Offset für Zeitzonen westlich von UTC ist immer negativ und für Zeitzonen östlich von UTC immer positiv.
       * -43200 bis 50400
       */
      Z() {
        console.error("MPCDate.date(): Z is currently not supported");
        return "Z";
      },
      // #endregion

      // #region Vollständige(s) Datum/Uhrzeit [crU]
      /**
       * ISO 8601 Datum (hinzugefügt in PHP 5)
       * 2004-02-12T15:19:21+00:00
       */
      c() {
        console.error("MPCDate.date(): c is currently not supported");
        return "c";
      },
      /**
       * Gemäß » RFC 2822 formatiertes Datum
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

  protected static _leadingZero(value: number): string {
    return value < 10 ? "0" + value : value.toString();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name == "timestamp") {
      this.#update(this.format, newValue === null ? null : parseInt(newValue));
    } else if (name == "format") {
      this.#update(newValue, this.timestamp);
    }
  }

  get format() {
    return this.getAttribute("format");
  }
  set format(value: string | null) {
    if (value === null) {
      this.removeAttribute("format");
    } else {
      this.setAttribute("format", value);
    }
  }

  get timestamp(): number | null {
    if (this.hasAttribute("timestamp")) {
      return parseInt(this.getAttribute("timestamp"));
    }
    return null;
  }
  set timestamp(value: number | string | Date | null) {
    if (value === null) {
      this.removeAttribute("timestamp");
    } else {
      this.setAttribute("timestamp", <unknown>MPCDate.time(value) as string);
    }
  }

  get value() {
    return MPCDate.date(this.format, this.timestamp);
  }

  #updateTimeout: number = null;

  #update(format: string, timestamp: string | number | Date | null) {
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

    } else {
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