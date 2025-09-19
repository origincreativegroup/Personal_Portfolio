export type AwesomeGoStage = 'mature' | 'growing' | 'emerging'

export type AwesomeGoEntry = {
  name: string
  description: string
  url: string
  docsUrl?: string
  category: string
  stage: AwesomeGoStage
  stars: number
  tags: string[]
  features: string[]
  adoption?: string
}

export const awesomeGoEntries: AwesomeGoEntry[] = [
  {
    name: 'Gin',
    description:
      'High-performance HTTP web framework with a Martini-like API, strong middleware story, and excellent request binding.',
    url: 'https://github.com/gin-gonic/gin',
    docsUrl: 'https://gin-gonic.com/docs/',
    category: 'Web frameworks',
    stage: 'mature',
    stars: 72000,
    tags: ['http', 'router', 'rest', 'middleware'],
    features: [
      'Leverages net/http while optimising routing for extreme throughput',
      'First-class JSON binding and validation helpers',
      'Vibrant ecosystem of authentication, metrics, and tracing middleware',
    ],
    adoption: 'A go-to choice for latency-sensitive APIs and microservices.',
  },
  {
    name: 'Fiber',
    description:
      'Express-inspired web framework powered by Fasthttp that prioritises developer ergonomics without sacrificing speed.',
    url: 'https://github.com/gofiber/fiber',
    docsUrl: 'https://docs.gofiber.io',
    category: 'Web frameworks',
    stage: 'growing',
    stars: 32000,
    tags: ['http', 'fasthttp', 'routing', 'middleware'],
    features: [
      'Minimal boilerplate to stand up APIs and SSR applications',
      'Built-in rate limiting, caching, and WebSocket support',
      'Middleware signature mirrors popular Node.js frameworks to ease migration',
    ],
    adoption: 'Adopted by teams modernising Express/Koa services into Go.',
  },
  {
    name: 'Chi',
    description:
      'Lightweight, idiomatic router that emphasises composable middlewares and modular HTTP services.',
    url: 'https://github.com/go-chi/chi',
    docsUrl: 'https://go-chi.io',
    category: 'Web frameworks',
    stage: 'mature',
    stars: 15000,
    tags: ['router', 'http', 'middleware'],
    features: [
      'Tiny core with fully idiomatic net/http handlers',
      'Powerful route mounting and grouping for large services',
      'Ships with middlewares for request logging, timeouts, CSRF, and more',
    ],
    adoption: 'Favoured for standard-library purity in enterprise APIs.',
  },
  {
    name: 'Buffalo',
    description:
      'Rapid web development toolkit that bundles routing, ORM, front-end build tooling, and generators.',
    url: 'https://github.com/gobuffalo/buffalo',
    docsUrl: 'https://gobuffalo.io/en/docs',
    category: 'Web frameworks',
    stage: 'growing',
    stars: 7900,
    tags: ['full-stack', 'scaffolding', 'generators'],
    features: [
      '`buffalo new` scaffolds opinionated services with database + front-end wiring',
      'Hot reloading via `buffalo dev` accelerates feedback loops',
      'Pluggable pop ORM and task runner streamline end-to-end delivery',
    ],
    adoption: 'Ideal for teams wanting Rails-like productivity in Go.',
  },
  {
    name: 'Cobra',
    description:
      'Commander style CLI framework used by Kubernetes, Helm, Hugo, and countless internal toolchains.',
    url: 'https://github.com/spf13/cobra',
    docsUrl: 'https://cobra.dev/',
    category: 'CLI tooling',
    stage: 'mature',
    stars: 36000,
    tags: ['cli', 'commands', 'flags'],
    features: [
      'Declarative command trees with automatic help and docs generation',
      'POSIX-compliant flag parsing with viper integration',
      'Provides shell completion, man pages, and templated scaffolding',
    ],
    adoption: 'The de facto framework for complex enterprise CLIs.',
  },
  {
    name: 'urfave/cli',
    description:
      'Simple yet powerful CLI framework focusing on rapid authoring of single-binary tools and utilities.',
    url: 'https://github.com/urfave/cli',
    category: 'CLI tooling',
    stage: 'mature',
    stars: 21000,
    tags: ['cli', 'flags', 'productivity'],
    features: [
      'Context-aware command execution keeps configuration tidy',
      'Supports rich flag types, subcommands, and before/after hooks',
      'Tiny binary footprint makes it perfect for serverless and container tooling',
    ],
    adoption: 'Excellent for developer-experience focused automation scripts.',
  },
  {
    name: 'Viper',
    description:
      'Configuration system that reads from files, environment variables, flags, and remote key/value stores.',
    url: 'https://github.com/spf13/viper',
    category: 'Configuration & settings',
    stage: 'mature',
    stars: 25000,
    tags: ['config', 'environment', 'flags'],
    features: [
      'Supports JSON, YAML, TOML, HCL, envfile, and Java properties formats',
      'Live watching and reloading for zero-downtime config changes',
      'Seamless binding to Cobra flags for unified CLIs and services',
    ],
    adoption: 'Powers configuration layers in countless SaaS platforms.',
  },
  {
    name: 'Koanf',
    description:
      'Modular configuration loader that merges multiple providers with minimal dependencies.',
    url: 'https://github.com/knadh/koanf',
    category: 'Configuration & settings',
    stage: 'growing',
    stars: 2100,
    tags: ['config', 'modular', 'providers'],
    features: [
      'Providers for files, environment variables, SSM, Consul, Vault, and more',
      'Lightweight with zero reflection; works cleanly in serverless contexts',
      'Schema validation and default handling keep configs robust',
    ],
    adoption: 'Popular with platform teams that need pluggable sources.',
  },
  {
    name: 'GORM',
    description:
      'Full-featured ORM with associations, hooks, transactions, and schema migrations.',
    url: 'https://github.com/go-gorm/gorm',
    docsUrl: 'https://gorm.io',
    category: 'Database & ORM',
    stage: 'mature',
    stars: 34000,
    tags: ['orm', 'database', 'sql'],
    features: [
      'Chainable query builder with eager loading and polymorphic associations',
      'Auto migration keeps schemas in sync across environments',
      'Plugin ecosystem for soft delete, audit trails, Prometheus metrics, and more',
    ],
    adoption: 'Trusted in production across fintech, SaaS, and gaming products.',
  },
  {
    name: 'Ent',
    description:
      'Entity framework from Meta that generates type-safe Go code from a declarative schema.',
    url: 'https://github.com/ent/ent',
    docsUrl: 'https://entgo.io',
    category: 'Database & ORM',
    stage: 'growing',
    stars: 14000,
    tags: ['orm', 'codegen', 'graph'],
    features: [
      'Schema-as-code approach unlocks rich editor tooling and refactoring safety',
      'Edge definition models complex graph relationships with ease',
      'Integrations for GraphQL, gRPC, SQL/NoSQL, and privacy policies',
    ],
    adoption: 'Great for domain-driven services needing strict data contracts.',
  },
  {
    name: 'sqlc',
    description:
      'Generates type-safe Go code from raw SQL queries while preserving performance and control.',
    url: 'https://github.com/sqlc-dev/sqlc',
    docsUrl: 'https://docs.sqlc.dev',
    category: 'SQL tooling',
    stage: 'growing',
    stars: 14000,
    tags: ['sql', 'codegen', 'database'],
    features: [
      'Author SQL once and get strongly typed Go methods for queries and commands',
      'Supports PostgreSQL, MySQL, SQLite, SQL Server, and planetscale flavours',
      'Integrates with migrations via Atlas, Flyway, or Goose for end-to-end workflows',
    ],
    adoption: 'Ideal when teams want SQL-first ergonomics with compile-time safety.',
  },
  {
    name: 'Atlas',
    description:
      'Modern database schema tooling with declarative migrations, linting, and drift detection.',
    url: 'https://github.com/ariga/atlas',
    docsUrl: 'https://atlasgo.io',
    category: 'SQL tooling',
    stage: 'growing',
    stars: 7000,
    tags: ['migrations', 'schema', 'database'],
    features: [
      'Visual diffing and linting prevent risky schema changes before rollout',
      'Database driver support spans Postgres, MySQL, MariaDB, SQLite, and SQL Server',
      'Works hand-in-hand with sqlc and Prisma-style workflows',
    ],
    adoption: 'Adopted by data-heavy teams enforcing rigorous migration gates.',
  },
  {
    name: 'Testify',
    description:
      'Battle-tested testing toolkit providing assertions, suites, and mocking utilities.',
    url: 'https://github.com/stretchr/testify',
    category: 'Testing & QA',
    stage: 'mature',
    stars: 21000,
    tags: ['testing', 'assertions', 'mocking'],
    features: [
      'Rich assertion library covering errors, JSON, time, and HTTP',
      'Suite runner keeps setup/teardown logic organised',
      'Mock package simplifies behavioural testing with expectations',
    ],
    adoption: 'Default choice for unit tests in the majority of Go repos.',
  },
  {
    name: 'Ginkgo',
    description:
      'BDD-style testing framework powering Kubernetes, CloudFoundry, and distributed systems suites.',
    url: 'https://github.com/onsi/ginkgo',
    docsUrl: 'https://onsi.github.io/ginkgo/',
    category: 'Testing & QA',
    stage: 'mature',
    stars: 7500,
    tags: ['testing', 'bdd', 'parallel'],
    features: [
      'Expressive DSL for acceptance and integration test scenarios',
      'Built-in parallelism for speeding up large suites in CI',
      'Tight integration with Gomega matchers for readable expectations',
    ],
    adoption: 'Great for large teams writing narrative-style acceptance tests.',
  },
  {
    name: 'GoMock',
    description:
      'Official Go mocking framework from Google using interface generation for strict type checking.',
    url: 'https://github.com/golang/mock',
    category: 'Testing & QA',
    stage: 'mature',
    stars: 9700,
    tags: ['testing', 'mocking', 'codegen'],
    features: [
      'Generates mocks directly from Go interfaces for zero runtime reflection',
      'Expectation API keeps behaviour-driven tests concise',
      'Seamless integration with go test and testify assertions',
    ],
    adoption: 'Used heavily in cloud infrastructure and SDK teams.',
  },
  {
    name: 'Zap',
    description:
      'Blazing fast, structured logging from Uber with zero-allocation logging paths.',
    url: 'https://github.com/uber-go/zap',
    docsUrl: 'https://pkg.go.dev/go.uber.org/zap',
    category: 'Observability & logging',
    stage: 'mature',
    stars: 20000,
    tags: ['logging', 'structured', 'performance'],
    features: [
      'Sugared and structured loggers suit prototypes and production equally',
      'Sampling, level enablers, and context propagation baked in',
      'Integrations for OpenTelemetry, gRPC interceptors, and HTTP middleware',
    ],
    adoption: 'High-throughput services rely on zap for dependable logging.',
  },
  {
    name: 'Zerolog',
    description:
      'Zero-allocation JSON logger designed for low-latency services and embedded systems.',
    url: 'https://github.com/rs/zerolog',
    category: 'Observability & logging',
    stage: 'mature',
    stars: 9000,
    tags: ['logging', 'structured', 'json'],
    features: [
      'JSON output with deterministic field ordering and minimal size',
      'Context enrichment APIs for request-scoped metadata',
      'Extensible writers allow piping logs to Kafka, Loki, or stdout',
    ],
    adoption: 'Popular for edge workloads and telemetry pipelines.',
  },
  {
    name: 'Prometheus Client',
    description:
      'Official Prometheus instrumentation library exposing metrics, histograms, and exemplars.',
    url: 'https://github.com/prometheus/client_golang',
    category: 'Observability & logging',
    stage: 'mature',
    stars: 5200,
    tags: ['metrics', 'observability', 'monitoring'],
    features: [
      'Native counters, gauges, histograms, and summaries for instrumentation',
      'Automated collection of Go runtime metrics',
      'Integrates smoothly with Grafana, Alertmanager, and OpenTelemetry bridges',
    ],
    adoption: 'Standard metrics backbone for cloud-native Go services.',
  },
  {
    name: 'Go kit',
    description:
      'Toolkit for microservices that emphasises clean architecture, transports, and instrumentation.',
    url: 'https://github.com/go-kit/kit',
    category: 'Microservices & RPC',
    stage: 'mature',
    stars: 25000,
    tags: ['microservices', 'transport', 'toolkit'],
    features: [
      'Opinionated service abstraction with pluggable transports (HTTP, gRPC, NATS)',
      'Instrumentation adapters for Prometheus, OpenTracing, Zipkin, and StatsD',
      'Middleware stack for logging, rate limiting, circuit breaking, and more',
    ],
    adoption: 'Designed for large-scale distributed systems with strict SLAs.',
  },
  {
    name: 'gRPC-Go',
    description:
      'Official Go implementation of gRPC supporting HTTP/2, streaming, and contract-first APIs.',
    url: 'https://github.com/grpc/grpc-go',
    category: 'Microservices & RPC',
    stage: 'mature',
    stars: 20000,
    tags: ['grpc', 'rpc', 'microservices'],
    features: [
      'Bidirectional streaming with flow control and deadlines',
      'Protocol buffer code generation for clients and servers',
      'Advanced load balancing, health checking, and interceptors',
    ],
    adoption: 'Backbone for service-to-service communication at Google-scale.',
  },
  {
    name: 'Connect',
    description:
      'Protocol-agnostic toolkit from Buf enabling gRPC, gRPC-Web, and JSON over HTTP with one implementation.',
    url: 'https://github.com/connectrpc/connect-go',
    category: 'Microservices & RPC',
    stage: 'growing',
    stars: 4100,
    tags: ['rpc', 'grpc', 'http'],
    features: [
      'Generates idiomatic clients and servers for gRPC and Connect protocols',
      'Built-in interceptors for observability, retries, and authentication',
      'Plays nicely with Envoy, API gateways, and browser-based RPC consumers',
    ],
    adoption: 'Great for teams standardising APIs across microservices and web clients.',
  },
]

