import asyncio
import time
from datetime import datetime, timezone


class APIRateLimiter:
    """Sliding Window Rate Limiter.
    
    Throttles tasks to max_calls per period (seconds) globally per process.
    Releases the lock during sleep to prevent blocking other requests.
    
    NOTE: This is process-local. A Redis-backed token bucket rate limiter
    is required if running with multiple Uvicorn worker instances.
    """
    def __init__(self, max_calls: int = 10, period: float = 60.0):
        self.max_calls = max_calls
        self.period = period
        self.timestamps = []
        self.lock = asyncio.Lock()

    async def acquire(self):
        while True:
            async with self.lock:
                now = time.time()
                # Clean up timestamps outside the window
                self.timestamps = [t for t in self.timestamps if now - t < self.period]
                if len(self.timestamps) < self.max_calls:
                    self.timestamps.append(now)
                    return
                # Calculate sleep duration based on the oldest window item
                wait_time = self.period - (now - self.timestamps[0])
            
            # Sleep outside the lock so other concurrent tasks can check the lock/wait
            if wait_time > 0:
                await asyncio.sleep(wait_time)


class DailyRequestCounter:
    """Daily attempt tracker to prevent quota exhaustion.
    
    Resets at UTC midnight, matching Google AI Studio daily quota reset.
    Tracks all attempts optimistically (optimistic accounting).
    
    NOTE: This is process-local. A Redis-backed key counter
    is required if running with multiple Uvicorn worker instances.
    """
    def __init__(self, max_daily: int = 1400):
        self.max_daily = max_daily
        self.call_count = 0
        self.last_reset_date = datetime.now(timezone.utc).date()
        self.lock = asyncio.Lock()

    async def increment_and_check(self) -> bool:
        async with self.lock:
            now_utc = datetime.now(timezone.utc).date()
            if now_utc != self.last_reset_date:  # Reset at UTC midnight
                self.call_count = 0
                self.last_reset_date = now_utc
            if self.call_count >= self.max_daily:
                return False
            self.call_count += 1
            return True


# Global instances per worker process
api_rate_limiter = APIRateLimiter(max_calls=10, period=60.0)
daily_request_counter = DailyRequestCounter(max_daily=1400)
