# VideoGen Chat — JSON2Video + Cloudflare Workers

A simple browser chatbot that turns a text prompt into a rendered video through JSON2Video.

## Deployment

This project is designed to run on Cloudflare Workers. The JSON2Video API key must be stored as a Cloudflare Worker secret named `JSON2VIDEO_API_KEY` and must never be committed to GitHub.

The Worker serves the chat UI and provides `/api/generate` and `/api/status` endpoints.

Cloudflare can also connect this repository to Workers Builds so pushes to `main` automatically deploy updates.
