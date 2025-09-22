```mermaid
flowchart LR
  E0[Editor Canvas]:::screen --> E1[Add Block (icon: Add Block)]:::action
  E0 --> E2[Drag / Move (icon: Drag Block)]:::action
  E0 --> E3[Search (icon: Search)]:::status
  E0 --> E4[Filter (icon: Filter)]:::status

  E1 --> B1[Text Block (icon: Text Block)]:::block
  E1 --> B2[Image Block (icon: Image Block)]:::block
  E1 --> B3[Video Block (icon: Video Block)]:::block
  E1 --> B4[Code Block (icon: Code Block)]:::block

  B2 --> F1[Image File (icon: Image File)]:::file
  B3 --> F2[Video File (icon: Video File)]:::file
  B4 --> F4[Document File (icon: Document File)]:::file

  E0 --> L1[Loading / Processing (icon: Loading)]:::status
  E0 --> S1[Success / Complete (icon: Success)]:::status
  E0 --> ER1[Error (icon: Error)]:::status

  classDef screen fill:#ffffff,stroke:#cbc0ff,stroke-width:1.5px,color:#1a1a1a;
  classDef action fill:#ffffff,stroke:#5a3cf4,stroke-dasharray:4 3,stroke-width:1.5px,color:#1a1a1a;
  classDef block fill:#ffffff,stroke:#5a3cf4,stroke-width:1.5px,color:#1a1a1a;
  classDef file fill:#ffffff,stroke:#5a3cf4,stroke-width:1px,color:#1a1a1a;
  classDef status fill:#ffffff,stroke:#cbc0ff,stroke-width:1px,color:#1a1a1a;
```