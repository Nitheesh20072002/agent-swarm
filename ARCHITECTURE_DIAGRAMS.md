
# AI Agent Swarm - Visual Architecture Diagrams

This document contains visual Mermaid diagrams for the AI Agent Swarm system architecture.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "User Layer"
        Mobile[Mobile App<br/>iOS/Android]
        Desktop[Desktop App<br/>Electron]
        Web[Web App<br/>Next.js]
    end

    subgraph "API Layer"
        Gateway[API Gateway<br/>WebSocket + REST]
        Auth[Auth Service<br/>JWT + OAuth]
        Notif[Notification Service<br/>FCM + Email]
    end

    subgraph "Core Services"
        Orchestrator[Agent Orchestrator<br/>Task Routing]
        ConvManager[Conversation Manager<br/>State & History]
        TaskQueue[Task Queue<br/>Redis/Bull]
    end

    subgraph "Data Layer"
        Postgres[(PostgreSQL<br/>Conversations)]
        Redis[(Redis<br/>Cache + Pub/Sub)]
        S3[(S3<br/>File Storage)]
        Vector[(Vector DB<br/>Pinecone)]
    end

    subgraph "Agent Runtime Layer"
        Agent1[Agent 1: Coder<br/>c5.xlarge VM]
        Agent2[Agent 2: Designer<br/>t3.xlarge VM]
        Agent3[Agent 3: Manager<br/>t3.medium VM]
    end

    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4]
        Anthropic[Anthropic API<br/>Claude]
        GitHub[GitHub API]
        AWS[AWS Services]
    end

    Mobile --> Gateway
    Desktop --> Gateway
    Web --> Gateway
    
    Gateway --> Auth
    Gateway --> Notif
    Gateway --> Orchestrator
    
    Orchestrator --> ConvManager
    Orchestrator --> TaskQueue
    
    ConvManager --> Postgres
    ConvManager --> Redis
    ConvManager --> Vector
    
    TaskQueue --> Agent1
    TaskQueue --> Agent2
    TaskQueue --> Agent3
    
    Agent1 --> OpenAI
    Agent2 --> Anthropic
    Agent3 --> OpenAI
    
    Agent1 --> GitHub
    Agent1 --> AWS
    Agent2 --> S3
    
    Notif --> Mobile
    Notif --> Desktop

    style Mobile fill:#4CAF50
    style Desktop fill:#4CAF50
    style Web fill:#4CAF50
    style Agent1 fill:#2196F3
    style Agent2 fill:#2196F3
    style Agent3 fill:#2196F3
    style Gateway fill:#FF9800
    style Orchestrator fill:#FF9800
```

---

## 2. Agent Internal Architecture

```mermaid
graph TB
    subgraph "Agent Instance"
        Config[Agent Configuration<br/>Name, Role, Permissions]
        
        subgraph "Core Components"
            ConvEngine[Conversation Engine<br/>Message Handler]
            StateMan[State Manager<br/>Context + Memory]
            ExecEnv[Execution Environment<br/>Task Executor]
            CommLayer[Communication Layer<br/>WebSocket Client]
        end
        
        subgraph "Execution Tools"
            Bash[Bash Executor]
            FileOps[File Operations]
            GitClient[Git Client]
            HttpClient[HTTP Client]
            Docker[Docker Manager]
        end
        
        subgraph "LLM Integration"
            LLMClient[LLM Client]
            PromptBuilder[Prompt Builder]
            ResponseParser[Response Parser]
        end
    end
    
    Config --> ConvEngine
    Config --> ExecEnv
    Config --> CommLayer
    
    ConvEngine --> StateMan
    ConvEngine --> LLMClient
    
    LLMClient --> PromptBuilder
    LLMClient --> ResponseParser
    
    ExecEnv --> Bash
    ExecEnv --> FileOps
    ExecEnv --> GitClient
    ExecEnv --> HttpClient
    ExecEnv --> Docker
    
    CommLayer --> Gateway[API Gateway]
    StateMan --> Redis[(Redis Cache)]
    
    ResponseParser --> ExecEnv
    ExecEnv --> CommLayer

    style Config fill:#FFC107
    style ConvEngine fill:#2196F3
    style ExecEnv fill:#4CAF50
    style LLMClient fill:#9C27B0
```

---

## 3. Conversation Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant MobileApp
    participant Gateway
    participant Orchestrator
    participant Agent
    participant LLM
    participant VM
    participant Notification

    User->>MobileApp: Send message: "Create login page"
    MobileApp->>Gateway: WebSocket message
    Gateway->>Orchestrator: Route message
    
    Orchestrator->>Agent: Assign task
    Agent->>Notification: Notify: Task started
    Notification->>MobileApp: Push notification
    MobileApp->>User: "Alice started working"
    
    Agent->>LLM: Generate implementation plan
    LLM-->>Agent: Return plan steps
    
    Agent->>Gateway: Status: Planning complete
    Gateway->>MobileApp: Update UI
    
    loop For each step
        Agent->>VM: Execute command
        VM-->>Agent: Command result
        Agent->>Gateway: Progress update
        Gateway->>MobileApp: Show progress
    end
    
    Agent->>VM: Git commit + push
    VM-->>Agent: Success
    
    Agent->>Gateway: Task completed
    Gateway->>MobileApp: Final result
    Agent->>Notification: Notify: Task completed
    Notification->>MobileApp: Push notification
    MobileApp->>User: "Alice completed the task"
```

---

## 4. Multi-Agent Collaboration Flow

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant CoderAgent
    participant DesignerAgent
    participant TesterAgent
    participant Notification

    User->>Orchestrator: "Build complete user dashboard"
    
    Orchestrator->>Orchestrator: Analyze & decompose task
    
    Note over Orchestrator: Task requires:<br/>- UI Design<br/>- Frontend Code<br/>- Testing
    
    Orchestrator->>DesignerAgent: Create dashboard mockup
    Orchestrator->>CoderAgent: Standby for design
    Orchestrator->>TesterAgent: Prepare test plan
    
    DesignerAgent->>DesignerAgent: Generate design
    DesignerAgent->>Orchestrator: Design complete
    Orchestrator->>CoderAgent: Design ready + handoff
    
    CoderAgent->>DesignerAgent: Request design assets (P2P)
    DesignerAgent-->>CoderAgent: Send assets
    
    CoderAgent->>CoderAgent: Implement dashboard
    CoderAgent->>Orchestrator: Implementation complete
    
    Orchestrator->>TesterAgent: Code ready for testing
    TesterAgent->>CoderAgent: Request test environment (P2P)
    CoderAgent-->>TesterAgent: Provide localhost URL
    
    TesterAgent->>TesterAgent: Run automated tests
    TesterAgent->>Orchestrator: Tests passed
    
    Orchestrator->>Notification: All tasks completed
    Notification->>User: "Dashboard is ready!"
```

---

## 5. Agent State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Listening: Agent starts
    Listening --> Planning: Task received
    
    Planning --> Executing: Plan approved
    Planning --> WaitingInput: Need clarification
    Planning --> Idle: Task cancelled
    
    WaitingInput --> Planning: Input received
    WaitingInput --> Idle: Timeout
    
    Executing --> Executing: Step completed
    Executing --> Blocked: External dependency
    Executing --> Failed: Error occurred
    Executing --> Completed: All steps done
    
    Blocked --> Executing: Dependency resolved
    Blocked --> Failed: Timeout
    
    Failed --> Planning: Retry requested
    Failed --> Idle: Give up
    
    Completed --> Idle: Return to ready
    
    note right of Planning
        Agent creates execution plan
        using LLM
    end note
    
    note right of Executing
        Agent runs commands in VM,
        sends progress updates
    end note
    
    note right of Blocked
        Waiting for user input or
        another agent
    end note
```

---

## 6. Data Flow Architecture

```mermaid
graph LR
    subgraph "User Interaction"
        UI[User Interface]
    end
    
    subgraph "Real-time Layer"
        WS[WebSocket Server]
        SSE[Server-Sent Events]
    end
    
    subgraph "Processing Layer"
        API[REST API]
        Queue[Task Queue]
        Events[Event Bus]
    end
    
    subgraph "Storage Layer"
        Hot[(Redis<br/>Hot Data)]
        Warm[(PostgreSQL<br/>Warm Data)]
        Cold[(S3<br/>Cold Archive)]
        Vector[(Vector DB<br/>Semantic Search)]
    end
    
    subgraph "Agent Layer"
        Agents[Agent VMs]
    end
    
    UI -->|Send message| WS
    WS -->|Route| API
    API -->|Enqueue| Queue
    Queue -->|Assign| Agents
    
    Agents -->|Progress| Events
    Events -->|Publish| WS
    WS -->|Push| UI
    
    Agents -->|Update| Hot
    Hot -->|Persist| Warm
    Warm -->|Archive| Cold
    
    API -->|Search| Vector
    Vector -->|Results| API
    
    API -->|Read| Hot
    Hot -->|Cache miss| Warm
    Warm -->|Old data| Cold

    style UI fill:#4CAF50
    style Agents fill:#2196F3
    style Hot fill:#FF5722
    style Warm fill:#FF9800
    style Cold fill:#607D8B
```

---

## 7. Security Architecture

```mermaid
graph TB
    subgraph "External"
        Client[Client Applications]
    end
    
    subgraph "Security Layers"
        subgraph "Layer 1: Network Security"
            ALB[Application Load Balancer<br/>TLS/SSL Termination]
            WAF[Web Application Firewall<br/>DDoS Protection]
        end
        
        subgraph "Layer 2: Authentication"
            Auth[Auth Service<br/>JWT + OAuth2]
            MFA[Multi-Factor Auth]
        end
        
        subgraph "Layer 3: Authorization"
            RBAC[Role-Based Access Control]
            PermissionEngine[Permission Engine]
        end
        
        subgraph "Layer 4: Data Security"
            Encryption[Data Encryption<br/>AES-256]
            KeyManager[Key Management<br/>AWS KMS]
        end
        
        subgraph "Layer 5: VM Isolation"
            NetworkIsolation[Network Isolation<br/>Private Subnets]
            ResourceLimits[Resource Limits<br/>CPU/Memory Quotas]
        end
    end
    
    subgraph "Protected Resources"
        API[API Services]
        Agents[Agent VMs]
        Data[(Databases)]
    end
    
    Client --> ALB
    ALB --> WAF
    WAF --> Auth
    Auth --> MFA
    MFA --> RBAC
    RBAC --> PermissionEngine
    PermissionEngine --> API
    
    API --> Encryption
    Encryption --> KeyManager
    KeyManager --> Data
    
    API --> NetworkIsolation
    NetworkIsolation --> ResourceLimits
    ResourceLimits --> Agents
    
    Agents --> Data

    style Client fill:#4CAF50
    style ALB fill:#FF9800
    style Auth fill:#2196F3
    style Encryption fill:#9C27B0
    style Agents fill:#FF5722
```

---

## 8. Deployment Architecture (AWS)

```mermaid
graph TB
    subgraph "Internet"
        Users[Users]
    end
    
    subgraph "AWS Cloud - VPC 10.0.0.0/16"
        subgraph "Public Subnet 10.0.1.0/24"
            ALB[Application<br/>Load Balancer]
            NAT[NAT Gateway]
        end
        
        subgraph "Private Subnet 1 - App 10.0.10.0/24"
            ASG[Auto Scaling Group<br/>API Gateway Instances]
            Gateway1[API Gateway 1<br/>t3.medium]
            Gateway2[API Gateway 2<br/>t3.medium]
        end
        
        subgraph "Private Subnet 2 - Data 10.0.20.0/24"
            RDS[(PostgreSQL<br/>db.t3.medium<br/>Multi-AZ)]
            ElastiCache[(Redis Cluster<br/>r6g.large<br/>2 nodes)]
        end
        
        subgraph "Private Subnet 3 - Agents 10.0.30.0/24"
            Agent1[Agent 1 VM<br/>c5.2xlarge<br/>Senior Dev]
            Agent2[Agent 2 VM<br/>t3.xlarge<br/>Designer]
            Agent3[Agent 3 VM<br/>t3.medium<br/>Marketing]
        end
        
        subgraph "Services"
            S3[(S3 Buckets<br/>File Storage)]
            CloudWatch[CloudWatch<br/>Monitoring]
            KMS[AWS KMS<br/>Key Management]
            SNS[SNS<br/>Notifications]
        end
    end
    
    Users --> ALB
    ALB --> Gateway1
    ALB --> Gateway2
    
    Gateway1 --> RDS
    Gateway1 --> ElastiCache
    Gateway2 --> RDS
    Gateway2 --> ElastiCache
    
    Gateway1 --> Agent1
    Gateway1 --> Agent2
    Gateway1 --> Agent3
    Gateway2 --> Agent1
    Gateway2 --> Agent2
    Gateway2 --> Agent3
    
    Agent1 --> NAT
    Agent2 --> NAT
    Agent3 --> NAT
    NAT --> Users
    
    Agent1 --> S3
    Agent2 --> S3
    Agent3 --> S3
    
    Gateway1 --> CloudWatch
    Gateway2 --> CloudWatch
    Agent1 --> CloudWatch
    Agent2 --> CloudWatch
    Agent3 --> CloudWatch
    
    RDS --> KMS
    ElastiCache --> KMS
    
    Gateway1 --> SNS
    Gateway2 --> SNS

    style Users fill:#4CAF50
    style ALB fill:#FF9800
    style ASG fill:#2196F3
    style Agent1 fill:#E91E63
    style Agent2 fill:#E91E63
    style Agent3 fill:#E91E63
```

---

## 9. Notification System Flow

```mermaid
graph TB
    subgraph "Event Sources"
        Agent[Agent Events]
        Task[Task Events]
        System[System Events]
    end
    
    subgraph "Notification Service"
        EventListener[Event Listener<br/>Subscribe to events]
        Router[Notification Router<br/>Rules + Preferences]
        
        subgraph "Channels"
            Push[Push Service<br/>FCM/APNS]
            Email[Email Service<br/>SendGrid]
            SMS[SMS Service<br/>Twilio]
            InApp[In-App Storage<br/>PostgreSQL]
        end
        
        Queue[Notification Queue<br/>Redis]
        Scheduler[Scheduler<br/>Delivery timing]
    end
    
    subgraph "User Devices"
        Mobile[Mobile App]
        Desktop[Desktop App]
        Web[Web App]
    end
    
    Agent --> EventListener
    Task --> EventListener
    System --> EventListener
    
    EventListener --> Router
    Router --> Queue
    Queue --> Scheduler
    
    Scheduler --> Push
    Scheduler --> Email
    Scheduler --> SMS
    Scheduler --> InApp
    
    Push --> Mobile
    Push --> Desktop
    InApp --> Web
    
    Mobile -.Acknowledge.-> Router
    Desktop -.Acknowledge.-> Router

    style EventListener fill:#2196F3
    style Router fill:#FF9800
    style Push fill:#4CAF50
    style Mobile fill:#9C27B0
```

---

## 10. Agent Lifecycle Management

```mermaid
graph LR
    subgraph "Creation"
        UserInput[User Input<br/>Config + Credentials]
        Validation[Validate Config]
        Provision[Provision VM]
    end
    
    subgraph "Initialization"
        Install[Install Dependencies]
        Configure[Configure Agent]
        TestConnection[Test Connections]
    end
    
    subgraph "Active State"
        Running[Agent Running]
        Monitoring[Health Monitoring]
        Updates[Auto Updates]
    end
    
    subgraph "Maintenance"
        Scale[Scale Resources]
        Backup[Backup State]
        Rotate[Rotate Credentials]
    end
    
    subgraph "Termination"
        Drain[Drain Tasks]
        Archive[Archive Data]
        Destroy[Destroy VM]
    end
    
    UserInput --> Validation
    Validation --> Provision
    Provision --> Install
    
    Install --> Configure
    Configure --> TestConnection
    TestConnection --> Running
    
    Running --> Monitoring
    Monitoring --> Running
    Monitoring --> Updates
    Updates --> Running
    
    Running --> Scale
    Scale --> Running
    Running --> Backup
    Backup --> Running
    Running --> Rotate
    Rotate --> Running
    
    Running --> Drain
    Drain --> Archive
    Archive --> Destroy

    style UserInput fill:#4CAF50
    style Running fill:#2196F3
    style Monitoring fill:#FF9800
    style Destroy fill:#F44336
```

---

## 11. Cost Optimization Flow

```mermaid
graph TB
    subgraph "Monitoring"
        CloudWatch[CloudWatch Metrics]
        CostExplorer[AWS Cost Explorer]
    end
    
    subgraph "Analysis"
        Analyzer[Cost Analyzer]
        ResourceUsage[Resource Usage Tracker]
        Inefficiency[Inefficiency Detector]
    end
    
    subgraph "Optimization Actions"
        RightSize[Right-size VMs]
        ScheduleStop[Schedule Stop/Start]
        Reserved[Purchase Reserved Instances]
        Spot[Use Spot Instances]
    end
    
    subgraph "Results"
        Report[Cost Report]
        Savings[Monthly Savings]
        Recommendations[Recommendations]
    end
    
    CloudWatch --> Analyzer
    CostExplorer --> Analyzer
    
    Analyzer --> ResourceUsage
    Analyzer --> Inefficiency
    
    ResourceUsage --> RightSize
    Inefficiency --> ScheduleStop
    Inefficiency --> Reserved
    Inefficiency --> Spot
    
    RightSize --> Report
    ScheduleStop --> Report
    Reserved --> Report
    Spot --> Report
    
    Report --> Savings
    Report --> Recommendations

    style Analyzer fill:#2196F3
    style Savings fill:#4CAF50
```

---

## Summary

These diagrams provide visual representations of:

1. **System Architecture** - Overall component organization
2. **Agent Internals** - How individual agents work
3. **Conversation Flow** - Message handling sequence
4. **Multi-Agent Collaboration** - How agents work together
5. **State Management** - Agent state transitions
6. **Data Flow** - How data moves through the system
7. **Security Layers** - Security implementation
8. **AWS Deployment** - Infrastructure layout
9. **Notification System** - How users stay informed
10. **Lifecycle Management** - Agent creation to destruction
11. **Cost Optimization** - Managing expenses

These diagrams complement the detailed architecture document and provide a quick visual reference for understanding the system design.
