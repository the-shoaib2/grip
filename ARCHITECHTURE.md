# Grip Tool Architecture Diagram

This diagram visualizes the optimized architecture described for the Grip Tool, emphasizing context-aware selection, patch generation, and Git integration.

```mermaid
flowchart TD
    %% Define styles
    classDef user fill:#f9f,stroke:#333,stroke-width:2px;
    classDef extension fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef server fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef fs fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    
    U((User)):::user

    subgraph GripTool ["Grip Tool (Browser Extension)"]
        UI[UI Overlay / Input]:::extension
        SM[Source Mapper]:::extension
        CB[Context Builder]:::extension
        Client[WebSocket / HTTP Client]:::extension
    end

    subgraph Backend ["Context Tracker & AI Service"]
        CT[Context Tracker]:::server
        AI[AI Agent]:::server
        PG[Patch Generator]:::server
        PV[Patch Validator]:::server
        CE[Code Engine]:::server
    end

    subgraph Storage ["File System & Git"]
        FS[(Raw Source Files)]:::fs
        GIT[(Git Revision)]:::fs
    end

    U -->|1. Selects DOM Element\n2. Inputs Instruction| UI
    UI -->|DOM Node| SM
    SM -->|File Location, Line Range,\nComponent Info| CB
    CB -->|Constructs JSON Payload| Client
    Client -->|HTTP POST / WebSocket\nSends Context & Prompt| CT

    CT -->|Forwards Context| AI
    AI -->|Generates Patch| PG
    PG -->|Sends Patch| PV
    
    PV -- Valid Patch --> CE
    PV -- Invalid Patch --> Error[Error Handling]
    Error -.->|Alert User| Client
    
    CE -->|Applies Diff| FS
    CE -->|Creates Commit| GIT
    
    GIT -.->|Rollback (if needed)| CE
    
    CE -->|Success Event| CT
    CT -->|Status Update| Client
    
    FS -->|Triggers| HMR[Live Reload / HMR]
    HMR -->|Updates Component| UI
```

### Flow Breakdown
1. **User Interaction**: User selects a DOM element and provides a prompt (e.g., "Change this button color to blue").
2. **Context Extraction**: The Grip Tool's Source Mapper finds the exact file and line numbers. The Context Builder prepares a precise JSON payload without needing to scan the whole project.
3. **AI Processing**: The payload is sent to the AI Agent via the Context Tracker. The AI only looks at the provided context, generating a specific code patch.
4. **Validation & Application**: The Patch Validator checks the patch. If valid, the Code Engine applies it directly to the source file.
5. **Git Revision**: A Git commit is automatically created for traceability and easy rollback.
6. **Live Update**: The system (via Vite/Webpack) automatically hot-reloads the specific component in the browser without a full page refresh.
