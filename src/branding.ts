// Fork-owned product branding, and the only place the product name is spelled.
//
// Zolven Intelligence is a branded OpenClaw distribution. The package identity,
// workspace dep name, CLI entrypoint, and every wire value (User-Agent,
// MM-API-Source, X-BILLING-INVOKE-ORIGIN, MCP client_name) stay `openclaw`:
// renaming those breaks packaging, workspace resolution, self-update, and
// provider attribution. Only text a human reads is branded, and it routes here
// so the next rebrand is a one-line change rather than a repo-wide sweep.
//
// Do not use this for persisted transcript markers such as
// HEARTBEAT_TRANSCRIPT_PROMPT: those are matched against already-stored rows,
// so rebranding them silently breaks filtering of existing history.
export const PRODUCT_NAME = "Zolven Intelligence";
