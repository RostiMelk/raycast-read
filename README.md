# Read Aloud

A Raycast extension that reads selected text or your clipboard aloud with [ElevenLabs](https://elevenlabs.io) voices. macOS only.

## Commands

- **Read Selection** reads the selected text in the front app. Run it again to stop.
- **Read Clipboard** reads the text you last copied.
- **Select Voice** browses and previews voices. `↵` picks one, `⌘↵` plays a preview.
- **Stop Reading** stops the audio.

Audio starts after the first sentence, and the rest is generated while it plays.

## Install

```sh
pnpm install
pnpm dev
```

Then search for "Read Aloud" in Raycast. It asks for an ElevenLabs API key the first time. Create one in ElevenLabs under Developers > API Keys. You can also pick a model and playback speed in the extension settings.

Every character you read uses ElevenLabs credits.

## Develop

```sh
pnpm lint
pnpm typecheck
pnpm test
```

## License

MIT
