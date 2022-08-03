class MPCTableOfContents extends HTMLElement {

  static i18n(string: string) {
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

  #createToolGroup<T extends keyof HTMLElementTagNameMap = "div">({
    tagName = "div" as T,
    props = null,
    nodes = null,
    styles = null,
    callback = null,
  }: {
    tagName?: T;
    props?: Partial<PickByType<HTMLElementTagNameMap[T], string | number | boolean | symbol | undefined | null | ((event: Event) => boolean)>>;
    nodes?: string | Node | (Node | string)[];
    styles?: Partial<PickByType<HTMLElementTagNameMap[T]["style"], string>>;
    callback?: ((element: HTMLElementTagNameMap[T]) => void);
  } = {}) {
    let toolGroup = MPCHelper.createElement(tagName, props, nodes, styles, callback);
    return toolGroup;
  }

  #createTool<T extends keyof HTMLElementTagNameMap = "button">({
    tagName = "button" as T,
    props = null,
    nodes = null,
    styles = null,
    callback = null,
    onClick = null,
  }: {
    tagName?: T;
    props?: Partial<PickByType<HTMLElementTagNameMap[T], string | number | boolean | symbol | undefined | null | ((event: Event) => boolean)>>;
    nodes?: string | Node | (Node | string)[];
    styles?: Partial<PickByType<HTMLElementTagNameMap[T]["style"], string>>;
    callback?: ((element: HTMLElementTagNameMap[T]) => void);
    onClick?: (tool: HTMLElementTagNameMap[T]) => void;
  }) {
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
    this.#shadowRoot.append(
      document.getElementById("style-css").cloneNode(true),
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
      }),
      MPCHelper.createElement("slot", { className: "content" }),
    );
  }

  refresh() {
    let selectors = this.selectors.split(";");
    this.innerHTML = "";
    let currentList: HTMLElement = this;
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

  get selectors(): string {
    if (this.hasAttribute("selectors")) {
      return this.getAttribute("selectors");
    } else {
      return "h1;h2;h3;h4;h5;h6";
    }
  }
  set selectors(value: string) {
    if (value != null) {
      this.setAttribute("selectors", value);
    } else {
      this.removeAttribute("selectors");
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
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