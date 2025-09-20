export type GrapesBlockDefinition = {
  id: string;
  label: string;
  category?: string;
  content: string;
  media?: string;
};

export type GrapesEditorCommand = {
  run?: (editor: GrapesEditor) => void;
  stop?: (editor: GrapesEditor) => void;
};

export type GrapesPanelButton = {
  id: string;
  label?: string;
  command?: string;
  className?: string;
  togglable?: boolean;
  active?: boolean;
  attributes?: Record<string, string>;
};

export interface GrapesEditor {
  getHtml(): string;
  getCss(): string;
  setComponents(html: string): void;
  setStyle(css: string): void;
  on(event: string, callback: () => void): void;
  destroy(): void;
  BlockManager: {
    add(id: string, options: {
      label: string;
      content: string;
      category?: string;
      media?: string;
      attributes?: Record<string, string>;
    }): void;
    get(id: string): unknown;
  };
  Panels: {
    addButton(panelId: string, button: GrapesPanelButton): void;
  };
  Commands: {
    add(commandId: string, command: GrapesEditorCommand): void;
  };
  DeviceManager: {
    add(name: string, options: { name: string; width: string }): void;
    select(name: string): void;
  };
}

export interface GrapesNamespace {
  init(config: {
    container: HTMLElement;
    height?: string;
    width?: string;
    fromElement?: boolean;
    storageManager?: false | { type?: null };
    deviceManager?: { devices?: Array<{ name: string; width: string }> };
    canvas?: { styles?: string[]; scripts?: string[] };
  }): GrapesEditor;
}

declare global {
  interface Window {
    grapesjs?: GrapesNamespace;
  }
}

export {}
