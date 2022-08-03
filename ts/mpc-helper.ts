type test = Parameters<HTMLElement["addEventListener"]>[0];

const MPCHelper = new class MPCHelper extends EventTarget {
  createElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    props: Partial<PickByType<HTMLElementTagNameMap[T], string | number | boolean | symbol | undefined | null | ((event: Event) => boolean)>> = null,
    nodes: string | Node | (Node | string | null)[] | null = null,
    styles: Partial<PickByType<HTMLElementTagNameMap[T]["style"], string>> = null,
    callback: ((element: HTMLElementTagNameMap[T]) => void) = null,
  ): HTMLElementTagNameMap[T] {
    let elm = document.createElement(tagName);
    if (props) {
      Object.keys(props).forEach(propertyName => elm[propertyName] = props[propertyName]);
    }
    if (nodes) {
      if (typeof nodes == "string" || nodes instanceof Node) {
        elm.append(nodes);
      } else {
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

  createInput<T extends keyof InputPropsByType>(
    options: {
      type: T;
      form?: string;
      disabled?: boolean;
      id?: string;
      inputMode?: string;
      name?: string;
      title?: string;
      value?: string;
      text: string;
      tabIndex?: number;
    },
    props: Partial<Input<T>> = {},
    styles: Partial<PickByType<HTMLInputElement["style"], string>> = null,
    callback: ((element: HTMLLabelElement) => void) = null,
  ) {
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
    let list = props["list"] as InputProps["list"];
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
          } else {
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

  createButton(
    options: {
      form?: string;
      text: string;
      icon?: string;
    },
    props: Partial<PickByType<HTMLButtonElement, string | number | boolean | symbol | undefined | null | ((event: Event) => boolean)>> = null,
    styles: Partial<PickByType<HTMLButtonElement["style"], string>> = null,
    callback: ((element: HTMLButtonElement) => void) = null,
  ) {
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
    })
  }

  createDialog(
    options: {
      headerText?: string;
      okText?: string;
      cancelText?: string;
      closeCallback?: () => void;
    } = {
        headerText: "MPCHelper Dialog",
        okText: "Ok",
        cancelText: "Cancel",
        closeCallback: () => null
      },
    props: Partial<PickByType<HTMLDialogElement, string | number | boolean | symbol | undefined | null | ((event: Event) => boolean)>> = null,
    nodes: string | Node | (Node | string)[] = null,
    styles: Partial<PickByType<HTMLDialogElement["style"], string>> = null,
    callback: ((element: HTMLDialogElement) => void) = null,
  ): HTMLDialogElement {
    return this.createElement(
      "dialog",
      Object.assign({
        className: "dialog"
      }, props),
      this.createElement(
        "form",
        { className: "dialog-form", method: "dialog" },
        [
          this.createElement("header", { className: "dialog-header" }, [
            this.createElement("h3", null, options.headerText, { textAlign: "center" })
          ]),
          ...(nodes instanceof Array ? nodes : [nodes]),
          this.createElement(
            "footer",
            { className: "dialog-footer" },
            this.createElement(
              "div",
              { className: "label-group" },
              [
                this.createButton({ icon: "check", text: options.okText }, { type: "submit", title: options.okText }),
                this.createButton({ icon: "close", text: options.cancelText }, { type: "reset", title: options.cancelText }),
              ]
            )
          )
        ],
        null,
        form => {
          form.addEventListener("submit", () => {
            let dialog = form.parentElement as HTMLDialogElement;
            if (dialog instanceof HTMLDialogElement) {
              dialog.returnValue = Array.from(
                new FormData(form),
                a => a.map(b => encodeURIComponent(b instanceof File ? URL.createObjectURL(b) : b)).join("=")
              ).join("&");
              dialog.close();
            }
          });
          form.addEventListener("reset", () => {
            let dialog = form.parentElement as HTMLDialogElement;
            if (dialog instanceof HTMLDialogElement) {
              dialog.returnValue = "";
              dialog.close();
            }
          });
        }
      ),
      Object.assign({

      }, styles),
      dialog => {
        dialog.addEventListener("click", (event: Event & { target: HTMLElement }) => {
          if (
            !document.activeElement ||
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement ||
            event.target instanceof HTMLButtonElement ||
            event.target.isContentEditable
          ) {
          } else {
            (<HTMLElement>document.activeElement).blur();
          }
        });
        if (typeof callback == "function") {
          callback(dialog);
        }
      }
    );
  }

  registerI18n(lang: string, context: string, strings: Map<string, string> | Record<string, string>) {
    let _lang = this.#i18nLangs.get(lang) || new Map<string, Map<string, string>>();
    let _context = _lang.get(context) || new Map<string, string>();
    if (strings instanceof Map) {
      strings.forEach((value, key) => {
        _context.set(key, value);
      });
    } else {
      for (let a in strings) {
        _context.set(a, strings[a]);
      }
    }
    _lang.set(context, _context);
    this.#i18nLangs.set(lang, _lang);
  }
  #i18nLangs: Map<string, Map<string, Map<string, string>>> = new Map([["eng", new Map()]]);
  #i18nCurrentLang: Map<string, Map<string, string>> = null;
  #i18nLang: string = null;
  get lang() {
    return this.#i18nLang;
  }
  set lang(value: string) {
    if (value != this.#i18nLang) {
      if (document.body) {
        document.documentElement.classList.add("langchange");
      }
      document.documentElement.lang = value;
      this.#i18nLang = value;
      if (!this.#i18nLangs.has(value)) {
        this.#i18nLangs.set(value, new Map())
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
  get langs(): readonly string[] {
    return Array.from(this.#i18nLangs.keys())
  }
  i18n(string: string, context: string) {
    if (
      this.#i18nCurrentLang.has(context) &&
      this.#i18nCurrentLang.get(context).has(string)
    ) {
      return this.#i18nCurrentLang.get(context).get(string);
    }
    return string ? string.toString() : Object.prototype.toString.call(string);
  }

  constructor() {
    super();

    let properties = new URLSearchParams(location.search);

    this.lang = properties.get("lang") || document.documentElement.lang;
  }
}

/**
 * Returns an interface stripped of all keys that don't resolve to U, defaulting 
 * to a non-strict comparison of T[key] extends U. Setting B to true performs
 * a strict type comparison of T[key] extends U & U extends T[key]
 */
type KeysOfType<T, U, B = false> = {
  [P in keyof T]: B extends true
  ? T[P] extends U
  ? (U extends T[P]
    ? P
    : never)
  : never
  : T[P] extends U
  ? P
  : never;
}[keyof T];

type PickByType<T, U, B = false> = Pick<T, KeysOfType<T, U, B>>;

type HTMLFormControlElements = HTMLButtonElement | HTMLFieldSetElement | HTMLInputElement | HTMLObjectElement | HTMLOutputElement | HTMLSelectElement | HTMLTextAreaElement;

interface HTMLDialogElement {
  show(promise?: false): void;
  show(promise: true): Promise<string>;
  showModal(promise?: false): void;
  showModal(promise: true): Promise<string>;
}

type Input<T extends keyof InputPropsByType> = Pick<InputProps, InputPropsByType[T]>;

let InputText: Partial<Input<keyof InputPropsByType>>;

type InputPropsByType = {
  file: "accept" | "capture" | "multiple" | "required";
  image: "alt" | "formAction" | "formEnctype" | "formMethod" | "formNoValidate" | "formTarget" | "height" | "src" | "width";
  color: "autocomplete" | "list";
  date: "autocomplete" | "list" | "max" | "min" | "readOnly" | "required" | "step";
  "datetime-local": "autocomplete" | "list" | "max" | "min" | "readOnly" | "required" | "step";
  email: "autocomplete" | "list" | "maxLength" | "minLength" | "multiple" | "pattern" | "placeholder" | "readOnly" | "required" | "size";
  hidden: "autocomplete";
  month: "autocomplete" | "list" | "max" | "min" | "readOnly" | "required" | "step";
  number: "autocomplete" | "list" | "max" | "min" | "placeholder" | "readOnly" | "required" | "step";
  password: "autocomplete" | "maxLength" | "minLength" | "pattern" | "placeholder" | "readOnly" | "required" | "size";
  range: "autocomplete" | "list" | "max" | "min" | "step";
  search: "autocomplete" | "dirName" | "list" | "maxLength" | "minLength" | "pattern" | "placeholder" | "readOnly" | "required";
  tel: "autocomplete" | "list" | "maxLength" | "minLength" | "pattern" | "placeholder" | "readOnly" | "required" | "size";
  text: "autocomplete" | "dirName" | "list" | "maxLength" | "minLength" | "pattern" | "placeholder" | "readOnly" | "required" | "size";
  time: "autocomplete" | "list" | "max" | "min" | "readOnly" | "required" | "step";
  url: "autocomplete" | "list" | "maxLength" | "minLength" | "pattern" | "placeholder" | "readOnly" | "required" | "size";
  week: "autocomplete" | "list" | "max" | "min" | "readOnly" | "required" | "step";
  checkbox: "checked" | "required";
  // switch: "checked" | "required";
  radio: "checked" | "required";
  submit: "formAction" | "formEnctype" | "formMethod" | "formNoValidate" | "formTarget";
};

interface InputProps {
  labelText: string;
  // disabled: string;
  // form: string;
  id: string;
  inputmode: string;
  // name: string;
  title: string;
  // type: string;
  // value: string;
  /**
   * Sets or retrieves a comma-separated list of content types. 
   * @example .doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
   */
  accept: string;
  /** Sets or retrieves a text alternative to the graphic. */
  alt: string;
  /** Specifies whether autocomplete is applied to an editable text field. */
  autocomplete: string;
  capture: "user" | "environment";
  /** Sets or retrieves the state of the check box or radio button. */
  checked: boolean;
  /** Sets or retrieves the state of the check box or radio button. */
  defaultChecked: boolean;
  /** Sets or retrieves the initial contents of the object. */
  defaultValue: string;
  dirName: string;
  disabled: boolean;
  /** Returns a FileList object on a file type input object. */
  files: FileList | null;
  /** Retrieves a reference to the form that the object is embedded in. */
  readonly form: HTMLFormElement | null;
  /** Overrides the action attribute (where the data on a form is sent) on the parent form element. */
  formAction: string;
  /** Used to override the encoding (formEnctype attribute) specified on the form element. */
  formEnctype: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  /** Overrides the submit method attribute previously specified on a form element. */
  formMethod: "get" | "post" | "dialog";
  /** Overrides any validation or required attributes on a form or form elements to allow it to be submitted without validation. This can be used to create a "save draft"-type submit option. */
  formNoValidate: boolean;
  /** Overrides the target attribute on a form element. */
  formTarget: string;
  /** Sets or retrieves the height of the object. */
  height: number;
  /** When set, overrides the rendering of checkbox controls so that the current value is not visible. */
  indeterminate: boolean;
  readonly labels: NodeListOf<HTMLLabelElement> | null;
  /** Specifies the ID of a pre-defined datalist of options for an input element. */
  // readonly list: HTMLElement | null;
  readonly list: string | (string | HTMLOptionElement | HTMLOptGroupElement)[];
  /** Defines the maximum acceptable value for an input element with type="number".When used with the min and step attributes, lets you control the range and increment (such as only even numbers) that the user can enter into an input field. */
  max: string;
  /** Sets or retrieves the maximum number of characters that the user can enter in a text control. */
  maxLength: number;
  /** Defines the minimum acceptable value for an input element with type="number". When used with the max and step attributes, lets you control the range and increment (such as even numbers only) that the user can enter into an input field. */
  min: string;
  minLength: number;
  /** Sets or retrieves the Boolean value indicating whether multiple items can be selected from a list. */
  multiple: boolean;
  /** Sets or retrieves the name of the object. */
  name: string;
  /** Gets or sets a string containing a regular expression that the user's input must match. */
  pattern: string;
  /** Gets or sets a text string that is displayed in an input field as a hint or prompt to users as the format or type of information they need to enter.The text appears in an input field until the user puts focus on the field. */
  placeholder: string;
  readOnly: boolean;
  /** When present, marks an element that can't be submitted without a value. */
  required: boolean;
  selectionDirection: "forward" | "backward" | "none" | null;
  /** Gets or sets the end position or offset of a text selection. */
  selectionEnd: number | null;
  /** Gets or sets the starting position or offset of a text selection. */
  selectionStart: number | null;
  size: number;
  /** The address or URL of the a media resource that is to be considered. */
  src: string;
  /** Defines an increment or jump between values that you want to allow the user to enter. When used with the max and min attributes, lets you control the range and increment (for example, allow only even numbers) that the user can enter into an input field. */
  step: string;
  /** Returns the content type of the object. */
  type: string;
  /**
   * Sets or retrieves the URL, often with a bookmark extension (#name), to use as a client-side image map.
   * @deprecated
   */
  useMap: string;
  /** Returns the error message that would be displayed if the user submits the form, or an empty string if no error message. It also triggers the standard error message, such as "this is a required field". The result is that the user sees validation messages without actually submitting. */
  readonly validationMessage: string;
  /** Returns a  ValidityState object that represents the validity states of an element. */
  readonly validity: ValidityState;
  /** Returns the value of the data at the cursor's current position. */
  value: string;
  /** Returns a Date object representing the form control's value, if applicable; otherwise, returns null. Can be set, to change the value. Throws an "InvalidStateError" DOMException if the control isn't date- or time-based. */
  valueAsDate: Date | null;
  /** Returns the input field value as a number. */
  valueAsNumber: number;
  readonly webkitEntries: ReadonlyArray<FileSystemEntry>;
  webkitdirectory: boolean;
  /** Sets or retrieves the width of the object. */
  width: number;
  /** Returns whether an element will successfully validate based on forms validation rules and constraints. */
  readonly willValidate: boolean;
}

(() => {
  let _show = HTMLDialogElement.prototype.show;
  function show(promise?: false): void;
  function show(promise: true): Promise<string>;
  function show(this: HTMLDialogElement, promise: boolean = false): void | Promise<string> {
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
    } else {
      _show.call(this);
    }
  }
  HTMLDialogElement.prototype.show = show;

  let _showModal = HTMLDialogElement.prototype.showModal;
  function showModal(promise?: false): void;
  function showModal(promise: true): Promise<string>;
  function showModal(this: HTMLDialogElement, promise: boolean = false): void | Promise<string> {
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
    } else {
      _showModal.call(this);
    }
  }
  HTMLDialogElement.prototype.showModal = showModal;
})();
