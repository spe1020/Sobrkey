# Nostr API Update Documentation

## Problem

The Sobrkey application was experiencing issues with fetching Nostr notes using the `#sobrkey` tag. The error message in the console was:

```
TypeError: pool.list is not a function
```

## Root Cause

The application was using the nostr-tools library version 2.x, but was still calling the `pool.list()` method that has been removed in version 2 of the library. In nostr-tools version 1.x, you could fetch events using the `SimplePool.list()` method, but in version 2.x, this has been replaced with a different approach using `SimplePool.subscribeMany()`.

## Solution

We updated the code to use the modern API for nostr-tools version 2:

1. **Replace `list()` with `subscribeMany()`**: Instead of using the deprecated `list()` method, we now use the `subscribeMany()` method, which takes callbacks for handling events.

2. **Event-Driven Approach**: The new API is more event-driven, using `onEvent` and `onEose` (End of Stored Events) callbacks instead of returning an array of events.

3. **Subscription Management**: We now properly close subscriptions using `sub.close()` instead of `sub.unsub()`.

## Code Changes

Here's an example of how we updated the code:

### Old Version (using `list()` - deprecated):

```javascript
notes = await nostrPool.list(relayUrls, [filter]);
```

### New Version (using `subscribeMany()` - current):

```javascript
notes = await new Promise((resolve) => {
  const collectedNotes = [];
  
  const sub = nostrPool.subscribeMany(
    relayUrls,
    [filter],
    {
      onEvent: (event) => {
        collectedNotes.push(event);
      },
      onEose: () => {
        resolve(collectedNotes);
        sub.close();
      }
    }
  );
  
  // Set a timeout as fallback
  setTimeout(() => {
    resolve(collectedNotes);
    sub.close();
  }, 10000);
});
```

## Additional Improvements

1. Enhanced error handling
2. Added timeouts to prevent hanging promises
3. Implemented a fallback strategy when the modern API fails
4. Added detailed logging to aid future debugging

## References

- [nostr-tools GitHub Repository](https://github.com/nbd-wtf/nostr-tools)
- [SimplePool API Documentation](https://github.com/nbd-wtf/nostr-tools/blob/master/README.md#simplepool)
