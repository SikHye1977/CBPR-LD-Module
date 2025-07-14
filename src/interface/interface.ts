export interface TermDefinition {
  "@id": string;
  "@type"?: string;
  protected?: boolean;
  [key: string]: any;
}

export interface ContextEntry {
  context: any;
  termMap: Record<string, TermDefinition>;
}

export interface CBORLDState {
  strategy: "compression" | "decompression";
  contextMap: Map<string, ContextEntry>;
  keywordsMap: Map<string, number>;
  termToId: Map<string, number>;
  idToTerm?: Map<number, string>;
  nextTermId: number;
}
