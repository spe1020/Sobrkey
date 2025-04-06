# Sobrkey - Privacy-Focused Recovery Support

A privacy-centric mobile and web application supporting individuals in alcohol recovery through secure, compassionate communication technologies, emphasizing user empowerment and digital well-being.

## Project Overview

Sobrkey uses the Nostr protocol for decentralized communications, providing users with privacy-focused tools for:

- Tracking sobriety progress
- Private journaling
- Community discussions
- Finding meetings
- Emergency support resources
- AI-powered supportive conversations

## Debugging WebSocket Connectivity

If you're having issues with the Nostr connectivity in the Replit environment, we've provided several tools to help diagnose and resolve these problems:

### In-App Debug Panel

The community page includes a Debug Panel with tools to:
- Test different tag variations
- Fetch all notes without tag filtering
- Debug relay connections

To access it, click the "Debug Panel" button on the community page.

### Local Test Tool

For more comprehensive testing outside of Replit, we've included a standalone HTML file:

1. Download the `nostr-local-test.html` file
2. Open it in your browser locally
3. Use it to test Nostr connectivity, publish notes, and verify relay connections

This tool will help identify if the issues are specific to the Replit environment or more general Nostr connectivity problems.

## Technical Architecture

- Frontend: React Native (for mobile) and React (for web)
- Backend: Express.js server
- Communication: Nostr protocol for decentralized messaging
- Storage: Encrypted data using Nostr events
- AI Support: Anthropic Claude for therapeutic chatbot functionality

## Key Features

1. **Privacy-First Design**: All user data is encrypted and stored in a way that only the user can access
2. **Journal**: Private, encrypted notes that can only be decrypted by the user
3. **Community**: Anonymous support through Nostr-based discussions with #sobrkey tag
4. **AI Support**: "Mira" - A compassionate AI chatbot for therapeutic conversations
5. **Resources**: Curated collection of recovery meetings and support resources

## Troubleshooting Known Issues

### Nostr Tag Retrieval Issues

- The app is optimized to work with relay.damus.io and nos.lol relays
- Tag format affects retrieval: we support both "t" and "#t" formats
- WebSocket connectivity may be limited in the Replit environment
- Our Debug Panel helps identify specific connectivity issues

## Contributing

To contribute to Sobrkey:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request with a clear description of the improvements

## Privacy Policy

Sobrkey is committed to user privacy:
- We don't collect or store personal data
- All journal entries are encrypted with user's own keys
- Community posts are public but pseudonymous through Nostr
- No tracking or analytics that could identify individuals
