# Security Policy

## Supported versions

PlanetLogin is pre-1.0. Security fixes land on the latest `0.x` release.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

- Email **security@planetlogin.org**, or
- Use GitHub's [private vulnerability reporting](https://github.com/planetlogin/planetlogin/security/advisories/new).

Include a description, reproduction steps, and the impact you foresee. We aim to
acknowledge within 72 hours and to ship a fix or mitigation as fast as is
responsible, crediting you unless you prefer to stay anonymous.

## Scope notes

PlanetLogin is a **client-side component**. It does not authenticate users or
store credentials — it detects locale (timezone, language, country) from a map
pick. It makes network requests to third-party geocoding services
(Open-Meteo, OSM Nominatim) and a CDN for country borders (world-atlas via
jsDelivr). Treat those as untrusted external inputs in your threat model; you can
override the data source with the `dataUrl` option and proxy geocoding yourself if
your policy requires it.
