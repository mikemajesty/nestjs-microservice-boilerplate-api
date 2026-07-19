# Certificates

This directory contains the default certificate setup used by the internal Gateway PoC.

The Gateway is intentionally decoupled from the certificate issuer implementation. It only expects the final TLS Secret to exist:

- Namespace: `envoy-gateway-system`
- Secret: `internal-gateway-tls`

By default, this repository creates that Secret with cert-manager using an internal CA bootstrapped in the cluster:

1. `self-signed-cluster-issuer.yaml` creates the self-signed bootstrap issuer.
2. `internal-root-ca-certificate.yaml` creates the internal root CA certificate and Secret.
3. `internal-ca-cluster-issuer.yaml` exposes that root CA as a reusable `ClusterIssuer`.
4. `internal-gateway-certificate.yaml` issues the Gateway TLS certificate into `internal-gateway-tls`.

If your company already has an internal CA, keep the Gateway contract stable and change the issuer used by `internal-gateway-certificate.yaml`.

For example, point `issuerRef` to your existing `ClusterIssuer`:

```yaml
issuerRef:
  name: company-internal-ca
  kind: ClusterIssuer
```

Or use a namespace-scoped `Issuer` if it exists in the same namespace as the `Certificate` (`envoy-gateway-system`):

```yaml
issuerRef:
  name: company-internal-ca
  kind: Issuer
```

You usually do not need to change the Gateway manifest as long as the final Secret remains `internal-gateway-tls`.
