class MPCBody extends HTMLBodyElement {
  #shadowRoot = this.attachShadow({
    mode: "closed",
    delegatesFocus: true
  });
  #copyright: HTMLParagraphElement;

  constructor() {
    super();

    this.lang = MPCHelper.lang;
    this.#populateShadowRoot();
    MPCHelper.addEventListener("langchange", () => this.#populateShadowRoot());
    const firstModified = MPCDocument.lastModified;

    document.addEventListener("readystatechange", event => {
      this.#copyright = document.getElementById("copyright") as HTMLParagraphElement;
    });

    addEventListener("beforeunload", event => {
      if (document.querySelectorAll("[edit]").length) {
        event.preventDefault();
        event.returnValue = MPCHelper.i18n("Some sections have opened editors. Please close them before closing the window.", "mpc-body");
      }

      if (firstModified != MPCDocument.lastModified) {
        event.preventDefault();
        event.returnValue = MPCHelper.i18n("Changes have been made since the document was opened. Have you saved the changes?", "mpc-body");
      }
    });
  }

  #populateShadowRoot() {
    this.#shadowRoot.innerHTML = "";
    this.#shadowRoot.append(
      document.getElementById("style-css").cloneNode(true),
      MPCHelper.createElement("slot", { className: "content" }),
      MPCHelper.createElement("div", { className: "toolbar" },
        MPCHelper.createElement("div", { className: "tool-group" }, [
          MPCHelper.createElement(
            "button",
            {
              className: "tool tool-add",
              title: MPCHelper.i18n("Add section above", "mpc-body"),
              onclick: event => {
                event.preventDefault();
                this.insertBefore(new MPCEditor(), this.#copyright);
                MPCDocument.lastModified = new Date();
              }
            },
            MPCHelper.createElement("span", null, MPCHelper.i18n("Add", "mpc-body"))
          ),
          MPCHelper.createElement("hr"),
          MPCHelper.createElement(
            "button",
            {
              className: "tool tool-edit",
              title: MPCHelper.i18n("Edit preferences", "mpc-body"),
              onclick: event => {
                event.preventDefault();
                this.#showDocumentInformationDialog();
              }
            },
            MPCHelper.createElement("span", null, MPCHelper.i18n("Preferences", "mpc-body"))
          ),
          MPCHelper.createElement(
            "button",
            {
              className: "tool tool-save",
              title: MPCHelper.i18n("Save file", "mpc-body"),
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
            },
            MPCHelper.createElement("span", null, MPCHelper.i18n("Save file", "mpc-body"))
          ),
        ]),
      ),
    );
  }

  async #showDocumentInformationDialog() {
    const value = await MPCHelper.createDialog({
      headerText: MPCHelper.i18n("Preferences", "mpc-body"),
      okText: "Ok",
      cancelText: "Cancel"
    }, null, [
      MPCHelper.createElement("h4", null, MPCHelper.i18n("Document properties", "mpc-body"), { textAlign: "center" }),
      MPCHelper.createInput({
        type: "text",
        text: MPCHelper.i18n("Author:", "mpc-body"),
        name: "author",
        value: MPCDocument.author
      }, {
        list: [MPCDocument.author],
        autocomplete: "no"
      }),
      MPCHelper.createInput({
        type: "text",
        text: MPCHelper.i18n("Title:", "mpc-body"),
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
          textContent: MPCHelper.i18n("Description:", "mpc-body")
        })
      ]),
      MPCHelper.createInput({
        type: "text",
        text: MPCHelper.i18n("Document language:", "mpc-body"),
        name: "lang",
        value: this.lang
      }, {
        list: Array.from(
          new Set(
            Array.from(
              document.querySelectorAll("mpc-editor"),
              (element: MPCEditor) => element.langs
            ).flat()
          ),
          lang => new Option(MPCLangMap.get(lang), lang)
        ),
        required: true,
        autocomplete: "no"
      }),
      MPCHelper.createElement("label", { className: "label label-output" }, [
        MPCHelper.createElement("span", {
          className: "label-text",
          textContent: MPCHelper.i18n("Last modified:", "mpc-body")
        }),
        MPCHelper.createElement("output", {
          className: "label-output",
          value: MPCDate.date("jS F Y / H:i:s", MPCDocument.lastModified || null)
        })
      ]),
      MPCHelper.createElement("h4", null, MPCHelper.i18n("Global preferences", "mpc-body"), { textAlign: "center" }),
      MPCHelper.createInput({
        type: "text",
        text: MPCHelper.i18n("Global language:", "mpc-body"),
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
      this.querySelectorAll("mpc-editor,mpc-toc").forEach((element: HTMLElement) => element.lang = document.body.lang);
    }
  }
}
customElements.define("mpc-body", MPCBody, {
  extends: "body"
});

