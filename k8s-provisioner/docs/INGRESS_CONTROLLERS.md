# Kubernetes Ingress Controllers: Nginx vs Traefik vs HAProxy

> A comprehensive guide to understanding ingress controller architecture, traffic flow, and choosing the right one for your cluster.

---

## Table of Contents

- [What is an Ingress Controller?](#what-is-an-ingress-controller)
- [Traffic Flow Architecture](#traffic-flow-architecture)
- [Nginx Ingress Controller](#nginx-ingress-controller)
- [Traefik Ingress Controller](#traefik-ingress-controller)
- [HAProxy Ingress Controller](#haproxy-ingress-controller)
- [Transparency Mode vs Blocking Mode — The Truth](#transparency-mode-vs-blocking-mode--the-truth)
- [Side-by-Side Comparison](#side-by-side-comparison)
- [When to Use Which](#when-to-use-which)

---

## What is an Ingress Controller?

An Ingress Controller is a specialized Kubernetes controller that implements the rules defined in `Ingress` resources. It acts as a **reverse proxy and load balancer** at the edge of your cluster, routing external HTTP/HTTPS traffic to internal Services and Pods.

Kubernetes does **not** ship with a built-in ingress controller. You must deploy one (Nginx, Traefik, HAProxy, etc.) for `Ingress` resources to have any effect.

### Key Kubernetes Resources Involved

| Resource | Role |
|----------|------|
| **Ingress** | Declarative rules (host, path, TLS) defining how external traffic maps to Services |
| **IngressClass** | Specifies which ingress controller handles a given Ingress |
| **Service** | Exposes Pods internally; the ingress controller routes to Service endpoints |
| **Endpoints / EndpointSlice** | Actual Pod IP:port pairs backing a Service |
| **Ingress Controller Pod** | The running reverse proxy + controller logic |

---

## Traffic Flow Architecture

```
                        TRAFFIC FLOW
                        ============

    [External Client / Browser]
              |
              | (HTTP/HTTPS request)
              v
    +----------------------------+
    |   Cloud Load Balancer /    |   <-- L4 (TCP/UDP) load balancer
    |   NodePort / HostNetwork   |       via Service type=LoadBalancer
    +----------------------------+
              |
              v
    +----------------------------+
    |   INGRESS CONTROLLER POD   |   <-- Deployment or DaemonSet
    |                            |
    |  +-----------------------+ |
    |  | Reverse Proxy Engine  | |   <-- Nginx / Traefik / HAProxy
    |  | (L7 routing, TLS,    | |
    |  |  path matching)      | |
    |  +-----------------------+ |
    |  | Controller Loop       | |   <-- Watches K8s API for
    |  | (Ingress, Service,   | |       resource changes
    |  |  Endpoints)          | |
    |  +-----------------------+ |
    +----------------------------+
              |
              | (routes by host/path rules)
              v
    +----------------------------+
    |   ClusterIP Service        |   <-- Most controllers bypass
    |   (my-app:80)             |       the Service VIP and route
    +----------------------------+       directly to Pod IPs
              |
              v
    +----------------------------+
    |   Pod(s)                   |   <-- Your application containers
    |   10.244.1.5:8080          |
    |   10.244.2.7:8080          |
    +----------------------------+
```

> **Note:** Most production ingress controllers resolve Service endpoints and route traffic **directly to Pod IPs**, bypassing `kube-proxy` iptables/IPVS rules for better load balancing.

---

## Nginx Ingress Controller

### Overview

| Property | Value |
|----------|-------|
| **Language** | C (Nginx) + Go (Controller) + Lua (dynamic endpoints) |
| **Process Model** | Master + Worker processes (multi-process) |
| **Config Model** | File-based (`nginx.conf`) with reload via `SIGHUP` |
| **Project** | `kubernetes/ingress-nginx` (community) — **retiring March 2026** |
| **Alt Project** | `nginxinc/kubernetes-ingress` (F5/NGINX Inc.) — actively maintained |

### Internal Architecture

```
    +--------------------------------------------------+
    |           NGINX INGRESS CONTROLLER POD            |
    |                                                   |
    |  +---------------------------------------------+ |
    |  |        Go-based Controller Process           | |
    |  |                                              | |
    |  |  +----------+  +----------+  +------------+ | |
    |  |  | Informer |  | Informer |  | Informer   | | |
    |  |  | (Ingress)|  | (Service)|  | (Endpoints)| | |
    |  |  +----+-----+  +----+-----+  +-----+------+ | |
    |  |       |              |              |         | |
    |  |       v              v              v         | |
    |  |  +----------------------------------+         | |
    |  |  |    Internal Object Store (cache) |         | |
    |  |  +----------------+-----------------+         | |
    |  |                   |                           | |
    |  |                   v                           | |
    |  |  +----------------------------------+         | |
    |  |  |   Config Generator (Go template) |         | |
    |  |  |   Generates nginx.conf           |         | |
    |  |  +----------------+-----------------+         | |
    |  +---------------------------------------------+ |
    |                      |                            |
    |         +------------+------------+               |
    |         |                         |               |
    |         v (structural change)     v (endpoints    |
    |                                     only change)  |
    |  +------------------+   +---------------------+   |
    |  | Write nginx.conf |   | HTTP POST to Lua    |   |
    |  | + SIGHUP reload  |   | handler (no reload) |   |
    |  +--------+---------+   +---------+-----------+   |
    |           |                       |               |
    |           v                       v               |
    |  +-------------------------------------------+    |
    |  |          NGINX Master Process             |    |
    |  |  +----------------+  +----------------+   |    |
    |  |  | Worker Process |  | Worker Process |   |    |
    |  |  | (Lua modules)  |  | (Lua modules)  |   |    |
    |  |  +----------------+  +----------------+   |    |
    |  +-------------------------------------------+    |
    +--------------------------------------------------+
```

### How Config Reload Works

The controller loop watches for changes and decides what to do:

| Change Type | Action | Impact |
|-------------|--------|--------|
| **Endpoints only** (pod scale up/down) | Lua updates shared memory zone | **No reload** — zero disruption |
| **Structural** (new Ingress, annotation, TLS cert) | Write new `nginx.conf` + `SIGHUP` to master | **Reload** — brief disruption |

**During a reload:**

1. Master parses new config and opens new sockets
2. New worker processes spawned with new config
3. Old workers receive graceful shutdown signal (`SIGQUIT`)
4. Old workers finish in-flight requests, then exit

```
    NGINX RELOAD TIMELINE:
    =======================

    T0: New nginx.conf written
    T1: nginx -t (validate)
    T2: SIGHUP → Master process
    T3: New workers spawned
    T4: Old workers gracefully shutting down
        ┌─────────────────────────────────┐
        │  DISRUPTION WINDOW (T3 → T5)    │
        │                                 │
        │  - New TCP connections may be   │
        │    accepted then reset          │
        │    (reuseport socket issue)     │
        │                                 │
        │  - WebSocket / HTTP/2 streams   │
        │    on old workers are closed    │
        │                                 │
        │  - Load balancer state resets   │
        │    (sticky sessions lost)       │
        │                                 │
        │  Duration: ~100ms to seconds    │
        │  (depends on config size)       │
        └─────────────────────────────────┘
    T5: Old workers exit
    T6: Only new workers serving traffic
```

### Performance

| Metric | Value |
|--------|-------|
| Raw throughput | ~33,000–100,000+ RPS |
| Latency overhead | < 1ms at P99 |
| TLS performance | Excellent (OpenSSL) |
| Memory | Moderate |
| CPU scaling | Near-linear up to ~16 CPUs |

---

## Traefik Ingress Controller

### Overview

| Property | Value |
|----------|-------|
| **Language** | Pure Go |
| **Process Model** | Single Go process (goroutine-per-connection) |
| **Config Model** | In-memory atomic swap (no files, no reload) |
| **Project** | `traefik/traefik` — actively maintained |

### Internal Architecture

```
    +--------------------------------------------------+
    |           TRAEFIK INGRESS CONTROLLER POD          |
    |                                                   |
    |  +---------------------------------------------+ |
    |  |        Single Go Process (Traefik)           | |
    |  |                                              | |
    |  |  STATIC CONFIG (set at startup):             | |
    |  |  +------------------+  +-----------------+   | |
    |  |  | EntryPoints      |  | Providers       |   | |
    |  |  | (ports: 80, 443) |  | (K8s, Docker,   |   | |
    |  |  +------------------+  |  File, Consul)  |   | |
    |  |                        +---------+-------+   | |
    |  |                                  |           | |
    |  |  DYNAMIC CONFIG (hot-swapped):   |           | |
    |  |                                  v           | |
    |  |  +-----------+           +-----------+       | |
    |  |  | K8s Watch |  ──────>  | Routers   |       | |
    |  |  | (Ingress, |           | (rules)   |       | |
    |  |  |  Services,|           +-----+-----+       | |
    |  |  |  Endpoints|                 |             | |
    |  |  |  CRDs)    |           +-----v-----+       | |
    |  |  +-----------+           | Middleware|       | |
    |  |                          | (auth,    |       | |
    |  |                          |  headers) |       | |
    |  |                          +-----+-----+       | |
    |  |                                |             | |
    |  |                          +-----v-----+       | |
    |  |                          | Services  |       | |
    |  |                          | (LB, wt.) |       | |
    |  |                          +-----+-----+       | |
    |  +---------------------------------------------+ |
    |                                   |               |
    |                                   v               |
    |                           +---------------+       |
    |                           | Backend Pods  |       |
    |                           +---------------+       |
    +--------------------------------------------------+
```

### Core Concepts

| Component | Description |
|-----------|-------------|
| **EntryPoints** | Listen ports — the "doors" traffic enters through (`:80`, `:443`) |
| **Providers** | Sources of dynamic config (Kubernetes, Docker, Consul, File) |
| **Routers** | Match requests to services by Host, Path, Headers |
| **Middlewares** | Processing pipeline (auth, rate limit, circuit breaker, headers) |
| **Services** | Load balance across backend Pod IPs |

### Two Configuration Layers

| Layer | Changes at Runtime? | Examples |
|-------|---------------------|----------|
| **Static** | No — requires restart | EntryPoints, providers, logging |
| **Dynamic** | Yes — hot-swapped in memory | Routers, middlewares, services, TLS certs |

### How Config Update Works (The Key Differentiator)

```
    TRAEFIK CONFIG UPDATE:
    =======================

    T0: K8s API watch event (new Ingress, pod scale, etc.)
    T1: Provider generates new routing config in memory
    T2: Atomic swap of internal routing table
        ┌─────────────────────────────────┐
        │  NO DISRUPTION                  │
        │                                 │
        │  - No process restart           │
        │  - No new workers spawned       │
        │  - Existing connections continue │
        │  - New requests use new routes  │
        │  - LB state preserved           │
        │  - WebSockets unaffected        │
        │                                 │
        │  Duration: microseconds         │
        └─────────────────────────────────┘
    T3: Done. All traffic uses new config.
```

**Why this works:** Traefik's routing is entirely in Go data structures. Updating routes is just swapping Go maps/slices with proper mutex synchronization. No external process to reload, no config file to write.

### Traffic Processing Pipeline

```
Request → EntryPoint → TLS Termination → Router Rule Matching
       → Middleware Chain → Service (Load Balancer) → Backend Pod
```

### Performance

| Metric | Value |
|--------|-------|
| Raw throughput | ~28,000–85,000 RPS |
| Latency overhead | ~3ms higher than Nginx on average |
| TLS performance | Good (Go crypto/tls) |
| Memory | Higher under load (Go GC overhead) |
| Auto TLS | Built-in Let's Encrypt / ACME |
| Dashboard | Built-in web UI |

---

## HAProxy Ingress Controller

### Overview

| Property | Value |
|----------|-------|
| **Language** | C (HAProxy) + Go (Controller) |
| **Process Model** | Event-driven, multi-threaded |
| **Config Model** | Hitless reload via Runtime API + Data Plane API |
| **Project** | `haproxytech/kubernetes-ingress` |

### Key Features

| Feature | Details |
|---------|---------|
| Performance | Consistently fastest in benchmarks; ~2x throughput of competitors |
| Config Reload | **Hitless reloads** — minimal connection disruption |
| Load Balancing | Most comprehensive algorithms (round-robin, leastconn, source, uri, random) |
| Health Checks | Advanced active health checks |
| Observability | Real-time stats page + Prometheus metrics |
| TCP Support | Best-in-class TCP load balancing |

### When to Choose HAProxy

- Maximum raw throughput is the top priority
- Advanced TCP load balancing needs
- Enterprise environments with complex traffic management
- You need hitless reloads with better connection preservation than Nginx

---

## Transparency Mode vs Blocking Mode — The Truth

There is a common claim:

> *"Traefik works in transparency mode while Nginx works in blocking mode."*

**This is imprecise.** Here is the technical reality:

### What This is NOT About

This is **not** about how either proxy handles HTTP traffic during normal operation:

- **Nginx** uses an event-driven, non-blocking I/O model (`epoll`/`kqueue`). A single worker handles thousands of connections concurrently. **Nginx is NOT blocking when proxying requests.**
- **Traefik** uses Go's goroutine-based concurrency with non-blocking I/O. **It is also NOT "transparent" in the network sense.**

Both are fully non-blocking, asynchronous reverse proxies during normal traffic handling.

### What This IS Actually About: Config Reload Behavior

The real distinction is **how each system applies configuration changes**:

| Aspect | Nginx (Reload-Based) | Traefik (Dynamic / Hot-Swap) |
|--------|----------------------|------------------------------|
| **What happens on config change** | Writes new `nginx.conf`, sends `SIGHUP`, spawns new workers, old workers gracefully terminate | Atomically swaps in-memory routing table |
| **Process impact** | New workers created, old workers shut down | Same process continues unchanged |
| **Connection impact** | Brief disruption: new connections may reset, WebSockets drop, LB state resets | Zero disruption: all connections continue |
| **Duration** | ~100ms to several seconds (depends on config size) | Microseconds |
| **When it happens** | Every structural change (new Ingress, annotation, TLS cert) | Never — dynamic config is swapped in-memory |
| **Endpoint-only changes** | Lua-based dynamic update (no reload) | Native in-memory update (no reload) |

### Visual Comparison

```
    NGINX (Reload-Based):
    =====================

    Config Change ──> Write file ──> SIGHUP ──> New Workers ──> Old Workers Die
                                                    |
                                        ┌───────────┴───────────┐
                                        │  BRIEF DISRUPTION     │
                                        │  - Connection resets  │
                                        │  - WebSocket drops    │
                                        │  - LB state lost      │
                                        └───────────────────────┘


    TRAEFIK (Dynamic / Hot-Swap):
    =============================

    Config Change ──> In-memory swap ──> Done
                            |
                ┌───────────┴───────────┐
                │  ZERO DISRUPTION      │
                │  - All connections    │
                │    continue normally  │
                └───────────────────────┘
```

### The Correct Terminology

| Term | Applies To | Meaning |
|------|-----------|---------|
| **Reload-based** | Nginx | Structural config changes require process-level reload |
| **Dynamic / Hot-swap** | Traefik | Config changes are applied in-memory without any reload |
| **Hitless reload** | HAProxy | Process-level reload but engineered to minimize connection drops |

**"Transparency mode" and "blocking mode" are not official technical terms.** The accurate description is that Nginx uses a **reload-based** model (briefly disruptive for structural changes), while Traefik uses a **dynamic hot-swap** model (non-disruptive).

---

## Side-by-Side Comparison

| Feature | Nginx | Traefik | HAProxy |
|---------|-------|---------|---------|
| **Language** | C + Go + Lua | Go | C + Go |
| **Raw Throughput** | Very High | Good | Highest |
| **Latency** | Lowest | ~3ms higher | Very Low |
| **Config Reload** | Disruptive (SIGHUP) | Non-disruptive (in-memory) | Mostly non-disruptive (hitless) |
| **Endpoint Updates** | Lua (no reload) | Native (no reload) | Runtime API (no reload) |
| **TLS Performance** | Best (OpenSSL) | Good (Go crypto) | Very Good (OpenSSL) |
| **Auto Let's Encrypt** | Via cert-manager | Built-in | Via cert-manager |
| **Dashboard** | External tools | Built-in | Built-in stats page |
| **WebSocket Support** | Yes (dropped on reload) | Yes (preserved on update) | Yes |
| **Gateway API** | Supported | Native | Supported |
| **Multi-Provider** | Kubernetes only | K8s + Docker + Consul + File | Kubernetes only |
| **Learning Curve** | Medium | Low | Medium-High |
| **Community** | Largest | Large | Medium |
| **Status (2026)** | Community retiring Mar 2026; F5 variant continues | Actively maintained | Actively maintained |

---

## When to Use Which

### Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| High-traffic API gateway (100K+ RPS) | **Nginx** or **HAProxy** |
| Microservices with frequent deployments | **Traefik** |
| WebSocket / long-lived connections | **Traefik** |
| Legacy migration with complex Nginx configs | **Nginx** (F5 variant) |
| Small team, wants simplicity | **Traefik** |
| Need automatic Let's Encrypt | **Traefik** |
| Multi-provider routing (K8s + Docker + Consul) | **Traefik** |
| Maximum raw performance, infrequent changes | **HAProxy** |
| Starting a new K8s project in 2026 | **Traefik** (given ingress-nginx retirement) |
| Enterprise with complex TCP load balancing | **HAProxy** |

### Choose Nginx When:

- High raw throughput is critical (15–36% more RPS than Traefik)
- TLS-intensive workloads (OpenSSL > Go crypto)
- Team has deep Nginx expertise
- Configuration changes are infrequent (reload penalty is negligible)
- Using F5 NGINX Inc variant (actively maintained)

### Choose Traefik When:

- Frequent config changes (zero-downtime updates are essential)
- Dynamic microservices environments with auto-discovery
- Need automatic TLS via built-in Let's Encrypt
- WebSocket / HTTP/2 long-lived connections must survive config changes
- Want a built-in dashboard and simpler operational model

### Choose HAProxy When:

- Maximum performance is the top priority (~2x throughput in benchmarks)
- Advanced TCP load balancing is required
- Enterprise environments needing fine-grained traffic control
- Need hitless reloads with better connection preservation than Nginx

---

## This Project's Default

The K8s Provisioner platform defaults to **Nginx** (`DEFAULT_INGRESS=nginx` in `.env`) but supports all three:

```
SUPPORTED_INGRESS_CONTROLLERS=nginx,haproxy,traefik
```

You can select the ingress controller during cluster creation in **Step 2: Component Selection**.

---

## References

- [Kubernetes Ingress Documentation](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Nginx Ingress Controller — How It Works](https://kubernetes.github.io/ingress-nginx/how-it-works/)
- [Traefik Proxy — Concepts](https://doc.traefik.io/traefik/getting-started/concepts/)
- [HAProxy Kubernetes Ingress Controller](https://www.haproxy.com/documentation/kubernetes-ingress/overview/)
- [Nginx vs Traefik vs HAProxy Comparison — vcluster.com](https://www.vcluster.com/blog/nginx-vs-traefik-vs-haproxy-comparing-kubernetes-ingress-controllers)
- [Traefik vs NGINX — cast.ai](https://cast.ai/blog/traefik-vs-nginx/)
