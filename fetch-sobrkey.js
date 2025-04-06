import * as nostrPool from 'nostr-tools/pool';

const pool = new nostrPool.SimplePool();
const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
];

async function fetchSobrkeyNotes() {
  try {
    const sub = pool.subscribeMany(
      relays,
      [
        {
          kinds: [1],
          '#t': ['sobrkey'],
          limit: 20
        }
      ],
      {
        onevent(event) {
          console.log(`🔹 ${event.id} from ${event.pubkey}`);
          console.log(`📝 ${event.content.slice(0, 100)}...\n`);
        },
        oneose() {
          console.log('✅ All notes received.');
          sub.close(); // close the subscription when done
          pool.close(relays);
        }
      }
    );
  } catch (err) {
    console.error('❌ Error fetching notes:', err);
  }
}

fetchSobrkeyNotes();
