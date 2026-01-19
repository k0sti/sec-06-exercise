import { RelayPool, onlyEvents } from "applesauce-relay";
import { getProfileContent } from "applesauce-core/helpers";

const MAX_ADDRESSES = 21;
const RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
];

const foundAddresses = new Set<string>();
let subscription: { unsubscribe: () => void } | null = null;

function updateStatus(text: string) {
  const status = document.getElementById("status");
  if (status) status.textContent = text;
}

function addOutput(text: string) {
  const output = document.getElementById("output");
  if (output) {
    const line = document.createElement("div");
    line.textContent = text;
    output.appendChild(line);
  }
}

function start() {
  const pool = new RelayPool();
  updateStatus(`Subscribing to ${RELAYS.length} relays...`);

  subscription = pool
    .subscription(RELAYS, { kinds: [0], limit: 500 })
    .pipe(onlyEvents())
    .subscribe({
      next: (event) => {
        if (foundAddresses.size >= MAX_ADDRESSES) {
          subscription?.unsubscribe();
          updateStatus(`Done! Found ${MAX_ADDRESSES} LUD16 addresses.`);
          return;
        }

        const profile = getProfileContent(event);
        if (profile?.lud16 && !foundAddresses.has(profile.lud16)) {
          foundAddresses.add(profile.lud16);
          addOutput(`Found: ${profile.lud16}`);
          updateStatus(`Found ${foundAddresses.size}/${MAX_ADDRESSES} addresses...`);

          if (foundAddresses.size >= MAX_ADDRESSES) {
            subscription?.unsubscribe();
            updateStatus(`Done! Found ${MAX_ADDRESSES} LUD16 addresses.`);
          }
        }
      },
      error: (err) => {
        updateStatus(`Error: ${err.message}`);
      },
    });
}

start();
