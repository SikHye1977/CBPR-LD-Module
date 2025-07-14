export interface CBORLDState {
  strategy: "compression" | "decompression";
  registryEntryId: number;
  typeTable: Record<string, any>;
  termToId: Map<string, number>;
  idToTerm?: Map<number, string>;
  keywordsMap: Map<string, number>;
  contextMap: Map<string, ContextEntry>;
  nextTermId: number;
  initialActiveContext?: ActiveContext;
  typesEncodedAsBytes: Set<string>;
}

export interface ContextEntry {
  context: any;
  termMap: Record<string, TermDefinition>;
}

export interface TermDefinition {
  "@id"?: string;
  "@type"?: string;
  protected?: boolean;
  propagate?: boolean;
}

export interface ActiveContext {
  termMap: Record<string, TermDefinition>;
  typeTerms: string[];
  previousActiveContext?: ActiveContext;
}
