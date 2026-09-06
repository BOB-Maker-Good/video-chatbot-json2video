# 🎬 VideoGen Chat — JSON2Video

A local chatbot interface for creating videos with JSON2Video.

## Setup

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Put your JSON2Video API key into `.env` as `JSON2VIDEO_API_KEY=...`.
4. Run `npm install`.
5. Run `npm start`.
6. Open http://localhost:3000

**Never commit `.env` or your API key to GitHub.**

The server keeps the API key private and calls JSON2Video from the backend. It submits a Movie JSON, polls the asynchronous render, and returns the finished video URL to the browser.
