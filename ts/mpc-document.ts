const MPCDocument = new class MPCDocument {
  readonly #lastModifiedElement = document.querySelector('meta[http-equiv="last-modified"]') as HTMLMetaElement;
  readonly #authorElement = document.querySelector('meta[name="author"]') as HTMLMetaElement;
  readonly #descriptionElement = document.querySelector('meta[name="description"]') as HTMLMetaElement;

  get title(): string {
    return document.title;
  }
  set title(value: string) {
    document.title = value;
  }

  get lastModified(): string {
    return this.#lastModifiedElement.content;
  }
  set lastModified(value: string | number | Date | null) {
    this.#lastModifiedElement.content = new Date(value).toUTCString();
  }

  get author(): string {
    return this.#authorElement.content;
  }
  set author(value: string | null) {
    this.#authorElement.content = value || "";
  }

  get description(): string {
    return this.#descriptionElement.content;
  }
  set description(value: string | null) {
    this.#descriptionElement.content = value || "";
  }
}