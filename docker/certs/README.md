Place optional extra proxy or registry CA certificates here as `.crt` or `.pem`
files when your container runtime needs a specific trusted root that cannot be
bootstrapped automatically from the configured proxy.

These files are intentionally ignored by git. The Docker build copies them into
the image trust store before `npm ci` runs.
