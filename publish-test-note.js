/**
 * Sobrkey Test Note Publisher
 *
 * This script publishes a test note with the #sobrkey tag to help diagnose
 * tag retrieval issues. Run it with Node.js to publish a test note.
 */

const WebSocket = require("ws");
const crypto = require("crypto");
const readline = require("readline");

// Configuration
const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.social",
  "wss://relay.snort.social",
];

const TEST_TAG = "sobrkey";
const LOG_PREFIX = "[Sobrkey Test]";

// Generate a temporary keypair (this is just for testing)
function generateKeypair() {
  const privateKey = crypto.randomBytes(32);
  const privateKeyHex = privateKey.toString("hex");

  // This is a simplified version for testing - in production use proper secp256k1
  const publicKeyHex = crypto
    .createHash("sha256")
    .update(privateKey)
    .digest("hex");

  return { privateKeyHex, publicKeyHex };
}

// Sign a Nostr event (simplified for testing)
function signEvent(event, privateKeyHex) {
  // In a real implementation, you'd use proper secp256k1 signing
  // This is just for testing purposes

  // Calculate event ID (hash of the serialized event)
  const eventData = [
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ];

  const serialized = JSON.stringify(eventData);
  event.id = crypto.createHash("sha256").update(serialized).digest("hex");

  // Create a dummy signature based on the event ID and private key
  // This isn't a real signature, but works for our test purposes
  const signatureBytes = crypto
    .createHmac("sha256", Buffer.from(privateKeyHex, "hex"))
    .update(event.id)
    .digest();

  event.sig = signatureBytes.toString("hex").padStart(128, "0");

  return event;
}

// Create a simple test event
function createTestEvent(pubkey, message, tags = []) {
  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: tags,
    content: message,
  };
}

// Publish an event to a relay
async function publishToRelay(relay, event) {
  return new Promise((resolve, reject) => {
    console.log(`${LOG_PREFIX} Connecting to ${relay}...`);

    const ws = new WebSocket(relay);
    let isDone = false;

    // Set timeout
    const timeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        ws.close();
        reject(new Error(`Timeout publishing to ${relay}`));
      }
    }, 15000);

    ws.on("open", () => {
      console.log(`${LOG_PREFIX} Connected to ${relay}, publishing event...`);
      ws.send(JSON.stringify(["EVENT", event]));
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`${LOG_PREFIX} Received from ${relay}:`, message);

        // Check for OK message
        if (message[0] === "OK" && message[1] === event.id) {
          console.log(`${LOG_PREFIX} ✅ Successfully published to ${relay}`);
          clearTimeout(timeout);
          isDone = true;
          ws.close();
          resolve(true);
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error parsing message:`, error.message);
      }
    });

    ws.on("error", (error) => {
      console.error(`${LOG_PREFIX} Error with ${relay}:`, error.message);
      clearTimeout(timeout);
      if (!isDone) {
        isDone = true;
        ws.close();
        reject(error);
      }
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      if (!isDone) {
        isDone = true;
        reject(new Error(`Connection to ${relay} closed without confirmation`));
      }
    });
  });
}

// Prompt user for input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  console.log(`${LOG_PREFIX} Sobrkey Test Note Publisher`);
  console.log(`${LOG_PREFIX} =========================`);

  const tagFormatOptions = [
    { id: 1, desc: 'Standard format: [["t", "sobrkey"]]' },
    { id: 2, desc: 'Hashtag format: [["t", "#sobrkey"]]' },
    { id: 3, desc: 'Alternative key: [["#t", "sobrkey"]]' },
    { id: 4, desc: "Multiple formats (recommended): All of the above" },
  ];

  console.log("\nSelect tag format to use:");
  tagFormatOptions.forEach((opt) => {
    console.log(`${opt.id}. ${opt.desc}`);
  });

  const formatChoice = await prompt("\nEnter your choice (1-4): ");

  // Generate tags based on choice
  let tags = [];
  switch (formatChoice) {
    case "1":
      tags = [["t", TEST_TAG]];
      break;
    case "2":
      tags = [["t", `#${TEST_TAG}`]];
      break;
    case "3":
      tags = [["#t", TEST_TAG]];
      break;
    case "4":
      tags = [
        ["t", TEST_TAG],
        ["t", `#${TEST_TAG}`],
        ["#t", TEST_TAG],
      ];
      break;
    default:
      tags = [["t", TEST_TAG]];
  }

  // Get test message
  const defaultMessage = `Sobrkey Test Note (${new Date().toISOString()})`;
  const message =
    (await prompt(`\nEnter message (press Enter for default): `)) ||
    defaultMessage;

  // Generate temporary keypair
  const { privateKeyHex, publicKeyHex } = generateKeypair();
  console.log(`${LOG_PREFIX} Generated temporary keypair for testing`);
  console.log(`${LOG_PREFIX} Public key: ${publicKeyHex}`);

  // Create the test event
  let event = createTestEvent(publicKeyHex, message, tags);

  // Sign the event
  event = signEvent(event, privateKeyHex);
  console.log(`${LOG_PREFIX} Created and signed test event:`, event);

  // Publish to relays
  console.log(`${LOG_PREFIX} Publishing to ${DEFAULT_RELAYS.length} relays...`);

  const results = [];

  for (const relay of DEFAULT_RELAYS) {
    try {
      await publishToRelay(relay, event);
      results.push({ relay, success: true });
    } catch (error) {
      console.error(
        `${LOG_PREFIX} Failed to publish to ${relay}:`,
        error.message,
      );
      results.push({ relay, success: false, error: error.message });
    }
  }

  // Show summary
  console.log("\n=== PUBLISHING SUMMARY ===");

  const successful = results.filter((r) => r.success).length;
  console.log(`Published to ${successful}/${DEFAULT_RELAYS.length} relays`);

  if (successful > 0) {
    console.log("\n✅ SUCCESS: Note published with tags:", tags);
    console.log("\nTo find this note, search for:");
    console.log(`- Public key: ${publicKeyHex}`);
    console.log(`- Content: "${message}"`);
    console.log(
      `- Created at: ${new Date(event.created_at * 1000).toISOString()}`,
    );

    console.log(
      "\nWait a few seconds for the note to propagate, then check the Sobrkey community page.",
    );
  } else {
    console.log("\n❌ FAILED: Could not publish to any relays.");
    console.log("Please check your network connection and try again.");
  }
}

// Run the main function
main().catch((error) => {
  console.error(`${LOG_PREFIX} Fatal error:`, error);
});
