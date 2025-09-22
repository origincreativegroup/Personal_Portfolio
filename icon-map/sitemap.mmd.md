```mermaid
flowchart TD
  A[Navigation]:::nav --> A1[Creations (icon: Creations)]:::screen
  A --> A2[Molds (icon: Molds)]:::screen
  A --> A3[Casts (icon: Casts)]:::screen
  A --> A4[Reforgings (icon: Reforgings)]:::screen
  A --> A5[Dashboard (icon: Dashboard)]:::screen
  A --> A6[Profile (icon: Profile)]:::screen
  A --> A7[Resume Generator (icon: Resume Generator)]:::screen
  A --> A8[Analytics (icon: Analytics)]:::screen
  A --> A9[Notifications (icon: Notifications)]:::screen
  A --> A10[Settings (icon: Settings)]:::screen
  A --> A11[Admin Console (icon: Admin Console)]:::screen

  A1 --> C1[New Project (icon: New Project)]:::action
  A1 --> C2[Upload File (icon: Upload File)]:::action
  A1 --> C3[Add to Project (icon: Add to Project)]:::action
  A1 --> C4[Folder / Collections (icon: Folder)]:::action

  C2 --> F1[Image File (icon: Image File)]:::file
  C2 --> F2[Video File (icon: Video File)]:::file
  C2 --> F3[Audio File (icon: Audio File)]:::file
  C2 --> F4[Document File (icon: Document File)]:::file

  A2 --> M1[Template Library]:::screen
  M1 --> M2[Apply Template -> Project]:::action
  M1 --> M3[Template Details]:::screen

  A3 --> X1[Publish Flow]:::screen
  X1 --> X2[Select Format]:::action
  X1 --> X3[Confirm & Export]:::action

  A4 --> R1[Version History]:::screen
  R1 --> R2[Diff View]:::screen
  R1 --> R3[Restore / Fork]:::action

  A5 --> D1[Quick Actions]:::screen
  D1 --> C1
  D1 --> C2
  D1 --> A7

  A6 --> P1[View Profile]:::screen
  P1 --> T1[Free Tier (icon: Free Tier)]:::badge
  P1 --> T2[Tier 2 (icon: Tier 2)]:::badge
  P1 --> T3[Tier 3 (icon: Tier 3)]:::badge

  A7 --> RG1[Resume Builder Steps]:::screen
  RG1 --> RG2[Import from Projects]:::action
  RG1 --> RG3[Download / Export]:::action

  A8 --> AN1[Overview]:::screen
  AN1 --> AN2[Project Insights]:::screen
  AN1 --> AN3[Template Performance]:::screen

  A9 --> N1[Inbox]:::screen
  N1 --> N2[Mark Read / Resolve]:::action

  A10 --> S1[Preferences]:::screen
  A10 --> S2[Billing (icon: Subscriptions)]:::screen
  S2 --> T1
  S2 --> T2
  S2 --> T3

  A11 --> ADM1[Admin Dashboard]:::screen
  ADM1 --> ADM2[Learning Matrix (icon: Learning Matrix)]:::screen
  ADM1 --> ADM3[Subscriptions (icon: Subscriptions)]:::screen

  classDef nav fill:#ffffff,stroke:#5a3cf4,stroke-width:2px,color:#1a1a1a;
  classDef screen fill:#ffffff,stroke:#cbc0ff,stroke-width:1.5px,color:#1a1a1a;
  classDef action fill:#ffffff,stroke:#5a3cf4,stroke-dasharray: 4 3,stroke-width:1.5px,color:#1a1a1a;
  classDef file fill:#ffffff,stroke:#5a3cf4,stroke-width:1px,color:#1a1a1a;
  classDef badge fill:#ffffff,stroke:#cbc0ff,stroke-width:1px,color:#1a1a1a;
```