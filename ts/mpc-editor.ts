interface ShadowRoot {
  getSelection(): Selection;
}

class MPCEditor extends HTMLElement {

  static i18n(string: string) {
    return MPCHelper.i18n(string, "mpc-editor");
  }

  static get observedAttributes() {
    return [
      "edit",
      "lang",
      "lastModified"
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

  #createToolGroup<T extends keyof HTMLElementTagNameMap = "div">({
    tagName = "div" as T,
    props = null,
    nodes = null,
    styles = null,
    callback = null,
    onCaretPosition = null,
  }: {
    tagName?: T;
    props?: Partial<PickByType<HTMLElementTagNameMap[T], string | number | boolean | symbol | undefined | null | ((event: Event) => boolean)>>;
    nodes?: string | Node | (Node | string)[];
    styles?: Partial<PickByType<HTMLElementTagNameMap[T]["style"], string>>;
    callback?: ((element: HTMLElementTagNameMap[T]) => void);
    onCaretPosition?: (node: Node, element: HTMLElement, toolGroup: HTMLElementTagNameMap[T]) => void;
  } = {}) {
    let toolGroup = MPCHelper.createElement(tagName, props, nodes, styles, callback);
    if (typeof onCaretPosition == "function") {
      this.#checkForContexts.push((node, element) => onCaretPosition(node, element, toolGroup));
    }
    return toolGroup;
  }

  #createTool<T extends keyof HTMLElementTagNameMap = "button">({
    tagName = "button" as T,
    props = null,
    nodes = null,
    styles = null,
    callback = null,
    command = null,
    onCaretPosition = null,
    onClick = null,
  }: {
    tagName?: T;
    props?: Partial<PickByType<HTMLElementTagNameMap[T], string | number | boolean | symbol | undefined | null | ((event: Event) => boolean)>>;
    nodes?: string | Node | (Node | string)[];
    styles?: Partial<PickByType<HTMLElementTagNameMap[T]["style"], string>>;
    callback?: ((element: HTMLElementTagNameMap[T]) => void);
    command?: string;
    onCaretPosition?: (node: Node, element: HTMLElement, tool: HTMLElementTagNameMap[T]) => void;
    onClick?: (node: Node, element: HTMLElement, tool: HTMLElementTagNameMap[T]) => void;
  }) {
    let tool = MPCHelper.createElement(tagName, props, nodes, styles, callback);
    if (typeof onClick == "function") {
      tool.addEventListener("mousedown", event => {
        event.preventDefault();
        this.#editableContent.blur();
        this.#editableContent.focus();
        let selection = this.#shadowRoot.getSelection();
        let node: Node = this.#editableContent;
        let element: HTMLElement = this.#editableContent;
        if (selection.rangeCount > 0) {
          node = selection.getRangeAt(0).commonAncestorContainer;
          if (node instanceof HTMLElement) {
            element = node;
          } else {
            element = node.parentElement;
          }
        }
        onClick(node, element, tool);
        this.#checkCurrentCaretPosition();
      });
    } else if (command) {
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
    let node: Node = this.#editableContent;
    let element: HTMLElement = this.#editableContent;
    if (selection.rangeCount > 0) {
      node = selection.getRangeAt(0).commonAncestorContainer;
      if (node instanceof HTMLElement) {
        element = node;
      } else {
        element = node.parentElement;
      }
    }

    this.#checkForContexts.forEach(callback => callback(node, element));
  }

  #checkForContexts: ((node: Node, element: HTMLElement) => void)[] = [];

  constructor() {
    super();

    this.#populateShadowRoot();
    MPCHelper.addEventListener("langchange", () => this.#populateShadowRoot());
  }

  #populateShadowRoot() {
    this.#shadowRoot.innerHTML = "";
    this.#shadowRoot.append(
      document.getElementById("style-css").cloneNode(true),
      this.#styleElement,
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
                      let clone = this.querySelector(`:scope>:lang(${this.lang})`).cloneNode(true) as HTMLElement;
                      clone.lang = params.get("new-lang").toLowerCase();
                      this.appendChild(clone);
                      this.lang = clone.lang;

                      if (innerWidth < 450 || innerHeight < 576) {
                        this.requestFullscreen({ navigationUI: "hide" });
                      }
                      this.edit = true;
                      this.#editableContent.focus();
                    }
                  } else {
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
                  this.edit = false
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
                  } else {
                    this.requestFullscreen({ navigationUI: "hide" });
                  }
                },
                callback: tool => {
                  document.addEventListener("fullscreenchange", () => {
                    if (document.fullscreenElement) {
                      tool.classList.add("active", "tool-exitFullscreen");
                      tool.classList.remove("tool-fullscreen");
                      tool.title = MPCEditor.i18n("Exit fullscreen");
                    } else {
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
                  button.classList.toggle("active", getComputedStyle(element).verticalAlign == "super")
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
                      let card = element.closest("section.card") as HTMLElement;
                      if (card) {
                        tool.value = tool.parentElement.style.borderColor = getComputedStyle(card).backgroundColor;
                      }
                    },
                    callback: input => {
                      input.setAttribute("list", "datalist-noteColor");
                      input.addEventListener("input", () => {
                        input.parentElement.style.borderColor = input.value;

                        let element = this.#shadowRoot.getSelection().getRangeAt(0).commonAncestorContainer as Element | HTMLElement;

                        if (element && (element instanceof HTMLElement || (element = element.parentElement))) {
                          let card = element.closest("section.card") as HTMLElement;
                          let color = new MPColor(input.value);
                          card.style.setProperty("--backColor", color.toRGB());
                          if (color.lightness > 0.5) {
                            color.lightness -= 0.7;
                            card.style.color = "#000";
                          } else {
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
                    new Option("grün", "#eeffee"),
                    new Option("türkis", "#eeffff"),
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
      this.#editableContent
    );
  }

  set lang(value: string) {
    if (this.langs.includes(value)) {
      if (value) {
        this.setAttribute("lang", value);
      } else {
        this.removeAttribute("lang");
      }
    }
  }
  get lang() {
    if (this.hasAttribute("lang")) {
      return this.getAttribute("lang");
    }
    let parent: HTMLElement = this;
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
  set lastModified(value: string | number | Date | null) {
    if (value) {
      this.setAttribute("last-modified", new Date(value).toUTCString());
    } else {
      this.removeAttribute("last-modified");
    }
  }

  get langs(): readonly string[] {
    return Array.from(this.children, (element: HTMLElement) => element.lang).filter(a => a);
  }

  get edit(): boolean {
    return this.hasAttribute("edit");
  }
  set edit(value: boolean | `${boolean}`) {
    if (value === "true" || value === true) {
      this.setAttribute("edit", "");
    } else {
      this.removeAttribute("edit");
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
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
    }
  }

  // static MPCEditorPlugin = class MPCEditorPlugin {
  //   constructor() {

  //   }
  // }

  // static #plugins: MPCEditorPlugin[] = [];

}
customElements.define("mpc-editor", MPCEditor);
// const MPCEditorPlugin = MPCEditor.MPCEditorPlugin;
// type MPCEditorPlugin = typeof MPCEditor.MPCEditorPlugin["prototype"];

// class MPCEditorNotePlugin extends MPCEditorPlugin {
//   constructor() {
//     super();
//   }
// }