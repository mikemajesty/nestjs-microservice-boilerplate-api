# Metrics Interceptor

Interceptor that collects **HTTP request metrics** for every endpoint. Sends data to **Prometheus** for storage and **Grafana** for visualization.

## Metrics Collected

| Metric | Type | Description |
|--------|------|-------------|
| `http_server_requests_count` | Counter | Total number of HTTP requests |
| `http_server_requests_duration` | Histogram | Request duration in milliseconds |

## Labels (Dimensions)

Each metric includes these labels for filtering:

| Label | Example | Use Case |
|-------|---------|----------|
| `http.method` | `GET`, `POST` | Filter by HTTP verb |
| `http.url` | `/api/users/123` | Full URL path |
| `http.route` | `/api/users/:id` | Route pattern (for grouping) |
| `http.status_code` | `200`, `404`, `500` | Exact status code |
| `http.status_class` | `2xx`, `4xx`, `5xx` | Status family |

## Prometheus Queries

### Request Rate

```promql
# Requests per second
rate(http_server_requests_count[1m])

# Requests per second by endpoint
sum(rate(http_server_requests_count[1m])) by (http.route)

# Requests per second by status class
sum(rate(http_server_requests_count[1m])) by (http.status_class)
```

### Error Rate

```promql
# Error rate (5xx responses)
sum(rate(http_server_requests_count{http.status_class="5xx"}[5m]))
/ sum(rate(http_server_requests_count[5m])) * 100

# 404 rate
sum(rate(http_server_requests_count{http.status_code="404"}[5m]))
```

### Latency

```promql
# Average latency
rate(http_server_requests_duration_sum[5m])
/ rate(http_server_requests_duration_count[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_server_requests_duration_bucket[5m]))

# 99th percentile by endpoint
histogram_quantile(0.99, sum(rate(http_server_requests_duration_bucket[5m])) by (le, http.route))
```

## Why These Metrics Matter

| Metric | Insight |
|--------|---------|
| **Request Count** | Traffic volume, usage patterns |
| **Error Rate** | Application health, failure detection |
| **Latency (p50)** | Typical user experience |
| **Latency (p95)** | Slowest 5% of requests |
| **Latency (p99)** | Worst case performance |

## Grafana Dashboard Ideas

- **Traffic Overview** - Requests/sec over time
- **Error Rate** - 4xx and 5xx trends
- **Latency Distribution** - p50, p95, p99 lines
- **Slowest Endpoints** - Top 10 by latency
- **Most Used Endpoints** - Top 10 by request count

## Summary

| Feature | Description |
|---------|-------------|
| **Counter** | `http_server_requests_count` - total requests |
| **Histogram** | `http_server_requests_duration` - latency distribution |
| **Labels** | method, url, route, status_code, status_class |
| **Destination** | Prometheus → Grafana |

**Metrics Interceptor** - *Automatic HTTP metrics for observability dashboards.*
